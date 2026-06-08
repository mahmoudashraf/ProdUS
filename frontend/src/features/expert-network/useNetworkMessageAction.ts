'use client';

import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { networkApi } from './api';
import type { ConversationCreatePayload } from './types';

export function useNetworkMessageAction() {
  const router = useRouter();
  return useMutation({
    mutationFn: (payload: ConversationCreatePayload) => networkApi.createConversation(payload),
    onSuccess: (thread) => router.push(`/expert-network/messages?thread=${thread.id}`),
  });
}
