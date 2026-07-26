package com.project.liquidity.orders;


/** Status is mapped in ApiExceptionHandler, which owns the response body too. */
public class UnknownTermException extends RuntimeException {

    public UnknownTermException(String termLabel) {
        super("'" + termLabel + "' is not a term on the current Treasury yield curve");
    }
}
