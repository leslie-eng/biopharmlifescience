import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { z } from "zod";

const signInSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 chars").max(72),
});
const signUpSchema = signInSchema.extend({ fullName: z.string().trim().min(2).max(120) });

function dashboardRedirectTarget(from: unknown): string {
  if (typeof from !== "string" || !from.startsWith("/dashboard")) return "/dashboard/overview";
  return from;
}

const StaffAuth = () => {
  const { signIn, signUp } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [siForm, setSiForm] = useState({ email: "", password: "" });
  const [suForm, setSuForm] = useState({ email: "", password: "", fullName: "" });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signInSchema.safeParse(siForm);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await signIn(parsed.data.email, parsed.data.password);
    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Welcome back!");
    const state = location.state as { from?: string } | null;
    nav(dashboardRedirectTarget(state?.from));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signUpSchema.safeParse(suForm);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await signUp(parsed.data.email, parsed.data.password, parsed.data.fullName, {
      emailRedirectPath: "/staff",
    });
    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Account created — sign in to continue.");
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
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Staff signup</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
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
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="mt-2 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    The first account on a new installation becomes admin automatically. Additional operators need the
                    staff or admin role in the <code className="text-xs">user_roles</code> table.
                  </p>
                  <div className="space-y-1.5">
                    <Label>Full name</Label>
                    <Input
                      required
                      value={suForm.fullName}
                      onChange={(e) => setSuForm({ ...suForm, fullName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Work email</Label>
                    <Input
                      type="email"
                      required
                      autoComplete="email"
                      value={suForm.email}
                      onChange={(e) => setSuForm({ ...suForm, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      required
                      autoComplete="new-password"
                      value={suForm.password}
                      onChange={(e) => setSuForm({ ...suForm, password: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating…" : "Create staff account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
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
