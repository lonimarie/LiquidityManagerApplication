package com.project.liquidity.web;

import com.project.liquidity.orders.UnknownTermException;
import com.project.liquidity.yields.TreasuryUnavailableException;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Gives failed requests a body the client can actually display.
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    /**
     * @param message human-readable summary, safe to show a user
     * @param fieldErrors per-field messages for form display; null when not field-specific
     */
    public record ApiError(String message, Map<String, String> fieldErrors) {

        static ApiError of(String message) {
            return new ApiError(message, null);
        }
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiError onValidationFailure(MethodArgumentNotValidException e) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError error : e.getBindingResult().getFieldErrors()) {
            fieldErrors.putIfAbsent(error.getField(), error.getDefaultMessage());
        }

        String summary = fieldErrors.values().stream().findFirst().orElse("Invalid request");
        return new ApiError(summary, fieldErrors);
    }

    @ExceptionHandler(UnknownTermException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiError onUnknownTerm(UnknownTermException e) {
        return ApiError.of(e.getMessage());
    }

    @ExceptionHandler(TreasuryUnavailableException.class)
    @ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
    public ApiError onTreasuryUnavailable(TreasuryUnavailableException e) {
        return ApiError.of(e.getMessage());
    }
}
