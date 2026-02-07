import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Log in — mvplogin" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <AuthForm mode="login" />
    </div>
  );
}
