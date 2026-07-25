package com.project.liquidity.yields;

import java.time.LocalDate;
import java.util.List;

/**
 * The par yield curve published for a single business day, ordered shortest tenor first.
 */
public record YieldCurve(LocalDate date, List<YieldPoint> points) {
}
