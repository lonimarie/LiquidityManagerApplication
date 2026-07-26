package com.project.liquidity.yields;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

/**
 * Parses the Treasury "Daily Treasury Par Yield Curve Rates" CSV export
 */
@Component
public class YieldCurveCsvParser {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("MM/dd/yyyy");


    private static final Pattern TENOR = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*(Mo|Month|Yr|Year)s?",
            Pattern.CASE_INSENSITIVE);

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
            // Skip columns that aren't tenors, and tenors not published that day.
            if (!isTenor(headers[i]) || values[i].isEmpty()) {
                continue;
            }
            points.add(new YieldPoint(headers[i], new BigDecimal(values[i])));
        }

        if (points.isEmpty()) {
            return Optional.empty();
        }

        return Optional.of(new YieldCurve(LocalDate.parse(values[0], DATE_FORMAT), points));
    }

    private static boolean isTenor(String header) {
        return TENOR.matcher(header).matches();
    }

    private static String[] splitRow(String line) {
        String[] cells = line.replace("\"", "").split(",", -1);
        for (int i = 0; i < cells.length; i++) {
            cells[i] = cells[i].trim();
        }
        return cells;
    }
}
