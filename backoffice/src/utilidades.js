import { useEffect, useState } from "react";

// Carga datos de la API y expone { datos, error, cargando, recargar }.
// Vuelve a cargar cuando cambian las dependencias o al llamar recargar().
export function useCarga(cargar, dependencias) {
  const [recargas, setRecargas] = useState(0);
  const [resultado, setResultado] = useState({ clave: null, datos: null, error: "" });
  const clave = JSON.stringify([...dependencias, recargas]);

  useEffect(() => {
    let activo = true;
    cargar().then(
      (datos) => activo && setResultado({ clave, datos, error: "" }),
      (error) => activo && setResultado({ clave, datos: null, error: error.message })
    );
    return () => {
      activo = false;
    };
    // `cargar` cambia en cada render; lo que importa son las dependencias.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  return {
    datos: resultado.datos,
    error: resultado.error,
    cargando: resultado.clave !== clave,
    recargar: () => setRecargas((n) => n + 1),
  };
}

export function fechaCorta(valor) {
  if (!valor) return "—";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor);
  return fecha.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function irA(hash) {
  window.location.hash = hash;
}
