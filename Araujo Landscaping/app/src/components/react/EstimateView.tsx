import { useRef, useState, type FormEvent, type PointerEvent } from "react";
import { api, money } from "../../lib/api";

type Lang = "es" | "en";
type Item = { desc: string; qty: number; precio: number };
type Estimate = {
  id: number; numero: string; nombre: string; telefono: string; direccion: string; nota: string;
  estado: string; firma: string; firmo: string; firmadoEn: string | null; partidas: Item[];
};
type Invoice = { id: number; numero: string; estado: string; total: number; pago: string; partidas: Item[]; nombre: string };

const labels = {
  es: { title: "Tu estimado", note: "Pon tu teléfono. Si el estimado está listo, lo firmas. El invoice aparece cuando el trabajo ya se facturó.", demo: "Pruebas: 408-555-1005 listo para firmar. 408-555-1010 ya firmado. 408-555-1015 con invoice.", phone: "Teléfono", search: "Buscar", sign: "Firma para aceptar el estimado.", name: "Tu nombre", ok: "Acepto y firmo", paid: "Pagado", due: "Por cobrar" },
  en: { title: "Your estimate", note: "Enter your phone. If the estimate is ready, you sign it. The invoice shows up after the job is billed.", demo: "Tests: 408-555-1005 ready to sign. 408-555-1010 already signed. 408-555-1015 with an invoice.", phone: "Phone", search: "Search", sign: "Sign to accept the estimate.", name: "Your name", ok: "I accept and sign", paid: "Paid", due: "Unpaid" },
};

export default function EstimateView({ lang }: { lang: Lang }) {
  const t = labels[lang];
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [name, setName] = useState("");
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  async function search(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const data = await api<{ estimados: Estimate[]; invoices: Invoice[] }>(`/api/v1/estimados/buscar.php?telefono=${encodeURIComponent(phone)}`);
      setEstimates(data.estimados);
      setInvoices(data.invoices);
    } catch (reason) {
      setEstimates([]);
      setInvoices([]);
      setError(reason instanceof Error ? reason.message : "Error");
    }
  }

  function pointer(event: PointerEvent<HTMLCanvasElement>) {
    const board = canvas.current;
    if (!board) return;
    const rect = board.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (board.width / rect.width);
    const y = (event.clientY - rect.top) * (board.height / rect.height);
    const ctx = board.getContext("2d");
    if (!ctx) return;
    if (event.type === "pointerdown") {
      drawing.current = true;
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else if (event.type === "pointermove" && drawing.current) {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      drawing.current = false;
    }
  }

  async function sign(id: number) {
    const firma = canvas.current?.toDataURL("image/png") || "";
    try {
      await api("/api/v1/estimados/firmar.php", { id, nombre: name, firma });
      setName("");
      const data = await api<{ estimados: Estimate[]; invoices: Invoice[] }>(`/api/v1/estimados/buscar.php?telefono=${encodeURIComponent(phone)}`);
      setEstimates(data.estimados);
      setInvoices(data.invoices);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Error");
    }
  }

  return (
    <div className="stack">
      <section className="card stack">
        <h2>{t.title}</h2>
        <p className="note">{t.note}</p>
        <p className="note">{t.demo}</p>
        <form className="row" onSubmit={search}>
          <label>{t.phone}<input value={phone} onChange={(event) => setPhone(event.target.value)} required /></label>
          <button className="btn clay" type="submit">{t.search}</button>
        </form>
        {error ? <p className="error">{error}</p> : null}
      </section>
      {estimates.map((item) => (
        <article className="card" key={item.id}>
          <h3>{item.numero} · {item.nombre}</h3>
          <p>{item.direccion}</p>
          <p>{item.nota}</p>
          <table><tbody>{item.partidas.map((line) => <tr key={line.desc}><td>{line.desc}</td><td className="numr">{money(line.qty * line.precio)}</td></tr>)}</tbody></table>
          <p>{item.estado}{item.firmo ? ` · ${item.firmo}` : ""}</p>
          {item.firma ? <img src={item.firma} alt="" width={220} /> : null}
          {item.estado === "enviado" ? (
            <div className="stack">
              <p>{t.sign}</p>
              <canvas ref={canvas} className="canvas-box" width={480} height={160} onPointerDown={pointer} onPointerMove={pointer} onPointerUp={pointer} />
              <label>{t.name}<input value={name} onChange={(event) => setName(event.target.value)} /></label>
              <button className="btn" type="button" onClick={() => sign(item.id)}>{t.ok}</button>
            </div>
          ) : null}
        </article>
      ))}
      {invoices.map((item) => (
        <article className="card" key={item.numero}>
          <h3>{item.numero} · {item.estado === "pagado" ? t.paid : t.due} · {money(item.total)}</h3>
          <table><tbody>{item.partidas.map((line) => <tr key={line.desc}><td>{line.desc}</td><td className="numr">{money(line.qty * line.precio)}</td></tr>)}</tbody></table>
        </article>
      ))}
    </div>
  );
}
