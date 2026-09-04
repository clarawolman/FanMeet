import { useEffect, useState } from "react";
import "./MisEventos.css";

import { conciertosService } from "../../services/conciertosService";

import HeaderMisEventos from "./HeaderMisEventos";
import CardEvento from "./CardEvento";
import Footer from "../generales/Footer";
import ModalConfirmacion from "../generales/ModalConfirmacion";

function MisEventos({
  usuarioActual,
  onIngresar,
  onIrMisGrupos,
  onNavegar,
}) {
  const [misEventos, setMisEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorTexto, setErrorTexto] = useState("");
  const [eventoParaSalir, setEventoParaSalir] = useState(null);
  const [saliendo, setSaliendo] = useState(false);

  useEffect(() => {
    if (usuarioActual?.id_usuario) {
      cargarMisEventos();
    }
  }, [usuarioActual]);

  async function cargarMisEventos() {
    setCargando(true);
    setErrorTexto("");

    try {
      const eventos = await conciertosService.listarMisEventos();
      setMisEventos(eventos || []);
    } catch (error) {
      console.error("Error cargando mis eventos:", error);
      setErrorTexto("No se pudieron cargar tus eventos.");
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
    <div className="pantallaMisEventos">
      <HeaderMisEventos onIrMisGrupos={onIrMisGrupos} />

      <main className="misEventosLayout">
        {cargando && (
          <p className="mensajeMisEventos">Cargando eventos...</p>
        )}

        {!cargando && errorTexto && (
          <p className="mensajeMisEventos">{errorTexto}</p>
        )}

        {!cargando && !errorTexto && misEventos.length === 0 && (
          <p className="mensajeMisEventos">
            Todavía no estás asociado a ningún evento.
          </p>
        )}

        {!cargando &&
          !errorTexto &&
          misEventos.map((evento) => (
            <CardEvento
              key={evento.id_concierto}
              evento={evento}
              onIngresar={() => onIngresar(evento)}
              onSalir={setEventoParaSalir}
            />
          ))}
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