package com.project.liquidity.yields;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

/**
 * Parses the Treasury "Daily Treasury Par Yield Curve Rates" CSV export
 */
@Component
public class YieldCurveCsvParser {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("MM/dd/yyyy");

    /**
     * Matches tenor column headers such as "1 Mo", "1.5 Month", "10 Yr".
     */
    private static final Pattern TENOR = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*(Mo|Month|Yr|Year)s?",
            Pattern.CASE_INSENSITIVE);

    private static final BigDecimal MONTHS_PER_YEAR = BigDecimal.valueOf(12);

    /**
     * @return the most recent curve in the file, or empty if it contains no data rows
     */
    public Optional<YieldCurve> parseLatest(String csv) {
        List<String> lines = csv.lines()
                .map(String::trim)
                .filter(line -> !line.isEmpty())
                .toList();

        if (lines.size() < 2) {
            return Optional.empty();
        }

        String[] headers = splitRow(lines.get(0));
        String[] values = splitRow(lines.get(1));

        List<YieldPoint> points = new ArrayList<>();

        for (int i = 1; i < headers.length && i < values.length; i++) {
            BigDecimal months = tenorInMonths(headers[i]).orElse(null);
            if (months == null || values[i].isEmpty()) {
                continue;
            }
            points.add(new YieldPoint(headers[i], months, new BigDecimal(values[i])));
        }

        if (points.isEmpty()) {
            return Optional.empty();
        }

        return Optional.of(new YieldCurve(LocalDate.parse(values[0], DATE_FORMAT), points));
    }

    private static Optional<BigDecimal> tenorInMonths(String header) {
        Matcher matcher = TENOR.matcher(header);
        if (!matcher.matches()) {
            return Optional.empty();
        }

        BigDecimal amount = new BigDecimal(matcher.group(1));
        boolean isYears = matcher.group(2).toLowerCase().startsWith("y");
        return Optional.of(isYears ? amount.multiply(MONTHS_PER_YEAR) : amount);
    }

    private static String[] splitRow(String line) {
        String[] cells = line.replace("\"", "").split(",", -1);
        for (int i = 0; i < cells.length; i++) {
            cells[i] = cells[i].trim();
        }
        return cells;
    }
}
