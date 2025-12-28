import { d as defineEventHandler, g as getQuery, c as createError, u as useRuntimeConfig, f as findUserByEmail, a as generateSupabaseJwt, s as setCookie, b as sendRedirect } from '../../../nitro/nitro.mjs';
import { v4 } from 'uuid';
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

const callback_get = defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const query = getQuery(event);
  const service = serverSupabaseServiceRole(event);
  const supabase = await serverSupabaseClient(event);
  const code = query.code;
  if (!code) {
    throw createError({ statusCode: 400, statusMessage: "Missing OIDC code" });
  }
  const tokenResponse = await $fetch(config.oidc.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${config.oidc.clientId}:${config.oidc.clientSecret}`).toString("base64")
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${config.public.baseUrl}/api/auth/callback`
    })
  });
  if (!tokenResponse.access_token) {
    throw createError({ statusCode: 401, statusMessage: "Failed to obtain access token" });
  }
  const userInfo = await $fetch(config.oidc.userinfoUrl, {
    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
  });
  const userFound = await findUserByEmail(service, userInfo.email);
  let userUuid;
  let isNewUser = false;
  if (userFound) {
    userUuid = userFound.id;
  } else {
    isNewUser = true;
    userUuid = v4();
    const { data: newUser, error: createUserError } = await service.auth.admin.createUser({
      id: userUuid,
      email: userInfo.email,
      email_confirm: true,
      user_metadata: {
        oidc_id: userInfo.sub,
        displayName: userInfo.name,
        prenom: userInfo.given_name,
        nom: userInfo.family_name
      }
    });
    if (createUserError) {
      console.error("[callback] Erreur cr\xE9ation utilisateur auth.users:", createUserError);
      throw createError({ statusCode: 500, statusMessage: "Failed to create user in auth" });
    }
  }
  try {
    if (isNewUser) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    const { data: existingUser, error: checkError } = await service.from("users").select("id, auth_uuid").eq("email", userInfo.email).maybeSingle();
    if (existingUser) {
      if (!existingUser.auth_uuid) {
        const { error: updateError } = await service.from("users").update({
          auth_uuid: userUuid,
          oidc_id: userInfo.sub,
          nom: userInfo.family_name || null,
          prenom: userInfo.given_name || null,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }).eq("id", existingUser.id);
        if (updateError) {
          console.warn("[callback] Erreur lors de la mise \xE0 jour de l'utilisateur:", updateError);
        }
      }
    } else if ((checkError == null ? void 0 : checkError.code) !== "PGRST116") {
      const { error: insertUserError } = await service.from("users").insert({
        id: userUuid,
        email: userInfo.email,
        oidc_id: userInfo.sub,
        auth_uuid: userUuid,
        prenom: userInfo.given_name || null,
        nom: userInfo.family_name || null,
        profils: -1,
        // profil visiteur
        role: 0
        // 0 = aucun, 1 = admin, 2 = superadmin
      });
      if (insertUserError) {
        console.warn("[callback] Erreur lors de la cr\xE9ation de l'utilisateur dans users:", insertUserError);
      }
    }
  } catch (userCreationError) {
    console.warn("[callback] Erreur lors de la v\xE9rification/cr\xE9ation de l'utilisateur dans users:", userCreationError);
  }
  const supabaseJwt = generateSupabaseJwt(userUuid, userInfo.email);
  await supabase.auth.setSession({
    access_token: supabaseJwt,
    refresh_token: tokenResponse.refresh_token
  });
  setCookie(event, "access_token", tokenResponse.access_token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: tokenResponse.expires_in || 3600
  });
  setCookie(event, "refresh_token", tokenResponse.refresh_token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
    // 30 jours
  });
  setCookie(event, "id_token", tokenResponse.id_token, {
    httpOnly: true,
    path: "/",
    secure: true
  });
  const redirect = query.redirect || "/";
  return sendRedirect(event, redirect);
});

export { callback_get as default };
//# sourceMappingURL=callback.get.mjs.map
