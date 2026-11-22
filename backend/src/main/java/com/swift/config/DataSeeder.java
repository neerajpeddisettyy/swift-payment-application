/** Creates the sample users, wallets, and ledger entries used by the demo. */
package com.swift.config;

import com.swift.entity.Role;
import com.swift.entity.Transaction;
import com.swift.entity.TxStatus;
import com.swift.entity.User;
import com.swift.entity.Wallet;
import com.swift.repository.TransactionRepository;
import com.swift.repository.UserRepository;
import com.swift.repository.WalletRepository;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Runs on every startup. Creates the two demo accounts (and a little payment history so
 * the app looks lived-in) only if they do not exist yet, so restarting never duplicates
 * data or resets balances.
 *
 * The seeded history is balanced (each side sends exactly the same total), so both
 * accounts still start at exactly ₹10,000.00.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    public static final String DEMO_PASSWORD = "password123";

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        boolean aliceCreated = seed("alice@swift", "Alice Sharma", "4000123456784829", "482");
        boolean bobCreated = seed("bob@swift", "Bob Verma", "4000987654327316", "739");
        if (aliceCreated && bobCreated) {
            seedHistory();
        }
        log.info("Demo accounts ready -> alice@swift / bob@swift  (password: {})", DEMO_PASSWORD);
    }

    private boolean seed(String handle, String fullName, String cardNumber, String cvv) {
        if (userRepository.existsByEmail(handle)) {
            return false;
        }
        User user = userRepository.save(User.builder()
                .email(handle)
                .fullName(fullName)
                .swiftHandle(handle)
                .password(passwordEncoder.encode(DEMO_PASSWORD))
                .role(Role.USER)
                .build());

        walletRepository.save(Wallet.builder()
                .user(user)
                .balance(new BigDecimal("10000.00"))
                .currencySymbol("₹")
                .cardNumber(cardNumber)
                .cvv(cvv)
                .cardFrozen(false)
                .txLimit(new BigDecimal("25000.00"))
                .build());
        log.info("Seeded {} with ₹10,000.00", handle);
        return true;
    }

    /** Alice -> Bob: 450 + 1500 + 320 = 2270.   Bob -> Alice: 1200 + 800 + 270 = 2270. Net zero. */
    private void seedHistory() {
        history("bob@swift", "alice@swift", "1200.00", "Dinner split", 120);
        history("alice@swift", "bob@swift", "450.00", "Coffee and snacks", 96);
        history("alice@swift", "bob@swift", "1500.00", "Movie tickets", 70);
        history("bob@swift", "alice@swift", "800.00", "Cab fare", 44);
        history("alice@swift", "bob@swift", "320.00", "Lunch", 20);
        history("bob@swift", "alice@swift", "270.00", "Groceries", 3);
    }

    private void history(String from, String to, String amount, String note, long hoursAgo) {
        transactionRepository.save(Transaction.builder()
                .referenceId(UUID.randomUUID().toString())
                .senderHandle(from)
                .receiverHandle(to)
                .amount(new BigDecimal(amount))
                .note(note)
                .status(TxStatus.SUCCESS)
                .createdAt(Instant.now().minus(Duration.ofHours(hoursAgo)))
                .build());
    }
}
