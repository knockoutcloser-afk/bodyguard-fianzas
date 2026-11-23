import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight, ImageIcon, Pause, Play, Star, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

// Replace null images and quotes only with owner-approved assets and testimonials.
const institutions: { name: string; image: string | null }[] = [
  { name: "Dorama", image: null },
  { name: "Fiducia", image: null },
  { name: "Chubb", image: null },
  { name: "Sofimex", image: null },
  { name: "Avanza", image: null },
  { name: "Liberty", image: null },
  { name: "Aserta", image: null },
  { name: "CESCE", image: null },
  { name: "Berkley", image: null },
  { name: "AVLA", image: null },
];
const testimonials: { id: number; quote: string | null; name: string | null; location: string | null; avatar: string | null }[] =
  Array.from({ length: 5 }, (_, id) => ({ id, quote: null, name: null, location: null, avatar: null }));

export function InstitutionMarquee() {
  const [paused, setPaused] = useState(false);
  return <div className="institution-carousel">
    <div className={`marquee-window ${paused ? "is-paused" : ""}`} role="region" aria-label="Afianzadoras a través de LISCI Enlace Empresarial">
      <div className="marquee-track">{[0, 1].map(copy => <div className="marquee-group" key={copy} aria-hidden={copy === 1 ? true : undefined}>{institutions.map(item => <div className="institution-slot" key={item.name}>
        {item.image ? <img src={item.image} alt={item.name} /> : <><ImageIcon aria-hidden="true" /><span>{item.name}</span></>}
      </div>)}</div>)}</div>
    </div>
    <Button size="icon" variant="ghost" className="marquee-toggle" aria-label={paused ? "Reanudar carrusel de instituciones" : "Pausar carrusel de instituciones"} title={paused ? "Reanudar" : "Pausar"} onClick={() => setPaused(!paused)}>{paused ? <Play /> : <Pause />}</Button>
  </div>;
}

export function TestimonialCarousel() {
  const [ref, api] = useEmblaCarousel({ loop: true, align: "start", dragFree: true });
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  useEffect(() => {
    if (!api || paused || interacting || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => api.scrollNext(), 4500);
    return () => window.clearInterval(timer);
  }, [api, paused, interacting]);
  return <div className="testimonial-carousel" role="region" aria-label="Testimonios" onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)} onFocusCapture={() => setInteracting(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false); }}>
    <div className="testimonial-window" ref={ref}><div className="testimonial-track">{testimonials.map(item => <article className="testimonial-card" key={item.id}>
      {item.quote && <div className="stars" aria-label="5 estrellas">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={14} fill="currentColor" />)}</div>}
      {item.quote ? <blockquote>“{item.quote}”</blockquote> : <div className="quote-placeholder"><span>Testimonio pendiente de publicación</span><i /><i /><i /></div>}
      <div className="testimonial-person">{item.avatar ? <img src={item.avatar} alt={item.name ?? ""} /> : <span className="testimonial-avatar"><UserRound size={16} /></span>}<div><strong>{item.name ?? "Nombre pendiente"}</strong><small>{item.location ?? "Ciudad pendiente"}</small></div></div>
    </article>)}</div></div>
    <div className="carousel-controls"><Button variant="ghost" size="icon" aria-label="Testimonio anterior" title="Anterior" onClick={() => api?.scrollPrev()}><ArrowLeft /></Button><Button variant="ghost" size="icon" aria-label={paused ? "Reanudar testimonios" : "Pausar testimonios"} title={paused ? "Reanudar" : "Pausar"} onClick={() => setPaused(!paused)}>{paused ? <Play /> : <Pause />}</Button><Button variant="ghost" size="icon" aria-label="Testimonio siguiente" title="Siguiente" onClick={() => api?.scrollNext()}><ArrowRight /></Button></div>
  </div>;
}