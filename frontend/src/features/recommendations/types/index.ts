/**
 * Recommendation types for CloudVigil — Phase 9
 */

export interface RecommendedEvent {
  eventId: string;
  title: string;
  description: string;
  category: string;
  venue: string;
  eventDate: string;
  registrationDeadline: string;
  capacity: number;
  registeredCount: number;
  imageUrl?: string | null;
  score: number;
  reason: string;
}

export interface RecommendationsResponse {
  recommendations: RecommendedEvent[];
  total: number;
  preferences: Record<string, number>;
}
