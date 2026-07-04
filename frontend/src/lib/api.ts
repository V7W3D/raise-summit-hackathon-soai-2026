import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8080';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export type HealthResponse = {
  status: string;
};

export async function getBackendHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const { data } = await apiClient.get<HealthResponse>('/health', { signal });
  return data;
}
