import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { getHomeRoute } from '../../routes/roleRoutes';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { role } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-cloud px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md text-center"
      >
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-red-50">
          <ShieldExclamationIcon className="h-9 w-9 text-red-500" />
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-ink">Access Restricted</h1>
        <p className="mt-3 text-base text-slate-500">
          You don't have permission to access this section.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button variant="outline" onClick={() => navigate('/')}>Go Home</Button>
          <Button onClick={() => navigate(getHomeRoute(typeof role === 'string' ? role : role?.id))}>Go To My Dashboard</Button>
        </div>
      </motion.div>
    </div>
  );
}
