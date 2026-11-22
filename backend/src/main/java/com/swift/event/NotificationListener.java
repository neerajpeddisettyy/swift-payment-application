/** Consumes completed-transfer events for downstream receipt notifications. */
package com.swift.event;

import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/** Consumes receipts from Kafka. In a real app this would send a push notification or SMS. */
@Component
@Slf4j
public class NotificationListener {

    @KafkaListener(topics = "${swift.kafka.notification-topic}")
    public void onTransferCompleted(TransferCompletedEvent event) {
        log.info("[swift-notifications] RECEIPT {} | {} -> {} | ₹{} | {}",
                event.referenceId(), event.senderHandle(), event.receiverHandle(),
                event.amount(), event.completedAt());
    }
}
