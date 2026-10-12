import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { forecastPrep } from "@/lib/forecast.functions";
import type { ForecastResult } from "@/lib/forecast.server";

const sampleSales = `Ngày, Ca, Món, Số ly
29/09, Tối, Cà phê sữa, 64
29/09, Tối, Trà đào cam sả, 41
30/09, Tối, Cà phê sữa, 58
30/09, Tối, Trà đào cam sả, 47
01/10, Tối, Cà phê sữa, 71
01/10, Tối, Trà đào cam sả, 52`;

const sampleInventory = `Nguyên liệu, Tồn, Đơn vị, Định lượng/ly
Cà phê rang xay, 900, g, 20g/ly cà phê sữa
Sữa đặc, 1200, ml, 30ml/ly cà phê sữa
Đào ngâm, 25, miếng, 2 miếng/ly trà đào
Trà đen ủ (BTP), 2500, ml, 150ml/ly trà đào
Syrup đào, 400, ml, 20ml/ly trà đào`;

export function ForecastSection() {
  const run = useServerFn(forecastPrep);
  const [sales, setSales] = useState(sampleSales);
  const [inventory, setInventory] = useState(sampleInventory);
  const [shift, setShift] = useState("Ca tối thứ Sáu 02/10");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ForecastResult | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await run({ data: { sales, inventory, shift, notes } });
      if (res.ok) setResult(res.result);
      else setError(res.error);
    } catch {
      setError("Vui lòng nhập đủ dữ liệu bán hàng, tồn kho và ca dự báo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-rise-in">
      <div>
        <h1 className="font-display text-2xl font-bold">Dự báo chuẩn bị (AI)</h1>
        <p className="mt-1 text-sm text-muted-foreground">Dán dữ liệu bán hàng và tồn kho, AI sẽ gợi ý lượng nguyên liệu cần chuẩn bị cho ca tiếp theo.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2 rounded-md border border-border bg-card p-4 shadow-sm">
          <Label htmlFor="sales">Dữ liệu bán hàng gần đây</Label>
          <Textarea id="sales" rows={9} value={sales} onChange={(e) => setSales(e.target.value)} className="font-mono text-xs" />
        </div>
        <div className="space-y-2 rounded-md border border-border bg-card p-4 shadow-sm">
          <Label htmlFor="inventory">Tồn kho hiện tại & định lượng</Label>
          <Textarea id="inventory" rows={9} value={inventory} onChange={(e) => setInventory(e.target.value)} className="font-mono text-xs" />
        </div>
      </div>
      <div className="grid gap-4 rounded-md border border-border bg-card p-4 shadow-sm md:grid-cols-[1fr_2fr_auto] md:items-end">
        <div className="space-y-2"><Label htmlFor="shift">Ca cần dự báo</Label><Input id="shift" value={shift} onChange={(e) => setShift(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="notes">Ghi chú (sự kiện, thời tiết, khuyến mãi...)</Label><Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ví dụ: cuối tuần, trời nóng, có khuyến mãi trà đào" /></div>
        <Button onClick={submit} disabled={loading}>{loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}{loading ? "Đang dự báo..." : "Dự báo ca tiếp theo"}</Button>
      </div>
      {error && <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
      {result && (
        <div className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4"><h2 className="font-display text-lg font-bold">Kết quả dự báo · {shift}</h2><p className="mt-1 text-sm text-muted-foreground">{result.summary}</p></div>
          <Table>
            <TableHeader><TableRow><TableHead>Nguyên liệu</TableHead><TableHead className="text-right">Tồn hiện tại</TableHead><TableHead className="text-right">Nhu cầu dự báo</TableHead><TableHead className="text-right">Cần chuẩn bị</TableHead><TableHead>Ghi chú</TableHead></TableRow></TableHeader>
            <TableBody>{result.items.map((i) => (
              <TableRow key={i.ingredient}>
                <TableCell className="font-semibold">{i.ingredient}</TableCell>
                <TableCell className="text-right">{i.currentStock} {i.unit}</TableCell>
                <TableCell className="text-right">{i.forecastNeed} {i.unit}</TableCell>
                <TableCell className="text-right font-bold text-primary">{i.prepareQty > 0 ? `${i.prepareQty} ${i.unit}` : "Đủ"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{i.note}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
