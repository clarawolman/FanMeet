import { useEffect, useState } from "react";
import "./MisGrupos.css";

import { gruposService } from "../../services/gruposService";

import HeaderMisGrupos from "./HeaderMisGrupos";
import CardGrupo from "./CardGrupo";
import Footer from "../generales/Footer";
import ModalConfirmacion from "../generales/ModalConfirmacion";

function MisGrupos({
  usuarioActual,
  onAbrirGrupo,
  onVolver,
  onNavegar,
}) {
  const [misGrupos, setMisGrupos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorTexto, setErrorTexto] = useState("");
  const [grupoParaSalir, setGrupoParaSalir] = useState(null);
  const [saliendo, setSaliendo] = useState(false);

  useEffect(() => {
    if (usuarioActual?.id_usuario) {
      cargarMisGrupos();
    }
  }, [usuarioActual]);

  async function cargarMisGrupos() {
    setCargando(true);
    setErrorTexto("");

    try {
      const grupos = await gruposService.listarMisGrupos();
      setMisGrupos(grupos || []);
    } catch (error) {
      console.error("Error cargando mis grupos:", error);
      setErrorTexto("No se pudieron cargar tus grupos.");
    }

    setCargando(false);
  }

  async function confirmarSalirDelGrupo() {
    if (!grupoParaSalir) return;

    setSaliendo(true);

    try {
      await gruposService.salir(grupoParaSalir.id_grupo);
    } catch (error) {
      setSaliendo(false);
      alert("No se pudo salir del grupo: " + error.message);
      return;
    }

    setSaliendo(false);
    setGrupoParaSalir(null);
    await cargarMisGrupos();
  }

  const gruposPorConcierto = misGrupos.reduce((acumulador, grupo) => {
    const idConcierto = String(grupo.id_concierto || "sin-concierto");

    if (!acumulador[idConcierto]) {
      acumulador[idConcierto] = {
        id_concierto: idConcierto,
        concierto: grupo.concierto,
        grupos: [],
      };
    }

    acumulador[idConcierto].grupos.push(grupo);

    return acumulador;
  }, {});

  const seccionesConciertos = Object.values(gruposPorConcierto);

  function obtenerNombreConcierto(seccion) {
    return (
      seccion.concierto?.nombre ||
      seccion.concierto?.artista?.nombre ||
      `Concierto ${seccion.id_concierto}`
    );
  }

  return (
    <div className="pantallaMisGrupos">
      <HeaderMisGrupos onVolver={onVolver} />

      <main className="misGruposLayout">
        {cargando && (
          <p className="mensajeMisGrupos">Cargando grupos...</p>
        )}

        {!cargando && errorTexto && (
          <p className="mensajeMisGrupos">{errorTexto}</p>
        )}

        {!cargando && !errorTexto && misGrupos.length === 0 && (
          <p className="mensajeMisGrupos">
            Todavía no participás en ningún grupo.
          </p>
        )}

        {!cargando && !errorTexto && (
          <div className="misGruposCatalogo">
            {seccionesConciertos.map((seccion) => (
              <section className="misGruposRow" key={seccion.id_concierto}>
                <div className="misGruposRowHeader">
                  <h2>{obtenerNombreConcierto(seccion)}</h2>
                  <span>{seccion.grupos.length}</span>
                </div>

                <div className="misGruposRowScroll">
                  {seccion.grupos.map((grupo) => (
                    <CardGrupo
                      key={grupo.id_grupo}
                      grupo={grupo}
                      onAbrirGrupo={() => onAbrirGrupo(grupo)}
                      onSalir={setGrupoParaSalir}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {grupoParaSalir && (
        <ModalConfirmacion
          mensaje={`¿Salir de ${grupoParaSalir.nombre}?`}
          textoConfirmar="Salir del grupo"
          textoCancelar="Cancelar"
          confirmando={saliendo}
          onConfirmar={confirmarSalirDelGrupo}
          onCancelar={() => setGrupoParaSalir(null)}
        />
      )}

      <Footer onNavegar={onNavegar} pantallaActiva="misGrupos" />
    </div>
  );
}

export default MisGrupos;