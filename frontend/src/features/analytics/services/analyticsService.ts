import { fetchAuthSession } from 'aws-amplify/auth';
import type { AnalyticsResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const analyticsService = {
  async getAnalytics(): Promise<AnalyticsResponse> {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString() || '';
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE}/analytics`, {
      headers: { Authorization: token },
    });

    if (!response.ok) throw new Error('Failed to fetch analytics');
    return response.json();
  },
};
