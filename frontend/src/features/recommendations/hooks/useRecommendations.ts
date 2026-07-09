import { useState, useEffect, useCallback } from 'react';
import { recommendationService } from '../services/recommendationService';
import type { RecommendedEvent } from '../types';

export function useRecommendations() {
  const [recommendations, setRecommendations] = useState<RecommendedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await recommendationService.getRecommendations();
      setRecommendations(data.recommendations);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return { recommendations, isLoading, error, refetch: fetchRecommendations };
}
