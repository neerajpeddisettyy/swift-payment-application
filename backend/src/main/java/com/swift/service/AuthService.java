/** Implements account registration and credential-based authentication. */
package com.swift.service;

import com.swift.dto.AuthResponse;
import com.swift.dto.LoginRequest;
import com.swift.dto.RegisterRequest;
import com.swift.entity.Role;
import com.swift.entity.User;
import com.swift.entity.Wallet;
import com.swift.exception.ApiException;
import com.swift.repository.UserRepository;
import com.swift.repository.WalletRepository;
import com.swift.security.JwtService;
import java.math.BigDecimal;
import java.security.SecureRandom;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        String handle = request.handle().trim().toLowerCase() + "@swift";

        if (userRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "That email is already registered");
        }
        if (userRepository.existsBySwiftHandle(handle)) {
            throw new ApiException(HttpStatus.CONFLICT, "The handle " + handle + " is already taken");
        }

        User user = userRepository.save(User.builder()
                .email(email)
                .fullName(request.fullName().trim())
                .swiftHandle(handle)
                .password(passwordEncoder.encode(request.password()))
                .role(Role.USER)
                .build());

        // New accounts start empty (₹0.00). Money only enters via transfers.
        walletRepository.save(Wallet.builder()
                .user(user)
                .balance(new BigDecimal("0.00"))
                .currencySymbol("₹")
                .cardNumber(randomDigits("4000", 12))
                .cvv(randomDigits("", 3))
                .cardFrozen(false)
                .txLimit(new BigDecimal("25000.00"))
                .build());

        return toAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email().trim().toLowerCase())
                .filter(u -> passwordEncoder.matches(request.password(), u.getPassword()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        return toAuthResponse(user);
    }

    private AuthResponse toAuthResponse(User user) {
        return new AuthResponse(jwtService.generateToken(user), "Bearer", jwtService.getExpirationMs(),
                user.getFullName(), user.getEmail(), user.getSwiftHandle());
    }

    private String randomDigits(String prefix, int count) {
        StringBuilder sb = new StringBuilder(prefix);
        for (int i = 0; i < count; i++) {
            sb.append(RANDOM.nextInt(10));
        }
        return sb.toString();
    }
}
