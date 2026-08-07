import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Stepper, Button, Input, Select, Textarea, Card } from "../../../components/ui";
import { PageContainer } from "../../../components/layout/PageContainer";
import { SellerNavbar } from "../../../components/layout/SellerNavbar";
import { listCategories } from "../../../services/categories.api";
import { getOwnSupplierProfile, upsertSupplierProfile } from "../../../services/supplierProfile.api";
import { useToastStore } from "../../../store/toastStore";
import {
  SUPPLIER_BUSINESS_TYPES,
  OPERATING_HOURS,
  FABRIC_TYPES,
  MOQ_OPTIONS,
} from "../../../utils/constants";

const STEPS = [
  { label: "Business Basics" },
  { label: "Address & Hours" },
  { label: "Categories & Fabrics" },
  { label: "Review" },
];

interface FormState {
  businessName: string;
  businessType: string;
  contactInfo: string;
  address: string;
  operatingHours: string;
  categories: string[];
  fabricTypes: string[];
  moq: string;
}

const initialState: FormState = {
  businessName: "",
  businessType: "",
  contactInfo: "",
  address: "",
  operatingHours: "",
  categories: [],
  fabricTypes: [],
  moq: "",
};

export default function SupplierOnboardingPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const hasPrefilledProfile = useRef(false);
  const navigate = useNavigate();
  const push = useToastStore((s) => s.push);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
  });
  const profileQuery = useQuery({
    queryKey: ["supplier-profile", "me"],
    queryFn: getOwnSupplierProfile,
    retry: false,
  });

  useEffect(() => {
    const profile = profileQuery.data;
    if (!profile || hasPrefilledProfile.current) return;
    setForm({
      businessName: profile.businessName,
      businessType: profile.businessType,
      contactInfo: profile.contactInfo,
      address: profile.address,
      operatingHours: profile.operatingHours,
      categories: profile.categories,
      fabricTypes: profile.fabricTypes,
      moq: String(profile.moq),
    });
    hasPrefilledProfile.current = true;
  }, [profileQuery.data]);

  const mutation = useMutation({
    mutationFn: () =>
      upsertSupplierProfile({
        ...form,
        moq: Number(form.moq),
      }),
    onSuccess: () => {
      push("Supplier profile created", "success");
      navigate("/supplier/dashboard");
    },
    onError: (err: any) => {
      push(err?.response?.data?.error?.message || "Could not save profile", "error");
    },
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function toggle(key: "categories" | "fabricTypes", value: string) {
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }));
  }

  function validateStep(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (step === 0) {
      if (!form.businessName.trim()) e.businessName = "Required";
      if (!form.businessType.trim()) e.businessType = "Required";
      if (!form.contactInfo.trim()) e.contactInfo = "Required";
    }
    if (step === 1) {
      if (!form.address.trim()) e.address = "Required";
      if (!form.operatingHours.trim()) e.operatingHours = "Required";
    }
    if (step === 2) {
      if (form.categories.length === 0) e.categories = "Select at least one category";
      if (form.fabricTypes.length === 0) e.fabricTypes = "Select at least one fabric type";
      if (!form.moq || Number(form.moq) <= 0) e.moq = "Enter a valid MOQ";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <SellerNavbar />
      <PageContainer className="max-w-2xl">
        <h1 className="font-display text-3xl mb-2">Set up your supplier profile</h1>
        <p className="text-text-muted mb-6">Buyers will see this to evaluate your business.</p>

        <div className="mb-8">
          <Stepper steps={STEPS} currentIndex={step} />
        </div>

        <Card>
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <Input
                label="Business name"
                value={form.businessName}
                onChange={(e) => update("businessName", e.target.value)}
                error={errors.businessName}
              />
              <Select
                label="Business type"
                placeholder="Select your business type"
                value={form.businessType}
                options={SUPPLIER_BUSINESS_TYPES.map((b) => ({ label: b, value: b }))}
                onChange={(e) => update("businessType", e.target.value)}
                error={errors.businessType}
              />
              <Input
                label="Contact info"
                placeholder="Phone or email"
                value={form.contactInfo}
                onChange={(e) => update("contactInfo", e.target.value)}
                error={errors.contactInfo}
              />
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-4">
              <Textarea
                label="Address"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                error={errors.address}
              />
              <Select
                label="Operating hours"
                placeholder="Select your operating hours"
                value={form.operatingHours}
                options={OPERATING_HOURS.map((h) => ({ label: h, value: h }))}
                onChange={(e) => update("operatingHours", e.target.value)}
                error={errors.operatingHours}
              />
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-sm font-500 mb-2">Categories you supply</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggle("categories", c.id)}
                      className={`px-3 py-1.5 rounded-sm text-sm border transition-fast ${
                        form.categories.includes(c.id)
                          ? "bg-primary text-white border-primary"
                          : "border-border text-text-primary hover:bg-bg"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
                {errors.categories && <p className="text-xs text-error mt-1">{errors.categories}</p>}
              </div>

              <div>
                <p className="text-sm font-500 mb-2">Fabric types offered</p>
                <div className="flex flex-wrap gap-2">
                  {FABRIC_TYPES.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => toggle("fabricTypes", f)}
                      className={`px-3 py-1.5 rounded-sm text-sm border transition-fast ${
                        form.fabricTypes.includes(f)
                          ? "bg-primary text-white border-primary"
                          : "border-border text-text-primary hover:bg-bg"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                {errors.fabricTypes && <p className="text-xs text-error mt-1">{errors.fabricTypes}</p>}
              </div>

              <Select
                label="Minimum order quantity (MOQ)"
                placeholder="Select an MOQ"
                value={form.moq}
                options={MOQ_OPTIONS.map((m) => ({ label: `${m} units`, value: String(m) }))}
                onChange={(e) => update("moq", e.target.value)}
                error={errors.moq}
              />
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-3 text-sm">
              <ReviewRow label="Business" value={`${form.businessName} · ${form.businessType}`} />
              <ReviewRow label="Contact" value={form.contactInfo} />
              <ReviewRow label="Address" value={form.address} />
              <ReviewRow label="Hours" value={form.operatingHours} />
              <ReviewRow
                label="Categories"
                value={
                  categories
                    .filter((c) => form.categories.includes(c.id))
                    .map((c) => c.name)
                    .join(", ") || "—"
                }
              />
              <ReviewRow label="Fabric types" value={form.fabricTypes.join(", ") || "—"} />
              <ReviewRow label="MOQ" value={form.moq} />
            </div>
          )}
        </Card>

        <div className="flex justify-between mt-6">
          <Button variant="secondary" onClick={back} disabled={step === 0}>
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={next}>Continue</Button>
          ) : (
            <Button onClick={() => mutation.mutate()} loading={mutation.isPending}>
              Finish setup
            </Button>
          )}
        </div>
      </PageContainer>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border pb-2">
      <span className="text-text-muted">{label}</span>
      <span className="text-text-primary font-500 text-right">{value}</span>
    </div>
  );
}
