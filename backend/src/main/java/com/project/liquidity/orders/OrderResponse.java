package com.project.liquidity.orders;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Outbound shape
 */
public record OrderResponse(
        Long id,
        String termLabel,
        BigDecimal termMonths,
        BigDecimal amount,
        BigDecimal ratePercent,
        Instant createdAt) {

    static OrderResponse from(Order order) {
        return new OrderResponse(
                order.getId(),
                order.getTermLabel(),
                order.getTermMonths(),
                order.getAmount(),
                order.getRatePercent(),
                order.getCreatedAt());
    }
}
