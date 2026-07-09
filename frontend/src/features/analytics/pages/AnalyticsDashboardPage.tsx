import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Skeleton,
  Alert,
  Chip,
} from '@mui/material';
import {
  People,
  HowToReg,
  CheckCircle,
  Warning,
  TrendingUp,
  Security,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { AppLayout } from '../../../components/layout';
import { useAnalytics } from '../hooks/useAnalytics';

const COLORS = ['#DC2626', '#2563EB', '#EA580C', '#16A34A'];

export default function AnalyticsDashboardPage() {
  const { data, isLoading, error } = useAnalytics();

  if (isLoading) {
    return (
      <AppLayout title="Analytics">
        <Grid container spacing={2.5}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={120} />
            </Grid>
          ))}
          <Grid item xs={12}><Skeleton variant="rounded" height={300} /></Grid>
        </Grid>
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout title="Analytics">
        <Alert severity="error">{error || 'Failed to load analytics'}</Alert>
      </AppLayout>
    );
  }

  // Prepare chart data
  const incidentPieData = Object.entries(data.safety.byType).map(([name, value]) => ({ name, value }));

  const capacityBarData = data.registrations.byEvent.map(e => ({
    name: e.title.length > 15 ? e.title.slice(0, 15) + '...' : e.title,
    registrations: e.registrations,
    capacity: e.capacity,
  }));

  const attendancePieData = [
    { name: 'Checked In', value: data.attendance.totalCheckIns },
    { name: 'No-Show', value: data.attendance.noShowCount },
  ];

  return (
    <AppLayout title="Analytics">
      {/* KPI Cards Row 1 */}
      <Typography variant="overline" sx={{ color: 'primary.main', mb: 1.5, display: 'block' }}>
        Attendance & Registration
      </Typography>
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <KPICard icon={<HowToReg />} value={data.attendance.totalRegistrations} label="Total Registrations" color="#3B82F6" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KPICard icon={<CheckCircle />} value={data.attendance.totalCheckIns} label="Check-Ins" color="#22C55E" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KPICard icon={<TrendingUp />} value={`${data.attendance.attendanceRate}%`} label="Attendance Rate" color="#14B8A6" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KPICard icon={<People />} value={data.attendance.noShowCount} label="No-Shows" color="#F59E0B" />
        </Grid>
      </Grid>

      {/* KPI Cards Row 2 — Safety */}
      <Typography variant="overline" sx={{ color: 'primary.main', mb: 1.5, display: 'block' }}>
        Safety & Incidents
      </Typography>
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <KPICard icon={<Security />} value={data.safety.totalIncidents} label="Total Incidents" color="#EF4444" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KPICard icon={<Warning />} value={data.safety.escalatedIncidents} label="Escalated" color="#EA580C" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KPICard icon={<CheckCircle />} value={data.safety.resolvedIncidents} label="Resolved" color="#22C55E" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KPICard icon={<TrendingUp />} value={`${data.safety.avgResolutionTimeMinutes}m`} label="Avg Resolution" color="#3B82F6" />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {/* Event Capacity Bar Chart */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h4" sx={{ mb: 2 }}>Event Capacity Utilization</Typography>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={capacityBarData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="registrations" fill="#14B8A6" radius={[4, 4, 0, 0]} name="Registrations" />
                  <Bar dataKey="capacity" fill="#E0E0E0" radius={[4, 4, 0, 0]} name="Capacity" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Incident Distribution Pie Chart */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h4" sx={{ mb: 2 }}>Incidents by Type</Typography>
              {data.safety.totalIncidents === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">No incidents recorded</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={incidentPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {incidentPieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Attendance Pie + Notifications/Recommendations */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {/* Attendance Donut */}
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h4" sx={{ mb: 2 }}>Attendance Breakdown</Typography>
              {data.attendance.totalRegistrations === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body2" color="text.secondary">No data</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={attendancePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                    >
                      <Cell fill="#22C55E" />
                      <Cell fill="#F59E0B" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Notifications */}
        <Grid item xs={12} sm={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h4" sx={{ mb: 2 }}>Notifications</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="h2">{data.notifications.totalNotifications}</Typography>
                  <Typography variant="caption" color="text.secondary">Total Sent</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Box>
                    <Typography variant="h4" color="success.main">{data.notifications.readNotifications}</Typography>
                    <Typography variant="caption" color="text.secondary">Read</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h4" color="warning.main">{data.notifications.unreadNotifications}</Typography>
                    <Typography variant="caption" color="text.secondary">Unread</Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recommendations */}
        <Grid item xs={12} sm={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h4" sx={{ mb: 2 }}>Recommendations</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Box>
                    <Typography variant="h3">{data.recommendations.totalClicks}</Typography>
                    <Typography variant="caption" color="text.secondary">Clicks</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h3">{data.recommendations.totalRegistrations}</Typography>
                    <Typography variant="caption" color="text.secondary">Registrations</Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="h2" color="secondary.main">{data.recommendations.conversionRate}%</Typography>
                  <Typography variant="caption" color="text.secondary">Conversion Rate</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Event Insights */}
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h4" sx={{ mb: 2 }}>Event Insights</Typography>
          <Grid container spacing={2}>
            {data.insights.mostPopularEvent && (
              <Grid item xs={12} sm={4}>
                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">Most Popular</Typography>
                  <Typography variant="body1" fontWeight={600}>{data.insights.mostPopularEvent.title}</Typography>
                  <Chip label={`${data.insights.mostPopularEvent.registrations} registrations`} size="small" sx={{ mt: 0.5 }} />
                </Box>
              </Grid>
            )}
            {data.insights.highestAttendance && (
              <Grid item xs={12} sm={4}>
                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">Highest Attendance</Typography>
                  <Typography variant="body1" fontWeight={600}>{data.insights.highestAttendance.title}</Typography>
                  <Chip label={`${data.insights.highestAttendance.checkIns} check-ins`} size="small" color="success" sx={{ mt: 0.5 }} />
                </Box>
              </Grid>
            )}
            {data.insights.mostIncidentsEvent && data.insights.mostIncidentsEvent.incidents > 0 && (
              <Grid item xs={12} sm={4}>
                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">Most Incidents</Typography>
                  <Typography variant="body1" fontWeight={600}>{data.insights.mostIncidentsEvent.title}</Typography>
                  <Chip label={`${data.insights.mostIncidentsEvent.incidents} incidents`} size="small" color="error" sx={{ mt: 0.5 }} />
                </Box>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
    </AppLayout>
  );
}

// --- KPI Card ---
function KPICard({ icon, value, label, color }: { icon: React.ReactNode; value: string | number; label: string; color: string }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, mb: 1.5 }}>
          {icon}
        </Box>
        <Typography variant="h3" sx={{ mb: 0.25 }}>{value}</Typography>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
      </CardContent>
    </Card>
  );
}
