import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { z } from "zod";

const signInSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(1, "Password required").max(72),
});

function dashboardRedirectTarget(from: unknown): string {
  if (typeof from !== "string" || !from.startsWith("/dashboard")) return "/dashboard/overview";
  return from;
}

const StaffAuth = () => {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [siForm, setSiForm] = useState({ email: "", password: "" });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signInSchema.safeParse(siForm);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error, mustChangePassword } = await signIn(parsed.data.email, parsed.data.password);
    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    const state = location.state as { from?: string } | null;
    const target = dashboardRedirectTarget(state?.from);
    if (mustChangePassword) {
      nav("/staff/change-password", { state: { from: target } });
      return;
    }
    toast.success("Welcome back!");
    nav(target);
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex bg-gradient-brand p-12 text-white items-end">
        <div>
          <ShieldCheck className="h-10 w-10 mb-6" />
          <h1 className="text-4xl font-bold leading-tight">Staff &amp; operations</h1>
          <p className="mt-3 text-white/85 max-w-md">
            Administrator and staff access only — inventory, orders, POS, and reporting.
          </p>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center p-6 gap-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Staff sign in</CardTitle>
            <CardDescription>
              Administrator and staff access only — use your work credentials to open the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="mt-2 space-y-3">
              <div className="space-y-1.5">
                <Label>Work email</Label>
                <Input
                  type="email"
                  autoComplete="username"
                  required
                  value={siForm.email}
                  onChange={(e) => setSiForm({ ...siForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <Input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={siForm.password}
                  onChange={(e) => setSiForm({ ...siForm, password: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in…" : "Sign in to dashboard"}
              </Button>
            </form>
            <p className="mt-4 text-xs text-muted-foreground">
              Need an account? Ask an administrator to create one for you.
            </p>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground max-w-md">
          <Link to="/" className="underline hover:text-primary">
            ← Back to storefront
          </Link>
        </p>
      </div>
    </div>
  );
};

export default StaffAuth;
