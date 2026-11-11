import { useEffect, useState, type FormEvent } from "react";
import { api } from "../../lib/api";
import EstimateView from "./EstimateView";
import OfficeView from "./OfficeView";
import RouteView from "./RouteView";

type Lang = "es" | "en";
type Page = "route" | "client" | "office";

export default function AraujoApp() {
  const [lang, setLang] = useState<Lang>("es");
  const [page, setPage] = useState<Page>("route");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    import("virtual:pwa-register").then(({ registerSW }) => registerSW({ immediate: true })).catch(() => undefined);
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const result = await api<{ token: string }>("/api/v1/auth/oficina.php", { password: new FormData(event.currentTarget).get("password") });
      setToken(result.token);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Error");
    }
  }

  const line = page === "client"
    ? (lang === "en" ? "Sign the estimate with your phone." : "Firma el estimado con tu teléfono.")
    : page === "office"
      ? (lang === "en" ? "Clients, estimates, and finances." : "Clientes, estimados y finanzas.")
      : "";

  return (
    <>
      <header className="top">
        <div><button type="button" aria-pressed={page === "client"} onClick={() => setPage("client")}>{lang === "en" ? "Estimates" : "Estimados"}</button></div>
        <div>
          <h1>Araujo’s Landscaping</h1>
          <p>{line || (lang === "en" ? "Route, estimates, and invoices" : "Ruta, estimados e invoices")}</p>
        </div>
        <div className="lang">
          <button type="button" aria-pressed={page === "route"} onClick={() => setPage("route")}>{lang === "en" ? "Route" : "Ruta"}</button>
          <button type="button" aria-pressed={page === "office"} onClick={() => setPage("office")}>{lang === "en" ? "Office" : "Oficina"}</button>
          <button type="button" onClick={() => { const next = lang === "es" ? "en" : "es"; setLang(next); document.documentElement.lang = next; }}>{lang === "es" ? "English" : "Español"}</button>
        </div>
      </header>
      <main className="wrap">
        {page === "route" ? <RouteView lang={lang} /> : null}
        {page === "client" ? <EstimateView lang={lang} /> : null}
        {page === "office" && !token ? (
          <form className="card stack" onSubmit={login}>
            <h2>{lang === "en" ? "Office" : "Oficina"}</h2>
            <p className="note">{lang === "en" ? "Today's route does not ask for a password." : "La ruta de hoy no pide contraseña: la cuadrilla la sigue directo."}</p>
            <label>{lang === "en" ? "Password" : "Contraseña"}<input name="password" type="password" required /></label>
            {error ? <p className="error">{error}</p> : null}
            <button className="btn" type="submit">{lang === "en" ? "Enter" : "Entrar"}</button>
          </form>
        ) : null}
        {page === "office" && token ? <OfficeView lang={lang} token={token} /> : null}
      </main>
    </>
  );
}
