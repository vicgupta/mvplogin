import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Nav } from "@/components/nav";
import { PricingCard } from "@/components/pricing-card";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl">
          Ship your MVP
          <br />
          <span className="text-muted-foreground">in days, not months</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Auth, payments, email, AI, and a database — all wired up and ready to
          go. Stop rebuilding boilerplate. Start building your product.
        </p>
        <div className="mt-8 flex gap-4">
          <Button size="lg" asChild>
            <Link href="/signup">Get Started Free</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="#pricing">View Pricing</Link>
          </Button>
        </div>
      </section>

      <Separator />

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-center text-3xl font-bold">Everything you need</h2>
        <p className="mt-3 text-center text-muted-foreground">
          A production-ready foundation so you can focus on what makes your app
          unique.
        </p>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Auth",
              desc: "Email/password and OAuth login via PocketBase. Session management out of the box.",
            },
            {
              title: "Database",
              desc: "PocketBase with SQLite — zero config, admin UI, REST API, and realtime subscriptions.",
            },
            {
              title: "Payments",
              desc: "Stripe Checkout and Customer Portal for subscriptions. Webhook sync included.",
            },
            {
              title: "Email",
              desc: "Transactional emails with Resend. Welcome emails, receipts, and notifications.",
            },
            {
              title: "AI",
              desc: "Claude API integration for content generation, analysis, and lead scoring.",
            },
            {
              title: "Hosting",
              desc: "Deploy to Vercel in one click. PocketBase runs on any VPS or Fly.io.",
            },
          ].map((feature) => (
            <div key={feature.title} className="rounded-lg border p-6">
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* Pricing */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <h2 className="text-center text-3xl font-bold">
          Simple, transparent pricing
        </h2>
        <p className="mt-3 text-center text-muted-foreground">
          Start free. Upgrade when you&apos;re ready.
        </p>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
          <PricingCard
            name="Free"
            price="Free"
            description="For side projects and experimentation."
            features={[
              "Up to 100 users",
              "Basic AI features",
              "Community support",
            ]}
            cta="Get Started"
          />
          <PricingCard
            name="Pro"
            price="$29"
            description="For growing products that need more."
            features={[
              "Unlimited users",
              "Advanced AI features",
              "Priority email support",
              "Custom branding",
            ]}
            cta="Subscribe"
            planKey="pro"
            popular
          />
          <PricingCard
            name="Enterprise"
            price="$99"
            description="For teams that need everything."
            features={[
              "Everything in Pro",
              "Dedicated support",
              "SLA guarantee",
              "Custom integrations",
            ]}
            cta="Contact Us"
            planKey="enterprise"
          />
        </div>
      </section>

      <Footer />
    </div>
  );
}
