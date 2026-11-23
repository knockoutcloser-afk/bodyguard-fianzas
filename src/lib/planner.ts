import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(3, "Escribe tu nombre completo.").max(100),
  email: z.string().trim().email("Escribe un correo válido.").max(255),
  postal: z.string().regex(/^\d{5}$/, "El código postal debe tener 5 dígitos."),
  phone: z.string().regex(/^\d{10}$/, "Escribe los 10 dígitos de tu WhatsApp."),
});
export const guaranteeOptions = ["Fianza de Anticipo", "Fianza de Cumplimiento", "Fianza de Vicios ocultos", "Otra (judicial, crédito o fidelidad)", "No lo sé — necesito orientación"] as const;
export const applicantOptions = ["A mi nombre (Persona física)", "A nombre de una empresa (Persona moral)", "Necesito orientación"] as const;
export const requesterOptions = ["Empresa privada", "Dependencia o entidad de gobierno", "Arrendador o proceso legal", "Otro / No estoy seguro"] as const;
export const amountOptions = ["Hasta $500,000 MXN", "$500,001–$2,000,000 MXN", "$2,000,001–$10,000,000 MXN", "Más de $10,000,000 MXN", "No lo sé aún"] as const;
export const urgencyOptions = ["Lo antes posible / esta semana", "En los próximos días", "Aún sin fecha definida"] as const;
export const documentOptions = ["Sí, tengo contrato o requerimiento", "Está en preparación", "No cuento con documento aún"] as const;
export const WHATSAPP_URL = "https://wa.me/525619555939?text=" + encodeURIComponent("Hola Abraham, necesito orientación para tramitar una fianza.");
export function appointmentDays(now = new Date()) {
  return Array.from({ length: 5 }, (_, index) => {
    const day = new Date(now);
    day.setDate(day.getDate() + index + 1);
    return day;
  });
}
