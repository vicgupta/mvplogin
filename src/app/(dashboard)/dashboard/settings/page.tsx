"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Profile {
  id: string;
  plan: string;
  subscription_status: string;
  stripe_customer_id: string;
}

export default function SettingsPage() {
  const { user, pb } = useAuth();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    pb.collection("profiles")
      .getFirstListItem(`user="${user.id}"`)
      .then((p) => setProfile(p as unknown as Profile))
      .catch(() => {
        // No profile yet — user is on free plan
        setProfile({ id: "", plan: "free", subscription_status: "none", stripe_customer_id: "" });
      });
  }, [user, pb]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      await pb.collection("users").update(user!.id, { name });
      setMessage("Profile updated.");
    } catch {
      setMessage("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleManageSubscription() {
    if (!user) return;
    setPortalLoading(true);

    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Portal error:", err);
    } finally {
      setPortalLoading(false);
    }
  }

  const planLabel = profile?.plan === "free" ? "Free" : profile?.plan === "pro" ? "Pro" : profile?.plan === "enterprise" ? "Enterprise" : "Free";
  const isSubscribed = profile?.subscription_status === "active";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your account settings
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <form onSubmit={handleSave}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            {message && (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Separator />

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose your preferred theme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {([
              { value: "light", label: "Light", icon: Sun },
              { value: "dark", label: "Dark", icon: Moon },
              { value: "system", label: "System", icon: Monitor },
            ] as const).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`flex flex-1 flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:bg-accent ${
                  theme === value
                    ? "border-primary bg-accent"
                    : "border-border"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Manage your plan and billing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm">Current plan:</span>
            <Badge variant={isSubscribed ? "default" : "secondary"}>
              {planLabel}
            </Badge>
          </div>
          {profile?.subscription_status && profile.subscription_status !== "none" && (
            <p className="text-sm text-muted-foreground">
              Status: {profile.subscription_status}
            </p>
          )}
        </CardContent>
        <CardFooter>
          {isSubscribed ? (
            <Button
              variant="outline"
              onClick={handleManageSubscription}
              disabled={portalLoading}
            >
              {portalLoading ? "Redirecting..." : "Manage subscription"}
            </Button>
          ) : (
            <Button variant="outline" asChild>
              <a href="/#pricing">Upgrade plan</a>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
