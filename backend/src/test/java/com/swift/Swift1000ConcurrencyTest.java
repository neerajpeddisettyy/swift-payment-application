/** Verifies ledger consistency when many transfers execute concurrently. */
package com.swift;

import static org.assertj.core.api.Assertions.assertThat;

import com.swift.dto.TransferRequest;
import com.swift.dto.TransferResponse;
import com.swift.entity.TxStatus;
import com.swift.entity.User;
import com.swift.entity.Wallet;
import com.swift.repository.TransactionRepository;
import com.swift.repository.UserRepository;
import com.swift.repository.WalletRepository;
import com.swift.service.IdempotencyService;
import com.swift.service.TransferService;
import java.math.BigDecimal;
import java.util.Queue;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * PROOF TEST: 1,000 threads hammer Alice <-> Bob at the same instant.
 *
 * PREREQUISITE: `docker compose up -d` must be running (this test uses the real
 * PostgreSQL, Redis and Kafka, exactly like production would).
 *
 * The 1,000 requests are really 800 unique payments + 200 DUPLICATES (same
 * Idempotency-Key sent twice, at the same moment). We then assert:
 *   - zero errors, every request answered with SUCCESS
 *   - exactly 800 payments were executed (the 200 duplicates were blocked by Redis)
 *   - Alice's and Bob's final balances match the exact expected numbers
 *   - total money is still exactly Rs 20,000.00  (nothing created, nothing lost)
 */
@SpringBootTest(properties = {
        "spring.datasource.hikari.connection-timeout=180000"
})
class Swift1000ConcurrencyTest {

    private static final int THREADS = 1000;
    private static final int UNIQUE_PAYMENTS = 800; // requests 800..999 repeat the keys of 0..199

    @Autowired TransferService transferService;
    @Autowired IdempotencyService idempotencyService;
    @Autowired UserRepository userRepository;
    @Autowired WalletRepository walletRepository;
    @Autowired TransactionRepository transactionRepository;

    private Long aliceId;
    private Long bobId;

    @BeforeEach
    void resetBalances() {
        aliceId = userRepository.findByEmail("alice@swift").map(User::getId).orElseThrow();
        bobId = userRepository.findByEmail("bob@swift").map(User::getId).orElseThrow();
        resetWallet(aliceId);
        resetWallet(bobId);
    }

    private void resetWallet(Long userId) {
        Wallet wallet = walletRepository.findByUserId(userId).orElseThrow();
        wallet.setBalance(new BigDecimal("10000.00"));
        wallet.setCardFrozen(false);
        wallet.setTxLimit(new BigDecimal("25000.00"));
        walletRepository.save(wallet);
    }

    @Test
    void thousandSimultaneousTransfersConserveMoney() throws Exception {
        String runId = UUID.randomUUID().toString().substring(0, 8); // keeps Redis keys unique per run
        long txCountBefore = transactionRepository.count();

        Queue<TransferResponse> responses = new ConcurrentLinkedQueue<>();
        Queue<Throwable> errors = new ConcurrentLinkedQueue<>();

        ExecutorService pool = Executors.newFixedThreadPool(THREADS);
        CountDownLatch allReady = new CountDownLatch(THREADS);
        CountDownLatch startGun = new CountDownLatch(1);
        CountDownLatch allDone = new CountDownLatch(THREADS);

        for (int i = 0; i < THREADS; i++) {
            final int k = i % UNIQUE_PAYMENTS;          // payment number (duplicates share the same k)
            final boolean aliceSends = (k % 2 == 0);
            final BigDecimal amount = amountFor(k);
            final Long senderId = aliceSends ? aliceId : bobId;
            final String receiverHandle = aliceSends ? "bob@swift" : "alice@swift";
            final String idempotencyKey = runId + "-" + k;

            pool.submit(() -> {
                allReady.countDown();
                try {
                    startGun.await();                    // every thread waits, then all fire together
                    TransferResponse response = idempotencyService.executeOnce(senderId, idempotencyKey,
                            () -> transferService.transfer(senderId, new TransferRequest(receiverHandle, amount, null)));
                    responses.add(response);
                } catch (Throwable t) {
                    errors.add(t);
                } finally {
                    allDone.countDown();
                }
            });
        }

        assertThat(allReady.await(60, TimeUnit.SECONDS)).as("all threads started").isTrue();
        startGun.countDown();
        assertThat(allDone.await(5, TimeUnit.MINUTES)).as("all transfers finished in time").isTrue();
        pool.shutdown();

        // --- expected result, computed independently of the app ---
        BigDecimal expectedAlice = new BigDecimal("10000.00");
        for (int k = 0; k < UNIQUE_PAYMENTS; k++) {
            expectedAlice = (k % 2 == 0)
                    ? expectedAlice.subtract(amountFor(k))   // Alice paid Bob
                    : expectedAlice.add(amountFor(k));       // Bob paid Alice
        }
        BigDecimal expectedBob = new BigDecimal("20000.00").subtract(expectedAlice);

        BigDecimal aliceBalance = walletRepository.findByUserId(aliceId).orElseThrow().getBalance();
        BigDecimal bobBalance = walletRepository.findByUserId(bobId).orElseThrow().getBalance();

        // --- assertions ---
        assertThat(errors).as("zero errors").isEmpty();
        assertThat(responses).as("every request got an answer").hasSize(THREADS);
        assertThat(responses).as("every transfer succeeded").allMatch(r -> r.status() == TxStatus.SUCCESS);

        long replayed = responses.stream().filter(TransferResponse::replayed).count();
        Set<String> distinctRefs = responses.stream().map(TransferResponse::referenceId).collect(Collectors.toSet());
        assertThat(replayed).as("duplicates blocked by Redis").isEqualTo(THREADS - UNIQUE_PAYMENTS);
        assertThat(distinctRefs).as("distinct payments executed").hasSize(UNIQUE_PAYMENTS);
        assertThat(transactionRepository.count() - txCountBefore)
                .as("ledger rows written").isEqualTo(UNIQUE_PAYMENTS);

        assertThat(aliceBalance).as("Alice final balance").isEqualByComparingTo(expectedAlice);
        assertThat(bobBalance).as("Bob final balance").isEqualByComparingTo(expectedBob);
        assertThat(aliceBalance.add(bobBalance)).as("total money conserved")
                .isEqualByComparingTo(new BigDecimal("20000.00"));

        System.out.printf("%nPROOF: %d requests, %d unique payments, %d duplicates blocked, errors=0%n"
                        + "       Alice=%s Bob=%s Total=%s%n",
                THREADS, UNIQUE_PAYMENTS, replayed, aliceBalance, bobBalance, aliceBalance.add(bobBalance));
    }

    /** Deterministic amounts between Rs 10.00 and Rs 70.00 based on the payment number. */
    private static BigDecimal amountFor(int k) {
        return BigDecimal.valueOf(10L * (k % 7 + 1)).setScale(2);
    }
}
