/** Carries the authentication result returned after a successful sign-in. */
package com.swift.dto;

public record AuthResponse(
        String token,
        String tokenType,
        long expiresInMs,
        String fullName,
        String email,
        String swiftHandle) {
}
