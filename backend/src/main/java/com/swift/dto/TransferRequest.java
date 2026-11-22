/** Carries the recipient and amount for a requested money transfer. */
package com.swift.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record TransferRequest(
        @NotBlank String receiverHandle,
        @NotNull
        @DecimalMin(value = "0.01", message = "must be at least 0.01")
        @Digits(integer = 12, fraction = 2, message = "max 2 decimal places")
        BigDecimal amount,
        @Size(max = 60, message = "must be at most 60 characters") String note) {
}
