package com.project.liquidity.yields;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class YieldCurveController {

    private final TreasuryYieldClient treasuryYieldClient;

    public YieldCurveController(TreasuryYieldClient treasuryYieldClient) {
        this.treasuryYieldClient = treasuryYieldClient;
    }

    @GetMapping("/yield-curve")
    public YieldCurve latestYieldCurve() {
        return treasuryYieldClient.fetchLatestCurve();
    }
}
