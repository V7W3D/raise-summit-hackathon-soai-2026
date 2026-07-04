import { useQuery } from '@tanstack/react-query';
import { getBackendHealth } from '../src/lib/api';

export function useBackendHealth() {
  const query = useQuery({
    queryKey: ['backend-health'],
    queryFn: ({ signal }) => getBackendHealth(signal),
  });

  const message = query.isPending
    ? 'Checking backend...'
    : query.isError
      ? 'Backend unreachable'
      : `Backend is ${query.data.status}`;

  return {
    message,
    status: query.data?.status,
    isLoading: query.isPending,
    isError: query.isError,
    isSuccess: query.isSuccess,
  };
}
