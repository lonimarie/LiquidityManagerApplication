package com.project.liquidity.orders;

import java.util.List;
import org.springframework.data.domain.Page;

/**
 * One page of order history.
 *
 * @param orders the rows on this page, newest first
 * @param page zero-based index of this page
 * @param size maximum rows per page
 * @param totalPages total number of pages, 0 when there are no orders
 * @param totalOrders total rows across all pages
 */
public record OrderPage(
        List<OrderResponse> orders,
        int page,
        int size,
        int totalPages,
        long totalOrders) {

    static OrderPage from(Page<Order> source) {
        return new OrderPage(
                source.getContent().stream().map(OrderResponse::from).toList(),
                source.getNumber(),
                source.getSize(),
                source.getTotalPages(),
                source.getTotalElements());
    }
}
