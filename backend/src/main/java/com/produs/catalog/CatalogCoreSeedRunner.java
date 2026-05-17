package com.produs.catalog;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Profile("!test")
@RequiredArgsConstructor
public class CatalogCoreSeedRunner implements ApplicationRunner {

    private final CatalogCoreSeedService seedService;

    @Override
    public void run(ApplicationArguments args) {
        CatalogCoreSeedService.CatalogSeedResult result = seedService.seedCoreCatalog();
        log.info("Catalog core seed complete: {} categories, {} modules", result.categories(), result.modules());
    }
}
