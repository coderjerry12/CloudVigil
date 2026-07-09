import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  QrCodeScanner,
  CheckCircle,
  Error as ErrorIcon,
  Replay,
} from '@mui/icons-material';
import { AppLayout } from '../../../components/layout';
import { useProcessCheckin } from '../hooks/useCheckin';
import type { CheckinPayload } from '../types';

export default function QRScannerPage() {
  const { processCheckin, isLoading, error, result, reset } = useProcessCheckin();
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<unknown>(null);

  const startScanner = async () => {
    reset();
    setScanError(null);
    setScanning(true);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleScanResult(decodedText);
          scanner.stop().catch(() => {});
          setScanning(false);
        },
        () => {
          // Ignore scan failures (no QR found in frame)
        }
      );
    } catch (err) {
      setScanError('Camera access denied or not available. Please allow camera permissions.');
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    try {
      const scanner = html5QrCodeRef.current as { stop: () => Promise<void> } | null;
      if (scanner) await scanner.stop();
    } catch {
      // ignore
    }
    setScanning(false);
  };

  const handleScanResult = async (decodedText: string) => {
    try {
      const payload: CheckinPayload = JSON.parse(decodedText);
      if (!payload.registrationId || !payload.eventId || !payload.attendeeId) {
        setScanError('Invalid QR code format. Missing required fields.');
        return;
      }
      await processCheckin(payload);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setScanError('Invalid QR code. Not a valid CloudVigil ticket.');
      }
      // API errors handled by the hook
    }
  };

  // Manual input fallback (for testing without camera)
  const [manualInput, setManualInput] = useState('');
  const handleManualCheckin = async () => {
    if (!manualInput.trim()) return;
    try {
      const payload: CheckinPayload = JSON.parse(manualInput);
      await processCheckin(payload);
      setManualInput('');
    } catch (err) {
      if (err instanceof SyntaxError) {
        setScanError('Invalid JSON format');
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <AppLayout title="QR Check-In">
      <Box sx={{ maxWidth: 600, mx: 'auto' }}>
        {/* Scanner Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <QrCodeScanner sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h3" gutterBottom>
              Scan QR Code
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Point the camera at an attendee's QR ticket to check them in.
            </Typography>

            {/* Camera viewport */}
            <Box
              id="qr-reader"
              ref={scannerRef}
              sx={{
                width: '100%',
                maxWidth: 400,
                mx: 'auto',
                mb: 2,
                borderRadius: 2,
                overflow: 'hidden',
                minHeight: scanning ? 300 : 0,
              }}
            />

            {/* Scanner controls */}
            {!scanning && !result && (
              <Button
                variant="contained"
                size="large"
                onClick={startScanner}
                sx={{ minWidth: 200 }}
              >
                Start Scanner
              </Button>
            )}

            {scanning && (
              <Button variant="outlined" onClick={stopScanner}>
                Stop Scanner
              </Button>
            )}

            {isLoading && (
              <Box sx={{ mt: 2 }}>
                <CircularProgress size={24} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Processing check-in...
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Success Result */}
        {result && (
          <Alert
            severity="success"
            icon={<CheckCircle />}
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" startIcon={<Replay />} onClick={() => { reset(); startScanner(); }}>
                Scan Next
              </Button>
            }
          >
            <Typography variant="body2" fontWeight={600}>
              {result.message}
            </Typography>
            <Typography variant="body2">
              {result.attendance.attendeeName} — {result.attendance.eventTitle}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Checked in at {new Date(result.attendance.checkedInAt).toLocaleTimeString()}
            </Typography>
          </Alert>
        )}

        {/* Error */}
        {(error || scanError) && (
          <Alert
            severity="error"
            icon={<ErrorIcon />}
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" startIcon={<Replay />} onClick={() => { reset(); setScanError(null); startScanner(); }}>
                Try Again
              </Button>
            }
          >
            {error || scanError}
          </Alert>
        )}

        {/* Manual input fallback */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 1 }}>
              Manual Check-In (Testing)
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
              Paste QR code JSON data for testing without a camera.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <input
                type="text"
                placeholder='{"registrationId":"...","eventId":"...","attendeeId":"..."}'
                value={manualInput}
                onChange={e => setManualInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1.5px solid #E0E0E0',
                  fontSize: '0.8rem',
                  fontFamily: 'monospace',
                }}
              />
              <Button
                variant="outlined"
                onClick={handleManualCheckin}
                disabled={isLoading || !manualInput.trim()}
              >
                Check In
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </AppLayout>
  );
}
