import { useState } from "react";
import { Pause, Play, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

const institutions = [
  { name: "Avanza", image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/afianzadora-avanza-20cux0g4zqHX8QKL7evIjEMXzrkmR9.png" },
  { name: "AVLA", image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/afianzadora-avla-9qTrovoZj4kIyiCH5exeaYGIqc2WtV.png" },
  { name: "Berkley", image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/afianzadora-berkley-2HuJzblih2ozarLuXEap51SvxAizxZ.png" },
  { name: "Liberty Fianzas", image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/afianzadora-liberty-jPMiOZfd7ccYOql1lgfjsceyHlXSh8.avif" },
  { name: "Sofimex", image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/afianzadora-sofimex-gMqXgbcSMjwmCdKxAqQI9726UrGGtS.png" },
  { name: "Fiducia", image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/afianzadora-fiducia-TrJ8XtxLGkDYifrFo7iIeA9t0Pyqnz.jpg" },
  { name: "Cesce", image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/afianzadora-cesce-qkezxgOHbZXmUE5np2LBQRCllYwKz0.jpg" },
  { name: "Aserta", image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/afianzadora-aserta-SseDRfE0nit2sVHwsP4EOA6CpOV0Ff.png" },
  { name: "Chubb", image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/afianzadora-chubb-NABBmZhwpNZRBnG0Fvrjo268brH59K.jpg" },
  { name: "Dorama", image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/afianzadora-dorama-EAcxlSEWBTLhb0PoDzANjvejOX7my6.jpg" },
];

const scenarios = [
  { title: "Fianza de Anticipo y Cumplimiento", description: "Nos pidieron fianza para liberar el anticipo de un contrato y no teníamos claridad de qué pedir primero. Con el acompañamiento ordenamos documentos y avanzamos sin contratiempos.", footer: "Acompañamiento en trámite · Obra y construcción" },
  { title: "Revisión de Requisitos de Contrato", description: "Evitamos perder tiempo con requisitos incompletos antes de ingresar la solicitud. Desde el primer filtro supimos qué revisar y cómo preparar el expediente.", footer: "Revisión previa de expediente · Proveeduría empresarial" },
  { title: "Trámite con Respaldo Operativo", description: "Contar con claridad sobre los pasos y el respaldo operativo de LISCI Enlace Empresarial nos dio tranquilidad para cumplir en tiempo con las exigencias del contrato.", footer: "Respaldo operativo · Contratos corporativos" },
  { title: "Fianza de Vicios Ocultos al Cierre", description: "Al terminar la entrega nos solicitaron la garantía correspondiente y nos guiaron paso a paso para resolverlo de forma ágil y sin enredos.", footer: "Cierre de contrato · Servicios y suministros" },
];

export function InstitutionMarquee() {
  const [paused, setPaused] = useState(false);
  return <div className="institution-carousel">
    <div className={`marquee-window ${paused ? "is-paused" : ""}`} role="region" aria-label="Afianzadoras a través de LISCI Enlace Empresarial">
      <div className="marquee-track">{[0, 1].map(copy => <div className="marquee-group" key={copy} aria-hidden={copy === 1 ? true : undefined}>{institutions.map(item => <div className="institution-slot" key={item.name}>
        <img src={item.image} alt={item.name} />
      </div>)}</div>)}</div>
    </div>
    <Button size="icon" variant="ghost" className="marquee-toggle" aria-label={paused ? "Reanudar carrusel de instituciones" : "Pausar carrusel de instituciones"} title={paused ? "Reanudar" : "Pausar"} onClick={() => setPaused(!paused)}>{paused ? <Play /> : <Pause />}</Button>
  </div>;
}

export function TestimonialCarousel() {
  return <div className="testimonial-carousel" role="region" aria-label="Escenarios de acompañamiento">
    <div className="testimonial-window"><div className="testimonial-track">{[0, 1].map(copy => <div className="testimonial-group" key={copy} aria-hidden={copy === 1 || undefined}>{scenarios.map(item => <article className="testimonial-card scenario-card" key={`${copy}-${item.title}`}>
      <span className="scenario-avatar" aria-hidden="true"><UserRound size={17} /></span>
      <h3>{item.title}</h3>
      <p>{item.description}</p>
      <footer>{item.footer}</footer>
    </article>)}</div>)}</div></div>
  </div>;
}
