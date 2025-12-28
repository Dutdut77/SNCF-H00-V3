import { d as defineEventHandler, u as useRuntimeConfig, g as getQuery, b as sendRedirect } from '../../../nitro/nitro.mjs';
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

const login_get = defineEventHandler((event) => {
  const config = useRuntimeConfig();
  const query = getQuery(event);
  const redirectTo = query.redirect || "/";
  const redirectUri = `${config.public.baseUrl}/api/auth/callback`;
  const scope = "openid caiman";
  const authUrl = `${config.oidc.authUrl}?response_type=code&client_id=${config.oidc.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(redirectTo)}`;
  return sendRedirect(event, authUrl);
});

export { login_get as default };
//# sourceMappingURL=login.get.mjs.map
