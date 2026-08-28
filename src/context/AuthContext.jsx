import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { locationService } from '../services/locationService';

const DB_ROLE_TO_UI_ROLE = {
  PILGRIM: 'pilgrim',
  CONTROLLER: 'police',
  police: 'police',
  VOLUNTEER: 'volunteer',
  medical: 'medical',
  municipality: 'municipality',
  ambulance_driver: 'ambulance_driver',
  warkari: 'pilgrim',
};

const UI_ROLE_TO_DB_ROLE = {
  pilgrim: 'PILGRIM',
  police: 'CONTROLLER',
  volunteer: 'VOLUNTEER',
  medical: 'medical',
  municipality: 'municipality',
  ambulance_driver: 'ambulance_driver',
};

const AuthContext = createContext({
  user: null,
  loading: true,
  signup: async () => ({ error: null }),
  login: async () => ({ error: null }),
  signInWithGoogle: async () => {},
  logout: async () => {},
});

async function fetchAndSetProfile(userId, setProfile, setRole) {
  if (!userId) {
    setProfile(null);
    setRole(null);
    return;
  }
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('[AuthContext] Fetch profile error:', error);
    return;
  }
  if (data) {
    setProfile(data);
    const mapped = data.role ? (DB_ROLE_TO_UI_ROLE[data.role] || data.role.toLowerCase()) : null;
    setRole(mapped);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      const u = session?.user ?? null;
      setUser(u);
      setLoading(false);
      locationService.bindUser(u?.id ?? null);
      if (u) fetchAndSetProfile(u.id, setProfile, setRole);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      const u = session?.user ?? null;
      setUser(u);
      locationService.bindUser(u?.id ?? null);
      if (u) {
        if (event !== 'TOKEN_REFRESHED') {
          fetchAndSetProfile(u.id, setProfile, setRole);
        }
      } else {
        setProfile(null);
        setRole(null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signup = async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  };

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    locationService.bindUser(null);
    setProfile(null);
    setRole(null);
  };

  const saveProfile = async (profileData) => {
    setProfile(profileData);
    if (profileData && user) {
      try {
        const patch = { ...profileData };
        delete patch.id;
        delete patch.created_at;
        delete patch.updated_at;
        await supabase.from('profiles').update(patch).eq('id', user.id);
      } catch (err) {
        console.error('[AuthContext] saveProfile update error:', err);
      }
    }
  };

  const selectRole = async (roleId) => {
    setRole(roleId);
    if (user?.id && roleId) {
      const dbRole = UI_ROLE_TO_DB_ROLE[roleId] || roleId || 'PILGRIM';
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ role: dbRole })
          .eq('id', user.id);
        if (error) console.error('[AuthContext] persist role error:', error);
        else {
          setProfile((prev) => (prev ? { ...prev, role: dbRole } : prev));
        }
      } catch (err) {
        console.error('[AuthContext] selectRole persist error:', err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signup,
        login,
        signInWithGoogle,
        logout,
        profile,
        role,
        isAuthenticated: !!user,
        saveProfile,
        selectRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
