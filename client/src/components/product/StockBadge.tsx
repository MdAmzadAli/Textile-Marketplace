import { Badge } from "../ui";
import { ProductStatus } from "../../types";

export function StockBadge({ status, stock }: { status: ProductStatus; stock: number }) {
  if (status === "out_of_stock" || stock === 0) {
    return <Badge status="out_of_stock">Out of stock</Badge>;
  }
  if (status === "inactive") {
    return <Badge status="inactive">Inactive</Badge>;
  }
  if (stock <= 10) {
    return <Badge status="warning">Low stock · {stock}</Badge>;
  }
  return <Badge status="active">In stock · {stock}</Badge>;
}
