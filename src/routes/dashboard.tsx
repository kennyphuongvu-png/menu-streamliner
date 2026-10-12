import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  Boxes,
  CalendarCheck,
  ChefHat,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  DollarSign,
  FileSpreadsheet,
  HelpCircle,
  LayoutDashboard,
  Menu,
  PackageCheck,
  Search,
  Settings,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import { useState, type ComponentType } from "react";

import { Button } from "@/components/ui/button";
import {
  CogsSection,
  IngredientsSection,
  PnlSection,
  PosSection,
  PrepsSection,
  RecipesSection,
  StocktakeSection,
} from "@/components/fnb-sections";
import { FnbProvider, INGREDIENT_CATEGORIES, useFnb } from "@/lib/fnb-store";
import { ForecastSection } from "@/components/forecast-section";
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

type NavSub = { label: string; count: number };
type NavItem = { label: string; icon: ComponentType<{ className?: string }>; badge?: string; subs?: NavSub[] };

function useNavItems(): NavItem[] {
  const { data } = useFnb();
  const ingSubs: NavSub[] = INGREDIENT_CATEGORIES.map((c) => ({ label: c, count: data.ingredients.filter((i) => i.category === c).length }));
  const prepSubs: NavSub[] = [
    { label: "Đang dùng", count: data.preps.filter((p) => p.active).length },
    { label: "Đã ẩn", count: data.preps.filter((p) => !p.active).length },
  ];
  const groups = [...new Set(data.recipes.map((r) => r.group))];
  const recipeSubs: NavSub[] = groups.map((g) => ({ label: g, count: data.recipes.filter((r) => r.group === g).length }));
  return [
    { label: "Tổng quan", icon: LayoutDashboard },
    { label: "Nguyên liệu & Kho", icon: Boxes, subs: ingSubs },
    { label: "Bán thành phẩm", icon: PackageCheck, subs: prepSubs },
    { label: "Món & Công thức", icon: ChefHat, subs: recipeSubs },
    { label: "Bảng giá vốn (COGS)", icon: FileSpreadsheet },
    { label: "Doanh thu & Lãi lỗ", icon: BarChart3 },
    { label: "Kiểm kê kho", icon: ClipboardCheck, badge: "Mới" },
    { label: "Bán hàng", icon: ShoppingCart },
    { label: "Dự báo chuẩn bị (AI)", icon: Sparkles, badge: "AI" },
  ];
}

const checklist = [
  { label: "Rà soát định lượng 12 món bán chạy", detail: "Cập nhật lần cuối 2 ngày trước", done: true },
  { label: "Kiểm tra tồn kho nguyên liệu chính", detail: "5 nguyên liệu sắp chạm mức tối thiểu", done: false },
  { label: "Đối chiếu giá nhập tuần này", detail: "Còn 3 phiếu nhập chưa xác nhận", done: false },
  { label: "Xác nhận bảng COGS tháng 10", detail: "Hạn hoàn thành hôm nay", done: false },
];

const stats = [
  { label: "Doanh thu hôm nay", value: "18.460.000 ₫", meta: "+8,4% so với hôm qua", icon: TrendingUp, tone: "success" },
  { label: "Giá vốn dự kiến", value: "6.830.000 ₫", meta: "37% trên doanh thu", icon: DollarSign, tone: "warning" },
  { label: "Cảnh báo tồn kho", value: "05", meta: "2 nguyên liệu cần nhập gấp", icon: Boxes, tone: "primary" },
];

const chartBars = ["h-[45%]", "h-[60%]", "h-[52%]", "h-[70%]", "h-[63%]", "h-[78%]", "h-[72%]"];

function Index() {
  return <FnbProvider><Shell /></FnbProvider>;
}

function Shell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("Tổng quan");
  const [expanded, setExpanded] = useState<string | null>(null);
  const navItems = useNavItems();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {sidebarOpen && <button aria-label="Đóng menu" className="fixed inset-0 z-30 bg-foreground/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={cn("fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0", sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex items-center justify-between border-b border-sidebar-border px-6 py-5">
          <div>
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-sidebar-primary">Fumi Go</p>
            <p className="mt-2 font-display text-2xl font-bold leading-tight tracking-tight text-sidebar-accent-foreground">FUGUMI CRAFT</p>
            <p className="mt-1 text-xs font-light tracking-wide text-sidebar-foreground/60">Blooming Matcha &amp; Coffee</p>
          </div>
          <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-sidebar-accent lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Đóng menu"><X className="size-5" /></Button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6" aria-label="Điều hướng chính">
          <p className="mb-3 px-3 text-[11px] font-bold uppercase text-sidebar-foreground/45">Vận hành cửa hàng</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeItem === item.label;
            const open = expanded === item.label || active;
            const select = () => { setActiveItem(item.label); setSidebarOpen(false); };
            return (
              <div key={item.label}>
                <Button
                  variant="ghost"
                  className={cn("h-11 w-full justify-start px-3 text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", active && "bg-sidebar-accent text-sidebar-accent-foreground")}
                  onClick={() => { if (item.subs) { setExpanded(open && expanded === item.label ? null : item.label); select(); } else { setExpanded(null); select(); } }}
                  aria-expanded={item.subs ? open : undefined}
                >
                  <Icon className={cn("size-[18px]", active && "text-sidebar-primary")} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && <span className="rounded bg-sidebar-primary px-1.5 py-0.5 text-[10px] font-bold text-sidebar-primary-foreground">{item.badge}</span>}
                  {item.subs ? <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180", active && "text-sidebar-primary")} /> : active && <ChevronRight className="size-4 text-sidebar-primary" />}
                </Button>
                {item.subs && open && (
                  <div className="mb-1 ml-9 space-y-0.5 border-l border-sidebar-border pl-3">
                    {item.subs.map((sub) => (
                      <button key={sub.label} onClick={select} className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[13px] text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                        <span className="truncate">{sub.label}</span>
                        <span className="ml-2 rounded bg-sidebar-accent px-1.5 py-0.5 text-[10px] font-bold text-sidebar-foreground/70">{sub.count}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <Button variant="ghost" className="h-10 w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"><Settings className="size-[18px]" /> Cài đặt</Button>
          <p className="mt-3 px-1 text-[11px] font-medium text-sidebar-foreground/40">© 2026 Digital Solutions | v1.0.0</p>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Mở menu"><Menu className="size-5" /></Button>
            <div><p className="font-display text-xl font-bold md:text-2xl">{activeItem}</p><p className="hidden text-xs text-muted-foreground sm:block">Thứ Sáu, 02 tháng 10, 2026</p></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative hidden 2xl:block"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input aria-label="Tìm kiếm" placeholder="Tìm món, nguyên liệu..." className="h-10 w-56 rounded-md border border-input bg-card pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></div>
            <Button variant="outline" size="icon" aria-label="Thông báo" className="relative"><Bell className="size-[18px]" /><span className="absolute right-2 top-2 size-2 rounded-full bg-warning" /></Button>
            <Button variant="outline" size="icon" aria-label="Trợ giúp"><HelpCircle className="size-[18px]" /></Button>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-4 py-6 md:px-8 md:py-8">
          {activeItem === "Nguyên liệu & Kho" ? <IngredientsSection /> : activeItem === "Món & Công thức" ? <RecipesSection /> : activeItem === "Kiểm kê kho" ? <StocktakeSection /> : activeItem === "Bán hàng" ? <PosSection /> : activeItem === "Bán thành phẩm" ? <PrepsSection /> : activeItem === "Bảng giá vốn (COGS)" ? <CogsSection /> : activeItem === "Doanh thu & Lãi lỗ" ? <PnlSection /> : activeItem === "Dự báo chuẩn bị (AI)" ? <ForecastSection /> : (
            <div className="animate-rise-in space-y-7">
              <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div><p className="text-sm font-semibold text-primary">Chào buổi chiều, Kenny</p><h1 className="mt-1 font-display text-2xl font-bold md:text-3xl">Hôm nay quán mình thế nào?</h1><p className="mt-2 text-sm text-muted-foreground">Theo dõi nhanh các chỉ số vận hành cần chú ý.</p></div>
                <Button><CalendarCheck className="size-4" /> Báo cáo cuối ngày</Button>
              </section>

              <section className="grid gap-4 md:grid-cols-3">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return <article key={stat.label} className="rounded-md border border-border bg-card p-5 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-muted-foreground">{stat.label}</p><p className="mt-2 font-display text-2xl font-bold">{stat.value}</p></div><div className={cn("flex size-10 items-center justify-center rounded-md", stat.tone === "success" && "bg-success-soft text-success", stat.tone === "warning" && "bg-warning-soft text-warning", stat.tone === "primary" && "bg-secondary text-primary")}><Icon className="size-5" /></div></div><p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">{stat.meta}</p></article>;
                })}
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                <div className="rounded-md border border-border bg-card shadow-sm">
                  <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="font-display text-lg font-bold">Checklist trước khi giao khách</h2><p className="mt-1 text-xs text-muted-foreground">Hoàn tất các đầu việc quan trọng trước khi bàn giao.</p></div><span className="rounded-md bg-secondary px-2.5 py-1 text-xs font-bold text-secondary-foreground">1/4 hoàn tất</span></div>
                  <div className="divide-y divide-border">
                    {checklist.map((item, index) => <div key={item.label} className="flex items-center gap-4 px-5 py-4"><Button variant="outline" size="icon" aria-label={`Đánh dấu ${item.label}`} className={cn("size-6 shrink-0 border-2 p-0", item.done ? "border-success bg-success text-primary-foreground hover:bg-success" : "border-border bg-background")}><ClipboardCheck className={cn("size-4", !item.done && "opacity-0")} /></Button><div className="min-w-0 flex-1"><p className={cn("text-sm font-semibold", item.done && "text-muted-foreground line-through")}>{item.label}</p><p className="mt-1 text-xs text-muted-foreground">{item.detail}</p></div><span className="hidden text-xs font-semibold text-muted-foreground sm:block">0{index + 1}</span></div>)}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-md border border-border bg-card p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="font-display text-lg font-bold">Sức khỏe giá vốn</h2><span className="text-xs font-semibold text-success">Ổn định</span></div><div className="mt-6 flex items-end justify-between gap-4"><div><p className="font-display text-4xl font-bold">37,0%</p><p className="mt-1 text-xs text-muted-foreground">Mục tiêu dưới 40%</p></div><div className="flex h-20 items-end gap-1.5">{chartBars.map((heightClass, i) => <span key={heightClass} className={cn("w-3 rounded-t-sm", heightClass, i === 6 ? "bg-primary" : "bg-secondary")} />)}</div></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full w-[74%] rounded-full bg-success" /></div></div>
                  <div className="rounded-md bg-primary p-5 text-primary-foreground shadow-sm"><div className="flex items-start gap-3"><FileSpreadsheet className="mt-0.5 size-5" /><div><h2 className="font-display font-bold">Google Sheets</h2><p className="mt-1 text-xs leading-5 text-primary-foreground/75">Dữ liệu vận hành sẽ được lưu an toàn trên Google Drive của bạn.</p><Button variant="outline" size="sm" className="mt-4 border-primary-foreground/30 bg-primary text-primary-foreground hover:bg-primary-foreground/10">Chuẩn bị kết nối <ChevronRight className="size-3" /></Button></div></div></div>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
