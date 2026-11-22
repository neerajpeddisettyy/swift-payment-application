/** Carries the email address and password submitted for sign-in. */
package com.swift.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(@NotBlank String email, @NotBlank String password) {
}
