package com.project.liquidity.orders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.project.liquidity.web.ApiExceptionHandler;

@WebMvcTest(OrderController.class)
@Import(ApiExceptionHandler.class)
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private OrderService orderService;

    @Test
    void returns201AndTheCreatedOrder() throws Exception {
        when(orderService.place(any())).thenReturn(new OrderResponse(
                1L, "10 Yr", new BigDecimal("120"), new BigDecimal("5000000.00"),
                new BigDecimal("4.69"), Instant.parse("2026-07-25T14:40:42Z")));

        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"termLabel\":\"10 Yr\",\"amount\":5000000.00}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.ratePercent").value(4.69))
                // userId is transport context, never part of the resource body.
                .andExpect(jsonPath("$.userId").doesNotExist());
    }

    @Test
    void rejectsABlankTerm() throws Exception {
        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"termLabel\":\"  \",\"amount\":100}"))
                .andExpect(status().isBadRequest());

        verify(orderService, never()).place(any());
    }

    @Test
    void rejectsAZeroOrNegativeAmount() throws Exception {
        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"termLabel\":\"10 Yr\",\"amount\":-5}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"termLabel\":\"10 Yr\",\"amount\":0}"))
                .andExpect(status().isBadRequest());

        verify(orderService, never()).place(any());
    }

    @Test
    void rejectsAnAmountWithFractionsOfACent() throws Exception {
        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"termLabel\":\"10 Yr\",\"amount\":100.999}"))
                .andExpect(status().isBadRequest());

        verify(orderService, never()).place(any());
    }

    @Test
    void aRejectedAmountExplainsWhy() throws Exception {
        // Guards the error body: Boot's default 400 carries no message at all, which would
        // leave the form unable to tell the user what was wrong.
        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"termLabel\":\"10 Yr\",\"amount\":-5}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Amount must be greater than zero"))
                .andExpect(jsonPath("$.fieldErrors.amount").value("Amount must be greater than zero"));
    }

    @Test
    void anUnknownTermExplainsWhy() throws Exception {
        when(orderService.place(any())).thenThrow(new UnknownTermException("99 Yr"));

        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"termLabel\":\"99 Yr\",\"amount\":100}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("99 Yr")));
    }

    @Test
    void rejectsAMissingAmount() throws Exception {
        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"termLabel\":\"10 Yr\"}"))
                .andExpect(status().isBadRequest());

        verify(orderService, never()).place(any());
    }
}
