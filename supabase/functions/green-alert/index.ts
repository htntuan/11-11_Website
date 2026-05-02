declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type GreenAlertReport = {
  type?: string;
  location?: string;
  description?: string;
  image?: string;
  createdAt?: string;
};

function jsonResponse(status: number, payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed." });
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const toEmail = Deno.env.get("ALERT_TO_EMAIL") || "ngoctuantk09@gmail.com";
  const fromEmail =
    Deno.env.get("ALERT_FROM_EMAIL") || "Green Truth <onboarding@resend.dev>";

  if (!resendApiKey) {
    return jsonResponse(500, {
      error: "Missing RESEND_API_KEY Supabase secret.",
    });
  }

  try {
    const body = (await req.json()) as GreenAlertReport;
    const type = body.type?.trim() || "Khác";
    const location = body.location?.trim() || "Không rõ";
    const description = body.description?.trim() || "Không có mô tả";
    const image = body.image?.trim() || "Chưa có ảnh";
    const createdAt = body.createdAt || new Date().toISOString();

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: `[Green Alert] ${type} - ${location}`,
        text: [
          "Green Alert report",
          "",
          `Loai su co: ${type}`,
          `Toa do: ${location}`,
          `Mo ta: ${description}`,
          `Anh: ${image}`,
          `Thoi gian: ${createdAt}`,
        ].join("\n"),
      }),
    });

    const payload = await emailRes.json().catch(() => ({}));
    if (!emailRes.ok) {
      return jsonResponse(emailRes.status, {
        error: payload.message || "Email provider request failed.",
      });
    }

    return jsonResponse(200, { ok: true, id: payload.id, to: toEmail });
  } catch (error) {
    return jsonResponse(500, {
      error:
        error instanceof Error ? error.message : "Unexpected server error.",
    });
  }
});
