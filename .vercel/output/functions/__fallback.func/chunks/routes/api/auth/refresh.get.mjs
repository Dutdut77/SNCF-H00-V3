import { d as defineEventHandler, r as refreshOidcToken, e as getCookie, f as findUserByEmail, a as generateSupabaseJwt, s as setCookie } from '../../../nitro/nitro.mjs';
import { s as serverSupabaseServiceRole, a as serverSupabaseClient } from '../../../_/serverSupabaseServiceRole.mjs';
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
import '@supabase/ssr';
import '@supabase/functions-js';
import '@supabase/postgrest-js';
import '@supabase/realtime-js';
import '@supabase/storage-js';
import '@supabase/auth-js';

const refresh_get = defineEventHandler(async (event) => {
  const service = serverSupabaseServiceRole(event);
  const supabase = await serverSupabaseClient(event);
  const data = await refreshOidcToken(event);
  const refreshToken = getCookie(event, "refresh_token");
  if (!data) {
    console.warn("[refresh] Aucun token retourn\xE9 par refreshOidcToken");
    return { user: null };
  }
  const { access_token, expires_in, id_token, userInfo } = data;
  const userFound = await findUserByEmail(service, userInfo.email);
  if (!userFound) {
    console.warn("[refresh] Utilisateur non trouv\xE9 dans Supabase Auth");
    return { user: null };
  }
  const userUuid = userFound.id;
  const supabaseJwt = generateSupabaseJwt(userUuid, userInfo.email);
  await supabase.auth.setSession({
    access_token: supabaseJwt,
    refresh_token: refreshToken
  });
  setCookie(event, "access_token", access_token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: expires_in || 3600
  });
  setCookie(event, "id_token", id_token, {
    httpOnly: true,
    secure: true,
    path: "/"
  });
  return { user: userInfo };
});

export { refresh_get as default };
//# sourceMappingURL=refresh.get.mjs.map
