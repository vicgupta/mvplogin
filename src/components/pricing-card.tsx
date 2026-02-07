"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { useState } from "react";

interface PricingCardProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
  planKey?: string;
}

export function PricingCard({
  name,
  price,
  description,
  features,
  cta,
  popular,
  planKey,
}: PricingCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!user) {
      router.push("/signup");
      return;
    }

    if (!planKey) {
      // Free plan — just go to dashboard
      router.push("/dashboard");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey, userId: user.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card
      className={`flex flex-col ${popular ? "border-primary shadow-lg scale-105" : ""}`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{name}</CardTitle>
          {popular && <Badge>Popular</Badge>}
        </div>
        <div className="mt-2">
          <span className="text-4xl font-bold">{price}</span>
          {price !== "Free" && (
            <span className="text-muted-foreground">/mo</span>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-3">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          variant={popular ? "default" : "outline"}
          onClick={handleClick}
          disabled={loading}
        >
          {loading ? "Redirecting..." : cta}
        </Button>
      </CardFooter>
    </Card>
  );
}
