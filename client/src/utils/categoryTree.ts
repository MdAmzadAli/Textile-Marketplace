import { Category } from "../types";

export interface CategoryNode extends Category {
  children: Category[];
}

// Category is a flat list with parentId from the API — every consumer that
// needs the two-level taxonomy (parent group -> leaf category) builds it
// from this one function instead of re-deriving it inline.
export function buildCategoryTree(categories: Category[]): CategoryNode[] {
  const parents = categories.filter((c) => !c.parentId);
  return parents
    .map((p) => ({
      ...p,
      children: categories.filter((c) => c.parentId === p.id),
    }))
    .filter((p) => p.children.length > 0);
}

// Products are always assigned a leaf category, never a parent group — so
// any "pick a category" dropdown (supplier product form, discovery filter)
// should only ever offer leaves, labeled with their parent for context.
export function leafCategoryOptions(categories: Category[]) {
  const byId = new Map(categories.map((c) => [c.id, c]));
  return categories
    .filter((c) => c.parentId)
    .map((c) => {
      const parentName = c.parentId ? byId.get(c.parentId)?.name : undefined;
      return { label: parentName ? `${parentName} — ${c.name}` : c.name, value: c.id };
    });
}
