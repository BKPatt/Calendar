import { useState, useEffect, useCallback } from 'react';
import { handleApiError } from '../utils/apiHelpers';
import { ApiResponse, PaginatedResponse } from '../types/event';

interface UseApiOptions<T> {
    initialData?: T;
    dependencies?: any[];
}

interface UseApiReturn<T> {
    data: T | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useApi<T>(
    apiCall: () => Promise<ApiResponse<T>>,
    options: UseApiOptions<T> = {}
): UseApiReturn<T> {
    const [data, setData] = useState<T | null>(options.initialData || null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await apiCall();
            setData(response.data);
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setIsLoading(false);
        }
    }, [apiCall]);

    useEffect(() => {
        fetchData();
    }, options.dependencies || []);

    const refetch = useCallback(() => fetchData(), [fetchData]);

    return { data, isLoading, error, refetch };
}

export function usePaginatedApi<T>(
    apiCall: (params: Record<string, string>) => Promise<PaginatedResponse<T[]>>,
    initialParams: Record<string, string> = {}
) {
    const [params, setParams] = useState(initialParams);
    const [data, setData] = useState<T[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);

    const fetchData = useCallback(async (newParams: Record<string, string> = {}) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await apiCall({ ...params, ...newParams });
            setData(prevData => newParams.page === '1' ? response.results as T[] : [...prevData, ...(response.results as T[])]);
            setHasMore(!!response.next);
            setParams(prevParams => ({ ...prevParams, ...newParams }));
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setIsLoading(false);
        }
    }, [apiCall, params]);

    useEffect(() => {
        fetchData();
    }, []);

    const loadMore = () => {
        if (!isLoading && hasMore) {
            const nextPage = parseInt(params.page || '1') + 1;
            fetchData({ page: nextPage.toString() });
        }
    };

    return { data, isLoading, error, hasMore, loadMore, refetch: fetchData };
}