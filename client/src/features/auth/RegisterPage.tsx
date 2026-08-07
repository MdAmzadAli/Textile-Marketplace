import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Input, Card } from "../../components/ui";
import { Navbar } from "../../components/layout/Navbar";
import { PageContainer } from "../../components/layout/PageContainer";
import { useAuth } from "../../hooks/useAuth";
import { useToastStore } from "../../store/toastStore";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const push = useToastStore((s) => s.push);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      push("Password must be at least 8 characters", "error");
      return;
    }
    setLoading(true);
    try {
      await register(email, password, "buyer");
    } catch (err: any) {
      push(err?.response?.data?.error?.message || "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar />
      <PageContainer className="max-w-md flex-1 flex items-center">
        <Card className="w-full">
          <h1 className="font-display text-2xl mb-2">Create your account</h1>
          <p className="text-sm text-text-muted mb-6">Create a buyer account first. You can become a seller later from your profile.</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Password" type="password" required helperText="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button type="submit" loading={loading} className="mt-2">Create account</Button>
          </form>
          <p className="text-sm text-text-muted mt-4">Already have an account? <Link to="/login" className="text-primary underline">Log in</Link></p>
        </Card>
      </PageContainer>
    </div>
  );
}
