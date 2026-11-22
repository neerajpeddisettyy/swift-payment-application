/** Publishes transfer completion events for asynchronous processing. */
package com.swift.event;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Sends the event to Kafka ONLY AFTER the database transaction has committed.
 * Why? If we sent it earlier and the DB then rolled back, we would announce a payment
 * that never happened. A Kafka hiccup must also never undo a committed payment,
 * so failures are only logged.
 */
@Component
@Slf4j
public class TransferEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final String topic;

    public TransferEventPublisher(KafkaTemplate<String, Object> kafkaTemplate,
                                  @Value("${swift.kafka.notification-topic}") String topic) {
        this.kafkaTemplate = kafkaTemplate;
        this.topic = topic;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onTransferCompleted(TransferCompletedEvent event) {
        try {
            kafkaTemplate.send(topic, event.referenceId(), event);
        } catch (RuntimeException ex) {
            log.warn("Could not publish receipt {} to Kafka: {}", event.referenceId(), ex.getMessage());
        }
    }
}
