import {
  ArrowDownUp, Copy, Download, Eye, EyeOff, FileUp, Minus, Pencil, Plus, Printer, ReceiptText, Search, ShoppingBag, Trash2, TriangleAlert,
} from "lucide-react";
import { useMemo, useRef, useState, type ReactNode } from "react";

import { IngredientDialog, MovementDialog, PrepDialog, RecipeDialog, inputCls } from "@/components/fnb-dialogs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { stocktakeTotal, fmtQty, ingUnitCost, margin, money, prepBatchCost, prepUnitCost, recipeCost, uid, vnd, type Ingredient, type PayMethod, type Prep, type Recipe, type Sale } from "@/lib/fnb-calc";
import { ingredientGroup } from "@/lib/fnb-groups";
import { GroupFilters } from "@/components/group-filters";
import { downloadXlsx, readSheetRows } from "@/lib/fnb-export";
import { INGREDIENT_CATEGORIES, useFnb } from "@/lib/fnb-store";
import { cn } from "@/lib/utils";

const monthKey = (iso: string) => iso.slice(0, 7);
const today = () => new Date().toISOString();

function InactiveToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return <label className="flex items-center gap-3 text-sm font-medium"><Switch checked={checked} onCheckedChange={onChange} aria-label="Hiện dữ liệu không dùng" />Hiện dữ liệu không dùng</label>;
}

/* ---------------- Nguyên liệu & Kho ---------------- */
export function IngredientsSection() {
  const { data, upsertIngredient } = useFnb();
  const [showInactive, setShowInactive] = useState(false);
  const [cat, setCat] = useState("Tất cả");
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Ingredient | undefined>();
  const [dlg, setDlg] = useState(false);
  const [mv, setMv] = useState(false);
  const available = data.ingredients.filter((i) => (i.active || showInactive) && i.name.toLowerCase().includes(q.toLowerCase()));
  const visible = available.filter((i) => cat === "Tất cả" || ingredientGroup(i) === cat);
  const exportXlsx = () => {
    const m = monthKey(today());
    const name = (kind: string, id: string) => (kind === "ing" ? data.ingredients.find((i) => i.id === id)?.name : data.preps.find((p) => p.id === id)?.name) ?? id;
    downloadXlsx(`chi-tiet-kho-${m}.xlsx`, {
      "Tồn kho": [["Nguyên liệu", "Danh mục", "Thương hiệu", "Nhà cung cấp", "Ngày nhập gần nhất", "Tồn kho", "Đơn vị", "Mức tối thiểu", "Giá vốn/đơn vị", "Giá trị tồn"], ...data.ingredients.map((i) => [i.name, i.category, i.brand, i.supplier, i.lastImport, i.stock, i.useUnit, i.minStock, Math.round(ingUnitCost(i) * 100) / 100, Math.round(ingUnitCost(i) * i.stock)])],
      [`Biến động ${m}`]: [["Thời gian", "Mục", "Loại", "Số lượng", "Ghi chú"], ...data.movements.filter((x) => monthKey(x.date) === m).map((x) => [new Date(x.date).toLocaleString("vi-VN"), name(x.targetKind, x.targetId), x.kind === "in" ? "Nhập" : x.kind === "out" ? "Xuất" : "Bán hàng", x.qty, x.note])],
    });
  };
  const recent = [...data.movements].reverse().slice(0, 6);
  return (
    <section className="animate-rise-in space-y-5">
      <PageIntro title="Nguyên liệu & Kho" description="Tồn kho theo đơn vị dùng, cảnh báo khi chạm mức tối thiểu." action={<div className="no-print flex flex-wrap gap-2"><Button variant="outline" onClick={() => setMv(true)}><ArrowDownUp className="size-4" /> Nhập/Xuất kho</Button><Button variant="outline" onClick={exportXlsx}><Download className="size-4" /> Tải chi tiết kho (.xlsx)</Button><Button onClick={() => { setEdit(undefined); setDlg(true); }}><Plus className="size-4" /> Thêm nguyên liệu</Button></div>} />
      <GroupFilters kind="ingredient" value={cat} onChange={setCat} count={(g) => available.filter((i) => g === "Tất cả" || ingredientGroup(i) === g).length} />
      <div id="management-print-area" className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
        <div className="print-heading hidden"><h1>Danh sách nguyên liệu</h1><p>Bếp Số · Dữ liệu đang hiển thị</p></div>
        <div className="no-print space-y-3 border-b border-border px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input aria-label="Tìm nguyên liệu" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm nguyên liệu..." className={cn(inputCls, "pl-9 sm:w-64")} /></div>
            <div className="flex items-center gap-3"><InactiveToggle checked={showInactive} onChange={setShowInactive} /><Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="size-4" /> In</Button></div>
          </div>
        </div>
        <Table>
          <TableHeader><TableRow><TableHead>Tên nguyên liệu</TableHead><TableHead>Nhóm con</TableHead><TableHead className="text-right">Số lượng tồn</TableHead><TableHead>Đơn vị tính</TableHead><TableHead className="text-right">Giá vốn nhập</TableHead><TableHead className="no-print text-right">Thao tác</TableHead></TableRow></TableHeader>
          <TableBody>
            {visible.length === 0 && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Không có nguyên liệu phù hợp.</TableCell></TableRow>}
            {visible.map((i) => {
              const low = i.active && i.stock <= i.minStock;
              return <TableRow key={i.id} className={cn(!i.active && "opacity-55")}>
                <TableCell><p className="font-semibold">{i.name}</p><p className="text-xs text-muted-foreground">{i.brand}{!i.active && " · Đã ẩn"}</p></TableCell>
                <TableCell className="text-sm">{ingredientGroup(i)}</TableCell>
                <TableCell className="text-right"><span className={cn("inline-flex items-center gap-1 text-sm font-bold", low ? "text-destructive" : "text-foreground")}>{low && <TriangleAlert className="size-3.5" />}{fmtQty(i.stock)}</span></TableCell>
                <TableCell>{i.useUnit}</TableCell>
                <TableCell className="text-right"><p className="font-semibold">{vnd(i.buyPrice)}/{i.buyUnit}</p><p className="text-xs text-muted-foreground">{fmtQty(ingUnitCost(i))} ₫/{i.useUnit}</p></TableCell>
                <TableCell className="no-print text-right"><Button variant="ghost" size="icon" aria-label={`Sửa ${i.name}`} onClick={() => { setEdit(i); setDlg(true); }}><Pencil className="size-4" /></Button><Button variant="ghost" size="icon" aria-label={i.active ? `Ẩn ${i.name}` : `Hiện ${i.name}`} onClick={() => upsertIngredient({ ...i, active: !i.active })}>{i.active ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</Button></TableCell>
              </TableRow>;
            })}
          </TableBody>
        </Table>
      </div>
      <div className="no-print rounded-md border border-border bg-card p-5 shadow-sm">
        <h2 className="font-display text-lg font-bold">Lịch sử biến động gần đây</h2>
        <ul className="mt-3 divide-y divide-border text-sm">{recent.map((m) => { const n = m.targetKind === "ing" ? data.ingredients.find((i) => i.id === m.targetId) : data.preps.find((p) => p.id === m.targetId); const unit = n && ("useUnit" in n ? n.useUnit : n.unit); return <li key={m.id} className="flex justify-between gap-3 py-2"><span><strong>{n?.name}</strong> <span className="text-muted-foreground">· {m.note}</span></span><span className={cn("font-bold", m.qty > 0 ? "text-success" : "text-destructive")}>{m.qty > 0 ? "+" : ""}{fmtQty(m.qty)} {unit}</span></li>; })}</ul>
      </div>
      <IngredientDialog open={dlg} onOpenChange={setDlg} initial={edit} />
      <MovementDialog open={mv} onOpenChange={setMv} />
    </section>
  );
}

/* ---------------- Bán thành phẩm ---------------- */
export function PrepsSection() {
  const { data, upsertPrep } = useFnb();
  const [showInactive, setShowInactive] = useState(false);
  const [edit, setEdit] = useState<Prep | undefined>();
  const [dlg, setDlg] = useState(false);
  const visible = data.preps.filter((p) => p.active || showInactive);
  return (
    <section className="animate-rise-in space-y-5">
      <PageIntro title="Bán thành phẩm (Sơ chế)" description="Công thức sơ chế, sản lượng mỗi mẻ và giá vốn tự tính." action={<div className="flex items-center gap-3"><InactiveToggle checked={showInactive} onChange={setShowInactive} /><Button onClick={() => { setEdit(undefined); setDlg(true); }}><Plus className="size-4" /> Thêm bán thành phẩm</Button></div>} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((p) => (
          <article key={p.id} className={cn("flex flex-col rounded-md border border-border bg-card p-5 shadow-sm", !p.active && "opacity-55")}>
            <div className="flex items-start justify-between gap-2"><div><span className="rounded bg-warning-soft px-1.5 py-0.5 text-[10px] font-bold text-warning">BTP</span><h3 className="mt-2 font-display text-lg font-bold">{p.name}</h3><p className="text-xs text-muted-foreground">Mẻ {fmtQty(p.yield)} {p.unit} · Hạn dùng {p.shelfLife || "—"}</p></div><div className="flex"><Button variant="ghost" size="icon" aria-label={`Sửa ${p.name}`} onClick={() => { setEdit(p); setDlg(true); }}><Pencil className="size-4" /></Button><Button variant="ghost" size="icon" aria-label={`Ẩn/hiện ${p.name}`} onClick={() => upsertPrep({ ...p, active: !p.active })}>{p.active ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</Button></div></div>
            <ul className="mt-3 flex-1 space-y-1 text-sm">{p.items.map((it, idx) => { const i = data.ingredients.find((x) => x.id === it.ingredientId); return <li key={idx} className="flex justify-between"><span>{i?.name}</span><span className="text-muted-foreground">{fmtQty(it.qty)} {i?.useUnit}</span></li>; })}</ul>
            <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{p.instructions}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-xs"><div><p className="text-muted-foreground">Giá vốn mẻ</p><p className="font-bold">{vnd(prepBatchCost(p, data.ingredients))}</p></div><div><p className="text-muted-foreground">Mỗi {p.unit}</p><p className="font-bold">{fmtQty(prepUnitCost(p, data.ingredients))} ₫</p></div><div><p className="text-muted-foreground">Tồn</p><p className="font-bold">{fmtQty(p.stock)} {p.unit}</p></div></div>
          </article>
        ))}
      </div>
      <PrepDialog open={dlg} onOpenChange={setDlg} initial={edit} />
    </section>
  );
}

/* ---------------- Món & Công thức ---------------- */
export function RecipesSection() {
  const { data, upsertRecipe, deleteRecipe, addRecipes } = useFnb();
  const [showInactive, setShowInactive] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [printOnly, setPrintOnly] = useState<Set<string> | null>(null);
  const [edit, setEdit] = useState<Recipe | undefined>();
  const [dlg, setDlg] = useState(false);
  const [view, setView] = useState<Recipe | null>(null);
  const [notice, setNotice] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const visible = data.recipes.filter((r) => r.active || showInactive);
  const shown = printOnly ? visible.filter((r) => printOnly.has(r.id)) : visible;
  const print = (ids: Set<string> | null) => { setPrintOnly(ids); window.setTimeout(() => { window.print(); setPrintOnly(null); }, 50); };
  const onImport = async (file: File) => {
    const rows = await readSheetRows(file);
    const pick = (row: Record<string, unknown>, ...keys: string[]) => { for (const k of keys) if (row[k] !== undefined && row[k] !== "") return row[k]; return undefined; };
    const rs: Recipe[] = rows.map((row) => ({ id: uid(), name: String(pick(row, "Tên món", "name") ?? "").trim(), group: String(pick(row, "Danh mục", "group") ?? "Khác"), brand: String(pick(row, "Thương hiệu", "brand") ?? "Bếp Số"), size: String(pick(row, "Size", "size") ?? "M"), price: Number(pick(row, "Giá bán", "price") ?? 0) || 0, packaging: Number(pick(row, "Chi phí bao bì", "packaging") ?? 0) || 0, items: [], brewTime: String(pick(row, "Thời gian pha chế") ?? ""), tools: String(pick(row, "Dụng cụ đong") ?? ""), steps: String(pick(row, "Hướng dẫn") ?? "").split("|").filter(Boolean).map((text) => ({ text: text.trim() })), active: true })).filter((r) => r.name);
    addRecipes(rs);
    setNotice(rs.length ? `Đã import ${rs.length} món. Hãy bổ sung thành phần để tính giá vốn.` : "Không tìm thấy dòng hợp lệ. File cần cột: Tên món, Danh mục, Size, Giá bán, Chi phí bao bì.");
  };
  const toggleSel = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  return (
    <section className="animate-rise-in space-y-5">
      <PageIntro title="Hàng hóa" description="Danh sách món và giá bán." />
      <div className="no-print flex flex-col gap-3 rounded-md border border-border bg-card px-5 py-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <InactiveToggle checked={showInactive} onChange={setShowInactive} />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => print(null)}><Printer className="size-4" /> In/Xuất PDF danh sách</Button>
          <Button variant="outline" size="sm" disabled={!selected.size} onClick={() => print(selected)}><Printer className="size-4" /> In món đã chọn ({selected.size})</Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}><FileUp className="size-4" /> Import công thức từ file</Button>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void onImport(f); e.target.value = ""; }} />
          <Button size="sm" onClick={() => { setEdit(undefined); setDlg(true); }}><Plus className="size-4" /> Thêm món</Button>
        </div>
      </div>
      {notice && <p className="no-print rounded-md bg-secondary px-4 py-2 text-sm">{notice}</p>}
      <div id="management-print-area">
        <div className="print-heading hidden"><h1>Danh sách món, công thức & SOP</h1><p>Bếp Số · {shown.length} món</p></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((r) => {
            const cost = recipeCost(r, data);
            const mg = margin(r.price, cost);
            return (
              <article key={r.id} className={cn("flex flex-col rounded-md border border-border bg-card p-5 shadow-sm break-inside-avoid", !r.active && "opacity-55")}>
                <div className="flex items-start justify-between gap-2">
                  <div><p className="text-xs font-semibold text-muted-foreground">{r.group} · Size {r.size}</p><h3 className="mt-1 font-display text-lg font-bold">{r.name}</h3>{!r.active && <p className="text-xs text-muted-foreground">Đã ẩn</p>}</div>
                  <Checkbox className="no-print mt-1" checked={selected.has(r.id)} onCheckedChange={() => toggleSel(r.id)} aria-label={`Chọn ${r.name}`} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <div><p className="text-muted-foreground">Giá vốn</p><p className="text-sm font-bold">{vnd(cost)}</p></div>
                  <div><p className="text-muted-foreground">Giá bán</p><p className="text-sm font-bold">{vnd(r.price)}</p></div>
                  <div><p className="text-muted-foreground">Biên LN</p><p className={cn("text-sm font-bold", mg < 30 ? "text-destructive" : "text-success")}>{mg.toFixed(1)}%</p></div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Bao bì {vnd(r.packaging)} · Pha {r.brewTime || "—"} · {r.tools || "—"}</p>
                <div className="no-print mt-4 flex flex-wrap gap-1 border-t border-border pt-3">
                  <Button variant="ghost" size="sm" onClick={() => { setEdit(r); setDlg(true); }}><Pencil className="size-3.5" /> Sửa</Button>
                  <Button variant="ghost" size="sm" onClick={() => setView(r)}><Eye className="size-3.5" /> Công thức</Button>
                  <Button variant="ghost" size="sm" onClick={() => upsertRecipe({ ...r, active: !r.active })}><EyeOff className="size-3.5" /> {r.active ? "Ẩn" : "Hiện"}</Button>
                  <Button variant="ghost" size="sm" onClick={() => upsertRecipe({ ...r, id: uid(), name: `${r.name} (bản sao)` })}><Copy className="size-3.5" /> Nhân bản</Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if (window.confirm(`Xóa món "${r.name}"?`)) deleteRecipe(r.id); }}><Trash2 className="size-3.5" /> Xóa</Button>
                </div>
                <div className="print-heading hidden"><RecipeDetail recipe={r} /></div>
              </article>
            );
          })}
        </div>
      </div>
      <RecipeDialog open={dlg} onOpenChange={setDlg} initial={edit} />
      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{view?.name}</DialogTitle></DialogHeader>{view && <RecipeDetail recipe={view} />}</DialogContent>
      </Dialog>
    </section>
  );
}

function RecipeDetail({ recipe }: { recipe: Recipe }) {
  const { data } = useFnb();
  return (
    <div className="space-y-3 text-sm">
      <ul className="space-y-1">{recipe.items.length === 0 && <li className="text-muted-foreground">Chưa có thành phần.</li>}{recipe.items.map((it, idx) => { const ref = it.kind === "ing" ? data.ingredients.find((x) => x.id === it.refId) : data.preps.find((x) => x.id === it.refId); const unit = ref && ("useUnit" in ref ? ref.useUnit : ref.unit); return <li key={idx} className="flex justify-between"><span>{it.kind === "prep" && "[BTP] "}{ref?.name}</span><strong>{fmtQty(it.qty)} {unit}</strong></li>; })}</ul>
      <p><strong>Dụng cụ:</strong> {recipe.tools || "—"} · <strong>Thời gian:</strong> {recipe.brewTime || "—"}</p>
      {recipe.steps.length > 0 && <ol className="list-decimal space-y-2 pl-5">{recipe.steps.map((s, idx) => <li key={idx}>{s.text}{s.image && <img src={s.image} alt={`Bước ${idx + 1}`} className="mt-1 h-24 rounded object-cover" />}</li>)}</ol>}
    </div>
  );
}

/* ---------------- Bảng giá vốn ---------------- */
export function CogsSection() {
  const { data } = useFnb();
  const rows = data.recipes.filter((r) => r.active).map((r) => { const cost = recipeCost(r, data); return { r, cost, profit: r.price - cost, mg: margin(r.price, cost) }; });
  const avg = rows.length ? rows.reduce((s, x) => s + x.mg, 0) / rows.length : 0;
  const low = rows.filter((x) => x.mg < 30).length;
  return (
    <section className="animate-rise-in space-y-5">
      <PageIntro title="Bảng giá vốn (COGS)" description="Giá vốn tự tính theo công thức hiện tại và giá nhập mới nhất." action={<Button variant="outline" onClick={() => window.print()}><Printer className="size-4" /> In bảng</Button>} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Tổng số món" value={String(rows.length)} />
        <Stat label="Biên lợi nhuận trung bình" value={`${avg.toFixed(1)}%`} />
        <Stat label="Món có biên LN < 30%" value={String(low)} danger={low > 0} />
      </div>
      <div id="management-print-area" className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
        <div className="print-heading hidden"><h1>Bảng giá vốn (COGS)</h1></div>
        <Table>
          <TableHeader><TableRow><TableHead>Tên món</TableHead><TableHead>Thương hiệu</TableHead><TableHead className="text-right">Giá vốn</TableHead><TableHead className="text-right">Giá bán</TableHead><TableHead className="text-right">Lời/món</TableHead><TableHead className="text-right">Biên LN (%)</TableHead></TableRow></TableHeader>
          <TableBody>{rows.map(({ r, cost, profit, mg }) => <TableRow key={r.id} className={cn(mg < 30 && "bg-destructive/5")}><TableCell className="font-semibold">{r.name} <span className="text-xs text-muted-foreground">({r.size})</span></TableCell><TableCell>{r.brand}</TableCell><TableCell className="text-right">{vnd(cost)}</TableCell><TableCell className="text-right">{vnd(r.price)}</TableCell><TableCell className="text-right">{vnd(profit)}</TableCell><TableCell className={cn("text-right font-bold", mg < 30 ? "text-destructive" : "text-success")}>{mg < 30 && <TriangleAlert className="mr-1 inline size-3.5" />}{mg.toFixed(1)}%</TableCell></TableRow>)}</TableBody>
        </Table>
      </div>
    </section>
  );
}

function Stat({ label, value, danger, sub }: { label: string; value: string; danger?: boolean; sub?: string }) {
  return <div className={cn("rounded-md border bg-card p-5 shadow-sm", danger ? "border-destructive/40 bg-destructive/5" : "border-border")}><p className="text-xs font-semibold text-muted-foreground">{label}</p><p className={cn("mt-2 font-display text-2xl font-bold", danger && "text-destructive")}>{value}</p>{sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}</div>;
}

/* ---------------- Doanh thu & Lãi lỗ ---------------- */
const methodLabel: Record<PayMethod, string> = { cash: "Tiền mặt", transfer: "Chuyển khoản", ewallet: "Ví điện tử" };

export function PnlSection() {
  const { data } = useFnb();
  const [mode, setMode] = useState<"month" | "year">("month");
  const [year, setYear] = useState("2026");
  const [month, setMonth] = useState("10");
  const [actual, setActual] = useState<Record<PayMethod, string>>({ cash: "", transfer: "", ewallet: "" });
  const years = Array.from(new Set(["2026", ...data.sales.map((s) => s.date.slice(0, 4))])).sort();
  const prefix = mode === "month" ? `${year}-${month.padStart(2, "0")}` : year;
  const sales = data.sales.filter((s) => s.date.startsWith(prefix));
  const revenue = sales.reduce((s, x) => s + x.total, 0);
  const cogs = sales.reduce((s, x) => s + x.cogs, 0);
  const gross = revenue - cogs;
  const byMethod = (m: PayMethod) => sales.filter((s) => s.method === m).reduce((t, s) => t + s.total, 0);
  const label = mode === "month" ? `tháng ${month}/${year}` : `năm ${year}`;
  const byItem = new Map<string, { qty: number; revenue: number; cogs: number }>();
  sales.forEach((s) => s.lines.forEach((l) => { const c = byItem.get(l.name) ?? { qty: 0, revenue: 0, cogs: 0 }; byItem.set(l.name, { qty: c.qty + l.qty, revenue: c.revenue + l.qty * l.price, cogs: c.cogs + l.qty * l.cost }); }));
  const exportXlsx = () => downloadXlsx(`bao-cao-lai-lo-${prefix}.xlsx`, {
    "Tổng hợp": [["Kỳ", label], ["Doanh thu", Math.round(revenue)], ["COGS", Math.round(cogs)], ["Lợi nhuận gộp", Math.round(gross)], ["Biên LN gộp (%)", revenue ? Math.round((gross / revenue) * 1000) / 10 : 0]],
    "Theo món": [["Món", "Số lượng", "Doanh thu", "COGS", "Lợi nhuận gộp"], ...[...byItem].map(([n, v]) => [n, v.qty, Math.round(v.revenue), Math.round(v.cogs), Math.round(v.revenue - v.cogs)])],
    "Đối chiếu tiền": [["Hình thức", "Hệ thống", "Thực nhận", "Chênh lệch"], ...(Object.keys(methodLabel) as PayMethod[]).map((m) => [methodLabel[m], byMethod(m), Number(actual[m]) || 0, (Number(actual[m]) || 0) - byMethod(m)])],
    "Hóa đơn": [["Số HĐ", "Ngày", "Hình thức", "Doanh thu", "COGS"], ...sales.map((s) => [s.number, new Date(s.date).toLocaleString("vi-VN"), methodLabel[s.method], s.total, Math.round(s.cogs)])],
  });
  return (
    <section className="animate-rise-in space-y-5">
      <PageIntro title="Doanh thu & Lãi lỗ" description={`Báo cáo ${label}, tự cập nhật khi có đơn bán mới.`} action={<div className="flex flex-wrap items-center gap-2"><div className="flex rounded-md border border-border p-1"><Button size="sm" variant={mode === "month" ? "default" : "ghost"} className="h-7" onClick={() => setMode("month")}>Tháng</Button><Button size="sm" variant={mode === "year" ? "default" : "ghost"} className="h-7" onClick={() => setMode("year")}>Năm</Button></div>{mode === "month" && <select aria-label="Tháng" className={cn(inputCls, "w-28")} value={month} onChange={(e) => setMonth(e.target.value)}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={String(i + 1)}>Tháng {i + 1}</option>)}</select>}<select aria-label="Năm" className={cn(inputCls, "w-24")} value={year} onChange={(e) => setYear(e.target.value)}>{years.map((y) => <option key={y}>{y}</option>)}</select><Button onClick={exportXlsx}><Download className="size-4" /> Tải báo cáo (.xlsx)</Button></div>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={mode === "month" ? "Doanh thu tháng" : "Doanh thu năm"} value={vnd(revenue)} sub={`${sales.length} hóa đơn`} />
        <Stat label="COGS tổng" value={vnd(cogs)} />
        <Stat label="Lợi nhuận gộp" value={vnd(gross)} />
        <Stat label="% Biên LN gộp" value={`${revenue ? ((gross / revenue) * 100).toFixed(1) : "0"}%`} danger={revenue > 0 && gross / revenue < 0.3} />
      </div>
      <div className="rounded-md border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4"><h2 className="font-display text-lg font-bold">Đối chiếu tiền thực nhận</h2><p className="mt-1 text-xs text-muted-foreground">Nhập số tiền thực tế đã đếm/nhận để phát hiện chênh lệch so với hệ thống.</p></div>
        <Table>
          <TableHeader><TableRow><TableHead>Hình thức</TableHead><TableHead className="text-right">Doanh thu hệ thống</TableHead><TableHead className="text-right">Thực nhận</TableHead><TableHead className="text-right">Chênh lệch</TableHead></TableRow></TableHeader>
          <TableBody>{(Object.keys(methodLabel) as PayMethod[]).map((m) => { const sys = byMethod(m); const act = actual[m] === "" ? null : Number(actual[m]) || 0; const diff = act === null ? null : act - sys; return <TableRow key={m}><TableCell className="font-semibold">{methodLabel[m]}</TableCell><TableCell className="text-right">{vnd(sys)}</TableCell><TableCell className="text-right"><input type="number" aria-label={`Thực nhận ${methodLabel[m]}`} className={cn(inputCls, "ml-auto w-40 text-right")} value={actual[m]} placeholder="0" onChange={(e) => setActual({ ...actual, [m]: e.target.value })} /></TableCell><TableCell className={cn("text-right font-bold", diff === null ? "text-muted-foreground" : diff === 0 ? "text-success" : "text-destructive")}>{diff === null ? "—" : diff === 0 ? "Khớp" : `${diff > 0 ? "+" : ""}${vnd(diff)}`}</TableCell></TableRow>; })}</TableBody>
        </Table>
      </div>
    </section>
  );
}

/* ---------------- Kiểm kê kho ---------------- */
export function StocktakeSection() {
  const { data, addMovement } = useFnb();
  const rows = data.ingredients.filter((i) => i.active && i.ratio > 1);
  const [counts, setCounts] = useState<Record<string, { sealed: string; open: string }>>({});
  const [saved, setSaved] = useState("");
  const get = (i: Ingredient) => counts[i.id] ?? { sealed: String(Math.floor(i.stock / i.ratio)), open: String(Math.round(i.stock - Math.floor(i.stock / i.ratio) * i.ratio)) };
  const set = (id: string, k: "sealed" | "open", v: string, i: Ingredient) => { setSaved(""); setCounts((c) => ({ ...c, [id]: { ...get(i), [k]: v } })); };
  const save = () => {
    let n = 0;
    for (const i of rows) {
      if (!counts[i.id]) continue;
      const c = get(i); const total = stocktakeTotal(Number(c.sealed) || 0, Number(c.open) || 0, i.ratio); const diff = Math.round((total - i.stock) * 100) / 100;
      if (diff !== 0) { addMovement({ id: uid(), date: today(), targetKind: "ing", targetId: i.id, kind: diff > 0 ? "in" : "out", qty: diff, note: "Điều chỉnh theo kiểm kê" }); n++; }
    }
    setCounts({}); setSaved(n ? `Đã cập nhật tồn kho cho ${n} nguyên liệu.` : "Không có chênh lệch so với tồn kho.");
  };
  const numCls = "h-9 w-20 rounded-md border border-input bg-background px-2 text-right text-sm font-semibold outline-none focus:ring-2 focus:ring-ring";
  return (
    <section className="animate-rise-in space-y-5">
      <PageIntro title="Kiểm kê kho" description="Nhập số bao bì nguyên seal và lượng đang dùng dở; tồn kho quy đổi tự tính." action={<div className="no-print flex gap-2"><Button variant="outline" onClick={() => window.print()}><Printer className="size-4" /> In phiếu</Button><Button onClick={save}>Lưu kiểm kê</Button></div>} />
      {saved && <p className="no-print rounded-md bg-secondary px-4 py-2 text-sm font-semibold">{saved}</p>}
      <div id="management-print-area" data-print-kind="stocktake" className="overflow-x-auto rounded-md border border-border bg-card shadow-sm">
        <div className="print-heading hidden"><h1>Phiếu kiểm kê kho</h1><p>FUGUMI CRAFT - Blooming Matcha &amp; Cafe</p></div>
        <Table>
          <TableHeader><TableRow><TableHead>Nguyên liệu</TableHead><TableHead>Nguyên seal</TableHead><TableHead>Đang sử dụng</TableHead><TableHead>Mức còn lại</TableHead><TableHead>Tồn quy đổi</TableHead></TableRow></TableHeader>
          <TableBody>{rows.map((i) => {
            const c = get(i); const open = Number(c.open) || 0; const total = stocktakeTotal(Number(c.sealed) || 0, open, i.ratio);
            const pct = Math.min(100, Math.round((open / i.ratio) * 100)); const changed = Math.abs(total - i.stock) > 0.001;
            return <TableRow key={i.id}>
              <TableCell><p className="font-semibold">{i.name}</p><p className="text-xs text-muted-foreground">1 {i.buyUnit} = {fmtQty(i.ratio)} {i.useUnit}</p></TableCell>
               <TableCell><div className="flex items-center gap-2"><input type="number" min={0} inputMode="numeric" aria-label={`Nguyên seal ${i.name}`} className={cn(numCls, "no-print")} value={c.sealed} onChange={(e) => set(i.id, "sealed", e.target.value, i)} /><span className="print-heading hidden">{fmtQty(Number(c.sealed) || 0)}</span><span className="text-xs text-muted-foreground">{i.buyUnit}</span></div></TableCell>
               <TableCell><div className="flex items-center gap-2"><input type="number" min={0} max={i.ratio} aria-label={`Đang sử dụng ${i.name}`} className={cn(numCls, "no-print")} value={c.open} onChange={(e) => set(i.id, "open", e.target.value, i)} /><span className="print-heading hidden">{fmtQty(open)}</span><span className="text-xs text-muted-foreground">/ {fmtQty(i.ratio)} {i.useUnit}</span></div></TableCell>
              <TableCell><div className="flex min-w-28 items-center gap-3"><progress className="h-2 flex-1 accent-success" max={100} value={pct} /><span className="text-xs font-bold">{pct}%</span></div></TableCell>
              <TableCell><p className="font-bold">{fmtQty(total)} {i.useUnit}</p>{changed && <p className={cn("text-xs font-semibold", total < i.stock ? "text-destructive" : "text-success")}>{total > i.stock ? "+" : ""}{fmtQty(total - i.stock)} so với hệ thống</p>}</TableCell>
            </TableRow>;
          })}</TableBody>
        </Table>
      </div>
    </section>
  );
}

function CategorySelect({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return <select aria-label="Chọn nhóm" value={value} onChange={(e) => onChange(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-ring sm:w-48">{options.map((o) => <option key={o} value={o}>{o}</option>)}</select>;
}

/* ---------------- Bán hàng (POS) ---------------- */
export function PosSection() {
  const { data, checkout } = useFnb();
  const [category, setCategory] = useState("Tất cả");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [paper, setPaper] = useState<"80" | "57">("80");
  const [method, setMethod] = useState<PayMethod>("cash");
  const [invoice, setInvoice] = useState<Sale | null>(null);
  const [discMode, setDiscMode] = useState<"vnd" | "pct">("vnd");
  const [discInput, setDiscInput] = useState("");
  const products = data.recipes.filter((r) => r.active);
  const categories = ["Tất cả", ...Array.from(new Set(products.map((p) => p.group)))];
  const filtered = products.filter((p) => (category === "Tất cả" || p.group === category) && p.name.toLowerCase().includes(query.toLowerCase()));
  const lines = products.filter((p) => cart[p.id]).map((p) => ({ ...p, quantity: cart[p.id] ?? 0 }));
  const total = useMemo(() => lines.reduce((s, l) => s + l.price * l.quantity, 0), [lines]);
  const discVal = Math.max(0, Number(discInput) || 0);
  const discount = Math.min(total, Math.round(discMode === "pct" ? (total * Math.min(discVal, 100)) / 100 : discVal));
  const payable = total - discount;
  const change = (id: string, d: number) => setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) + d) }));
  const pay = () => {
    if (!lines.length) return;
    const sale = checkout(lines.map((l) => ({ recipeId: l.id, qty: l.quantity })), method, `BS${String(Date.now()).slice(-6)}`, discount);
    if (!sale) return;
    setInvoice(sale);
    setCart({});
    setDiscInput("");
    window.setTimeout(() => window.print(), 50);
  };
  return (
    <section className="animate-rise-in -mx-4 -my-6 grid min-h-[calc(100vh-5rem)] bg-card md:-mx-8 md:-my-8 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="min-w-0 border-r border-border p-4 md:p-6">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h1 className="font-display text-2xl font-bold">Bán hàng</h1><p className="mt-1 text-sm text-muted-foreground">Thanh toán sẽ tự trừ kho theo công thức và ghi doanh thu.</p></div><div className="flex flex-col gap-2 sm:flex-row"><CategorySelect value={category} options={categories} onChange={setCategory} /><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm món..." className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring md:w-56" /></div></div></div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-4">{filtered.map((p) => <Button key={p.id} variant="outline" onClick={() => change(p.id, 1)} className="h-36 flex-col items-stretch justify-between p-4 text-left hover:border-primary hover:bg-secondary"><span className="flex size-10 items-center justify-center rounded-md bg-secondary font-display font-bold text-primary">{p.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}</span><span><span className="block whitespace-normal font-bold leading-5">{p.name}</span><span className="mt-1 block text-xs font-medium text-muted-foreground">{p.group} · {p.size}</span></span><span className="text-base font-bold text-primary">{vnd(p.price)}</span></Button>)}</div>
      </div>
      <aside className="flex min-h-[620px] flex-col bg-background p-4 md:p-6">
        <div className="flex items-center justify-between border-b border-border pb-4"><div><p className="text-xs font-bold uppercase text-muted-foreground">Đơn hiện tại</p><h2 className="mt-1 font-display text-xl font-bold">Tại quầy</h2></div><ShoppingBag className="size-6 text-primary" /></div>
        <div className="flex-1 space-y-3 overflow-y-auto py-4">{lines.length === 0 ? <div className="flex h-full min-h-56 flex-col items-center justify-center text-center text-muted-foreground"><ReceiptText className="mb-3 size-9" /><p className="font-semibold">Chưa có món nào</p><p className="mt-1 text-xs">{invoice ? `Đã thanh toán ${invoice.number} · ${vnd(invoice.total)}` : "Chạm vào món bên trái để bắt đầu."}</p></div> : lines.map((l) => <div key={l.id} className="rounded-md border border-border bg-card p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold">{l.name}</p><p className="mt-1 text-xs text-muted-foreground">{vnd(l.price)}</p></div><Button variant="ghost" size="icon" className="size-8" aria-label={`Xóa ${l.name}`} onClick={() => setCart((c) => ({ ...c, [l.id]: 0 }))}><Trash2 className="size-4" /></Button></div><div className="mt-3 flex items-center justify-between"><div className="flex items-center gap-1"><Button variant="outline" size="icon" className="size-8" aria-label="Giảm" onClick={() => change(l.id, -1)}><Minus className="size-3" /></Button><span className="w-8 text-center text-sm font-bold">{l.quantity}</span><Button variant="outline" size="icon" className="size-8" aria-label="Tăng" onClick={() => change(l.id, 1)}><Plus className="size-3" /></Button></div><p className="font-bold">{vnd(l.price * l.quantity)}</p></div></div>)}</div>
        <div className="border-t border-border pt-4">
          <div className="mb-2 flex items-center justify-between text-sm"><span className="text-muted-foreground">Tạm tính</span><span className="font-semibold">{vnd(total)}</span></div>
          <div className="mb-2 flex items-center justify-between gap-3"><span className="text-sm font-semibold">Chiết khấu</span><div className="flex items-center gap-1"><input type="number" min={0} value={discInput} onChange={(e) => setDiscInput(e.target.value)} placeholder="0" aria-label="Chiết khấu" className="h-8 w-24 rounded-md border border-input bg-background px-2 text-right text-sm outline-none focus:ring-2 focus:ring-ring" /><div className="flex rounded-md border border-border p-0.5"><Button size="sm" variant={discMode === "vnd" ? "default" : "ghost"} className="h-7 px-2" onClick={() => setDiscMode("vnd")}>đ</Button><Button size="sm" variant={discMode === "pct" ? "default" : "ghost"} className="h-7 px-2" onClick={() => setDiscMode("pct")}>%</Button></div></div></div>
          {discount > 0 && <div className="mb-2 flex justify-end text-xs font-semibold text-destructive">−{vnd(discount)}</div>}
          <div className="mb-4 flex items-center justify-between text-xl font-bold"><span>Khách phải trả</span><span className="text-primary">{vnd(payable)}</span></div>
          <div className="mb-3 grid grid-cols-3 gap-1 rounded-md border border-border p-1">{(Object.keys(methodLabel) as PayMethod[]).map((m) => <Button key={m} size="sm" variant={method === m ? "default" : "ghost"} className="h-8 px-1 text-xs" onClick={() => setMethod(m)}>{methodLabel[m]}</Button>)}</div>
          <div className="mb-3 flex items-center justify-between"><span className="text-xs font-semibold text-muted-foreground">Khổ giấy</span><div className="flex rounded-md border border-border p-1"><Button size="sm" variant={paper === "80" ? "default" : "ghost"} className="h-7" onClick={() => setPaper("80")}>K80</Button><Button size="sm" variant={paper === "57" ? "default" : "ghost"} className="h-7" onClick={() => setPaper("57")}>K57</Button></div></div>
          <Button className="h-12 w-full" disabled={!lines.length} onClick={pay}><Printer className="size-5" /> Thanh toán & In hóa đơn</Button>
        </div>
      </aside>
      {invoice && <InvoicePrintArea sale={invoice} paper={paper} />}
    </section>
  );
}

function InvoicePrintArea({ sale, paper }: { sale: Sale; paper: "80" | "57" }) {
  return <div id="invoice-print-area" data-paper={paper} aria-hidden="true"><div className="invoice-center"><h1>BẾP SỐ</h1><p>HÓA ĐƠN BÁN HÀNG</p></div><div className="invoice-rule" /><p>Số HĐ: {sale.number}</p><p>Ngày giờ: {new Date(sale.date).toLocaleString("vi-VN")}</p><p>Thanh toán: {methodLabel[sale.method]}</p><div className="invoice-rule" />{sale.lines.map((l) => <div key={l.recipeId} className="invoice-line"><div><strong>{l.name}</strong><br /><span>{l.qty} × {money.format(l.price)}</span></div><strong>{money.format(l.qty * l.price)}</strong></div>)}<div className="invoice-rule" />{(sale.discount ?? 0) > 0 && <><div className="invoice-line"><span>Tạm tính</span><span>{money.format(sale.subtotal ?? sale.total)}</span></div><div className="invoice-line"><span>Chiết khấu</span><span>-{money.format(sale.discount ?? 0)}</span></div></>}<div className="invoice-total"><strong>KHÁCH PHẢI TRẢ</strong><strong>{money.format(sale.total)} ₫</strong></div><div className="invoice-rule" /><p className="invoice-center">Cảm ơn quý khách và hẹn gặp lại!</p></div>;
}

function PageIntro({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><h1 className="font-display text-2xl font-bold md:text-3xl">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{description}</p></div>{action}</div>;
}
