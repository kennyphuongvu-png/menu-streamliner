import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Boxes, FlaskConical, Leaf, ShieldCheck, ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import cafeImage from "@/assets/fumi-cafe.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fumi Go — Quản lý quán F&B từ kho đến lợi nhuận" },
      { name: "description", content: "Fumi Go đồng hành cùng quán F&B trong quản lý kho, công thức, bán hàng và theo dõi lợi nhuận." },
      { property: "og:title", content: "Fumi Go — Quản lý quán F&B từ kho đến lợi nhuận" },
      { property: "og:description", content: "Một nơi cho kho nguyên liệu, bán thành phẩm, bán hàng và quản trị cửa hàng." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const features = [
  { title: "Kho & giá vốn", icon: Boxes, number: "01", items: ["Bình quân gia quyền", "Kiểm kê 2 ô", "Hủy cuối ngày"] },
  { title: "Bán thành phẩm", icon: FlaskConical, number: "02", items: ["Công thức 2 lớp", "Sản xuất trừ kho tự động"] },
  { title: "Bán hàng", icon: ShoppingCart, number: "03", items: ["Trừ kho theo định lượng", "Cảnh báo"] },
  { title: "Phân quyền", icon: ShieldCheck, number: "04", items: ["Staff, Manager, Admin", "Trên từng cửa hàng"] },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-landing text-landing-foreground">
      <header className="border-b border-landing-border/60">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-12">
          <Link to="/" aria-label="Fumi Go — Trang chủ" className="flex items-center gap-2.5 font-display text-2xl font-bold">
            <Leaf className="size-7 text-sidebar-primary" strokeWidth={1.8} /> Fumi Go<span className="text-landing-action">.</span>
          </Link>
          <span className="hidden text-xs font-medium text-landing-muted sm:block">Dành cho quán cà phê & kinh doanh F&B</span>
        </div>
      </header>
      <main>
        <section className="relative isolate overflow-hidden">
          <img src={cafeImage} alt="Quầy cà phê với máy espresso, cà phê và matcha latte" width={1536} height={1024} fetchPriority="high" className="absolute inset-0 -z-20 h-full w-full object-cover object-right" />
          <div className="absolute inset-0 -z-10 bg-landing/65 sm:bg-landing/45" />
          <div className="mx-auto flex min-h-[490px] max-w-7xl items-center px-6 py-14 lg:min-h-[530px] lg:px-12 lg:py-20">
            <div className="max-w-[650px] animate-rise-in">
              <p className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase text-sidebar-primary"><span className="h-px w-7 bg-sidebar-primary" /> Fumi Go / Vận hành tinh gọn</p>
              <h1 className="max-w-[620px] font-display text-4xl font-bold leading-[1.15] sm:text-5xl lg:text-6xl">Quản lý quán F&B<br className="hidden sm:block" /> từ kho đến<br className="hidden lg:block" /> lợi nhuận</h1>
              <p className="mt-6 max-w-[460px] text-base leading-7 text-landing-foreground/80">Quản lý nguyên liệu, chuẩn hóa công thức và theo dõi hiệu quả kinh doanh. Để bạn dành nhiều thời gian hơn cho từng ly ngon và khách hàng.</p>
              <Button asChild className="mt-8 h-12 gap-3 bg-landing-action px-6 text-base text-landing-action-foreground hover:bg-landing-action/90 focus-visible:ring-landing-action">
                <Link to="/signup"><ArrowRight className="size-5" /> Tạo cửa hàng ngay</Link>
              </Button>
              <Button asChild variant="outline" className="ml-3 mt-8 h-12 px-6 text-base">
                <Link to="/auth">Đăng nhập</Link>
              </Button>
            </div>
          </div>
        </section>
        <section aria-label="Tính năng chính" className="mx-auto max-w-7xl px-6 py-10 lg:px-12 lg:py-12">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-xl font-bold sm:text-2xl">Một nơi. Trọn vẹn vận hành.</h2>
            <p className="text-sm text-landing-muted">Từ nguyên liệu đầu vào đến mỗi đơn bán ra.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ title, icon: Icon, number, items }) => (
              <article key={title} className="rounded-lg border border-landing-border bg-landing-surface p-6 transition-colors hover:border-sidebar-primary/65">
                <div className="mb-6 flex items-center justify-between"><Icon className="size-7 text-sidebar-primary" strokeWidth={1.5} /><span className="text-xs text-landing-muted">{number}</span></div>
                <h3 className="font-display text-lg font-bold">{title}</h3>
                <ul className="mt-4 space-y-2.5">{items.map((item) => <li key={item} className="flex items-start gap-2 text-[13px] leading-5 text-landing-muted"><Check className="mt-0.5 size-3.5 shrink-0 text-sidebar-primary" />{item}</li>)}</ul>
              </article>
            ))}
          </div>
        </section>
      </main>
      <footer className="border-t border-landing-border/60 px-6 py-6 text-center text-xs text-landing-muted">© 2026 Digital Solutions | v1.0.0</footer>
    </div>
  );
}