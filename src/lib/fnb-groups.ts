import type { Ingredient } from "./fnb-calc";

export const DEFAULT_INGREDIENT_GROUPS = ["Cà phê và trà", "Trái cây tươi", "Syrup và sauce", "Khác"];
export const DEFAULT_RECIPE_GROUPS = ["Cà phê Việt Nam", "Cà phê Ý", "Matcha & Ca cao", "Trà trái cây", "Đá xay", "Bánh", "Khác"];
export const ingredientGroup = (i: Ingredient) => i.subcategory ?? (
  i.category === "Cà phê" || i.name.toLowerCase().includes("trà") ? "Cà phê và trà" :
  i.category === "Trái cây tươi" ? "Trái cây tươi" :
  ["Syrup", "Mứt"].includes(i.category) ? "Syrup và sauce" : "Khác"
);

export function recipeGroup(group: string, name: string) {
  if (group === "Cà phê") return /latte|espresso|cappuccino/i.test(name) ? "Cà phê Ý" : "Cà phê Việt Nam";
  return group === "Matcha" ? "Matcha & Ca cao" : group;
}