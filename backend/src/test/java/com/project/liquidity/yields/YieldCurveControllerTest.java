package com.project.liquidity.yields;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(YieldCurveController.class)
class YieldCurveControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TreasuryYieldClient treasury;

    private void stubCurve(int year) {
        when(treasury.fetchCurve(anyInt())).thenReturn(new YieldCurve(
                LocalDate.of(year, 12, 31),
                List.of(new YieldPoint("10 Yr", new BigDecimal("0.93")))));
    }

    @Test
    void defaultsToTheCurrentYearWhenNoYearIsGiven() throws Exception {
        stubCurve(LocalDate.now().getYear());

        mockMvc.perform(get("/api/yield-curve"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.points", org.hamcrest.Matchers.hasSize(1)));

        verify(treasury).fetchCurve(LocalDate.now().getYear());
    }

    @Test
    void passesAnExplicitYearThrough() throws Exception {
        stubCurve(2020);

        mockMvc.perform(get("/api/yield-curve").param("year", "2020"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.date").value("2020-12-31"));

        verify(treasury).fetchCurve(2020);
    }
}
