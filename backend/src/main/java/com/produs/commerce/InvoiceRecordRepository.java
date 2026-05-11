package com.produs.commerce;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InvoiceRecordRepository extends JpaRepository<InvoiceRecord, UUID> {
    List<InvoiceRecord> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
    List<InvoiceRecord> findByContractAgreementTeamManagerIdOrderByCreatedAtDesc(UUID managerId);
    Optional<InvoiceRecord> findByInvoiceNumber(String invoiceNumber);
}
