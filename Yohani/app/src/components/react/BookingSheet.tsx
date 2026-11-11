import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { api, readPhoto } from "../../lib/api";
import type { PublicDay } from "./Landing";

type Lang = "es" | "en";
type PayName = "Efectivo" | "Transferencia";

const HOURS = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
const SERVICE_ORDER = ["Gel", "Nail art", "Retiro", "Acrílico", "Uñas de los pies"];
const DESKTOP = "(min-width: 760px)";

const copy = {
  es: {
    of: "de 3",
    close: "Cerrar",
    exit: "Salir",
    back: "Atrás",
    next: "Continuar",
    review: "Revisar",
    reviewSend: "Revisar y enviar",
    send: "Enviar",
    confirm: "Confirmar",
    bookTitle: "Reservar cita",
    reviewTitle: "Revisa tu cita",
    working: "Reservando…",
    titles: ["Tu nombre", "Día y hora", "El diseño"],
    leads: [
      "Cómo te llamas, tu teléfono y el servicio.",
      "Primero el día. Después, una hora de la matriz.",
      "Opcional. Una foto, un tono o algo que debamos tener listo.",
    ],
    name: "Nombre",
    phone: "Teléfono",
    service: "Tipo de servicio",
    hours: "Cada hora, de 10:00 a.m. a 5:00 p.m.",
    prev: "Mes anterior",
    nextMonth: "Mes siguiente",
    week: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
    note: "Mensaje",
    placeholder: "Algún tono, un diseño que quieras o algo que debamos tener listo para tu visita.",
    photo: "Foto",
    optional: "opcional",
    pay: "Cómo vas a pagar",
    payForm: "Forma de pago",
    photoLead: "Si quieres, puedes añadir hasta 2 fotos de un diseño de referencia.",
    cash: "Efectivo",
    transfer: "Transferencia",
    card: "Tarjeta al llegar",
    cardOff: "Todavía no aceptamos tarjetas",
    need1: "Escribe tu nombre, tu teléfono y elige un servicio.",
    phoneTen: "El teléfono lleva 10 números.",
    photosNone: "Sin fotos adjuntas",
    photosOne: "1 foto adjunta",
    photosTwo: "2 fotos adjuntas",
    need2: "Elige el día y la hora.",
    need3: "Elige cómo vas a pagar.",
    photoBig: "La foto pesa más de 500 KB. Elige una más liviana.",
    done: (nombre: string) => `Hola ${nombre}, gracias por reservar tu cita. Yohani va a revisarla y te va a confirmar la fecha y la hora.`,
    zelle: "Paga con Zelle",
    ok: "Cerrar",
  },
  en: {
    of: "of 3",
    close: "Close",
    exit: "Exit",
    back: "Back",
    next: "Continue",
    review: "Review",
    reviewSend: "Review and send",
    send: "Send",
    confirm: "Confirm",
    bookTitle: "Book a visit",
    reviewTitle: "Review your visit",
    working: "Booking…",
    titles: ["Your name", "Day and time", "The design"],
    leads: [
      "Your name, your phone, and the service.",
      "Pick the day first. Then pick an hour from the grid.",
      "Optional. A photo, a shade, or anything we should have ready.",
    ],
    name: "Name",
    phone: "Phone",
    service: "Type of service",
    hours: "Every hour, from 10:00 a.m. to 5:00 p.m.",
    prev: "Previous month",
    nextMonth: "Next month",
    week: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    note: "Message",
    placeholder: "A specific shade, a design, or an allergy we should have ready.",
    photo: "Photo",
    optional: "optional",
    pay: "How you will pay",
    payForm: "Payment",
    photoLead: "If you want, you can add up to 2 photos of a reference design.",
    cash: "Cash",
    transfer: "Transfer",
    card: "Card on arrival",
    cardOff: "We are not taking cards yet",
    need1: "Enter your name, your phone, and choose a service.",
    phoneTen: "The phone number needs 10 digits.",
    photosNone: "No photos attached",
    photosOne: "1 photo attached",
    photosTwo: "2 photos attached",
    need2: "Choose the day and the time.",
    need3: "Choose how you will pay.",
    photoBig: "The photo is over 500 KB. Choose a lighter one.",
    done: (nombre: string) => `Hi ${nombre}, thanks for booking your visit. Yohani will review it and confirm the date and time.`,
    zelle: "Pay with Zelle",
    ok: "Close",
  },
} as const;

function phoneDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

function phoneMask(value: string): string {
  const digits = phoneDigits(value);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function hourFace(hour: string): string {
  const value = Number(hour.slice(0, 2));
  const face = value % 12 === 0 ? 12 : value % 12;
  return `${face}:00`;
}

function hourFree(day: PublicDay | undefined, hour: string): boolean {
  if (!day?.libre) return false;
  return day.horas.some((item) => item.hora === hour && item.libre);
}

function dayOpen(day: PublicDay | undefined): boolean {
  return HOURS.some((hour) => hourFree(day, hour));
}

function monthCells(key: string, days: PublicDay[]) {
  const [year, month] = key.split("-").map(Number);
  const pad = new Date(year, month - 1, 1).getDay();
  const count = new Date(year, month, 0).getDate();
  const byIso = new Map(days.map((day) => [day.fecha, day]));
  const cells: ({ n: number; day?: PublicDay } | null)[] = Array.from({ length: pad }, () => null);
  for (let n = 1; n <= count; n += 1) {
    const iso = `${key}-${String(n).padStart(2, "0")}`;
    cells.push({ n, day: byIso.get(iso) });
  }
  return cells;
}

export default function BookingSheet({
  lang,
  servicios,
  dias,
  zelle,
  initialService,
  onClose,
  onBooked,
}: {
  lang: Lang;
  servicios: { nombre: string; precio: number }[];
  dias: PublicDay[];
  zelle: string;
  initialService: string;
  onClose: () => void;
  onBooked: () => Promise<void>;
}) {
  const t = copy[lang];
  const wide = useSyncExternalStore(
    (notify) => {
      const media = window.matchMedia(DESKTOP);
      media.addEventListener("change", notify);
      return () => media.removeEventListener("change", notify);
    },
    () => window.matchMedia(DESKTOP).matches,
    () => false,
  );
  const closeRef = useRef<HTMLButtonElement>(null);
  const finished = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [step, setStep] = useState(0);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [picked, setPicked] = useState<string[]>(() => (initialService ? [initialService] : []));
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [nota, setNota] = useState("");
  const [photos, setPhotos] = useState<string[]>(["", ""]);
  const [pays, setPays] = useState<PayName[]>([]);
  const [hint, setHint] = useState("");
  const [busy, setBusy] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [done, setDone] = useState<{ nombre: string; fecha: string; hora: string; codigo: string } | null>(null);
  const months = useMemo(() => {
    const keys: string[] = [];
    dias.forEach((day) => {
      const key = day.fecha.slice(0, 7);
      if (!keys.includes(key)) keys.push(key);
    });
    return keys;
  }, [dias]);
  const [month, setMonth] = useState(months[0] ?? "");
  const monthIndex = Math.max(0, months.indexOf(month));
  const selected = dias.find((day) => day.fecha === fecha);

  useEffect(() => {
    const scrollY = window.scrollY;
    const body = document.body;
    const html = document.documentElement;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
      htmlOverflow: html.style.overflow,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    closeRef.current?.focus({ preventScroll: true });
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.left = previous.left;
      body.style.right = previous.right;
      body.style.width = previous.width;
      body.style.overflow = previous.overflow;
      html.style.overflow = previous.htmlOverflow;
      window.scrollTo(0, finished.current ? 0 : scrollY);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  async function onPhoto(index: number, file: File | undefined) {
    if (!file) return;
    try {
      const next = [...photos];
      next[index] = await readPhoto(file, 500 * 1024);
      setPhotos(next);
      setHint("");
    } catch {
      setHint(t.photoBig);
    }
  }

  function serviceValue() {
    return [
      ...SERVICE_ORDER.filter((name) => picked.includes(name)),
      ...picked.filter((name) => !SERVICE_ORDER.includes(name)),
    ].join(", ");
  }

  function payValue() {
    return (["Efectivo", "Transferencia"] as const).filter((name) => pays.includes(name)).join(", ");
  }

  function toggleName<T extends string>(current: T[], name: T) {
    return current.includes(name) ? current.filter((item) => item !== name) : [...current, name];
  }

  function onPhone(next: string) {
    const digits = phoneDigits(next);
    const previous = phoneDigits(telefono);
    const trimmed = next.length < telefono.length && digits === previous ? digits.slice(0, -1) : digits;
    setTelefono(phoneMask(trimmed));
  }

  function identityReady() {
    if (!nombre.trim() || picked.length === 0) {
      setHint(t.need1);
      return false;
    }
    if (phoneDigits(telefono).length !== 10) {
      setHint(t.phoneTen);
      return false;
    }
    if (pays.length === 0) {
      setHint(t.need3);
      return false;
    }
    return true;
  }

  function goNext() {
    if (!identityReady()) return;
    setHint("");
    setStep(1);
  }

  function goReview() {
    if (!identityReady()) return;
    if (!fecha || !hora) {
      setHint(t.need2);
      return;
    }
    setHint("");
    setReviewing(true);
  }

  async function reserve() {
    if (pays.length === 0) {
      setHint(t.need3);
      return;
    }
    setBusy(true);
    setHint("");
    try {
      const result = await api<{ cita: { nombre: string; fecha: string; hora: string; codigo: string } }>("/api/v1/citas.php", {
        nombre: nombre.trim(),
        telefono: phoneDigits(telefono),
        servicio: serviceValue(),
        pago: payValue(),
        color: "own",
        fecha,
        hora,
        alergia: nota.trim(),
        foto1: photos[0],
        foto2: photos[1],
      });
      const cita = result.cita;
      finished.current = true;
      setDone({ nombre: cita.nombre, fecha: cita.fecha, hora: cita.hora, codigo: cita.codigo });
      setReviewing(false);
      await onBooked();
    } catch (reason) {
      setHint(reason instanceof Error ? reason.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  const monthName = month
    ? new Date(`${month}-01T12:00:00`).toLocaleDateString(lang === "en" ? "en-US" : "es-MX", { month: "long", year: "numeric" })
    : "";
  const monthLabel = monthName ? monthName.charAt(0).toUpperCase() + monthName.slice(1) : "";
  const services = [
    ...SERVICE_ORDER.flatMap((nombre) => {
      const item = servicios.find((entry) => entry.nombre === nombre);
      return item ? [item] : [];
    }),
    ...servicios.filter((item) => !SERVICE_ORDER.includes(item.nombre)),
  ];

  return (
    <div className="sheet-back" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        onClick={(event) => event.stopPropagation()}
      >
        {done ? null : (
          <h2 id="sheet-title" className={reviewing ? "review-title" : "sr-only"}>{reviewing ? t.reviewTitle : t.bookTitle}</h2>
        )}

        {done ? (
          <div className="done">
            <h2 id="sheet-title">{done.nombre}</h2>
            <p>{done.fecha} · {hourFace(done.hora)}</p>
            {done.codigo ? <p><strong>{done.codigo}</strong></p> : null}
            <p>{t.done(done.nombre)}</p>
            {done.codigo && zelle ? <p><a className="btn" href={zelle} target="_blank" rel="noreferrer">{t.zelle}</a></p> : null}
            <p><button className="btn" type="button" onClick={onClose}>{t.ok}</button></p>
          </div>
        ) : (
          <>
            <div className="sheet-viewport">
              {reviewing ? (
                <section className="sheet-step review">
                  <p><span>{t.name}</span>{nombre.trim()}</p>
                  <p><span>{t.phone}</span>{telefono.trim()}</p>
                  <p><span>{t.service}</span>{serviceValue()}</p>
                  <p><span>{t.titles[1]}</span>{fecha} · {hourFace(hora)}</p>
                  <p><span>{t.payForm}</span>{pays.includes("Efectivo") ? t.cash : ""}{pays.includes("Efectivo") && pays.includes("Transferencia") ? ", " : ""}{pays.includes("Transferencia") ? t.transfer : ""}</p>
                  {nota.trim() ? <p><span>{t.note}</span>{nota.trim()}</p> : null}
                  <p><span>{t.photo}</span>{photos.filter(Boolean).length === 0 ? t.photosNone : photos.filter(Boolean).length === 1 ? t.photosOne : t.photosTwo}</p>
                </section>
              ) : null}
              <div className="sheet-track" style={{ transform: `translateX(-${step * 100}%)` }} hidden={reviewing}>
                <section className="sheet-step" inert={!wide && step !== 0}>
                  <label className="book-name">
                    <span className="quiet-label">{t.name}</span>
                    <input value={nombre} onChange={(event) => setNombre(event.target.value)} autoComplete="name" type="text" placeholder={t.name} />
                  </label>
                  <label className="book-phone">
                    <span className="quiet-label">{t.phone}</span>
                    <input value={telefono} onChange={(event) => onPhone(event.target.value)} autoComplete="tel" type="tel" inputMode="tel" maxLength={12} placeholder={t.phone} />
                  </label>
                  <div className="book-services">
                    <p className="quiet-label svc-heading">{t.service}</p>
                    <div className="svc-list">
                      {services.map((item) => (
                        <button key={item.nombre} className="svc-option" type="button" role="checkbox" aria-checked={picked.includes(item.nombre)} onClick={() => setPicked((current) => toggleName(current, item.nombre))}>
                          <CheckIcon className="pick-mark" width={16} height={16} strokeWidth={2.5} aria-hidden="true" />
                          <span>{item.nombre}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="book-photos">
                    <p className="photo-lead">{t.photoLead}</p>
                    <div className="photo-row">
                      {[0, 1].map((index) => (
                        <label key={index}>
                          {photos[index] ? <img src={photos[index]} alt="" /> : `${t.photo} ${index + 1}`}
                          <span className="hidden">{t.optional}</span>
                          <input className="hidden" type="file" accept="image/*" onChange={(event) => onPhoto(index, event.target.files?.[0])} />
                        </label>
                      ))}
                    </div>
                  </div>
                  <label className="book-note">
                    <span className="quiet-label">{t.note}</span>
                    <textarea value={nota} onChange={(event) => setNota(event.target.value)} rows={3} placeholder={t.placeholder} />
                  </label>
                  <div className="book-pay">
                    <p className="pay-heading"><span className="only-phone">{t.pay}</span><span className="only-desk">{t.payForm}</span></p>
                    <div className="pay-row">
                      <button className="pay-pill" type="button" role="checkbox" aria-checked={pays.includes("Efectivo")} onClick={() => setPays((current) => toggleName(current, "Efectivo"))}>
                        <CheckIcon className="pick-mark" width={16} height={16} strokeWidth={2.5} aria-hidden="true" />
                        <span>{t.cash}</span>
                      </button>
                      <button className="pay-pill" type="button" role="checkbox" aria-checked={pays.includes("Transferencia")} onClick={() => setPays((current) => toggleName(current, "Transferencia"))}>
                        <CheckIcon className="pick-mark" width={16} height={16} strokeWidth={2.5} aria-hidden="true" />
                        <span>{t.transfer}</span>
                      </button>
                      <button className="pay-pill" type="button" disabled>{t.card} · {t.cardOff}</button>
                    </div>
                  </div>
                </section>

                <section className="sheet-step" inert={!wide && step !== 1}>
                  <div className="book-when">
                  <div className="cal-head">
                    <button className="btn secondary" type="button" aria-label={t.prev} disabled={monthIndex <= 0} onClick={() => setMonth(months[monthIndex - 1] ?? month)}>
                      <ChevronLeftIcon width={18} height={18} strokeWidth={1.5} />
                    </button>
                    <strong>{monthLabel}</strong>
                    <button className="btn secondary" type="button" aria-label={t.nextMonth} disabled={monthIndex >= months.length - 1} onClick={() => setMonth(months[monthIndex + 1] ?? month)}>
                      <ChevronRightIcon width={18} height={18} strokeWidth={1.5} />
                    </button>
                  </div>
                  <div className="cal-grid">
                    {t.week.map((label) => <span key={label} className="cal-dow">{label}</span>)}
                    {month ? monthCells(month, dias).map((cell, index) => {
                      if (!cell) return <span key={`pad-${index}`} />;
                      return (
                        <button
                          key={cell.day?.fecha ?? `${month}-${cell.n}`}
                          className="cal-cell"
                          type="button"
                          disabled={!dayOpen(cell.day)}
                          aria-pressed={cell.day?.fecha === fecha}
                          onClick={() => {
                            if (!cell.day) return;
                            setFecha(cell.day.fecha);
                            setHora("");
                          }}
                        >
                          {cell.n}
                        </button>
                      );
                    }) : null}
                  </div>
                  <p className="lead">{t.hours}</p>
                  <div className="hour-grid">
                    {HOURS.map((hour) => (
                      <button
                        key={hour}
                        className="hour-cell"
                        type="button"
                        disabled={!hourFree(selected, hour)}
                        aria-pressed={hora === hour}
                        onClick={() => setHora(hour)}
                      >
                        {hourFace(hour)}
                      </button>
                    ))}
                  </div>
                  </div>
                </section>
              </div>
            </div>
            <footer className="sheet-foot">
              {hint ? <p className="error">{hint}</p> : null}
              <div className="sheet-actions">
                {reviewing ? (
                  <button className="btn secondary" type="button" onClick={() => { setHint(""); setReviewing(false); }}>{t.back}</button>
                ) : !wide && step > 0 ? (
                  <button className="btn secondary" type="button" onClick={() => { setHint(""); setStep(0); }}>{t.back}</button>
                ) : (
                  <button ref={closeRef} className="btn exit" type="button" onClick={onClose}>{t.exit}</button>
                )}
                {reviewing ? (
                  <button className="btn" type="button" disabled={busy} onClick={() => void reserve()}>{busy ? t.working : t.send}</button>
                ) : (
                  <button className="btn" type="button" onClick={wide || step > 0 ? goReview : goNext}>{wide ? t.reviewSend : step > 0 ? t.review : t.next}</button>
                )}
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
