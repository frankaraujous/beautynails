import { useEffect, useMemo, useRef, useState, type ComponentType, type SVGProps } from "react";
import {
  BackspaceIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  PencilSquareIcon,
  TagIcon,
  TrashIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { api, money, sms } from "../../lib/api";

type Hour = { hora: string; abierta?: boolean; ocupada?: boolean };
type Day = { fecha: string; libre: boolean; horas: Hour[] };
type Cita = {
  id: number;
  nombre: string;
  telefono: string;
  correo: string;
  servicio: string;
  pago: string;
  fecha: string;
  hora: string;
  alergia: string;
  confirmada: boolean;
  cancelada: boolean;
  terminada: boolean;
  monto: number | null;
};
type Clienta = {
  nombre: string;
  telefono: string;
  correo: string;
  total: number;
  trabajos: { fecha: string; servicio: string; monto: number }[];
};
type AdminData = {
  agenda: Cita[];
  dias: Day[];
  precios: { nombre: string; precio: number }[];
  gastos: { id: number; nombre: string; monto: number; fecha: string }[];
  clientas: Clienta[];
};
type Screen = "agenda" | "horario" | "entradas" | "clientes" | "precios";
type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const TOKEN_KEY = "yohani-token";
const WEEK = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const screens: { id: Screen; label: string; title: string; icon: Icon }[] = [
  { id: "agenda", label: "Agenda", title: "Agenda", icon: CalendarDaysIcon },
  { id: "horario", label: "Horario", title: "Días y horas disponibles", icon: ClockIcon },
  { id: "entradas", label: "Entradas", title: "Control de entradas", icon: BanknotesIcon },
  { id: "clientes", label: "Clientes", title: "Clientes", icon: UserIcon },
  { id: "precios", label: "Precios", title: "Precios y gastos", icon: TagIcon },
];

function labelDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" });
}

function confirmText(cita: Cita): string {
  const fecha = new Date(`${cita.fecha}T12:00:00`).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
  return `Hola ${cita.nombre}, quiero confirmarte que tu cita quedó programada para el ${fecha} a las ${hourFace(cita.hora)}.`;
}

function hourFace(hour: string): string {
  const value = Number(hour.slice(0, 2));
  const face = value % 12 === 0 ? 12 : value % 12;
  return `${face}:00 ${value < 12 ? "a.m." : "p.m."}`;
}

function moneyInput(value: string): string {
  const clean = value.replace(/[^\d.]/g, "");
  const dot = clean.indexOf(".");
  if (dot < 0) return clean;
  return `${clean.slice(0, dot + 1)}${clean.slice(dot + 1).replace(/\./g, "")}`;
}

function phoneDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

function phoneMask(value: string): string {
  const digits = phoneDigits(value);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function clientKey(client: Clienta): string {
  const digits = phoneDigits(client.telefono);
  return digits || `nombre:${client.nombre}`;
}

function todayIso(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function monthCells(key: string, days: Day[]) {
  const [year, month] = key.split("-").map(Number);
  const pad = new Date(year, month - 1, 1).getDay();
  const count = new Date(year, month, 0).getDate();
  const byIso = new Map(days.map((day) => [day.fecha, day]));
  const cells: ({ n: number; day?: Day } | null)[] = Array.from({ length: pad }, () => null);
  for (let n = 1; n <= count; n += 1) {
    const iso = `${key}-${String(n).padStart(2, "0")}`;
    cells.push({ n, day: byIso.get(iso) });
  }
  return cells;
}

export default function AdminApp() {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState("");
  const [admin, setAdmin] = useState<AdminData | null>(null);
  const [error, setError] = useState("");
  const [screen, setScreen] = useState<Screen>("agenda");
  const [agendaTab, setAgendaTab] = useState<AgendaTab>("nuevas");
  const [entradasTab, setEntradasTab] = useState<EntradasTab>("nuevas");
  const [preciosTab, setPreciosTab] = useState<PreciosTab>("precios");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState("");
  const [citaHora, setCitaHora] = useState("");
  const [busy, setBusy] = useState(false);
  const [month, setMonth] = useState("");

  async function loadAdmin(next: string) {
    setAdmin(await api<AdminData>("/api/v1/admin/panel.php", undefined, next));
  }

  useEffect(() => {
    const saved = sessionStorage.getItem(TOKEN_KEY) || "";
    if (!saved) {
      setReady(true);
      return;
    }
    setToken(saved);
    loadAdmin(saved)
      .catch(() => {
        sessionStorage.removeItem(TOKEN_KEY);
        setToken("");
      })
      .finally(() => setReady(true));
  }, []);

  async function submitPin(pin: string) {
    setError("");
    try {
      const result = await api<{ token: string }>("/api/v1/auth/login.php", { password: pin });
      sessionStorage.setItem(TOKEN_KEY, result.token);
      setToken(result.token);
      await loadAdmin(result.token);
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "PIN incorrecto.");
      return false;
    }
  }

  async function act(path: string, body: unknown) {
    setError("");
    try {
      const next = await api<AdminData>(path, body, token);
      setAdmin(next);
      return next;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Error");
      return null;
    }
  }

  const months = useMemo(() => {
    const keys: string[] = [];
    admin?.dias.forEach((day) => {
      const key = day.fecha.slice(0, 7);
      if (!keys.includes(key)) keys.push(key);
    });
    return keys;
  }, [admin]);
  const monthKey = month || months[0] || "";
  const monthIndex = Math.max(0, months.indexOf(monthKey));
  const focusDay = admin?.dias.find((day) => day.fecha === focus);
  const monthName = monthKey
    ? new Date(`${monthKey}-01T12:00:00`).toLocaleDateString("es-MX", { month: "long", year: "numeric" })
    : "";
  const monthLabel = monthName ? monthName.charAt(0).toUpperCase() + monthName.slice(1) : "";

  function tapDay(fecha: string) {
    if (focus !== fecha) {
      setFocus(fecha);
      setCitaHora("");
      return;
    }
    setPicked((current) => (current.includes(fecha) ? current.filter((day) => day !== fecha) : [...current, fecha]));
  }

  async function blockMarked() {
    if (!admin) return;
    const targets = picked.filter((fecha) => admin.dias.find((day) => day.fecha === fecha)?.libre);
    if (!targets.length) {
      setError("Esos días ya están bloqueados.");
      return;
    }
    setBusy(true);
    try {
      for (const fecha of targets) {
        const next = await act("/api/v1/admin/horario.php", { accion: "libre", fecha });
        if (!next) return;
      }
      setPicked([]);
    } finally {
      setBusy(false);
    }
  }

  function openScreen(next: Screen) {
    if (next === screen) return;
    setError("");
    setAgendaTab("nuevas");
    setEntradasTab("nuevas");
    setPreciosTab("precios");
    setScreen(next);
  }

  const current = screens.find((item) => item.id === screen) ?? screens[0];

  if (!ready) return <p className="note wrap">Cargando…</p>;
  if (!token) {
    return (
      <PinGate
        title="Ingresar al panel de control"
        backLabel="Salir"
        eraseLabel="Borrar"
        error={error}
        onBack={() => { window.location.assign("/"); }}
        onSubmit={submitPin}
      />
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-top">
        <button className="admin-exit" type="button" onClick={() => { window.location.assign("/"); }}>Salir</button>
        <h1>Panel de administración</h1>
      </header>
      <div className="admin-shell">
        <nav className="admin-nav" aria-label="Secciones">
          {screens.map((item) => {
            const Icon = item.icon;
            const on = item.id === screen;
            return (
              <button
                key={item.id}
                type="button"
                className={on ? "on" : undefined}
                aria-current={on ? "page" : undefined}
                onClick={() => openScreen(item.id)}
              >
                <span className="nav-ball"><Icon width={22} height={22} strokeWidth={1.5} /></span>
                <span className="nav-word">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <section key={screen} className="admin-screen" aria-labelledby="panel-title">
          <header className="panel-head">
            <h1 id="panel-title">{current.title}</h1>
            {screen === "agenda" ? (
              <div className="agenda-tabs" role="tablist">
                {([
                  ["nuevas", "Nuevas"],
                  ["confirmadas", "Confirmadas"],
                  ["canceladas", "Canceladas"],
                ] as const).map(([id, label]) => (
                  <button key={id} type="button" role="tab" aria-selected={agendaTab === id} className={agendaTab === id ? "on" : undefined} onClick={() => setAgendaTab(id)}>
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
            {screen === "entradas" ? (
              <div className="agenda-tabs" role="tablist">
                {([
                  ["nuevas", "Nuevas"],
                  ["archivadas", "Archivadas"],
                  ["reportes", "Reportes"],
                ] as const).map(([id, label]) => (
                  <button key={id} type="button" role="tab" aria-selected={entradasTab === id} className={entradasTab === id ? "on" : undefined} onClick={() => setEntradasTab(id)}>
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
            {screen === "precios" ? (
              <div className="agenda-tabs" role="tablist">
                {([
                  ["precios", "Precios"],
                  ["gastos", "Gastos"],
                  ["reportes", "Reportes"],
                ] as const).map(([id, label]) => (
                  <button key={id} type="button" role="tab" aria-selected={preciosTab === id} className={preciosTab === id ? "on" : undefined} onClick={() => setPreciosTab(id)}>
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
          </header>
          <div className="panel-body">
            {!admin ? <p className="note">Cargando…</p> : (
              <>
            {error ? <p className="error">{error}</p> : null}
            {screen === "agenda" ? (
              <Agenda
                citas={admin.agenda}
                dias={admin.dias}
                tab={agendaTab}
                onConfirm={(id) => {
                  const cita = admin.agenda.find((item) => item.id === id);
                  if (cita && window.matchMedia("(max-width: 639px)").matches) sms(cita.telefono, confirmText(cita));
                  void act("/api/v1/admin/cita.php", { accion: "confirmar", id });
                }}
                onCancel={(id) => { void act("/api/v1/admin/cita.php", { accion: "cancelar", id }); }}
                onMove={(id, fecha, hora) => act("/api/v1/admin/cita.php", { accion: "reprogramar", id, fecha, hora })}
              />
            ) : null}
            {screen === "horario" ? (
              <div className="horario">
                <div className="horario-cal">
                <p className="lead">Toca un día para ver si cada hora está abierta o cerrada. Tócalo otra vez para marcarlo y bloquearlo junto con otros.</p>
                <div className="cal-head">
                  <button className="btn secondary" type="button" aria-label="Mes anterior" disabled={monthIndex <= 0} onClick={() => setMonth(months[monthIndex - 1] ?? monthKey)}>
                    <ChevronLeftIcon width={18} height={18} strokeWidth={1.5} />
                  </button>
                  <strong>{monthLabel}</strong>
                  <button className="btn secondary" type="button" aria-label="Mes siguiente" disabled={monthIndex >= months.length - 1} onClick={() => setMonth(months[monthIndex + 1] ?? monthKey)}>
                    <ChevronRightIcon width={18} height={18} strokeWidth={1.5} />
                  </button>
                </div>
                <div className="cal-grid">
                  {WEEK.map((label) => <span key={label} className="cal-dow">{label}</span>)}
                  {monthKey ? monthCells(monthKey, admin.dias).map((cell, index) => {
                    if (!cell) return <span key={`pad-${index}`} />;
                    const fecha = cell.day?.fecha ?? "";
                    return (
                      <button
                        key={fecha || `${monthKey}-${cell.n}`}
                        className={`cal-cell${cell.day && !cell.day.libre ? " off" : ""}${fecha === focus ? " focus" : ""}`}
                        type="button"
                        disabled={!cell.day}
                        aria-pressed={fecha !== "" && picked.includes(fecha)}
                        onClick={() => { if (fecha) tapDay(fecha); }}
                      >
                        {cell.n}
                      </button>
                    );
                  }) : null}
                </div>
                <div className="panel-actions">
                  <button className="btn" type="button" disabled={!picked.length || busy} onClick={() => void blockMarked()}>
                    {busy ? "Bloqueando…" : "Bloquear días marcados"}
                  </button>
                  {focusDay && !focusDay.libre ? (
                    <button className="btn secondary" type="button" onClick={() => void act("/api/v1/admin/horario.php", { accion: "libre", fecha: focusDay.fecha })}>
                      Abrir este día
                    </button>
                  ) : null}
                </div>
                </div>
                <div className="horario-hours">
                {focusDay ? (
                  <>
                    <p className="lead">{labelDate(focusDay.fecha)}. Toca una hora para abrirla o cerrarla.</p>
                    <div className="hour-grid">
                      {focusDay.horas.map((hour) => {
                        const booked = admin.agenda.find((cita) => cita.fecha === focusDay.fecha && cita.hora === hour.hora && !cita.terminada && !cita.cancelada);
                        return (
                          <button
                            key={hour.hora}
                            className={`hour-cell${booked ? " booked" : ""}`}
                            type="button"
                            aria-pressed={booked ? undefined : hour.abierta}
                            aria-expanded={booked ? citaHora === hour.hora : undefined}
                            onClick={() => {
                              if (booked) {
                                setCitaHora((current) => current === hour.hora ? "" : hour.hora);
                                return;
                              }
                              void act("/api/v1/admin/horario.php", { accion: "hora", fecha: focusDay.fecha, hora: hour.hora });
                            }}
                          >
                            <span>{hourFace(hour.hora)}</span>
                            <span className="hour-state">
                              {booked ? "Con cita" : hour.abierta ? <><CheckIcon width={14} height={14} strokeWidth={2.6} />Abierta</> : "Cerrada"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {(() => {
                      const peek = admin.agenda.find((cita) => cita.fecha === focusDay.fecha && cita.hora === citaHora && !cita.terminada && !cita.cancelada);
                      if (!peek) return null;
                      return (
                        <div className="cita-pop" role="dialog" aria-modal="true" aria-label="Cita programada" onClick={(event) => { if (event.target === event.currentTarget) setCitaHora(""); }}>
                          <article>
                            <strong>{peek.nombre}</strong>
                            <p>{hourFace(peek.hora)} · {peek.servicio}</p>
                            <button className="btn cita-close" type="button" onClick={() => setCitaHora("")}>Cerrar</button>
                          </article>
                        </div>
                      );
                    })()}
                  </>
                ) : <p className="note">Elige un día para ver sus horas.</p>}
                </div>
              </div>
            ) : null}
            {screen === "entradas" ? (
              <Entradas
                citas={admin.agenda}
                tab={entradasTab}
                onArchive={(id, monto) => act("/api/v1/admin/cita.php", { accion: "terminar", id, monto })}
              />
            ) : null}
            {screen === "clientes" ? (
              <Clientes
                clientas={admin.clientas}
                onSave={(body) => act("/api/v1/admin/cliente.php", body)}
                onDelete={(body) => act("/api/v1/admin/cliente.php", { accion: "borrar", ...body })}
              />
            ) : null}
            {screen === "precios" ? (
              <Precios
                tab={preciosTab}
                precios={admin.precios}
                gastos={admin.gastos}
                onPrice={(nombre, precio) => act("/api/v1/admin/precio.php", { nombre, precio })}
                onAdd={(nombre, monto, fecha) => act("/api/v1/admin/gasto.php", { nombre, monto, fecha })}
                onDelete={(id) => act("/api/v1/admin/gasto.php", { accion: "borrar", id })}
              />
            ) : null}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

type AgendaTab = "nuevas" | "confirmadas" | "canceladas";
type EntradasTab = "nuevas" | "archivadas" | "reportes";
type PreciosTab = "precios" | "gastos" | "reportes";
type Gasto = { id: number; nombre: string; monto: number; fecha: string };
const FIRST_REPORT_YEAR = 2026;
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function recentFirst(a: Cita, b: Cita): number {
  return b.fecha.localeCompare(a.fecha) || b.hora.localeCompare(a.hora) || b.id - a.id;
}

function Clientes({
  clientas,
  onSave,
  onDelete,
}: {
  clientas: Clienta[];
  onSave: (body: { telefono: string; nombre: string; nuevoNombre: string; nuevoTelefono: string }) => Promise<AdminData | null>;
  onDelete: (body: { telefono: string; nombre: string }) => Promise<AdminData | null>;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [removing, setRemoving] = useState<Clienta | null>(null);
  const rows = [...clientas].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  function startEdit(client: Clienta) {
    setEditing(clientKey(client));
    setNombre(client.nombre);
    setTelefono(phoneMask(client.telefono));
  }

  if (rows.length === 0) return <p className="note">Todavía no hay clientes. Aparecen cuando alguien reserva.</p>;

  return (
    <div className="client-list">
      {rows.map((client) => {
        const key = clientKey(client);
        const open = editing === key;
        return (
          <article key={key} className="client-row">
            <div className="client-info">
              {open ? (
                <>
                  <input aria-label="Nombre" value={nombre} onChange={(event) => setNombre(event.target.value)} />
                  <input aria-label="Teléfono" inputMode="tel" value={telefono} onChange={(event) => setTelefono(phoneMask(event.target.value))} />
                </>
              ) : (
                <>
                  <strong>{client.nombre}</strong>
                  <p>{phoneMask(client.telefono)}</p>
                </>
              )}
            </div>
            <div className="client-actions">
              {open ? (
                <button
                  className="client-icon save"
                  type="button"
                  aria-label="Guardar"
                  onClick={() => {
                    void onSave({
                      telefono: phoneDigits(client.telefono),
                      nombre: client.nombre,
                      nuevoNombre: nombre.trim(),
                      nuevoTelefono: phoneDigits(telefono),
                    }).then((next) => { if (next) setEditing(null); });
                  }}
                >
                  <CheckIcon width={18} height={18} strokeWidth={2.4} />
                </button>
              ) : (
                <button className="client-icon" type="button" aria-label="Editar" onClick={() => startEdit(client)}>
                  <PencilSquareIcon width={18} height={18} strokeWidth={1.8} />
                </button>
              )}
              <button className="client-icon" type="button" aria-label="Eliminar" onClick={() => setRemoving(client)}>
                <TrashIcon width={18} height={18} strokeWidth={1.8} />
              </button>
            </div>
          </article>
        );
      })}
      {removing ? (
        <div className="move-pop" role="dialog" aria-modal="true" aria-label="Eliminar cliente" onClick={(event) => { if (event.target === event.currentTarget) setRemoving(null); }}>
          <div className="move-box">
            <p>¿Eliminar a {removing.nombre}?</p>
            <span className="strip-actions">
              <button
                className="btn"
                type="button"
                onClick={() => {
                  const target = removing;
                  void onDelete({ telefono: phoneDigits(target.telefono), nombre: target.nombre }).then((next) => {
                    if (!next) return;
                    setRemoving(null);
                    setEditing(null);
                  });
                }}
              >
                Eliminar
              </button>
              <button className="btn secondary" type="button" onClick={() => setRemoving(null)}>Cancelar</button>
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Entradas({
  citas,
  tab,
  onArchive,
}: {
  citas: Cita[];
  tab: EntradasTab;
  onArchive: (id: number, monto: number) => Promise<AdminData | null>;
}) {
  if (tab === "reportes") return <Reportes citas={citas} />;
  const rows = citas
    .filter((cita) => (tab === "archivadas" ? cita.terminada : cita.confirmada && !cita.cancelada && !cita.terminada))
    .sort(recentFirst);
  if (rows.length === 0) {
    return <p className="note">{tab === "nuevas" ? "No hay citas confirmadas." : "No hay entradas archivadas."}</p>;
  }
  return (
    <div className="stack">
      {rows.map((cita) => (tab === "archivadas" ? (
        <article key={cita.id} className="entrada-row">
          <div>
            <strong>{cita.nombre}</strong>
            <p>{labelDate(cita.fecha)} · {hourFace(cita.hora)} · {cita.servicio}</p>
          </div>
          <p className="entrada-paid">
            <strong>{money(cita.monto ?? 0)}</strong>
            <CheckIcon className="entrada-check on" width={22} height={22} strokeWidth={2.4} />
          </p>
        </article>
      ) : (
        <NuevaEntrada key={cita.id} cita={cita} onArchive={onArchive} />
      )))}
    </div>
  );
}

function Reportes({ citas }: { citas: Cita[] }) {
  const items = citas.filter((cita) => cita.terminada).map((cita) => ({ fecha: cita.fecha, monto: cita.monto || 0 }));
  return (
    <PeriodoReporte
      items={items}
      totalLabel="Total de ingresos"
      emptyLabel="Sin citas archivadas"
      oneLabel="1 cita"
      manyLabel={(count) => `${count} citas`}
    />
  );
}

function PeriodoReporte({
  items,
  totalLabel,
  emptyLabel,
  oneLabel,
  manyLabel,
}: {
  items: { fecha: string; monto: number }[];
  totalLabel: string;
  emptyLabel: string;
  oneLabel: string;
  manyLabel: (count: number) => string;
}) {
  const now = new Date();
  const counted = items.filter((item) => Number(item.fecha.slice(0, 4)) >= FIRST_REPORT_YEAR);
  let lastYear = Math.max(FIRST_REPORT_YEAR, now.getFullYear());
  for (const item of counted) lastYear = Math.max(lastYear, Number(item.fecha.slice(0, 4)));
  const years = Array.from({ length: lastYear - FIRST_REPORT_YEAR + 1 }, (_, index) => FIRST_REPORT_YEAR + index);
  const [mode, setMode] = useState<"año" | "mes" | "día">("año");
  const [year, setYear] = useState(Math.max(FIRST_REPORT_YEAR, now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [day, setDay] = useState(() => {
    const iso = todayIso();
    return iso < `${FIRST_REPORT_YEAR}-01-01` ? `${FIRST_REPORT_YEAR}-01-01` : iso;
  });
  const matched = counted.filter((item) => {
    if (mode === "año") return item.fecha.startsWith(`${year}-`);
    if (mode === "mes") return item.fecha.startsWith(`${year}-${month}`);
    return item.fecha === day;
  });
  const total = matched.reduce((sum, item) => sum + item.monto, 0);
  const period = mode === "año" ? String(year) : mode === "mes" ? `${MONTHS[Number(month) - 1]} de ${year}` : labelDate(day);
  const count = matched.length === 1 ? oneLabel : manyLabel(matched.length);
  return (
    <div className="stack report">
      <div className="report-modes" role="tablist" aria-label="Periodo">
        {([
          ["año", "Por año"],
          ["mes", "Por mes"],
          ["día", "Por día"],
        ] as const).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={mode === id} className={mode === id ? "on" : undefined} onClick={() => setMode(id)}>
            {label}
          </button>
        ))}
      </div>
      <div className="report-pick">
        {mode === "día" ? (
          <label>Día
            <input
              type="date"
              min={`${FIRST_REPORT_YEAR}-01-01`}
              value={day}
              onChange={(event) => {
                const next = event.target.value;
                setDay(!next || next < `${FIRST_REPORT_YEAR}-01-01` ? `${FIRST_REPORT_YEAR}-01-01` : next);
              }}
            />
          </label>
        ) : (
          <label>Año
            <select value={year} onChange={(event) => setYear(Number(event.target.value))}>
              {years.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        )}
        {mode === "mes" ? (
          <label>Mes
            <select value={month} onChange={(event) => setMonth(event.target.value)}>
              {MONTHS.map((name, index) => <option key={name} value={String(index + 1).padStart(2, "0")}>{name}</option>)}
            </select>
          </label>
        ) : null}
      </div>
      <p className="report-total">
        <span>{totalLabel}</span>
        <strong>{money(total)}</strong>
        <em>{period} · {matched.length === 0 ? emptyLabel : count}</em>
      </p>
    </div>
  );
}

function Precios({
  tab,
  precios,
  gastos,
  onPrice,
  onAdd,
  onDelete,
}: {
  tab: PreciosTab;
  precios: { nombre: string; precio: number }[];
  gastos: Gasto[];
  onPrice: (nombre: string, precio: number) => Promise<AdminData | null>;
  onAdd: (nombre: string, monto: number, fecha: string) => Promise<AdminData | null>;
  onDelete: (id: number) => Promise<AdminData | null>;
}) {
  const [vista, setVista] = useState<"historial" | "consolidado">("historial");
  const rows = [...gastos].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id);
  if (tab === "precios") {
    return (
      <div className="stack">
        <h2>Precio de cada servicio</h2>
        <div className="price-grid">
          {precios.map((item) => (
            <label key={item.nombre}>{item.nombre}
              <input
                type="number"
                min="0"
                step="0.01"
                defaultValue={item.precio}
                onBlur={(event) => void onPrice(item.nombre, Number(event.target.value))}
              />
            </label>
          ))}
        </div>
      </div>
    );
  }
  if (tab === "gastos") {
    return (
      <div className="stack">
        <h2>Gastos de materiales</h2>
        <form className="stack gasto-form" onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const nombre = String(form.get("nombre") ?? "").replace(/\s+/g, " ").trim();
          void onAdd(nombre, Number(form.get("monto")), String(form.get("fecha") ?? ""));
          event.currentTarget.reset();
        }}>
          <label>Material<textarea name="nombre" required rows={2} /></label>
          <label>Monto<input name="monto" type="number" min="0" step="0.01" required /></label>
          <label>Fecha<input name="fecha" type="date" required defaultValue={todayIso()} /></label>
          <button className="btn" type="submit">Agregar gasto</button>
        </form>
      </div>
    );
  }
  return (
    <div className="stack">
      <div className="report-modes" role="tablist" aria-label="Reportes de gastos">
        {([
          ["historial", "Historial"],
          ["consolidado", "Consolidado"],
        ] as const).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={vista === id} className={vista === id ? "on" : undefined} onClick={() => setVista(id)}>
            {label}
          </button>
        ))}
      </div>
      {vista === "historial" ? (
        rows.length === 0 ? <p className="note">Todavía no hay gastos.</p> : (
          <div className="gasto-list">
            {rows.map((item) => (
              <article key={item.id} className="gasto-row">
                <div className="gasto-main">
                  <strong>{item.nombre}</strong>
                  <p>{labelDate(item.fecha)}</p>
                </div>
                <div className="gasto-side">
                  <b>{money(item.monto)}</b>
                  <button className="btn ghost" type="button" onClick={() => void onDelete(item.id)}>Borrar</button>
                </div>
              </article>
            ))}
          </div>
        )
      ) : (
        <PeriodoReporte
          items={gastos.map((item) => ({ fecha: item.fecha, monto: item.monto }))}
          totalLabel="Total de gastos"
          emptyLabel="Sin gastos"
          oneLabel="1 gasto"
          manyLabel={(count) => `${count} gastos`}
        />
      )}
    </div>
  );
}

function NuevaEntrada({
  cita,
  onArchive,
}: {
  cita: Cita;
  onArchive: (id: number, monto: number) => Promise<AdminData | null>;
}) {
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const amount = raw.trim() === "" ? null : Number(raw);
  const ready = amount !== null && Number.isFinite(amount) && amount >= 0;
  return (
    <article className="entrada-row">
      <div>
        <strong>{cita.nombre}</strong>
        <p>{labelDate(cita.fecha)} · {hourFace(cita.hora)} · {cita.servicio}</p>
      </div>
      <div className="entrada-pay">
        <label className="entrada-amount">
          <span className="sr-only">Cobrado</span>
          <span aria-hidden="true">$</span>
          <input
            inputMode="decimal"
            value={raw}
            onChange={(event) => setRaw(moneyInput(event.target.value))}
          />
        </label>
        <CheckIcon className={ready ? "entrada-check on" : "entrada-check"} width={22} height={22} strokeWidth={2.4} />
        <button
          className="btn entrada-save"
          type="button"
          disabled={!ready || busy}
          onClick={() => {
            if (!ready || amount === null) return;
            setBusy(true);
            void onArchive(cita.id, amount).finally(() => setBusy(false));
          }}
        >
          Guardar y archivar
        </button>
      </div>
    </article>
  );
}

function agendaTab(cita: Cita): AgendaTab | null {
  if (cita.terminada) return null;
  if (cita.cancelada) return "canceladas";
  if (cita.confirmada) return "confirmadas";
  return "nuevas";
}

function Agenda({
  citas,
  dias,
  tab,
  onConfirm,
  onCancel,
  onMove,
}: {
  citas: Cita[];
  dias: Day[];
  tab: AgendaTab;
  onConfirm: (id: number) => void;
  onCancel: (id: number) => void;
  onMove: (id: number, fecha: string, hora: string) => Promise<AdminData | null>;
}) {
  const [moveId, setMoveId] = useState<number | null>(null);
  useEffect(() => { setMoveId(null); }, [tab]);
  const [moveFecha, setMoveFecha] = useState("");
  const [moveHora, setMoveHora] = useState("");
  const [moveMonth, setMoveMonth] = useState("");
  const [movePane, setMovePane] = useState<"dia" | "hora" | "listo">("dia");
  const visible = citas.filter((cita) => agendaTab(cita) === tab);
  if (tab === "confirmadas") visible.sort((a, b) => b.id - a.id);
  const moving = citas.find((cita) => cita.id === moveId && agendaTab(cita) === "confirmadas") ?? null;
  const months = useMemo(() => {
    const keys: string[] = [];
    dias.forEach((day) => {
      const key = day.fecha.slice(0, 7);
      if (!keys.includes(key)) keys.push(key);
    });
    return keys;
  }, [dias]);
  const monthKey = moveMonth || moving?.fecha.slice(0, 7) || months[0] || "";
  const monthIndex = Math.max(0, months.indexOf(monthKey));
  const monthName = monthKey
    ? new Date(`${monthKey}-01T12:00:00`).toLocaleDateString("es-MX", { month: "long", year: "numeric" })
    : "";
  const monthLabel = monthName ? monthName.charAt(0).toUpperCase() + monthName.slice(1) : "";
  const selectedDay = dias.find((day) => day.fecha === moveFecha);

  function openMove(cita: Cita) {
    setMoveId(cita.id);
    const inRange = dias.some((day) => day.fecha === cita.fecha);
    setMoveFecha(inRange ? cita.fecha : "");
    setMoveHora(inRange ? cita.hora : "");
    setMoveMonth(inRange ? cita.fecha.slice(0, 7) : (dias[0]?.fecha.slice(0, 7) ?? ""));
    setMovePane("dia");
  }

  function hourOpen(day: Day | undefined, hour: string) {
    if (!moving || !day?.libre) return false;
    const slot = day.horas.find((item) => item.hora === hour);
    if (!slot?.abierta) return false;
    if (day.fecha === moving.fecha && hour === moving.hora) return true;
    return !slot.ocupada;
  }

  const status = tab === "nuevas" ? "Nueva" : tab === "confirmadas" ? "Confirmada" : "Cancelada";
  const empty = tab === "nuevas" ? "No hay citas nuevas." : tab === "confirmadas" ? "No hay citas confirmadas." : "No hay citas canceladas.";

  function actions(cita: Cita) {
    if (tab === "nuevas") {
      return (
        <span className="strip-actions">
          <button className="btn" type="button" onClick={() => onConfirm(cita.id)}>Confirmar cita</button>
          <button className="btn secondary" type="button" onClick={() => onCancel(cita.id)}>Cancelar</button>
        </span>
      );
    }
    if (tab === "confirmadas") {
      return (
        <span className="strip-actions">
          <button className="btn" type="button" onClick={() => openMove(cita)}>Reprogramar</button>
          <button className="btn secondary" type="button" onClick={() => onCancel(cita.id)}>Cancelar</button>
        </span>
      );
    }
    return null;
  }

  return (
    <div className="agenda-board">
      {visible.length === 0 ? <p className="note">{empty}</p> : (
        <>
          <div className="agenda-cards">
            {visible.map((cita) => (
              <article key={cita.id} className="agenda-strip">
                <strong>{cita.nombre}</strong>
                <p>{labelDate(cita.fecha)} · {hourFace(cita.hora)}</p>
                <p>{cita.servicio}</p>
                <p className="strip-status">{status}</p>
                {actions(cita)}
              </article>
            ))}
          </div>
          <table className="agenda-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Fecha</th>
                <th>Servicio</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visible.map((cita) => (
                <tr key={cita.id}>
                  <td>{cita.nombre}</td>
                  <td>{labelDate(cita.fecha)} · {hourFace(cita.hora)}</td>
                  <td>{cita.servicio}</td>
                  <td>{status}</td>
                  <td>{actions(cita)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      {moving ? (
        <div className="move-pop" role="dialog" aria-modal="true" aria-label="Reprogramar cita" onClick={(event) => { if (event.target === event.currentTarget) setMoveId(null); }}>
        <div className="move-box">
          <p>Nueva fecha para {moving.nombre}</p>
          {moveFecha && movePane !== "dia" ? (
            <button className="move-summary" type="button" onClick={() => setMovePane("dia")}>
              <span>{new Date(`${moveFecha}T12:00:00`).toLocaleDateString("es-MX", { day: "numeric", month: "long" })}</span>
              <span>Cambiar</span>
            </button>
          ) : null}
          <div className={movePane === "dia" ? "move-cal" : "move-cal is-shut"}>
          <div className="cal-head">
            <button className="btn secondary" type="button" aria-label="Mes anterior" disabled={monthIndex <= 0} onClick={() => setMoveMonth(months[monthIndex - 1] ?? monthKey)}>
              <ChevronLeftIcon width={18} height={18} strokeWidth={1.5} />
            </button>
            <strong>{monthLabel}</strong>
            <button className="btn secondary" type="button" aria-label="Mes siguiente" disabled={monthIndex >= months.length - 1} onClick={() => setMoveMonth(months[monthIndex + 1] ?? monthKey)}>
              <ChevronRightIcon width={18} height={18} strokeWidth={1.5} />
            </button>
          </div>
          <div className="cal-grid">
            {WEEK.map((label) => <span key={label} className="cal-dow">{label}</span>)}
            {monthCells(monthKey, dias).map((cell, index) => {
              if (!cell) return <span key={`pad-${index}`} />;
              const open = cell.day?.horas.some((hour) => hourOpen(cell.day, hour.hora)) ?? false;
              return (
                <button
                  key={cell.day?.fecha ?? `${monthKey}-${cell.n}`}
                  className="cal-cell"
                  type="button"
                  disabled={!open}
                  aria-pressed={cell.day?.fecha === moveFecha}
                  onClick={() => {
                    if (!cell.day) return;
                    setMoveFecha(cell.day.fecha);
                    setMoveHora("");
                    setMovePane("hora");
                  }}
                >
                  {cell.n}
                </button>
              );
            })}
          </div>
          </div>
          {movePane === "listo" && moveHora ? (
            <button className="move-summary" type="button" onClick={() => setMovePane("hora")}>
              <span>{hourFace(moveHora)}</span>
              <span>Cambiar</span>
            </button>
          ) : null}
          <div className={movePane === "hora" && moveFecha ? "move-hours" : "move-hours is-shut"}>
          <div className="hour-grid">
            {(selectedDay?.horas ?? []).map((hour) => (
              <button
                key={hour.hora}
                className="hour-cell"
                type="button"
                disabled={!hourOpen(selectedDay, hour.hora)}
                aria-pressed={moveHora === hour.hora}
                onClick={() => { setMoveHora(hour.hora); setMovePane("listo"); }}
              >
                {hourFace(hour.hora)}
              </button>
            ))}
          </div>
          </div>
          <span className="strip-actions">
            <button
              className="btn"
              type="button"
              disabled={!moveFecha || !moveHora}
              onClick={() => {
                void onMove(moving.id, moveFecha, moveHora).then((next) => { if (next) setMoveId(null); });
              }}
            >
              Guardar horario
            </button>
            <button className="btn secondary" type="button" onClick={() => setMoveId(null)}>Cerrar</button>
          </span>
        </div>
        </div>
      ) : null}
    </div>
  );
}

function PinGate({
  title,
  backLabel,
  eraseLabel,
  error,
  onBack,
  onSubmit,
}: {
  title: string;
  backLabel: string;
  eraseLabel: string;
  error: string;
  onBack: () => void;
  onSubmit: (pin: string) => Promise<boolean>;
}) {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);
  const lock = useRef(false);

  async function finish(next: string) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    const ok = await onSubmit(next);
    setBusy(false);
    lock.current = false;
    if (!ok) {
      setShake(true);
      setPin("");
      window.setTimeout(() => setShake(false), 420);
    }
  }

  function typeDigit(digit: string) {
    if (busy || lock.current || pin.length >= 4) return;
    const next = `${pin}${digit}`;
    setPin(next);
    if (next.length === 4) void finish(next);
  }

  function erase() {
    if (busy || lock.current) return;
    setPin((current) => current.slice(0, -1));
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (/^[0-9]$/.test(event.key)) {
        event.preventDefault();
        typeDigit(event.key);
      } else if (event.key === "Backspace") {
        event.preventDefault();
        erase();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

  return (
    <div className="pin-screen">
      <p className="by">nails by</p>
      <h1>Yohani</h1>
      <p className="pin-sub">{title}</p>
      <p className={`pin-dots${shake ? " shake" : ""}`} aria-label={`${pin.length} / 4`}>
        {[0, 1, 2, 3].map((index) => <span key={index} className={index < pin.length ? "on" : ""} />)}
      </p>
      <p className="error">{error || "\u00a0"}</p>
      <div className="pin-pad">
        {keys.map((key) => {
          if (key === "") return <span key="gap" />;
          if (key === "del") {
            return (
              <button key="del" className="pin-key ghost" type="button" onClick={erase} aria-label={eraseLabel}>
                <BackspaceIcon width={22} height={22} strokeWidth={1.5} />
              </button>
            );
          }
          return (
            <button key={key} className="pin-key" type="button" onClick={() => typeDigit(key)}>{key}</button>
          );
        })}
      </div>
      <button className="btn ghost pin-back" type="button" onClick={onBack}>{backLabel}</button>
    </div>
  );
}
