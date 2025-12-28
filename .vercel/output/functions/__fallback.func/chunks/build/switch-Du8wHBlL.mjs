import { mergeModels, useModel, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderAttr, ssrRenderClass, ssrIncludeBooleanAttr, ssrLooseContain, ssrInterpolate, ssrRenderSlot } from 'vue/server-renderer';
import { j as _export_sfc } from './server.mjs';

const _sfc_main$1 = {
  __name: "AppPageLayout",
  __ssrInlineRender: true,
  props: {
    sidebarWidth: {
      type: String,
      default: "w-64"
      // 256px par défaut
    }
  },
  setup(__props) {
    const props = __props;
    const sidebarWidthMap = {
      "w-48": "12rem",
      // 192px
      "w-56": "14rem",
      // 224px
      "w-64": "16rem",
      // 256px
      "w-72": "18rem",
      // 288px
      "w-80": "20rem",
      // 320px
      "w-96": "24rem"
      // 384px
    };
    sidebarWidthMap[props.sidebarWidth] || "16rem";
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "relative flex h-full w-full flex-col overflow-hidden lg:flex-row" }, _attrs))} data-v-665241a2><aside class="w-full lg:flex lg:h-full lg:w-80 lg:shrink-0 lg:flex-col" data-v-665241a2><div class="shrink-0 p-4 pb-0" data-v-665241a2>`);
      ssrRenderSlot(_ctx.$slots, "sidebar-header", {}, null, _push, _parent);
      _push(`</div><div class="flex-1 overflow-y-auto p-4 pt-0" data-v-665241a2>`);
      ssrRenderSlot(_ctx.$slots, "sidebar", {}, null, _push, _parent);
      _push(`</div><div class="shrink-0 pt-0 lg:p-4" data-v-665241a2>`);
      ssrRenderSlot(_ctx.$slots, "sidebar-footer", {}, null, _push, _parent);
      _push(`</div></aside><main class="flex-1 overflow-auto" data-v-665241a2><div class="p-4" data-v-665241a2>`);
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`</div></main></div>`);
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/app/pageLayout.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_0 = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-665241a2"]]);
const _sfc_main = {
  __name: "AppSwitch",
  __ssrInlineRender: true,
  props: /* @__PURE__ */ mergeModels({
    label: {
      type: String,
      default: ""
    },
    name: {
      type: String,
      default: ""
    },
    disabled: {
      type: Boolean,
      default: false
    },
    labelPosition: {
      type: String,
      default: "right"
      // 'left' | 'right'
    }
  }, {
    "modelValue": { default: false },
    "modelModifiers": {}
  }),
  emits: ["update:modelValue"],
  setup(__props) {
    const model = useModel(__props, "modelValue");
    const props = __props;
    const inputId = computed(() => props.name || `switch-${Math.random().toString(36).substr(2, 9)}`);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<label${ssrRenderAttrs(mergeProps({
        for: unref(inputId),
        class: ["inline-flex items-center gap-3 cursor-pointer select-none", [
          props.disabled ? "opacity-50 cursor-not-allowed" : "",
          props.labelPosition === "left" ? "flex-row-reverse" : ""
        ]]
      }, _attrs))}><input type="checkbox"${ssrRenderAttr("id", unref(inputId))}${ssrRenderAttr("name", props.name)}${ssrIncludeBooleanAttr(Array.isArray(model.value) ? ssrLooseContain(model.value, null) : model.value) ? " checked" : ""}${ssrIncludeBooleanAttr(props.disabled) ? " disabled" : ""} class="sr-only peer"><div class="${ssrRenderClass([[
        model.value ? "bg-primary-500" : "bg-gray-300 dark:bg-gray-600",
        !props.disabled && "peer-focus:ring-2 peer-focus:ring-primary-500/30"
      ], "relative w-11 h-6 rounded-full transition-colors duration-200"])}"><div class="${ssrRenderClass([model.value ? "translate-x-5.5" : "translate-x-0.5", "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200"])}"></div></div>`);
      if (props.label) {
        _push(`<span class="text-sm text-gray-700 dark:text-gray-300">${ssrInterpolate(props.label)}</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</label>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/app/switch.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { __nuxt_component_0 as _, _sfc_main as a };
//# sourceMappingURL=switch-Du8wHBlL.mjs.map
