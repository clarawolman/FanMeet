import InfoGrupo from "./componentes/infoGrupos/InfoGrupo";
import { useState } from 'react'
import './App.css'
import InfoGrupo from "./componentes/infoGrupos/InfoGrupo";


const grupoMock = {
  nombre: "Picnic de Fans",
};

export default function App() {
  return <InfoGrupo grupo={grupoMock} />;
}

export default App

