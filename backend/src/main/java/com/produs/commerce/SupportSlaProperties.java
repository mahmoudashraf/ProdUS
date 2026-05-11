package com.produs.commerce;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.support.sla")
public class SupportSlaProperties {
    private boolean enabled = true;
    private boolean schedulerEnabled = true;
    private int dueSoonDays = 1;
}
