'use client';

export type ScannerProofOperationView = 'source' | 'run' | 'attach' | 'fresh';

export const scannerProofOperationViewValues: readonly ScannerProofOperationView[] = ['source', 'run', 'attach', 'fresh'];

export const isScannerProofOperationView = (value: string | null): value is ScannerProofOperationView =>
  !!value && scannerProofOperationViewValues.includes(value as ScannerProofOperationView);

