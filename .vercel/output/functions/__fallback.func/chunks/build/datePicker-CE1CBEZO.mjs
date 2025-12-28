import { j as _export_sfc, d as __nuxt_component_1 } from './server.mjs';
import { mergeModels, useModel, ref, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderClass, ssrRenderComponent, ssrRenderTeleport, ssrRenderList } from 'vue/server-renderer';

const _sfc_main = {
  __name: "AppDatePicker",
  __ssrInlineRender: true,
  props: /* @__PURE__ */ mergeModels({
    placeholder: {
      type: String,
      default: "Choisissez une date"
    },
    title: {
      type: String,
      default: ""
    },
    report: {
      type: String,
      default: "body"
    },
    clearable: {
      type: Boolean,
      default: false
    }
  }, {
    "modelValue": { default: null },
    "modelModifiers": {}
  }),
  emits: ["update:modelValue"],
  setup(__props) {
    const model = useModel(__props, "modelValue");
    const props = __props;
    const isOpen = ref(false);
    const dropdownRef = ref(null);
    const currentMonth = ref(model.value ? new Date(model.value).getMonth() : (/* @__PURE__ */ new Date()).getMonth());
    const currentYear = ref(model.value ? new Date(model.value).getFullYear() : (/* @__PURE__ */ new Date()).getFullYear());
    const selectedDay = ref(model.value ? new Date(model.value).getDate() : (/* @__PURE__ */ new Date()).getDate());
    const selectedMonth = ref(currentMonth.value);
    const selectedYear = ref(currentYear.value);
    const showSelectMonth = ref(false);
    const showSelectYear = ref(false);
    const days = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];
    const months = [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre"
    ];
    const firstDayOfMonth = computed(() => {
      const firstDay = new Date(currentYear.value, currentMonth.value, 1).getDay();
      return (firstDay + 6) % 7;
    });
    const datesInMonth = computed(() => {
      const daysInMonth = new Date(currentYear.value, currentMonth.value + 1, 0).getDate();
      return Array.from({ length: daysInMonth }, (_, i) => i + 1);
    });
    const displayDate = computed(() => {
      if (!model.value) return null;
      const date = new Date(model.value);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    });
    const yearOptions = computed(() => {
      const years = [];
      for (let i = -6; i <= 6; i++) {
        years.push(currentYear.value + i);
      }
      return years;
    });
    const getDayClasses = (day) => {
      const isSelected = currentYear.value === selectedYear.value && currentMonth.value === selectedMonth.value && selectedDay.value === day;
      const isToday = (/* @__PURE__ */ new Date()).getDate() === day && (/* @__PURE__ */ new Date()).getMonth() === currentMonth.value && (/* @__PURE__ */ new Date()).getFullYear() === currentYear.value;
      return {
        "bg-primary-600 text-white font-medium shadow-sm": isSelected,
        "ring-2 ring-primary-300 dark:ring-primary-500": isToday && !isSelected,
        "hover:bg-gray-100 dark:hover:bg-gray-700": !isSelected
      };
    };
    const closePopups = () => {
      isOpen.value = false;
      showSelectMonth.value = false;
      showSelectYear.value = false;
    };
    const clearDate = () => {
      model.value = null;
      closePopups();
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Icon = __nuxt_component_1;
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: "relative w-full text-sm",
        ref_key: "dropdownRef",
        ref: dropdownRef
      }, _attrs))} data-v-73a6e843>`);
      if (props.title) {
        _push(`<label class="mb-0.5 block text-sm text-gray-700 dark:text-gray-300" data-v-73a6e843>${ssrInterpolate(props.title)}</label>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="relative" data-v-73a6e843><button type="button" class="${ssrRenderClass([unref(isOpen) ? "border-primary-500 ring-primary-500 ring-1" : "", "flex w-full cursor-pointer items-center gap-3 rounded-md border border-gray-300 bg-white px-3 py-1.5 transition-colors hover:border-gray-400 focus:border-gray-400 focus:ring-0 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500 dark:focus:border-gray-500"])}" data-v-73a6e843>`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:calendar",
        class: "h-4 w-4 text-gray-500 dark:text-gray-400"
      }, null, _parent));
      _push(`<span class="${ssrRenderClass([unref(displayDate) ? "text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-500", "flex-1 text-left"])}" data-v-73a6e843>${ssrInterpolate(unref(displayDate) || __props.placeholder)}</span>`);
      if (props.clearable && model.value) {
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:x",
          class: "h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
          onClick: clearDate
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</button></div>`);
      ssrRenderTeleport(_push, (_push2) => {
        if (unref(isOpen)) {
          _push2(`<div class="fixed inset-0 z-80 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm dark:bg-black/40" data-v-73a6e843><div class="border-primary-800 relative flex w-full max-w-xs flex-col overflow-hidden rounded-xl border bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900" data-v-73a6e843><div class="from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-900 bg-linear-to-br p-4" data-v-73a6e843><p class="text-xs font-medium tracking-wider text-white uppercase" data-v-73a6e843>Date sélectionnée</p><p class="mt-1 text-xl font-semibold text-white" data-v-73a6e843>${ssrInterpolate(unref(selectedDay))} ${ssrInterpolate(months[unref(selectedMonth)])} ${ssrInterpolate(unref(selectedYear))}</p></div><div class="flex items-center justify-between border-b border-gray-100 px-3 py-2 dark:border-gray-800" data-v-73a6e843><button type="button" class="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800" data-v-73a6e843>`);
          _push2(ssrRenderComponent(_component_Icon, {
            name: "lucide:chevron-left",
            class: "h-5 w-5"
          }, null, _parent));
          _push2(`</button><div class="flex items-center gap-1" data-v-73a6e843><button type="button" class="rounded-md px-2 py-1 font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800" data-v-73a6e843>${ssrInterpolate(months[unref(currentMonth)])}</button><button type="button" class="rounded-md px-2 py-1 font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800" data-v-73a6e843>${ssrInterpolate(unref(currentYear))}</button></div><button type="button" class="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800" data-v-73a6e843>`);
          _push2(ssrRenderComponent(_component_Icon, {
            name: "lucide:chevron-right",
            class: "h-5 w-5"
          }, null, _parent));
          _push2(`</button></div><div class="p-3" data-v-73a6e843><div class="mb-2 grid grid-cols-7 gap-1" data-v-73a6e843><!--[-->`);
          ssrRenderList(days, (day) => {
            _push2(`<div class="py-1 text-center text-xs font-semibold text-gray-500 dark:text-gray-400" data-v-73a6e843>${ssrInterpolate(day)}</div>`);
          });
          _push2(`<!--]--></div><div class="grid grid-cols-7 grid-rows-6 gap-1" data-v-73a6e843><!--[-->`);
          ssrRenderList(unref(firstDayOfMonth), (n) => {
            _push2(`<div class="h-9 w-9" data-v-73a6e843></div>`);
          });
          _push2(`<!--]--><!--[-->`);
          ssrRenderList(unref(datesInMonth), (date) => {
            _push2(`<button type="button" class="${ssrRenderClass([getDayClasses(date), "flex h-9 w-9 items-center justify-center rounded-full text-sm text-gray-700 transition-all duration-150 dark:text-gray-300"])}" data-v-73a6e843>${ssrInterpolate(date)}</button>`);
          });
          _push2(`<!--]--></div></div><div class="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/50" data-v-73a6e843><button type="button" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium transition-colors" data-v-73a6e843> Aujourd&#39;hui </button><div class="flex gap-3" data-v-73a6e843><button type="button" class="px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200" data-v-73a6e843> Annuler </button><button type="button" class="bg-primary-600 hover:bg-primary-700 rounded-lg px-4 py-1.5 text-sm font-medium text-white transition-colors" data-v-73a6e843> Valider </button></div></div>`);
          if (unref(showSelectMonth)) {
            _push2(`<div class="absolute inset-0 flex flex-col bg-white dark:bg-gray-900" data-v-73a6e843><div class="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-800" data-v-73a6e843><h3 class="font-semibold text-gray-800 dark:text-gray-200" data-v-73a6e843>Sélectionner un mois</h3><button type="button" class="rounded p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800" data-v-73a6e843>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:x",
              class: "h-5 w-5 text-gray-500"
            }, null, _parent));
            _push2(`</button></div><div class="grid flex-1 grid-cols-3 gap-2 overflow-y-auto p-4" data-v-73a6e843><!--[-->`);
            ssrRenderList(months, (month, index) => {
              _push2(`<button type="button" class="${ssrRenderClass([
                index === unref(currentMonth) ? "bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300" : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                "rounded-lg px-2 py-3 text-sm font-medium transition-colors"
              ])}" data-v-73a6e843>${ssrInterpolate(month)}</button>`);
            });
            _push2(`<!--]--></div></div>`);
          } else {
            _push2(`<!---->`);
          }
          if (unref(showSelectYear)) {
            _push2(`<div class="absolute inset-0 flex flex-col bg-white dark:bg-gray-900" data-v-73a6e843><div class="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-800" data-v-73a6e843><h3 class="font-semibold text-gray-800 dark:text-gray-200" data-v-73a6e843>Sélectionner une année</h3><button type="button" class="rounded p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800" data-v-73a6e843>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:x",
              class: "h-5 w-5 text-gray-500"
            }, null, _parent));
            _push2(`</button></div><div class="grid flex-1 grid-cols-3 gap-2 overflow-y-auto p-4" data-v-73a6e843><!--[-->`);
            ssrRenderList(unref(yearOptions), (year) => {
              _push2(`<button type="button" class="${ssrRenderClass([
                year === unref(currentYear) ? "bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300" : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                "rounded-lg px-2 py-3 text-sm font-medium transition-colors"
              ])}" data-v-73a6e843>${ssrInterpolate(year)}</button>`);
            });
            _push2(`<!--]--></div></div>`);
          } else {
            _push2(`<!---->`);
          }
          _push2(`</div></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, props.report, false, _parent);
      _push(`</div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/app/datePicker.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_6 = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-73a6e843"]]);

export { __nuxt_component_6 as _ };
//# sourceMappingURL=datePicker-CE1CBEZO.mjs.map
