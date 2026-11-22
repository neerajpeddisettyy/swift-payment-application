/** Starts the Swift Spring Boot application. */
package com.swift;

import java.util.TimeZone;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point of the Swift (Global Ledger) backend.
 * Run with:  mvn spring-boot:run
 */
@SpringBootApplication
public class SwiftApplication {

    static {
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
    }

    public static void main(String[] args) {
        SpringApplication.run(SwiftApplication.class, args);
    }
}
