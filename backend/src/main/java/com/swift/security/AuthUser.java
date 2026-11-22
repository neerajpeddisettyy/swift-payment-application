/** Holds the authenticated user's identity and authorization data. */
package com.swift.security;

/** The logged-in user, rebuilt from the JWT on every request (no DB hit = truly stateless). */
public record AuthUser(Long id, String email, String swiftHandle, String role) {
}
