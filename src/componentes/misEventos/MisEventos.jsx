import { useContext, useEffect, useState } from "react";
import "../generales/TarjetaLista.css";

import { conciertosService } from "../../services/conciertosService";

import HeaderMisEventos from "./HeaderMisEventos";
import CardEvento from "./CardEvento";
import Footer from "../generales/Footer";
import ModalConfirmacion from "../generales/ModalConfirmacion";
import LoadingSpinner from "../generales/LoadingSpinner";
import { UsuarioContext } from "../../context/UsuarioContext";

function MisEventos({
  onIngresar,
  onIrMisGrupos,
  onNavegar,
}) {
  const { usuarioActual } = useContext(UsuarioContext);
  const [misEventos, setMisEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [eventoParaSalir, setEventoParaSalir] = useState(null);
  const [saliendo, setSaliendo] = useState(false);

  useEffect(() => {
    if (usuarioActual?.id_usuario) {
      cargarMisEventos();
    }
  }, [usuarioActual]);

  async function cargarMisEventos() {
    setCargando(true);

    try {
      const eventos = await conciertosService.listarMisEventos();
      setMisEventos(eventos || []);
    } catch (error) {
      // Si no se pudo cargar, se muestra como vacío: sin errores técnicos.
      console.error("Error cargando mis eventos:", error);
      setMisEventos([]);
    }

    setCargando(false);
  }

  async function confirmarSalirDelConcierto() {
    if (!eventoParaSalir) return;

    setSaliendo(true);

    // Salir de un concierto también saca a la persona de todos los grupos
    // que haya confirmado dentro de ese concierto: mismo efecto en cascada
    // que antes hacía este componente, ahora resuelto en el backend
    // (conciertoService.salirDeConcierto).
    try {
      await conciertosService.salir(eventoParaSalir.id_concierto);
    } catch (error) {
      setSaliendo(false);
      alert("No se pudo salir del concierto: " + error.message);
      return;
    }

    setSaliendo(false);
    setEventoParaSalir(null);
    await cargarMisEventos();
  }

  return (
    <div className="pantallaLista">
      <HeaderMisEventos onIrMisGrupos={onIrMisGrupos} />

      <main className="listaLayout">
        {cargando && <LoadingSpinner texto="Cargando eventos..." />}

        {!cargando && misEventos.length === 0 && (
          <div className="listaMensaje">
            <p>Todavía no te uniste a ningún concierto.</p>
            <button type="button" className="tarjetaBoton" onClick={() => onNavegar("home")}>
              Buscar conciertos
            </button>
          </div>
        )}

        {!cargando && misEventos.length > 0 && (
          <ul className="listaTarjetas">
            {misEventos.map((evento) => (
              <li key={evento.id_concierto}>
                <CardEvento
                  evento={evento}
                  onIngresar={() => onIngresar(evento)}
                  onSalir={setEventoParaSalir}
                />
              </li>
            ))}
          </ul>
        )}
      </main>

      {eventoParaSalir && (
        <ModalConfirmacion
          mensaje={`¿Salir de ${eventoParaSalir.artista?.nombre || "este concierto"}? También vas a salir de los grupos que tengas ahí.`}
          textoConfirmar="Salir del concierto"
          textoCancelar="Cancelar"
          confirmando={saliendo}
          onConfirmar={confirmarSalirDelConcierto}
          onCancelar={() => setEventoParaSalir(null)}
        />
      )}

      <Footer onNavegar={onNavegar} pantallaActiva="misEventos" />
    </div>
  );
}

export default MisEventos;