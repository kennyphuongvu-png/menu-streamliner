import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Leaf } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { registerStore } from "@/lib/saas.functions";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Tạo cửa hàng dùng thử | Fumi Go" },
      { name: "description", content: "Đăng ký dùng thử Fumi Go — tạo cửa hàng F&B của riêng bạn trong một phút." },
      { property: "og:title", content: "Tạo cửa hàng dùng thử | Fumi Go" },
      { property: "og:description", content: "Đăng ký dùng thử Fumi Go miễn phí 3 ngày." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignupPage,
});

const FIELDS = ["Quán cà phê", "Trà sữa", "Nhà hàng", "Tiệm bánh", "Khác"];
const inputCls = "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

function SignupPage() {
  const register = useServerFn(registerStore);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v = Object.fromEntries(f) as Record<string, string>;
    setBusy(true); setErr("");
    try {
      await register({ data: v });
      const { error } = await supabase.auth.signInWithPassword({ email: v.email!.trim().toLowerCase(), password: v.password! });
      if (error) throw error;
      navigate({ to: "/dashboard" });
    } catch (x) {
      setErr(x instanceof Error && x.message.length < 120 ? x.message : "Thông tin chưa hợp lệ, vui lòng kiểm tra lại.");
    } finally { setBusy(false); }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-md border border-border bg-card p-6 shadow-sm">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold"><Leaf className="size-6 text-primary" /> Fumi Go</Link>
        <div><h1 className="font-display text-2xl font-bold">Tạo cửa hàng ngay</h1><p className="mt-1 text-sm text-muted-foreground">Dùng thử miễn phí 3 ngày với các tính năng cơ bản.</p></div>
        <label className="block text-sm font-medium">Tên khách hàng<input name="ownerName" required className={inputCls} /></label>
        <label className="block text-sm font-medium">Số điện thoại<input name="phone" required inputMode="tel" className={inputCls} /></label>
        <label className="block text-sm font-medium">Email<input name="email" type="email" required className={inputCls} /></label>
        <label className="block text-sm font-medium">Mật khẩu (tối thiểu 8 ký tự)<input name="password" type="password" minLength={8} required className={inputCls} /></label>
        <label className="block text-sm font-medium">Tên cửa hàng muốn tạo<input name="storeName" required className={inputCls} /></label>
        <label className="block text-sm font-medium">Lĩnh vực kinh doanh
          <select name="businessField" required className={inputCls}>{FIELDS.map((x) => <option key={x}>{x}</option>)}</select>
        </label>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Đang tạo..." : "Tạo cửa hàng & vào ngay"}</Button>
        <p className="text-center text-sm text-muted-foreground">Đã có tài khoản? <Link to="/auth" className="font-semibold text-primary">Đăng nhập</Link></p>
      </form>
    </div>
  );
}
