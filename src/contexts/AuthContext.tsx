import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Profile, College, UserRole } from '@/types/database.types';
import { RECOGNIZED_COLLEGES, getCollegeById, getAllColleges } from '@/services/collegesService';

export const DEFAULT_COLLEGE: College = RECOGNIZED_COLLEGES[0];

export const ASHU_USER = {
  user: {
    id: 'usr-ashu-devops-01',
    app_metadata: { provider: 'email' },
    user_metadata: {
      full_name: 'Ashu DevOps',
      username: 'ashu.devops',
      role: 'student',
    },
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00.000Z',
    email: 'ashu.devops@campusgram.edu',
    phone: '+91 98765 43210',
    role: 'authenticated',
    updated_at: new Date().toISOString(),
  } as unknown as User,
  profile: {
    id: 'usr-ashu-devops-01',
    full_name: 'Ashu DevOps',
    username: 'ashu.devops',
    email: 'ashu.devops@campusgram.edu',
    phone: '+91 98765 43210',
    profile_photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    cover_photo: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
    college_id: 'col-iitb',
    college: DEFAULT_COLLEGE,
    course: 'B.Tech Computer Science & Engineering',
    branch: 'DevOps & Systems Engineering',
    year: 'Final Year',
    bio: 'DevOps Specialist & Campus Community Lead. Building high-availability cloud systems, automation pipelines, and student dev tools.',
    skills: ['Kubernetes', 'Docker', 'Terraform', 'CI/CD', 'TypeScript', 'PostgreSQL', 'Cloud Architecture'],
    interests: ['Cloud Architecture', 'Open Source', 'Hackathons', 'High Scale Systems'],
    is_verified: true,
    phone_verified: true,
    onboarding_step: 5,
    onboarding_completed: true,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: new Date().toISOString(),
  } as Profile,
  roles: ['student', 'college_admin', 'club_admin'] as UserRole[],
  password: '12345678',
};

export const BUSINESS_USER = {
  user: {
    id: 'usr-business-partner-01',
    app_metadata: { provider: 'email' },
    user_metadata: {
      full_name: 'Campus Tech Partner',
      username: 'business.partner',
      role: 'business',
    },
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00.000Z',
    email: 'business@campusgram.com',
    phone: '+91 98989 89898',
    role: 'authenticated',
    updated_at: new Date().toISOString(),
  } as unknown as User,
  profile: {
    id: 'usr-business-partner-01',
    full_name: 'Campus Tech Partner',
    username: 'business.partner',
    email: 'business@campusgram.com',
    phone: '+91 98989 89898',
    profile_photo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&auto=format&fit=crop&q=80',
    cover_photo: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&auto=format&fit=crop&q=80',
    college_id: 'col-iitb',
    college: DEFAULT_COLLEGE,
    course: 'Campus Partner & B2B Sponsor',
    branch: 'Tech Outreach & Recruitment',
    year: 'Verified Partner',
    bio: 'Official campus technology partner offering student discounts, technical certifications, and engineering hiring.',
    skills: ['Recruitment', 'Student Deals', 'Tech Hackathons'],
    interests: ['Hiring', 'Student Perks', 'Internships'],
    is_verified: true,
    phone_verified: true,
    onboarding_step: 5,
    onboarding_completed: true,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: new Date().toISOString(),
  } as Profile,
  roles: ['business', 'advertiser'] as UserRole[],
  password: '12345678',
};

export interface SignUpParams {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  collegeId?: string;
  course?: string;
  branch?: string;
  year?: string;
  role?: 'student' | 'business';
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  college: College | null;
  roles: UserRole[];
  isLoading: boolean;
  isConfigured: boolean;
  signUp: (params: SignUpParams) => Promise<{ data?: any; error?: AuthError | Error | null }>;
  signIn: (identifier: string, password: string) => Promise<{ data?: any; error?: AuthError | Error | null; isBusiness?: boolean }>;
  signOut: () => Promise<{ error?: AuthError | Error | null }>;
  sendPhoneOtp: (phone: string) => Promise<{ error?: AuthError | Error | null }>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ error?: AuthError | Error | null }>;
  sendPasswordReset: (email: string) => Promise<{ error?: AuthError | Error | null }>;
  updatePassword: (password: string) => Promise<{ error?: AuthError | Error | null }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error?: Error | null }>;
  refreshProfile: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  switchCampus: (college: College) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [college, setCollege] = useState<College | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session: strictly check if a user is logged in
  const initLocalSession = useCallback(() => {
    try {
      const stored = localStorage.getItem('campusgram_auth_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.user && parsed.profile) {
          setUser(parsed.user);
          setProfile(parsed.profile);
          setCollege(parsed.college || getCollegeById(parsed.profile?.college_id) || DEFAULT_COLLEGE);
          setRoles(parsed.roles || ['student']);
          return true;
        }
      }
    } catch (e) {
      console.warn('Failed to parse local auth user:', e);
    }
    // No logged in user -> stay logged out
    setUser(null);
    setProfile(null);
    setCollege(null);
    setRoles([]);
    return false;
  }, []);

  // Fetch complete profile & role data for the logged-in user from Supabase if active
  const fetchUserData = useCallback(async (currentUserId: string, currentUser?: User) => {
    if (!isSupabaseConfigured) {
      initLocalSession();
      return;
    }

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*, college:colleges(*)')
        .eq('id', currentUserId)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
      }

      if (profileData) {
        setProfile(profileData as Profile);
        if (profileData.college) {
          setCollege(profileData.college as College);
        } else {
          setCollege(getCollegeById(profileData.college_id));
        }
      } else if (currentUser) {
        const meta = currentUser.user_metadata || {};
        const assignedCollege = getCollegeById(meta.college_id);
        const fallbackProfile: Profile = {
          id: currentUser.id,
          full_name: meta.full_name || 'Ashu DevOps',
          username: meta.username || 'ashu.devops',
          email: currentUser.email || 'ashu.devops@campusgram.edu',
          phone: currentUser.phone || meta.phone || null,
          profile_photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
          cover_photo: null,
          college_id: meta.college_id || assignedCollege.id,
          college: assignedCollege,
          course: meta.course || 'B.Tech Computer Science',
          branch: meta.branch || 'DevOps & Systems',
          year: meta.year || 'Final Year',
          bio: 'DevOps & Systems Engineering',
          skills: ['DevOps', 'Cloud', 'Kubernetes'],
          interests: ['Tech', 'Campus'],
          is_verified: true,
          phone_verified: true,
          onboarding_step: 5,
          onboarding_completed: true,
          created_at: currentUser.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setProfile(fallbackProfile);
        setCollege(assignedCollege);
      }

      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUserId);

      if (rolesData && rolesData.length > 0) {
        setRoles(rolesData.map((r: { role: UserRole }) => r.role));
      } else {
        setRoles(['student', 'college_admin']);
      }
    } catch (err) {
      console.warn('Failed to load user profile details, using local fallback:', err);
      initLocalSession();
    }
  }, [initLocalSession]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchUserData(user.id, user);
    }
  }, [user, fetchUserData]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      initLocalSession();
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);
        fetchUserData(currentSession.user.id, currentSession.user);
      } else {
        initLocalSession();
      }
      setIsLoading(false);
    }).catch(() => {
      initLocalSession();
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (newSession?.user) {
        setSession(newSession);
        setUser(newSession.user);
        await fetchUserData(newSession.user.id, newSession.user);
      } else {
        initLocalSession();
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserData, initLocalSession]);

  // Sign up
  const signUp = async ({
    fullName,
    email,
    phone,
    password,
    collegeId,
    course,
    branch,
    year,
    role = 'student',
  }: SignUpParams) => {
    const cleanUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
    const assignedCollege = getCollegeById(collegeId);

    const newLocalUser: User = {
      id: `usr-${Date.now()}`,
      app_metadata: { provider: 'email' },
      user_metadata: { full_name: fullName, username: cleanUsername, role, college_id: assignedCollege.id },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email,
      phone,
      role: 'authenticated',
      updated_at: new Date().toISOString(),
    } as unknown as User;

    const newProfile: Profile = {
      id: newLocalUser.id,
      full_name: fullName,
      username: cleanUsername,
      email,
      phone: phone || null,
      profile_photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
      cover_photo: null,
      college_id: assignedCollege.id,
      college: assignedCollege,
      course: course || 'Computer Science',
      branch: branch || 'Engineering',
      year: year || '1st Year',
      bio: `Student at ${assignedCollege.name}. Excited to join CampusGram!`,
      skills: [],
      interests: [],
      is_verified: true,
      phone_verified: false,
      onboarding_step: 1, // Start onboarding at step 1: Campus confirmation
      onboarding_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newRoles: UserRole[] = role === 'business' ? ['business', 'advertiser'] : ['student'];

    setUser(newLocalUser);
    setProfile(newProfile);
    setCollege(assignedCollege);
    setRoles(newRoles);

    localStorage.setItem(
      'campusgram_auth_user',
      JSON.stringify({
        user: newLocalUser,
        profile: newProfile,
        college: assignedCollege,
        roles: newRoles,
      })
    );

    try {
      const existing = JSON.parse(localStorage.getItem('campusgram_registered_users') || '[]');
      existing.push({
        email,
        username: cleanUsername,
        password,
        user: newLocalUser,
        profile: newProfile,
        college: assignedCollege,
        roles: newRoles,
      });
      localStorage.setItem('campusgram_registered_users', JSON.stringify(existing));
    } catch (e) {
      console.warn('Failed to store registered user:', e);
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              username: cleanUsername,
              phone,
              college_id: assignedCollege.id,
              course,
              branch,
              year,
            },
          },
        });
      } catch (err) {
        console.warn('Supabase remote signup notice:', err);
      }
    }

    return { data: { user: newLocalUser }, error: null };
  };

  // Sign in: recognizes ashu.devops, business accounts, or registered users
  const signIn = async (identifier: string, password: string) => {
    const cleanId = identifier.trim().toLowerCase();

    // 1. Check Ashu DevOps account
    if (
      cleanId === 'ashu.devops' ||
      cleanId === 'ashu.devops@campusgram.edu' ||
      cleanId === 'ashu' ||
      cleanId === 'ashu@campusgram.edu'
    ) {
      if (password === ASHU_USER.password || password === '12345678') {
        setUser(ASHU_USER.user);
        setProfile(ASHU_USER.profile);
        setCollege(DEFAULT_COLLEGE);
        setRoles(ASHU_USER.roles);
        localStorage.setItem(
          'campusgram_auth_user',
          JSON.stringify({
            user: ASHU_USER.user,
            profile: ASHU_USER.profile,
            college: DEFAULT_COLLEGE,
            roles: ASHU_USER.roles,
          })
        );
        return { data: { user: ASHU_USER.user }, error: null, isBusiness: false };
      } else {
        return { error: new Error('Invalid password for ashu.devops. Correct password is: 12345678') };
      }
    }

    // 2. Check Campus Business / Advertiser account
    if (
      cleanId === 'business@campusgram.com' ||
      cleanId === 'business' ||
      cleanId === 'business.partner' ||
      cleanId === 'advertiser' ||
      cleanId === 'advertiser@campusgram.com'
    ) {
      if (password === BUSINESS_USER.password || password === '12345678') {
        setUser(BUSINESS_USER.user);
        setProfile(BUSINESS_USER.profile);
        setCollege(DEFAULT_COLLEGE);
        setRoles(BUSINESS_USER.roles);
        localStorage.setItem(
          'campusgram_auth_user',
          JSON.stringify({
            user: BUSINESS_USER.user,
            profile: BUSINESS_USER.profile,
            college: DEFAULT_COLLEGE,
            roles: BUSINESS_USER.roles,
          })
        );
        return { data: { user: BUSINESS_USER.user }, error: null, isBusiness: true };
      } else {
        return { error: new Error('Invalid password for business account. Correct password is: 12345678') };
      }
    }

    // 3. Check custom registered users from localStorage
    try {
      const registered = JSON.parse(localStorage.getItem('campusgram_registered_users') || '[]');
      const found = registered.find(
        (u: any) =>
          u.email.toLowerCase() === cleanId ||
          u.username.toLowerCase() === cleanId
      );

      if (found) {
        if (found.password === password) {
          const userCollege = found.college || getCollegeById(found.profile?.college_id) || DEFAULT_COLLEGE;
          setUser(found.user);
          setProfile(found.profile);
          setCollege(userCollege);
          setRoles(found.roles);
          localStorage.setItem(
            'campusgram_auth_user',
            JSON.stringify({
              user: found.user,
              profile: found.profile,
              college: userCollege,
              roles: found.roles,
            })
          );
          const isBiz = found.roles.includes('business') || found.roles.includes('advertiser');
          return { data: { user: found.user }, error: null, isBusiness: isBiz };
        } else {
          return { error: new Error('Incorrect password. Please try again.') };
        }
      }
    } catch (e) {
      console.warn('Error reading registered users:', e);
    }

    // 4. Fallback to Supabase if configured
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanId.includes('@') ? cleanId : `${cleanId}@campusgram.edu`,
          password,
        });
        if (error) return { error };
        return { data, error: null };
      } catch (err: any) {
        return { error: err };
      }
    }

    return { error: new Error('User not found. Use "ashu.devops" (Pass: 12345678) or sign up for an account.') };
  };

  // Sign out: reset state and remove local session
  const signOut = async () => {
    localStorage.removeItem('campusgram_auth_user');
    setUser(null);
    setProfile(null);
    setCollege(null);
    setRoles([]);
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    return { error: null };
  };

  const switchCampus = (newCollege: College) => {
    setCollege(newCollege);
    if (profile) {
      const updated = { ...profile, college_id: newCollege.id, college: newCollege };
      setProfile(updated);
      if (user) {
        localStorage.setItem(
          'campusgram_auth_user',
          JSON.stringify({
            user,
            profile: updated,
            college: newCollege,
            roles,
          })
        );
      }
    }
  };

  const sendPhoneOtp = async (phone: string) => {
    if (isSupabaseConfigured) {
      return await supabase.auth.signInWithOtp({ phone });
    }
    return { error: null };
  };

  const verifyPhoneOtp = async (_phone: string, _token: string) => {
    if (profile) {
      setProfile({ ...profile, phone_verified: true });
    }
    return { error: null };
  };

  const sendPasswordReset = async (_email: string) => {
    return { error: null };
  };

  const updatePassword = async (_password: string) => {
    return { error: null };
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (profile) {
      const updated = { ...profile, ...updates, updated_at: new Date().toISOString() };
      setProfile(updated);
      if (user) {
        localStorage.setItem(
          'campusgram_auth_user',
          JSON.stringify({
            user,
            profile: updated,
            college: college || DEFAULT_COLLEGE,
            roles,
          })
        );
      }
    }
    return { error: null };
  };

  const hasRole = (role: UserRole) => {
    return roles.includes(role) || roles.includes('super_admin');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        college,
        roles,
        isLoading,
        isConfigured: isSupabaseConfigured,
        signUp,
        signIn,
        signOut,
        sendPhoneOtp,
        verifyPhoneOtp,
        sendPasswordReset,
        updatePassword,
        updateProfile,
        refreshProfile,
        hasRole,
        switchCampus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
