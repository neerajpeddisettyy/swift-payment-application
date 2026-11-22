/** Represents wallet balance and card details returned to the frontend. */
package com.swift.dto;

import com.swift.entity.User;
import com.swift.entity.Wallet;
import java.math.BigDecimal;

public record WalletResponse(
        Long walletId,
        String fullName,
        String swiftHandle,
        BigDecimal balance,
        String currencySymbol,
        String cardLast4,
        String cvv,
        boolean cardFrozen,
        BigDecimal txLimit) {

    public static WalletResponse from(User user, Wallet wallet) {
        String number = wallet.getCardNumber();
        return new WalletResponse(
                wallet.getId(),
                user.getFullName(),
                user.getSwiftHandle(),
                wallet.getBalance(),
                wallet.getCurrencySymbol(),
                number.substring(number.length() - 4),
                wallet.getCvv(),
                wallet.isCardFrozen(),
                wallet.getTxLimit());
    }
}
