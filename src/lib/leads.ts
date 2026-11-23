import { z } from "zod";
import { contactSchema, guaranteeOptions, applicantOptions, requesterOptions, amountOptions, urgencyOptions, documentOptions } from "./planner";

export const leadAccessSchema = z.object({ id: z.string().uuid(), access_key: z.string().uuid() });
export const earlyLeadSchema = contactSchema.extend({ access_key: z.string().uuid() });
export const completedLeadSchema = contactSchema.extend({
  ...leadAccessSchema.shape,
  guarantee: z.enum(guaranteeOptions), applicant: z.enum(applicantOptions),
  requester: z.enum(requesterOptions), context: z.string().trim().max(300).default(""),
  amount: z.enum(amountOptions), urgency: z.enum(urgencyOptions), document: z.enum(documentOptions),
  appointment_date: z.string().date(),
  appointment_time: z.enum(["09:00", "11:00", "13:00", "16:00", "18:00"]),
});
export const leadEventSchema = leadAccessSchema.extend({ event: z.enum(["webhook", "whatsapp"]) });
export type EarlyLead = z.infer<typeof earlyLeadSchema>;
export type CompletedLead = z.infer<typeof completedLeadSchema>;
export type LeadEvent = z.infer<typeof leadEventSchema>;

export function contactFields(data: z.infer<typeof contactSchema>) {
  return { nombre: data.name, email: data.email, codigo_postal: data.postal, telefono: data.phone };
}
export function completionFields(data: CompletedLead) {
  return {
    ...contactFields(data), garantia: data.guarantee, contratante: data.applicant,
    solicitante: data.requester, contexto: data.context, monto: data.amount,
    urgencia: data.urgency, documento: data.document,
    fecha_cita: data.appointment_date, hora_cita: data.appointment_time,
    estatus: "completado" as const, webhook_status: "pending" as const,
    updated_at: new Date().toISOString(),
  };
}
export function leadWhatsAppUrl(input: CompletedLead) {
  const data = completedLeadSchema.parse(input);
  const message = `Hola Abraham, completé mi diagnóstico de fianza:
• Nombre: ${data.name}
• Correo: ${data.email}
• WhatsApp: +52 ${data.phone}
• Código postal: ${data.postal}
• Garantía: ${data.guarantee}
• Contratante: ${data.applicant}
• Solicitante: ${data.requester}${data.context ? `\n• Contexto: ${data.context}` : ""}
• Monto de referencia (fianza o contrato, por revisar): ${data.amount}
• Urgencia: ${data.urgency}
• Documento: ${data.document}
• Cita preferida: ${data.appointment_date} a las ${data.appointment_time} (Ciudad de México, pendiente de confirmación)`;
  return `https://wa.me/525619555939?text=${encodeURIComponent(message)}`;
}
