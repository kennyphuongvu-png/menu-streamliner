import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  Boxes,
  ChefHat,
  ClipboardCheck,
  FileSpreadsheet,
  HelpCircle,
  PackageCheck,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Trash2,
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
import { EndOfDaySection, SettingsSection, SuperAdminSection } from "@/components/fnb-admin-sections";
import { FnbProvider } from "@/lib/fnb-store";
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

type Tab = { label: string; icon: ComponentType<{ className?: string }>; badge?: string; view: ComponentType };

// Thứ tự cố định theo quy trình vận hành — không dùng menu thả xuống.
const TABS: Tab[] = [
  { label: "Hàng hóa", icon: ShoppingCart, view: PosSection },
  { label: "Nguyên liệu", icon: Boxes, view: IngredientsSection },
  { label: "Bán thành phẩm", icon: PackageCheck, view: PrepsSection },
  { label: "Phiếu kho", icon: ClipboardCheck, view: StocktakeSection },
  { label: "Hủy cuối ngày", icon: Trash2, view: EndOfDaySection },
  { label: "Công thức", icon: ChefHat, view: RecipesSection },
  { label: "Bảng giá vốn (COGS)", icon: FileSpreadsheet, view: CogsSection },
  { label: "Báo cáo", icon: BarChart3, view: PnlSection },
  { label: "Dự báo chuẩn bị (AI)", icon: Sparkles, badge: "AI", view: ForecastSection },
  { label: "Cài đặt", icon: Settings, view: SettingsSection },
  { label: "Super Admin", icon: ShieldCheck, view: SuperAdminSection },
];

function Index() {
  return <FnbProvider><Shell /></FnbProvider>;
}

function Shell() {
  const [active, setActive] = useState(TABS[0]!.label);
  const current = TABS.find((t) => t.label === active) ?? TABS[0]!;
  const View = current.view;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between gap-4 px-4 md:px-8">
          <div className="min-w-0">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Fumi Go</p>
            <p className="truncate font-display text-lg font-bold leading-tight">FUGUMI CRAFT</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="icon" aria-label="Thông báo" className="relative"><Bell className="size-[18px]" /><span className="absolute right-2 top-2 size-2 rounded-full bg-warning" /></Button>
            <Button variant="outline" size="icon" aria-label="Trợ giúp"><HelpCircle className="size-[18px]" /></Button>
          </div>
        </div>
        <nav aria-label="Điều hướng chính" className="mx-auto max-w-[1500px] overflow-x-auto px-2 md:px-6">
          <div role="tablist" className="flex min-w-max gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.label === active;
              return (
                <button
                  key={tab.label}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive(tab.label)}
                  className={cn(
                    "flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors",
                    isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {tab.label}
                  {tab.badge && <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">{tab.badge}</span>}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-6 md:px-8 md:py-8">
        <h1 className="sr-only">{current.label}</h1>
        <View />
      </main>
    </div>
  );
}
