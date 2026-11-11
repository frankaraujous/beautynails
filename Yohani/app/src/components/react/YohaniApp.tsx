import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import Landing, { type PublicData } from "./Landing";
import BookingSheet from "./BookingSheet";

type Lang = "es" | "en";

export default function YohaniApp() {
  const [lang, setLang] = useState<Lang>("es");
  const [pub, setPub] = useState<PublicData | null>(null);
  const [error, setError] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [preset, setPreset] = useState("");

  async function loadPublic() {
    setPub(await api<PublicData>("/api/v1/publico.php"));
  }

  useEffect(() => {
    loadPublic().catch((reason: Error) => setError(reason.message));
    import("virtual:pwa-register").then(({ registerSW }) => registerSW({ immediate: true })).catch(() => undefined);
  }, []);

  function openReserve(servicio = "") {
    setPreset(servicio);
    setSheetOpen(true);
    setError("");
  }

  return (
    <>
      {pub ? (
        <Landing
          lang={lang}
          pub={pub}
          hideBook={sheetOpen}
          onLang={() => setLang(lang === "es" ? "en" : "es")}
          onAdmin={() => { window.location.assign("/admin"); }}
          onReserve={openReserve}
        />
      ) : <p className="error wrap">{error || (lang === "en" ? "Loading…" : "Cargando…")}</p>}
      {pub && sheetOpen ? (
        <BookingSheet
          lang={lang}
          servicios={pub.servicios}
          dias={pub.dias}
          zelle={pub.zelle}
          initialService={preset}
          onClose={() => setSheetOpen(false)}
          onBooked={loadPublic}
        />
      ) : null}
    </>
  );
}
