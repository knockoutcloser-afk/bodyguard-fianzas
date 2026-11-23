import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { contactFields, completionFields, earlyLeadSchema, completedLeadSchema, leadEventSchema } from "./leads";
import type { EarlyLead, CompletedLead, LeadEvent } from "./leads";

const publicFields = "id,created_at,updated_at,nombre,email,codigo_postal,telefono,garantia,contratante,solicitante,contexto,monto,urgencia,documento,fecha_cita,hora_cita,estatus";

export async function captureEarlyLead(input: EarlyLead) {
  const data = earlyLeadSchema.parse(input);
  const fields = contactFields(data);
  const { error } = await supabaseAdmin.from("fianzas_leads").upsert(
    { ...fields, access_key: data.access_key, estatus: "incompleto", whatsapp_clicked: false },
    { onConflict: "access_key", ignoreDuplicates: true },
  );
  if (error) throw new Error("No pudimos guardar tu solicitud. Intenta nuevamente.");
  const { error: updateError } = await supabaseAdmin.from("fianzas_leads").update(fields)
    .eq("access_key", data.access_key).eq("estatus", "incompleto");
  if (updateError) throw new Error("No pudimos guardar tu solicitud. Intenta nuevamente.");
  const { data: lead, error: readError } = await supabaseAdmin.from("fianzas_leads")
    .select("id").eq("access_key", data.access_key).single();
  if (readError || !lead) throw new Error("No pudimos guardar tu solicitud. Intenta nuevamente.");
  return { id: lead.id };
}

export async function completeLead(input: CompletedLead) {
  const data = completedLeadSchema.parse(input);
  const { data: lead, error } = await supabaseAdmin.from("fianzas_leads").update(completionFields(data))
    .eq("id", data.id).eq("access_key", data.access_key).select("id").maybeSingle();
  if (error || !lead) throw new Error("No pudimos guardar tu solicitud. Intenta nuevamente.");
  return { success: true };
}

export async function processLeadEvent(input: LeadEvent, webhookUrl: string | undefined) {
  const data = leadEventSchema.parse(input);
  if (data.event === "whatsapp") {
    const { data: lead, error } = await supabaseAdmin.from("fianzas_leads").update({ whatsapp_clicked: true })
      .eq("id", data.id).eq("access_key", data.access_key).eq("estatus", "completado")
      .select("id").maybeSingle();
    return { success: !error && !!lead };
  }
  // Fianzas is disconnected by default. Never fall back to MAKE_PPR_WEBHOOK_URL.
  if (!webhookUrl) {
    const { data: lead, error } = await supabaseAdmin.from("fianzas_leads")
      .update({ webhook_status: "disabled" }).eq("id", data.id).eq("access_key", data.access_key)
      .eq("estatus", "completado").select("id").maybeSingle();
    return { success: !error && !!lead, disabled: true };
  }
  // Claim this completion atomically. Duplicate requests never send the same completion twice.
  const { data: lead, error } = await supabaseAdmin.from("fianzas_leads").update({ webhook_status: "sending" })
    .eq("id", data.id).eq("access_key", data.access_key).eq("estatus", "completado")
    .in("webhook_status", ["pending", "failed", "disabled"]).select(publicFields).maybeSingle();
  if (error || !lead) return { success: false };
  let sent = false;
  try {
    const url = new URL(webhookUrl ?? "");
    if (url.protocol !== "https:" || url.hostname !== "hook.us2.make.com") throw new Error("Invalid destination");
    const response = await fetch(url, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...lead, timestamp: new Date().toISOString() }),
      signal: AbortSignal.timeout(10000), redirect: "manual",
    });
    sent = response.ok;
    await response.body?.cancel();
  } catch {
    // No personal data or webhook credentials enter logs; the lead stays saved on failure.
  }
  await supabaseAdmin.from("fianzas_leads").update({
    webhook_status: sent ? "sent" : "failed",
    ...(sent ? { webhook_delivered_at: new Date().toISOString() } : {}),
  }).eq("id", data.id).eq("access_key", data.access_key).eq("webhook_status", "sending");
  return { success: sent };
}