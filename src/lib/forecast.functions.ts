import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  sales: z.string().trim().min(1).max(20000),
  inventory: z.string().trim().min(1).max(20000),
  shift: z.string().trim().min(1).max(100),
  notes: z.string().max(2000),
});

export const forecastPrep = createServerFn({ method: "POST" })
  .inputValidator((data) => schema.parse(data))
  .handler(async ({ data }) => {
    const { runForecast, ForecastError } = await import("./forecast.server");
    try {
      return { ok: true as const, result: await runForecast(data) };
    } catch (e) {
      if (e instanceof ForecastError) return { ok: false as const, error: e.message };
      console.error(e);
      return { ok: false as const, error: "Không thể tạo dự báo lúc này." };
    }
  });
