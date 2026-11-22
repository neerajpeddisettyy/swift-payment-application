/** Returns the display identity associated with a payment handle. */
package com.swift.dto;

/** What the app shows to confirm WHO you are about to pay (like UPI's "verified name"). */
public record UserLookupResponse(String fullName, String swiftHandle) {
}
