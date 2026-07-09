import { fetchAuthSession } from 'aws-amplify/auth';
import type { RecommendationsResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

async function getAuthToken(): Promise<string> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() || '';
  } catch {
    return '';
  }
}

export const recommendationService = {
  async getRecommendations(): Promise<RecommendationsResponse> {
    const token = await getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE}/recommendations`, {
      headers: { Authorization: token },
    });

    if (!response.ok) throw new Error('Failed to fetch recommendations');
    return response.json();
  },

  async trackClick(eventId: string): Promise<void> {
    const token = await getAuthToken();
    if (!token) return;
    fetch(`${API_BASE}/recommendations/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token },
      body: JSON.stringify({ eventId, action: 'click' }),
    }).catch(() => {}); // Fire and forget
  },

  async trackRegistration(eventId: string): Promise<void> {
    const token = await getAuthToken();
    if (!token) return;
    fetch(`${API_BASE}/recommendations/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token },
      body: JSON.stringify({ eventId, action: 'register' }),
    }).catch(() => {}); // Fire and forget
  },
};
