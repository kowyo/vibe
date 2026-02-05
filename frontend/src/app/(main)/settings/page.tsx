"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { deleteAllProjects } from "@/hooks/generation/services/projects-list-service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { VercelLogo } from "@/components/social-icons";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    setError(null);
    setShowConfirmDialog(false);

    try {
      await deleteAllProjects(session);
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete projects");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="bg-card/95 backdrop-blur border-b border-border/40">
        <div className="flex h-12 w-full items-center px-2">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-px bg-border/60 mx-1" />
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="flex h-6 w-6 items-center justify-center">
                <VercelLogo />
              </div>
              <p className="text-sm font-semibold text-foreground">Vibe</p>
            </Link>
            <div className="h-4 w-px bg-border/60 mx-1" />
            <h1 className="text-sm font-medium text-muted-foreground">Settings</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-2xl mx-auto px-4 py-8 sm:py-10 space-y-8">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Account Settings</h2>
            <p className="text-sm text-muted-foreground">
              Manage your account preferences and project data.
            </p>
          </div>

          <Card className="border-border/80 bg-card/80 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/40 bg-muted/30">
              <CardTitle className="text-destructive flex items-center gap-2 text-lg">
                <Trash2 className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Irreversible actions for your projects and data.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-border/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Delete all projects</div>
                  <div className="text-sm text-muted-foreground max-w-md">
                    Permanently delete all your projects and their associated files. This action
                    cannot be undone.
                  </div>
                </div>

                <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full sm:w-auto"
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete All"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Are you absolutely sure?</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. This will permanently delete all your projects
                        and remove the data from our servers.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={handleDeleteAll} disabled={isDeleting}>
                        {isDeleting ? "Deleting..." : "Yes, delete everything"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {error && (
                <div className="p-6">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-destructive/[0.03] px-6 py-4 border-t border-destructive/10">
              <p className="text-xs text-muted-foreground">
                Please be certain. You will lose access to all your generated code and previews.
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
