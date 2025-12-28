import { j as _export_sfc, d as __nuxt_component_1$1 } from './server.mjs';
import { mergeModels, useModel, mergeProps, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr } from 'vue/server-renderer';

const _sfc_main = {
  __name: "AppInputSearch",
  __ssrInlineRender: true,
  props: /* @__PURE__ */ mergeModels({
    placeholder: {
      type: String,
      default: "Rechercher"
    }
  }, {
    "modelValue": { default: "" },
    "modelModifiers": {}
  }),
  emits: ["update:modelValue"],
  setup(__props) {
    const props = __props;
    const model = useModel(__props, "modelValue");
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Icon = __nuxt_component_1$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "w-full break-inside-avoid" }, _attrs))} data-v-14f42976><div class="relative text-gray-600 focus-within:text-gray-400" data-v-14f42976><span class="absolute inset-y-0 left-0 text-gray-400 flex items-center pl-3" data-v-14f42976>`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "i-lucide-search",
        size: "20"
      }, null, _parent));
      _push(`</span><input type="text" name="search"${ssrRenderAttr("value", model.value)}${ssrRenderAttr("placeholder", props.placeholder)} autocomplete="off" class="h-12 pl-11 pr-10 bg-transparent border-b border-gray-300 text-sm py-2 w-full text-gray-700 focus:outline-none focus:border-primary-500 focus:ring-0 placeholder:text-gray-400" data-v-14f42976>`);
      if (model.value) {
        _push(`<button type="button" class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-red-500 transition-colors duration-200 cursor-pointer" title="Effacer la recherche" data-v-14f42976>`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "i-lucide-x",
          size: "18"
        }, null, _parent));
        _push(`</button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/app/inputSearch.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_1 = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-14f42976"]]);

export { __nuxt_component_1 as _ };
//# sourceMappingURL=inputSearch-Xv57A_RG.mjs.map
