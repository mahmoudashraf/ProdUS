import apiClient from '@/lib/api-client';

export async function getJson<T>(url: string): Promise<T> {
  const response = await apiClient.get<T>(url);
  return response.data;
}

export async function postJson<T, TPayload extends object>(url: string, payload: TPayload): Promise<T> {
  const response = await apiClient.post<T>(url, payload);
  return response.data;
}

export async function putJson<T, TPayload extends object>(url: string, payload: TPayload): Promise<T> {
  const response = await apiClient.put<T>(url, payload);
  return response.data;
}
