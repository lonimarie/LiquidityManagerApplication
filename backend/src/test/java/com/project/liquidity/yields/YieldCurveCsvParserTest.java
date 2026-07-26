package com.project.liquidity.yields;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class YieldCurveCsvParserTest {

    private final YieldCurveCsvParser parser = new YieldCurveCsvParser();

    @Test
    void parsesLatestRowAndConvertsTenorsToMonths() {
        String csv = """
                Date,"1 Mo","6 Mo","1 Yr","10 Yr","30 Yr"
                07/24/2026,3.80,4.08,4.14,4.69,5.16
                07/23/2026,3.82,4.09,4.15,4.71,5.17
                """;

        YieldCurve curve = parser.parseLatest(csv).orElseThrow();

        // Newest row wins -- Treasury publishes newest first.
        assertThat(curve.date()).isEqualTo(LocalDate.of(2026, 7, 24));
        assertThat(curve.points()).extracting(YieldPoint::label)
                .containsExactly("1 Mo", "6 Mo", "1 Yr", "10 Yr", "30 Yr");
        assertThat(curve.points()).extracting(YieldPoint::ratePercent)
                .containsExactly(
                        new BigDecimal("3.80"),
                        new BigDecimal("4.08"),
                        new BigDecimal("4.14"),
                        new BigDecimal("4.69"),
                        new BigDecimal("5.16"));
    }

    @Test
    void handlesFractionalTenorColumn() {
        String csv = """
                Date,"1 Mo","1.5 Month","2 Mo"
                07/24/2026,3.80,3.88,3.95
                """;

        YieldCurve curve = parser.parseLatest(csv).orElseThrow();

        // The odd column is recognised as a tenor rather than skipped.
        assertThat(curve.points()).extracting(YieldPoint::label)
                .containsExactly("1 Mo", "1.5 Month", "2 Mo");
        assertThat(curve.points().get(1).ratePercent()).isEqualTo(new BigDecimal("3.88"));
    }

    @Test
    void skipsBlankCellsAndUnrecognisedColumns() {
        String csv = """
                Date,"1 Mo","Something Else","10 Yr"
                07/24/2026,,4.00,4.69
                """;

        YieldCurve curve = parser.parseLatest(csv).orElseThrow();

        assertThat(curve.points()).extracting(YieldPoint::label).containsExactly("10 Yr");
    }

    @Test
    void returnsEmptyWhenFileHasNoDataRows() {
        String headerOnly = "Date,\"1 Mo\",\"10 Yr\"\n";

        assertThat(parser.parseLatest(headerOnly)).isEqualTo(Optional.empty());
    }
}
