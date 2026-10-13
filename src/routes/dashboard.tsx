import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  BarChart3, Bell, Boxes, ChefHat, ClipboardCheck, ClipboardList, FileSpreadsheet, LayoutGrid, Lock, LogOut,
  PackageCheck, Settings, ShieldCheck, ShoppingCart, Sparkles, Target, Trash2, TriangleAlert, Utensils,
} from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";

import { Button } from "@/components/ui/button";
import { CogsSection, IngredientsSection, PnlSection, PosSection, PrepsSection, RecipesSection, StocktakeSection } from "@/components/fnb-sections";
import { EndOfDaySection, SettingsSection, SuperAdminSection } from "@/components/fnb-admin-sections";
import { ForecastSection } from "@/components/forecast-section";
import { NotificationBell, SaasCustomersSection, useAdminNotifications } from "@/components/saas-admin";
import { supabase } from "@/integrations/supabase/client";
import { recipeCost, vnd } from "@/lib/fnb-calc";
import { FnbProvider, useFnb } from "@/lib/fnb-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Quản trị cửa hàng | Fumi Go" },
      { name: "description", content: "Bảng điều hành vận hành, kho và giá vốn F&B." },
      { property: "og:title", content: "Quản trị cửa hàng | Fumi Go" },
      { property: "og:description", content: "Bảng điều hành vận hành, kho và giá vốn F&B." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Store = { id: string; name: string; status: "trial" | "active" | "locked"; trial_ends_at: string };
type Session = { loading: boolean; userId?: string; name?: string; store?: Store | null; superAdmin: boolean };

function useSessionInfo(): Session {
  const [s, setS] = useState<Session>({ loading: true, superAdmin: false });
  useEffect(() => {
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setS({ loading: false, superAdmin: false });
      const [{ data: store }, { data: roles }] = await Promise.all([
        supabase.from("stores").select("id,name,status,trial_ends_at").eq("owner_id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      setS({ loading: false, userId: user.id, name: (user.user_metadata?.["full_name"] as string) ?? user.email, store: store as Store | null, superAdmin: !!roles?.some((r) => r.role === "super_admin") });
    })();
  }, []);
  return s;
}

function Index() {
  const s = useSessionInfo();
  if (s.loading) return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Đang tải...</div>;
  return <FnbProvider empty={!!s.store}><Shell s={s} /></FnbProvider>;
}

type Item = { key: string; label: string; icon: ComponentType<{ className?: string }>; view: ComponentType; premium?: boolean; badge?: string };
type Group = { label: string; icon: ComponentType<{ className?: string }>; children?: Item[]; item?: Item };

function SuperAdminFull() {
  return <div className="space-y-6"><SaasCustomersSection /><SuperAdminSection /></div>;
}

function Shell({ s }: { s: Session }) {
  const navigate = useNavigate();
  const noti = useAdminNotifications(s.superAdmin);
  const groups: Group[] = [
    { label: "Tổng quan", icon: LayoutGrid, item: { key: "overview", label: "Tổng quan", icon: LayoutGrid, view: () => <Overview s={s} /> } },
    { label: "Nguyên liệu & Kho", icon: Boxes, children: [
      { key: "ing", label: "Nguyên liệu", icon: Boxes, view: IngredientsSection },
      { key: "slip", label: "Phiếu kho", icon: ClipboardCheck, view: StocktakeSection },
      { key: "count", label: "Kiểm kê kho", icon: ClipboardList, view: StocktakeSection },
    ] },
    { label: "Bán thành phẩm", icon: PackageCheck, item: { key: "preps", label: "Bán thành phẩm", icon: PackageCheck, view: PrepsSection } },
    { label: "Món & Công thức", icon: ChefHat, children: [
      { key: "goods", label: "Hàng hóa", icon: Utensils, view: RecipesSection },
      { key: "recipes", label: "Công thức", icon: ChefHat, view: RecipesSection },
    ] },
    { label: "Bảng giá vốn (COGS)", icon: FileSpreadsheet, item: { key: "cogs", label: "Bảng giá vốn (COGS)", icon: FileSpreadsheet, view: CogsSection, premium: true } },
    { label: "Doanh thu & Lãi lỗ", icon: BarChart3, children: [
      { key: "report", label: "Báo cáo", icon: BarChart3, view: PnlSection, premium: true },
      { key: "eod", label: "Hủy cuối ngày", icon: Trash2, view: EndOfDaySection },
    ] },
    { label: "Bán hàng", icon: ShoppingCart, item: { key: "pos", label: "Bán hàng", icon: ShoppingCart, view: PosSection } },
    { label: "Cài đặt", icon: Settings, item: { key: "settings", label: "Cài đặt", icon: Settings, view: SettingsSection } },
    { label: "Dự báo chuẩn bị (AI)", icon: Sparkles, item: { key: "ai", label: "Dự báo chuẩn bị (AI)", icon: Sparkles, view: ForecastSection, premium: true, badge: "AI" } },
    ...(s.superAdmin || !s.userId ? [{ label: "Super Admin", icon: ShieldCheck, item: { key: "super", label: "Super Admin", icon: ShieldCheck, view: s.superAdmin ? SuperAdminFull : SuperAdminSection } }] : []),
  ];
  const all = groups.flatMap((g) => g.children ?? [g.item!]);
  const [active, setActive] = useState("overview");
  const current = all.find((i) => i.key === active) ?? all[0]!;
  const trial = s.store?.status === "trial";
  const expired = trial && new Date(s.store!.trial_ends_at).getTime() < Date.now();
  const locked = s.store?.status === "locked" || expired;
  const gated = trial && current.premium;
  const View = current.view;

  const logout = async () => { await supabase.auth.signOut(); navigate({ to: "/" }); };

  const NavBtn = ({ it, sub }: { it: Item; sub?: boolean }) => (
    <button onClick={() => setActive(it.key)} className={cn("flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors", sub && "pl-9 text-[13px]", active === it.key ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
      <it.icon className="size-4 shrink-0" /><span className="flex-1">{it.label}</span>
      {it.badge && <span className="rounded bg-sidebar-accent px-1.5 text-[10px] font-bold">{it.badge}</span>}
      {trial && it.premium && <Lock className="size-3.5 opacity-70" />}
    </button>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto bg-sidebar px-3 py-5 text-sidebar-foreground md:flex">
        <Link to="/" className="px-3 font-display text-2xl font-bold">Fumi<span className="text-sidebar-primary">Go</span></Link>
        <p className="mt-1 truncate px-3 text-sm opacity-80">{s.store?.name ?? "FUGUMI CRAFT"}</p>
        <p className="mt-6 px-3 text-[11px] font-bold uppercase tracking-[0.16em] opacity-60">Vận hành cửa hàng</p>
        <nav aria-label="Điều hướng chính" className="mt-2 space-y-1">
          {groups.map((g) => g.item ? <NavBtn key={g.label} it={g.item} /> : (
            <div key={g.label}>
              <p className="flex items-center gap-3 px-3 pb-1 pt-2 text-sm font-semibold"><g.icon className="size-4" />{g.label}</p>
              {g.children!.map((c) => <NavBtn key={c.key} it={c} sub />)}
            </div>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur md:px-8">
          <select aria-label="Chọn mục" className="rounded-md border border-input bg-background px-2 py-1.5 text-sm md:hidden" value={active} onChange={(e) => setActive(e.target.value)}>
            {all.map((i) => <option key={i.key} value={i.key}>{i.label}</option>)}
          </select>
          <p className="hidden truncate font-display text-lg font-bold md:block">{s.store?.name ?? "FUGUMI CRAFT"}</p>
          <div className="flex items-center gap-2">
            {s.name && <span className="hidden text-sm font-medium sm:block">{s.name}</span>}
            {s.superAdmin ? <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">Super Admin</span>
              : s.store && <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-bold">Admin</span>}
            {s.superAdmin ? <NotificationBell {...noti} /> : <Button variant="outline" size="icon" aria-label="Thông báo"><Bell className="size-[18px]" /></Button>}
            {s.userId ? <Button variant="ghost" size="sm" onClick={logout}><LogOut className="size-4" /> Đăng xuất</Button>
              : <Button asChild size="sm" variant="outline"><Link to="/auth">Đăng nhập</Link></Button>}
          </div>
        </header>

        {trial && !locked && (
          <div className="border-b border-border bg-warning-soft px-4 py-2 text-sm text-warning md:px-8">
            Đang dùng thử giới hạn đến {new Date(s.store!.trial_ends_at).toLocaleString("vi-VN")} — chờ quản trị viên kích hoạt chính thức để mở khóa đầy đủ tính năng.
          </div>
        )}

        <main className="mx-auto max-w-[1300px] px-4 py-6 md:px-8 md:py-8">
          <h1 className="sr-only">{current.label}</h1>
          {locked ? (
            <Notice title={s.store?.status === "locked" ? "Cửa hàng đã bị khóa" : "Hết thời gian dùng thử"} text="Vui lòng liên hệ quản trị Fumi Go để được kích hoạt chính thức." />
          ) : gated ? (
            <Notice title="Tính năng nâng cao" text="Mục này sẽ mở khóa sau khi cửa hàng được kích hoạt chính thức." />
          ) : <View />}
        </main>
      </div>
    </div>
  );
}

function Notice({ title, text }: { title: string; text: string }) {
  return (
    <div className="mx-auto max-w-md rounded-md border border-border bg-card p-8 text-center shadow-sm">
      <Lock className="mx-auto size-8 text-muted-foreground" /><h2 className="mt-3 font-display text-xl font-bold">{title}</h2><p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function Overview({ s }: { s: Session }) {
  const { data } = useFnb();
  const today = data.sales.filter((x) => new Date(x.date).toDateString() === new Date().toDateString());
  const revenue = today.reduce((a, x) => a + x.total, 0);
  const active = data.recipes.filter((r) => r.active);
  const avgCost = active.length ? active.reduce((a, r) => a + recipeCost(r, data), 0) / active.length : 0;
  const low = data.ingredients.filter((i) => i.active && i.stock < i.minStock);
  const storeName = s.store?.name ?? "FUGUMI CRAFT";
  const cards = [
    { label: "Doanh thu hôm nay", value: vnd(revenue), icon: ShoppingCart },
    { label: "Nguyên liệu", value: String(data.ingredients.length), icon: Boxes },
    { label: "Món đang bán", value: String(active.length), icon: ChefHat },
    { label: "Ngưỡng Food Cost", value: "35%", icon: Target },
    { label: "Giá vốn dự kiến / món", value: vnd(Math.round(avgCost)), icon: FileSpreadsheet },
    { label: "Cảnh báo tồn kho", value: String(low.length), icon: TriangleAlert },
  ];
  const checklist = ["Kiểm tra tồn kho nguyên liệu dưới định mức", "Chuẩn bị bán thành phẩm (cốt trà, cốt cà phê, syrup)", "Đối chiếu công thức & định lượng với nhân viên ca", "Vệ sinh quầy pha chế và dụng cụ", "Kiểm tra máy in hóa đơn K80/K57"];
  return (
    <div className="animate-rise-in space-y-6">
      <section><h2 className="font-display text-2xl font-bold">Xin chào, {s.name ?? "Chủ quán"}</h2><p className="mt-1 text-sm text-muted-foreground">Tổng quan cửa hàng {storeName}</p></section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <article key={c.label} className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between"><p className="text-sm font-medium text-muted-foreground">{c.label}</p><c.icon className="size-4 text-primary" /></div>
            <p className="mt-4 font-display text-2xl font-bold">{c.value}</p>
          </article>
        ))}
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h3 className="font-display text-lg font-bold">Cảnh báo tồn kho</h3>
          {low.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Không có nguyên liệu dưới định mức.</p> : (
            <ul className="mt-3 divide-y divide-border text-sm">{low.map((i) => <li key={i.id} className="flex justify-between py-2"><span>{i.name}</span><span className="font-semibold text-warning">{i.stock} / {i.minStock} {i.useUnit}</span></li>)}</ul>
          )}
        </article>
        <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h3 className="font-display text-lg font-bold">Checklist trước khi giao khách</h3>
          <ul className="mt-3 space-y-2 text-sm">{checklist.map((c) => <li key={c}><label className="flex items-center gap-2"><input type="checkbox" className="size-4 accent-primary" />{c}</label></li>)}</ul>
        </article>
      </section>
    </div>
  );
}
