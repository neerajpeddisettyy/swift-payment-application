/** Provides database queries and locking operations for wallets. */
package com.swift.repository;

import com.swift.entity.Wallet;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WalletRepository extends JpaRepository<Wallet, Long> {

    /**
     * SELECT ... FOR UPDATE. Any other transaction trying to lock the same wallet
     * waits here until we commit. This is what stops two simultaneous transfers
     * from both reading the same old balance (a "race condition").
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select w from Wallet w where w.id = :id")
    Optional<Wallet> findByIdWithLock(@Param("id") Long id);

    /** Plain (unlocked) lookup, for read-only screens. */
    Optional<Wallet> findByUserId(Long userId);

    /**
     * Returns ONLY the id (no entity). We use it before locking so that the wallet
     * entity is first loaded by the locking query and its state is never stale.
     */
    @Query("select w.id from Wallet w where w.user.id = :userId")
    Optional<Long> findIdByUserId(@Param("userId") Long userId);
}
