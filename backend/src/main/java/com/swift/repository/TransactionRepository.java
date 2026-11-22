/** Provides database queries for persisted transaction ledger entries. */
package com.swift.repository;

import com.swift.entity.Transaction;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    /**
     * A user's ledger = everything they sent (including failed attempts)
     * + everything they successfully received. Newest first.
     */
    @Query("""
            select t from Transaction t
            where t.senderHandle = :handle
               or (t.receiverHandle = :handle and t.status = com.swift.entity.TxStatus.SUCCESS)
            order by t.createdAt desc, t.id desc
            """)
    List<Transaction> findLedgerFor(@Param("handle") String handle, Pageable pageable);
}
