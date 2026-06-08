import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/** Shown when signed in but dashboard access is denied (strict production without staff role). */
export const DashboardAccessDenied = () => {
  const { user, roles, rolesFetchFailed } = useAuth();

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
            <p>
              We could not load roles from the API (check <code className="rounded bg-muted px-1 text-xs">VITE_API_URL</code> and the{" "}
              <code className="rounded bg-muted px-1 text-xs">user_roles</code> table). For local preview/builds you can set{" "}
              <code className="rounded bg-muted px-1 text-xs">VITE_ALLOW_DASHBOARD_WITHOUT_ROLE=true</code> in{" "}
              <code className="rounded bg-muted px-1 text-xs">.env</code>.
            </p>
          ) : roles.length > 0 ? (
            <p>
              Current roles:{" "}
              <span className="font-mono text-foreground">{roles.join(", ")}</span>. Ask an admin to add{" "}
              <strong>admin</strong> or <strong>staff</strong> in the MySQL <code className="text-xs">user_roles</code> table,
              or temporarily set{" "}
              <code className="rounded bg-muted px-1 text-xs">VITE_ALLOW_DASHBOARD_WITHOUT_ROLE=true</code>.
            </p>
          ) : (
            <p>
              No roles returned for this user. Ensure a row exists in{" "}
              <code className="rounded bg-muted px-1 text-xs">user_roles</code>, or enable the env flag above for
              development.
            </p>
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
