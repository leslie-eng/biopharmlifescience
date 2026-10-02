import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authApi } from "@/services/auth";
import { ApiError, getToken, setToken } from "@/services/http";
import type { AuthResult, AuthUser, Role, Session } from "@/types/api";

interface AuthCtx {
  user: AuthUser | null;
  session: Session | null;
  roles: Role[];
  rolesFetchFailed: boolean;
  loading: boolean;
  isStaff: boolean;
  /** The account has a temporary password; the API refuses dashboard calls until it is changed. */
  mustChangePassword: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null; mustChangePassword: boolean }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesFetchFailed, setRolesFetchFailed] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);

  const applyAuth = (result: AuthResult) => {
    setToken(result.token);
    setSession({ access_token: result.token });
    setUser(result.user);
    setRoles(result.roles);
    setMustChangePassword(result.must_change_password);
    setRolesFetchFailed(false);
  };

  const clearAuth = () => {
    setToken(null);
    setSession(null);
    setUser(null);
    setRoles([]);
    setMustChangePassword(false);
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
        const me = await authApi.me();
        if (cancelled) return;
        setUser(me.user);
        setRoles(me.roles);
        setMustChangePassword(me.must_change_password);
        setRolesFetchFailed(false);
      } catch (e: unknown) {
        if (cancelled) return;
        // Only a rejected session signs the user out; a network blip or API outage keeps the token.
        if (e instanceof ApiError && (e.status === 401 || e.status === 404)) clearAuth();
        else setSession(null);
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
      const result = await authApi.login({ email, password });
      applyAuth(result);
      return { error: null, mustChangePassword: result.must_change_password };
    } catch (e: unknown) {
      return { error: e instanceof Error ? e.message : "Sign in failed", mustChangePassword: false };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      applyAuth(await authApi.changePassword({ current_password: currentPassword, new_password: newPassword }));
      return { error: null };
    } catch (e: unknown) {
      return { error: e instanceof Error ? e.message : "Could not change password" };
    }
  };

  const signOut = async () => {
    clearAuth();
  };

  const isStaff = roles.includes("admin") || roles.includes("staff");

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        roles,
        rolesFetchFailed,
        loading,
        isStaff,
        mustChangePassword,
        signIn,
        changePassword,
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
