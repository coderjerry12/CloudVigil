export interface FeedbackItem {
  eventId: string;
  attendeeId: string;
  attendeeName: string;
  rating: number;
  comment: string;
  tags: string[];
  eventTitle: string;
  eventCategory: string;
  submittedAt: string;
}

export interface SubmitFeedbackInput {
  eventId: string;
  rating: number;
  comment?: string;
  tags?: string[];
}

export interface EventFeedbackResponse {
  eventId: string;
  eventTitle: string;
  totalFeedback: number;
  avgRating: number;
  ratingDistribution: Record<number, number>;
  feedback?: {
    attendeeName: string;
    rating: number;
    comment: string;
    tags: string[];
    submittedAt: string;
  }[];
}

export interface MyFeedbackResponse {
  submitted: FeedbackItem[];
  pending: {
    eventId: string;
    eventTitle: string;
    eventDate: string;
    venue: string;
  }[];
  totalSubmitted: number;
  totalPending: number;
}

export interface PendingFeedbackEvent {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  venue: string;
}
