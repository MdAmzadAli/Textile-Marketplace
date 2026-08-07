import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { DashboardShell } from "../../../components/layout/DashboardShell";
import { Button, Card, EmptyState, Input, Modal, Textarea } from "../../../components/ui";
import { BUYER_SIDEBAR_LINKS } from "../buyerNav";
import { Address } from "../../../types";
import * as addressesApi from "../../../services/addresses.api";
import { useToastStore } from "../../../store/toastStore";

const blank = (): addressesApi.AddressInput => ({ label: "", fullName: "", countryCode: "+91", phone: "", addressLine: "", city: "", state: "", postalCode: "", notes: "" });

export default function BuyerAddressesPage() {
  const queryClient = useQueryClient();
  const push = useToastStore((s) => s.push);
  const query = useQuery({ queryKey: ["addresses"], queryFn: addressesApi.listAddresses });
  const [editing, setEditing] = useState<Address | null>(null);
  const [open, setOpen] = useState(false);
  const save = useMutation({
    mutationFn: ({ id, data }: { id?: string; data: addressesApi.AddressInput }) => id ? addressesApi.updateAddress(id, data) : addressesApi.createAddress(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["addresses"] }); setOpen(false); setEditing(null); push("Address saved", "success"); },
    onError: (e: any) => push(e?.response?.data?.error?.message || "Could not save address", "error"),
  });
  const remove = useMutation({ mutationFn: addressesApi.deleteAddress, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["addresses"] }); push("Address deleted", "info"); }, onError: () => push("Could not delete address", "error") });
  const startCreate = () => { setEditing(null); setOpen(true); };

  return <DashboardShell links={BUYER_SIDEBAR_LINKS}>
    <div className="flex items-center justify-between gap-3 mb-6"><div><h1 className="font-display text-2xl">Manage addresses</h1><p className="text-sm text-text-muted mt-1">Save delivery addresses for faster checkout.</p></div><Button onClick={startCreate}><Plus className="h-4 w-4" /> Add address</Button></div>
    {query.isError && <EmptyState title="Couldn't load addresses" action={<Button onClick={() => query.refetch()}>Retry</Button>} />}
    {query.isSuccess && query.data.length === 0 && <EmptyState icon={MapPin} title="No saved addresses" description="Add a delivery address once; you'll be able to select it at checkout." action={<Button onClick={startCreate}>Add address</Button>} />}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {query.data?.map((address) => <Card key={address.id}><div className="flex items-start justify-between gap-3"><div><p className="font-500">{address.label}</p><p className="text-sm text-text-muted mt-2">{address.fullName} · {address.countryCode} {address.phone}<br />{address.addressLine}<br />{address.city}, {address.state} {address.postalCode}</p></div><div className="flex gap-1"><Button variant="ghost" size="sm" aria-label="Edit address" onClick={() => { setEditing(address); setOpen(true); }}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="sm" className="text-error" aria-label="Delete address" onClick={() => window.confirm(`Delete ${address.label}?`) && remove.mutate(address.id)}><Trash2 className="h-4 w-4" /></Button></div></div></Card>)}
    </div>
    <AddressModal open={open} address={editing} busy={save.isPending} onClose={() => { setOpen(false); setEditing(null); }} onSave={(data) => save.mutate({ id: editing?.id, data })} />
  </DashboardShell>;
}

function AddressModal({ open, address, busy, onClose, onSave }: { open: boolean; address: Address | null; busy: boolean; onClose: () => void; onSave: (data: addressesApi.AddressInput) => void }) {
  const [form, setForm] = useState<addressesApi.AddressInput>(blank());
  useEffect(() => { setForm(address ? { label: address.label, fullName: address.fullName, countryCode: address.countryCode, phone: address.phone, addressLine: address.addressLine, city: address.city, state: address.state, postalCode: address.postalCode, notes: address.notes ?? "" } : blank()); }, [address, open]);
  function set<K extends keyof addressesApi.AddressInput>(key: K, val: addressesApi.AddressInput[K]) { setForm((current) => ({ ...current, [key]: val })); }
  return <Modal open={open} onClose={onClose} title={address ? "Edit address" : "Add address"} size="md"><form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); onSave(form); }}><Input label="Label" placeholder="Office, Warehouse, Home" required minLength={2} maxLength={40} value={form.label} onChange={(e) => set("label", e.target.value)} /><Input label="Full name" required pattern="[A-Za-z .'-]+" value={form.fullName} onChange={(e) => set("fullName", e.target.value.replace(/[^A-Za-z .'-]/g, ""))} /><div className="grid grid-cols-[96px_1fr] gap-3"><Input label="Code" required pattern="\+[1-9][0-9]{0,3}" value={form.countryCode} onChange={(e) => set("countryCode", e.target.value.replace(/[^+\d]/g, ""))} /><Input label="Phone" inputMode="numeric" required minLength={6} maxLength={14} value={form.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))} /></div><Textarea label="Address" required minLength={8} maxLength={200} value={form.addressLine} onChange={(e) => set("addressLine", e.target.value)} /><div className="grid grid-cols-2 gap-3"><Input label="City" required pattern="[A-Za-z .'-]+" value={form.city} onChange={(e) => set("city", e.target.value.replace(/[^A-Za-z .'-]/g, ""))} /><Input label="State" required pattern="[A-Za-z .'-]+" value={form.state} onChange={(e) => set("state", e.target.value.replace(/[^A-Za-z .'-]/g, ""))} /></div><Input label="Postal code" inputMode="numeric" required pattern="\d{6}" minLength={6} maxLength={6} value={form.postalCode} onChange={(e) => set("postalCode", e.target.value.replace(/\D/g, ""))} /><Textarea label="Delivery notes (optional)" maxLength={500} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} /><Button type="submit" loading={busy}>{address ? "Save changes" : "Save address"}</Button></form></Modal>;
}
