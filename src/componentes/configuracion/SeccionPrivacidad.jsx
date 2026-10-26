import { Grupo, Interruptor, Opciones } from "./piezas";
import UsuariosBloqueados from "../generales/UsuariosBloqueados";

const AMIGOS_O_NADIE = [
  { valor: "amigos", texto: "Mis amigos" },
  { valor: "nadie", texto: "Nadie" },
];

export default function SeccionPrivacidad({ preferencias, onGuardarPreferencias }) {
  return (
    <>
      <Grupo titulo="Tu perfil">
        <Interruptor
          titulo="Perfil privado"
          descripcion="Tus momentos los ven solo tus amigos."
          activo={preferencias.perfil_privado}
          onCambiar={(v) => onGuardarPreferencias({ perfil_privado: v })}
        />
        <Interruptor
          titulo="Mostrar mis conciertos"
          descripcion="A qué recitales vas, en tu perfil."
          activo={preferencias.mostrar_conciertos}
          onCambiar={(v) => onGuardarPreferencias({ mostrar_conciertos: v })}
        />
        <Interruptor
          titulo="Mostrar lo que escucho"
          descripcion="Tu actividad de Last.fm en tu perfil."
          activo={preferencias.mostrar_musica}
          onCambiar={(v) => onGuardarPreferencias({ mostrar_musica: v })}
        />
        <Interruptor
          titulo="Aparecer en Descubrir"
          descripcion="Que te sugiramos a fans con tus mismos gustos."
          activo={preferencias.aparecer_en_descubrir}
          onCambiar={(v) => onGuardarPreferencias({ aparecer_en_descubrir: v })}
        />
      </Grupo>

      <Grupo titulo="Interacciones">
        <Opciones
          titulo="Quién te puede escribir"
          descripcion="Por chat privado. Solo se puede chatear entre amigos."
          opciones={AMIGOS_O_NADIE}
          valor={preferencias.mensajes}
          onCambiar={(v) => onGuardarPreferencias({ mensajes: v })}
        />
        <Opciones
          titulo="Quién te puede etiquetar en momentos"
          opciones={AMIGOS_O_NADIE}
          valor={preferencias.etiquetas}
          onCambiar={(v) => onGuardarPreferencias({ etiquetas: v })}
        />
        <Interruptor
          titulo="Ocultar los me gusta al publicar"
          descripcion="Cada momento nuevo arranca con los me gusta ocultos. Lo podés cambiar en cada uno."
          activo={preferencias.ocultar_likes}
          onCambiar={(v) => onGuardarPreferencias({ ocultar_likes: v })}
        />
      </Grupo>

      <Grupo titulo="Usuarios bloqueados">
        <UsuariosBloqueados abierto />
      </Grupo>
    </>
  );
}
