package com.produs.commerce;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ContractAgreementRepository extends JpaRepository<ContractAgreement, UUID> {
    List<ContractAgreement> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
    List<ContractAgreement> findByTeamManagerIdOrderByCreatedAtDesc(UUID managerId);
    Optional<ContractAgreement> findByProposalId(UUID proposalId);
}
