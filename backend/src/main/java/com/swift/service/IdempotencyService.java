/** Prevents duplicate transfer processing when clients retry requests. */
package com.swift.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.swift.dto.TransferResponse;
import com.swift.exception.ApiException;
import java.time.Duration;
import java.util.function.Supplier;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * Double-payment protection (the PayPal/Stripe "Idempotency-Key" idea).
 *
 * Redis key:  swift:idempotency:{userId}:{key}   (24h TTL)
 *
 * How it works:
 *  1. The first request ATOMICALLY claims the key with SET-if-absent ("PROCESSING").
 *  2. It runs the payment, then overwrites the key with the JSON response.
 *  3. Any request with the same key - even one arriving at the very same millisecond -
 *     fails to claim, waits for the stored response and returns it. No second charge.
 *  4. If the payment throws an error, the key is deleted so the client may retry safely.
 */
@Service
@Slf4j
public class IdempotencyService {

    private static final String PROCESSING = "__PROCESSING__";
    private static final Duration CLAIM_TTL = Duration.ofMinutes(5);
    private static final long MAX_WAIT_MS = 4 * 60_000L;

    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;
    private final Duration resultTtl;

    public IdempotencyService(StringRedisTemplate redis,
                              ObjectMapper objectMapper,
                              @Value("${swift.idempotency.ttl-hours}") long ttlHours) {
        this.redis = redis;
        this.objectMapper = objectMapper;
        this.resultTtl = Duration.ofHours(ttlHours);
    }

    public TransferResponse executeOnce(Long userId, String idempotencyKey, Supplier<TransferResponse> action) {
        String redisKey = "swift:idempotency:" + userId + ":" + idempotencyKey;
        long deadline = System.currentTimeMillis() + MAX_WAIT_MS;

        while (true) {
            Boolean claimed = redis.opsForValue().setIfAbsent(redisKey, PROCESSING, CLAIM_TTL);
            if (Boolean.TRUE.equals(claimed)) {
                return runAndStore(redisKey, action);
            }

            String existing = redis.opsForValue().get(redisKey);
            if (existing == null) {
                continue; // the other request failed and removed the key - try to claim it again
            }
            if (!PROCESSING.equals(existing)) {
                log.info("Duplicate request blocked for key {}", redisKey);
                return read(existing).withReplayed(true);
            }
            if (System.currentTimeMillis() > deadline) {
                throw new ApiException(HttpStatus.CONFLICT,
                        "The original request with this Idempotency-Key is still processing. Retry shortly.");
            }
            pause();
        }
    }

    private TransferResponse runAndStore(String redisKey, Supplier<TransferResponse> action) {
        try {
            TransferResponse response = action.get();
            redis.opsForValue().set(redisKey, write(response), resultTtl);
            return response;
        } catch (RuntimeException ex) {
            redis.delete(redisKey);
            throw ex;
        }
    }

    private String write(TransferResponse response) {
        try {
            return objectMapper.writeValueAsString(response);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not store idempotent response", e);
        }
    }

    private TransferResponse read(String json) {
        try {
            return objectMapper.readValue(json, TransferResponse.class);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not read stored idempotent response", e);
        }
    }

    private void pause() {
        try {
            Thread.sleep(20);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Interrupted while waiting");
        }
    }
}
