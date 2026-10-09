import { useContext, useEffect, useState } from "react";
import "../generales/TarjetaLista.css";

import { gruposService } from "../../services/gruposService";

import HeaderMisGrupos from "./HeaderMisGrupos";
import CardGrupo from "./CardGrupo";
import Footer from "../generales/Footer";
import ModalConfirmacion from "../generales/ModalConfirmacion";
import LoadingSpinner from "../generales/LoadingSpinner";
import { UsuarioContext } from "../../context/UsuarioContext";

function MisGrupos({
  onAbrirGrupo,
  onVolver,
  onNavegar,
}) {
  const { usuarioActual } = useContext(UsuarioContext);
  const [misGrupos, setMisGrupos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [grupoParaSalir, setGrupoParaSalir] = useState(null);
  const [saliendo, setSaliendo] = useState(false);

  useEffect(() => {
    if (usuarioActual?.id_usuario) {
      cargarMisGrupos();
    }
  }, [usuarioActual]);

  async function cargarMisGrupos() {
    setCargando(true);

    try {
      const grupos = await gruposService.listarMisGrupos();
      setMisGrupos(grupos || []);
    } catch (error) {
      // Si no se pudo cargar, se muestra como vacío: sin errores técnicos.
      console.error("Error cargando mis grupos:", error);
      setMisGrupos([]);
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
    <div className="pantallaLista">
      <HeaderMisGrupos onVolver={onVolver} />

      <main className="listaLayout">
        {cargando && <LoadingSpinner texto="Cargando grupos..." />}

        {!cargando && misGrupos.length === 0 && (
          <div className="listaMensaje">
            <p>Todavía no estás en ningún grupo. Entrá a un concierto para sumarte a uno o crear el tuyo.</p>
            <button type="button" className="tarjetaBoton" onClick={onVolver}>
              Ver tus eventos
            </button>
          </div>
        )}

        {!cargando &&
          seccionesConciertos.map((seccion) => (
            <section className="listaSeccion" key={seccion.id_concierto}>
              <div className="listaSeccionHeader">
                <h2>{obtenerNombreConcierto(seccion)}</h2>
                <span className="listaSeccionCantidad">{seccion.grupos.length}</span>
              </div>

              <ul className="listaTarjetas">
                {seccion.grupos.map((grupo) => (
                  <li key={grupo.id_grupo}>
                    <CardGrupo
                      grupo={grupo}
                      onAbrirGrupo={() => onAbrirGrupo(grupo)}
                      onSalir={setGrupoParaSalir}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
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