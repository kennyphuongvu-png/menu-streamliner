const GATEWAY = "https://ai.gateway.lovable.dev/v1/responses";
const MODEL = "openai/gpt-6-astra";

export type ForecastItem = { ingredient: string; unit: string; currentStock: number; forecastNeed: number; prepareQty: number; note: string };
export type ForecastResult = { summary: string; items: ForecastItem[] };

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "items"],
  properties: {
    summary: { type: "string" },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["ingredient", "unit", "currentStock", "forecastNeed", "prepareQty", "note"],
        properties: {
          ingredient: { type: "string" },
          unit: { type: "string" },
          currentStock: { type: "number" },
          forecastNeed: { type: "number" },
          prepareQty: { type: "number" },
          note: { type: "string" },
        },
      },
    },
  },
};

export class ForecastError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function runForecast(input: { sales: string; inventory: string; shift: string; notes: string }): Promise<ForecastResult> {
  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) throw new ForecastError("Chưa cấu hình khóa AI cho ứng dụng.", 401);

  const prompt = `Bạn là chuyên gia vận hành bếp F&B. Dựa trên dữ liệu bán hàng gần đây và tồn kho hiện tại, hãy dự báo lượng nguyên liệu cần chuẩn bị cho ca tiếp theo (${input.shift}).
Quy tắc: prepareQty = max(0, forecastNeed + dự phòng an toàn ~10-15% - currentStock). Dùng đúng đơn vị của tồn kho. Ghi chú ngắn gọn bằng tiếng Việt. summary tối đa 3 câu tiếng Việt.

DỮ LIỆU BÁN HÀNG:
${input.sales}

TỒN KHO HIỆN TẠI:
${input.inventory}

GHI CHÚ CỦA CHỦ QUÁN: ${input.notes || "(không có)"}`;

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: MODEL,
      input: prompt,
      stream: true,
      store: false,
      reasoning: { effort: "medium", summary: "auto" },
      include: ["reasoning.encrypted_content"],
      text: { format: { type: "json_schema", name: "forecast", strict: true, schema } },
    }),
  });

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    let msg = "Không thể tạo dự báo lúc này.";
    if (res.status === 402) msg = "Đã hết lượt AI miễn phí. Vui lòng nâng cấp gói để tiếp tục.";
    else if (res.status === 429) msg = "Hệ thống đang bận, vui lòng thử lại sau ít phút.";
    else if (res.status === 403) msg = "Tính năng AI hiện bị chặn cho không gian làm việc này.";
    console.error("forecast gateway error", res.status, body.slice(0, 500));
    throw new ForecastError(msg, res.status);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let text = "";
  let refused = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n\n")) !== -1) {
      const frame = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      for (const line of frame.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        try {
          const evt = JSON.parse(data);
          if (evt.type === "response.output_text.delta") text += evt.delta;
          else if (evt.type === "response.refusal.delta") refused = true;
          else if (evt.type === "error" || evt.type === "response.failed") throw new ForecastError("Không thể tạo dự báo lúc này.", 500);
        } catch (e) {
          if (e instanceof ForecastError) throw e;
        }
      }
    }
  }
  if (refused || !text) throw new ForecastError("AI không trả về kết quả cho dữ liệu này.", 422);
  return JSON.parse(text) as ForecastResult;
}
