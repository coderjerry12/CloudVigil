import { Box } from '@mui/material';

interface CloudVigilLogoProps {
  size?: number;
}

/**
 * CloudVigil logo — uses the actual brand logo image.
 * Works on both light and dark backgrounds due to the teal gradient colors.
 */
export default function CloudVigilLogo({ size = 36 }: CloudVigilLogoProps) {
  return (
    <Box
      component="img"
      src="/logo.png"
      alt="CloudVigil"
      sx={{
        width: size,
        height: size,
        objectFit: 'contain',
        flexShrink: 0,
      }}
    />
  );
}
