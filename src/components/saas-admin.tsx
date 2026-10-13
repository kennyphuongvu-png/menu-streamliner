import { Bell, CheckCircle2, Clock, Lock, Unlock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type StoreRow = { id: string; name: string; owner_name: string; phone: string; email: string; business_field: string; status: "trial" | "active" | "locked"; trial_ends_at: string; created_at: string };
type Noti = { id: string; title: string; body: string; read: boolean; created_at: string };

const STATUS: Record<StoreRow["status"], { label: string; cls: string }> = {
  trial: { label: "Dùng thử giới hạn", cls: "bg-warning-soft text-warning" },
  active: { label: "Đã kích hoạt", cls: "bg-success/15 text-success" },
  locked: { label: "Đã khóa", cls: "bg-destructive/15 text-destructive" },
};

export function playBell() {
  try {
    const ctx = new AudioContext();
    [880, 1320].forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.value = f; o.connect(g); g.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.18;
      g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      o.start(t); o.stop(t + 0.6);
    });
  } catch { /* trình duyệt chặn âm thanh */ }
}

/** Chuông thông báo đăng ký mới — lắng nghe tức thời cho Super Admin. */
export function useAdminNotifications(enabled: boolean) {
  const [items, setItems] = useState<Noti[]>([]);
  const load = useCallback(async () => {
    const { data } = await supabase.from("admin_notifications").select("*").order("created_at", { ascending: false }).limit(30);
    setItems((data as Noti[]) ?? []);
  }, []);
  useEffect(() => {
    if (!enabled) return;
    void load();
    const ch = supabase.channel("admin-noti").on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_notifications" }, (p) => {
      const n = p.new as Noti;
      setItems((s) => [n, ...s]);
      playBell();
      toast(n.title, { description: n.body });
    }).subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [enabled, load]);
  const markAll = async () => {
    await supabase.from("admin_notifications").update({ read: true }).eq("read", false);
    setItems((s) => s.map((x) => ({ ...x, read: true })));
  };
  return { items, unread: items.filter((x) => !x.read).length, markAll };
}

export function NotificationBell({ items, unread, markAll }: ReturnType<typeof useAdminNotifications>) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button variant="outline" size="icon" aria-label="Thông báo" className="relative" onClick={() => setOpen((o) => !o)}>
        <Bell className="size-[18px]" />
        {unread > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">{unread}</span>}
      </Button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 rounded-md border border-border bg-popover text-popover-foreground shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-2"><p className="text-sm font-semibold">Thông báo</p><button className="text-xs text-primary" onClick={markAll}>Đánh dấu đã đọc</button></div>
          <ul className="max-h-80 divide-y divide-border overflow-y-auto">
            {items.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted-foreground">Chưa có thông báo.</li>}
            {items.map((n) => (
              <li key={n.id} className={cn("px-4 py-3", !n.read && "bg-secondary/60")}>
                <p className="text-sm font-semibold">{n.title}</p><p className="text-xs text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{new Date(n.created_at).toLocaleString("vi-VN")}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Quản lý khách hàng SaaS — chỉ Super Admin xem và thao tác (kiểm soát bằng quyền cơ sở dữ liệu). */
export function SaasCustomersSection() {
  const [rows, setRows] = useState<StoreRow[]>([]);
  const load = useCallback(async () => {
    const { data } = await supabase.from("stores").select("*").order("created_at", { ascending: false });
    setRows((data as StoreRow[]) ?? []);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const update = async (id: string, patch: Partial<StoreRow> & { activated_at?: string | null }, msg: string) => {
    const { error } = await supabase.from("stores").update(patch).eq("id", id);
    if (error) toast.error("Không cập nhật được"); else { toast.success(msg); void load(); }
  };
  const extend = (r: StoreRow) => {
    const base = Math.max(Date.now(), new Date(r.trial_ends_at).getTime());
    void update(r.id, { trial_ends_at: new Date(base + 3 * 864e5).toISOString() }, "Đã gia hạn thêm 3 ngày");
  };

  return (
    <section className="rounded-md border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="font-display text-lg font-bold">Quản lý khách hàng SaaS</h3>
        <span className="rounded-md bg-secondary px-2.5 py-1 text-xs font-bold">{rows.length} cửa hàng</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-xs uppercase text-muted-foreground"><th className="px-5 py-3">Cửa hàng</th><th className="px-3 py-3">Khách hàng</th><th className="px-3 py-3">Lĩnh vực</th><th className="px-3 py-3">Trạng thái</th><th className="px-3 py-3">Hạn dùng thử</th><th className="px-5 py-3 text-right">Thao tác</th></tr></thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">Chưa có khách hàng đăng ký.</td></tr>}
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-5 py-3 font-semibold">{r.name}</td>
                <td className="px-3 py-3"><p>{r.owner_name}</p><p className="text-xs text-muted-foreground">{r.email} · {r.phone}</p></td>
                <td className="px-3 py-3 text-muted-foreground">{r.business_field}</td>
                <td className="px-3 py-3"><span className={cn("rounded-md px-2 py-1 text-xs font-semibold", STATUS[r.status].cls)}>{STATUS[r.status].label}</span></td>
                <td className="px-3 py-3 text-muted-foreground">{r.status === "active" ? "Dài hạn" : new Date(r.trial_ends_at).toLocaleDateString("vi-VN")}</td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    {r.status !== "active" && <Button size="sm" onClick={() => update(r.id, { status: "active", activated_at: new Date().toISOString() }, `Đã kích hoạt chính thức ${r.name}`)}><CheckCircle2 className="size-4" /> Kích hoạt chính thức</Button>}
                    {r.status === "trial" && <Button size="sm" variant="outline" onClick={() => extend(r)}><Clock className="size-4" /> Gia hạn</Button>}
                    {r.status !== "locked"
                      ? <Button size="sm" variant="outline" className="text-destructive" onClick={() => update(r.id, { status: "locked" }, "Đã khóa cửa hàng")}><Lock className="size-4" /> Khóa</Button>
                      : <Button size="sm" variant="outline" onClick={() => update(r.id, { status: "trial" }, "Đã mở khóa về Dùng thử")}><Unlock className="size-4" /> Mở khóa</Button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
