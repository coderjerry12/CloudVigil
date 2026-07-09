import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  Button,
  TextField,
  MenuItem,
} from '@mui/material';
import { DarkMode, Notifications, Security, Logout, Storage, Language } from '@mui/icons-material';
import { AppLayout } from '../components/layout';
import { useAuth } from '../auth/hooks/useAuth';
import { useThemeMode } from '../theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { supportedLanguages } from '../i18n';

export default function SettingsPage() {
  const { signOut } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <AppLayout title="Settings">
      <Box sx={{ width: '100%' }}>
        <Typography variant="h2" sx={{ mb: 0.5 }}>Portal Settings</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Configure security protocols, interface preferences, and system automation rules.
        </Typography>

        {/* Appearance */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 0 }}>
            {/* Section Header */}
            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <DarkMode sx={{ color: 'secondary.main', fontSize: 18 }} />
              <Typography variant="h4">{t('settings.theme')}</Typography>
            </Box>
            {/* Items */}
            <Box sx={{ px: 3, py: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>{t('settings.darkMode')}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('settings.themeDesc')}
                  </Typography>
                </Box>
                <Switch checked={mode === 'dark'} onChange={toggleTheme} color="primary" />
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Language */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Language sx={{ color: 'secondary.main', fontSize: 18 }} />
              <Typography variant="h4">{t('settings.language')}</Typography>
            </Box>
            <Box sx={{ px: 3, py: 2.5 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('settings.languageDesc')}
              </Typography>
              <TextField
                select
                value={i18n.language?.substring(0, 2) || 'en'}
                onChange={e => handleLanguageChange(e.target.value)}
                size="small"
                sx={{ minWidth: 220 }}
              >
                {supportedLanguages.map(lang => (
                  <MenuItem key={lang.code} value={lang.code}>
                    {lang.nativeLabel} ({lang.label})
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Notifications sx={{ color: 'secondary.main', fontSize: 18 }} />
              <Typography variant="h4">Notifications</Typography>
            </Box>
            <Box sx={{ px: 3, py: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>Push Notifications</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Receive notifications for registrations and alerts
                  </Typography>
                </Box>
                <Switch defaultChecked color="primary" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>Email Notifications</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Receive email for event reminders and updates
                  </Typography>
                </Box>
                <Switch defaultChecked color="primary" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>Safety Alerts</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Receive alerts for safety incidents and escalations
                  </Typography>
                </Box>
                <Switch defaultChecked color="primary" />
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Security sx={{ color: 'secondary.main', fontSize: 18 }} />
              <Typography variant="h4">Privacy & Security</Typography>
            </Box>
            <Box sx={{ px: 3, py: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>Share Location During Emergencies</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Automatically share location when reporting SOS incidents
                  </Typography>
                </Box>
                <Switch defaultChecked={false} color="primary" />
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Data & Analytics */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Storage sx={{ color: 'secondary.main', fontSize: 18 }} />
              <Typography variant="h4">Data & Analytics</Typography>
            </Box>
            <Box sx={{ px: 3, py: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>Export Activity Log</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Generate an encrypted report of all event activity and interactions
                  </Typography>
                </Box>
                <Button variant="outlined" size="small">Download Log</Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card sx={{ borderColor: 'error.main' }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Logout sx={{ color: 'error.main', fontSize: 18 }} />
              <Typography variant="h4" sx={{ color: 'error.main' }}>Account</Typography>
            </Box>
            <Box sx={{ px: 3, py: 2.5 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Sign out of your CloudVigil account on this device.
              </Typography>
              <Button variant="outlined" color="error" onClick={signOut}>
                Sign Out
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Footer actions */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button variant="text">Discard Changes</Button>
          <Button variant="contained">Save Changes</Button>
        </Box>
      </Box>
    </AppLayout>
  );
}
