import { useState } from "react";
import { Modal, Button, Input } from "../ui";
import { useAuth } from "../../hooks/useAuth";
import { useAuthModalStore } from "../../store/authModalStore";
import { useToastStore } from "../../store/toastStore";
import { Role } from "../../types";
import { cn } from "../../utils/cn";

// Replaces the old "Sign in" dropdown: one click opens this modal straight
// to Sign up (the action most first-time visitors actually want), with Log
// in as an equally prominent tab rather than a buried link — so nobody who
// already has an account is punished by the signup-first default.
export function AuthModal() {
  const { isOpen, mode, redirectTo, close, setMode } = useAuthModalStore();
  const { login, register } = useAuth();
  const push = useToastStore((s) => s.push);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("buyer");
  const [loading, setLoading] = useState(false);

  function reset() {
    setEmail("");
    setPassword("");
    setRole("buyer");
    setLoading(false);
  }

  function handleClose() {
    reset();
    close();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "signup" && password.length < 8) {
      push("Password must be at least 8 characters", "error");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        await register(email, password, role, { redirectTo: redirectTo ?? undefined });
      } else {
        await login(email, password, { redirectTo: redirectTo ?? undefined });
      }
      reset();
      close();
    } catch (err: any) {
      push(err?.response?.data?.error?.message || `${mode === "signup" ? "Registration" : "Login"} failed`, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={isOpen} onClose={handleClose} size="sm">
      <div className="flex flex-col gap-5">
        {/* Tabs — equal visual weight, no default treated as "secondary" */}
        <div className="grid grid-cols-2 rounded-sm bg-bg p-1">
          {(["signup", "login"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "h-9 rounded-sm text-sm font-500 transition-fast",
                mode === m ? "bg-surface text-primary shadow-card" : "text-text-muted hover:text-text-primary"
              )}
            >
              {m === "signup" ? "Sign up" : "Log in"}
            </button>
          ))}
        </div>

        <div>
          <h2 className="font-display text-2xl text-text-primary">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h2>
          {redirectTo && (
            <p className="text-sm text-text-muted mt-1">
              {mode === "signup" ? "Create an account to complete checkout." : "Log in to complete checkout."}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "signup" && (
            <div>
              <p className="text-sm font-500 mb-2 text-text-primary">I am a</p>
              <div className="grid grid-cols-2 gap-2">
                {(["buyer", "supplier"] as Role[]).map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setRole(r)}
                    className={cn(
                      "px-3 py-2 rounded-sm border text-sm capitalize transition-fast",
                      role === r ? "bg-primary text-white border-primary" : "border-border hover:bg-bg"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Input
            label="Email"
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            required
            helperText={mode === "signup" ? "At least 8 characters" : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" loading={loading} className="mt-1">
            {mode === "signup" ? "Create account" : "Log in"}
          </Button>
        </form>

        <p className="text-sm text-text-muted text-center">
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <button type="button" onClick={() => setMode("login")} className="text-primary underline">
                Log in
              </button>
            </>
          ) : (
            <>
              No account?{" "}
              <button type="button" onClick={() => setMode("signup")} className="text-primary underline">
                Sign up
              </button>
            </>
          )}
        </p>
      </div>
    </Modal>
  );
}
