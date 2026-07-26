package com.project.liquidity.orders;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

/**
 * Inbound payload
 */
public record OrderRequest(
        @NotBlank(message = "A term must be selected") String termLabel,
        @NotNull(message = "An amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
        @Digits(integer = 17, fraction = 2, message = "Amount cannot have more than two decimal places")
        BigDecimal amount) {
}
