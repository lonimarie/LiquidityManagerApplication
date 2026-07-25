package com.project.liquidity.yields;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
public class TreasuryUnavailableException extends RuntimeException {

    public TreasuryUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }

    public TreasuryUnavailableException(String message) {
        super(message);
    }
}
