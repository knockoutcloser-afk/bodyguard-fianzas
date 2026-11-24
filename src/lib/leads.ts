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

export function toMakeLeadPayload(input: CompletedLead) {
  const data = completedLeadSchema.parse(input);
  return {
    lead_id: data.id,
    nombre_completo: data.name,
    correo_electronico: data.email,
    codigo_postal: data.postal,
    telefono_whatsapp: `+52 ${data.phone}`,
    tipo_fianza: data.guarantee,
    perfil: data.applicant,
    solicitante: data.requester,
    contexto: data.context,
    monto: data.amount,
    urgencia: data.urgency,
    disponibilidad_documento: data.document,
    fecha_cita: data.appointment_date,
    hora_cita: data.appointment_time,
    estatus: "cita_solicitada",
    whatsapp_clicked: false,
    origen: "bodyguard-financiero-web",
    zona_horaria: "America/Mexico_City",
    timestamp: new Date().toISOString(),
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
