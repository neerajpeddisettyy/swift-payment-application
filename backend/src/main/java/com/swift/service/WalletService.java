/** Reads and updates wallet balances and virtual-card controls. */
package com.swift.service;

import com.swift.dto.WalletResponse;
import com.swift.entity.User;
import com.swift.entity.Wallet;
import com.swift.exception.ApiException;
import com.swift.repository.UserRepository;
import com.swift.repository.WalletRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository walletRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public WalletResponse getWallet(Long userId) {
        Wallet wallet = walletRepository.findByUserId(userId).orElseThrow(this::walletNotFound);
        return WalletResponse.from(loadUser(userId), wallet);
    }

    /** frozen == null means "just toggle". */
    @Transactional
    public WalletResponse setFrozen(Long userId, Boolean frozen) {
        Wallet wallet = lockWallet(userId);
        wallet.setCardFrozen(frozen != null ? frozen : !wallet.isCardFrozen());
        return WalletResponse.from(loadUser(userId), walletRepository.save(wallet));
    }

    @Transactional
    public WalletResponse setLimit(Long userId, BigDecimal limit) {
        Wallet wallet = lockWallet(userId);
        wallet.setTxLimit(limit.setScale(2, RoundingMode.HALF_UP));
        return WalletResponse.from(loadUser(userId), walletRepository.save(wallet));
    }

    /** Locks the row so a card change can never collide with a transfer happening right now. */
    private Wallet lockWallet(Long userId) {
        Long walletId = walletRepository.findIdByUserId(userId).orElseThrow(this::walletNotFound);
        return walletRepository.findByIdWithLock(walletId).orElseThrow(this::walletNotFound);
    }

    private User loadUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Account not found"));
    }

    private ApiException walletNotFound() {
        return new ApiException(HttpStatus.NOT_FOUND, "Wallet not found");
    }
}
