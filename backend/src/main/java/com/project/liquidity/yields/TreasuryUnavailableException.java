package com.project.liquidity.yields;


/** Status is mapped in ApiExceptionHandler, which owns the response body too. */
public class TreasuryUnavailableException extends RuntimeException {

    public TreasuryUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }

    public TreasuryUnavailableException(String message) {
        super(message);
    }
}
