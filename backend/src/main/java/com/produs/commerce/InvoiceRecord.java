package com.produs.commerce;

import com.produs.entity.User;
import com.produs.shared.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "invoice_records")
public class InvoiceRecord extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "contract_id", nullable = false)
    private ContractAgreement contractAgreement;

    @ManyToOne(optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(optional = false)
    @JoinColumn(name = "issued_by", nullable = false)
    private User issuedBy;

    @Column(name = "invoice_number", nullable = false, unique = true)
    private String invoiceNumber;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "amount_cents", nullable = false)
    private Long amountCents = 0L;

    @Column(nullable = false, length = 3)
    private String currency = "USD";

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvoiceStatus status = InvoiceStatus.DRAFT;

    public enum InvoiceStatus {
        DRAFT,
        ISSUED,
        PAID,
        VOID,
        OVERDUE
    }
}
