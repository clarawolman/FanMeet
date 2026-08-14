import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "./env.js";

// Este proyecto Supabase firma los access_token con una clave asimétrica
// (ES256, "JWT Signing Keys"), no con el secreto compartido HS256 clásico.
// Se verifica contra el JWKS público del proyecto, con cache automático
// que hace la propia librería (no hay que resolverlo en cada request).
const JWKS = createRemoteJWKSet(new URL(`${env.supabaseUrl}/auth/v1/.well-known/jwks.json`));

export async function verificarToken(token) {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: `${env.supabaseUrl}/auth/v1`,
    audience: "authenticated",
  });
  return payload;
}
