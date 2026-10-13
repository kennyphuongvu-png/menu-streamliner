import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Leaf } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Đăng nhập | Fumi Go" },
      { name: "description", content: "Đăng nhập vào cửa hàng Fumi Go của bạn." },
      { property: "og:title", content: "Đăng nhập | Fumi Go" },
      { property: "og:description", content: "Đăng nhập vào cửa hàng Fumi Go của bạn." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const inputCls = "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

function AuthPage() {
  const navigate = useNavigate();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setErr("");
    const { error } = await supabase.auth.signInWithPassword({ email: String(f.get("email")).trim().toLowerCase(), password: String(f.get("password")) });
    setBusy(false);
    if (error) setErr("Email hoặc mật khẩu không đúng, hoặc email chưa được xác minh.");
    else navigate({ to: "/dashboard" });
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-md border border-border bg-card p-6 shadow-sm">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold"><Leaf className="size-6 text-primary" /> Fumi Go</Link>
        <h1 className="font-display text-2xl font-bold">Đăng nhập</h1>
        <label className="block text-sm font-medium">Email<input name="email" type="email" required className={inputCls} /></label>
        <label className="block text-sm font-medium">Mật khẩu<input name="password" type="password" required className={inputCls} /></label>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <Button type="submit" className="w-full" disabled={busy}>Đăng nhập</Button>
        <p className="text-center text-sm text-muted-foreground">Chưa có cửa hàng? <Link to="/signup" className="font-semibold text-primary">Tạo cửa hàng ngay</Link></p>
      </form>
    </div>
  );
}
