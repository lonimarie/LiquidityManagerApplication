package com.project.liquidity.yields;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
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

    /** Treasury's daily curve series begins in 1990. */
    public static final int EARLIEST_YEAR = 1990;

    private final RestClient restClient;
    private final YieldCurveCsvParser parser;
    private final Map<Integer, CachedCurve> cache = new ConcurrentHashMap<>();

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
        return fetchCurve(LocalDate.now().getYear());
    }

    /**
     * The last curve published in the given year -- the newest row in a past year's file is its
     * final business day, so this is that year's closing curve.
     */
    public YieldCurve fetchCurve(int year) {
        int currentYear = LocalDate.now().getYear();
        int safeYear = Math.clamp(year, EARLIEST_YEAR, currentYear);
        boolean isCompletedYear = safeYear < currentYear;

        CachedCurve cached = cache.get(safeYear);
        if (cached != null && (isCompletedYear || cached.isFresh())) {
            return cached.curve();
        }

        Optional<YieldCurve> fetched = fetchYear(safeYear);
        if (fetched.isEmpty() && !isCompletedYear) {
            fetched = fetchYear(safeYear - 1);
        }

        YieldCurve curve = fetched.orElseThrow(() -> new TreasuryUnavailableException(
                "Treasury published no yield curve data for " + safeYear));

        cache.put(safeYear, new CachedCurve(curve, Instant.now()));
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
