/** Represents a ledger entry returned to the frontend. */
package com.swift.dto;

import com.swift.entity.Transaction;
import com.swift.entity.TxStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

/**
 * One ledger row as seen by a particular user. "direction" and the counterparty fields
 * are relative to the viewer (the OTHER person in the payment).
 */
public record TransactionResponse(
        Long id,
        String referenceId,
        String senderHandle,
        String receiverHandle,
        BigDecimal amount,
        TxStatus status,
        String failureReason,
        Instant createdAt,
        String direction,
        String counterpartyHandle,
        String counterpartyName,
        String note) {

    public static TransactionResponse from(Transaction t, String viewerHandle, Map<String, String> namesByHandle) {
        boolean sent = t.getSenderHandle().equals(viewerHandle);
        String counterparty = sent ? t.getReceiverHandle() : t.getSenderHandle();
        return new TransactionResponse(t.getId(), t.getReferenceId(), t.getSenderHandle(),
                t.getReceiverHandle(), t.getAmount(), t.getStatus(), t.getFailureReason(),
                t.getCreatedAt(), sent ? "SENT" : "RECEIVED", counterparty,
                namesByHandle.getOrDefault(counterparty, counterparty), t.getNote());
    }
}
