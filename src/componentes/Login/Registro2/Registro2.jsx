import { useRef, useState } from "react";
import "./Registro2.css";
import fotoDefault from "../../../assets/fotoDefault.png";

function Registro2({ onVolver, onSiguiente }) {
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [previewFoto, setPreviewFoto] = useState(fotoDefault);
  const [errorCamara, setErrorCamara] = useState("");
  const [camaraAbierta, setCamaraAbierta] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const inputLibreriaRef = useRef(null);

  async function abrirCamara() {
    setErrorCamara("");

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorCamara("Error, no se puede acceder a la camara");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      streamRef.current = stream;
      setCamaraAbierta(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (error) {
      setErrorCamara("Error, no se puede acceder a la camara");
    }
  }

  function cerrarCamara() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setCamaraAbierta(false);
  }

  function sacarFoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      setErrorCamara("Error, no se puede acceder a la camara");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const contexto = canvas.getContext("2d");
    contexto.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) {
        setErrorCamara("Error, no se puede acceder a la camara");
        return;
      }

      const archivo = new File([blob], "foto-perfil.png", {
        type: "image/png",
      });

      const preview = URL.createObjectURL(blob);

      setFotoPerfil(archivo);
      setPreviewFoto(preview);
      setErrorCamara("");
      cerrarCamara();
    }, "image/png");
  }

  function abrirLibreria() {
    setErrorCamara("");

    if (inputLibreriaRef.current) {
      inputLibreriaRef.current.click();
    }
  }

  function manejarArchivo(e) {
    const archivo = e.target.files?.[0];

    if (!archivo) {
      return;
    }

    setFotoPerfil(archivo);
    setPreviewFoto(URL.createObjectURL(archivo));
    setErrorCamara("");
  }

  function manejarSiguiente() {
    cerrarCamara();

    onSiguiente({
      foto_perfil: fotoPerfil,
      previewFoto: previewFoto || fotoDefault,
    });
  }

  return (
    <main className="pantallaRegistro2">
      <header className="registro2Header">
        <button className="registro2Volver" type="button" onClick={onVolver}>
          ←
        </button>

        <h1 className="registro2Logo">FanMeet</h1>
      </header>

      <section className="registro2Contenido">
        <div className="registro2ProgresoInfo">
          <span>PASO 2 DE 3</span>
          <span>66%</span>
        </div>

        <div className="registro2Barra">
          <div className="registro2BarraActiva"></div>
        </div>

        <h2 className="registro2Titulo">Foto de perfil</h2>

        <div className="registro2FotoWrapper">
          <div className="registro2Foto">
            <img
              className="registro2FotoPreview"
              src={previewFoto}
              alt="Foto de perfil"
            />
          </div>

          <button
            className="registro2BotonMas"
            type="button"
            onClick={abrirLibreria}
          >
            +
          </button>
        </div>

        <p className="registro2TextoOpcional">
          Podés agregar una foto o continuar con la imagen por defecto.
        </p>

        {errorCamara && <p className="registro2Error">{errorCamara}</p>}

        {camaraAbierta && (
          <div className="registro2Camara">
            <video
              ref={videoRef}
              className="registro2Video"
              autoPlay
              playsInline
            />

            <div className="registro2CamaraBotones">
              <button
                className="registro2BotonCamaraSecundario"
                type="button"
                onClick={cerrarCamara}
              >
                Cancelar
              </button>

              <button
                className="registro2BotonCamaraPrincipal"
                type="button"
                onClick={sacarFoto}
              >
                Sacar foto
              </button>
            </div>

            <canvas ref={canvasRef} hidden />
          </div>
        )}

        {!camaraAbierta && (
          <div className="registro2Opciones">
            <button
              className="registro2Opcion"
              type="button"
              onClick={abrirCamara}
            >
              <span className="registro2OpcionIcono camara">▣</span>

              <span className="registro2OpcionTexto">
                <strong>Tomar foto</strong>
                <small>Usá tu cámara</small>
              </span>

              <span className="registro2Flecha">›</span>
            </button>

            <button
              className="registro2Opcion"
              type="button"
              onClick={abrirLibreria}
            >
              <span className="registro2OpcionIcono libreria">▧</span>

              <span className="registro2OpcionTexto">
                <strong>Elegir de librería</strong>
                <small>Seleccioná de tu dispositivo</small>
              </span>

              <span className="registro2Flecha">›</span>
            </button>
          </div>
        )}

        <input
          ref={inputLibreriaRef}
          type="file"
          accept="image/*"
          onChange={manejarArchivo}
          hidden
        />

        <button
          className="registro2BotonSiguiente"
          type="button"
          onClick={manejarSiguiente}
        >
          Siguiente
        </button>
      </section>
    </main>
  );
}

export default Registro2;