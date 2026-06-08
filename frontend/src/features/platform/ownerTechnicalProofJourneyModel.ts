'use client';

export type TechnicalProofView = 'run' | 'result' | 'fix' | 'stored';

export const technicalProofViewValues: readonly TechnicalProofView[] = ['run', 'result', 'fix', 'stored'];

export const isTechnicalProofView = (value: string | null): value is TechnicalProofView =>
  !!value && technicalProofViewValues.includes(value as TechnicalProofView);
