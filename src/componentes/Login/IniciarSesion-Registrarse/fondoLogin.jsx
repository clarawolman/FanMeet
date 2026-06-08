import "./fondoLogin.css";
import imLogo from "../../../assets/imLogo.png";

function FondoLogin() {
  return (
    <div className="fondoLogin" aria-hidden="true">
      <img className="fondoLoginImagen" src={imLogo} alt="" />
    </div>
  );
}

export default FondoLogin;