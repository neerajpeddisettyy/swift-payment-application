/** Exposes endpoints for looking up Swift users and payment handles. */
package com.swift.controller;

import com.swift.dto.UserLookupResponse;
import com.swift.exception.ApiException;
import com.swift.repository.UserRepository;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserRepository userRepository;

    /** Resolve "bob" or "bob@swift" to the account holder's name before paying. */
    @GetMapping("/lookup")
    public UserLookupResponse lookup(@RequestParam String handle) {
        String normalized = handle.trim().toLowerCase();
        if (normalized.isEmpty() || normalized.length() > 60) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Enter a valid @swift handle");
        }
        if (!normalized.contains("@")) {
            normalized = normalized + "@swift";
        }
        final String lookupHandle = normalized;
        return userRepository.findBySwiftHandle(lookupHandle)
                .map(u -> new UserLookupResponse(u.getFullName(), u.getSwiftHandle()))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                        "No Swift account found for " + lookupHandle));
    }
}
