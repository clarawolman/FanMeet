import { useContext, useId, useState } from "react";
import { Campo, Grupo } from "./piezas";
import { UsuarioContext } from "../../context/UsuarioContext";
import { usuariosService } from "../../services/usuariosService";
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

// Vibe de concierto, géneros, artistas favoritos y Last.fm se editan desde
// el perfil: acá queda solo lo que no está ahí (la ciudad).
export default function SeccionMusica({ usuario }) {
  return (
    <Grupo titulo="Zona">
      <FormCiudad ciudadActual={usuario?.ciudad} />
    </Grupo>
  );
}
