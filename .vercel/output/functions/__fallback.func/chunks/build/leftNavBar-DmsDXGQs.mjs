import { d as __nuxt_component_1 } from './server.mjs';
import { mergeModels, useModel, ref, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderClass, ssrRenderComponent, ssrRenderStyle, ssrRenderList, ssrRenderAttr } from 'vue/server-renderer';

const _sfc_main = {
  __name: "AppLeftNavBar",
  __ssrInlineRender: true,
  props: /* @__PURE__ */ mergeModels({
    items: {
      type: Array,
      required: true
    },
    title: {
      type: String,
      default: "Menu"
    }
  }, {
    "modelValue": {},
    "modelModifiers": {}
  }),
  emits: ["update:modelValue"],
  setup(__props) {
    const props = __props;
    const selected = useModel(__props, "modelValue");
    const expandedItems = ref(null);
    const isOpen = ref(false);
    const calcHauteur = (children) => {
      const result = children.length * 36;
      return { height: `${result}px` };
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Icon = __nuxt_component_1;
      _push(`<section${ssrRenderAttrs(mergeProps({ class: "h-full w-full px-4" }, _attrs))}>`);
      if (props.title) {
        _push(`<div class="from-primary-400 border-primary-500 to-primary-500 mb-4 flex cursor-pointer items-center justify-center gap-2 rounded border bg-linear-to-br py-1 text-xl font-semibold text-white lg:mb-0 lg:cursor-default lg:justify-start lg:border-0 lg:from-transparent lg:to-transparent lg:py-0 lg:pb-4 lg:text-gray-700"><p class="text-base lg:text-lg">${ssrInterpolate(props.title)}</p><span class="${ssrRenderClass([{ "rotate-90": unref(isOpen) }, "transition-transform duration-300 lg:hidden"])}">`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:chevron-right",
          size: "20"
        }, null, _parent));
        _push(`</span></div>`);
      } else {
        _push(`<div class="from-primary-700/20 border-primary-700/30 to-primary-700/20 mb-4 flex cursor-pointer items-center justify-center gap-2 rounded border bg-linear-to-br py-1 text-xl font-semibold text-gray-700 lg:mb-0 lg:hidden lg:cursor-default lg:justify-start lg:border-0 lg:from-transparent lg:to-transparent lg:py-0 lg:pb-4 lg:text-gray-700"><p class="text-base lg:text-lg">Sommaire</p><span class="${ssrRenderClass([{ "rotate-90": unref(isOpen) }, "transition-transform duration-300 lg:hidden"])}">`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:chevron-right",
          size: "20"
        }, null, _parent));
        _push(`</span></div>`);
      }
      _push(`<div style="${ssrRenderStyle({
        height: unref(isOpen) ? "auto" : "0"
      })}" class="${ssrRenderClass([{ "lg:h-auto": true }, "overflow-hidden transition-all duration-300 lg:overflow-visible"])}"><!--[-->`);
      ssrRenderList(props.items, (item) => {
        _push(`<div class="border-l-muted cursor-pointer pt-1"><div class="${ssrRenderClass([
          item.value === selected.value ? "from-primary-600 to-primary-800 hover:bg-primary-700 bg-linear-to-br hover:text-white" : "hover:text-gray-900",
          "hover:bg-primary-700/20 group flex h-9 items-center gap-1 rounded-md px-3 py-1.5"
        ])}"${ssrRenderAttr("aria-expanded", item.children ? unref(expandedItems) === item.value : void 0)}${ssrRenderAttr("aria-controls", item.children ? `submenu-${item.value}` : void 0)}>`);
        _push(ssrRenderComponent(_component_Icon, {
          name: item.icon,
          size: "20",
          class: ["transition-colors duration-200", item.value === selected.value ? "text-white" : "text-gray-700"]
        }, null, _parent));
        _push(`<div class="${ssrRenderClass([item.value === selected.value ? "text-white" : "", "text-sm font-medium transition-colors duration-200"])}">${ssrInterpolate(item.label)}</div>`);
        if (item.badge) {
          _push(`<div class="ml-auto flex w-8 justify-center"><div class="${ssrRenderClass([
            item.value === selected.value ? "text-primary-600 bg-white" : "bg-primary-700/20 text-primary-800 group-hover:bg-primary-700/30",
            "bg-primary-700/20 w-full rounded border text-center text-xs font-semibold"
          ])}">${ssrInterpolate(item.badge)}</div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (item.children) {
          _push(`<div class="${ssrRenderClass([item.value === unref(expandedItems) ? "rotate-90" : "", "ml-auto flex w-8 justify-center transition-transform duration-300"])}">`);
          _push(ssrRenderComponent(_component_Icon, {
            name: "lucide:chevron-right",
            size: "20",
            class: "rounded-full font-bold"
          }, null, _parent));
          _push(`</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        if (item.children) {
          _push(`<div${ssrRenderAttr("id", `submenu-${item.value}`)} class="overflow-hidden pl-5.5 transition-all duration-300" style="${ssrRenderStyle(item.value === unref(expandedItems) ? calcHauteur(item.children) : { height: "0px" })}"><!--[-->`);
          ssrRenderList(item.children, (child) => {
            _push(`<div class="border-l-muted h-9 cursor-pointer border-l pl-4"><div class="${ssrRenderClass([
              child.value === selected.value ? "from-primary-600 to-primary-800 hover:bg-primary-700/20 bg-linear-to-br text-white" : "text-gray-700 hover:text-gray-900",
              "hover:bg-primary-700/20 group flex h-full items-center gap-1 rounded-md px-3"
            ])}"><div class="text-sm font-medium transition-colors duration-200">${ssrInterpolate(child.label)}</div>`);
            if (child.badge) {
              _push(`<div class="ml-auto flex w-8 justify-center"><div class="w-full rounded text-center text-xs font-semibold">${ssrInterpolate(child.badge)}</div></div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div></div>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      });
      _push(`<!--]--></div></section>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/app/leftNavBar.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as _ };
//# sourceMappingURL=leftNavBar-DmsDXGQs.mjs.map
