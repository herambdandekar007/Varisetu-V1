import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import RoleLayout from './layouts/RoleLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import RoleProtectedRoute from './routes/RoleProtectedRoute';
import { SkeletonPage } from './components/common/Skeleton';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import SetupProfilePage from './pages/Auth/SetupProfilePage';
import SelectRolePage from './pages/Auth/SelectRolePage';
import ComingSoonPage from './pages/Auth/ComingSoonPage';
import UnauthorizedPage from './pages/Unauthorized/UnauthorizedPage';
import AuthCallbackPage from './pages/Auth/AuthCallbackPage';
import ProfilePage from './pages/Profile/ProfilePage';
import SettingsPage from './pages/Settings/SettingsPage';
import VolunteerDashboard from './pages/Volunteer/VolunteerDashboard';
import ZonePage from './pages/Volunteer/ZonePage';
import RequestsPage from './pages/Volunteer/RequestsPage';
import PilgrimsPage from './pages/Volunteer/PilgrimsPage';
import TasksPage from './pages/Volunteer/TasksPage';
import MedicalDashboard from './pages/Medical/MedicalDashboard';
import CasesPage from './pages/Medical/CasesPage';
import DoctorsPage from './pages/Medical/DoctorsPage';
import AmbulancesPage from './pages/Medical/AmbulancesPage';
import CampsPage from './pages/Medical/CampsPage';
import MedicinePage from './pages/Medical/MedicinePage';
import PoliceDashboard from './pages/Police/PoliceDashboard';
import RiskZonesPage from './pages/Police/RiskZonesPage';
import BarricadesPage from './pages/Police/BarricadesPage';
import PatrolsPage from './pages/Police/PatrolsPage';
import LostPersonsPage from './pages/Police/LostPersonsPage';
import EmergencyCallsPage from './pages/Police/EmergencyCallsPage';
import MunicipalityDashboard from './pages/Municipality/MunicipalityDashboard';
import MunResourcesPage from './pages/Municipality/ResourcesPage';
import SupplyPage from './pages/Municipality/SupplyPage';
import WeatherPage from './pages/Municipality/WeatherPage';
import ForecastPage from './pages/Municipality/ForecastPage';

const LandingPage = lazy(() => import('./pages/Landing/LandingPage'));
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage'));
const CrowdPage = lazy(() => import('./pages/Crowd/CrowdPage'));
const NavigationPage = lazy(() => import('./pages/Navigation/NavigationPage'));
const ResourcesPage = lazy(() => import('./pages/Resources/ResourcesPage'));
const TrackingPage = lazy(() => import('./pages/Tracking/TrackingPage'));
const AnalyticsPage = lazy(() => import('./pages/Analytics/AnalyticsPage'));
const EmergencyPage = lazy(() => import('./pages/Emergency/EmergencyPage'));
const AdminPage = lazy(() => import('./pages/Admin/AdminPage'));
const OldVolunteerPage = lazy(() => import('./pages/Volunteer/VolunteerPage'));
const AccessibilityPage = lazy(() => import('./pages/Accessibility/AccessibilityPage'));
const GroupPage = lazy(() => import('./pages/Pilgrim/GroupPage'));
const StayPage = lazy(() => import('./pages/Stay/StayPage'));
const HealthPage = lazy(() => import('./pages/Pilgrim/HealthPage'));
const AlertsPage = lazy(() => import('./pages/Alerts/AlertsPage'));

function LazyPage({ Component }) {
  return (
    <Suspense fallback={<SkeletonPage />}>
      <Component />
    </Suspense>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LazyPage Component={LandingPage} />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/setup-profile" element={<SetupProfilePage />} />
      <Route path="/select-role" element={<SelectRolePage />} />
      <Route path="/coming-soon" element={<ComingSoonPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Authenticated routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleLayout />}>
          {/* Shared authenticated routes */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/accessibility" element={<LazyPage Component={AccessibilityPage} />} />

          {/* Pilgrim only */}
          <Route element={<RoleProtectedRoute allowedRoles={['pilgrim']} />}>
            <Route path="/dashboard" element={<LazyPage Component={DashboardPage} />} />
            <Route path="/tracking" element={<LazyPage Component={TrackingPage} />} />
            <Route path="/emergency" element={<LazyPage Component={EmergencyPage} />} />
            <Route path="/alerts" element={<LazyPage Component={AlertsPage} />} />
            <Route path="/group" element={<LazyPage Component={GroupPage} />} />
            <Route path="/health" element={<LazyPage Component={HealthPage} />} />
            <Route path="/stay" element={<LazyPage Component={StayPage} />} />
            <Route path="/admin" element={<LazyPage Component={AdminPage} />} />
            <Route path="/volunteer" element={<LazyPage Component={OldVolunteerPage} />} />
          </Route>

          {/* Shared: Pilgrim + Controller (police) */}
          <Route element={<RoleProtectedRoute allowedRoles={['pilgrim', 'police']} />}>
            <Route path="/crowd" element={<LazyPage Component={CrowdPage} />} />
            <Route path="/navigation" element={<LazyPage Component={NavigationPage} />} />
            <Route path="/resources" element={<LazyPage Component={ResourcesPage} />} />
            <Route path="/analytics" element={<LazyPage Component={AnalyticsPage} />} />
          </Route>

          {/* Volunteer only */}
          <Route element={<RoleProtectedRoute allowedRoles={['volunteer']} />}>
            <Route path="/volunteer/dashboard" element={<VolunteerDashboard />} />
            <Route path="/volunteer/zone" element={<ZonePage />} />
            <Route path="/volunteer/requests" element={<RequestsPage />} />
            <Route path="/volunteer/pilgrims" element={<PilgrimsPage />} />
            <Route path="/volunteer/tasks" element={<TasksPage />} />
          </Route>

          {/* Medical only */}
          <Route element={<RoleProtectedRoute allowedRoles={['medical']} />}>
            <Route path="/medical/dashboard" element={<MedicalDashboard />} />
            <Route path="/medical/cases" element={<CasesPage />} />
            <Route path="/medical/doctors" element={<DoctorsPage />} />
            <Route path="/medical/ambulances" element={<AmbulancesPage />} />
            <Route path="/medical/camps" element={<CampsPage />} />
            <Route path="/medical/medicine" element={<MedicinePage />} />
          </Route>

          {/* Police only */}
          <Route element={<RoleProtectedRoute allowedRoles={['police']} />}>
            <Route path="/controller/dashboard" element={<PoliceDashboard />} />
            <Route path="/controller/risk-zones" element={<RiskZonesPage />} />
            <Route path="/controller/barricades" element={<BarricadesPage />} />
            <Route path="/controller/patrols" element={<PatrolsPage />} />
            <Route path="/controller/lost-persons" element={<LostPersonsPage />} />
            <Route path="/controller/emergency" element={<EmergencyCallsPage />} />
          </Route>

          {/* Municipality only */}
          <Route element={<RoleProtectedRoute allowedRoles={['municipality']} />}>
            <Route path="/municipality/dashboard" element={<MunicipalityDashboard />} />
            <Route path="/municipality/resources" element={<MunResourcesPage />} />
            <Route path="/municipality/supply" element={<SupplyPage />} />
            <Route path="/municipality/weather" element={<WeatherPage />} />
            <Route path="/municipality/forecast" element={<ForecastPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
