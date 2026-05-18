package com.produs.scanner;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ScannerConnectorAuthStateRepository extends JpaRepository<ScannerConnectorAuthState, UUID> {
    Optional<ScannerConnectorAuthState> findByStateHash(String stateHash);
}
