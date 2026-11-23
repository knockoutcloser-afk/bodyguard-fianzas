import { createFileRoute } from "@tanstack/react-router";
import { leadEventSchema } from "@/lib/leads";

export const Route = createFileRoute("/api/public/fianzas-events")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const headers = { "Cache-Control": "no-store" };
        const origin = request.headers.get("Origin");
        if (origin && origin !== new URL(request.url).origin) {
          return Response.json({ success: false }, { status: 403, headers });
        }
        if (Number(request.headers.get("Content-Length") ?? 0) > 2048) {
          return Response.json({ success: false }, { status: 413, headers });
        }
        try {
          const body = await request.text();
          if (body.length > 2048) return Response.json({ success: false }, { status: 413, headers });
          const parsed = leadEventSchema.safeParse(JSON.parse(body));
          if (!parsed.success) return Response.json({ success: false }, { status: 400, headers });
          const { processLeadEvent } = await import("@/lib/leads.server");
          // ID plus an unguessable private capability authorizes this single lead, not all visitors.
          const result = await processLeadEvent(parsed.data, process.env['FIANZAS_WEBHOOK_URL']);
          return Response.json(result, { headers });
        } catch {
          return Response.json({ success: false }, { status: 400, headers });
        }
      },
    },
  },
});
