import { describe, expect, it } from "vitest";

import { applySale, ingUnitCost, prepBatchCost, recipeCost, type FnbData } from "@/lib/fnb-calc";

const data: FnbData = {
  ingredients: [{ id: "a", name: "Syrup", category: "Syrup", brand: "", supplier: "", lastImport: "", buyUnit: "Chai", useUnit: "ml", ratio: 700, buyPrice: 210000, stock: 1400, minStock: 0, active: true }],
  preps: [{ id: "p", name: "BTP", yield: 1000, unit: "ml", instructions: "", shelfLife: "", items: [{ ingredientId: "a", qty: 100 }], stock: 500, active: true }],
  recipes: [{ id: "r", name: "Món", group: "", brand: "", size: "M", price: 50000, packaging: 2000, items: [{ kind: "ing", refId: "a", qty: 10 }, { kind: "prep", refId: "p", qty: 50 }], brewTime: "", tools: "", steps: [], active: true }],
  movements: [], sales: [],
};

describe("fnb calc", () => {
  it("computes costs", () => {
    expect(ingUnitCost(data.ingredients[0]!)).toBe(300);
    expect(prepBatchCost(data.preps[0]!, data.ingredients)).toBe(30000);
    expect(recipeCost(data.recipes[0]!, data)).toBe(3000 + 1500 + 2000);
  });
  it("deducts stock and records sale", () => {
    const next = applySale(data, [{ recipeId: "r", qty: 2 }], "cash", new Date("2026-10-02"), "BS1");
    expect(next.ingredients[0]!.stock).toBe(1380);
    expect(next.preps[0]!.stock).toBe(400);
    expect(next.sales[0]!.total).toBe(100000);
    expect(next.sales[0]!.cogs).toBe(13000);
    expect(next.movements).toHaveLength(2);
  });
});
