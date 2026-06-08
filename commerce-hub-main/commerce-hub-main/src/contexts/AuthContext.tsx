import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authApi, AuthUser, getToken, Role, Session, setToken } from "@/lib/api";

export type SignUpOptions = {
  emailRedirectPath?: string;
};

interface AuthCtx {
  user: AuthUser | null;
  session: Session | null;
  roles: Role[];
  rolesFetchFailed: boolean;
  loading: boolean;
  isStaff: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    options?: SignUpOptions
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesFetchFailed, setRolesFetchFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  const applyAuth = (token: string, nextUser: AuthUser, nextRoles: Role[]) => {
    setToken(token);
    setSession({ access_token: token });
    setUser(nextUser);
    setRoles(nextRoles);
    setRolesFetchFailed(false);
  };

  const clearAuth = () => {
    setToken(null);
    setSession(null);
    setUser(null);
    setRoles([]);
    setRolesFetchFailed(false);
  };

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      setSession({ access_token: token });
      try {
        const { user: me, roles: meRoles } = await authApi.me();
        if (cancelled) return;
        setUser(me);
        setRoles(meRoles);
        setRolesFetchFailed(false);
      } catch {
        if (cancelled) return;
        clearAuth();
        setRolesFetchFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { token, user: u, roles: r } = await authApi.login({ email, password });
      applyAuth(token, u, r);
      return { error: null };
    } catch (e: unknown) {
      return { error: e instanceof Error ? e.message : "Sign in failed" };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, _options?: SignUpOptions) => {
    try {
      const { token, user: u, roles: r } = await authApi.register({ email, password, fullName });
      applyAuth(token, u, r);
      return { error: null };
    } catch (e: unknown) {
      return { error: e instanceof Error ? e.message : "Sign up failed" };
    }
  };

  const signOut = async () => {
    clearAuth();
  };

  const staffFromRoles = roles.includes("admin") || roles.includes("staff");
  const emergencyBypass = import.meta.env.VITE_ALLOW_DASHBOARD_WITHOUT_ROLE === "true";
  const isStaff = staffFromRoles || (!!user && emergencyBypass);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        roles,
        rolesFetchFailed,
        loading,
        isStaff,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
