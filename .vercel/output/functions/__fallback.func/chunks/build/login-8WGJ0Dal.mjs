import { u as useHead, e as _imports_0, _ as _sfc_main$2 } from './server.mjs';
import { mergeProps, withCtx, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderAttr, ssrRenderComponent } from 'vue/server-renderer';
import '../nitro/nitro.mjs';
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
import 'vue-router';
import '@supabase/ssr';
import '@iconify/vue';
import '@iconify/utils/lib/css/icon';
import 'perfect-debounce';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';

const _sfc_main = {
  __name: "login",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({
      title: "H00 - Login",
      description: "Page de connexion"
    });
    const redirectToAuth = () => {
      const currentUrl = new URL((void 0).location.href);
      const redirectUrl = currentUrl.searchParams.get("redirect") || "/";
      (void 0).location.href = `/api/auth/login?redirect=${encodeURIComponent(redirectUrl)}`;
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppButtonValidated = _sfc_main$2;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex h-dvh w-full flex-col items-center justify-center" }, _attrs))}><div class="relative flex h-full w-full flex-col items-center bg-radial-[at_50%_50%] from-emerald-800/20 via-emerald-800/10 to-white pt-8 lg:justify-center lg:pt-0"><div class="absolute top-8 right-8"><button variant="subtle"></button></div><div class="flex h-auto w-2/3 flex-col items-center gap-8 pt-8 md:justify-center lg:pt-0 lg:pb-16"><img${ssrRenderAttr("src", _imports_0)} alt="Logo" class="w-48"><div class="flex flex-col items-center justify-start gap-2 text-center text-4xl text-slate-800 md:text-5xl"><p class="font-[Pacifico] drop-shadow-lg">H00 Travaux</p></div><p class="text-center text-slate-600 md:px-8"> Connectez-vous pour accéder à votre espace personnel et gérer efficacement vos taches quotidiennes. Accédez à vos chantiers assignées, suivez l&#39;avancement de vos travaux et communiquez facilement avec vos collègues. </p><div>`);
      _push(ssrRenderComponent(_component_AppButtonValidated, {
        class: "w-32",
        theme: "",
        onClick: ($event) => redirectToAuth()
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Se connecter`);
          } else {
            return [
              createTextVNode("Se connecter")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div></div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/login.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=login-8WGJ0Dal.mjs.map
