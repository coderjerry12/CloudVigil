import { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  IconButton,
  Alert,
} from '@mui/material';
import {
  CloudUpload,
  Close,
  Image as ImageIcon,
} from '@mui/icons-material';
import { eventService } from '../services/eventService';

interface EventImageUploadProps {
  /** Current image URL (if already uploaded) */
  imageUrl: string | null;
  /** Callback when image is uploaded successfully */
  onImageUploaded: (imageUrl: string) => void;
  /** Callback when image is removed */
  onImageRemoved: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default function EventImageUpload({ imageUrl, onImageUploaded, onImageRemoved }: EventImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setError(null);

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Invalid file type. Please use JPG, PNG, WebP, or GIF.');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File too large. Maximum size is 5MB.');
      return;
    }

    setUploading(true);
    try {
      // 1. Get pre-signed URL from backend
      const { uploadUrl, imageUrl: publicUrl } = await eventService.getUploadUrl(file.name, file.type);

      // 2. Upload file directly to S3
      await eventService.uploadFileToS3(uploadUrl, file);

      // 3. Notify parent with the public URL
      onImageUploaded(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  // If image is already uploaded, show preview
  if (imageUrl) {
    return (
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            position: 'relative',
            borderRadius: 3,
            overflow: 'hidden',
            maxHeight: 240,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <img
            src={imageUrl}
            alt="Event banner"
            style={{
              width: '100%',
              height: 240,
              objectFit: 'cover',
              display: 'block',
            }}
          />
          <IconButton
            onClick={onImageRemoved}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'rgba(0,0,0,0.6)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
            }}
            size="small"
            aria-label="Remove image"
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Click × to remove and upload a different image.
        </Typography>
      </Box>
    );
  }

  // Upload area
  return (
    <Box sx={{ mb: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        sx={{
          border: '2px dashed',
          borderColor: dragOver ? 'primary.main' : 'divider',
          borderRadius: 3,
          p: 4,
          textAlign: 'center',
          cursor: uploading ? 'default' : 'pointer',
          bgcolor: dragOver ? 'rgba(27, 94, 75, 0.04)' : 'background.paper',
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: 'primary.light',
            bgcolor: 'rgba(27, 94, 75, 0.02)',
          },
        }}
      >
        {uploading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary">
              Uploading image...
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: 'rgba(20, 184, 166, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ImageIcon sx={{ fontSize: 28, color: 'secondary.main' }} />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={500}>
                Drag & drop an event banner image here
              </Typography>
              <Typography variant="caption" color="text.secondary">
                or click to browse. JPG, PNG, WebP, GIF — max 5MB
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CloudUpload />}
              onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
            >
              Choose File
            </Button>
          </Box>
        )}
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleInputChange}
        style={{ display: 'none' }}
        aria-label="Upload event image"
      />
    </Box>
  );
}
