import { useEffect, useState, type FormEvent } from "react";
import { api, money, todayISO } from "../../lib/api";

type Lang = "es" | "en";
type Client = {
  id: number; nombre: string; telefono: string; correo: string; direccion: string; lat: number; lng: number;
  servicio: string; precio: number; frecuencia: string; dia: number; notas: string; activo: boolean;
};
type Item = { desc: string; qty: number; precio: number };
type Estimate = { id: number; numero: string; clienteId: number | null; nombre: string; telefono: string; direccion: string; nota: string; estado: string; firmo: string; partidas: Item[] };
type Invoice = { id: number; numero: string; estado: string; emitido: string; total: number; pago: string; nombre: string; origen: string; partidas: Item[]; costos: { materiales: number; manoObra: number; basurero: number; otros: number } };
type Crew = { id: number; nombre: string; notas: string };
type Employee = { id: number; nombre: string; telefono: string; correo: string; direccion: string; puesto: string; notas: string; pagoHora: number; codigo: string; cuadrillas: number[] };
type Expense = { id: number; fecha: string; categoria: string; descripcion: string; monto: number };
type Summary = { cobrado: number; mantenimiento: number; trabajos: number; porCobrar: number; clientes: number; recurrente: number; promedio: number; meta: number; faltan: number };

const labels = {
  es: { dash: "Resumen", people: "Clientes", estimates: "Estimados", crew: "Cuadrilla y Empleados", money: "Finanzas", payroll: "Nómina", goal: "Meta mensual", add: "Agregar cliente", save: "Guardar", off: "Inactivo", on: "Activar", remove: "Quitar", password: "Contraseña", newEstimate: "Enviar para firma", done: "Trabajo terminado", invoice: "Crear invoice", collect: "Cobrar", expense: "Agregar gasto", week: "Semana del" },
  en: { dash: "Summary", people: "Clients", estimates: "Estimates", crew: "Crew and employees", money: "Finances", payroll: "Payroll", goal: "Monthly goal", add: "Add client", save: "Save", off: "Inactive", on: "Activate", remove: "Remove", password: "Password", newEstimate: "Send to sign", done: "Job finished", invoice: "Create invoice", collect: "Collect", expense: "Add expense", week: "Week of" },
};

export default function OfficeView({ lang, token }: { lang: Lang; token: string }) {
  const t = labels[lang];
  const [tab, setTab] = useState<"dash" | "people" | "estimates" | "crew" | "money" | "payroll">("dash");
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [punches, setPunches] = useState<{ nombre: string; entrada: string; salida: string | null }[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [hours, setHours] = useState(0);
  const [payroll, setPayroll] = useState<{ semana: string; total: number; filas: { nombre: string; pagoHora: number; normal: number; extra: number; doble: number; pago: number }[] } | null>(null);
  const [letter, setLetter] = useState("");
  const [day, setDay] = useState("");
  const [lines, setLines] = useState<Item[]>([{ desc: "Corte de césped", qty: 1, precio: 65 }]);

  async function call<T>(path: string, body?: unknown): Promise<T> {
    return api<T>(path, body, token);
  }

  async function refresh() {
    setError("");
    if (tab === "dash") setSummary(await call<Summary>("/api/v1/oficina/resumen.php"));
    if (tab === "people") setClients((await call<{ clientes: Client[] }>("/api/v1/oficina/clientes.php")).clientes);
    if (tab === "estimates") {
      const data = await call<{ estimados: Estimate[]; invoices: Invoice[] }>("/api/v1/oficina/estimados.php");
      setEstimates(data.estimados);
      setInvoices(data.invoices);
      if (!clients.length) setClients((await call<{ clientes: Client[] }>("/api/v1/oficina/clientes.php")).clientes);
    }
    if (tab === "crew") {
      const data = await call<{ cuadrillas: Crew[]; empleados: Employee[]; fichajes: { nombre: string; entrada: string; salida: string | null }[] }>("/api/v1/oficina/cuadrilla.php");
      setCrews(data.cuadrillas);
      setEmployees(data.empleados);
      setPunches(data.fichajes);
    }
    if (tab === "money") {
      const data = await call<{ invoices: Invoice[]; gastos: Expense[]; horas: number }>("/api/v1/oficina/finanzas.php");
      setInvoices(data.invoices);
      setExpenses(data.gastos);
      setHours(data.horas);
    }
    if (tab === "payroll") setPayroll(await call<NonNullable<typeof payroll>>("/api/v1/oficina/nomina.php?semana=" + todayISO()));
  }

  useEffect(() => { refresh().catch((reason: Error) => setError(reason.message)); }, [tab]);

  function askPassword(): string {
    return window.prompt(t.password) || "";
  }

  const shown = clients.filter((client) => {
    if (day === "off") return !client.activo;
    if (!client.activo) return false;
    if (day !== "" && String(client.dia) !== day) return false;
    const initial = client.nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").charAt(0).toUpperCase();
    if (letter && initial !== letter) return false;
    return true;
  });

  const collected = invoices.filter((item) => item.estado === "pagado").reduce((sum, item) => sum + item.total, 0);
  const due = invoices.filter((item) => item.estado !== "pagado").reduce((sum, item) => sum + item.total, 0);
  const spent = expenses.reduce((sum, item) => sum + item.monto, 0);

  return (
    <div className="stack">
      <div className="tabs">
        {(["dash", "people", "estimates", "crew", "money", "payroll"] as const).map((item) => (
          <button key={item} className="tab" type="button" aria-pressed={tab === item} onClick={() => setTab(item)}>{t[item]}</button>
        ))}
      </div>
      {error ? <p className="error">{error}</p> : null}

      {tab === "dash" && summary ? (
        <section className="card stack">
          <div className="kpis">
            <article className="kpi"><span>Cobrado</span><strong>{money(summary.cobrado)}</strong></article>
            <article className="kpi"><span>Mantenimiento</span><strong>{money(summary.mantenimiento)}</strong></article>
            <article className="kpi"><span>Trabajos</span><strong>{summary.trabajos}</strong></article>
            <article className="kpi"><span>Por cobrar</span><strong>{money(summary.porCobrar)}</strong></article>
          </div>
          <p>Clientes {summary.clientes}. Recurrente {money(summary.recurrente)}. Promedio {money(summary.promedio)}.</p>
          <label>{t.goal}
            <input type="number" defaultValue={summary.meta} onBlur={(event) => call("/api/v1/oficina/resumen.php", { meta: Number(event.target.value) }).then(() => refresh())} />
          </label>
          <p>Para llegar a {money(summary.meta)} faltan unos {summary.faltan} clientes.</p>
          {[50, 75, 100, 150].map((mark) => (
            <div key={mark}><p>{mark} propiedades · {Math.min(summary.clientes, mark)} / {mark}</p><div className="bar"><span style={{ width: `${Math.min(100, (summary.clientes / mark) * 100)}%` }} /></div></div>
          ))}
        </section>
      ) : null}

      {tab === "people" ? (
        <section className="card stack">
          <h2>{t.people}</h2>
          <div className="row">
            <button className="chip" type="button" onClick={() => setLetter("")}>Todos</button>
            {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((item) => <button key={item} className="chip" type="button" onClick={() => setLetter(item)}>{item}</button>)}
          </div>
          <div className="row">
            <button className="tab" type="button" aria-pressed={day === ""} onClick={() => setDay("")}>Todas</button>
            {[0, 1, 2, 3, 4, 5, 6].map((item) => <button key={item} className="tab" type="button" aria-pressed={day === String(item)} onClick={() => setDay(String(item))}>{item}</button>)}
            <button className="tab" type="button" aria-pressed={day === "off"} onClick={() => setDay("off")}>{t.off}</button>
          </div>
          <button className="btn" type="button" onClick={() => setClients([{ id: 0, nombre: "", telefono: "", correo: "", direccion: "", lat: 37.33, lng: -121.88, servicio: "Corte de césped", precio: 65, frecuencia: "semanal", dia: 1, notas: "", activo: true }, ...clients])}>{t.add}</button>
          {shown.map((client) => (
            <form key={client.id + client.nombre} className="card stack" onSubmit={async (event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              await call("/api/v1/oficina/clientes.php", {
                accion: "guardar", id: client.id, password: askPassword(),
                nombre: form.get("nombre"), telefono: form.get("telefono"), correo: form.get("correo"), direccion: form.get("direccion"),
                lat: Number(form.get("lat")), lng: Number(form.get("lng")), servicio: form.get("servicio"), precio: Number(form.get("precio")),
                frecuencia: form.get("frecuencia"), dia: Number(form.get("dia")), notas: form.get("notas"),
              });
              await refresh();
            }}>
              <div className="row">
                <input name="nombre" defaultValue={client.nombre} required placeholder="Nombre" />
                <input name="telefono" defaultValue={client.telefono} placeholder="Teléfono" />
                <input name="correo" defaultValue={client.correo} placeholder="Correo" />
                <input name="direccion" defaultValue={client.direccion} placeholder="Dirección" />
                <input name="servicio" defaultValue={client.servicio} placeholder="Servicio" />
                <input name="precio" type="number" step="0.01" defaultValue={client.precio} />
                <select name="frecuencia" defaultValue={client.frecuencia}><option value="semanal">Cada semana</option><option value="quincenal">Cada dos semanas</option><option value="mensual">Cada mes</option></select>
                <input name="dia" type="number" min="0" max="6" defaultValue={client.dia} />
                <input name="lat" type="number" step="0.0001" defaultValue={client.lat} />
                <input name="lng" type="number" step="0.0001" defaultValue={client.lng} />
                <input name="notas" defaultValue={client.notas} placeholder="Notas" />
              </div>
              <div className="row">
                <button className="btn" type="submit">{t.save}</button>
                {client.id > 0 ? <button className="btn secondary" type="button" onClick={() => call("/api/v1/oficina/clientes.php", { accion: client.activo ? "inactivo" : "activar", id: client.id, password: askPassword() }).then(refresh)}>{client.activo ? t.off : t.on}</button> : null}
                {client.id > 0 ? <button className="btn ghost" type="button" onClick={() => call("/api/v1/oficina/clientes.php", { accion: "borrar", id: client.id, password: askPassword() }).then(refresh)}>{t.remove}</button> : null}
              </div>
            </form>
          ))}
        </section>
      ) : null}

      {tab === "estimates" ? (
        <section className="stack">
          <form className="card stack" onSubmit={async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const clientId = Number(form.get("clienteId"));
            const client = clients.find((item) => item.id === clientId);
            await call("/api/v1/oficina/estimados.php", {
              accion: "crear",
              clienteId: clientId || null,
              nombre: client?.nombre || form.get("nombre"),
              telefono: client?.telefono || form.get("telefono"),
              direccion: client?.direccion || form.get("direccion"),
              nota: form.get("nota"),
              partidas: lines,
            });
            await refresh();
          }}>
            <h2>{t.newEstimate}</h2>
            <select name="clienteId" defaultValue=""><option value="">Escribir uno nuevo</option>{clients.filter((item) => item.activo).map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select>
            <input name="nombre" placeholder="Nombre" />
            <input name="telefono" placeholder="Teléfono" />
            <input name="direccion" placeholder="Dirección" />
            <input name="nota" placeholder="Nota" />
            {lines.map((line, index) => (
              <div className="row" key={index}>
                <input value={line.desc} onChange={(event) => setLines(lines.map((item, i) => i === index ? { ...item, desc: event.target.value } : item))} />
                <input type="number" value={line.qty} onChange={(event) => setLines(lines.map((item, i) => i === index ? { ...item, qty: Number(event.target.value) } : item))} />
                <input type="number" value={line.precio} onChange={(event) => setLines(lines.map((item, i) => i === index ? { ...item, precio: Number(event.target.value) } : item))} />
              </div>
            ))}
            <button className="btn secondary" type="button" onClick={() => setLines([...lines, { desc: "", qty: 1, precio: 0 }])}>+</button>
            <button className="btn clay" type="submit">{t.newEstimate}</button>
          </form>
          {estimates.map((item) => (
            <article className="card" key={item.id}>
              <h3>{item.numero} · {item.estado}</h3>
              <p>{item.nombre} · {item.telefono}</p>
              <p>{item.partidas.map((line) => `${line.desc} ${money(line.qty * line.precio)}`).join(" · ")}</p>
              {item.firmo ? <p>{item.firmo}</p> : null}
              <div className="row">
                {item.estado === "firmado" ? <button className="btn" type="button" onClick={() => call("/api/v1/oficina/estimados.php", { accion: "terminar", id: item.id }).then(refresh)}>{t.done}</button> : null}
                {item.estado === "terminado" ? <button className="btn" type="button" onClick={() => call("/api/v1/oficina/estimados.php", { accion: "invoice", id: item.id }).then(refresh)}>{t.invoice}</button> : null}
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {tab === "crew" ? (
        <section className="stack">
          <form className="card row" onSubmit={async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            await call("/api/v1/oficina/cuadrilla.php", { accion: "cuadrilla", nombre: form.get("nombre"), notas: form.get("notas") });
            event.currentTarget.reset();
            await refresh();
          }}>
            <input name="nombre" placeholder="Cuadrilla" required />
            <input name="notas" placeholder="Nota" />
            <button className="btn" type="submit">{t.save}</button>
          </form>
          {crews.map((crew) => (
            <form key={crew.id} className="card row" onSubmit={async (event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              await call("/api/v1/oficina/cuadrilla.php", { accion: "cuadrilla", id: crew.id, nombre: form.get("nombre"), notas: form.get("notas") });
              await refresh();
            }}>
              <strong>{crew.nombre}</strong>
              <input name="nombre" defaultValue={crew.nombre} />
              <input name="notas" defaultValue={crew.notas} />
              <button className="btn" type="submit">{t.save}</button>
              <button className="btn ghost" type="button" onClick={() => call("/api/v1/oficina/cuadrilla.php", { accion: "borrar-cuadrilla", id: crew.id }).then(refresh)}>{t.remove}</button>
            </form>
          ))}
          {employees.map((person) => (
            <form key={person.id} className="card stack" onSubmit={async (event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const extra = Number(form.get("extra"));
              const first = Number(form.get("cuadrillaId"));
              await call("/api/v1/oficina/cuadrilla.php", {
                id: person.id, nombre: form.get("nombre"), telefono: form.get("telefono"), correo: form.get("correo"),
                direccion: form.get("direccion"), puesto: form.get("puesto"), notas: form.get("notas"),
                pagoHora: Number(form.get("pagoHora")), codigo: form.get("codigo"),
                cuadrillaId: first, cuadrillaExtra: extra,
                password: extra && extra !== first && person.cuadrillas.length < 2 ? askPassword() : "",
              });
              await refresh();
            }}>
              <div className="row">
                <input name="nombre" defaultValue={person.nombre} required />
                <input name="telefono" defaultValue={person.telefono} />
                <input name="correo" defaultValue={person.correo} />
                <input name="direccion" defaultValue={person.direccion} />
                <select name="puesto" defaultValue={person.puesto}><option>Capataz</option><option>Jardinero</option><option>Ayudante</option><option>Chofer</option></select>
                <input name="pagoHora" type="number" step="0.01" defaultValue={person.pagoHora} />
                <input name="codigo" defaultValue={person.codigo} required />
                <select name="cuadrillaId" defaultValue={person.cuadrillas[0] || ""}><option value="">Select</option>{crews.map((crew) => <option key={crew.id} value={crew.id}>{crew.nombre}</option>)}</select>
                <select name="extra" defaultValue={person.cuadrillas[1] || ""}><option value="">Ninguna</option>{crews.map((crew) => <option key={crew.id} value={crew.id}>{crew.nombre}</option>)}</select>
                <input name="notas" defaultValue={person.notas} />
              </div>
              <div className="row">
                <button className="btn" type="submit">{t.save}</button>
                <button className="btn ghost" type="button" onClick={() => call("/api/v1/oficina/cuadrilla.php", { accion: "borrar-empleado", id: person.id }).then(refresh)}>{t.remove}</button>
              </div>
            </form>
          ))}
          <section className="card">
            <h3>Horas</h3>
            {punches.length ? <table><tbody>{punches.map((item, index) => <tr key={index}><td>{item.nombre}</td><td>{item.entrada}</td><td>{item.salida || "En turno"}</td></tr>)}</tbody></table> : <p className="note">Nadie ha marcado entrada todavía.</p>}
          </section>
        </section>
      ) : null}

      {tab === "money" ? (
        <section className="stack">
          <div className="kpis">
            <article className="kpi"><span>Cobrado</span><strong>{money(collected)}</strong></article>
            <article className="kpi"><span>Por cobrar</span><strong>{money(due)}</strong></article>
            <article className="kpi"><span>Gastos</span><strong>{money(spent)}</strong></article>
            <article className="kpi"><span>Ganancia</span><strong>{money(collected - spent)}</strong></article>
          </div>
          <p className="note">Horas de cuadrilla registradas: {hours} h</p>
          <form className="card row" onSubmit={async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            await call("/api/v1/oficina/finanzas.php", { accion: "gasto", fecha: form.get("fecha"), categoria: form.get("categoria"), descripcion: form.get("descripcion"), monto: Number(form.get("monto")) });
            event.currentTarget.reset();
            await refresh();
          }}>
            <input name="fecha" type="date" required defaultValue={todayISO()} />
            <select name="categoria"><option>Materiales</option><option>Basurero</option><option>Combustible</option><option>Equipo</option><option>Mano de obra</option><option>Otros</option></select>
            <input name="descripcion" placeholder="Descripción" />
            <input name="monto" type="number" min="0" step="0.01" required />
            <button className="btn" type="submit">{t.expense}</button>
          </form>
          {invoices.map((item) => {
            const cost = item.costos.materiales + item.costos.manoObra + item.costos.basurero + item.costos.otros;
            return (
              <article className="card" key={item.id}>
                <h3>{item.numero} · {item.nombre} · {money(item.total)} · {item.estado}</h3>
                <p>Ganancia estimada {money(item.total - cost)} · margen {item.total ? Math.round(((item.total - cost) / item.total) * 100) : 0}%</p>
                <form className="row" onSubmit={async (event: FormEvent<HTMLFormElement>) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  await call("/api/v1/oficina/finanzas.php", { accion: "costos", id: item.id, materiales: Number(form.get("materiales")), manoObra: Number(form.get("manoObra")), basurero: Number(form.get("basurero")), otros: Number(form.get("otros")) });
                  await refresh();
                }}>
                  <input name="materiales" type="number" step="0.01" defaultValue={item.costos.materiales} />
                  <input name="manoObra" type="number" step="0.01" defaultValue={item.costos.manoObra} />
                  <input name="basurero" type="number" step="0.01" defaultValue={item.costos.basurero} />
                  <input name="otros" type="number" step="0.01" defaultValue={item.costos.otros} />
                  <button className="btn secondary" type="submit">{t.save}</button>
                </form>
                {item.estado !== "pagado" ? (
                  <div className="row">
                    {["Efectivo", "Cheque", "Zelle", "Tarjeta"].map((pago) => (
                      <button key={pago} className="btn" type="button" onClick={() => call("/api/v1/oficina/finanzas.php", { accion: "cobrar", id: item.id, pago }).then(refresh)}>{t.collect} {pago}</button>
                    ))}
                  </div>
                ) : <p>{item.pago}</p>}
              </article>
            );
          })}
          <section className="card">
            <h3>Libro</h3>
            {expenses.map((item) => <p key={item.id}>{item.fecha} · {item.categoria} · {item.descripcion} · {money(item.monto)}</p>)}
          </section>
        </section>
      ) : null}

      {tab === "payroll" && payroll ? (
        <section className="card">
          <h2>{t.payroll}</h2>
          <p className="note">Hasta 8 horas al día se pagan normal. De la hora 8 a la 12 se paga tiempo y medio. Después de 12, doble. Si en la semana pasan de 40 horas normales, el resto también es tiempo y medio.</p>
          <label>{t.week}<input type="date" defaultValue={payroll.semana} onChange={(event) => call<{ semana: string; total: number; filas: typeof payroll.filas }>(`/api/v1/oficina/nomina.php?semana=${event.target.value}`).then(setPayroll)} /></label>
          <table>
            <thead><tr><th>Persona</th><th>Pago por hora</th><th>Normal</th><th>Extra</th><th>Doble</th><th>Pago</th></tr></thead>
            <tbody>
              {payroll.filas.map((row) => <tr key={row.nombre}><td>{row.nombre}</td><td>{money(row.pagoHora)}</td><td>{row.normal}</td><td>{row.extra}</td><td>{row.doble}</td><td>{money(row.pago)}</td></tr>)}
              <tr><td colSpan={5}>Total</td><td>{money(payroll.total)}</td></tr>
            </tbody>
          </table>
        </section>
      ) : null}
    </div>
  );
}
