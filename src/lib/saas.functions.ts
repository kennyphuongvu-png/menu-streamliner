import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const RESERVED = ["kennyphuong.vu@gmail.com", "vuminhphuong2789@gmail.com"];

const schema = z.object({
  ownerName: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^[0-9+ ]{8,15}$/),
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(8).max(72),
  storeName: z.string().trim().min(2).max(120),
  businessField: z.string().trim().min(2).max(80),
});

/** Đăng ký "Vào ngay": tạo tài khoản, cửa hàng (Dùng thử 3 ngày) và thông báo Super Admin. */
export const registerStore = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data }) => {
    if (RESERVED.includes(data.email)) throw new Error("Email này được dành cho quản trị hệ thống.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.ownerName, phone: data.phone },
    });
    if (error || !created.user) throw new Error(error?.message.includes("already") ? "Email đã được đăng ký." : "Không tạo được tài khoản.");
    const userId = created.user.id;
    const { data: store, error: sErr } = await supabaseAdmin
      .from("stores")
      .insert({ name: data.storeName, owner_name: data.ownerName, phone: data.phone, email: data.email, business_field: data.businessField, owner_id: userId })
      .select("id")
      .single();
    if (sErr || !store) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error("Không tạo được cửa hàng.");
    }
    await supabaseAdmin.from("store_members").insert({ store_id: store.id, user_id: userId, role: "admin" });
    await supabaseAdmin.from("admin_notifications").insert({
      store_id: store.id,
      title: "Khách hàng mới đăng ký",
      body: `${data.ownerName} vừa tạo cửa hàng "${data.storeName}" (${data.businessField}) — ${data.phone}`,
    });
    return { ok: true };
  });
