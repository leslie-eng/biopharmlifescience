import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/** Shown when signed in but dashboard access is denied (account has no staff or admin role). */
export const DashboardAccessDenied = () => {
  const { user, rolesFetchFailed } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 bg-muted/30">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-6 w-6" />
            <CardTitle>Dashboard access</CardTitle>
          </div>
          <CardDescription>
            Signed in as <span className="font-medium text-foreground">{user?.email ?? "—"}</span> but this account does
            not have admin or staff privileges for this app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          {rolesFetchFailed ? (
            <p>We couldn't check your access right now. Please try again in a moment.</p>
          ) : (
            <p>Ask an administrator to give your account staff access.</p>
          )}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button asChild variant="default">
              <Link to="/admin">Staff sign in</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Back to store</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
