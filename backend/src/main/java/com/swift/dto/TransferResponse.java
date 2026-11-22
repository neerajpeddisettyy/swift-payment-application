/** Represents the result of a completed money transfer. */
package com.swift.dto;

import com.swift.entity.TxStatus;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * "replayed" is true when this exact response was served from Redis because the same
 * Idempotency-Key had already been processed (i.e. a duplicate was blocked).
 */
public record TransferResponse(
        String referenceId,
        TxStatus status,
        String senderHandle,
        String receiverHandle,
        BigDecimal amount,
        BigDecimal senderBalanceAfter,
        String message,
        Instant createdAt,
        boolean replayed) {

    public TransferResponse withReplayed(boolean value) {
        return new TransferResponse(referenceId, status, senderHandle, receiverHandle,
                amount, senderBalanceAfter, message, createdAt, value);
    }
}
