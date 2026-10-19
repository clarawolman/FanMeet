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
import { ICONOS, Marca, useTema } from "./componentes";

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
  const tema = useTema();

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
        <Marca />
        <nav aria-label="Principal">
          {SECCIONES.map((s) => {
            const activo = ruta.seccion === s.id;
            return (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={`itemMenu ${activo ? "activo" : ""}`}
                aria-current={activo ? "page" : undefined}
              >
                {ICONOS[s.id]}
                <span>{s.texto}</span>
              </a>
            );
          })}
        </nav>
        <div className="menuPie">
          <button className="itemMenu" type="button" onClick={tema.alternar}>
            {tema.oscuro ? ICONOS.sol : ICONOS.luna}
            <span>{tema.oscuro ? "Modo día" : "Modo noche"}</span>
          </button>
          <button className="itemMenu" type="button" onClick={cerrarSesion}>
            {ICONOS.salir}
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
      <main className="contenido">{pagina}</main>
    </div>
  );
}
