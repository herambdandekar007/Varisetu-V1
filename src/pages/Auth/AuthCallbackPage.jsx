import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/select-role');
      } else {
        navigate('/login');
      }
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <p className="text-slate-500">Completing sign in...</p>
    </div>
  );
}
