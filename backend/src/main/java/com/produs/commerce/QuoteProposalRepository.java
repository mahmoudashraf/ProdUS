package com.produs.commerce;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface QuoteProposalRepository extends JpaRepository<QuoteProposal, UUID> {
    List<QuoteProposal> findByPackageInstanceOwnerIdOrderByCreatedAtDesc(UUID ownerId);
    List<QuoteProposal> findByPackageInstanceIdOrderByCreatedAtDesc(UUID packageInstanceId);
    List<QuoteProposal> findByTeamManagerIdOrderByCreatedAtDesc(UUID managerId);
    List<QuoteProposal> findByTeamIdOrderByCreatedAtDesc(UUID teamId);
}
