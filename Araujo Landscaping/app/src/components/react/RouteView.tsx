import { useEffect, useState, type FormEvent } from "react";
import { api, place, shrinkPhoto, speak, todayISO } from "../../lib/api";

type Lang = "es" | "en";
type Stop = {
  id: number; nombre: string; telefono: string; direccion: string; servicio: string; frecuencia: string; notas: string;
  lat: number; lng: number; millas: number; empleado: string;
  visita: { antes: string; despues: string; iniciada: boolean; terminada: boolean } | null;
};
type RouteData = {
  fecha: string; cuadrillaId: number;
  cuadrillas: { id: number; nombre: string }[];
  empleados: { id: number; nombre: string; puesto: string; enTurno: boolean }[];
  salida: { label: string; lat: number; lng: number };
  paradas: Stop[]; millas: number; maps: string;
};

const text = {
  es: {
    route: "Ruta de hoy", in: "Entrar a trabajar", out: "Salir de trabajar", see: "Ver a todos", code: "Código",
    today: "Solo las de hoy", all: "Las 20, en orden", maps: "Navegar en Google Maps", start: "Empecé esta casa",
    finish: "Terminé esta casa", text: "Avisar al cliente", done: "Terminada", finding: "Buscando la ubicación…",
    hi: "Buenos días", bye: "Muchas gracias por su ayuda", tools: "Ya recogiste toda la herramienta, gracias.",
    bad: "Código incorrecto.", day: "Día de trabajo", crew: "Cuadrilla", miles: "millas",
  },
  en: {
    route: "Today's route", in: "Clock in", out: "Clock out", see: "See everyone", code: "Code",
    today: "Today only", all: "All of them, in order", maps: "Navigate in Google Maps", start: "I started this house",
    finish: "I finished this house", text: "Text the client", done: "Finished", finding: "Finding the location…",
    hi: "Good morning", bye: "Thank you very much for your help", tools: "You picked up all the tools, thank you.",
    bad: "Wrong code.", day: "Work day", crew: "Crew", miles: "miles",
  },
};

export default function RouteView({ lang }: { lang: Lang }) {
  const t = text[lang];
  const [fecha, setFecha] = useState(todayISO());
  const [todas, setTodas] = useState(false);
  const [data, setData] = useState<RouteData | null>(null);
  const [worker, setWorker] = useState(0);
  const [seeAll, setSeeAll] = useState(false);
  const [lock, setLock] = useState<null | { tipo: "admin" | "empleado"; empleadoId?: number }>(null);
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [hello, setHello] = useState("");
  const [finding, setFinding] = useState(false);

  async function load(nextFecha = fecha, nextTodas = todas, crew = data?.cuadrillaId || 0) {
    const params = new URLSearchParams({ fecha: nextFecha, todas: nextTodas ? "1" : "0" });
    if (crew) params.set("cuadrillaId", String(crew));
    setData(await api<RouteData>(`/api/v1/ruta.php?${params.toString()}`));
  }

  useEffect(() => { load().catch((reason: Error) => setError(reason.message)); }, []);

  async function chooseCrew(id: number) {
    setData(await api<RouteData>("/api/v1/ruta.php", { fecha, cuadrillaId: id, todas }));
  }

  async function submitCode(event: FormEvent) {
    event.preventDefault();
    if (!lock) return;
    try {
      const result = await api<{ tipo: string; empleadoId?: number; nombre?: string }>("/api/v1/auth/codigo.php", {
        tipo: lock.tipo, empleadoId: lock.empleadoId, codigo: code,
      });
      setError("");
      setCode("");
      setLock(null);
      if (result.tipo === "admin") setSeeAll(true);
      else if (result.empleadoId) {
        setWorker(result.empleadoId);
        setPin(code);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t.bad);
    }
  }

  async function clock(accion: "entrada" | "salida") {
    if (!worker) return;
    setFinding(true);
    const where = await place();
    setFinding(false);
    const person = data?.empleados.find((item) => item.id === worker);
    try {
      const typed = pin || window.prompt(t.code) || "";
      await api("/api/v1/fichaje.php", { empleadoId: worker, codigo: typed, accion, lat: where?.lat, lng: where?.lng });
      setPin(typed);
      const line = accion === "entrada" ? `${t.hi}, ${person?.nombre}.` : `${t.bye}. ${person?.nombre}.`;
      setHello(line);
      speak(line);
      window.setTimeout(() => setHello(""), 2200);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t.bad);
    }
  }

  async function photo(stop: Stop, fase: "inicio" | "fin", file: File | undefined) {
    if (!file) return;
    try {
      const foto = await shrinkPhoto(file);
      await api("/api/v1/visita.php", { clienteId: stop.id, fecha, fase, foto, empleadoId: worker || null });
      if (fase === "fin") {
        setHello(t.tools);
        speak(t.tools);
        window.setTimeout(() => setHello(""), 1800);
      }
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Error");
    }
  }

  function mapSvg() {
    if (!data?.paradas.length) return null;
    const points = [data.salida, ...data.paradas];
    const lats = points.map((point) => point.lat);
    const lngs = points.map((point) => point.lng);
    const minLat = Math.min(...lats); const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs); const maxLng = Math.max(...lngs);
    const project = (point: { lat: number; lng: number }) => [
      24 + ((point.lng - minLng) / ((maxLng - minLng) || 1)) * 592,
      24 + ((maxLat - point.lat) / ((maxLat - minLat) || 1)) * 232,
    ];
    const coords = points.map(project);
    return (
      <svg className="map" viewBox="0 0 640 280" role="img">
        <polyline points={coords.map((pair) => pair.join(",")).join(" ")} fill="none" stroke="#c45c1a" strokeWidth="3" />
        <circle cx={coords[0][0]} cy={coords[0][1]} r="8" fill="#2c6b45" />
        {coords.slice(1).map((pair, index) => (
          <g key={pair.join()}>
            <circle cx={pair[0]} cy={pair[1]} r="12" fill="#173028" />
            <text x={pair[0]} y={pair[1] + 4} textAnchor="middle" fill="white" fontSize="12">{index + 1}</text>
          </g>
        ))}
      </svg>
    );
  }

  const visibleWorkers = seeAll ? data?.empleados ?? [] : data?.empleados.filter((item) => !worker || item.id === worker) ?? [];

  return (
    <div className="stack">
      {hello ? <div className="hello">{hello}</div> : null}
      <section className="card stack">
        <h2>{t.in}</h2>
        {finding ? <p>{t.finding}</p> : null}
        <div className="row">
          {visibleWorkers.map((person) => (
            <button key={person.id} className="chip" type="button" onClick={() => setLock({ tipo: "empleado", empleadoId: person.id })}>
              {person.nombre}{person.enTurno ? " · turno" : ""}
            </button>
          ))}
          <button className="btn secondary" type="button" onClick={() => setLock({ tipo: "admin" })}>{t.see}</button>
        </div>
        {worker ? (
          <div className="row">
            <button className="btn" type="button" onClick={() => clock("entrada")}>{t.in}</button>
            <button className="btn clay" type="button" onClick={() => clock("salida")}>{t.out}</button>
          </div>
        ) : null}
      </section>
      <section className="card stack">
        <h2>{t.route}</h2>
        <label>{t.day}<input type="date" value={fecha} onChange={(event) => { setFecha(event.target.value); void load(event.target.value, todas); }} /></label>
        <div className="row">
          {data?.cuadrillas.map((crew) => (
            <button key={crew.id} className="tab" type="button" aria-pressed={crew.id === data.cuadrillaId} onClick={() => chooseCrew(crew.id)}>{crew.nombre}</button>
          ))}
        </div>
        <div className="row">
          <button className="tab" type="button" aria-pressed={!todas} onClick={() => { setTodas(false); void load(fecha, false); }}>{t.today}</button>
          <button className="tab" type="button" aria-pressed={todas} onClick={() => { setTodas(true); void load(fecha, true); }}>{t.all}</button>
        </div>
        <p>{data?.paradas.length || 0} · {data?.millas || 0} {t.miles}</p>
        {data?.maps ? <a className="btn" href={data.maps} target="_blank" rel="noreferrer">{t.maps}</a> : null}
        {mapSvg()}
      </section>
      {data?.paradas.map((stop, index) => (
        <article className="card stop" key={stop.id}>
          <div className="num">{index + 1}</div>
          <div>
            <strong>{stop.nombre}</strong>
            <div>{stop.direccion}</div>
            <p className="note">{stop.servicio} · {stop.frecuencia} · {stop.millas} mi</p>
            {stop.notas ? <p>{stop.notas}</p> : null}
            {stop.visita?.terminada ? <p>{t.done}{stop.empleado ? ` · ${stop.empleado}` : ""}</p> : null}
            <div className="photos">
              {stop.visita?.antes ? <img src={stop.visita.antes} alt="" /> : null}
              {stop.visita?.despues ? <img src={stop.visita.despues} alt="" /> : null}
            </div>
            {!stop.visita?.terminada ? (
              <div className="row">
                {!stop.visita?.iniciada ? (
                  <label className="btn">{t.start}<input className="hidden" type="file" accept="image/*" capture="environment" onChange={(event) => photo(stop, "inicio", event.target.files?.[0])} /></label>
                ) : (
                  <label className="btn">{t.finish}<input className="hidden" type="file" accept="image/*" capture="environment" onChange={(event) => photo(stop, "fin", event.target.files?.[0])} /></label>
                )}
                <a className="btn secondary" href={`sms:${stop.telefono.replace(/\D/g, "")}?&body=${encodeURIComponent(lang === "en" ? `Your landscaping service is scheduled for this day. Araujo’s Landscaping.` : `Tu servicio de jardinería está programado para el día. Araujo’s Landscaping.`)}`}>{t.text}</a>
              </div>
            ) : null}
          </div>
        </article>
      ))}
      {error ? <p className="error">{error}</p> : null}
      {lock ? (
        <form className="card stack" onSubmit={submitCode}>
          <h2>{t.code}</h2>
          <input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" autoFocus />
          <div className="row">
            <button className="btn" type="submit">OK</button>
            <button className="btn ghost" type="button" onClick={() => setLock(null)}>Cancel</button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
