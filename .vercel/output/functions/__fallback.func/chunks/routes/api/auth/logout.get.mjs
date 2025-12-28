import { d as defineEventHandler, e as getCookie, u as useRuntimeConfig, c as createError, s as setCookie } from '../../../nitro/nitro.mjs';
import 'jsonwebtoken';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import '@iconify/utils';
import 'consola';

const logout_get = defineEventHandler(async (event) => {
  const idToken = getCookie(event, "id_token");
  const config = useRuntimeConfig();
  if (!idToken) {
    throw createError({ statusCode: 400, statusMessage: "Token manquant" });
  }
  const endSessionUrl = `${config.oidc.endSessionUrl}?id_token_hint=${idToken}`;
  try {
    await $fetch(endSessionUrl, {
      method: "GET"
    });
  } catch (error) {
    console.error("Erreur lors de la fermeture de la session :", error);
    throw createError({ statusCode: 400, message: "Erreur de d\xE9connexion" });
  }
  setCookie(event, "access_token", "", { maxAge: -1 });
  setCookie(event, "id_token", "", { maxAge: -1 });
  setCookie(event, "refresh_token", "", { maxAge: -1 });
  setCookie(event, "supabase_jwt", "", { maxAge: -1 });
  setCookie(event, "sb-127-auth-token", "", { maxAge: -1 });
  return { message: "D\xE9connexion r\xE9ussie" };
});

export { logout_get as default };
//# sourceMappingURL=logout.get.mjs.map
