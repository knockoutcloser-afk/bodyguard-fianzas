import { z } from "zod";
import { contactSchema, guaranteeOptions, applicantOptions, requesterOptions, amountOptions, urgencyOptions, documentOptions } from "./planner";

export const completedLeadSchema = contactSchema.extend({
  id: z.string().uuid(), access_key: z.string().uuid(),
  guarantee: z.enum(guaranteeOptions), applicant: z.enum(applicantOptions),
  requester: z.enum(requesterOptions), context: z.string().trim().max(300).default(""),
  amount: z.enum(amountOptions), urgency: z.enum(urgencyOptions), document: z.enum(documentOptions),
  appointment_date: z.string().date(),
  appointment_time: z.enum(["09:00", "11:00", "13:00", "16:00", "18:00"]),
});
export type CompletedLead = z.infer<typeof completedLeadSchema>;

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
