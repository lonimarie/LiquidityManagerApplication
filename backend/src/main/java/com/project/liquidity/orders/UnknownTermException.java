package com.project.liquidity.orders;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class UnknownTermException extends RuntimeException {

    public UnknownTermException(String termLabel) {
        super("'" + termLabel + "' is not a term on the current Treasury yield curve");
    }
}
