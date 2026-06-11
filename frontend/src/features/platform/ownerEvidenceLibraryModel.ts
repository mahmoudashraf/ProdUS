'use client';

export type EvidenceLibraryView = 'saved' | 'sources' | 'readout';
export type OwnerEvidenceFilter = 'ALL' | 'FINDINGS' | 'MILESTONES' | 'REDACTED';

export const evidenceLibraryViewValues: readonly EvidenceLibraryView[] = ['saved', 'sources', 'readout'];

export const isEvidenceLibraryView = (value: string | null): value is EvidenceLibraryView =>
  !!value && evidenceLibraryViewValues.includes(value as EvidenceLibraryView);
