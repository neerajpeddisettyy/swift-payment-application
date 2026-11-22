/** Validates and executes wallet-to-wallet transfers atomically. */
package com.swift.service;

import com.swift.dto.TransferRequest;
import com.swift.dto.TransferResponse;
import com.swift.entity.Transaction;
import com.swift.entity.TxStatus;
import com.swift.entity.User;
import com.swift.entity.Wallet;
import com.swift.event.TransferCompletedEvent;
import com.swift.exception.ApiException;
import com.swift.repository.TransactionRepository;
import com.swift.repository.UserRepository;
import com.swift.repository.WalletRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The heart of Swift: moves money safely between two wallets.
 *
 * Safety rules:
 *  - ONE database transaction: either everything happens or nothing does.
 *  - Both wallets are locked with SELECT ... FOR UPDATE.
 *  - Locks are ALWAYS taken in ascending wallet-id order, so two opposite transfers
 *    (Alice->Bob and Bob->Alice at the same moment) can never deadlock each other.
 *  - Business rejections (frozen card, limit, low balance) are saved as FAILED rows in the
 *    ledger and returned normally instead of throwing, so the FAILED row is not rolled back.
 */
@Service
@RequiredArgsConstructor
public class TransferService {

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public TransferResponse transfer(Long senderUserId, TransferRequest request) {
        BigDecimal amount = normalizeAmount(request.amount());
        String receiverHandle = request.receiverHandle().trim().toLowerCase();
        String note = cleanNote(request.note());

        User sender = userRepository.findById(senderUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Sender account not found"));
        User receiver = userRepository.findBySwiftHandle(receiverHandle)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                        "No Swift account exists for " + receiverHandle));
        if (sender.getId().equals(receiver.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot send money to yourself");
        }

        // Step 1: find wallet ids WITHOUT loading the entities (so nothing stale is cached).
        Long senderWalletId = walletRepository.findIdByUserId(sender.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Sender wallet not found"));
        Long receiverWalletId = walletRepository.findIdByUserId(receiver.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Receiver wallet not found"));

        // Step 2: lock in ASCENDING id order -> deadlock-free.
        long firstId = Math.min(senderWalletId, receiverWalletId);
        long secondId = Math.max(senderWalletId, receiverWalletId);
        Wallet first = walletRepository.findByIdWithLock(firstId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Wallet not found"));
        Wallet second = walletRepository.findByIdWithLock(secondId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Wallet not found"));
        Wallet senderWallet = first.getId().equals(senderWalletId) ? first : second;
        Wallet receiverWallet = (senderWallet == first) ? second : first;

        // Step 3: card + balance checks, using the freshly locked (up-to-date) data.
        if (senderWallet.isCardFrozen()) {
            return fail(sender, receiver, amount, note, senderWallet,
                    "Your Swift card is frozen. Unfreeze it to send money.");
        }
        if (amount.compareTo(senderWallet.getTxLimit()) > 0) {
            return fail(sender, receiver, amount, note, senderWallet,
                    "Amount exceeds your transaction limit of " + senderWallet.getCurrencySymbol()
                            + senderWallet.getTxLimit().toPlainString());
        }
        if (senderWallet.getBalance().compareTo(amount) < 0) {
            return fail(sender, receiver, amount, note, senderWallet, "Insufficient balance");
        }

        // Step 4: move the money.
        senderWallet.setBalance(senderWallet.getBalance().subtract(amount));
        receiverWallet.setBalance(receiverWallet.getBalance().add(amount));
        walletRepository.save(senderWallet);
        walletRepository.save(receiverWallet);

        Transaction tx = transactionRepository.save(Transaction.builder()
                .referenceId(UUID.randomUUID().toString())
                .senderHandle(sender.getSwiftHandle())
                .receiverHandle(receiver.getSwiftHandle())
                .amount(amount)
                .note(note)
                .status(TxStatus.SUCCESS)
                .createdAt(Instant.now())
                .build());

        // Delivered to Kafka only AFTER this transaction commits (see TransferEventPublisher).
        eventPublisher.publishEvent(new TransferCompletedEvent(tx.getReferenceId(),
                tx.getSenderHandle(), tx.getReceiverHandle(), tx.getAmount(), tx.getCreatedAt()));

        return toResponse(tx, senderWallet.getBalance(),
                "Sent " + senderWallet.getCurrencySymbol() + amount.toPlainString() + " to " + receiver.getSwiftHandle());
    }

    private TransferResponse fail(User sender, User receiver, BigDecimal amount, String note,
                                  Wallet senderWallet, String reason) {
        Transaction tx = transactionRepository.save(Transaction.builder()
                .referenceId(UUID.randomUUID().toString())
                .senderHandle(sender.getSwiftHandle())
                .receiverHandle(receiver.getSwiftHandle())
                .amount(amount)
                .note(note)
                .status(TxStatus.FAILED)
                .failureReason(reason)
                .createdAt(Instant.now())
                .build());
        return toResponse(tx, senderWallet.getBalance(), reason);
    }

    private TransferResponse toResponse(Transaction tx, BigDecimal senderBalanceAfter, String message) {
        return new TransferResponse(tx.getReferenceId(), tx.getStatus(), tx.getSenderHandle(),
                tx.getReceiverHandle(), tx.getAmount(), senderBalanceAfter, message, tx.getCreatedAt(), false);
    }

    private String cleanNote(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return raw.trim();
    }

    private BigDecimal normalizeAmount(BigDecimal raw) {
        if (raw == null || raw.signum() <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Amount must be greater than zero");
        }
        if (raw.stripTrailingZeros().scale() > 2) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Amount can have at most 2 decimal places");
        }
        return raw.setScale(2);
    }
}
