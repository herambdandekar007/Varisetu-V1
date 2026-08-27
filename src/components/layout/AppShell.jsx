import { Outlet, useLocation } from 'react-router-dom';
import { Suspense } from 'react';
import Sidebar, { MobileNavigation } from '../sidebar/Sidebar';
import TopBar from '../navbar/TopBar';
import NotificationDrawer from '../notifications/NotificationDrawer';
import { useApp } from '../../context/AppContext';
import { SkeletonPage } from '../common/Skeleton';

export default function AppShell() {
  const location = useLocation();
  const { isAccessibilityMode } = useApp();

  return (
    <div className={isAccessibilityMode ? 'accessibility-mode min-h-screen bg-cloud' : 'min-h-screen bg-cloud'}>
      <Sidebar />

      <div className="min-h-screen lg:pl-[250px]">
        <TopBar />

        <main
          key={location.pathname}
          className="mx-auto max-w-[1700px] px-5 pb-24 pt-7 sm:px-8 lg:px-10"
        >
          <Suspense fallback={<SkeletonPage />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <MobileNavigation />
      <NotificationDrawer />
    </div>
  );
}
