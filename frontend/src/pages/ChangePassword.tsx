import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { z } from "zod";

// Mirrors app/security.py password_problem on the API, which has the final say.
const MIN_PASSWORD_LENGTH = 12;

const changeSchema = z
  .object({
    current: z.string().min(1, "Enter your current password"),
    next: z.string().min(MIN_PASSWORD_LENGTH, `New password must be at least ${MIN_PASSWORD_LENGTH} characters`).max(72),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, { message: "New passwords do not match" })
  .refine((v) => v.next !== v.current, { message: "New password must be different from the current one" });

function dashboardRedirectTarget(from: unknown): string {
  if (typeof from !== "string" || !from.startsWith("/dashboard")) return "/dashboard/overview";
  return from;
}

const ChangePassword = () => {
  const { user, loading: authLoading, mustChangePassword, changePassword } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });

  if (authLoading) {
    return (
      <div className="p-8 space-y-3">
        <Skeleton className="h-12 w-1/3" />
      </div>
    );
  }
  if (!user) return <Navigate to="/staff" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = changeSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSaving(true);
    const { error } = await changePassword(parsed.data.current, parsed.data.next);
    setSaving(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Password changed");
    const state = location.state as { from?: string } | null;
    nav(dashboardRedirectTarget(state?.from), { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{mustChangePassword ? "Set a new password" : "Change password"}</CardTitle>
          <CardDescription>
            {mustChangePassword
              ? "You signed in with a temporary password. Choose your own before opening the dashboard."
              : `Signed in as ${user.email}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Lets password managers save the new password against the right account. */}
            <input type="hidden" autoComplete="username" value={user.email} readOnly />
            <div className="space-y-1.5">
              <Label htmlFor="current-password">Current password</Label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                required
                value={form.current}
                onChange={(e) => setForm({ ...form, current: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={MIN_PASSWORD_LENGTH}
                value={form.next}
                onChange={(e) => setForm({ ...form, next: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">At least {MIN_PASSWORD_LENGTH} characters.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Repeat new password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Saving…" : "Save new password"}
            </Button>
          </form>
          {!mustChangePassword && (
            <p className="mt-4 text-xs text-muted-foreground">
              <Link to="/dashboard/overview" className="underline hover:text-primary">
                ← Back to dashboard
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChangePassword;
