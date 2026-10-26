import { useContext, useEffect, useId, useState } from "react";
import { Campo, FilaBoton, Grupo, Opciones } from "./piezas";
import { UsuarioContext } from "../../context/UsuarioContext";
import { usuariosService } from "../../services/usuariosService";
import { lastfmService } from "../../services/lastfmService";
import { mostrarAviso } from "../../utils/avisos";

// Sugerencias del campo de ciudad (se puede escribir cualquier otra)
const CIUDADES = [
  "Buenos Aires",
  "La Plata",
  "Córdoba",
  "Rosario",
  "Mendoza",
  "Mar del Plata",
  "Tucumán",
  "Salta",
  "Santa Fe",
  "Neuquén",
  "Bahía Blanca",
  "Montevideo",
  "Santiago",
];

// Mismos valores que Registro3 y el perfil (usuario.estilo_asistencia)
const VIBRAS = [
  { valor: "pogo", texto: "Pogos, campos" },
  { valor: "tranquilo", texto: "Platea" },
  { valor: "campo", texto: "Primera fila" },
];

function FormCiudad({ ciudadActual }) {
  const { usuarioActual, setUsuarioActual } = useContext(UsuarioContext);
  const idLista = useId();
  const [ciudad, setCiudad] = useState(ciudadActual || "");
  const [guardando, setGuardando] = useState(false);
  const cambio = ciudad.trim() !== (ciudadActual || "");

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      const actualizado = await usuariosService.actualizarCiudad(ciudad.trim());
      setUsuarioActual({ ...usuarioActual, ciudad: actualizado.ciudad });
      mostrarAviso(actualizado.ciudad ? `Listo: ${actualizado.ciudad}.` : "Sacaste tu ciudad.", "exito");
    } catch (error) {
      mostrarAviso("No se pudo guardar la ciudad: " + error.message);
    }
    setGuardando(false);
  }

  return (
    <form className="configForm configForm--enLinea" onSubmit={guardar}>
      <Campo
        etiqueta="Tu ciudad"
        list={idLista}
        maxLength={60}
        placeholder="Ej: Buenos Aires"
        value={ciudad}
        onChange={(e) => setCiudad(e.target.value)}
        ayuda="Te mostramos primero conciertos y fans de tu zona. Se ve en tu perfil."
      />
      <datalist id={idLista}>
        {CIUDADES.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <button type="submit" className="fmBotonPrimario configBotonPrincipal" disabled={!cambio || guardando}>
        {guardando ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}

function EstadoLastfm({ idUsuario, onNavegar }) {
  const [estado, setEstado] = useState(null); // null = cargando
  const [desvinculando, setDesvinculando] = useState(false);

  useEffect(() => {
    let activo = true;
    lastfmService
      .obtenerResumen(idUsuario)
      .then((datos) => activo && setEstado(datos || { conectado: false }))
      .catch(() => activo && setEstado({ conectado: false, error: true }));
    return () => {
      activo = false;
    };
  }, [idUsuario]);

  async function desvincular() {
    setDesvinculando(true);
    try {
      await lastfmService.desvincular();
      setEstado({ conectado: false });
      mostrarAviso("Desconectaste Last.fm.", "info");
    } catch (error) {
      mostrarAviso("No se pudo desconectar Last.fm: " + error.message);
    }
    setDesvinculando(false);
  }

  if (estado === null) return <p className="configTexto">Cargando…</p>;

  if (estado.conectado) {
    return (
      <FilaBoton
        titulo="Last.fm conectado"
        descripcion={estado.usuario_lastfm ? `Como ${estado.usuario_lastfm}` : "Usamos lo que escuchás para sugerirte gente y shows."}
        texto={desvinculando ? "…" : "Desconectar"}
        onClick={desvincular}
      />
    );
  }

  return (
    <FilaBoton
      titulo="Last.fm"
      descripcion={
        estado.error
          ? "Last.fm no está disponible por ahora."
          : "Conectalo para que te sugiramos gente y shows según lo que escuchás."
      }
      texto="Conectar en tu perfil"
      onClick={() => onNavegar("perfil")}
    />
  );
}

export default function SeccionMusica({ usuario, onNavegar }) {
  const { setUsuarioActual } = useContext(UsuarioContext);
  const [vibra, setVibra] = useState(usuario?.estilo_asistencia || "");

  async function cambiarVibra(nueva) {
    const anterior = vibra;
    setVibra(nueva);
    try {
      await usuariosService.actualizarVibra(nueva);
      setUsuarioActual((actual) => ({ ...actual, estilo_asistencia: nueva }));
    } catch (error) {
      setVibra(anterior);
      mostrarAviso("No se pudo guardar tu vibe: " + error.message);
    }
  }

  return (
    <>
      <Grupo titulo="Zona">
        <FormCiudad ciudadActual={usuario?.ciudad} />
      </Grupo>

      <Grupo titulo="Tus gustos">
        <Opciones
          titulo="Tu vibe de concierto"
          descripcion="Cómo te gusta vivir un show. La usamos para juntarte con gente parecida."
          opciones={VIBRAS}
          valor={vibra}
          onCambiar={cambiarVibra}
        />
        <FilaBoton
          titulo="Géneros musicales"
          descripcion="Los que elegiste al registrarte."
          texto="Editar"
          onClick={() => onNavegar("editarGeneros")}
        />
        <FilaBoton
          titulo="Artistas favoritos"
          descripcion="Te avisamos cuando anuncian un show."
          texto="Ver en mi perfil"
          onClick={() => onNavegar("perfil")}
        />
      </Grupo>

      <Grupo titulo="Cuentas conectadas">
        {usuario?.id_usuario && <EstadoLastfm idUsuario={usuario.id_usuario} onNavegar={onNavegar} />}
      </Grupo>
    </>
  );
}
