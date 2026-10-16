import { useContext, useEffect, useState } from "react";
import "../generales/TarjetaLista.css";

import { conciertosService } from "../../services/conciertosService";

import HeaderMisEventos from "./HeaderMisEventos";
import CardEvento from "./CardEvento";
import Footer from "../generales/Footer";
import ModalConfirmacion from "../generales/ModalConfirmacion";
import LoadingSpinner from "../generales/LoadingSpinner";
import { UsuarioContext } from "../../context/UsuarioContext";
import { mostrarAviso } from "../../utils/avisos";
import { separarProximosYPasados } from "../../utils/fechas";

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
  const { proximos, pasados } = separarProximosYPasados(misEventos);

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
      mostrarAviso("No se pudo salir del concierto: " + error.message);
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
          <section className="listaSeccion">
            <div className="listaSeccionHeader">
              <h2>Próximos</h2>
              <span className="listaSeccionCantidad">{proximos.length}</span>
            </div>

            {proximos.length === 0 ? (
              <div className="listaMensaje">
                <p>No tenés conciertos próximos.</p>
                <button type="button" className="tarjetaBoton" onClick={() => onNavegar("home")}>
                  Buscar conciertos
                </button>
              </div>
            ) : (
              <ul className="listaTarjetas">
                {proximos.map((evento) => (
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
          </section>
        )}

        {/* Sin "Salir": salir de un concierto que ya pasó lo borraría del historial */}
        {!cargando && pasados.length > 0 && (
          <section className="listaSeccion">
            <div className="listaSeccionHeader">
              <h2>Historial de conciertos</h2>
              <span className="listaSeccionCantidad">{pasados.length}</span>
            </div>

            <ul className="listaTarjetas">
              {pasados.map((evento) => (
                <li key={evento.id_concierto}>
                  <CardEvento evento={evento} onIngresar={() => onIngresar(evento)} />
                </li>
              ))}
            </ul>
          </section>
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