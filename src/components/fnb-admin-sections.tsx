import { Banknote, Check, CircleAlert, FileSpreadsheet, Minus, ReceiptText, RefreshCcw, ShieldCheck, Trash2, UserCog } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { vnd, type PayMethod } from "@/lib/fnb-calc";
import { useFnb } from "@/lib/fnb-store";
import { cn } from "@/lib/utils";

const METHOD_LABEL: Record<PayMethod, string> = { cash: "Tiền mặt", transfer: "Chuyển khoản", ewallet: "Ví điện tử" };
const sameDay = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
const dateLabel = (iso: string) => new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });

/** Mục 6 — Hủy cuối ngày: hoàn kho và gỡ đơn đã bán trong ngày. */
export function EndOfDaySection() {
  const { data, cancelSale } = useFnb();
  const [confirming, setConfirming] = useState<string | null>(null);
  const today = data.sales.filter((s) => sameDay(s.date)).sort((a, b) => b.date.localeCompare(a.date));
  const recent = [...data.sales].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  const revenue = today.reduce((s, x) => s + x.total, 0);

  return (
    <div className="animate-rise-in space-y-6">
      <section className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div><h2 className="font-display text-xl font-bold">Hủy cuối ngày</h2><p className="mt-1 text-sm text-muted-foreground">Hoàn kho theo đúng định lượng đã trừ khi bán, trước khi chốt sổ.</p></div>
        <span className="inline-flex items-center gap-2 self-start rounded-md bg-warning-soft px-3 py-1.5 text-xs font-semibold text-warning"><CircleAlert className="size-4" /> Chỉ hủy được đơn trong hôm nay</span>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Đơn hôm nay", value: String(today.length), meta: "Chưa chốt sổ" },
          { label: "Doanh thu hôm nay", value: vnd(revenue), meta: "Sau chiết khấu" },
          { label: "Giá vốn hôm nay", value: vnd(today.reduce((s, x) => s + x.cogs, 0)), meta: "Hoàn kho khi hủy" },
        ].map((c) => (
          <article key={c.label} className="rounded-md border border-border bg-card p-5 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">{c.label}</p>
            <p className="mt-2 font-display text-2xl font-bold">{c.value}</p>
            <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">{c.meta}</p>
          </article>
        ))}
      </section>

      <section className="rounded-md border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-display text-lg font-bold">Đơn bán hôm nay</h3>
          <span className="rounded-md bg-secondary px-2.5 py-1 text-xs font-bold text-secondary-foreground">{today.length} đơn</span>
        </div>
        {today.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">Hôm nay chưa có đơn nào bán ra. Khi có đơn tại mục Bán hàng, bạn có thể hủy ngay tại đây trước khi chốt ngày.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left text-xs uppercase text-muted-foreground"><th className="px-5 py-3 font-semibold">Số HĐ</th><th className="px-3 py-3 font-semibold">Giờ</th><th className="px-3 py-3 font-semibold">Món</th><th className="px-3 py-3 font-semibold">Thanh toán</th><th className="px-3 py-3 text-right font-semibold">Khách phải trả</th><th className="px-5 py-3 text-right font-semibold">Thao tác</th></tr></thead>
              <tbody className="divide-y divide-border">
                {today.map((s) => (
                  <tr key={s.id}>
                    <td className="px-5 py-3 font-semibold">{s.number}</td>
                    <td className="px-3 py-3 text-muted-foreground">{timeOf(s.date)}</td>
                    <td className="px-3 py-3">{s.lines.map((l) => `${l.name} × ${l.qty}`).join(", ")}</td>
                    <td className="px-3 py-3 text-muted-foreground">{METHOD_LABEL[s.method]}</td>
                    <td className="px-3 py-3 text-right font-semibold">{vnd(s.total)}</td>
                    <td className="px-5 py-3 text-right">
                      {confirming === s.id ? (
                        <span className="inline-flex items-center gap-2">
                          <Button size="sm" variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => { cancelSale(s.id); setConfirming(null); }}>Xác nhận hủy</Button>
                          <Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>Giữ</Button>
                        </span>
                      ) : (
                        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => setConfirming(s.id)}><Trash2 className="size-4" /> Hủy đơn</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-md border border-border bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4"><ReceiptText className="size-4 text-muted-foreground" /><h3 className="font-display text-base font-bold">Đơn gần đây (đã chốt, chỉ xem)</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left text-xs uppercase text-muted-foreground"><th className="px-5 py-3 font-semibold">Số HĐ</th><th className="px-3 py-3 font-semibold">Ngày</th><th className="px-3 py-3 font-semibold">Món</th><th className="px-3 py-3 text-right font-semibold">Khách phải trả</th></tr></thead>
            <tbody className="divide-y divide-border">
              {recent.map((s) => (
                <tr key={s.id} className="text-muted-foreground">
                  <td className="px-5 py-3 font-medium text-foreground">{s.number}</td>
                  <td className="px-3 py-3">{dateLabel(s.date)}</td>
                  <td className="px-3 py-3">{s.lines.map((l) => `${l.name} × ${l.qty}`).join(", ")}</td>
                  <td className="px-3 py-3 text-right font-medium text-foreground">{vnd(s.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const matrix: { label: string; staff: boolean; manager: boolean; admin: boolean }[] = [
  { label: "Bán hàng & in hóa đơn", staff: true, manager: true, admin: true },
  { label: "Kiểm kê, nhập / xuất kho", staff: true, manager: true, admin: true },
  { label: "Hủy đơn cuối ngày", staff: false, manager: true, admin: true },
  { label: "Sửa công thức & giá vốn", staff: false, manager: true, admin: true },
  { label: "Xem doanh thu & lãi lỗ", staff: false, manager: true, admin: true },
  { label: "Phân quyền người dùng", staff: false, manager: false, admin: true },
];

/** Mục 11 — Super Admin: ma trận quyền theo vai trò, sẽ gắn theo email Gmail khi kết nối. */
export function SuperAdminSection() {
  return (
    <div className="animate-rise-in space-y-6">
      <section>
        <h2 className="font-display text-xl font-bold">Super Admin</h2>
        <p className="mt-1 text-sm text-muted-foreground">Ba cấp quyền trên từng cửa hàng. Khi kết nối Google, quyền sẽ gắn theo email Gmail của từng người.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { icon: ShieldCheck, title: "Admin (Chủ quán)", desc: "Toàn quyền: kho, công thức, bán hàng, báo cáo và phân quyền." },
          { icon: UserCog, title: "Manager (Quản lý)", desc: "Vận hành: kho, công thức, giá vốn, báo cáo và hủy đơn." },
          { icon: Banknote, title: "Staff (Nhân viên)", desc: "Nghiệp vụ hằng ngày: bán hàng, kiểm kê và nhập kho." },
        ].map((r) => (
          <article key={r.title} className="rounded-md border border-border bg-card p-5 shadow-sm">
            <div className="flex size-10 items-center justify-center rounded-md bg-secondary text-primary"><r.icon className="size-5" /></div>
            <h3 className="mt-4 font-display font-bold">{r.title}</h3>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">{r.desc}</p>
          </article>
        ))}
      </section>

      <section className="rounded-md border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4"><h3 className="font-display text-lg font-bold">Ma trận quyền chi tiết</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left text-xs uppercase text-muted-foreground"><th className="px-5 py-3 font-semibold">Nghiệp vụ</th><th className="px-3 py-3 text-center font-semibold">Staff</th><th className="px-3 py-3 text-center font-semibold">Manager</th><th className="px-5 py-3 text-center font-semibold">Admin</th></tr></thead>
            <tbody className="divide-y divide-border">
              {matrix.map((row) => (
                <tr key={row.label}>
                  <td className="px-5 py-3">{row.label}</td>
                  {[row.staff, row.manager, row.admin].map((ok, i) => (
                    <td key={i} className={cn("px-3 py-3 text-center last:px-5", ok ? "text-success" : "text-muted-foreground/50")}>{ok ? <Check className="mx-auto size-4" /> : <Minus className="mx-auto size-4" />}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-border px-5 py-4 text-xs text-muted-foreground">Ma trận này là chuẩn mặc định; sẽ khóa theo email Gmail khi kết nối lưu trữ.</p>
      </section>
    </div>
  );
}

/** Mục 10 — Cài đặt: nhận diện, đơn vị và chuẩn in hiện tại. */
export function SettingsSection() {
  const rows = [
    { icon: ShieldCheck, label: "Tên ứng dụng", value: "Fumi Go" },
    { icon: RefreshCcw, label: "Thương hiệu quán", value: "FUGUMI CRAFT — Blooming Matcha & Coffee" },
    { icon: Banknote, label: "Đơn vị tiền", value: "VNĐ (₫), đã gồm thuế hiển thị" },
    { icon: ReceiptText, label: "Khổ hóa đơn in", value: "Nhiệt K80 (80mm) / K57 (57mm)" },
    { icon: FileSpreadsheet, label: "Lưu trữ vĩnh viễn", value: "Google Sheets trên Drive của bạn — đang chuẩn bị kết nối" },
    { icon: Check, label: "Phiên bản", value: "v1.0.0 — © 2026 Digital Solutions" },
  ];
  return (
    <div className="animate-rise-in space-y-6">
      <section>
        <h2 className="font-display text-xl font-bold">Cài đặt</h2>
        <p className="mt-1 text-sm text-muted-foreground">Thông tin nhận diện và chuẩn vận hành hiện tại của quán.</p>
      </section>
      <section className="rounded-md border border-border bg-card shadow-sm">
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center gap-4 px-5 py-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary"><r.icon className="size-4" /></span>
              <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{r.label}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{r.value}</p></div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
