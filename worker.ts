import { reportError } from "./functions/_sentry";

interface Env {
  ASSETS: Fetcher;
  BREVO_API_KEY?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function handleSubscribe(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return new Response(null, { status: 405, headers: corsHeaders });
  }

  const sentryCtx = { request, waitUntil: (p: Promise<unknown>) => ctx.waitUntil(p) };

  try {
    const contentType = request.headers.get("content-type") || "";
    let email = "";

    if (contentType.includes("application/json")) {
      const data = (await request.json()) as any;
      email = (data?.email || "").trim();
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      email = ((formData.get("email") as string) || "").trim();
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ success: false, error: "Por favor, introduce un correo electrónico válido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    const apiKey = env.BREVO_API_KEY;
    if (!apiKey) {
      reportError(sentryCtx, "BREVO_API_KEY is not configured", { stage: "config", site: "kbeauty-note" });
      return new Response(
        JSON.stringify({ success: false, error: "API key is not configured on server." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    const brevoResp = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "KBeautyNote/1.0",
      },
      body: JSON.stringify({
        email: email,
        listIds: [3],
        updateEnabled: true,
      }),
    });

    if (brevoResp.status === 201 || brevoResp.status === 204 || brevoResp.ok) {
      return new Response(
        JSON.stringify({ success: true, message: "¡Gracias por suscribirte! Te enviaremos nuestras próximas guías." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    const errData = (await brevoResp.json().catch(() => ({}))) as any;

    if (brevoResp.status === 400 && (errData?.code === "duplicate_parameter" || (errData?.message && errData.message.includes("already exist")))) {
      return new Response(
        JSON.stringify({ success: true, message: "¡Ya estás suscrito! Pronto recibirás nuestras novedades." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    if (brevoResp.status !== 400) {
      reportError(sentryCtx, `Brevo ${brevoResp.status}: ${errData?.code || ""} ${errData?.message || ""}`, {
        stage: "brevo",
        site: "kbeauty-note",
        status: String(brevoResp.status),
      });
    }
    return new Response(
      JSON.stringify({ success: false, error: errData?.message || "No se pudo completar el registro." }),
      { status: brevoResp.status, headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } }
    );
  } catch (err: any) {
    reportError(sentryCtx, err, { stage: "handler", site: "kbeauty-note" });
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } }
    );
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/subscribe") {
      return handleSubscribe(request, env, ctx);
    }
    if (url.pathname === "/sitemap.xml") {
      url.pathname = "/sitemap-index.xml";
      return env.ASSETS.fetch(new Request(url.toString(), request));
    }
    return env.ASSETS.fetch(request);
  },
};
