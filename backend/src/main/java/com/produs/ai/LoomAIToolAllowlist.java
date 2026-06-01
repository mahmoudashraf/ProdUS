package com.produs.ai;

import java.util.List;

public final class LoomAIToolAllowlist {

    private LoomAIToolAllowlist() {
    }

    public static List<ToolDefinition> tools() {
        return List.of(
                read("produs.catalog.search", "Search approved lifecycle service categories, modules, dependencies, and package templates."),
                read("produs.catalog.export", "Fetch the full active ProdUS lifecycle service catalog for broad service, package, dependency, and capability questions."),
                read("produs.product.list", "List products visible to the current ProdUS user."),
                read("produs.package.inspect", "Inspect an authorized productization package."),
                read("produs.workspace.inspect", "Inspect an authorized project workspace."),
                mutation("produs.productization_project.create", "Create the owner-approved initial productization project from an active AI project creation intent.", false),
                mutation("produs.requirement.submit", "Submit a productization requirement after explicit user confirmation."),
                mutation("produs.package.build_from_requirement", "Build a package from a confirmed requirement and catalog rules."),
                mutation("produs.team.shortlist", "Create or update a team shortlist after explicit owner confirmation."),
                mutation("produs.workspace.create", "Create a project workspace from a confirmed package/cart."),
                mutation("produs.deliverable.update", "Update deliverable status or evidence after explicit confirmation."),
                mutation("produs.scan.start", "Start a scan after explicit owner/admin confirmation."),
                read("produs.scan.status", "Read scanner run status and normalized summary."),
                mutation("produs.scan.cancel", "Cancel a scan after explicit owner/admin confirmation."),
                read("produs.finding.inspect", "Inspect a normalized scanner finding visible to the current user."),
                mutation("produs.finding.accept_risk", "Accept scanner risk after explicit authorized review and reason capture."),
                read("produs.evidence.list", "List evidence records visible to the current user."),
                mutation("produs.evidence.upload_ci_result", "Upload CI evidence after explicit authorized confirmation."),
                read("produs.milestone.review_evidence", "Review milestone evidence against acceptance criteria.")
        );
    }

    public static List<String> toolNames() {
        return tools().stream().map(ToolDefinition::name).toList();
    }

    private static ToolDefinition read(String name, String description) {
        return new ToolDefinition(name, "read", false, description);
    }

    private static ToolDefinition mutation(String name, String description) {
        return new ToolDefinition(name, "mutation", true, description);
    }

    private static ToolDefinition mutation(String name, String description, boolean confirmationRequired) {
        return new ToolDefinition(name, "mutation", confirmationRequired, description);
    }

    public record ToolDefinition(
            String name,
            String mode,
            boolean confirmationRequired,
            String description
    ) {
    }
}
