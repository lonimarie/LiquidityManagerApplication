package com.project.liquidity.yields;

import java.time.LocalDate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class YieldCurveController {

    private final TreasuryYieldClient treasuryYieldClient;

    public YieldCurveController(TreasuryYieldClient treasuryYieldClient) {
        this.treasuryYieldClient = treasuryYieldClient;
    }

    /**
     * @param year optional; defaults to the current year. A past year returns that year's
     *             closing curve, which is how the UI shows historical comparisons.
     */
    @GetMapping("/yield-curve")
    public YieldCurve latestYieldCurve(@RequestParam(required = false) Integer year) {
        return treasuryYieldClient.fetchCurve(year == null ? LocalDate.now().getYear() : year);
    }
}
