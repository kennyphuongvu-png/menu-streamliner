import { useState } from "react";
import { ArrowLeft, Pencil, Plus, Save, Search, Trash2 } from "lucide-react";
import { Field, inputCls, RecipeDialog } from "@/components/fnb-dialogs";
import { GroupFilters } from "@/components/group-filters";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtQty, ingUnitCost, prepUnitCost, recipeCost, vnd, type Recipe, type RecipeItem } from "@/lib/fnb-calc";
import { useFnb } from "@/lib/fnb-store";

export function RecipeFormulasSection() {
  const { data } = useFnb();
  const [selected, setSelected] = useState("");
  const [group, setGroup] = useState("Tất cả");
  const [query, setQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [edit, setEdit] = useState<Recipe | undefined>();
  const available = data.recipes.filter((r) => (r.active || showInactive) && r.name.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi")));
  const visible = available.filter((r) => group === "Tất cả" || r.group === group);
  const recipe = data.recipes.find((r) => r.id === selected);
  return <section className="animate-rise-in space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-2xl font-bold">Công thức</h2><Button onClick={() => { setEdit(undefined); setDialogOpen(true); }}><Plus className="size-4" /> Thêm món</Button></div>
    <GroupFilters kind="recipe" value={group} onChange={(g) => { setGroup(g); setSelected(""); }} count={(g) => available.filter((r) => g === "Tất cả" || r.group === g).length} />
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input aria-label="Tìm món" className={`${inputCls} pl-9`} placeholder="Tìm món..." value={query} onChange={(e) => { setQuery(e.target.value); setSelected(""); }} /></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} /> Hiện món đã ẩn</label></div>
    {recipe ? <><Button variant="ghost" onClick={() => setSelected("")}><ArrowLeft className="size-4" /> Danh sách món</Button><FormulaEditor key={recipe.id} recipe={recipe} /></> : <div className="overflow-hidden rounded-md border border-border"><Table><TableHeader><TableRow><TableHead>Tên món</TableHead><TableHead>Nhóm món</TableHead><TableHead>Size</TableHead><TableHead className="text-right">Giá bán</TableHead><TableHead className="text-right">Giá vốn</TableHead><TableHead className="text-right">Thao tác</TableHead></TableRow></TableHeader><TableBody>
      {!visible.length && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Không có món phù hợp.</TableCell></TableRow>}
      {visible.map((r) => <TableRow key={r.id}><TableCell><Button variant="ghost" className="h-auto max-w-full whitespace-normal px-0 text-left text-primary" onClick={() => setSelected(r.id)}>{r.name}</Button>{!r.active && <p className="text-xs text-muted-foreground">Đã ẩn</p>}</TableCell><TableCell>{r.group}</TableCell><TableCell>{r.size}</TableCell><TableCell className="text-right">{vnd(r.price)}</TableCell><TableCell className="text-right font-semibold">{vnd(recipeCost(r, data))}</TableCell><TableCell><div className="flex justify-end gap-1"><Button variant="outline" size="sm" onClick={() => setSelected(r.id)}>Định lượng</Button><Button variant="ghost" size="icon" aria-label={`Sửa món ${r.name}`} onClick={() => { setEdit(r); setDialogOpen(true); }}><Pencil className="size-4" /></Button></div></TableCell></TableRow>)}
    </TableBody></Table></div>}
    <RecipeDialog open={dialogOpen} onOpenChange={setDialogOpen} initial={edit} />
  </section>;
}

function FormulaEditor({ recipe }: { recipe: Recipe }) {
  const { data, upsertRecipe } = useFnb();
  const [items, setItems] = useState<RecipeItem[]>(recipe.items.map((i) => ({ ...i })));
  const [packaging, setPackaging] = useState(String(recipe.packaging));
  const [saved, setSaved] = useState(false);
  const options = [
    ...data.ingredients.map((i) => ({ key: `ing:${i.id}`, kind: "ing" as const, id: i.id, name: i.name, unit: i.useUnit, cost: ingUnitCost(i), active: i.active })),
    ...data.preps.map((p) => ({ key: `prep:${p.id}`, kind: "prep" as const, id: p.id, name: `[BTP] ${p.name}`, unit: p.unit, cost: prepUnitCost(p, data.ingredients), active: p.active })),
  ];
  const first = options.find((o) => o.active);
  const cost = recipeCost({ items, packaging: Number(packaging) || 0 }, data);
  const valid = Number.isFinite(Number(packaging)) && Number(packaging) >= 0 && items.every((i) => Number.isFinite(i.qty) && i.qty > 0 && options.some((o) => o.key === `${i.kind}:${i.refId}`));
  const update = (idx: number, patch: Partial<RecipeItem>) => { setSaved(false); setItems((list) => list.map((i, j) => j === idx ? { ...i, ...patch } : i)); };
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-display text-lg font-bold">{recipe.name}</h3><p className="text-sm text-muted-foreground">{recipe.group} · {recipe.size} · Giá bán {vnd(recipe.price)}</p></div><Button disabled={!valid} onClick={() => { upsertRecipe({ ...recipe, items, packaging: Number(packaging) || 0 }); setSaved(true); }}><Save className="size-4" /> Lưu công thức</Button></div>
    <div className="overflow-hidden rounded-md border border-border bg-card"><Table><TableHeader><TableRow><TableHead>Nguyên liệu từ kho</TableHead><TableHead>Khối lượng tiêu hao</TableHead><TableHead>Đơn vị</TableHead><TableHead className="text-right">Giá vốn / đơn vị</TableHead><TableHead className="text-right">Thành tiền</TableHead><TableHead /></TableRow></TableHeader><TableBody>
      {!items.length && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Chưa có thành phần.</TableCell></TableRow>}
      {items.map((item, idx) => { const opt = options.find((o) => o.key === `${item.kind}:${item.refId}`); return <TableRow key={idx}><TableCell className="min-w-60"><select aria-label={`Nguyên liệu dòng ${idx + 1}`} className={inputCls} value={`${item.kind}:${item.refId}`} onChange={(e) => { const chosen = options.find((o) => o.key === e.target.value); if (chosen) update(idx, { kind: chosen.kind, refId: chosen.id }); }}>{!opt && <option value={`${item.kind}:${item.refId}`}>Nguyên liệu không còn trong kho</option>}{options.filter((o) => o.active || o.key === opt?.key).map((o) => <option key={o.key} value={o.key}>{o.name}{!o.active && " (Đã ẩn)"}</option>)}</select></TableCell><TableCell className="min-w-40"><input aria-label={`Khối lượng tiêu hao dòng ${idx + 1}`} type="number" min="0" step="any" className={inputCls} value={item.qty || ""} onChange={(e) => update(idx, { qty: Number(e.target.value) })} /></TableCell><TableCell>{opt?.unit ?? "—"}</TableCell><TableCell className="text-right">{fmtQty(opt?.cost ?? 0)} ₫</TableCell><TableCell className="text-right font-semibold">{vnd(item.qty * (opt?.cost ?? 0))}</TableCell><TableCell><Button variant="ghost" size="icon" aria-label={`Xóa thành phần ${idx + 1}`} onClick={() => { setItems((list) => list.filter((_, j) => j !== idx)); setSaved(false); }}><Trash2 className="size-4" /></Button></TableCell></TableRow>; })}
    </TableBody></Table></div>
    <Button variant="outline" disabled={!first} onClick={() => { if (!first) return; setItems((list) => [...list, { kind: first.kind, refId: first.id, qty: 0 }]); setSaved(false); }}><Plus className="size-4" /> Thêm nguyên liệu</Button>
    <div className="flex flex-wrap items-end justify-between gap-4 border-t border-border pt-5"><Field label="Chi phí bao bì (₫)" className="w-52"><input className={inputCls} type="number" min="0" value={packaging} onChange={(e) => { setPackaging(e.target.value); setSaved(false); }} /></Field><div className="text-right"><p className="text-sm text-muted-foreground">Tổng giá vốn / món</p><p aria-label="Tổng giá vốn" className="font-display text-2xl font-bold text-primary">{vnd(cost)}</p></div></div>
    {saved && <p role="status" className="text-sm font-semibold text-success">Đã lưu công thức.</p>}
  </div>;
}