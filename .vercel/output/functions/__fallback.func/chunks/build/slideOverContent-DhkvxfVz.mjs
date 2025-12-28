import { k as __nuxt_component_0, d as __nuxt_component_1 } from './server.mjs';
import { mergeProps, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderTeleport, ssrRenderComponent, ssrRenderSlot } from 'vue/server-renderer';

const _sfc_main$1 = {
  __name: "AppSlideOver",
  __ssrInlineRender: true,
  props: ["closeSideModal", "sideModal"],
  setup(__props) {
    const props = __props;
    return (_ctx, _push, _parent, _attrs) => {
      const _component_client_only = __nuxt_component_0;
      _push(`<section${ssrRenderAttrs(_attrs)}>`);
      ssrRenderTeleport(_push, (_push2) => {
        if (props.sideModal) {
          _push2(`<div class="absolute top-0 right-0 z-60 h-dvh w-full bg-slate-800/80 backdrop-blur-sm"></div>`);
        } else {
          _push2(`<!---->`);
        }
        _push2(ssrRenderComponent(_component_client_only, null, {}, _parent));
      }, "body", false, _parent);
      _push(`</section>`);
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/app/slideOver.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = {
  __name: "AppSlideOverContent",
  __ssrInlineRender: true,
  props: ["closeSideModal"],
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Icon = __nuxt_component_1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "relative flex h-dvh min-h-dvh w-full justify-start bg-white text-gray-700 shadow-2xl dark:bg-gray-900 dark:text-gray-300" }, _attrs))}><div class="from-primary-500 to-primary-600 absolute top-8 -left-6 z-20 flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl bg-linear-to-br duration-300 hover:scale-105 hover:shadow-lg">`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:x",
        size: "20",
        class: "text-white"
      }, null, _parent));
      _push(`</div><div class="relative flex h-full w-full flex-col items-center justify-start gap-4 overflow-auto p-6"><div class="flex w-full flex-col items-center gap-2">`);
      ssrRenderSlot(_ctx.$slots, "header", {}, null, _push, _parent);
      _push(`</div><div class="flex w-full grow flex-col px-2">`);
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`</div><div class="mt-auto w-full">`);
      ssrRenderSlot(_ctx.$slots, "footer", {}, null, _push, _parent);
      _push(`</div></div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/app/slideOverContent.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main$1 as _, _sfc_main as a };
//# sourceMappingURL=slideOverContent-DhkvxfVz.mjs.map
