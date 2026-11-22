/** Represents an application error that should be returned with an HTTP status. */
package com.swift.exception;

import org.springframework.http.HttpStatus;

/** Throw this anywhere to return a clean JSON error with the chosen HTTP status. */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
