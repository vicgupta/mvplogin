import { NextResponse } from "next/server";
import { resend, EMAIL_FROM } from "@/lib/resend";

type EmailTemplate = "welcome" | "payment_receipt";

interface EmailRequest {
  to: string;
  template: EmailTemplate;
  data?: Record<string, string>;
}

const templates: Record<
  EmailTemplate,
  (data?: Record<string, string>) => { subject: string; html: string }
> = {
  welcome: (data) => ({
    subject: "Welcome to mvplogin!",
    html: `
      <h1>Welcome, ${data?.name || "there"}!</h1>
      <p>Thanks for signing up. You're all set to start using mvplogin.</p>
      <p>Head to your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">dashboard</a> to get started.</p>
    `,
  }),

  payment_receipt: (data) => ({
    subject: "Payment received — mvplogin",
    html: `
      <h1>Payment confirmed</h1>
      <p>We've received your payment for the <strong>${data?.plan || "Pro"}</strong> plan.</p>
      <p>Amount: <strong>${data?.amount || "$29.00"}</strong></p>
      <p>Manage your subscription in <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings">settings</a>.</p>
    `,
  }),
};

export async function POST(request: Request) {
  try {
    const { to, template, data } = (await request.json()) as EmailRequest;

    const templateFn = templates[template];
    if (!templateFn) {
      return NextResponse.json(
        { error: "Unknown email template" },
        { status: 400 }
      );
    }

    const { subject, html } = templateFn(data);

    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    });

    return NextResponse.json({ success: true, id: result.data?.id });
  } catch (err) {
    console.error("Email send error:", err);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
