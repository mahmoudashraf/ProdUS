package com.produs.exception;

public class ProjectCreationActionException extends RuntimeException {

    private final String errorCode;

    public ProjectCreationActionException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
