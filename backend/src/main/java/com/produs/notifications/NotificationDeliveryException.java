package com.produs.notifications;

public class NotificationDeliveryException extends RuntimeException {

    private final boolean retryable;

    public NotificationDeliveryException(String message, boolean retryable) {
        super(message);
        this.retryable = retryable;
    }

    public NotificationDeliveryException(String message, boolean retryable, Throwable cause) {
        super(message, cause);
        this.retryable = retryable;
    }

    public boolean isRetryable() {
        return retryable;
    }
}
