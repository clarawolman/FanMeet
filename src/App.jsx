import { useState } from "react";
import Concierto from "./componentes/concierto/Concierto";
import InfoGrupo from "./componentes/infoGrupos/InfoGrupo";

function App() {
  const [pantalla, setPantalla] = useState("concierto");
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);

  const usuariosMock = [
    {
      id_usuario: 1,
      nombre: "Luna",
      foto_perfil: "https://i.pravatar.cc/100?img=1",
    },
    {
      id_usuario: 2,
      nombre: "Mora",
      foto_perfil: "https://i.pravatar.cc/100?img=2",
    },
    {
      id_usuario: 3,
      nombre: "Sofi",
      foto_perfil: "https://i.pravatar.cc/100?img=3",
    },
    {
      id_usuario: 4,
      nombre: "Juli",
      foto_perfil: "https://i.pravatar.cc/100?img=4",
    },
  ];

  const conciertoMock = {
    id_concierto: 1,
    nombre: "The Eras Tour",
    fecha: "9 de noviembre",
    hora: "21:00",
    imagen: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a",

    artista: {
      id_artista: 1,
      nombre: "Taylor Swift",
    },

    estadio: {
      id_estadio: 1,
      nombre: "River Plate",
      direccion: "Av. Pres. Figueroa Alcorta 7597",
      ciudad: "Buenos Aires",
      imagen: "https://images.unsplash.com/photo-1577223625816-7546f13df25d",
    },

    usuarios: usuariosMock,
    asistentes: usuariosMock.length,

    grupos: [
      {
        id_grupo: 1,
        nombre: "Picnic pre - concierto",
        descripcion: "Nos juntamos antes del show para hacer previa, charlar y entrar juntos.",
        fecha: "9 de noviembre",
        hora: "17:00",
        ubicacion: "Parque Centenario",
        foto: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a",
        usuarios: usuariosMock,
      },
      {
        id_grupo: 2,
        nombre: "Ida al concierto",
        descripcion: "Grupo para ir acompañados al estadio.",
        fecha: "9 de noviembre",
        hora: "19:00",
        ubicacion: "Estación Belgrano C",
        foto: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30",
        usuarios: usuariosMock.slice(0, 3),
      },
    ],
  };

  return (
    <>
      {pantalla === "concierto" && (
        <Concierto
          concierto={conciertoMock}
          onAbrirGrupo={(grupo) => {
            setGrupoSeleccionado(grupo);
            setPantalla("infoGrupo");
          }}
        />
      )}

      {pantalla === "infoGrupo" && grupoSeleccionado && (
        <InfoGrupo
          grupo={grupoSeleccionado}
          concierto={conciertoMock}
          onVolver={() => setPantalla("concierto")}
        />
      )}
    </>
  );
}

export default App;