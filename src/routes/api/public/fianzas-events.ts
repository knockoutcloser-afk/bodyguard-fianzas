import { createFileRoute } from "@tanstack/react-router";
import { completedLeadSchema } from "@/lib/leads";
import type { CompletedLead } from "@/lib/leads";

export const Route = createFileRoute("/api/public/fianzas-events")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const headers = { "Cache-Control": "no-store" };
        const origin = request.headers.get("Origin");
        if (origin && origin !== new URL(request.url).origin) {
          return Response.json({ success: false }, { status: 403, headers });
        }
        if (Number(request.headers.get("Content-Length") ?? 0) > 8192) {
          return Response.json({ success: false }, { status: 413, headers });
        }
        let data: CompletedLead;
        try {
          const body = await request.text();
          if (body.length > 8192) return Response.json({ success: false }, { status: 413, headers });
          const parsed = completedLeadSchema.safeParse(JSON.parse(body));
          if (!parsed.success) return Response.json({ success: false }, { status: 400, headers });
          data = parsed.data;
        } catch {
          return Response.json({ success: false }, { status: 400, headers });
        }

        const webhookUrl = process.env["FIANZAS_WEBHOOK_URL"];
        if (!webhookUrl) {
          return Response.json({ success: false, code: "webhook_not_configured" }, { status: 503, headers });
        }
        try {
          const destination = new URL(webhookUrl);
          if (destination.protocol !== "https:" || !/^hook\.[a-z0-9-]+\.make\.com$/i.test(destination.hostname)) {
            return Response.json({ success: false }, { status: 500, headers });
          }
          const { id: _id, access_key: _accessKey, ...lead } = data;
          const response = await fetch(destination, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...lead, timestamp: new Date().toISOString() }),
            signal: AbortSignal.timeout(10000),
            redirect: "manual",
          });
          await response.body?.cancel();
          return Response.json({ success: response.ok }, { status: response.ok ? 200 : 502, headers });
        } catch {
          return Response.json({ success: false }, { status: 502, headers });
        }
      },
    },
  },
});
