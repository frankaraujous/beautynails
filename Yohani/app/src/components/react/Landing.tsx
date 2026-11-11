import { useEffect, useRef, useState, type ComponentType, type SVGProps } from "react";
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  HeartIcon,
  LockClosedIcon,
  PaintBrushIcon,
  SparklesIcon,
  SwatchIcon,
} from "@heroicons/react/24/outline";
import { money } from "../../lib/api";

type Lang = "es" | "en";
type Icon = ComponentType<SVGProps<SVGSVGElement>>;

export type PublicDay = { fecha: string; libre: boolean; horas: { hora: string; libre?: boolean }[] };
export type PublicData = {
  servicios: { nombre: string; precio: number }[];
  dias: PublicDay[];
  galeria: { nombre: string; servicio: string; foto: string }[];
  textTo: string;
  zelle: string;
  instagram: string;
};

/** Sustituye el archivo en app/public/landing/ conservando este mismo nombre. */
export const landingImages = {
  hero: "/landing/hero.jpg",
  looks: [
    { src: "/landing/look-1.jpg", es: "Francés suave", en: "Soft French" },
    { src: "/landing/look-2.jpg", es: "Nail art", en: "Nail art" },
    { src: "/landing/look-3.jpg", es: "Fucsia", en: "Fuchsia" },
  ],
} as const;

const serviceIcons: Record<string, Icon> = {
  "Acrílico": SparklesIcon,
  Gel: SwatchIcon,
  "Nail art": PaintBrushIcon,
  Retiro: ArrowPathIcon,
  "Uñas de los pies": HeartIcon,
};

const servicePhotos: Record<string, { src: string; focus: string; phone: string }> = {
  "Acrílico": { src: "/landing/acrilico.png", focus: "center 64%", phone: "78% 68%" },
  Gel: { src: "/landing/gel.png", focus: "center 60%", phone: "74% 62%" },
  "Nail art": { src: "/landing/nailart.png", focus: "center 58%", phone: "70% 60%" },
  Retiro: { src: "/landing/retiro.png", focus: "center 42%", phone: "82% 46%" },
  "Uñas de los pies": { src: "/landing/pies.png", focus: "center 58%", phone: "58% 62%" },
};

const copy = {
  es: {
    by: "nails by",
    role: "Manicurista",
    phrase: "Deja que tus uñas hablen por ti",
    shine: "Deja que tus uñas brillen tanto como tú",
    services: "Servicios",
    servicesTitle: "Elige cómo quieres tus uñas",
    servicesLead: "Toca un servicio y sigue con el día y la hora.",
    choose: "Reservar",
    gallery: "El trabajo",
    galleryTitle: "Así se ven",
    galleryLead: "Diseños para llegar con una idea, o para dejarte sorprender.",
    wanted: "Así quieren el trabajo",
    how: "La cita",
    howTitle: "Tres pasos y listo",
    steps: [
      ["Tu nombre y el servicio", "Nos dices cómo te llamas y qué quieres hacerte."],
      ["El día y la hora", "Un calendario grande y las horas, de 10:00 a.m. a 5:00 p.m."],
      ["El diseño", "Si tienes fotos o un tono en mente, los dejas al final."],
    ],
    book: "Reservar cita",
    policies: "Para reservar",
    pol: [
      "Para reservar tu horario se requiere un depósito.",
      "El depósito se descuenta del total de tu servicio.",
      "Si cancelas con menos de 24 horas, el depósito no es reembolsable.",
      "Si necesitas cambiar tu cita, avísanos con anticipación para reprogramarla.",
    ],
    contact: "Escríbenos",
    follow: "Instagram",
    finale: "Reserva tu cita ya",
    finaleCta: "Clic para reservar",
    rights: "Todos los derechos reservados",
    admin: "Administrador",
    lang: "English",
    heroAlt: "Manos con manicure terminado",
  },
  en: {
    by: "nails by",
    role: "Manicurist",
    phrase: "Let your nails speak for you",
    shine: "Let your nails shine as much as you do",
    services: "Services",
    servicesTitle: "Choose the nails you want",
    servicesLead: "Tap a service, then pick the day and time.",
    choose: "Book",
    gallery: "The work",
    galleryTitle: "How they look",
    galleryLead: "Designs to arrive with an idea, or to be surprised.",
    wanted: "How they want the work",
    how: "The visit",
    howTitle: "Three steps",
    steps: [
      ["Your name and the service", "Tell us your name and what you want done."],
      ["The day and time", "A large calendar and the hours, from 10:00 a.m. to 5:00 p.m."],
      ["The design", "If you have photos or a shade in mind, leave them at the end."],
    ],
    book: "Book a visit",
    policies: "To book",
    pol: [
      "A deposit is required to reserve your time.",
      "The deposit is applied to the total of your service.",
      "If you cancel with less than 24 hours' notice, the deposit is not refundable.",
      "If you need to change your appointment, tell us ahead of time so we can reschedule it.",
    ],
    contact: "Text us",
    follow: "Instagram",
    finale: "Book your visit now",
    finaleCta: "Click to book",
    rights: "All rights reserved",
    admin: "Admin",
    lang: "Español",
    heroAlt: "Hands with a finished manicure",
  },
} as const;

function prettyPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const local = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (local.length !== 10) return raw;
  return `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
}

function whatsAppHref(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const full = digits.length === 10 ? `1${digits}` : digits;
  return `https://wa.me/${full}`;
}

type MorphBox = { top: number; left: number; width: number; height: number; radius: number };

function lerpBox(from: MorphBox, to: MorphBox, amount: number): MorphBox {
  return {
    top: from.top + (to.top - from.top) * amount,
    left: from.left + (to.left - from.left) * amount,
    width: from.width + (to.width - from.width) * amount,
    height: from.height + (to.height - from.height) * amount,
    radius: from.radius + (to.radius - from.radius) * amount,
  };
}

export default function Landing({
  lang,
  pub,
  hideBook,
  onLang,
  onAdmin,
  onReserve,
}: {
  lang: Lang;
  pub: PublicData;
  hideBook: boolean;
  onLang: () => void;
  onAdmin: () => void;
  onReserve: (servicio?: string) => void;
}) {
  const t = copy[lang];
  const phone = pub.textTo.replace(/\D/g, "");
  const bandRef = useRef<HTMLElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const heroBookRef = useRef<HTMLButtonElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const socialRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const legalRef = useRef<HTMLDivElement>(null);
  const morphRef = useRef<HTMLDivElement>(null);
  const onBandRef = useRef(false);
  const dockedRef = useRef(false);
  const morphing = useRef(false);
  const lockTap = useRef(0);
  const [onBand, setOnBand] = useState(false);
  const [docked, setDocked] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [morphLive, setMorphLive] = useState(false);
  const [morphCopy, setMorphCopy] = useState(false);
  const [pastBook, setPastBook] = useState(false);

  useEffect(() => {
    if (hideBook) return;
    const band = bandRef.current;
    const button = fabRef.current;
    if (!band || !button) return;
    const phone = window.matchMedia("(min-width: 0px)");
    let frame = 0;
    const check = () => {
      frame = 0;
      if (phone.matches) {
        if (onBandRef.current) {
          onBandRef.current = false;
          setOnBand(false);
        }
        return;
      }
      const section = band.getBoundingClientRect();
      const spot = button.getBoundingClientRect();
      const mid = (spot.top + spot.bottom) / 2;
      const slack = onBandRef.current ? 80 : 0;
      const next = section.top - slack < mid && section.bottom + slack > mid;
      if (next === onBandRef.current) return;
      onBandRef.current = next;
      setOnBand(next);
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(check);
    };
    check();
    phone.addEventListener("change", onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.visualViewport?.addEventListener("scroll", onScroll);
    window.visualViewport?.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      phone.removeEventListener("change", onScroll);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.visualViewport?.removeEventListener("scroll", onScroll);
      window.visualViewport?.removeEventListener("resize", onScroll);
    };
  }, [hideBook]);

  useEffect(() => {
    const social = socialRef.current;
    const slot = slotRef.current;
    if (!social || !slot) return;
    const fit = () => {
      slot.style.minHeight = `${Math.max(social.offsetHeight, 104)}px`;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  useEffect(() => {
    if (hideBook) return;
    const line = lineRef.current;
    const stack = stackRef.current;
    const slot = slotRef.current;
    const legal = legalRef.current;
    const fab = fabRef.current;
    const morph = morphRef.current;
    if (!line || !stack || !slot || !legal || !fab || !morph) return;
    const phone = window.matchMedia("(min-width: 0px)");
    let frame = 0;
    let raf = 0;

    const paint = (box: MorphBox) => {
      morph.style.top = `${box.top}px`;
      morph.style.left = `${box.left}px`;
      morph.style.width = `${box.width}px`;
      morph.style.height = `${box.height}px`;
      morph.style.borderRadius = `${box.radius}px`;
    };

    const play = (from: MorphBox, to: MorphBox, scrollDelta: number, inward: boolean, done: () => void) => {
      const startY = window.scrollY;
      const t0 = performance.now();
      paint(from);
      let copyOn = !inward;
      setMorphCopy(copyOn);
      setMorphLive(true);
      const step = (now: number) => {
        const progress = Math.min(1, (now - t0) / 580);
        const eased = 1 - (1 - progress) ** 3;
        paint(lerpBox(from, to, eased));
        if (scrollDelta) window.scrollTo(0, startY + scrollDelta * eased);
        const showCopy = inward ? progress > 0.62 : progress < 0.28;
        if (showCopy !== copyOn) {
          copyOn = showCopy;
          setMorphCopy(showCopy);
        }
        if (progress < 1) {
          raf = requestAnimationFrame(step);
          return;
        }
        done();
      };
      raf = requestAnimationFrame(step);
    };

    const boxFrom = (rect: DOMRect, radius: number): MorphBox => ({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      radius,
    });

    const finishIn = () => {
      setMorphLive(false);
      setMorphCopy(false);
      setRevealed(true);
      morphing.current = false;
    };

    const finishOut = () => {
      setMorphLive(false);
      setMorphCopy(false);
      dockedRef.current = false;
      setDocked(false);
      setRevealed(false);
      morphing.current = false;
    };

    const arrive = () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const fabRect = fab.getBoundingClientRect();
      const slotRect = slot.getBoundingClientRect();
      const legalRect = legal.getBoundingClientRect();
      const overflow = Math.max(0, legalRect.bottom - (window.innerHeight - 12));
      dockedRef.current = true;
      setDocked(true);
      if (reduce) {
        if (overflow) window.scrollBy(0, overflow);
        setRevealed(true);
        return;
      }
      morphing.current = true;
      setRevealed(false);
      play(
        boxFrom(fabRect, fabRect.width / 2),
        { top: slotRect.top - overflow, left: slotRect.left, width: slotRect.width, height: slotRect.height, radius: 0 },
        overflow,
        true,
        finishIn,
      );
    };

    const depart = () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        finishOut();
        return;
      }
      const fabRect = fab.getBoundingClientRect();
      const slotRect = slot.getBoundingClientRect();
      morphing.current = true;
      setRevealed(false);
      play(boxFrom(slotRect, 0), boxFrom(fabRect, fabRect.width / 2), 0, false, finishOut);
    };

    const check = () => {
      frame = 0;
      if (phone.matches) {
        if (dockedRef.current || morphing.current) {
          morphing.current = false;
          dockedRef.current = false;
          setDocked(false);
          setRevealed(false);
          setMorphLive(false);
          setMorphCopy(false);
        }
        return;
      }
      if (morphing.current) return;
      const edge = line.getBoundingClientRect().top;
      const spotTop = stack.getBoundingClientRect().top;
      const slack = dockedRef.current ? 80 : 0;
      const next = edge <= spotTop + slack;
      if (next === dockedRef.current) return;
      if (next) arrive();
      else depart();
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(check);
    };
    check();
    phone.addEventListener("change", onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.visualViewport?.addEventListener("scroll", onScroll);
    window.visualViewport?.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(raf);
      morphing.current = false;
      phone.removeEventListener("change", onScroll);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.visualViewport?.removeEventListener("scroll", onScroll);
      window.visualViewport?.removeEventListener("resize", onScroll);
    };
  }, [hideBook]);

  useEffect(() => {
    const link = heroBookRef.current;
    if (!link) return;
    let frame = 0;
    const check = () => {
      frame = 0;
      const bar = link.closest(".landing-root")?.querySelector(".phone-bar");
      const limit = bar instanceof HTMLElement ? bar.getBoundingClientRect().bottom : 0;
      const passed = link.getBoundingClientRect().bottom <= limit + 1;
      setPastBook((current) => (current === passed ? current : passed));
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="landing-root">
      <div className="phone-bar">
        <button className={pastBook ? "phone-book on" : "phone-book"} type="button" onClick={() => onReserve()}>{t.book}</button>
        <button className="phone-lang" type="button" onClick={onLang}>{t.lang}</button>
      </div>
      <header className="hero">
        <div className="wordmark">
          <p className="by">{t.by}</p>
          <h1>Yohani</h1>
          <p className="role">{t.role}</p>
        </div>
        <p className="hero-phrase">{t.phrase}</p>
        <button ref={heroBookRef} className="hero-book" type="button" onClick={() => onReserve()}>{t.book}</button>
        <figure className="hero-photo">
          <img src={landingImages.hero} alt={t.heroAlt} />
        </figure>
      </header>

      <section className="section">
        <div className="wrap">
          <p className="eyebrow">{t.services}</p>
          <h2>{t.servicesTitle}</h2>
          <p className="lead">{t.servicesLead}</p>
          <div className="service-grid">
            {pub.servicios.map((item) => {
              const Icon = serviceIcons[item.nombre] ?? SparklesIcon;
              const photo = servicePhotos[item.nombre];
              return (
                <button key={item.nombre} className="service-card" type="button" onClick={() => onReserve(item.nombre)}>
                  {photo ? (
                    <span
                      className="service-photo"
                      style={{ backgroundImage: `url(${photo.src})`, ["--focus" as string]: photo.focus, ["--phone" as string]: photo.phone }}
                      aria-hidden="true"
                    />
                  ) : null}
                  <span className="service-veil" aria-hidden="true" />
                  <span className="service-icon"><Icon width={22} height={22} strokeWidth={1.5} /></span>
                  <span className="service-copy">
                    <strong>{item.nombre}</strong>
                    {item.precio > 0 ? <em>{money(item.precio)}</em> : null}
                  </span>
                  <small>{t.choose}</small>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section gallery">
        <div className="wrap">
          <p className="eyebrow">{t.gallery}</p>
          <h2>{t.galleryTitle}</h2>
          <p className="lead">{t.galleryLead}</p>
          <div className="look-grid">
            {landingImages.looks.map((look) => (
              <figure key={look.src} className="look-card">
                <img src={look.src} alt={look[lang]} />
                <figcaption>{look[lang]}</figcaption>
              </figure>
            ))}
          </div>
          {pub.galeria.length ? (
            <>
              <h3>{t.wanted}</h3>
              <div className="shots">
                {pub.galeria.map((shot) => (
                  <figure key={shot.foto} className="shot">
                    <img src={shot.foto} alt="" />
                    <figcaption>{shot.nombre} · {shot.servicio}</figcaption>
                  </figure>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <p className="eyebrow">{t.how}</p>
          <h2>{t.howTitle}</h2>
          <div className="step-grid">
            {t.steps.map(([title, text], index) => (
              <button key={title} className="step-card" type="button" onClick={() => onReserve()}>
                <span className="step-num">{index + 1}</span>
                <strong>{title}</strong>
                <p>{text}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="band" ref={bandRef}>
        <div className="wrap">
          <p className="script">{t.shine}</p>
          <h2>{t.policies}</h2>
          <ul className="policies">
            {t.pol.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </div>
      </section>

      <footer className="site-footer">
        <div className="wrap">
          <div className="social-row" ref={socialRef}>
            {phone ? (
              <a className="social-block" href={whatsAppHref(phone)} target="_blank" rel="noreferrer">
                <p className="eyebrow social-kicker"><WhatsAppIcon />{t.contact}</p>
                <span className="social-link"><span className="desk-icon"><WhatsAppIcon /></span>{prettyPhone(phone)}</span>
              </a>
            ) : null}
            {pub.instagram ? (
              <a className="social-block" href={`https://instagram.com/${pub.instagram}`} target="_blank" rel="noreferrer">
                <p className="eyebrow social-kicker"><InstagramIcon />{t.follow}</p>
                <span className="social-link"><span className="desk-icon"><InstagramIcon /></span>@{pub.instagram}</span>
              </a>
            ) : null}
          </div>
        </div>
        <div className="footer-rule" ref={lineRef} />
        <div className={revealed ? "finale-band on" : "finale-band"} ref={slotRef} aria-hidden={revealed ? undefined : true}>
          <p className="finale-title">{t.finale}</p>
          <button className="finale-cta" type="button" tabIndex={revealed ? 0 : -1} onClick={() => onReserve()}>{t.finaleCta}</button>
        </div>
        <button className={docked ? "finale-lang on" : "finale-lang"} type="button" tabIndex={docked ? 0 : -1} aria-hidden={docked ? undefined : true} onClick={onLang}>{t.lang}</button>
        <div className="wrap">
          <div className="legal" ref={legalRef}>
            <div className="legal-mark">
              <button
                className="lock-btn"
                type="button"
                aria-label={t.admin}
                onDoubleClick={onAdmin}
                onClick={() => {
                  const now = Date.now();
                  if (now - lockTap.current < 450) {
                    lockTap.current = 0;
                    onAdmin();
                    return;
                  }
                  lockTap.current = now;
                }}
              >
                <LockClosedIcon width={16} height={16} strokeWidth={1.5} />
              </button>
              <span>© 2026 Yohani</span>
            </div>
            <p>{t.rights}</p>
          </div>
        </div>
      </footer>

      {hideBook ? null : (
        <div className={docked ? "fab-stack away" : "fab-stack"} ref={stackRef} aria-hidden={docked || undefined} inert={docked || undefined}>
          <button className="lang-fab" type="button" onClick={onLang}>{t.lang}</button>
          <button ref={fabRef} className={onBand ? "fab on-band" : "fab"} type="button" onClick={() => onReserve()}>
            <CalendarDaysIcon width={26} height={26} strokeWidth={1.5} />
            {t.book}
          </button>
        </div>
      )}
      <div
        ref={morphRef}
        className={morphCopy ? "fab-morph copy" : "fab-morph"}
        style={{ visibility: morphLive ? "visible" : "hidden" }}
        aria-hidden="true"
      >
        <p className="finale-title">{t.finale}</p>
        <span className="finale-cta">{t.finaleCta}</span>
      </div>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.74.46 3.44 1.34 4.94L2 22l5.39-1.41a10 10 0 0 0 4.65 1.13h.01c5.46 0 9.89-4.4 9.89-9.84C21.94 6.4 17.5 2 12.04 2Zm5.76 14.56c-.24.68-1.2 1.25-1.96 1.41-.52.11-1.2.2-3.48-.75-2.92-1.21-4.8-4.17-4.95-4.36-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.12 1.01-2.41.26-.29.58-.36.77-.36h.55c.18 0 .41-.07.64.49.24.58.81 2 .88 2.15.07.14.12.32.02.51-.09.19-.14.31-.28.48-.14.16-.29.37-.41.49-.14.14-.28.29-.12.56.16.27.7 1.16 1.51 1.88 1.04.92 1.91 1.21 2.18 1.35.27.14.43.12.59-.07.16-.19.68-.79.86-1.06.18-.27.36-.22.6-.13.24.09 1.54.73 1.8.86.27.14.44.2.51.31.06.12.06.67-.18 1.35Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm10 1.8H7A2.2 2.2 0 0 0 4.8 7v10A2.2 2.2 0 0 0 7 19.2h10a2.2 2.2 0 0 0 2.2-2.2V7A2.2 2.2 0 0 0 17 4.8ZM12 8.2A3.8 3.8 0 1 1 8.2 12 3.8 3.8 0 0 1 12 8.2Zm0 1.6A2.2 2.2 0 1 0 14.2 12 2.2 2.2 0 0 0 12 9.8Zm4.35-2.55a.9.9 0 1 1-.9.9.9.9 0 0 1 .9-.9Z" />
    </svg>
  );
}
