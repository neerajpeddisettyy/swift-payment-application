/** Exposes endpoints for reading and updating wallet and card settings. */
package com.swift.controller;

import com.swift.dto.FreezeRequest;
import com.swift.dto.LimitRequest;
import com.swift.dto.WalletResponse;
import com.swift.security.AuthUser;
import com.swift.service.WalletService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/wallets")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class WalletController {

    private final WalletService walletService;

    @GetMapping("/me")
    public WalletResponse myWallet(@AuthenticationPrincipal AuthUser user) {
        return walletService.getWallet(user.id());
    }

    /** Body {"frozen": true|false} sets the state; an empty body toggles it. */
    @PatchMapping("/card/freeze")
    public WalletResponse freeze(@AuthenticationPrincipal AuthUser user,
                                 @RequestBody(required = false) FreezeRequest request) {
        Boolean frozen = request == null ? null : request.frozen();
        return walletService.setFrozen(user.id(), frozen);
    }

    @PatchMapping("/card/limit")
    public WalletResponse limit(@AuthenticationPrincipal AuthUser user,
                                @Valid @RequestBody LimitRequest request) {
        return walletService.setLimit(user.id(), request.limit());
    }
}
