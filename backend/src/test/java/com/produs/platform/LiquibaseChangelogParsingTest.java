package com.produs.platform;

import liquibase.changelog.ChangeLogParameters;
import liquibase.changelog.DatabaseChangeLog;
import liquibase.parser.core.yaml.YamlChangeLogParser;
import liquibase.resource.ClassLoaderResourceAccessor;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class LiquibaseChangelogParsingTest {

    @Test
    void masterChangelogParsesScannerEvidenceMigration() throws Exception {
        DatabaseChangeLog changeLog = new YamlChangeLogParser().parse(
                "db/changelog/db.changelog-master.yaml",
                new ChangeLogParameters(),
                new ClassLoaderResourceAccessor()
        );

        assertThat(changeLog.getChangeSets())
                .anySatisfy(changeSet -> assertThat(changeSet.getId()).isEqualTo("1504"));
    }
}
