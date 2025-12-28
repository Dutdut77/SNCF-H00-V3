import { mergeModels, computed, mergeProps, useModel, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderAttr, ssrInterpolate, ssrRenderDynamicModel, ssrRenderTeleport, ssrRenderClass, ssrRenderComponent, ssrRenderSlot } from 'vue/server-renderer';
import { d as __nuxt_component_1 } from './server.mjs';

const _sfc_main$1 = {
  __name: "AppInput",
  __ssrInlineRender: true,
  props: {
    title: {
      type: String,
      default: ""
    },
    name: {
      type: String,
      default: ""
    },
    type: {
      type: String,
      default: "text"
    },
    placeholder: {
      type: String,
      default: "Entrez votre texte"
    },
    modelValue: {
      default: null
    },
    required: {
      type: Boolean,
      default: false
    }
  },
  emits: ["update:model-value"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emits = __emit;
    const inputValue = computed({
      get() {
        return props.modelValue;
      },
      set(value) {
        emits("update:model-value", value);
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "w-full break-inside-avoid" }, _attrs))}><label${ssrRenderAttr("for", props.name)} class="block text-sm">${ssrInterpolate(props.title)} `);
      if (props.required) {
        _push(`<span class="text-red-500">*</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</label><div class="mt-0.5"><input class="focus:border-primary-500 focus:ring-primary-500 w-full appearance-none rounded-md border border-gray-300 px-2 py-1.5 text-sm leading-tight text-gray-700 focus:ring-1 focus:outline-none" autocomplete="off"${ssrRenderAttr("placeholder", props.placeholder)}${ssrRenderAttr("id", props.name)}${ssrRenderAttr("name", props.name)}${ssrRenderAttr("type", props.type)}${ssrRenderAttr("value", props.modelValue)}${ssrRenderDynamicModel(props.type, inputValue.value, props.modelValue)}></div></div>`);
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/app/input.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = {
  __name: "AppModal",
  __ssrInlineRender: true,
  props: /* @__PURE__ */ mergeModels({
    // Taille du modal : 'sm', 'md', 'lg', 'xl', 'full'
    size: {
      type: String,
      default: "md"
    },
    // Fermer en cliquant sur le backdrop
    closeOnBackdrop: {
      type: Boolean,
      default: true
    },
    // Fermer avec la touche Escape
    closeOnEscape: {
      type: Boolean,
      default: true
    },
    // Afficher le bouton de fermeture (X)
    showCloseButton: {
      type: Boolean,
      default: true
    },
    // Empêcher la fermeture (utile pendant un chargement)
    persistent: {
      type: Boolean,
      default: false
    }
  }, {
    "modelValue": { type: Boolean, default: false },
    "modelModifiers": {}
  }),
  emits: /* @__PURE__ */ mergeModels(["close"], ["update:modelValue"]),
  setup(__props, { expose: __expose, emit: __emit }) {
    const model = useModel(__props, "modelValue");
    const props = __props;
    const emit = __emit;
    const sizeClasses = computed(() => {
      const sizes = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
        "2xl": "max-w-2xl",
        full: "max-w-dwh "
      };
      return sizes[props.size] || sizes.md;
    });
    const close = () => {
      if (!props.persistent) {
        model.value = false;
        emit("close");
      }
    };
    __expose({ close });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Icon = __nuxt_component_1;
      ssrRenderTeleport(_push, (_push2) => {
        if (model.value) {
          _push2(`<div class="fixed inset-0 z-[100] flex items-center justify-center p-4"><div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>`);
          if (model.value) {
            _push2(`<div class="${ssrRenderClass([unref(sizeClasses), "relative w-full bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"])}">`);
            if (__props.showCloseButton && !__props.persistent) {
              _push2(`<button type="button" class="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">`);
              _push2(ssrRenderComponent(_component_Icon, {
                name: "lucide:x",
                size: "18"
              }, null, _parent));
              _push2(`</button>`);
            } else {
              _push2(`<!---->`);
            }
            if (_ctx.$slots.header) {
              _push2(`<div class="px-6 pt-6 pb-4 pr-12">`);
              ssrRenderSlot(_ctx.$slots, "header", {}, null, _push2, _parent);
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div class="${ssrRenderClass([{ "pt-6": !_ctx.$slots.header }, "px-6 pb-6 overflow-auto flex-1"])}">`);
            ssrRenderSlot(_ctx.$slots, "default", {}, null, _push2, _parent);
            _push2(`</div>`);
            if (_ctx.$slots.footer) {
              _push2(`<div class="px-6 pb-6 pt-2 border-t border-gray-100 dark:border-gray-700">`);
              ssrRenderSlot(_ctx.$slots, "footer", {}, null, _push2, _parent);
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div>`);
          } else {
            _push2(`<!---->`);
          }
          _push2(`</div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/app/modal.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main$1 as _, _sfc_main as a };
//# sourceMappingURL=modal-DW8NcVL0.mjs.map
