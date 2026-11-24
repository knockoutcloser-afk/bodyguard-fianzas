import { describe, expect, it } from "vitest";
import { completedLeadSchema, leadWhatsAppUrl, toMakeLeadPayload } from "./leads";
const completed = { name: "Persona de prueba", email: "fianzas-test@example.com", postal: "03100", phone: "5555555555", access_key: "00000000-0000-4000-8000-000000000001", id: "00000000-0000-4000-8000-000000000002", guarantee: "Fianza de Anticipo" as const, applicant: "A nombre de una empresa (Persona moral)" as const, requester: "Empresa privada" as const, context: "Contrato & obra", amount: "No lo sé aún" as const, urgency: "Lo antes posible / esta semana" as const, document: "Sí, tengo contrato o requerimiento" as const, appointment_date: "2026-11-25", appointment_time: "18:00" as const };
describe("Fianzas lead validation", () => {
  it("requires valid contact, diagnosis, and appointment data", () => {
    expect(completedLeadSchema.safeParse(completed).success).toBe(true);
    for (const key of ["name", "email", "postal", "phone", "guarantee", "applicant", "requester", "amount", "urgency", "document", "appointment_date", "appointment_time"]) {
      expect(completedLeadSchema.safeParse({ ...completed, [key]: undefined }).success).toBe(false);
    }
    expect(completedLeadSchema.safeParse({ ...completed, appointment_date: "2026-02-30" }).success).toBe(false);
  });
  it("keeps brief context optional with a 300-character maximum", () => {
    const { context: _context, ...withoutContext } = completed;
    expect(completedLeadSchema.parse(withoutContext).context).toBe("");
    expect(completedLeadSchema.safeParse({ ...completed, context: "a".repeat(301) }).success).toBe(false);
  });
  it("encodes contact, all answers, and appointment details for WhatsApp", () => {
    const url = new URL(leadWhatsAppUrl({ ...completed, name: "María & José" }));
    expect(url.pathname).toBe("/525619555939");
    const message = url.searchParams.get("text");
    for (const value of ["María & José", completed.email, completed.phone, completed.postal, completed.guarantee, completed.applicant, completed.requester, completed.context, completed.amount, completed.urgency, completed.document, completed.appointment_date, completed.appointment_time, "pendiente de confirmación"]) expect(message).toContain(value);
    expect(url.searchParams.size).toBe(1);
    expect(message).not.toContain(completed.access_key);
  });
  it("sends the complete WhatsApp number without a leading plus to Make", () => {
    const payload = toMakeLeadPayload(completed);
    expect(payload.telefono_whatsapp).toBe("525555555555");
    expect(payload.telefono_whatsapp).not.toMatch(/^\+/);
  });
});
