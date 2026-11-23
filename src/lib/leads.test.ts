import { describe, expect, it } from "vitest";
import { contactFields, completionFields, earlyLeadSchema, completedLeadSchema, leadEventSchema, leadWhatsAppUrl } from "./leads";
const contact = { name: "Persona de prueba", email: "fianzas-test@example.com", postal: "03100", phone: "5555555555", access_key: "00000000-0000-4000-8000-000000000001" };
const completed = { ...contact, id: "00000000-0000-4000-8000-000000000002", guarantee: "Fianza de Anticipo" as const, applicant: "A nombre de una empresa (Persona moral)" as const, requester: "Empresa privada" as const, context: "Contrato & obra", amount: "No lo sé aún" as const, urgency: "Lo antes posible / esta semana" as const, document: "Sí, tengo contrato o requerimiento" as const, appointment_date: "2026-11-25", appointment_time: "18:00" as const };
describe("Fianzas lead capture rules", () => {
  it("accepts contact alone for incomplete capture", () => {
    expect(earlyLeadSchema.parse(contact)).toEqual(contact);
    expect(contactFields(contact)).toEqual({ nombre: contact.name, email: contact.email, codigo_postal: "03100", telefono: "5555555555" });
  });
  it("requires every diagnosis answer and an appointment for completion", () => {
    expect(completedLeadSchema.safeParse(contact).success).toBe(false);
    for (const key of ["guarantee", "applicant", "requester", "amount", "urgency", "document", "appointment_date", "appointment_time"]) {
      expect(completedLeadSchema.safeParse({ ...completed, [key]: undefined }).success).toBe(false);
    }
    expect(completionFields(completed)).toMatchObject({ estatus: "completado", garantia: "Fianza de Anticipo", monto: "No lo sé aún", urgencia: "Lo antes posible / esta semana", fecha_cita: "2026-11-25", hora_cita: "18:00" });
    expect(completedLeadSchema.safeParse({ ...completed, appointment_date: "2026-02-30" }).success).toBe(false);
  });
  it("keeps brief context optional with a 300-character maximum", () => {
    const { context: _context, ...withoutContext } = completed;
    expect(completedLeadSchema.parse(withoutContext).context).toBe("");
    expect(completedLeadSchema.safeParse({ ...completed, context: "a".repeat(301) }).success).toBe(false);
  });
  it("requires the private capability for updates and clicks", () => {
    expect(leadEventSchema.safeParse({ id: completed.id, event: "whatsapp" }).success).toBe(false);
    expect(leadEventSchema.safeParse({ id: completed.id, access_key: contact.access_key, event: "whatsapp" }).success).toBe(true);
  });
  it("encodes contact, all answers and the preferred appointment to the exact number", () => {
    const url = new URL(leadWhatsAppUrl({ ...completed, name: "María & José" }));
    expect(url.pathname).toBe("/525619555939");
    const message = url.searchParams.get("text");
    for (const value of ["María & José", completed.email, completed.phone, completed.postal, completed.guarantee, completed.applicant, completed.requester, completed.context, completed.amount, completed.urgency, completed.document, completed.appointment_date, completed.appointment_time, "pendiente de confirmación"]) expect(message).toContain(value);
    expect(url.searchParams.size).toBe(1);
    expect(message).not.toContain(completed.access_key);
  });
});
