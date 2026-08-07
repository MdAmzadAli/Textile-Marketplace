import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Stepper, Button, Select, Card } from "../../../components/ui";
import { PageContainer } from "../../../components/layout/PageContainer";
import { Navbar } from "../../../components/layout/Navbar";
import { listCategories } from "../../../services/categories.api";
import { upsertProfile } from "../../../services/buyer-profile.api";
import { useToastStore } from "../../../store/toastStore";
import {
  BUYER_BUSINESS_TYPES,
  INDUSTRIES,
  FABRIC_TYPES,
  BUDGET_RANGES,
  TYPICAL_ORDER_QUANTITIES,
} from "../../../utils/constants";

const STEPS = [{ label: "Business" }, { label: "Preferences" }, { label: "Review" }];

interface FormState {
  businessType: string;
  industry: string;
  categoriesOfInterest: string[];
  fabricPreferences: string[];
  typicalOrderQty: string;
  budgetRange: string;
}

const initialState: FormState = {
  businessType: "",
  industry: "",
  categoriesOfInterest: [],
  fabricPreferences: [],
  typicalOrderQty: "",
  budgetRange: "",
};

export default function BuyerOnboardingPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const navigate = useNavigate();
  const push = useToastStore((s) => s.push);

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: listCategories });

  const mutation = useMutation({
    mutationFn: () =>
      upsertProfile({ ...form, typicalOrderQty: Number(form.typicalOrderQty) }),
    onSuccess: () => {
      push("Welcome! Your preferences are saved.", "success");
      navigate("/discover");
    },
    onError: (err: any) => {
      push(err?.response?.data?.error?.message || "Could not save profile", "error");
    },
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function toggle(key: "categoriesOfInterest" | "fabricPreferences", value: string) {
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }));
  }

  function validateStep(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (step === 0) {
      if (!form.businessType.trim()) e.businessType = "Required";
      if (!form.industry.trim()) e.industry = "Required";
    }
    if (step === 1) {
      if (form.categoriesOfInterest.length === 0) e.categoriesOfInterest = "Select at least one category";
      if (form.fabricPreferences.length === 0) e.fabricPreferences = "Select at least one fabric";
      if (!form.typicalOrderQty || Number(form.typicalOrderQty) <= 0) e.typicalOrderQty = "Enter a valid quantity";
      if (!form.budgetRange) e.budgetRange = "Select a budget range";
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
      <Navbar />
      <PageContainer className="max-w-2xl">
        <h1 className="font-display text-3xl mb-2">Tell us about your business</h1>
        <p className="text-text-muted mb-6">
          This helps us and our AI assistant recommend the right fabrics for you.
        </p>

        <div className="mb-8">
          <Stepper steps={STEPS} currentIndex={step} />
        </div>

        <Card>
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <Select
                label="Business type"
                placeholder="Select your business type"
                value={form.businessType}
                options={BUYER_BUSINESS_TYPES.map((b) => ({ label: b, value: b }))}
                onChange={(e) => update("businessType", e.target.value)}
                error={errors.businessType}
              />
              <Select
                label="Industry"
                placeholder="Select your industry"
                value={form.industry}
                options={INDUSTRIES.map((i) => ({ label: i, value: i }))}
                onChange={(e) => update("industry", e.target.value)}
                error={errors.industry}
              />
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-sm font-500 mb-2">Categories of interest</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggle("categoriesOfInterest", c.id)}
                      className={`px-3 py-1.5 rounded-sm text-sm border transition-fast ${
                        form.categoriesOfInterest.includes(c.id)
                          ? "bg-primary text-white border-primary"
                          : "border-border text-text-primary hover:bg-bg"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
                {errors.categoriesOfInterest && (
                  <p className="text-xs text-error mt-1">{errors.categoriesOfInterest}</p>
                )}
              </div>

              <div>
                <p className="text-sm font-500 mb-2">Fabric preferences</p>
                <div className="flex flex-wrap gap-2">
                  {FABRIC_TYPES.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => toggle("fabricPreferences", f)}
                      className={`px-3 py-1.5 rounded-sm text-sm border transition-fast ${
                        form.fabricPreferences.includes(f)
                          ? "bg-primary text-white border-primary"
                          : "border-border text-text-primary hover:bg-bg"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                {errors.fabricPreferences && (
                  <p className="text-xs text-error mt-1">{errors.fabricPreferences}</p>
                )}
              </div>

              <Select
                label="Typical order quantity"
                placeholder="Select a quantity range"
                value={form.typicalOrderQty}
                options={TYPICAL_ORDER_QUANTITIES}
                onChange={(e) => update("typicalOrderQty", e.target.value)}
                error={errors.typicalOrderQty}
              />

              <Select
                label="Budget range"
                placeholder="Select a budget range"
                value={form.budgetRange}
                options={BUDGET_RANGES.map((b) => ({ label: b, value: b }))}
                onChange={(e) => update("budgetRange", e.target.value)}
                error={errors.budgetRange}
              />
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-3 text-sm">
              <Row label="Business type" value={form.businessType} />
              <Row label="Industry" value={form.industry} />
              <Row
                label="Categories"
                value={
                  categories
                    .filter((c) => form.categoriesOfInterest.includes(c.id))
                    .map((c) => c.name)
                    .join(", ") || "—"
                }
              />
              <Row label="Fabric preferences" value={form.fabricPreferences.join(", ") || "—"} />
              <Row label="Typical order qty" value={form.typicalOrderQty} />
              <Row label="Budget range" value={form.budgetRange} />
            </div>
          )}

          <div className="flex justify-between mt-8">
            <Button variant="secondary" onClick={back} disabled={step === 0}>
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next}>Continue</Button>
            ) : (
              <Button onClick={() => mutation.mutate()} loading={mutation.isPending}>
                Finish & start browsing
              </Button>
            )}
          </div>
        </Card>
      </PageContainer>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border py-2 last:border-0">
      <span className="text-text-muted">{label}</span>
      <span className="text-text-primary font-500">{value}</span>
    </div>
  );
}
