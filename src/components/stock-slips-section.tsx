import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Field, inputCls } from "@/components/fnb-dialogs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtQty, ingUnitCost, prepUnitCost, uid, vnd, type Movement } from "@/lib/fnb-calc";
import { useFnb } from "@/lib/fnb-store";

type Line = { id: string; target: string; qty: string };

export function StockSlipsSection() {
  const { data, addMovement } = useFnb();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"in" | "out">("in");
  const [filter, setFilter] = useState("all");
  const [lines, setLines] = useState<Line[]>([]);
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState("");
  const [detail, setDetail] = useState<string | null>(null);
  const options = [
    ...data.ingredients.filter((i) => i.active).map((i) => ({ id: `ing:${i.id}`, name: i.name, unit: i.useUnit, cost: ingUnitCost(i), stock: i.stock })),
    ...data.preps.filter((p) => p.active).map((p) => ({ id: `prep:${p.id}`, name: `[BTP] ${p.name}`, unit: p.unit, cost: prepUnitCost(p, data.ingredients), stock: p.stock })),
  ];
  const groups = new Map<string, Movement[]>();
  data.movements.filter((m) => m.kind !== "sale" && (m.slipId || !/kiểm kê|hoàn kho/i.test(m.note))).forEach((m) => {
    const id = m.slipId ?? m.id;
    groups.set(id, [...(groups.get(id) ?? []), m]);
  });
  const costOf = (m: Movement) => m.unitCost ?? options.find((o) => o.id === `${m.targetKind}:${m.targetId}`)?.cost ?? 0;
  const slips = [...groups.entries()].reverse().map(([id, items]) => ({ id, items, first: items[0], total: items.reduce((s, m) => s + Math.abs(m.qty) * costOf(m), 0) }));
  const visible = slips.filter((s) => filter === "all" || s.first?.kind === filter);
  const total = lines.reduce((sum, line) => sum + (Number(line.qty) || 0) * (options.find((o) => o.id === line.target)?.cost ?? 0), 0);
  const valid = lines.length > 0 && lines.every((l) => options.some((o) => o.id === l.target) && Number.isFinite(Number(l.qty)) && Number(l.qty) > 0);
  const overStock = kind === "out" && options.some((o) => lines.filter((l) => l.target === o.id).reduce((sum, l) => sum + (Number(l.qty) || 0), 0) > o.stock);
  const addLine = () => setLines((ls) => [...ls, { id: uid(), target: options[0]?.id ?? "", qty: "" }]);
  const save = () => {
    if (!valid || overStock) return;
    const date = new Date().toISOString();
    const slipId = `${kind === "in" ? "PN" : "PX"}-${date.slice(0, 10).replaceAll("-", "")}-${uid().slice(0, 5).toUpperCase()}`;
    for (const line of lines) {
      const option = options.find((o) => o.id === line.target);
      if (!option) continue;
      const [targetKind, targetId] = line.target.split(":");
      if ((targetKind !== "ing" && targetKind !== "prep") || !targetId) continue;
      addMovement({ id: uid(), slipId, date, targetKind, targetId, kind, qty: Number(line.qty) * (kind === "out" ? -1 : 1), unitCost: option.cost, note: note.trim() || (kind === "in" ? "Nhập kho" : "Xuất kho") });
    }
    setOpen(false);
    setNotice(`Đã tạo phiếu ${slipId} và cập nhật tồn kho.`);
  };
  const selected = slips.find((s) => s.id === detail);
  return <section className="animate-rise-in space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-2xl font-bold">Phiếu kho</h2><Button onClick={() => { setLines([{ id: uid(), target: options[0]?.id ?? "", qty: "" }]); setKind("in"); setNote(""); setOpen(true); }}><Plus className="size-4" /> Tạo phiếu mới</Button></div>
    {notice && <p role="status" className="text-sm font-semibold text-success">{notice}</p>}
    <Field label="Loại phiếu" className="max-w-52"><select className={inputCls} value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">Tất cả</option><option value="in">Nhập kho</option><option value="out">Xuất kho</option></select></Field>
    <div className="overflow-hidden rounded-md border border-border bg-card"><Table><TableHeader><TableRow><TableHead>Mã phiếu</TableHead><TableHead>Loại phiếu</TableHead><TableHead>Ngày tạo</TableHead><TableHead className="text-right">Tổng tiền</TableHead><TableHead>Trạng thái</TableHead></TableRow></TableHeader><TableBody>
      {!visible.length && <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Chưa có phiếu kho.</TableCell></TableRow>}
      {visible.map((s) => <TableRow key={s.id}><TableCell><Button variant="ghost" size="sm" onClick={() => setDetail(s.id)}>{s.id}</Button></TableCell><TableCell>{s.first?.kind === "in" ? "Nhập kho" : "Xuất kho"}</TableCell><TableCell>{s.first && new Date(s.first.date).toLocaleString("vi-VN")}</TableCell><TableCell className="text-right font-semibold">{vnd(s.total)}</TableCell><TableCell><span className="rounded bg-success-soft px-2 py-1 text-xs font-semibold text-success">Đã ghi nhận</span></TableCell></TableRow>)}
    </TableBody></Table></div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle>Tạo phiếu kho mới</DialogTitle><DialogDescription>{kind === "in" ? "Phiếu nhập kho" : "Phiếu xuất kho"}</DialogDescription></DialogHeader>
      <Field label="Loại phiếu"><select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value === "out" ? "out" : "in")}><option value="in">Nhập kho</option><option value="out">Xuất kho</option></select></Field>
      {lines.map((line, idx) => { const opt = options.find((o) => o.id === line.target); return <div key={line.id} className="grid grid-cols-[minmax(0,1fr)_40px] items-end gap-2 sm:grid-cols-[minmax(0,1fr)_130px_100px_40px]">
        <Field label={`Nguyên liệu / BTP ${idx + 1}`}><select className={inputCls} value={line.target} onChange={(e) => setLines((ls) => ls.map((l) => l.id === line.id ? { ...l, target: e.target.value } : l))}><option value="" disabled>Chọn nguyên liệu</option>{options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></Field>
        <Field label={`Số lượng (${opt?.unit ?? "—"})`} className="col-start-1 sm:col-start-auto"><input aria-label={`Số lượng dòng ${idx + 1}`} type="number" min="0" step="any" className={inputCls} value={line.qty} onChange={(e) => setLines((ls) => ls.map((l) => l.id === line.id ? { ...l, qty: e.target.value } : l))} /></Field>
        <p className="col-start-1 py-2 text-sm font-semibold sm:col-start-auto">{vnd((Number(line.qty) || 0) * (opt?.cost ?? 0))}</p><Button variant="ghost" size="icon" aria-label={`Xóa dòng ${idx + 1}`} onClick={() => setLines((ls) => ls.filter((l) => l.id !== line.id))}><Trash2 className="size-4" /></Button>
      </div>; })}
      <Button variant="outline" disabled={!options.length} onClick={addLine}><Plus className="size-4" /> Thêm dòng</Button>
      {!options.length && <p className="text-sm text-muted-foreground">Chưa có nguyên liệu hoặc bán thành phẩm.</p>}
      <Field label="Ghi chú"><input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      {overStock && <p role="alert" className="text-sm text-destructive">Số lượng xuất vượt tồn kho hiện tại.</p>}
      <p className="text-right text-lg font-bold">Tổng tiền: {vnd(total)}</p><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button disabled={!valid || overStock} onClick={save}>Ghi nhận phiếu</Button></DialogFooter>
    </DialogContent></Dialog>
    <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setDetail(null); }}><DialogContent><DialogHeader><DialogTitle>Phiếu {selected?.id}</DialogTitle><DialogDescription>{selected?.first?.note}</DialogDescription></DialogHeader><ul className="divide-y divide-border">{selected?.items.map((m) => { const opt = options.find((o) => o.id === `${m.targetKind}:${m.targetId}`); return <li key={m.id} className="flex justify-between gap-3 py-3 text-sm"><span>{opt?.name ?? m.targetId}<span className="block text-muted-foreground">{fmtQty(Math.abs(m.qty))} {opt?.unit}</span></span><strong>{vnd(Math.abs(m.qty) * costOf(m))}</strong></li>; })}</ul><p className="text-right font-bold">Tổng tiền: {vnd(selected?.total ?? 0)}</p></DialogContent></Dialog>
  </section>;
}