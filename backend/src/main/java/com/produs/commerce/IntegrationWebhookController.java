package com.produs.commerce;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.produs.dto.PlatformDtos.PaymentWebhookEventResponse;
import com.produs.dto.PlatformDtos.SignatureWebhookEventResponse;
import com.produs.notifications.NotificationService;
import com.produs.notifications.PlatformNotification;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;

import static com.produs.dto.PlatformDtos.toPaymentWebhookEventResponse;
import static com.produs.dto.PlatformDtos.toSignatureWebhookEventResponse;

@RestController
@RequestMapping("/api/integrations")
@RequiredArgsConstructor
public class IntegrationWebhookController {

    private final WebhookProperties webhookProperties;
    private final WebhookSignatureVerifier signatureVerifier;
    private final PaymentWebhookEventRepository paymentEventRepository;
    private final SignatureWebhookEventRepository signatureEventRepository;
    private final InvoiceRecordRepository invoiceRepository;
    private final ContractAgreementRepository contractRepository;
    private final ObjectMapper objectMapper;
    private final NotificationService notificationService;

    @PostMapping("/payments/webhook")
    public PaymentWebhookEventResponse paymentWebhook(
            @RequestHeader(value = "X-ProdUS-Signature", required = false) String signature,
            @RequestBody String payload
    ) {
        if (!signatureVerifier.verify(payload, signature, webhookProperties.getPayments().getSecret())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid payment webhook signature");
        }

        JsonNode root = parsePayload(payload);
        String provider = requireText(root, "provider");
        String eventId = requireText(root, "eventId");
        String eventType = requireText(root, "eventType");
        PaymentWebhookEvent existing = paymentEventRepository.findByProviderAndEventId(provider, eventId).orElse(null);
        if (existing != null) {
            return toPaymentWebhookEventResponse(existing);
        }

        PaymentWebhookEvent event = new PaymentWebhookEvent();
        event.setProvider(provider);
        event.setEventId(eventId);
        event.setEventType(eventType);
        event.setPayloadJson(payload);
        event.setSignatureValid(true);

        String invoiceNumber = text(root, "invoiceNumber");
        InvoiceRecord invoice = invoiceNumber == null
                ? null
                : invoiceRepository.findByInvoiceNumber(invoiceNumber).orElse(null);
        event.setInvoice(invoice);
        if (invoice == null) {
            event.setProcessed(false);
            event.setErrorMessage("Invoice not found");
            return toPaymentWebhookEventResponse(paymentEventRepository.save(event));
        }

        if (!paymentMatchesInvoice(root, invoice)) {
            event.setProcessed(false);
            event.setErrorMessage("Invoice amount or currency mismatch");
            return toPaymentWebhookEventResponse(paymentEventRepository.save(event));
        }

        InvoiceRecord.InvoiceStatus nextStatus = resolveInvoiceStatus(root, eventType);
        invoice.setStatus(nextStatus);
        invoiceRepository.save(invoice);
        notifyInvoiceWebhook(invoice);
        event.setProcessed(true);
        event.setProcessedAt(LocalDateTime.now());
        return toPaymentWebhookEventResponse(paymentEventRepository.save(event));
    }

    @PostMapping("/signatures/webhook")
    public SignatureWebhookEventResponse signatureWebhook(
            @RequestHeader(value = "X-ProdUS-Signature", required = false) String signature,
            @RequestBody String payload
    ) {
        if (!signatureVerifier.verify(payload, signature, webhookProperties.getSignatures().getSecret())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid signature webhook signature");
        }

        JsonNode root = parsePayload(payload);
        String provider = requireText(root, "provider");
        String eventId = requireText(root, "eventId");
        String eventType = requireText(root, "eventType");
        SignatureWebhookEvent existing = signatureEventRepository.findByProviderAndEventId(provider, eventId).orElse(null);
        if (existing != null) {
            return toSignatureWebhookEventResponse(existing);
        }

        SignatureWebhookEvent event = new SignatureWebhookEvent();
        event.setProvider(provider);
        event.setEventId(eventId);
        event.setEventType(eventType);
        event.setPayloadJson(payload);
        event.setSignatureValid(true);

        ContractAgreement contract = resolveContract(root);
        event.setContractAgreement(contract);
        if (contract == null) {
            event.setProcessed(false);
            event.setErrorMessage("Contract not found");
            return toSignatureWebhookEventResponse(signatureEventRepository.save(event));
        }

        ContractAgreement.ContractStatus nextStatus = resolveContractStatus(root, eventType);
        contract.setStatus(nextStatus);
        if ((nextStatus == ContractAgreement.ContractStatus.SIGNED
                || nextStatus == ContractAgreement.ContractStatus.ACTIVE)
                && contract.getSignedAt() == null) {
            contract.setSignedAt(LocalDateTime.now());
        }
        contractRepository.save(contract);
        notifyContractWebhook(contract);
        event.setProcessed(true);
        event.setProcessedAt(LocalDateTime.now());
        return toSignatureWebhookEventResponse(signatureEventRepository.save(event));
    }

    private JsonNode parsePayload(String payload) {
        try {
            return objectMapper.readTree(payload);
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid webhook payload");
        }
    }

    private ContractAgreement resolveContract(JsonNode root) {
        String contractId = text(root, "contractId");
        if (contractId != null) {
            return contractRepository.findById(UUID.fromString(contractId)).orElse(null);
        }
        String proposalId = text(root, "proposalId");
        if (proposalId != null) {
            return contractRepository.findByProposalId(UUID.fromString(proposalId)).orElse(null);
        }
        return null;
    }

    private boolean paymentMatchesInvoice(JsonNode root, InvoiceRecord invoice) {
        Long amountCents = root.hasNonNull("amountCents") ? root.path("amountCents").asLong() : null;
        String currency = text(root, "currency");
        if (amountCents != null && !amountCents.equals(invoice.getAmountCents())) {
            return false;
        }
        return currency == null || currency.equalsIgnoreCase(invoice.getCurrency());
    }

    private InvoiceRecord.InvoiceStatus resolveInvoiceStatus(JsonNode root, String eventType) {
        String supplied = text(root, "invoiceStatus");
        if (supplied != null) {
            return InvoiceRecord.InvoiceStatus.valueOf(supplied.toUpperCase(Locale.ROOT));
        }
        String normalized = eventType.toLowerCase(Locale.ROOT);
        if (normalized.contains("paid") || normalized.contains("succeeded")) {
            return InvoiceRecord.InvoiceStatus.PAID;
        }
        if (normalized.contains("void")) {
            return InvoiceRecord.InvoiceStatus.VOID;
        }
        if (normalized.contains("overdue") || normalized.contains("failed")) {
            return InvoiceRecord.InvoiceStatus.OVERDUE;
        }
        return InvoiceRecord.InvoiceStatus.ISSUED;
    }

    private ContractAgreement.ContractStatus resolveContractStatus(JsonNode root, String eventType) {
        String supplied = text(root, "contractStatus");
        if (supplied != null) {
            return ContractAgreement.ContractStatus.valueOf(supplied.toUpperCase(Locale.ROOT));
        }
        String normalized = eventType.toLowerCase(Locale.ROOT);
        if (normalized.contains("completed") || normalized.contains("signed")) {
            return ContractAgreement.ContractStatus.SIGNED;
        }
        if (normalized.contains("cancel")) {
            return ContractAgreement.ContractStatus.CANCELLED;
        }
        return ContractAgreement.ContractStatus.SENT;
    }

    private String requireText(JsonNode root, String field) {
        String value = text(root, field);
        if (value == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is required");
        }
        return value;
    }

    private String text(JsonNode root, String field) {
        if (!root.hasNonNull(field) || root.path(field).asText().isBlank()) {
            return null;
        }
        return root.path(field).asText();
    }

    private void notifyInvoiceWebhook(InvoiceRecord invoice) {
        PlatformNotification.NotificationType type = invoice.getStatus() == InvoiceRecord.InvoiceStatus.PAID
                ? PlatformNotification.NotificationType.INVOICE_PAID
                : PlatformNotification.NotificationType.INVOICE_STATUS_CHANGED;
        notificationService.notifyAll(
                java.util.List.of(invoice.getOwner(), invoice.getContractAgreement().getTeam().getManager()),
                null,
                type,
                PlatformNotification.NotificationPriority.NORMAL,
                "Invoice " + invoice.getStatus().name().replace('_', ' ').toLowerCase(),
                invoice.getInvoiceNumber() + " was updated by the payment provider",
                "/packages",
                "INVOICE_RECORD",
                invoice.getId(),
                invoice.getContractAgreement().getWorkspace()
        );
    }

    private void notifyContractWebhook(ContractAgreement contract) {
        PlatformNotification.NotificationType type = contract.getStatus() == ContractAgreement.ContractStatus.SIGNED
                || contract.getStatus() == ContractAgreement.ContractStatus.ACTIVE
                ? PlatformNotification.NotificationType.CONTRACT_SIGNED
                : PlatformNotification.NotificationType.CONTRACT_STATUS_CHANGED;
        notificationService.notifyAll(
                java.util.List.of(contract.getOwner(), contract.getTeam().getManager()),
                null,
                type,
                PlatformNotification.NotificationPriority.NORMAL,
                "Contract " + contract.getStatus().name().replace('_', ' ').toLowerCase(),
                contract.getTitle() + " was updated by the signature provider",
                "/packages",
                "CONTRACT_AGREEMENT",
                contract.getId(),
                contract.getWorkspace()
        );
    }
}
