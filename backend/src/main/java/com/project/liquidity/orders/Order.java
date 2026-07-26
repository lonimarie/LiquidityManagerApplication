package com.project.liquidity.orders;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * A submitted order for a given Treasury term and amount.
 */
@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private String termLabel;

    @Column(nullable = false, precision = 8, scale = 1)
    private BigDecimal termMonths;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, precision = 6, scale = 2)
    private BigDecimal ratePercent;

    @Column(nullable = false)
    private Instant createdAt;

    protected Order() {
        // Required by JPA.
    }

    public Order(String userId, String termLabel, BigDecimal termMonths, BigDecimal amount,
            BigDecimal ratePercent) {
        this.userId = userId;
        this.termLabel = termLabel;
        this.termMonths = termMonths.setScale(1, RoundingMode.HALF_UP);
        this.ratePercent = ratePercent.setScale(2, RoundingMode.HALF_UP);
        this.amount = amount.setScale(2, RoundingMode.UNNECESSARY);
    }

    @PrePersist
    void assignCreatedAt() {
        this.createdAt = Instant.now().truncatedTo(ChronoUnit.MICROS);
    }

    public Long getId() {
        return id;
    }

    public String getUserId() {
        return userId;
    }

    public String getTermLabel() {
        return termLabel;
    }

    public BigDecimal getTermMonths() {
        return termMonths;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public BigDecimal getRatePercent() {
        return ratePercent;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
