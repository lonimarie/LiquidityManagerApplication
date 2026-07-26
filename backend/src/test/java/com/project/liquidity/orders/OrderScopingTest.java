package com.project.liquidity.orders;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.project.liquidity.yields.TreasuryYieldClient;
import com.project.liquidity.yields.YieldCurve;
import com.project.liquidity.yields.YieldPoint;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/**
 * End-to-end through the real service and H2 repository, with only Treasury stubbed. This is
 * the test that proves per-user history actually works rather than merely being wired up.
 */
@SpringBootTest
@AutoConfigureMockMvc
class OrderScopingTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private OrderRepository orders;

    @MockitoBean
    private TreasuryYieldClient treasury;

    @BeforeEach
    void setUp() {
        orders.deleteAll();
        when(treasury.fetchLatestCurve()).thenReturn(new YieldCurve(
                LocalDate.of(2026, 7, 24),
                List.of(new YieldPoint("10 Yr", new BigDecimal("4.69")))));
    }

    private void placeOrderAs(String userId, String amount) throws Exception {
        mockMvc.perform(post("/api/orders")
                        .header("X-User-Id", userId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"termLabel\":\"10 Yr\",\"amount\":" + amount + "}"))
                .andExpect(status().isCreated());
    }

    @Test
    void eachUserSeesOnlyTheirOwnOrders() throws Exception {
        placeOrderAs("loni", "250000.00");

        mockMvc.perform(get("/api/orders").header("X-User-Id", "loni"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orders", Matchers.hasSize(1)))
                .andExpect(jsonPath("$.orders[0].amount").value(250000.00))
                .andExpect(jsonPath("$.totalOrders").value(1));

        mockMvc.perform(get("/api/orders").header("X-User-Id", "alex"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orders", Matchers.hasSize(0)))
                .andExpect(jsonPath("$.totalOrders").value(0))
                .andExpect(jsonPath("$.totalPages").value(0));
    }

    @Test
    void aMissingHeaderFallsBackToTheDefaultUser() throws Exception {
        // Posted with no header, so it belongs to demo-user.
        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"termLabel\":\"10 Yr\",\"amount\":100.00}"))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/orders"))
                .andExpect(jsonPath("$.orders", Matchers.hasSize(1)));

        mockMvc.perform(get("/api/orders").header("X-User-Id", "demo-user"))
                .andExpect(jsonPath("$.orders", Matchers.hasSize(1)));

        mockMvc.perform(get("/api/orders").header("X-User-Id", "loni"))
                .andExpect(jsonPath("$.orders", Matchers.hasSize(0)));
    }

    @Test
    void historyIsNewestFirst() throws Exception {
        placeOrderAs("loni", "100.00");
        placeOrderAs("loni", "200.00");
        placeOrderAs("loni", "300.00");

        mockMvc.perform(get("/api/orders").header("X-User-Id", "loni"))
                .andExpect(jsonPath("$.orders", Matchers.hasSize(3)))
                .andExpect(jsonPath("$.orders[0].amount").value(300.00))
                .andExpect(jsonPath("$.orders[2].amount").value(100.00));
    }

    @Test
    void splitsHistoryIntoPagesNewestFirstAcrossThePageBoundary() throws Exception {
        // Seven orders at the default size of five: 5 on page 0, 2 on page 1.
        for (int i = 1; i <= 7; i++) {
            placeOrderAs("loni", i + "00.00");
        }

        mockMvc.perform(get("/api/orders").header("X-User-Id", "loni"))
                .andExpect(jsonPath("$.orders", Matchers.hasSize(5)))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(5))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.totalOrders").value(7))
                .andExpect(jsonPath("$.orders[0].amount").value(700.00))
                .andExpect(jsonPath("$.orders[4].amount").value(300.00));

        // No row is repeated or skipped where the pages meet.
        mockMvc.perform(get("/api/orders").header("X-User-Id", "loni").param("page", "1"))
                .andExpect(jsonPath("$.orders", Matchers.hasSize(2)))
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.orders[0].amount").value(200.00))
                .andExpect(jsonPath("$.orders[1].amount").value(100.00));
    }

    @Test
    void honoursAnExplicitPageSize() throws Exception {
        placeOrderAs("loni", "100.00");
        placeOrderAs("loni", "200.00");
        placeOrderAs("loni", "300.00");

        mockMvc.perform(get("/api/orders").header("X-User-Id", "loni").param("size", "2"))
                .andExpect(jsonPath("$.orders", Matchers.hasSize(2)))
                .andExpect(jsonPath("$.totalPages").value(2));
    }

    @Test
    void clampsOutOfRangeParameters() throws Exception {
        placeOrderAs("loni", "100.00");

        // A negative page answers with the first page rather than an error.
        mockMvc.perform(get("/api/orders").header("X-User-Id", "loni").param("page", "-3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(0));

        mockMvc.perform(get("/api/orders").header("X-User-Id", "loni").param("size", "0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size").value(1));

        mockMvc.perform(get("/api/orders").header("X-User-Id", "loni").param("size", "5000"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size").value(100));
    }

    @Test
    void aPageBeyondTheLastIsEmptyRatherThanAnError() throws Exception {
        placeOrderAs("loni", "100.00");

        mockMvc.perform(get("/api/orders").header("X-User-Id", "loni").param("page", "9"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orders", Matchers.hasSize(0)))
                .andExpect(jsonPath("$.totalOrders").value(1));
    }

    @Test
    void rejectsATermThatIsNotOnTheCurve() throws Exception {
        mockMvc.perform(post("/api/orders")
                        .header("X-User-Id", "loni")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"termLabel\":\"99 Yr\",\"amount\":100.00}"))
                .andExpect(status().isBadRequest());
    }
}
