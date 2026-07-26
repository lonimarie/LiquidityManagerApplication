package com.project.liquidity.yields;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
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

    private static final Duration CACHE_TTL = Duration.ofMinutes(15);

    private final RestClient restClient;
    private final YieldCurveCsvParser parser;
    private final AtomicReference<CachedCurve> cache = new AtomicReference<>();

    private record CachedCurve(YieldCurve curve, Instant fetchedAt) {
        boolean isFresh() {
            return Duration.between(fetchedAt, Instant.now()).compareTo(CACHE_TTL) < 0;
        }
    }

    public TreasuryYieldClient(@Value("${treasury.base-url}") String baseUrl, YieldCurveCsvParser parser) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
        this.parser = parser;
    }

    public YieldCurve fetchLatestCurve() {
        CachedCurve cached = cache.get();
        if (cached != null && cached.isFresh()) {
            return cached.curve();
        }

        int year = LocalDate.now().getYear();

        YieldCurve curve = fetchYear(year)
                .or(() -> fetchYear(year - 1))
                .orElseThrow(() -> new TreasuryUnavailableException(
                        "Treasury published no yield curve data for " + year + " or " + (year - 1)));

        cache.set(new CachedCurve(curve, Instant.now()));
        return curve;
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
