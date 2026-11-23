import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, ArrowLeft, Check, ShieldCheck, LockKeyhole, CalendarDays, Clock3, UserRound, Mail, MapPin, BriefcaseBusiness, Building2, Wallet, ReceiptText, TrendingUp, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { contactSchema, appointmentDays, guaranteeOptions, applicantOptions, requesterOptions, amountOptions, urgencyOptions, documentOptions, WHATSAPP_URL } from "@/lib/planner";
import { saveContact, saveRequest } from "@/lib/requests.functions";
import { completedLeadSchema, leadEventSchema, leadWhatsAppUrl } from "@/lib/leads";
import type { CompletedLead, LeadEvent } from "@/lib/leads";
import portrait from "@/assets/abraham-solis.jpg.asset.json";

const titles = ["¿A dónde te contactamos?", "¿Qué garantía o necesidad te están solicitando?", "¿A nombre de quién se contrataría la fianza?", "¿Quién solicita la fianza y en qué contexto?", "¿Cuál es el monto a garantizar o el valor del contrato?", "¿Para cuándo necesitas la fianza y ya cuentas con contrato o requerimiento?"];
const options = [[], guaranteeOptions, applicantOptions, requesterOptions, amountOptions, urgencyOptions];
const descriptions = ["Tus datos se usarán para atender tu solicitud de fianza.", "Si aún no lo sabes, te ayudamos a identificarla.", "Revisamos requisitos según el perfil del contratante.", "Identifica a quien solicita la garantía.", "El monto de la fianza puede ser distinto al valor del contrato; lo revisaremos contigo.", "La emisión está sujeta a revisión y autorización de la afianzadora."];
function PlannerHeader() {
  return <div className="planner-top"><div><strong>Diagnóstico rápido de fianza</strong><small>6 pasos · menos de 2 minutos</small></div><span className="free-badge"><i />Gratis</span></div>;
}
function WhatsAppIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M20.5 11.8a8.6 8.6 0 0 1-12.7 7.6L3 21l1.5-4.7A8.6 8.6 0 1 1 20.5 11.8Z"/><path d="M8.1 7.5c-.7.4-.8 1.5-.3 2.7 1 2.4 2.7 4.1 5.2 5.1 1.2.5 2.3.3 2.7-.4l.5-1-2.6-1.2-.9 1c-1.5-.7-2.5-1.7-3.2-3.2l1-.9-1.3-2.7Z"/></svg>;
}
const optionIcons = [BriefcaseBusiness, Building2, Wallet, ReceiptText, TrendingUp, HeartHandshake];

function sendLeadEvent(input: LeadEvent) {
  const data = leadEventSchema.parse(input);
  // Independent keepalive request: delivery never delays the UI or opening WhatsApp.
  void fetch("/api/public/fianzas-events", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data), keepalive: true,
  }).catch(() => {});
}

export function RetirementPlanner() {
  const [step, setStep] = useState(0);
  const [contact, setContact] = useState({ name: "", email: "", postal: "", phone: "" });
  const [context, setContext] = useState("");
  const [document, setDocument] = useState("");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [errors, setErrors] = useState<Partial<Record<"name" | "email" | "postal" | "phone" | "submit", string>>>({});
  const [days, setDays] = useState<Date[]>([]);
  const [day, setDay] = useState(0);
  const [time, setTime] = useState("");
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState("");
  const [leadId, setLeadId] = useState("");
  const [completed, setCompleted] = useState<CompletedLead | null>(null);
  const capture = useServerFn(saveContact);
  const submit = useServerFn(saveRequest);
  useEffect(() => { setDays(appointmentDays()); setKey(crypto.randomUUID()); }, []);
  useEffect(() => { if (step !== 6) return; const timer = setTimeout(() => setStep(7), 1800); return () => clearTimeout(timer); }, [step]);
  const selectedDay = days[day];
  const currentOptions = options[step] ?? [];
  const next = async () => {
    if (busy) return;
    if (step === 0) {
      const result = contactSchema.safeParse(contact);
      if (!result.success) { setErrors(Object.fromEntries(result.error.issues.map((issue) => [String(issue.path[0]), issue.message]))); return; }
      if (!key) return;
      setBusy(true); setErrors({});
      try {
        const lead = await capture({ data: { ...result.data, access_key: key } });
        setLeadId(lead.id);
      } catch {
        setErrors({ submit: "No pudimos guardar tu solicitud. Vuelve a intentarlo." });
        return;
      } finally { setBusy(false); }
    }
    setErrors({}); setStep(step + 1);
  };
  const confirm = async () => {
    if (!selectedDay || !time || !leadId || !key || busy) return;
    setBusy(true); setErrors({});
    try {
      const date = `${selectedDay.getFullYear()}-${String(selectedDay.getMonth() + 1).padStart(2, "0")}-${String(selectedDay.getDate()).padStart(2, "0")}`;
      const data = completedLeadSchema.parse({ ...contact, guarantee: answers[1], applicant: answers[2], requester: answers[3], context, amount: answers[4], urgency: answers[5], document, appointment_date: date, appointment_time: time, id: leadId, access_key: key });
      await submit({ data });
      setCompleted(data);
      sendLeadEvent({ id: leadId, access_key: key, event: "webhook" });
      setStep(8);
    } catch { setErrors({ submit: "No pudimos guardar tu solicitud. Vuelve a intentarlo." }); }
    finally { setBusy(false); }
  };
  if (step === 6) return <div className="planner searching" id="planificador" aria-live="polite"><div className="radar"><ShieldCheck size={36} /></div><h3>Encontrando tu asesor de fianzas...</h3><p>Preparamos la revisión de tu requerimiento con Abraham Solís.</p></div>;
  if (step === 8) return <div className="planner success" id="planificador"><div className="date-badge"><CalendarDays size={16} />{selectedDay?.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })} · {time ? `${String(Number(time.split(":")[0]) % 12 || 12).padStart(2, "0")}:${time.split(":")[1]} ${Number(time.split(":")[0]) >= 12 ? "p.m." : "a.m."}` : ""}</div><h3>Solo un paso más.</h3><p>Comúnicate por WhatsApp con Abraham para confirmar tu reunión. Revisarán qué garantía te solicitan, los requisitos y cómo avanzar con el respaldo operativo de LISCI Enlace Empresarial.</p><Button variant="whatsapp" asChild className="planner-action whatsapp-action"><a href={completed ? leadWhatsAppUrl(completed) : WHATSAPP_URL} onClick={() => { if (completed) sendLeadEvent({ id: completed.id, access_key: completed.access_key, event: "whatsapp" }); }} target="_blank" rel="noopener noreferrer"><WhatsAppIcon />Contactar por WhatsApp</a></Button><div className="meeting-topics"><h4>Lo que vas a resolver en tu reunión</h4>{[{ icon: "📄", title: "La garantía que necesitas", text: "Revisa el contrato o requerimiento para identificar la fianza solicitada." }, { icon: "📋", title: "Requisitos y cotización", text: "Conoce la documentación y las alternativas según tu monto, plazo y perfil." }, { icon: "🤝", title: "Trámite acompañado", text: "Define los siguientes pasos con Abraham y el respaldo operativo de LISCI Enlace Empresarial." }].map(item => <div key={item.title}><span className="topic-icon" aria-hidden="true">{item.icon}</span><div><strong>{item.title}</strong><p>{item.text}</p></div></div>)}</div><p className="secure-note"><Clock3 size={13} />20–30 min · Ten a la mano tu contrato o requerimiento, si lo tienes.</p><Button variant="ghost" onClick={() => setStep(7)}><ArrowLeft />Cambiar horario</Button></div>;
  if (step === 7) return <div className="planner appointment" id="planificador"><PlannerHeader /><div className="advisor"><img src={portrait.url} alt="Abraham Solís, Director Asociado" /><div><span className="available"><i />Consulta gratuita</span><div className="planner-eyebrow">TU ASESOR ASIGNADO</div><h3>Abraham Solís</h3><p>Bodyguard Financiero</p><span className="advisor-specialty">Director Asociado · Alianza estratégica con LISCI Enlace Empresarial</span></div></div><p className="appointment-intro">Elige una fecha y hora para tu consulta gratuita.</p><div className="appointment-heading"><h4>Selecciona un día</h4></div><p className="timezone">Hora de Ciudad de México · Sujeto a confirmación</p><div className="day-grid">{days.map((value, index) => <Button key={value.toISOString()} variant="choice" className={`day-choice ${day === index ? "selected" : ""}`} onClick={() => { setDay(index); setTime(""); }}><span>{value.toLocaleDateString("es-MX", { weekday: "short" })}</span><strong>{value.getDate()}</strong><span>{value.toLocaleDateString("es-MX", { month: "short" })}</span></Button>)}</div><div className="time-grid">{["09:00", "11:00", "13:00", "16:00", "18:00"].map(value => <Button variant="choice" className={time === value ? "selected" : ""} key={value} onClick={() => setTime(value)}>{`${String(Number(value.split(":")[0]) % 12 || 12).padStart(2, "0")}:${value.split(":")[1]} ${Number(value.split(":")[0]) >= 12 ? "p.m." : "a.m."}`}</Button>)}</div>{errors.submit && <p role="alert" className="field-error">{errors.submit}</p>}<Button onClick={confirm} disabled={!time || busy} className="planner-action">{busy ? "Guardando solicitud..." : "Confirmar Cita"}<ArrowRight /></Button><div className="secure-note"><LockKeyhole size={13} />Tu consulta es gratuita y sin compromiso.</div></div>;
  return <div className="planner" id="planificador"><PlannerHeader /><progress className="progress-track" value={step + 1} max={6} aria-label="Progreso de la encuesta" /><div className="progress-label"><span>ENCUESTA RÁPIDA</span><span>{step + 1} / 6</span></div><div className="question-heading"><span className="step-label">PASO {step + 1} DE 6</span><h3>{titles[step]}</h3><p className="planner-description">{descriptions[step]}</p></div><form onSubmit={event => { event.preventDefault(); void next(); }} noValidate><div className="step-body">{step === 0 ? <><label className="field">Nombre completo<div className="input-wrap"><UserRound /><input autoComplete="name" placeholder="Tu nombre y apellidos" maxLength={100} value={contact.name} onChange={event => setContact({ ...contact, name: event.target.value })} aria-invalid={!!errors.name} /></div>{errors.name && <span className="field-error">{errors.name}</span>}</label><label className="field">Correo electrónico<div className="input-wrap"><Mail /><input autoComplete="email" type="email" placeholder="tu@correo.com" maxLength={255} value={contact.email} onChange={event => setContact({ ...contact, email: event.target.value })} aria-invalid={!!errors.email} /></div>{errors.email && <span className="field-error">{errors.email}</span>}</label><div className="field-row"><label className="field">Código postal<div className="input-wrap"><MapPin /><input autoComplete="postal-code" inputMode="numeric" placeholder="Ej. 03100" maxLength={5} value={contact.postal} onChange={event => setContact({ ...contact, postal: event.target.value.replace(/\D/g, "") })} aria-invalid={!!errors.postal} /></div>{errors.postal && <span className="field-error">{errors.postal}</span>}</label><label className="field">Teléfono / WhatsApp<div className="input-wrap phone-input"><span>🇲🇽 +52</span><input autoComplete="tel-national" inputMode="tel" placeholder="10 dígitos" maxLength={10} value={contact.phone} onChange={event => setContact({ ...contact, phone: event.target.value.replace(/\D/g, "") })} aria-invalid={!!errors.phone} /></div>{errors.phone && <span className="field-error">{errors.phone}</span>}</label></div></> : <div className="option-list" role="radiogroup" aria-label={titles[step]}>{currentOptions.map((value, i) => { const Icon = optionIcons[i % optionIcons.length] ?? BriefcaseBusiness; return <Button key={value} type="button" variant="choice" role="radio" aria-checked={answers[step] === value} className={`option-choice ${answers[step] === value ? "selected" : ""}`} onClick={() => setAnswers({ ...answers, [step]: value })}><Icon /><span>{value}</span><span className="radio-circle">{answers[step] === value && <Check size={12} />}</span></Button>; })}</div>}
{step === 3 && <label className="field">Contexto (opcional)<div className="input-wrap"><input aria-label="Contexto (opcional)" maxLength={300} placeholder="Ej. contrato de obra, licitación o servicio" value={context} onChange={event => setContext(event.target.value)} /></div></label>}
{step === 5 && <fieldset className="document-options"><legend>¿Cuentas con contrato o requerimiento?</legend><div className="option-list" role="radiogroup" aria-label="Disponibilidad de documento">{documentOptions.map(value => <Button key={value} type="button" variant="choice" role="radio" aria-checked={document === value} className={`option-choice ${document === value ? "selected" : ""}`} onClick={() => setDocument(value)}><ReceiptText /><span>{value}</span><span className="radio-circle">{document === value && <Check size={12} />}</span></Button>)}</div></fieldset>}
</div>{errors.submit && <p role="alert" className="field-error">{errors.submit}</p>}{step === 0 && <div className="secure-note contact-privacy"><LockKeyhole size={12} />Tus datos se utilizan para gestionar tu solicitud y tu atención con Abraham Solís.</div>}<div className="planner-buttons">{step > 0 && <Button type="button" variant="ghost" size="icon" aria-label="Paso anterior" onClick={() => setStep(step - 1)}><ArrowLeft /></Button>}<Button type="submit" className="planner-action" disabled={busy || (step > 0 && (!answers[step] || (step === 5 && !document)))}>{step === 5 ? "Encontrar mi asesor" : "Continuar"}<ArrowRight /></Button></div></form></div>;
}