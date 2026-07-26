package com.project.liquidity.users;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

/**
 * The single place identity is resolved.
 */
@Component
public class CurrentUser {

    static final String HEADER = "X-User-Id";
    static final String DEFAULT_USER_ID = "demo-user";

    private final HttpServletRequest request;

    public CurrentUser(HttpServletRequest request) {
        this.request = request;
    }

    public String id() {
        String header = request.getHeader(HEADER);
        return (header == null || header.isBlank()) ? DEFAULT_USER_ID : header.trim();
    }
}
