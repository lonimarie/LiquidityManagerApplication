package com.project.liquidity.yields;

import java.time.LocalDate;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Fetches the latest par yield curve from home.treasury.gov.
 */
@Service
public class TreasuryYieldClient {

    private static final Logger log = LoggerFactory.getLogger(TreasuryYieldClient.class);

    private final RestClient restClient;
    private final YieldCurveCsvParser parser;

    public TreasuryYieldClient(@Value("${treasury.base-url}") String baseUrl, YieldCurveCsvParser parser) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
        this.parser = parser;
    }

    public YieldCurve fetchLatestCurve() {
        int year = LocalDate.now().getYear();

        return fetchYear(year)
                .or(() -> fetchYear(year - 1))
                .orElseThrow(() -> new TreasuryUnavailableException(
                        "Treasury published no yield curve data for " + year + " or " + (year - 1)));
    }

    private Optional<YieldCurve> fetchYear(int year) {
        String csv;
        try {
            csv = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/daily-treasury-rates.csv/{year}/all")
                            .queryParam("type", "daily_treasury_yield_curve")
                            .queryParam("field_tdr_date_value", year)
                            .queryParam("_format", "csv")
                            .build(year))
                    .retrieve()
                    .body(String.class);
        } catch (RestClientException e) {
            throw new TreasuryUnavailableException("Could not reach Treasury for " + year, e);
        }

        if (csv == null || csv.isBlank()) {
            log.warn("Treasury returned an empty response for {}", year);
            return Optional.empty();
        }

        Optional<YieldCurve> curve = parser.parseLatest(csv);
        curve.ifPresent(c -> log.debug("Fetched {} yield points for {}", c.points().size(), c.date()));
        return curve;
    }
}
