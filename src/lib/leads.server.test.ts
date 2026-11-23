import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { captureEarlyLead, completeLead, processLeadEvent } from "./leads.server";

const mocks = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { from: mocks.from } }));
const access = { id: "00000000-0000-4000-8000-000000000002", access_key: "00000000-0000-4000-8000-000000000001" };
const contact = { name: "Persona de prueba", email: "fianzas-test@example.com", postal: "03100", phone: "5555555555", access_key: access.access_key };
const completed = { ...contact, ...access, guarantee: "Fianza de Anticipo" as const, applicant: "A nombre de una empresa (Persona moral)" as const, requester: "Empresa privada" as const, context: "Contrato de obra", amount: "No lo sé aún" as const, urgency: "Lo antes posible / esta semana" as const, document: "Sí, tengo contrato o requerimiento" as const, appointment_date: "2026-11-25", appointment_time: "18:00" as const };

function query(result: unknown) {
  const chain = { upsert: vi.fn(), update: vi.fn(), eq: vi.fn(), in: vi.fn(), select: vi.fn(), single: vi.fn(), maybeSingle: vi.fn(), then: Promise.resolve(result).then.bind(Promise.resolve(result)) };
  for (const method of [chain.upsert, chain.update, chain.eq, chain.in, chain.select, chain.single, chain.maybeSingle]) method.mockReturnValue(chain);
  mocks.from.mockReturnValueOnce(chain);
  return chain;
}

beforeEach(() => vi.resetAllMocks());
afterEach(() => vi.unstubAllGlobals());

describe("Private lead persistence and delivery", () => {
  it("persists step 1 as incomplete with WhatsApp false and returns only its ID", async () => {
    const insert = query({ error: null });
    query({ error: null });
    query({ data: { id: access.id }, error: null });
    expect(await captureEarlyLead(contact)).toEqual({ id: access.id });
    expect(mocks.from).toHaveBeenCalledWith("fianzas_leads");
    expect(insert.upsert).toHaveBeenCalledWith({ nombre: contact.name, email: contact.email, codigo_postal: "03100", telefono: "5555555555", access_key: access.access_key, estatus: "incompleto", whatsapp_clicked: false }, { onConflict: "access_key", ignoreDuplicates: true });
  });
  it("updates the same lead to completed using both ID and capability", async () => {
    const update = query({ data: { id: access.id }, error: null });
    await completeLead(completed);
    expect(update.update).toHaveBeenCalledWith(expect.objectContaining({ estatus: "completado", garantia: "Fianza de Anticipo", fecha_cita: "2026-11-25", hora_cita: "18:00" }));
    expect(update.eq).toHaveBeenCalledWith("id", access.id);
    expect(update.eq).toHaveBeenCalledWith("access_key", access.access_key);
  });
  it("rejects completion when the private capability does not match a lead", async () => {
    query({ data: null, error: null });
    await expect(completeLead(completed)).rejects.toThrow("No pudimos guardar tu solicitud");
  });
  it("marks WhatsApp true only for the capability's completed lead", async () => {
    const update = query({ data: { id: access.id }, error: null });
    expect(await processLeadEvent({ ...access, event: "whatsapp" }, undefined)).toEqual({ success: true });
    expect(update.update).toHaveBeenCalledWith({ whatsapp_clicked: true });
    expect(update.eq).toHaveBeenCalledWith("access_key", access.access_key);
    expect(update.eq).toHaveBeenCalledWith("estatus", "completado");
  });
  it("posts all mapped lead fields plus an exact timestamp, never the capability", async () => {
    const lead = { id: access.id, created_at: "2026-11-21T22:00:00.000Z", updated_at: "2026-11-21T22:01:00.000Z", nombre: contact.name, email: contact.email, codigo_postal: contact.postal, telefono: contact.phone, garantia: "Fianza de Anticipo", contratante: completed.applicant, solicitante: completed.requester, contexto: completed.context, monto: completed.amount, urgencia: completed.urgency, documento: completed.document, fecha_cita: completed.appointment_date, hora_cita: completed.appointment_time, estatus: "completado" };
    query({ data: lead, error: null });
    const delivery = query({ error: null });
    const fetchMock = vi.fn().mockResolvedValue(new Response("accepted", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await processLeadEvent({ ...access, event: "webhook" }, "https://hook.us2.make.com/test-only")).toEqual({ success: true });
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    const payload: Record<string, unknown> = JSON.parse(String(init?.body));
    expect(payload).toMatchObject(lead);
    expect(typeof payload['timestamp']).toBe("string");
    expect(Number.isNaN(Date.parse(String(payload['timestamp'])))).toBe(false);
    expect(payload).not.toHaveProperty("access_key");
    expect(delivery.update).toHaveBeenCalledWith(expect.objectContaining({ webhook_status: "sent" }));
  });
  it("does not send any webhook when the Fianzas URL is unconfigured", async () => {
    const update = query({ data: { id: access.id }, error: null });
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    expect(await processLeadEvent({ ...access, event: "webhook" }, undefined)).toEqual({ success: true, disabled: true });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(update.update).toHaveBeenCalledWith({ webhook_status: "disabled" });
    expect(update.eq).toHaveBeenCalledWith("access_key", access.access_key);
  });
  it("keeps webhook failure separate from saved completion", async () => {
    query({ data: { id: access.id }, error: null });
    const delivery = query({ error: null });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await processLeadEvent({ ...access, event: "webhook" }, "https://hook.us2.make.com/test-only")).toEqual({ success: false });
    expect(delivery.update).toHaveBeenCalledWith({ webhook_status: "failed" });
    expect(delivery.update).not.toHaveBeenCalledWith(expect.objectContaining({ estatus: "incompleto" }));
  });
});