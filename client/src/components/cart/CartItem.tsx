import { Minus, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { CartItem as CartItemType } from "../../types";
import { formatCurrency } from "../../utils/formatCurrency";
import { Button } from "../ui";

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  disabled?: boolean;
}

export function CartItem({ item, onUpdateQuantity, onRemove, disabled }: CartItemProps) {
  const { product } = item;
  const atMax = item.quantity >= product.stock;
  const [draftQuantity, setDraftQuantity] = useState(String(item.quantity));

  useEffect(() => {
    setDraftQuantity(String(item.quantity));
  }, [item.quantity]);

  function commitQuantity() {
    const quantity = Number(draftQuantity);
    if (!Number.isInteger(quantity) || quantity < product.moq || quantity > product.stock) {
      setDraftQuantity(String(item.quantity));
      return;
    }
    if (quantity !== item.quantity) onUpdateQuantity(item.id, quantity);
  }

  return (
    <div className="flex gap-3 py-3 border-b border-border last:border-0">
      <div className="h-16 w-16 shrink-0 rounded-sm bg-bg overflow-hidden">
        {product.images[0] ? (
          <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-500 text-text-primary line-clamp-1">{product.name}</p>
        <p className="text-xs text-text-muted">{formatCurrency(product.price)} · MOQ {product.moq}</p>
        {item.selectedColor && <p className="mt-1 text-xs text-text-muted">Color: <span className="font-500 text-text-primary">{item.selectedColor}</span></p>}

        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="secondary"
            size="sm"
            className="h-10 w-10 p-0"
            disabled={disabled || item.quantity <= product.moq}
            onClick={() => onUpdateQuantity(item.id, Math.max(product.moq, item.quantity - 5))}
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <input
            aria-label={`Quantity for ${product.name}`}
            className="h-10 w-20 rounded-sm border border-border bg-surface px-2 text-center text-sm"
            type="number"
            min={product.moq}
            max={product.stock}
            step="5"
            value={draftQuantity}
            disabled={disabled}
            onChange={(e) => setDraftQuantity(e.target.value)}
            onBlur={commitQuantity}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          />
          <Button
            variant="secondary"
            size="sm"
            className="h-10 w-10 p-0"
            disabled={disabled || atMax}
            onClick={() => onUpdateQuantity(item.id, Math.min(product.stock, item.quantity + 5))}
            aria-label="Increase quantity"
            title={atMax ? `Only ${product.stock} in stock` : undefined}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0 ml-auto text-error"
            disabled={disabled}
            onClick={() => window.confirm(`Remove ${product.name} from your cart?`) && onRemove(item.id)}
            aria-label="Remove item"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="text-sm font-500 text-text-primary whitespace-nowrap">
        {formatCurrency(Number(product.price) * item.quantity)}
      </div>
    </div>
  );
}
