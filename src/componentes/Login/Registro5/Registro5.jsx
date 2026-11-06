import { useRef, useState } from "react";
import "./Registro5.css";
import EncabezadoRegistro from "../EncabezadoRegistro";
import fotoDefault from "../../../assets/fotoDefault.png";

function Registro5({ datosIniciales = {}, cargando = false, onVolver, onFinalizar }) {
  const [fotoPerfil, setFotoPerfil] = useState(
    datosIniciales.foto_perfil || null
  );
  const [previewFoto, setPreviewFoto] = useState(
    datosIniciales.previewFoto || fotoDefault
  );
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
        setErrorCamara("No pudimos abrir la cámara. Revisá los permisos del navegador o elegí una foto.");
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
      setErrorCamara("No pudimos abrir la cámara. Revisá los permisos del navegador o elegí una foto.");
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
      setErrorCamara("No pudimos abrir la cámara. Revisá los permisos del navegador o elegí una foto.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const contexto = canvas.getContext("2d");
    contexto.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) {
        setErrorCamara("No pudimos abrir la cámara. Revisá los permisos del navegador o elegí una foto.");
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

  function manejarVolver() {
    cerrarCamara();

    onVolver({
      foto_perfil: fotoPerfil,
      previewFoto: previewFoto || fotoDefault,
    });
  }

  // Último paso: acá se crea la cuenta.
  function manejarFinalizar() {
    cerrarCamara();

    onFinalizar({
      foto_perfil: fotoPerfil,
      previewFoto: previewFoto || fotoDefault,
    });
  }

  // El paso es opcional: la cuenta se crea con la foto por defecto.
  function manejarOmitir() {
    cerrarCamara();

    onFinalizar({
      foto_perfil: null,
      previewFoto: fotoDefault,
    });
  }

  return (
    <main className="regPantalla">
      <EncabezadoRegistro paso={5} onVolver={manejarVolver} onOmitir={cargando ? undefined : manejarOmitir} />

      <section className="registro5Contenido">
        <div className="registro5Intro">
          <h1 className="regTitulo">Sumá una foto</h1>
          <p className="regBajada">
            Así te reconocen en los grupos y en la fila. Si preferís, seguí con la imagen por defecto.
          </p>
        </div>

        <div className="registro5FotoWrapper">
          <div className={`registro5Foto ${fotoPerfil ? "conFoto" : ""}`}>
            <img className="registro5FotoPreview" src={previewFoto} alt="Vista previa de tu foto de perfil" />
          </div>

          {!fotoPerfil && (
            <button
              className="registro5BotonMas"
              type="button"
              onClick={abrirLibreria}
              aria-label="Elegir una foto"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          )}
        </div>

        {errorCamara && (
          <p className="fmAvisoError registro5Error" role="alert">
            {errorCamara}
          </p>
        )}

        {camaraAbierta && (
          <div className="registro5Camara">
            <video ref={videoRef} className="registro5Video" autoPlay playsInline />

            <div className="registro5CamaraBotones">
              <button className="registro5BotonCamaraSecundario" type="button" onClick={cerrarCamara}>
                Cancelar
              </button>

              <button className="fmBotonPrimario registro5BotonCamaraPrincipal" type="button" onClick={sacarFoto}>
                Sacar foto
              </button>
            </div>

            <canvas ref={canvasRef} hidden />
          </div>
        )}

        {!camaraAbierta && (
          <div className="registro5Opciones">
            <button className="registro5Opcion" type="button" onClick={abrirCamara}>
              <span className="registro5OpcionIcono" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                  <circle cx="12" cy="13" r="3.5" />
                </svg>
              </span>

              <span className="registro5OpcionTexto">
                <strong>Sacar una foto</strong>
                <small>Con la cámara</small>
              </span>

              <svg className="registro5Flecha" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>

            <button className="registro5Opcion" type="button" onClick={abrirLibreria}>
              <span className="registro5OpcionIcono" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
                  <circle cx="9" cy="10" r="1.6" />
                  <path d="M20.5 16l-5-5-8 8.5" />
                </svg>
              </span>

              <span className="registro5OpcionTexto">
                <strong>Elegir de tus fotos</strong>
                <small>Desde este dispositivo</small>
              </span>

              <svg className="registro5Flecha" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        )}

        <input ref={inputLibreriaRef} type="file" accept="image/*" onChange={manejarArchivo} hidden />

        <button className="fmBotonPrimario regBotonSiguiente registro5Siguiente" type="button" disabled={cargando} onClick={manejarFinalizar}>
          {cargando ? "Creando tu cuenta..." : "Crear mi cuenta"}
        </button>
      </section>
    </main>
  );
}

export default Registro5;