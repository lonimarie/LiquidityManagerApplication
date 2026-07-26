package com.project.liquidity.orders;

import com.project.liquidity.users.CurrentUser;
import com.project.liquidity.yields.TreasuryYieldClient;
import com.project.liquidity.yields.YieldPoint;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orders;
    private final TreasuryYieldClient treasury;
    private final CurrentUser currentUser;

    public OrderService(OrderRepository orders, TreasuryYieldClient treasury, CurrentUser currentUser) {
        this.orders = orders;
        this.treasury = treasury;
        this.currentUser = currentUser;
    }

    /**
     * Records an order at the rate currently published for the requested term.
     */
    @Transactional
    public OrderResponse place(OrderRequest request) {
        YieldPoint point = treasury.fetchLatestCurve().points().stream()
                .filter(p -> p.label().equalsIgnoreCase(request.termLabel().trim()))
                .findFirst()
                .orElseThrow(() -> new UnknownTermException(request.termLabel()));

        Order saved = orders.save(new Order(
                currentUser.id(),
                point.label(),
                request.amount(),
                point.ratePercent()));

        log.debug("Recorded order {} for user {}: {} at {}%",
                saved.getId(), saved.getUserId(), saved.getTermLabel(), saved.getRatePercent());

        return OrderResponse.from(saved);
    }

    public static final int DEFAULT_PAGE_SIZE = 5;

    private static final int MAX_PAGE_SIZE = 100;

    @Transactional(readOnly = true)
    public OrderPage history(int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.clamp(size, 1, MAX_PAGE_SIZE);

        return OrderPage.from(orders.findByUserIdOrderByCreatedAtDescIdDesc(
                currentUser.id(), PageRequest.of(safePage, safeSize)));
    }
}
