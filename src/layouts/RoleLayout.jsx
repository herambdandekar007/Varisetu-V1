import { Outlet, useLocation } from 'react-router-dom';
import { Suspense } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import PilgrimSidebar from '../components/sidebars/PilgrimSidebar';
import VolunteerSidebar from '../components/sidebars/VolunteerSidebar';
import MedicalSidebar from '../components/sidebars/MedicalSidebar';
import PoliceSidebar from '../components/sidebars/PoliceSidebar';
import MunicipalitySidebar from '../components/sidebars/MunicipalitySidebar';
import TopBar from '../components/navbar/TopBar';
import NotificationDrawer from '../components/notifications/NotificationDrawer';
import MobileNavigation from '../components/sidebars/MobileNavigation';
import DeveloperMode from '../components/dev/DeveloperMode';
import { SkeletonPage } from '../components/common/Skeleton';

const sidebarMap = {
  pilgrim: PilgrimSidebar,
  volunteer: VolunteerSidebar,
  medical: MedicalSidebar,
  police: PoliceSidebar,
  municipality: MunicipalitySidebar,
};

export default function RoleLayout() {
  const location = useLocation();
  const { role } = useAuth();
  const { isAccessibilityMode } = useApp();
  const roleId = role || 'pilgrim';
  const SidebarComponent = sidebarMap[roleId] || PilgrimSidebar;

  return (
    <div className={isAccessibilityMode ? 'accessibility-mode min-h-screen bg-cloud' : 'min-h-screen bg-cloud'}>
      <SidebarComponent />
      <div className="min-h-screen lg:pl-[250px]">
        <TopBar />
        <main key={location.pathname} className="mx-auto max-w-[1700px] px-5 pb-24 pt-7 sm:px-8 lg:px-10">
          <Suspense fallback={<SkeletonPage />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <MobileNavigation />
      <NotificationDrawer />
      <DeveloperMode />
    </div>
  );
}
