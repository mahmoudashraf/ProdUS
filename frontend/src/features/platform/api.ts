import apiClient from '@/lib/api-client';

export async function getJson<T>(url: string): Promise<T> {
  const response = await apiClient.get<T>(url);
  return response.data;
}

export async function postJson<T, TPayload extends object>(
  url: string,
  payload: TPayload
): Promise<T> {
  const response = await apiClient.post<T>(url, payload);
  return response.data;
}

export async function postFormData<T>(
  url: string,
  payload: FormData,
  options?: { timeoutMs?: number }
): Promise<T> {
  const config: { headers: Record<string, string>; timeout?: number } = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  };
  if (options?.timeoutMs) {
    config.timeout = options.timeoutMs;
  }
  const response = await apiClient.post<T>(url, payload, config);
  return response.data;
}

export async function putJson<T, TPayload extends object>(
  url: string,
  payload: TPayload
): Promise<T> {
  const response = await apiClient.put<T>(url, payload);
  return response.data;
}

export async function patchJson<T, TPayload extends object>(
  url: string,
  payload: TPayload
): Promise<T> {
  const response = await apiClient.patch<T>(url, payload);
  return response.data;
}

export async function deleteJson<T>(url: string): Promise<T> {
  const response = await apiClient.delete<T>(url);
  return response.data;
}
