"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Profile {
  plan: string;
  subscription_status: string;
}

export default function DashboardPage() {
  const { user, pb } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!user) return;
    pb.collection("profiles")
      .getFirstListItem(`user="${user.id}"`)
      .then((p) => setProfile(p as unknown as Profile))
      .catch(() => setProfile({ plan: "free", subscription_status: "none" }));
  }, [user, pb]);

  const planLabel =
    profile?.plan === "pro"
      ? "Pro"
      : profile?.plan === "enterprise"
        ? "Enterprise"
        : "Free";
  const isSubscribed = profile?.subscription_status === "active";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Welcome back, {user?.name || user?.email}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Plan</CardTitle>
            <CardDescription>Your current subscription</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{planLabel}</span>
              {isSubscribed && <Badge>Active</Badge>}
            </div>
          </CardContent>
          <CardFooter>
            {isSubscribed ? (
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/settings">Manage</Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <a href="/#pricing">Upgrade</a>
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Usage</CardTitle>
            <CardDescription>Requests this month</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0 / 100</p>
            <p className="text-sm text-muted-foreground">
              Resets on the 1st of each month
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/ai">Try AI</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Your profile details</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{user?.email}</p>
            <p className="text-sm text-muted-foreground">
              Member since{" "}
              {user?.created
                ? new Date(user.created).toLocaleDateString()
                : "—"}
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/settings">Settings</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
