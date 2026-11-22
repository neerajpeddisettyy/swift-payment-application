/** Carries the details of a transfer that has committed successfully. */
package com.swift.event;

import java.math.BigDecimal;
import java.time.Instant;

/** Message sent to Kafka after a transfer is safely committed to the database. */
public record TransferCompletedEvent(
        String referenceId,
        String senderHandle,
        String receiverHandle,
        BigDecimal amount,
        Instant completedAt) {
}
