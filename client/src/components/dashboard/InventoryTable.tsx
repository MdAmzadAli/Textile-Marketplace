import { useState } from "react";
import { Trash2, Pencil } from "lucide-react";
import { Product, ProductStatus } from "../../types";
import { Button, Select } from "../ui";
import { StockBadge } from "../product/StockBadge";

interface InventoryTableProps {
  products: Product[];
  selectedIds: string[];
  onToggleSelection: (id: string) => void;
  onTogglePageSelection: () => void;
  pageAllSelected: boolean;
  onQuickUpdate: (id: string, patch: { stock?: number; price?: number; status?: ProductStatus }) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Out of stock", value: "out_of_stock" },
  { label: "Inactive", value: "inactive" },
];

export function InventoryTable({ products, selectedIds, onToggleSelection, onTogglePageSelection, pageAllSelected, onQuickUpdate, onEdit, onDelete }: InventoryTableProps) {
  const [editing, setEditing] = useState<Record<string, { stock?: string; price?: string }>>({});

  function commit(id: string, field: "stock" | "price") {
    const raw = editing[id]?.[field];
    if (raw === undefined || raw === "") return;
    const num = Number(raw);
    if (Number.isNaN(num)) return;
    onQuickUpdate(id, { [field]: num });
  }

  return (
    <div className="overflow-x-auto border border-border rounded-md">
      <table className="w-full text-sm">
        <thead className="bg-bg border-b border-border">
          <tr>
            <th className="w-10 p-3"><input type="checkbox" aria-label="Select all products on this page" checked={pageAllSelected} onChange={onTogglePageSelection} /></th>
            <th className="text-left p-3 font-500">Product</th>
            <th className="text-left p-3 font-500">Stock</th>
            <th className="text-left p-3 font-500">Price</th>
            <th className="text-left p-3 font-500">Status</th>
            <th className="text-left p-3 font-500">Badge</th>
            <th className="text-right p-3 font-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b border-border last:border-0 hover:bg-bg/50">
              <td className="p-3"><input type="checkbox" aria-label={`Select ${p.name}`} checked={selectedIds.includes(p.id)} onChange={() => onToggleSelection(p.id)} /></td>
              <td className="p-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-sm bg-bg overflow-hidden shrink-0">
                    {p.images[0] && (
                      <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <span className="line-clamp-1">{p.name}</span>
                </div>
              </td>
              <td className="p-3">
                <input
                  type="number"
                  min={0}
                  defaultValue={p.stock}
                  onChange={(e) =>
                    setEditing((s) => ({ ...s, [p.id]: { ...s[p.id], stock: e.target.value } }))
                  }
                  onBlur={() => commit(p.id, "stock")}
                  className="w-20 h-8 px-2 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </td>
              <td className="p-3">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={Number(p.price)}
                  onChange={(e) =>
                    setEditing((s) => ({ ...s, [p.id]: { ...s[p.id], price: e.target.value } }))
                  }
                  onBlur={() => commit(p.id, "price")}
                  className="w-24 h-8 px-2 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </td>
              <td className="p-3">
                <Select
                  options={STATUS_OPTIONS}
                  defaultValue={p.status}
                  onChange={(e) => onQuickUpdate(p.id, { status: e.target.value as ProductStatus })}
                  className="h-8 w-36"
                />
              </td>
              <td className="p-3">
                <StockBadge status={p.status} stock={p.stock} />
              </td>
              <td className="p-3">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(p)} aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(p)} aria-label="Delete">
                    <Trash2 className="h-4 w-4 text-error" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
