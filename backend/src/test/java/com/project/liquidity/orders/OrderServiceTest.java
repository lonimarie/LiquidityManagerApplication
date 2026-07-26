package com.project.liquidity.orders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.project.liquidity.users.CurrentUser;
import com.project.liquidity.yields.TreasuryYieldClient;
import com.project.liquidity.yields.YieldCurve;
import com.project.liquidity.yields.YieldPoint;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orders;

    @Mock
    private TreasuryYieldClient treasury;

    @Mock
    private CurrentUser currentUser;

    private OrderService service;

    @BeforeEach
    void setUp() {
        service = new OrderService(orders, treasury, currentUser);
    }

    private void stubCurve() {
        when(treasury.fetchLatestCurve()).thenReturn(new YieldCurve(
                LocalDate.of(2026, 7, 24),
                List.of(
                        new YieldPoint("1 Mo", new BigDecimal("3.80")),
                        new YieldPoint("10 Yr", new BigDecimal("4.69")))));
    }

    @Test
    void snapshotsRateAndTermFromTheCurve() {
        stubCurve();
        when(currentUser.id()).thenReturn("loni");
        when(orders.save(any(Order.class))).thenAnswer(call -> call.getArgument(0));

        service.place(new OrderRequest("10 Yr", new BigDecimal("5000000.00")));

        ArgumentCaptor<Order> saved = ArgumentCaptor.forClass(Order.class);
        verify(orders).save(saved.capture());

        // The rate and term are taken from the curve, not from the request. Scales are
        // normalised so a POST response matches what a later GET reads back.
        assertThat(saved.getValue().getRatePercent()).isEqualTo(new BigDecimal("4.69"));
        assertThat(saved.getValue().getTermLabel()).isEqualTo("10 Yr");
        assertThat(saved.getValue().getAmount()).isEqualTo(new BigDecimal("5000000.00"));
    }

    @Test
    void stampsUserIdFromCurrentUser() {
        stubCurve();
        when(currentUser.id()).thenReturn("alex");
        when(orders.save(any(Order.class))).thenAnswer(call -> call.getArgument(0));

        // Whole-dollar input, to confirm it is stored in canonical two-decimal form.
        service.place(new OrderRequest("1 Mo", new BigDecimal("100")));

        ArgumentCaptor<Order> saved = ArgumentCaptor.forClass(Order.class);
        verify(orders).save(saved.capture());
        assertThat(saved.getValue().getUserId()).isEqualTo("alex");
        assertThat(saved.getValue().getAmount()).isEqualTo(new BigDecimal("100.00"));
    }

    @Test
    void rejectsATermThatIsNotOnTheCurve() {
        stubCurve();

        assertThatThrownBy(() -> service.place(new OrderRequest("99 Yr", new BigDecimal("100.00"))))
                .isInstanceOf(UnknownTermException.class)
                .hasMessageContaining("99 Yr");

        verify(orders, never()).save(any());
    }

    @Test
    void historyIsScopedToTheCurrentUser() {
        when(currentUser.id()).thenReturn("loni");
        when(orders.findByUserIdOrderByCreatedAtDescIdDesc(eq("loni"), any(Pageable.class)))
                .thenReturn(Page.empty());

        assertThat(service.history(0, 5).orders()).isEmpty();

        // The query is always filtered by the resolved user, never unscoped.
        verify(orders).findByUserIdOrderByCreatedAtDescIdDesc(eq("loni"), any(Pageable.class));
    }

    @Test
    void clampsPageAndSizeBeforeQuerying() {
        when(currentUser.id()).thenReturn("loni");
        when(orders.findByUserIdOrderByCreatedAtDescIdDesc(eq("loni"), any(Pageable.class)))
                .thenReturn(Page.empty());

        service.history(-4, 9999);

        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        verify(orders).findByUserIdOrderByCreatedAtDescIdDesc(eq("loni"), pageable.capture());
        assertThat(pageable.getValue().getPageNumber()).isZero();
        assertThat(pageable.getValue().getPageSize()).isEqualTo(100);
    }
}
