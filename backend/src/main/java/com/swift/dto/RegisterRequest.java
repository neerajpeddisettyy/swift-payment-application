/** Carries the account details submitted during user registration. */
package com.swift.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** "handle" is only the part before @swift, e.g. "priya" becomes "priya@swift". */
public record RegisterRequest(
        @NotBlank String fullName,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 3, max = 20)
        @Pattern(regexp = "^[a-zA-Z0-9._]+$", message = "only letters, digits, dot and underscore")
        String handle,
        @NotBlank @Size(min = 8, message = "must be at least 8 characters") String password) {
}
