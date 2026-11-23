import { describe, expect, it } from "vitest";
import { contactSchema, guaranteeOptions, applicantOptions, requesterOptions, urgencyOptions, amountOptions, documentOptions, WHATSAPP_URL, appointmentDays } from "./planner";
import { completedLeadSchema } from "./leads";
const complete = { name: "Persona de prueba", email: "test@example.com", postal: "03100", phone: "5619555939", id: "00000000-0000-4000-8000-000000000002", access_key: "00000000-0000-4000-8000-000000000001", guarantee: "Fianza de Anticipo", applicant: "A mi nombre (Persona física)", requester: "Empresa privada", amount: "No lo sé aún", urgency: "En los próximos días", document: "No cuento con documento aún", appointment_date: "2026-11-25", appointment_time: "09:00" };
describe("Fianzas diagnosis rules", () => {
  it("accepts exactly the five requested guarantee categories", () => {
    expect(guaranteeOptions).toEqual(["Fianza de Anticipo", "Fianza de Cumplimiento", "Fianza de Vicios ocultos", "Otra (judicial, crédito o fidelidad)", "No lo sé — necesito orientación"]);
    for (const guarantee of guaranteeOptions) expect(completedLeadSchema.safeParse({ ...complete, guarantee }).success).toBe(true);
    expect(completedLeadSchema.safeParse({ ...complete, guarantee: "Pagar menos impuestos" }).success).toBe(false);
  });
  it("accepts individuals, companies and orientation", () => {
    expect(applicantOptions).toEqual(["A mi nombre (Persona física)", "A nombre de una empresa (Persona moral)", "Necesito orientación"]);
    for (const applicant of applicantOptions) expect(completedLeadSchema.safeParse({ ...complete, applicant }).success).toBe(true);
    expect(completedLeadSchema.safeParse({ ...complete, applicant: "Empleado" }).success).toBe(false);
  });
  it("accepts the four requester contexts", () => {
    expect(requesterOptions).toEqual(["Empresa privada", "Dependencia o entidad de gobierno", "Arrendador o proceso legal", "Otro / No estoy seguro"]);
    for (const requester of requesterOptions) expect(completedLeadSchema.safeParse({ ...complete, requester }).success).toBe(true);
    expect(completedLeadSchema.safeParse({ ...complete, requester: "invalid" }).success).toBe(false);
  });
  it("allows unknown amount without inventing a contract value", () => {
    expect(amountOptions).toContain("No lo sé aún");
    expect(completedLeadSchema.parse(complete).amount).toBe("No lo sé aún");
    expect(completedLeadSchema.safeParse({ ...complete, amount: "" }).success).toBe(false);
  });
  it("accepts the three requested urgencies", () => {
    expect(urgencyOptions).toEqual(["Lo antes posible / esta semana", "En los próximos días", "Aún sin fecha definida"]);
    for (const urgency of urgencyOptions) expect(completedLeadSchema.safeParse({ ...complete, urgency }).success).toBe(true);
    expect(completedLeadSchema.safeParse({ ...complete, urgency: "" }).success).toBe(false);
  });
  it("requires document availability, not an uploaded contract", () => {
    for (const document of documentOptions) expect(completedLeadSchema.safeParse({ ...complete, document }).success).toBe(true);
    expect(completedLeadSchema.safeParse({ ...complete, document: "" }).success).toBe(false);
  });
  it("requires a five digit postal code and ten digit phone", () => {
    expect(contactSchema.safeParse(complete).success).toBe(true);
    expect(contactSchema.safeParse({ ...complete, postal: "0310" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...complete, phone: "561955593" }).success).toBe(false);
  });
  it("keeps the WhatsApp number and five following appointment days", () => {
    expect(new URL(WHATSAPP_URL).pathname).toBe("/525619555939");
    const dates = appointmentDays(new Date(2026, 10, 22));
    expect(dates.map(day => day.getDate())).toEqual([23,24,25,26,27]);
  });
});
