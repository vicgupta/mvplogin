import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Sign up — mvplogin" };

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <AuthForm mode="signup" />
    </div>
  );
}
