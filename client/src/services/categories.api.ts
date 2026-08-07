import { api } from "./api";
import { Category } from "../types";

export async function listCategories() {
  const res = await api.get<{ data: Category[] }>("/categories");
  return res.data.data;
}
