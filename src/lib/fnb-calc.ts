export type Ingredient = {
  id: string; name: string; category: string; brand: string; supplier: string; lastImport: string;
  buyUnit: string; useUnit: string; ratio: number; buyPrice: number; stock: number; minStock: number; active: boolean;
};
export type PrepItem = { ingredientId: string; qty: number };
export type Prep = {
  id: string; name: string; yield: number; unit: string; instructions: string; shelfLife: string;
  items: PrepItem[]; stock: number; active: boolean;
};
export type RecipeItem = { kind: "ing" | "prep"; refId: string; qty: number };
export type Recipe = {
  id: string; name: string; group: string; brand: string; size: string; price: number; packaging: number;
  items: RecipeItem[]; brewTime: string; tools: string; steps: { text: string; image?: string }[]; active: boolean;
};
export type MovementKind = "in" | "out" | "sale";
export type Movement = { id: string; date: string; targetKind: "ing" | "prep"; targetId: string; kind: MovementKind; qty: number; note: string };
export type PayMethod = "cash" | "transfer" | "ewallet";
export type SaleLine = { recipeId: string; name: string; qty: number; price: number; cost: number };
export type Sale = { id: string; number: string; date: string; lines: SaleLine[]; total: number; cogs: number; method: PayMethod; subtotal?: number; discount?: number };
export type FnbData = { ingredients: Ingredient[]; preps: Prep[]; recipes: Recipe[]; movements: Movement[]; sales: Sale[] };

export const ingUnitCost = (i: Ingredient) => (i.ratio > 0 ? i.buyPrice / i.ratio : 0);

export function prepBatchCost(p: Pick<Prep, "items">, ings: Ingredient[]) {
  return p.items.reduce((sum, it) => {
    const ing = ings.find((x) => x.id === it.ingredientId);
    return sum + (ing ? ingUnitCost(ing) * it.qty : 0);
  }, 0);
}
export const prepUnitCost = (p: Prep, ings: Ingredient[]) => (p.yield > 0 ? prepBatchCost(p, ings) / p.yield : 0);

export function recipeCost(r: Pick<Recipe, "items" | "packaging">, data: Pick<FnbData, "ingredients" | "preps">) {
  const items = r.items.reduce((sum, it) => {
    if (it.kind === "ing") {
      const ing = data.ingredients.find((x) => x.id === it.refId);
      return sum + (ing ? ingUnitCost(ing) * it.qty : 0);
    }
    const prep = data.preps.find((x) => x.id === it.refId);
    return sum + (prep ? prepUnitCost(prep, data.ingredients) * it.qty : 0);
  }, 0);
  return items + (r.packaging || 0);
}
export const margin = (price: number, cost: number) => (price > 0 ? ((price - cost) / price) * 100 : 0);

/** Applies a sale: deducts ingredients / preps per recipe and records sale + movements. */
export function applySale(data: FnbData, cart: { recipeId: string; qty: number }[], method: PayMethod, now: Date, number: string, discount = 0): FnbData {
  const ingredients = data.ingredients.map((i) => ({ ...i }));
  const preps = data.preps.map((p) => ({ ...p }));
  const movements = [...data.movements];
  const lines: SaleLine[] = [];
  const date = now.toISOString();
  for (const c of cart) {
    const r = data.recipes.find((x) => x.id === c.recipeId);
    if (!r || c.qty <= 0) continue;
    const cost = recipeCost(r, data);
    lines.push({ recipeId: r.id, name: r.name, qty: c.qty, price: r.price, cost });
    for (const it of r.items) {
      const used = it.qty * c.qty;
      const target = it.kind === "ing" ? ingredients.find((x) => x.id === it.refId) : preps.find((x) => x.id === it.refId);
      if (!target) continue;
      target.stock = Math.round((target.stock - used) * 100) / 100;
      movements.push({ id: `${number}-${r.id}-${it.refId}`, date, targetKind: it.kind, targetId: it.refId, kind: "sale", qty: -used, note: `Bán ${c.qty} × ${r.name} (${number})` });
    }
  }
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const disc = Math.min(Math.max(0, Math.round(discount)), subtotal);
  const total = subtotal - disc;
  const cogs = lines.reduce((s, l) => s + l.cost * l.qty, 0);
  return { ...data, ingredients, preps, movements, sales: [...data.sales, { id: number, number, date, lines, total, cogs, method, subtotal, discount: disc }] };
}

export const money = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });
export const vnd = (n: number) => `${money.format(Math.round(n))} ₫`;
export const fmtQty = (n: number) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(n);
export const uid = () => Math.random().toString(36).slice(2, 10);

export const STOCK_GROUPS = ["Cốt trà & Cà phê", "Syrup & Mứt", "Bột & Hỗn hợp", "Trái cây tươi", "Đường, Sữa & Kem", "Bao bì tiêu hao"] as const;
export function stockGroup(i: Pick<Ingredient, "name" | "category">): (typeof STOCK_GROUPS)[number] | null {
  const n = i.name.toLowerCase();
  if (i.category === "Bao bì" || /\b(ly|nắp|ống hút|túi giấy)\b/.test(n)) return "Bao bì tiêu hao";
  if (i.category === "Cà phê" || n.includes("trà")) return "Cốt trà & Cà phê";
  if (i.category === "Syrup" || i.category === "Mứt") return "Syrup & Mứt";
  if (i.category === "Matcha" || n.includes("bột")) return "Bột & Hỗn hợp";
  if (i.category === "Trái cây tươi") return "Trái cây tươi";
  if (/đường|sữa|kem/.test(n)) return "Đường, Sữa & Kem";
  return null;
}
/** Stocktake total in use units: sealed packs × pack size + opened remainder. */
export const stocktakeTotal = (sealed: number, open: number, ratio: number) => Math.max(0, sealed) * ratio + Math.max(0, open);
