import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type AppRole =
  | 'sirket_sahibi'
  | 'genel_mudur'
  | 'muhasebe'
  | 'uretim_sefi'
  | 'teknisyen'
  | 'servis_personeli'
  | 'saha_montaj'
  | 'uretim_personeli';

// Custom user type based on profiles table
export interface CustomUser {
  id: string;
  email: string;
  ad: string | null;
  soyad: string | null;
  unvan: string | null;
}

interface AuthContextType {
  user: CustomUser | null;
  // Session is kept for compatibility but effectively mirrors user existence
  session: boolean;
  roles: AppRole[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, ad: string, soyad: string) => Promise<{ error: any }>; // Not implemented for custom auth
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to map Turkish titles to AppRoles
const mapTitleToRole = (title: string | null): AppRole[] => {
  if (!title) return [];
  const normalized = title.toLowerCase().trim();

  // Admin / Yönetici mapping
  if (normalized.includes('yonetici') || normalized.includes('admin') || normalized.includes('yönetici')) {
    return ['sirket_sahibi', 'genel_mudur'];
  }

  if (normalized.includes('sahibi')) return ['sirket_sahibi'];
  if (normalized.includes('genel') && normalized.includes('mudur')) return ['genel_mudur'];
  if (normalized.includes('muhasebe')) return ['muhasebe'];
  if (normalized.includes('uretim') && normalized.includes('sefi')) return ['uretim_sefi'];
  if (normalized.includes('teknisyen')) return ['teknisyen'];
  if (normalized.includes('servis')) return ['servis_personeli'];
  if (normalized.includes('saha') || normalized.includes('montaj')) return ['saha_montaj'];
  if (normalized.includes('uretim') && normalized.includes('personeli')) return ['uretim_personeli'];

  return [];
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage on mount
    const storedUser = localStorage.getItem('app_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setRoles(mapTitleToRole(parsedUser.unvan));
      } catch (e) {
        console.error("Failed to parse stored user", e);
        localStorage.removeItem('app_user');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Query the 'personel' table directly (Correct table name from user schema)
      // Type assertion is used because local types.ts is out of sync with actual DB schema
      const { data, error } = await (supabase
        .from('personel' as any)
        .select('*')
        .eq('mail', email)
        .eq('sifre', password)
        .single()) as { data: any, error: any };

      if (error) {
        // If no rows found, .single() returns an error code specific to that
        if (error.code === 'PGRST116') {
          return { error: { message: 'Email veya şifre hatalı' } };
        }
        return { error };
      }

      if (data) {
        // Map table row to CustomUser
        const loggedUser: CustomUser = {
          id: String(data.personel_id), // 'personel' table uses 'personel_id'
          email: data.mail || email,
          ad: data.ad,
          soyad: data.soyad,
          unvan: data.unvan
        };

        setUser(loggedUser);
        setRoles(mapTitleToRole(loggedUser.unvan));
        localStorage.setItem('app_user', JSON.stringify(loggedUser));
        return { error: null };
      }

      return { error: { message: 'Bilinmeyen bir hata oluştu' } };
    } catch (err: any) {
      return { error: { message: err.message || 'Giriş yapılamadı' } };
    }
  };

  const signUp = async () => {
    return { error: { message: "Kayıt olma özelliği bu sistemde devre dışıdır. Yönetici ile iletişime geçin." } };
  };

  const signOut = async () => {
    localStorage.removeItem('app_user');
    setUser(null);
    setRoles([]);
  };

  const hasRole = (role: AppRole) => {
    return roles.includes(role);
  };

  const hasAnyRole = (checkRoles: AppRole[]) => {
    return checkRoles.some(role => roles.includes(role));
  };

  return (
    <AuthContext.Provider value={{
      user,
      session: !!user,
      roles,
      loading,
      signIn,
      signUp,
      signOut,
      hasRole,
      hasAnyRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}