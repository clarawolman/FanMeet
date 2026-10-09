import { useEffect, useState } from "react";
import { api, supabase } from "./api";
import Login from "./paginas/Login";
import Resumen from "./paginas/Resumen";
import Reportes from "./paginas/Reportes";
import ReporteDetalle from "./paginas/ReporteDetalle";
import Usuarios from "./paginas/Usuarios";
import UsuarioDetalle from "./paginas/UsuarioDetalle";
import Conciertos from "./paginas/Conciertos";
import Grupos from "./paginas/Grupos";

const SECCIONES = [
  { id: "resumen", texto: "Resumen" },
  { id: "reportes", texto: "Reportes" },
  { id: "usuarios", texto: "Usuarios" },
  { id: "conciertos", texto: "Conciertos" },
  { id: "grupos", texto: "Grupos" },
];

// La "ruta" vive en el hash (#reportes, #reporte-12, #usuario-<id>) para
// que el link del mail de reportes abra directo el reporte.
function leerRuta() {
  const hash = window.location.hash.replace(/^#/, "") || "resumen";
  const [, tipo, id] = hash.match(/^(reporte|usuario)-(.+)$/) || [];
  if (tipo) return { seccion: tipo === "reporte" ? "reportes" : "usuarios", tipo, id };
  return { seccion: hash, tipo: null, id: null };
}

export default function App() {
  const [sesion, setSesion] = useState("cargando");
  const [ruta, setRuta] = useState(leerRuta);
  const [avisoLogin, setAvisoLogin] = useState("");

  useEffect(() => {
    const alCambiar = () => setRuta(leerRuta());
    window.addEventListener("hashchange", alCambiar);
    return () => window.removeEventListener("hashchange", alCambiar);
  }, []);

  // Si ya había sesión guardada, se confirma con el backend que siga
  // siendo moderador (y que la cuenta no esté suspendida).
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return setSesion(null);
      try {
        await api.resumen();
        setSesion(data.session);
      } catch (error) {
        await api.logout();
        if (error.status === 403) setAvisoLogin(error.message);
        setSesion(null);
      }
    });
  }, []);

  async function cerrarSesion() {
    await api.logout();
    setSesion(null);
  }

  if (sesion === "cargando") return <p className="textoSuave centrado">Cargando…</p>;
  if (!sesion) {
    return (
      <Login
        aviso={avisoLogin}
        onIngresar={async () => {
          const { data } = await supabase.auth.getSession();
          setAvisoLogin("");
          setSesion(data.session);
        }}
      />
    );
  }

  let pagina;
  if (ruta.tipo === "reporte") pagina = <ReporteDetalle id={ruta.id} />;
  else if (ruta.tipo === "usuario") pagina = <UsuarioDetalle id={ruta.id} />;
  else if (ruta.seccion === "reportes") pagina = <Reportes />;
  else if (ruta.seccion === "usuarios") pagina = <Usuarios />;
  else if (ruta.seccion === "conciertos") pagina = <Conciertos />;
  else if (ruta.seccion === "grupos") pagina = <Grupos />;
  else pagina = <Resumen />;

  return (
    <div className="layout">
      <aside className="menu">
        <div className="marca">
          <img src="/Favicon.png" alt="" />
          <div>
            <strong>FanMeet</strong>
            <span>Backoffice</span>
          </div>
        </div>
        <nav>
          {SECCIONES.map((s) => (
            <a key={s.id} href={`#${s.id}`} className={ruta.seccion === s.id ? "activo" : ""}>
              {s.texto}
            </a>
          ))}
        </nav>
        <button className="botonTexto cerrarSesion" type="button" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </aside>
      <main className="contenido">{pagina}</main>
    </div>
  );
}
