import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UploadCloud, X } from "lucide-react";
import { Modal, Button, Input, Textarea, Select } from "../../../components/ui";
import { GroupedCategorySelect } from "../../../components/supplier/GroupedCategorySelect";
import { listCategories } from "../../../services/categories.api";
import { uploadImages } from "../../../services/upload.api";
import { useToastStore } from "../../../store/toastStore";
import { Product, ProductStatus } from "../../../types";
import { ProductInput } from "../../../services/products.api";
import { UNIT_OPTIONS } from "../../../utils/constants";
import { COLOR_PALETTE } from "../../../utils/productTaxonomy";

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: ProductInput) => void;
  submitting: boolean;
  initial?: Product | null;
}

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Out of stock", value: "out_of_stock" },
  { label: "Inactive", value: "inactive" },
];

const emptyForm = {
  name: "",
  categoryId: "",
  description: "",
  images: [] as string[],
  colors: [] as string[],
  stock: "",
  price: "",
  moq: "",
  unit: "meter",
  status: "active" as ProductStatus,
};

export function ProductFormModal({ open, onClose, onSubmit, submitting, initial }: ProductFormModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [colorInput, setColorInput] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [numericErrors, setNumericErrors] = useState<Partial<Record<"stock" | "price" | "moq", string>>>({});
  const push = useToastStore((s) => s.push);

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: listCategories });

  useEffect(() => {
    if (!open) return;
    setNumericErrors({});
    if (initial) {
      setForm({
        name: initial.name,
        categoryId: initial.categoryId,
        description: initial.description,
        images: initial.images,
        colors: initial.colors,
        stock: String(initial.stock),
        price: String(initial.price),
        moq: String(initial.moq),
        unit: initial.unit ?? "meter",
        status: initial.status,
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, initial]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls = await uploadImages(Array.from(files));
      setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
    } catch {
      push("Image upload failed", "error");
    } finally {
      setUploading(false);
    }
  }

  function removeImage(url: string) {
    setForm((f) => ({ ...f, images: f.images.filter((i) => i !== url) }));
  }

  function addColor() {
    const c = colorInput.trim();
    if (!c || form.colors.includes(c)) return;
    setForm((f) => ({ ...f, colors: [...f.colors, c] }));
    setColorInput("");
  }

  function handleSubmit() {
    const stock = Number(form.stock), price = Number(form.price), moq = Number(form.moq);
    const errors: Partial<Record<"stock" | "price" | "moq", string>> = {};
    if (!Number.isInteger(stock) || stock < 0) errors.stock = "Enter a whole number of 0 or more";
    if (!Number.isFinite(price) || price <= 0 || !/^\d+(\.\d{1,2})?$/.test(form.price)) errors.price = "Enter a price with up to 2 decimal places";
    if (!Number.isInteger(moq) || moq < 1) errors.moq = "Enter a whole number of 1 or more";
    if (!errors.stock && !errors.moq && form.status === "active" && stock < moq) errors.stock = "Active stock must meet the MOQ";
    setNumericErrors(errors);
    if (Object.keys(errors).length) return;
    onSubmit({
      name: form.name,
      categoryId: form.categoryId,
      description: form.description,
      images: form.images,
      colors: form.colors,
      stock, price, moq,
      unit: form.unit,
      status: form.status,
    });
  }

  function setWholeNumber(field: "stock" | "moq", value: string) {
    if (/^\d*$/.test(value)) { setForm((current) => ({ ...current, [field]: value })); setNumericErrors((current) => ({ ...current, [field]: undefined })); }
  }

  function setPrice(value: string) {
    if (/^\d*(\.\d{0,2})?$/.test(value)) { setForm((current) => ({ ...current, price: value })); setNumericErrors((current) => ({ ...current, price: undefined })); }
  }

  const isValid =
    form.name && form.categoryId && form.description.length >= 10 && form.images.length > 0 &&
    form.stock !== "" && form.price !== "" && form.moq !== "";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit product" : "Add product"}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting} disabled={!isValid}>
            {initial ? "Save changes" : "Create product"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Product name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />

        <GroupedCategorySelect label="Category" categories={categories} value={form.categoryId} onChange={(categoryId) => setForm((f) => ({ ...f, categoryId }))} />

        <Textarea
          label="Description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          helperText="Minimum 10 characters"
        />

        <div>
          <p className="text-sm font-500 mb-2">Images</p>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
            className={`border-2 border-dashed rounded-md p-6 text-center transition-fast ${
              dragOver ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <UploadCloud className="h-6 w-6 mx-auto text-text-muted mb-2" />
            <p className="text-sm text-text-muted">
              Drag & drop images, or{" "}
              <label className="text-primary cursor-pointer underline">
                browse
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  hidden
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </label>
            </p>
            {uploading && <p className="text-xs text-text-muted mt-2">Uploading…</p>}
          </div>
          {form.images.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {form.images.map((url) => (
                <div key={url} className="relative h-16 w-16 rounded-sm overflow-hidden border border-border">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    className="absolute top-0 right-0 bg-text-primary/60 text-white p-0.5"
                    aria-label="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-500 mb-2">Colors</p>
          <div className="mb-3 flex flex-wrap gap-2">{COLOR_PALETTE.map((color) => <button key={color} type="button" onClick={() => setForm((current) => current.colors.includes(color) ? { ...current, colors: current.colors.filter((item) => item !== color) } : { ...current, colors: [...current.colors, color] })} className={`rounded-sm border px-2 py-1 text-xs ${form.colors.includes(color) ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-bg"}`}>{color}</button>)}</div>
          <p className="mb-2 text-xs text-text-muted">Choose from the palette or add a custom color.</p>
          <div className="flex gap-2">
            <Input
              value={colorInput}
              onChange={(e) => setColorInput(e.target.value)}
              placeholder="e.g. Indigo"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addColor())}
            />
            <Button type="button" variant="secondary" onClick={addColor}>
              Add
            </Button>
          </div>
          {form.colors.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {form.colors.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-sm bg-bg border border-border text-xs"
                >
                  {c}
                  <button onClick={() => setForm((f) => ({ ...f, colors: f.colors.filter((x) => x !== c) }))}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Stock"
            inputMode="numeric"
            value={form.stock}
            onChange={(e) => setWholeNumber("stock", e.target.value)}
            error={numericErrors.stock}
          />
          <Input
            label="Price"
            inputMode="decimal"
            value={form.price}
            onChange={(e) => setPrice(e.target.value)}
            error={numericErrors.price}
          />
          <Select
            label="Unit"
            options={UNIT_OPTIONS.map((u) => ({ label: u, value: u }))}
            value={form.unit}
            onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
          />
        </div>

        <Input
          label="MOQ (minimum order quantity)"
          inputMode="numeric"
          value={form.moq}
          onChange={(e) => setWholeNumber("moq", e.target.value)}
          error={numericErrors.moq}
          helperText={`Smallest order a buyer can place, in ${form.unit}s`}
        />

        <Select
          label="Status"
          options={STATUS_OPTIONS}
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ProductStatus }))}
        />
      </div>
    </Modal>
  );
}
