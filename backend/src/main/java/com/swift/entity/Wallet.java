/** Persists a user's balance and virtual-card spending controls. */
package com.swift.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One wallet per user. Holds the money AND the virtual debit card controls.
 *
 * DEMO NOTE: real payment systems never store a CVV. We keep it here only so the
 * UI can demo the "reveal CVV" eye-toggle.
 */
@Entity
@Table(name = "wallets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /** Money is ALWAYS BigDecimal - never double/float. */
    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal balance;

    @Builder.Default
    @Column(nullable = false, length = 5)
    private String currencySymbol = "₹";

    @Column(nullable = false, length = 16)
    private String cardNumber;

    @Column(nullable = false, length = 3)
    private String cvv;

    /** FamPay-style instant freeze switch. */
    @Column(nullable = false)
    private boolean cardFrozen;

    /** FamPay-style per-transaction spending limit. */
    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal txLimit;

    /** Optimistic-lock safety net on top of our pessimistic locks. */
    @Version
    private Long version;
}
