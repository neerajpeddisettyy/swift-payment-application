/** Exposes endpoints for viewing a user's transaction history. */
package com.swift.controller;

import com.swift.dto.TransactionResponse;
import com.swift.security.AuthUser;
import com.swift.service.LedgerService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class TransactionController {

    private final LedgerService ledgerService;

    @GetMapping
    public List<TransactionResponse> myLedger(@AuthenticationPrincipal AuthUser user,
                                              @RequestParam(defaultValue = "200") int limit) {
        return ledgerService.myLedger(user.swiftHandle(), limit);
    }
}
