package com.project.liquidity.yields;

import java.math.BigDecimal;

/**
 * One point on the yield curve.
 *
 * @param label display name as published by Treasury, e.g. "1 Mo", "10 Yr"
 * @param ratePercent par yield, as a percentage (4.69 means 4.69%)
 */
public record YieldPoint(String label, BigDecimal ratePercent) {
}
