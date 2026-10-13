import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { applySale, recipeCost, uid, type FnbData, type Ingredient, type Movement, type PayMethod, type Prep, type Recipe, type Sale } from "./fnb-calc";

export const INGREDIENT_CATEGORIES = ["Trái cây tươi", "Cà phê", "Matcha", "Mứt", "Syrup", "Bánh", "Bao bì", "Khác"];

const ing = (o: Partial<Ingredient> & Pick<Ingredient, "id" | "name" | "category" | "buyUnit" | "useUnit" | "ratio" | "buyPrice" | "stock" | "minStock">): Ingredient => ({ brand: "", supplier: "", lastImport: "2026-09-28", active: true, ...o });

const seedIngredients: Ingredient[] = [
  ing({ id: "i1", name: "Cà phê Robusta rang", category: "Cà phê", brand: "Trung Nguyên", supplier: "Kho Cà phê Sài Gòn", buyUnit: "Túi", useUnit: "gr", ratio: 1000, buyPrice: 260000, stock: 4200, minStock: 1500 }),
  ing({ id: "i2", name: "Bột matcha Uji", category: "Matcha", brand: "Marukyu", supplier: "Nhật Hương", buyUnit: "Gói", useUnit: "gr", ratio: 100, buyPrice: 320000, stock: 180, minStock: 200 }),
  ing({ id: "i3", name: "Đào ngâm", category: "Trái cây tươi", brand: "Rhodes", supplier: "Bếp Việt", buyUnit: "Lon", useUnit: "gr", ratio: 820, buyPrice: 62000, stock: 3280, minStock: 1000 }),
  ing({ id: "i4", name: "Syrup vanilla", category: "Syrup", brand: "Monin", supplier: "Bếp Việt", buyUnit: "Chai", useUnit: "ml", ratio: 700, buyPrice: 215000, stock: 1700, minStock: 700 }),
  ing({ id: "i5", name: "Sữa tươi không đường", category: "Khác", brand: "Dalat Milk", supplier: "Đại lý Sữa Q3", buyUnit: "Hộp", useUnit: "ml", ratio: 1000, buyPrice: 34000, stock: 9000, minStock: 4000 }),
  ing({ id: "i6", name: "Sữa đặc", category: "Khác", brand: "Ông Thọ", supplier: "Đại lý Sữa Q3", buyUnit: "Lon", useUnit: "gr", ratio: 380, buyPrice: 26000, stock: 2280, minStock: 760 }),
  ing({ id: "i7", name: "Mứt dâu tây", category: "Mứt", brand: "Golden Farm", supplier: "Bếp Việt", buyUnit: "Hũ", useUnit: "gr", ratio: 1000, buyPrice: 145000, stock: 650, minStock: 800 }),
  ing({ id: "i8", name: "Bánh croissant bơ", category: "Bánh", brand: "ABC Bakery", supplier: "ABC Bakery", buyUnit: "Cái", useUnit: "cái", ratio: 1, buyPrice: 18000, stock: 24, minStock: 10 }),
  ing({ id: "i9", name: "Trà đen", category: "Khác", brand: "Phúc Long", supplier: "Phúc Long", buyUnit: "Túi", useUnit: "gr", ratio: 500, buyPrice: 120000, stock: 1500, minStock: 500 }),
  ing({ id: "i10", name: "Đường cát", category: "Khác", brand: "Biên Hòa", supplier: "Chợ đầu mối", buyUnit: "Túi", useUnit: "gr", ratio: 1000, buyPrice: 24000, stock: 6000, minStock: 2000 }),
  ing({ id: "i11", name: "Sốt caramel cũ", category: "Syrup", brand: "Torani", supplier: "Bếp Việt", buyUnit: "Chai", useUnit: "ml", ratio: 750, buyPrice: 189000, stock: 0, minStock: 0, active: false }),
  ing({ id: "i12", name: "Ly nhựa 500ml", category: "Bao bì", brand: "Duy Tân", supplier: "Bao bì Minh Phát", buyUnit: "Cây", useUnit: "cái", ratio: 50, buyPrice: 60000, stock: 600, minStock: 200 }),
];

const seedPreps: Prep[] = [
  { id: "p1", name: "Cốt trà đen", yield: 2000, unit: "ml", instructions: "Ủ 40g trà đen với 2L nước 92°C trong 8 phút, lọc bỏ bã.", shelfLife: "8 giờ, giữ lạnh", items: [{ ingredientId: "i9", qty: 40 }], stock: 1600, active: true },
  { id: "p2", name: "Syrup đường", yield: 1500, unit: "ml", instructions: "Nấu 1kg đường với 1L nước tới khi tan hoàn toàn.", shelfLife: "7 ngày", items: [{ ingredientId: "i10", qty: 1000 }], stock: 1200, active: true },
  { id: "p3", name: "Cốt cà phê phin", yield: 500, unit: "ml", instructions: "Pha 100g cà phê với 500ml nước sôi.", shelfLife: "24 giờ", items: [{ ingredientId: "i1", qty: 100 }], stock: 400, active: true },
];

const recipe = (o: Partial<Recipe> & Pick<Recipe, "id" | "name" | "group" | "price" | "items">): Recipe => ({ brand: "Bếp Số", size: "M", packaging: 3500, brewTime: "2 phút", tools: "Jigger 30/45ml, ca đong", steps: [], active: true, ...o });

const seedRecipes: Recipe[] = [
  recipe({ id: "r1", name: "Cà phê sữa đá", group: "Cà phê", price: 35000, items: [{ kind: "prep", refId: "p3", qty: 40 }, { kind: "ing", refId: "i6", qty: 30 }], steps: [{ text: "Cho 30g sữa đặc vào ly" }, { text: "Thêm 40ml cốt cà phê, khuấy đều" }, { text: "Thêm đá đầy ly" }] }),
  recipe({ id: "r2", name: "Bạc xỉu", group: "Cà phê", price: 39000, items: [{ kind: "prep", refId: "p3", qty: 20 }, { kind: "ing", refId: "i6", qty: 25 }, { kind: "ing", refId: "i5", qty: 80 }] }),
  recipe({ id: "r3", name: "Matcha latte", group: "Matcha", size: "L", price: 59000, items: [{ kind: "ing", refId: "i2", qty: 4 }, { kind: "ing", refId: "i5", qty: 180 }, { kind: "prep", refId: "p2", qty: 20 }], brewTime: "3 phút", tools: "Chổi tre, jigger 30ml" }),
  recipe({ id: "r4", name: "Trà đào cam sả", group: "Trà trái cây", price: 49000, items: [{ kind: "prep", refId: "p1", qty: 150 }, { kind: "ing", refId: "i3", qty: 60 }, { kind: "prep", refId: "p2", qty: 25 }] }),
  recipe({ id: "r5", name: "Sữa chua dâu", group: "Đá xay", price: 45000, items: [{ kind: "ing", refId: "i7", qty: 40 }, { kind: "ing", refId: "i5", qty: 120 }] }),
  recipe({ id: "r6", name: "Vanilla latte", group: "Cà phê", price: 49000, items: [{ kind: "prep", refId: "p3", qty: 40 }, { kind: "ing", refId: "i4", qty: 15 }, { kind: "ing", refId: "i5", qty: 150 }] }),
  recipe({ id: "r7", name: "Croissant bơ", group: "Bánh", size: "1 cái", price: 25000, packaging: 1000, items: [{ kind: "ing", refId: "i8", qty: 1 }], brewTime: "1 phút" }),
  recipe({ id: "r8", name: "Trà đào phiên bản cũ", group: "Trà trái cây", price: 45000, items: [{ kind: "prep", refId: "p1", qty: 150 }, { kind: "ing", refId: "i3", qty: 50 }], active: false }),
];

function seedSales(): Sale[] {
  const data = { ingredients: seedIngredients, preps: seedPreps };
  const methods: Sale["method"][] = ["cash", "transfer", "ewallet"];
  const out: Sale[] = [];
  for (let m = 1; m <= 10; m++) {
    for (let k = 0; k < 3; k++) {
      const lines = seedRecipes.filter((r) => r.active).map((r, idx) => {
        const qty = 40 + ((m * 7 + idx * 13 + k * 5) % 60);
        return { recipeId: r.id, name: r.name, qty, price: r.price, cost: recipeCost(r, data) };
      });
      out.push({
        id: `seed-${m}-${k}`, number: `BS${String(m).padStart(2, "0")}${k}`, date: new Date(Date.UTC(2026, m - 1, 5 + k * 9, 5)).toISOString(), lines,
        total: lines.reduce((s, l) => s + l.price * l.qty, 0), cogs: lines.reduce((s, l) => s + l.cost * l.qty, 0), method: methods[(m + k) % 3]!,
      });
    }
  }
  return out;
}

const seedMovements: Movement[] = [
  { id: "mv1", date: "2026-10-01T02:00:00.000Z", targetKind: "ing", targetId: "i1", kind: "in", qty: 2000, note: "Nhập 2 túi đầu tháng" },
  { id: "mv2", date: "2026-10-01T09:00:00.000Z", targetKind: "ing", targetId: "i7", kind: "out", qty: -150, note: "Hủy hũ mở quá hạn" },
];

type Store = {
  data: FnbData;
  upsertIngredient: (i: Ingredient) => void;
  upsertPrep: (p: Prep) => void;
  upsertRecipe: (r: Recipe) => void;
  deleteRecipe: (id: string) => void;
  addRecipes: (rs: Recipe[]) => void;
  addMovement: (m: Movement) => void;
  cancelSale: (saleId: string) => void;
  checkout: (cart: { recipeId: string; qty: number }[], method: PayMethod, number: string, discount?: number) => Sale | undefined;
};

const Ctx = createContext<Store | null>(null);

export function FnbProvider({ children, empty = false }: { children: ReactNode; empty?: boolean }) {
  const [data, setData] = useState<FnbData>(() => empty
    ? { ingredients: [], preps: [], recipes: [], movements: [], sales: [] }
    : { ingredients: seedIngredients, preps: seedPreps, recipes: seedRecipes, movements: seedMovements, sales: seedSales() });
  const store = useMemo<Store>(() => {
    const upsert = <T extends { id: string }>(list: T[], item: T) => (list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item]);
    return {
      data,
      upsertIngredient: (i) => setData((d) => ({ ...d, ingredients: upsert(d.ingredients, i) })),
      upsertPrep: (p) => setData((d) => ({ ...d, preps: upsert(d.preps, p) })),
      upsertRecipe: (r) => setData((d) => ({ ...d, recipes: upsert(d.recipes, r) })),
      deleteRecipe: (id) => setData((d) => ({ ...d, recipes: d.recipes.filter((r) => r.id !== id) })),
      addRecipes: (rs) => setData((d) => ({ ...d, recipes: [...d.recipes, ...rs] })),
      addMovement: (m) => setData((d) => {
        const apply = <T extends { id: string; stock: number }>(list: T[]) => list.map((x) => (x.id === m.targetId ? { ...x, stock: x.stock + m.qty } : x));
        return { ...d, movements: [...d.movements, m], ingredients: m.targetKind === "ing" ? apply(d.ingredients) : d.ingredients, preps: m.targetKind === "prep" ? apply(d.preps) : d.preps };
      }),
      cancelSale: (saleId) => setData((d) => {
        const sale = d.sales.find((s) => s.id === saleId);
        if (!sale) return d;
        const now = new Date().toISOString();
        const ingredients = d.ingredients.map((i) => ({ ...i }));
        const preps = d.preps.map((p) => ({ ...p }));
        const movements: Movement[] = [];
        for (const line of sale.lines) {
          const r = d.recipes.find((x) => x.id === line.recipeId);
          if (!r) continue;
          for (const it of r.items) {
            const used = it.qty * line.qty;
            const target = it.kind === "ing" ? ingredients.find((x) => x.id === it.refId) : preps.find((x) => x.id === it.refId);
            if (!target) continue;
            target.stock = Math.round((target.stock + used) * 100) / 100;
            movements.push({ id: uid(), date: now, targetKind: it.kind, targetId: it.refId, kind: "in", qty: used, note: `Hủy đơn ${sale.number} — hoàn kho` });
          }
        }
        return { ...d, ingredients, preps, movements: [...d.movements, ...movements], sales: d.sales.filter((s) => s.id !== saleId) };
      }),
      checkout: (cart, method, number, discount = 0) => {
        const next = applySale(data, cart, method, new Date(), number, discount);
        setData(next);
        return next.sales[next.sales.length - 1];
      },
    };
  }, [data]);
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useFnb() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useFnb must be used inside FnbProvider");
  return s;
}
