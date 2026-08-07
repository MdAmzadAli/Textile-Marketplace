import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { KeyRound, Mail, ShoppingBag } from "lucide-react";
import { DashboardShell } from "../../../components/layout/DashboardShell";
import { Button, Card, Input } from "../../../components/ui";
import { SUPPLIER_SIDEBAR_LINKS } from "../supplierNav";
import { updateOwnEmail, updateOwnPassword } from "../../../services/users.api";
import { useAuth } from "../../../hooks/useAuth";
import { useAuthStore } from "../../../store/authStore";
import { useToastStore } from "../../../store/toastStore";

export default function SupplierAccountPage() {
  const { user, switchToBuyer } = useAuth();
  const updateEmail = useAuthStore((state) => state.updateEmail);
  const push = useToastStore((state) => state.push);
  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const emailMutation = useMutation({ mutationFn: () => updateOwnEmail(email), onSuccess: (result) => { updateEmail(result.email); push("Account email updated", "success"); }, onError: (error: any) => push(error?.response?.data?.error?.message || "Could not update email", "error") });
  const passwordMutation = useMutation({ mutationFn: () => updateOwnPassword(currentPassword, newPassword), onSuccess: () => { setCurrentPassword(""); setNewPassword(""); push("Password updated", "success"); }, onError: (error: any) => push(error?.response?.data?.error?.message || "Could not update password", "error") });

  return <DashboardShell links={SUPPLIER_SIDEBAR_LINKS} seller><div className="max-w-xl flex flex-col gap-5"><div><h1 className="font-display text-2xl">Seller account</h1><p className="text-sm text-text-muted mt-1">Your account is shared across buying and selling.</p></div><Card><h2 className="font-500 flex items-center gap-2 mb-4"><Mail className="h-4 w-4 text-primary" /> Email</h2><form className="flex flex-col gap-3" onSubmit={(event) => { event.preventDefault(); emailMutation.mutate(); }}><Input label="Account email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /><Button type="submit" loading={emailMutation.isPending}>Save email</Button></form></Card><Card><h2 className="font-500 flex items-center gap-2 mb-4"><KeyRound className="h-4 w-4 text-primary" /> Password</h2><form className="flex flex-col gap-3" onSubmit={(event) => { event.preventDefault(); passwordMutation.mutate(); }}><Input label="Current password" type="password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /><Input label="New password" type="password" required helperText="At least 8 characters" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /><Button type="submit" loading={passwordMutation.isPending}>Update password</Button></form></Card><Card><h2 className="font-500 mb-2">Buying mode</h2><p className="text-sm text-text-muted mb-4">Use the same account to browse, manage addresses, and place orders.</p><Button variant="secondary" onClick={() => switchToBuyer()}><ShoppingBag className="h-4 w-4" /> Switch to buying</Button></Card></div></DashboardShell>;
}
