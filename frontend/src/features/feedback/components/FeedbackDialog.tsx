import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  TextField,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Star, StarBorder, Close } from '@mui/icons-material';
import { feedbackService } from '../services/feedbackService';

const FEEDBACK_TAGS = [
  'Well Organized',
  'Great Speaker',
  'Good Venue',
  'Informative',
  'Networking',
  'Too Crowded',
  'Poor Audio',
  'Late Start',
  'Would Recommend',
  'Needs Improvement',
];

interface FeedbackDialogProps {
  open: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  onSubmitted?: () => void;
}

export default function FeedbackDialog({ open, onClose, eventId, eventTitle, onSubmitted }: FeedbackDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await feedbackService.submitFeedback({
        eventId,
        rating,
        comment: comment.trim() || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      });
      setSubmitted(true);
      onSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setHoverRating(0);
    setComment('');
    setSelectedTags([]);
    setError(null);
    setSubmitted(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">
          {submitted ? '🎉 Thanks for your feedback!' : 'Rate this Event'}
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {submitted ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Your feedback for <strong>{eventTitle}</strong> has been submitted.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This helps organizers improve future events and powers our recommendations.
            </Typography>
          </Box>
        ) : (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              How was your experience at <strong>{eventTitle}</strong>?
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Star Rating */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                Your Rating
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <IconButton
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    sx={{
                      color: star <= (hoverRating || rating) ? '#F59E0B' : 'text.disabled',
                      transition: 'transform 0.15s',
                      '&:hover': { transform: 'scale(1.2)' },
                    }}
                    aria-label={`Rate ${star} stars`}
                  >
                    {star <= (hoverRating || rating) ? (
                      <Star sx={{ fontSize: 40 }} />
                    ) : (
                      <StarBorder sx={{ fontSize: 40 }} />
                    )}
                  </IconButton>
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </Typography>
            </Box>

            {/* Tags */}
            <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
              What stood out? (Optional)
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {FEEDBACK_TAGS.map(tag => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
                  color={selectedTags.includes(tag) ? 'primary' : 'default'}
                  onClick={() => toggleTag(tag)}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>

            {/* Comment */}
            <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
              Additional Comments (Optional)
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Share your experience, suggestions for improvement, or what you loved..."
              inputProps={{ maxLength: 500 }}
              helperText={`${comment.length}/500`}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {submitted ? (
          <Button onClick={handleClose} variant="contained">Done</Button>
        ) : (
          <>
            <Button onClick={handleClose} disabled={loading}>Skip</Button>
            <Button onClick={handleSubmit} variant="contained" disabled={loading || rating === 0}>
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Submit Feedback'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
