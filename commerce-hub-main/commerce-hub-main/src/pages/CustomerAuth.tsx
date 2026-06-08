import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ShoppingBag } from "lucide-react";
import { z } from "zod";

const signInSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 chars").max(72),
});
const signUpSchema = signInSchema.extend({ fullName: z.string().trim().min(2).max(120) });

function safeCustomerRedirect(from: unknown): string {
  if (typeof from !== "string" || !from.startsWith("/")) return "/";
  if (from.startsWith("/dashboard") || from.startsWith("/staff") || from === "/account") return "/";
  return from;
}

const CustomerAuth = () => {
  const { signIn, signUp, signOut, user, isStaff, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [siForm, setSiForm] = useState({ email: "", password: "" });
  const [suForm, setSuForm] = useState({ email: "", password: "", fullName: "" });

  useEffect(() => {
    if (authLoading || !user || !isStaff) return;
    toast.info("Staff accounts use the operations portal.", {
      description: "Redirecting…",
    });
    nav("/staff", { replace: true });
  }, [user, isStaff, authLoading, nav]);

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
    toast.success("Signed in!");
    const state = location.state as { from?: string } | null;
    const target = safeCustomerRedirect(state?.from);
    if (target !== location.pathname) nav(target, { replace: true });
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
      emailRedirectPath: "/account",
    });
    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Account created. Check your email if confirmation is required, then sign in.");
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex bg-muted p-12 items-end border-r border-border">
        <div>
          <ShoppingBag className="h-10 w-10 mb-6 text-primary" />
          <h1 className="text-4xl font-bold font-display text-primary leading-tight">Your clinic account</h1>
          <p className="mt-3 text-muted-foreground max-w-md leading-relaxed">
            Sign in or register to manage your clinic account and orders.
          </p>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center p-6 gap-6">
        {!authLoading && user && !isStaff ? (
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Your account</CardTitle>
              <CardDescription>Signed in as {user.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full">
                <Link to="/">Continue shopping</Link>
              </Button>
              <Button variant="outline" className="w-full" type="button" onClick={() => void signOut()}>
                Sign out
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Ordering staff?{" "}
                <Link to="/staff" className="underline font-medium text-primary">
                  Operations portal
                </Link>
              </p>
            </CardContent>
          </Card>
        ) : (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Customer sign in</CardTitle>
            <CardDescription>
              Biolink storefront — medical consumables for facilities.{" "}
              <Link to="/staff" className="underline font-medium text-primary">
                Staff / admin sign in
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Register</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="mt-2 space-y-3">
                  <div className="space-y-1.5">
                    <Label>Email</Label>
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
                    {loading ? "Signing in…" : "Sign in"}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="mt-2 space-y-3">
                  <div className="space-y-1.5">
                    <Label>Full name</Label>
                    <Input
                      required
                      value={suForm.fullName}
                      onChange={(e) => setSuForm({ ...suForm, fullName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
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
                    {loading ? "Creating…" : "Create customer account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        )}
        <p className="text-center text-xs text-muted-foreground">
          <Link to="/" className="underline hover:text-primary">
            ← Continue shopping
          </Link>
        </p>
      </div>
    </div>
  );
};

export default CustomerAuth;
