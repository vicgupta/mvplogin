# mvplogin User Guide

## What is mvplogin?

mvplogin is a full-stack starter template for building SaaS applications. It comes with authentication, payments, email, and AI content generation already wired up so you can focus on building your product.

---

## Getting Started

### 1. Create an Account

Visit the landing page and click **Get Started Free** or navigate to `/signup`.

You can sign up using:

- **Email and password** — Enter your name, email, and a password (minimum 8 characters). You'll be logged in automatically after signing up.
- **Google** — Click the Google button to authenticate with your Google account.
- **GitHub** — Click the GitHub button to authenticate with your GitHub account.

After signing up you'll be redirected to the dashboard.

### 2. Log In

If you already have an account, go to `/login` and sign in with your email/password or an OAuth provider.

If you try to access the dashboard without being logged in, you'll be redirected to the login page. After logging in you'll be sent back to the page you originally requested.

### 3. Log Out

Click **Log out** in the top-right corner of the dashboard header. You'll be redirected to the login page.

---

## Dashboard

The dashboard is your home base after logging in. It's accessible at `/dashboard` and shows three cards:

### Plan

Shows your current subscription plan (Free, Pro, or Enterprise) and whether it's active. Links to upgrade or manage your subscription.

### AI Usage

Shows how many AI requests you've made this month and your monthly limit. Resets on the 1st of each month. Links to the AI content generator.

### Account

Shows your email address and the date you joined. Links to the settings page.

---

## AI Content Generator

Available at `/dashboard/ai`. This tool lets you generate content using Claude AI.

### How to Use

1. **Choose a content type** — Select one of the preset modes:
   - **Blog post** — Generates engaging, well-structured blog content
   - **Marketing copy** — Generates compelling, conversion-focused copy
   - **Email draft** — Generates clear, concise professional emails
   - **General** — General-purpose assistant for any prompt

2. **Write your prompt** — Describe what you want in the text area. Be specific for better results.

3. **Click Generate** — The AI response streams in real-time in the output panel on the right.

4. **Stop generation** — Click the **Stop** button at any time to cancel a generation in progress.

### Tips

- Be specific in your prompts. "Write a blog post about remote work productivity tips for engineers" works better than "Write a blog post."
- The content type selector changes the AI's behavior behind the scenes, so choosing the right one matters.
- Each generation uses one AI request from your monthly quota.

---

## Subscription Plans

mvplogin offers three plans:

| Feature | Free | Pro ($29/mo) | Enterprise ($99/mo) |
|---------|------|--------------|---------------------|
| Users | Up to 100 | Unlimited | Unlimited |
| AI features | Basic | Advanced | Advanced |
| Support | Community | Priority email | Dedicated |
| Branding | Default | Custom | Custom |
| SLA | No | No | Yes |
| Custom integrations | No | No | Yes |

### How to Subscribe

1. Go to the **Pricing** section on the landing page or click **Upgrade** on your dashboard.
2. Click the plan you want (Pro or Enterprise).
3. You'll be redirected to a secure Stripe Checkout page.
4. Enter your payment details and confirm.
5. After successful payment you'll be redirected back to your dashboard with your new plan active.

### How to Manage Your Subscription

1. Go to **Dashboard > Settings**.
2. Under the **Subscription** card, click **Manage subscription**.
3. You'll be redirected to the Stripe Customer Portal where you can:
   - Update your payment method
   - View invoices and payment history
   - Change your plan
   - Cancel your subscription

### What Happens When You Cancel

- Your plan remains active until the end of the current billing period.
- After that, you'll be downgraded to the Free plan.
- You won't lose any data, but you'll lose access to paid features.

---

## Settings

Available at `/dashboard/settings`.

### Profile

- **Email** — Displayed but cannot be changed from this page.
- **Name** — Update your display name and click **Save changes**.

### Subscription

- Shows your current plan and subscription status.
- **Active subscribers** — Click **Manage subscription** to open the Stripe Customer Portal.
- **Free users** — Click **Upgrade plan** to view pricing options.

---

## Navigation

### Landing Page (Public)

The top navigation bar shows:

- **mvplogin** logo — Links back to the landing page.
- **Pricing** — Scrolls to the pricing section.
- **Log in** / **Get Started** — Shown when you're not logged in.
- **Dashboard** — Shown when you're logged in, links to your dashboard.

### Dashboard (Authenticated)

The dashboard navigation bar shows:

- **mvplogin** logo — Links to the dashboard home.
- **Dashboard** — Dashboard home page.
- **AI** — AI content generator.
- **Settings** — Account and subscription settings.
- **Your email** — Displayed on the right.
- **Log out** — Signs you out.

---

## Troubleshooting

### I can't log in

- Make sure you're using the correct email and password.
- Passwords must be at least 8 characters.
- If you signed up with Google or GitHub, use that same method to log in.

### OAuth login isn't working

- Make sure pop-ups are not blocked in your browser. PocketBase OAuth opens a pop-up window for authentication.
- If the window closes without logging you in, try again or use email/password instead.

### My subscription isn't showing as active

- It can take a few seconds for Stripe to send the confirmation webhook. Refresh the page.
- Check your email for a payment confirmation from Stripe.
- Go to Settings and verify your subscription status.

### AI generation isn't working

- Check that you haven't exceeded your monthly AI request limit.
- If you get an error, try a shorter or simpler prompt.
- If the issue persists, contact support.

### The page shows "Loading..." and never finishes

- Try refreshing the page.
- Clear your browser cookies for this site and log in again.
- Check that PocketBase is running and accessible.
