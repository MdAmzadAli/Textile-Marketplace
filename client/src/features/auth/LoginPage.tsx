import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Input, Card } from "../../components/ui";
import { Navbar } from "../../components/layout/Navbar";
import { PageContainer } from "../../components/layout/PageContainer";
import { useAuth } from "../../hooks/useAuth";
import { useToastStore } from "../../store/toastStore";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const push = useToastStore((s) => s.push);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      push(err?.response?.data?.error?.message || "Login failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar />
      <PageContainer className="max-w-md flex-1 flex items-center">
        <Card className="w-full">
          <h1 className="font-display text-2xl mb-6">Log in</h1>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" loading={loading} className="mt-2">
              Log in
            </Button>
          </form>
          <p className="text-sm text-text-muted mt-4">
            No account?{" "}
            <Link to="/register" className="text-primary underline">
              Sign up
            </Link>
          </p>
        </Card>
      </PageContainer>
    </div>
  );
}
