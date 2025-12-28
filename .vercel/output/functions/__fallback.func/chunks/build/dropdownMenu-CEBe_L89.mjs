import { defineComponent, mergeModels, useModel, ref, watch, nextTick, mergeProps, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderClass, ssrRenderSlot, ssrRenderTeleport, ssrRenderStyle } from 'vue/server-renderer';
import { j as _export_sfc } from './server.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "dropdownMenu",
  __ssrInlineRender: true,
  props: /* @__PURE__ */ mergeModels({
    trigger: { type: String, default: "click" },
    // 'click' | 'hover'
    offset: { type: Number, default: 4 },
    // space between trigger and menu
    hoverOpenDelay: { type: Number, default: 50 },
    // ms
    hoverCloseDelay: { type: Number, default: 0 },
    // ms (0 = immediate close)
    fullWidth: { type: Boolean, default: false },
    // w-full mode
    matchTriggerWidth: { type: Boolean, default: false }
    // menu takes trigger width
  }, {
    "open": { default: false },
    "openModifiers": {}
  }),
  emits: ["update:open"],
  setup(__props) {
    const props = __props;
    const isOpen = useModel(__props, "open");
    const triggerRef = ref(null);
    const menuRef = ref(null);
    const positionStyle = ref({ top: "0px", left: "0px" });
    let positionRaf = null;
    function cancelScheduledPosition() {
      if (positionRaf) {
        (void 0).cancelAnimationFrame(positionRaf);
        positionRaf = null;
      }
    }
    function schedulePositionUpdate() {
      cancelScheduledPosition();
      positionRaf = (void 0).requestAnimationFrame(() => {
        updatePosition();
        positionRaf = null;
      });
    }
    function clamp(n, min, max) {
      return Math.max(min, Math.min(max, n));
    }
    function updatePosition() {
      if (!triggerRef.value || !menuRef.value) return;
      const triggerRect = triggerRef.value.getBoundingClientRect();
      const menuRect = menuRef.value.getBoundingClientRect();
      const vw = (void 0).innerWidth;
      const vh = (void 0).innerHeight;
      const canPlaceBelow = triggerRect.bottom + props.offset + menuRect.height <= vh;
      const canPlaceAbove = triggerRect.top - props.offset - menuRect.height >= 0;
      const placeAbove = !canPlaceBelow && canPlaceAbove;
      let left;
      const viewportPadding = 12;
      if (props.matchTriggerWidth || props.fullWidth) {
        left = triggerRect.left;
      } else {
        left = triggerRect.left + triggerRect.width / 2 - menuRect.width / 2;
        const maxLeft = Math.max(viewportPadding, vw - menuRect.width - viewportPadding);
        if (left + menuRect.width > vw - viewportPadding) {
          left = maxLeft;
        }
        if (left < viewportPadding) {
          left = viewportPadding;
        }
        left = clamp(left, viewportPadding, maxLeft);
      }
      const top = placeAbove ? triggerRect.top - props.offset - menuRect.height : triggerRect.bottom + props.offset;
      positionStyle.value = {
        top: `${top + (void 0).scrollY}px`,
        left: `${left + (void 0).scrollX}px`,
        ...props.matchTriggerWidth && { width: `${triggerRect.width}px` }
      };
    }
    function close() {
      isOpen.value = false;
    }
    function handleDocumentClick(e) {
      if (!menuRef.value || !triggerRef.value) return;
      const target = e.target;
      if (!menuRef.value.contains(target) && !triggerRef.value.contains(target)) {
        close();
      }
    }
    function handleEscape(e) {
      if (e.key === "Escape") close();
    }
    function addWindowListeners() {
      (void 0).addEventListener("resize", updatePosition);
      (void 0).addEventListener("scroll", updatePosition, true);
      (void 0).addEventListener("mousedown", handleDocumentClick, true);
      (void 0).addEventListener("keydown", handleEscape);
    }
    function removeWindowListeners() {
      (void 0).removeEventListener("resize", updatePosition);
      (void 0).removeEventListener("scroll", updatePosition, true);
      (void 0).removeEventListener("mousedown", handleDocumentClick, true);
      (void 0).removeEventListener("keydown", handleEscape);
    }
    watch(isOpen, (v) => {
      if (v) {
        nextTick(schedulePositionUpdate);
        addWindowListeners();
      } else {
        cancelScheduledPosition();
        removeWindowListeners();
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: props.fullWidth ? "block w-full" : "inline-block"
      }, _attrs))} data-v-baad2ae1><div class="${ssrRenderClass(props.fullWidth ? "block w-full" : "inline-block")}" tabindex="0" data-v-baad2ae1>`);
      ssrRenderSlot(_ctx.$slots, "trigger", {}, null, _push, _parent);
      _push(`</div>`);
      ssrRenderTeleport(_push, (_push2) => {
        if (isOpen.value) {
          _push2(`<div class="absolute z-100 -mt-1 pt-0.5" style="${ssrRenderStyle(positionStyle.value)}" data-v-baad2ae1><div class="rounded-lg border border-neutral-200 bg-white p-2 shadow-xl dark:border-neutral-700 dark:bg-neutral-900" data-v-baad2ae1>`);
          ssrRenderSlot(_ctx.$slots, "default", {}, null, _push2, _parent);
          _push2(`</div></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/app/dropdownMenu.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_2 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main, [["__scopeId", "data-v-baad2ae1"]]), { __name: "AppDropdownMenu" });

export { __nuxt_component_2 as _ };
//# sourceMappingURL=dropdownMenu-CEBe_L89.mjs.map
