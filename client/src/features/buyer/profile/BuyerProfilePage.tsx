import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Store, User } from "lucide-react";
import { DashboardShell } from "../../../components/layout/DashboardShell";
import { Button, Card, EmptyState, Input, Modal, Skeleton } from "../../../components/ui";
import { BUYER_SIDEBAR_LINKS } from "../buyerNav";
import { getOwnProfile } from "../../../services/buyer-profile.api";
import { deactivateOwnAccount, updateOwnEmail } from "../../../services/users.api";
import { useAuth } from "../../../hooks/useAuth";
import { useAuthStore } from "../../../store/authStore";
import { useToastStore } from "../../../store/toastStore";

export default function BuyerProfilePage() {
  const profileQuery = useQuery({ queryKey: ["buyer-profile"], queryFn: getOwnProfile });
  const navigate = useNavigate();
  const { user, logout, becomeSeller } = useAuth();
  const updateEmail = useAuthStore((s) => s.updateEmail);
  const [emailOpen, setEmailOpen] = useState(false); const [email, setEmail] = useState(user?.email ?? "");
  const [sellerPasswordOpen, setSellerPasswordOpen] = useState(false); const [sellerPassword, setSellerPassword] = useState(""); const [sellerBusy, setSellerBusy] = useState(false);
  const push = useToastStore((s) => s.push);
  const deactivate = useMutation({
    mutationFn: deactivateOwnAccount,
    onSuccess: async () => { push("Account deleted", "info"); await logout(); },
    onError: () => push("Could not delete your account", "error"),
  });
  const emailMutation = useMutation({ mutationFn: () => updateOwnEmail(email), onSuccess: (result) => { updateEmail(result.email); setEmailOpen(false); push("Email updated", "success"); }, onError: (e: any) => push(e?.response?.data?.error?.message || "Could not update email", "error") });
  async function openSellerMode(password?: string) { setSellerBusy(true); try { await becomeSeller(password); } catch (error: any) { if (!password) setSellerPasswordOpen(true); else push(error?.response?.data?.error?.message || "Could not resume seller access", "error"); } finally { setSellerBusy(false); } }
  return <DashboardShell links={BUYER_SIDEBAR_LINKS}>
    <h1 className="font-display text-2xl mb-6">Profile</h1>
    {profileQuery.isLoading && <Skeleton variant="card" count={2} />}
    {profileQuery.isError && <EmptyState title="Couldn't load your profile" action={<Button onClick={() => profileQuery.refetch()}>Retry</Button>} />}
    {profileQuery.data && <div className="flex flex-col gap-6 max-w-2xl"><Card>
      <h2 className="font-500 flex items-center gap-2 mb-4"><User className="h-4 w-4 text-primary" /> Business preferences</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <p><span className="text-text-muted">Email</span><br /><span className="font-500">{user?.email}</span> <button className="text-primary underline ml-1" onClick={() => { setEmail(user?.email ?? ""); setEmailOpen(true); }}>Edit</button></p>
        <p><span className="text-text-muted">Business type</span><br />{profileQuery.data.businessType || "Not set"}</p>
        <p><span className="text-text-muted">Industry</span><br />{profileQuery.data.industry || "Not set"}</p>
        <p><span className="text-text-muted">Typical quantity</span><br />{profileQuery.data.typicalOrderQty || "Not set"}</p>
        <p><span className="text-text-muted">Budget range</span><br />{profileQuery.data.budgetRange || "Not set"}</p>
      </div>
      <Button className="mt-5" onClick={() => navigate("/buyer/onboarding")}>{profileQuery.data.onboardingCompleted ? "Update preferences" : "Complete preferences"}</Button>
    </Card><Card><h2 className="font-500 flex items-center gap-2 mb-2"><Store className="h-4 w-4 text-primary" /> Sell on Textile Marketplace</h2><p className="text-sm text-text-muted mb-4">Use this same account to open and manage your supplier storefront.</p><Button variant="secondary" onClick={() => openSellerMode()}>{user?.sellerEnabled ? "Switch to selling" : "Become a Seller"}</Button></Card><Card className="border-error/40">
      <h2 className="font-500 flex items-center gap-2 text-error mb-2"><AlertTriangle className="h-4 w-4" /> Account controls</h2>
      <p className="text-sm text-text-muted mb-4">Deleting your account immediately prevents future sign-in. Order records are retained for audit and fulfillment.</p>
      <Button variant="destructive" loading={deactivate.isPending} onClick={() => window.confirm("Delete your account? This signs you out immediately.") && deactivate.mutate()}>Delete account</Button>
    </Card></div>}
    <Modal open={emailOpen} onClose={() => setEmailOpen(false)} title="Edit email" size="sm"><form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); emailMutation.mutate(); }}><Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /><Button type="submit" loading={emailMutation.isPending}>Save email</Button></form></Modal><Modal open={sellerPasswordOpen} onClose={() => setSellerPasswordOpen(false)} title="Resume seller access" size="sm"><form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); openSellerMode(sellerPassword); }}><p className="text-sm text-text-muted">Confirm your account password to resume seller access for 30 days.</p><Input label="Password" type="password" required autoFocus value={sellerPassword} onChange={(e) => setSellerPassword(e.target.value)} /><Button type="submit" loading={sellerBusy}>Continue to seller setup</Button></form></Modal>
  </DashboardShell>;
}
