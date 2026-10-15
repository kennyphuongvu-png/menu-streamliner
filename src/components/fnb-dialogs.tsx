import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fmtQty, ingUnitCost, prepBatchCost, recipeCost, margin, uid, vnd, type Ingredient, type Movement, type Prep, type Recipe } from "@/lib/fnb-calc";
import { useFnb } from "@/lib/fnb-store";
import { ingredientGroup } from "@/lib/fnb-groups";
import { cn } from "@/lib/utils";

export const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring";

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return <label className={cn("block space-y-1.5", className)}><span className="text-xs font-semibold text-muted-foreground">{label}</span>{children}</label>;
}

const num = (v: string) => (Number.isFinite(Number(v)) ? Number(v) : 0);

type DialogProps<T> = { open: boolean; onOpenChange: (o: boolean) => void; initial?: T | undefined };

const emptyIngredient = (): Ingredient => ({ id: uid(), name: "", category: "Khác", brand: "", supplier: "", lastImport: "", buyUnit: "Chai", useUnit: "ml", ratio: 1000, buyPrice: 0, stock: 0, minStock: 0, active: true });

export function IngredientDialog({ open, onOpenChange, initial }: DialogProps<Ingredient>) {
  const { upsertIngredient, ingredientGroups } = useFnb();
  const [f, setF] = useState<Ingredient>(emptyIngredient);
  useEffect(() => { if (open) setF(initial ? { ...initial, subcategory: ingredientGroup(initial) } : { ...emptyIngredient(), subcategory: "Khác" }); }, [open, initial]);
  const set = <K extends keyof Ingredient>(k: K, v: Ingredient[K]) => setF((x) => ({ ...x, [k]: v }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{initial ? "Sửa nguyên liệu" : "Thêm nguyên liệu"}</DialogTitle><DialogDescription>Quy đổi thông minh từ đơn vị mua sang đơn vị dùng để tính giá vốn chính xác.</DialogDescription></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tên nguyên liệu" className="sm:col-span-2"><input className={inputCls} value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Nhóm con"><select aria-label="Nhóm con" className={inputCls} value={f.subcategory ?? "Khác"} onChange={(e) => set("subcategory", e.target.value)}>{ingredientGroups.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Thương hiệu"><input className={inputCls} value={f.brand} onChange={(e) => set("brand", e.target.value)} /></Field>
          <Field label="Nhà cung cấp"><input className={inputCls} value={f.supplier} onChange={(e) => set("supplier", e.target.value)} /></Field>
          <Field label="Ngày nhập gần nhất"><input type="date" className={inputCls} value={f.lastImport} onChange={(e) => set("lastImport", e.target.value)} /></Field>
        </div>
        <div className="rounded-md border border-border bg-secondary/50 p-4">
          <p className="mb-3 text-sm font-bold">Quy đổi giá vốn</p>
          <div className="grid gap-4 sm:grid-cols-4">
            <Field label="Đơn vị mua"><input className={inputCls} value={f.buyUnit} onChange={(e) => set("buyUnit", e.target.value)} placeholder="Chai, Thùng..." /></Field>
            <Field label="Đơn vị dùng"><input className={inputCls} value={f.useUnit} onChange={(e) => set("useUnit", e.target.value)} placeholder="ml, gr..." /></Field>
            <Field label={`1 ${f.buyUnit || "đơn vị"} = ? ${f.useUnit}`}><input type="number" min={0} className={inputCls} value={f.ratio} onChange={(e) => set("ratio", num(e.target.value))} /></Field>
            <Field label={`Giá mua / ${f.buyUnit || "đơn vị"}`}><input type="number" min={0} className={inputCls} value={f.buyPrice} onChange={(e) => set("buyPrice", num(e.target.value))} /></Field>
          </div>
          <p className="mt-3 text-sm">Giá vốn trên mỗi {f.useUnit || "đơn vị"}: <strong className="text-primary">{fmtQty(ingUnitCost(f))} ₫</strong></p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={`Tồn kho hiện tại (${f.useUnit})`}><input type="number" className={inputCls} value={f.stock} onChange={(e) => set("stock", num(e.target.value))} /></Field>
          <Field label={`Mức tồn tối thiểu (${f.useUnit})`}><input type="number" min={0} className={inputCls} value={f.minStock} onChange={(e) => set("minStock", num(e.target.value))} /></Field>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button><Button disabled={!f.name.trim()} onClick={() => { upsertIngredient(f); onOpenChange(false); }}>Lưu nguyên liệu</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const emptyPrep = (): Prep => ({ id: uid(), name: "", yield: 1000, unit: "ml", instructions: "", shelfLife: "", items: [], stock: 0, active: true });

export function PrepDialog({ open, onOpenChange, initial }: DialogProps<Prep>) {
  const { data, upsertPrep } = useFnb();
  const [f, setF] = useState<Prep>(emptyPrep);
  useEffect(() => { if (open) setF(initial ?? emptyPrep()); }, [open, initial]);
  const batch = prepBatchCost(f, data.ingredients);
  const activeIngs = data.ingredients.filter((i) => i.active);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{initial ? "Sửa bán thành phẩm" : "Thêm bán thành phẩm"}</DialogTitle><DialogDescription>Chọn nguyên liệu thô để hệ thống tự tính giá vốn cả mẻ.</DialogDescription></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Tên BTP" className="sm:col-span-2"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Sản lượng/mẻ"><input type="number" min={0} className={inputCls} value={f.yield} onChange={(e) => setF({ ...f, yield: num(e.target.value) })} /></Field>
          <Field label="Đơn vị"><select className={inputCls} value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })}><option>ml</option><option>gr</option></select></Field>
          <Field label="Hướng dẫn làm (SOP)" className="sm:col-span-4"><textarea rows={3} className={cn(inputCls, "h-auto py-2")} value={f.instructions} onChange={(e) => setF({ ...f, instructions: e.target.value })} /></Field>
          <Field label="Hạn dùng" className="sm:col-span-2"><input className={inputCls} value={f.shelfLife} onChange={(e) => setF({ ...f, shelfLife: e.target.value })} placeholder="VD: 24 giờ, giữ lạnh" /></Field>
          <Field label={`Tồn hiện tại (${f.unit})`} className="sm:col-span-2"><input type="number" className={inputCls} value={f.stock} onChange={(e) => setF({ ...f, stock: num(e.target.value) })} /></Field>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between"><p className="text-sm font-bold">Thành phần</p><Button size="sm" variant="outline" disabled={!activeIngs.length} onClick={() => setF({ ...f, items: [...f.items, { ingredientId: activeIngs[0]!.id, qty: 0 }] })}><Plus className="size-4" /> Thêm thành phần</Button></div>
          {f.items.length === 0 && <p className="text-xs text-muted-foreground">Chưa có thành phần.</p>}
          {f.items.map((it, idx) => {
            const ingr = data.ingredients.find((x) => x.id === it.ingredientId);
            const update = (patch: Partial<typeof it>) => setF({ ...f, items: f.items.map((x, j) => (j === idx ? { ...x, ...patch } : x)) });
            return <div key={idx} className="grid grid-cols-[1fr_110px_100px_36px] items-center gap-2">
              <select className={inputCls} value={it.ingredientId} onChange={(e) => update({ ingredientId: e.target.value })}>{activeIngs.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select>
              <input type="number" min={0} aria-label="Định lượng" className={inputCls} value={it.qty} onChange={(e) => update({ qty: num(e.target.value) })} />
              <span className="text-right text-xs font-semibold">{ingr ? `${ingr.useUnit} · ${vnd(ingUnitCost(ingr) * it.qty)}` : ""}</span>
              <Button variant="ghost" size="icon" aria-label="Xóa thành phần" onClick={() => setF({ ...f, items: f.items.filter((_, j) => j !== idx) })}><Trash2 className="size-4" /></Button>
            </div>;
          })}
          <div className="flex justify-between rounded-md bg-secondary p-3 text-sm"><span>Tổng giá vốn cả mẻ: <strong className="text-primary">{vnd(batch)}</strong></span><span>Mỗi {f.unit}: <strong>{fmtQty(f.yield ? batch / f.yield : 0)} ₫</strong></span></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button><Button disabled={!f.name.trim()} onClick={() => { upsertPrep(f); onOpenChange(false); }}>Lưu BTP</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const emptyRecipe = (): Recipe => ({ id: uid(), name: "", group: "Khác", brand: "Bếp Số", size: "M", price: 0, packaging: 3500, items: [], brewTime: "", tools: "", steps: [], active: true });

export function RecipeDialog({ open, onOpenChange, initial }: DialogProps<Recipe>) {
  const { data, upsertRecipe, recipeGroups } = useFnb();
  const [f, setF] = useState<Recipe>(emptyRecipe);
  useEffect(() => { if (open) setF(initial ?? emptyRecipe()); }, [open, initial]);
  const cost = recipeCost(f, data);
  const options = [...data.ingredients.filter((i) => i.active).map((i) => ({ v: `ing:${i.id}`, l: i.name, unit: i.useUnit })), ...data.preps.filter((p) => p.active).map((p) => ({ v: `prep:${p.id}`, l: `[BTP] ${p.name}`, unit: p.unit }))];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader><DialogTitle>{initial ? "Sửa món" : "Thêm món"}</DialogTitle><DialogDescription>Giá vốn tự tính từ thành phần và chi phí bao bì.</DialogDescription></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Tên món" className="sm:col-span-2"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Nhóm món"><select aria-label="Nhóm món" className={inputCls} value={f.group} onChange={(e) => setF({ ...f, group: e.target.value })}>{recipeGroups.map((g) => <option key={g}>{g}</option>)}</select></Field>
          <Field label="Size"><input className={inputCls} value={f.size} onChange={(e) => setF({ ...f, size: e.target.value })} /></Field>
          <Field label="Thương hiệu"><input className={inputCls} value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })} /></Field>
          <Field label="Giá bán (₫)"><input type="number" min={0} className={inputCls} value={f.price} onChange={(e) => setF({ ...f, price: num(e.target.value) })} /></Field>
          <Field label="Chi phí bao bì (ly, nắp, ống hút)"><input type="number" min={0} className={inputCls} value={f.packaging} onChange={(e) => setF({ ...f, packaging: num(e.target.value) })} /></Field>
          <Field label="Thời gian pha chế"><input className={inputCls} value={f.brewTime} onChange={(e) => setF({ ...f, brewTime: e.target.value })} placeholder="VD: 2 phút" /></Field>
          <Field label="Dụng cụ đong (SOP)" className="sm:col-span-4"><input className={inputCls} value={f.tools} onChange={(e) => setF({ ...f, tools: e.target.value })} placeholder="Jigger 30ml, ca đong 500ml..." /></Field>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between"><p className="text-sm font-bold">Thành phần</p><Button size="sm" variant="outline" disabled={!options.length} onClick={() => { const [kind, refId] = options[0]!.v.split(":") as ["ing" | "prep", string]; setF({ ...f, items: [...f.items, { kind, refId, qty: 0 }] }); }}><Plus className="size-4" /> Thêm thành phần</Button></div>
          {f.items.map((it, idx) => {
            const opt = options.find((o) => o.v === `${it.kind}:${it.refId}`);
            const update = (patch: Partial<typeof it>) => setF({ ...f, items: f.items.map((x, j) => (j === idx ? { ...x, ...patch } : x)) });
            return <div key={idx} className="grid grid-cols-[1fr_110px_60px_36px] items-center gap-2">
              <select className={inputCls} value={`${it.kind}:${it.refId}`} onChange={(e) => { const [kind, refId] = e.target.value.split(":") as ["ing" | "prep", string]; update({ kind, refId }); }}>{options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select>
              <input type="number" min={0} aria-label="Định lượng" className={inputCls} value={it.qty} onChange={(e) => update({ qty: num(e.target.value) })} />
              <span className="text-xs font-semibold">{opt?.unit}</span>
              <Button variant="ghost" size="icon" aria-label="Xóa thành phần" onClick={() => setF({ ...f, items: f.items.filter((_, j) => j !== idx) })}><Trash2 className="size-4" /></Button>
            </div>;
          })}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between"><p className="text-sm font-bold">Hướng dẫn chi tiết từng bước</p><Button size="sm" variant="outline" onClick={() => setF({ ...f, steps: [...f.steps, { text: "" }] })}><Plus className="size-4" /> Thêm bước</Button></div>
          {f.steps.map((s, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="mt-2 flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold">{idx + 1}</span>
              <div className="flex-1 space-y-2">
                <input className={inputCls} value={s.text} placeholder="Mô tả bước" onChange={(e) => setF({ ...f, steps: f.steps.map((x, j) => (j === idx ? { ...x, text: e.target.value } : x)) })} />
                <div className="flex items-center gap-3">
                  <input type="file" accept="image/*" className="text-xs" aria-label={`Ảnh bước ${idx + 1}`} onChange={(e) => { const file = e.target.files?.[0]; if (file) { const url = URL.createObjectURL(file); setF((cur) => ({ ...cur, steps: cur.steps.map((x, j) => (j === idx ? { ...x, image: url } : x)) })); } }} />
                  {s.image && <img src={s.image} alt={`Bước ${idx + 1}`} className="size-12 rounded object-cover" />}
                </div>
              </div>
              <Button variant="ghost" size="icon" aria-label="Xóa bước" onClick={() => setF({ ...f, steps: f.steps.filter((_, j) => j !== idx) })}><Trash2 className="size-4" /></Button>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-md bg-secondary p-3 text-sm"><span>Giá vốn: <strong>{vnd(cost)}</strong></span><span>Lời/món: <strong>{vnd(f.price - cost)}</strong></span><span>Biên LN: <strong className={cn(margin(f.price, cost) < 30 ? "text-destructive" : "text-success")}>{margin(f.price, cost).toFixed(1)}%</strong></span></div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button><Button disabled={!f.name.trim()} onClick={() => { upsertRecipe(f); onOpenChange(false); }}>Lưu món</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MovementDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data, addMovement } = useFnb();
  const [target, setTarget] = useState("");
  const [kind, setKind] = useState<"in" | "out">("in");
  const [qty, setQty] = useState(0);
  const [note, setNote] = useState("");
  useEffect(() => { if (open) { setTarget(data.ingredients[0] ? `ing:${data.ingredients[0].id}` : ""); setKind("in"); setQty(0); setNote(""); } }, [open, data.ingredients]);
  const [tk, tid] = target.split(":") as ["ing" | "prep", string];
  const unit = tk === "ing" ? data.ingredients.find((i) => i.id === tid)?.useUnit : data.preps.find((p) => p.id === tid)?.unit;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nhập/Xuất kho</DialogTitle><DialogDescription>Ghi nhận biến động kho thủ công vào lịch sử.</DialogDescription></DialogHeader>
        <div className="grid gap-4">
          <Field label="Nguyên liệu / BTP"><select className={inputCls} value={target} onChange={(e) => setTarget(e.target.value)}>{data.ingredients.map((i) => <option key={i.id} value={`ing:${i.id}`}>{i.name}</option>)}{data.preps.map((p) => <option key={p.id} value={`prep:${p.id}`}>[BTP] {p.name}</option>)}</select></Field>
          <div className="flex gap-2"><Button variant={kind === "in" ? "default" : "outline"} onClick={() => setKind("in")}>Nhập kho</Button><Button variant={kind === "out" ? "default" : "outline"} onClick={() => setKind("out")}>Xuất / Hủy</Button></div>
          <Field label={`Số lượng (${unit ?? ""})`}><input type="number" min={0} className={inputCls} value={qty} onChange={(e) => setQty(num(e.target.value))} /></Field>
          <Field label="Ghi chú"><input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button><Button disabled={!target || qty <= 0} onClick={() => { const m: Movement = { id: uid(), date: new Date().toISOString(), targetKind: tk, targetId: tid, kind, qty: kind === "in" ? qty : -qty, note: note || (kind === "in" ? "Nhập kho thủ công" : "Xuất kho thủ công") }; addMovement(m); onOpenChange(false); }}>Ghi nhận</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
