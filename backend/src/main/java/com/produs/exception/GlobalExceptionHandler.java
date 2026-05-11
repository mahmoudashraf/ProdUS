package com.produs.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(com.produs.exception.ResourceNotFoundException.class)
    public ProblemDetail handleResourceNotFoundException(com.produs.exception.ResourceNotFoundException ex) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_FOUND, 
                ex.getMessage()
        );
        problemDetail.setType(URI.create("https://api.produs.com/errors/not-found"));
        problemDetail.setTitle("Resource Not Found");
        return problemDetail;
    }

    @ExceptionHandler(com.produs.exception.DuplicateResourceException.class)
    public ProblemDetail handleDuplicateResourceException(com.produs.exception.DuplicateResourceException ex) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT, 
                ex.getMessage()
        );
        problemDetail.setType(URI.create("https://api.produs.com/errors/conflict"));
        problemDetail.setTitle("Resource Conflict");
        return problemDetail;
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleAccessDeniedException(AccessDeniedException ex) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.FORBIDDEN, 
                "You do not have permission to access this resource"
        );
        problemDetail.setType(URI.create("https://api.produs.com/errors/forbidden"));
        problemDetail.setTitle("Access Denied");
        return problemDetail;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                errors.put(error.getField(), error.getDefaultMessage())
        );

        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST, 
                "Validation failed"
        );
        problemDetail.setType(URI.create("https://api.produs.com/errors/validation"));
        problemDetail.setTitle("Validation Error");
        problemDetail.setProperty("errors", errors);
        return problemDetail;
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail handleIllegalArgumentException(IllegalArgumentException ex) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                ex.getMessage()
        );
        problemDetail.setType(URI.create("https://api.produs.com/errors/bad-request"));
        problemDetail.setTitle("Bad Request");
        return problemDetail;
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ProblemDetail handleResponseStatusException(ResponseStatusException ex) {
        String detail = ex.getReason() == null ? "Request failed" : ex.getReason();
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(ex.getStatusCode(), detail);
        problemDetail.setType(URI.create("https://api.produs.com/errors/http-status"));
        problemDetail.setTitle(ex.getStatusCode().toString());
        return problemDetail;
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGenericException(Exception ex) {
        log.error("Unexpected error occurred", ex);
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR, 
                "An unexpected error occurred"
        );
        problemDetail.setType(URI.create("https://api.produs.com/errors/internal"));
        problemDetail.setTitle("Internal Server Error");
        return problemDetail;
    }
}
