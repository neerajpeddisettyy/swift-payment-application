/** Exposes the endpoint for sending money between Swift wallets. */
package com.swift.controller;

import com.swift.dto.TransferRequest;
import com.swift.dto.TransferResponse;
import com.swift.entity.TxStatus;
import com.swift.exception.ApiException;
import com.swift.security.AuthUser;
import com.swift.service.IdempotencyService;
import com.swift.service.TransferService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/transfers")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class TransferController {

    private final TransferService transferService;
    private final IdempotencyService idempotencyService;

    @PostMapping
    @Operation(summary = "Send money to a @swift handle",
            description = "Requires an Idempotency-Key header (any unique string, e.g. a UUID). "
                    + "Sending the same key twice returns the first result and never charges twice. "
                    + "Returns 200 on success, 422 when rejected (frozen card, limit, low balance).")
    public ResponseEntity<TransferResponse> transfer(
            @AuthenticationPrincipal AuthUser user,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody TransferRequest request) {

        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Idempotency-Key header is required");
        }
        String key = idempotencyKey.trim();
        if (key.length() > 128) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Idempotency-Key must be at most 128 characters");
        }

        TransferResponse response = idempotencyService.executeOnce(
                user.id(), key, () -> transferService.transfer(user.id(), request));

        HttpStatus status = response.status() == TxStatus.SUCCESS ? HttpStatus.OK : HttpStatus.UNPROCESSABLE_ENTITY;
        return ResponseEntity.status(status)
                .header("Idempotent-Replayed", String.valueOf(response.replayed()))
                .body(response);
    }
}
