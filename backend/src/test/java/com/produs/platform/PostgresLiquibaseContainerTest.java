package com.produs.platform;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
class PostgresLiquibaseContainerTest {

    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("produs_test")
            .withUsername("produs")
            .withPassword("produs");

    @DynamicPropertySource
    static void postgresProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.driver-class-name", postgres::getDriverClassName);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
        registry.add("spring.jpa.show-sql", () -> "false");
        registry.add("spring.jpa.properties.hibernate.dialect", () -> "org.hibernate.dialect.PostgreSQLDialect");
        registry.add("spring.liquibase.enabled", () -> "true");
        registry.add("app.security.rate-limit.enabled", () -> "false");
        registry.add("app.cors.allowed-origins", () -> "http://localhost:3000");
        registry.add("supabase.url", () -> "https://test-project.supabase.co");
        registry.add("supabase.api-key", () -> "test-anon-key");
        registry.add("supabase.service-role-key", () -> "test-service-role-key");
    }

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void liquibaseCreatesPlatformSchemaAndSeedsCatalog() {
        assertTableExists("users");
        assertTableExists("service_categories");
        assertTableExists("service_modules");
        assertTableExists("package_instances");
        assertTableExists("project_workspaces");
        assertTableExists("team_members");
        assertTableExists("workspace_participants");
        assertTableExists("quote_proposals");
        assertTableExists("contract_agreements");
        assertTableExists("invoice_records");
        assertTableExists("support_subscriptions");
        assertTableExists("team_reputation_events");
        assertTableExists("payment_webhook_events");
        assertTableExists("signature_webhook_events");
        assertTableExists("dispute_cases");
        assertTableExists("evidence_attachments");
        assertTableExists("platform_notifications");
        assertTableExists("support_requests");
        assertTableExists("notification_deliveries");
        assertTableExists("mcp_tool_invocations");
        assertTableExists("expert_profiles");
        assertTableExists("team_invitations");
        assertTableExists("team_join_requests");
        assertColumnExists("teams", "bio");
        assertColumnExists("teams", "profile_photo_url");
        assertColumnExists("teams", "cover_photo_url");
        assertColumnExists("support_requests", "sla_status");
        assertColumnExists("support_requests", "escalation_count");

        Integer serviceCategoryCount = jdbcTemplate.queryForObject("select count(*) from service_categories", Integer.class);
        Integer serviceModuleCount = jdbcTemplate.queryForObject("select count(*) from service_modules", Integer.class);

        assertThat(serviceCategoryCount).isNotNull().isGreaterThan(0);
        assertThat(serviceModuleCount).isNotNull().isGreaterThan(0);
    }

    private void assertTableExists(String tableName) {
        Integer count = jdbcTemplate.queryForObject(
                """
                select count(*)
                from information_schema.tables
                where table_schema = 'public' and table_name = ?
                """,
                Integer.class,
                tableName
        );
        assertThat(count).isEqualTo(1);
    }

    private void assertColumnExists(String tableName, String columnName) {
        Integer count = jdbcTemplate.queryForObject(
                """
                select count(*)
                from information_schema.columns
                where table_schema = 'public' and table_name = ? and column_name = ?
                """,
                Integer.class,
                tableName,
                columnName
        );
        assertThat(count).isEqualTo(1);
    }
}
