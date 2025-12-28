import { d as __nuxt_component_1 } from './server.mjs';
import { mergeModels, useModel, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderClass, ssrIncludeBooleanAttr, ssrRenderComponent, ssrInterpolate } from 'vue/server-renderer';

const _sfc_main = {
  __name: "AppCheckbox",
  __ssrInlineRender: true,
  props: /* @__PURE__ */ mergeModels({
    value: { default: null },
    // pour multiselect
    label: { default: "" },
    disabled: { default: false }
  }, {
    "modelValue": { default: false },
    "modelModifiers": {}
  }),
  emits: ["update:modelValue"],
  setup(__props) {
    const props = __props;
    const model = useModel(__props, "modelValue");
    const isChecked = computed(() => {
      if (Array.isArray(model.value)) {
        return model.value.includes(props.value);
      }
      return model.value;
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Icon = __nuxt_component_1;
      _push(`<label${ssrRenderAttrs(mergeProps({ class: "flex cursor-pointer items-center gap-2 select-none" }, _attrs))}><input type="checkbox" class="peer sr-only"${ssrIncludeBooleanAttr(unref(isChecked)) ? " checked" : ""}><div class="${ssrRenderClass([unref(isChecked) ? "bg-secondary-900 border-secondary-900" : "border-gray-300 bg-white", "flex h-4 w-4 items-center justify-center rounded border"])}">`);
      if (unref(isChecked)) {
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:check",
          size: "14",
          class: "text-white"
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/app/checkbox.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as _ };
//# sourceMappingURL=checkbox-BtivfJtA.mjs.map
