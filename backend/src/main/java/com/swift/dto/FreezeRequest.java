/** Carries a requested frozen or unfrozen state for a payment card. */
package com.swift.dto;

/** "frozen" = desired state. If the body is omitted, the server simply toggles. */
public record FreezeRequest(Boolean frozen) {
}
