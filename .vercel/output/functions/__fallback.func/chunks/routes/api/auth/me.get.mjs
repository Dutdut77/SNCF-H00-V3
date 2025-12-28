import { d as defineEventHandler, u as useRuntimeConfig, e as getCookie } from '../../../nitro/nitro.mjs';
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

const me_get = defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const accessToken = getCookie(event, "access_token");
  if (!accessToken) return { user: null };
  try {
    const response = await $fetch(config.oidc.userinfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    if (response == null ? void 0 : response.sub) {
      return { user: response };
    }
    return { user: null };
  } catch (err) {
    console.warn("[getUserFromSession] access token invalide ou expir\xE9");
    return { user: null };
  }
});

export { me_get as default };
//# sourceMappingURL=me.get.mjs.map
