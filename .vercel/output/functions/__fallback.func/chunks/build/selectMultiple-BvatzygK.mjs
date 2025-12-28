import { j as _export_sfc, d as __nuxt_component_1 } from './server.mjs';
import { mergeModels, ref, computed, watch, unref, useModel, mergeProps, isRef, withCtx, createVNode, createBlock, createCommentVNode, openBlock, withDirectives, vModelText, withModifiers, Fragment, renderList, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderTeleport, ssrInterpolate, ssrRenderComponent, ssrRenderList, ssrRenderClass, ssrIncludeBooleanAttr, ssrRenderAttrs, ssrRenderAttr } from 'vue/server-renderer';
import { _ as __nuxt_component_2 } from './dropdownMenu-CEBe_L89.mjs';

const _sfc_main$1 = {
  __name: "AppDatePickerRange",
  __ssrInlineRender: true,
  props: {
    isOpen: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: "Sélectionner une période"
    },
    report: {
      type: String,
      default: "body"
    }
  },
  emits: ["select", "close"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const currentMonth = ref((/* @__PURE__ */ new Date()).getMonth());
    const currentYear = ref((/* @__PURE__ */ new Date()).getFullYear());
    const startDate = ref(null);
    const endDate = ref(null);
    const hoverDate = ref(null);
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
    const yearOptions = computed(() => {
      const years = [];
      for (let i = -6; i <= 6; i++) {
        years.push(currentYear.value + i);
      }
      return years;
    });
    const formatDate = (date) => {
      if (!date) return null;
      const d = new Date(date);
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    };
    const displayRange = computed(() => {
      if (!startDate.value && !endDate.value) {
        return "Sélectionnez la date de début";
      }
      if (startDate.value && !endDate.value) {
        return `${formatDate(startDate.value)} → ...`;
      }
      return `${formatDate(startDate.value)} → ${formatDate(endDate.value)}`;
    });
    const createDate = (day) => {
      return new Date(currentYear.value, currentMonth.value, day, 12, 0, 0).getTime();
    };
    const getDayClasses = (day) => {
      const dateValue = createDate(day);
      const isStartDate = startDate.value && dateValue === startDate.value;
      const isEndDate = endDate.value && dateValue === endDate.value;
      const isInRange = startDate.value && endDate.value && dateValue > startDate.value && dateValue < endDate.value;
      const isInHoverRange = startDate.value && !endDate.value && hoverDate.value && (dateValue > startDate.value && dateValue <= hoverDate.value || dateValue < startDate.value && dateValue >= hoverDate.value);
      const isToday = (/* @__PURE__ */ new Date()).getDate() === day && (/* @__PURE__ */ new Date()).getMonth() === currentMonth.value && (/* @__PURE__ */ new Date()).getFullYear() === currentYear.value;
      return {
        "bg-primary-600 text-white font-medium shadow-sm rounded-full": isStartDate || isEndDate,
        "bg-primary-100 dark:bg-primary-900/40": isInRange,
        "bg-primary-50 dark:bg-primary-900/20": isInHoverRange,
        "ring-2 ring-primary-300 dark:ring-primary-500": isToday && !isStartDate && !isEndDate,
        "hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full": !isStartDate && !isEndDate && !isInRange
      };
    };
    watch(
      () => props.isOpen,
      (newVal) => {
        if (!newVal) {
          startDate.value = null;
          endDate.value = null;
          hoverDate.value = null;
        }
      }
    );
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Icon = __nuxt_component_1;
      ssrRenderTeleport(_push, (_push2) => {
        if (__props.isOpen) {
          _push2(`<div class="fixed inset-0 z-80 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm dark:bg-black/40" data-v-4c7d7abc><div class="relative flex w-full max-w-xs flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900" data-v-4c7d7abc><div class="from-primary-600 to-primary-700 dark:from-primary-600 dark:to-primary-700 bg-linear-to-br p-4" data-v-4c7d7abc><p class="text-xs font-medium tracking-wider text-white uppercase" data-v-4c7d7abc>${ssrInterpolate(__props.title)}</p><p class="mt-1 text-lg font-semibold text-white" data-v-4c7d7abc>${ssrInterpolate(unref(displayRange))}</p></div><div class="flex items-center justify-between border-b border-gray-100 px-3 py-2 dark:border-gray-800" data-v-4c7d7abc><button type="button" class="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800" data-v-4c7d7abc>`);
          _push2(ssrRenderComponent(_component_Icon, {
            name: "lucide:chevron-left",
            class: "h-5 w-5"
          }, null, _parent));
          _push2(`</button><div class="flex items-center gap-1" data-v-4c7d7abc><button type="button" class="rounded-md px-2 py-1 font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800" data-v-4c7d7abc>${ssrInterpolate(months[unref(currentMonth)])}</button><button type="button" class="rounded-md px-2 py-1 font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800" data-v-4c7d7abc>${ssrInterpolate(unref(currentYear))}</button></div><button type="button" class="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800" data-v-4c7d7abc>`);
          _push2(ssrRenderComponent(_component_Icon, {
            name: "lucide:chevron-right",
            class: "h-5 w-5"
          }, null, _parent));
          _push2(`</button></div><div class="bg-gray-50 px-3 py-2 text-center text-xs text-gray-500 dark:bg-gray-800/50 dark:text-gray-400" data-v-4c7d7abc>`);
          if (!unref(startDate)) {
            _push2(`<span data-v-4c7d7abc>Cliquez pour sélectionner la date de début</span>`);
          } else if (!unref(endDate)) {
            _push2(`<span data-v-4c7d7abc>Cliquez pour sélectionner la date de fin</span>`);
          } else {
            _push2(`<span class="text-primary-600 dark:text-primary-400" data-v-4c7d7abc>Période sélectionnée ✓</span>`);
          }
          _push2(`</div><div class="p-3" data-v-4c7d7abc><div class="mb-2 grid grid-cols-7 gap-1" data-v-4c7d7abc><!--[-->`);
          ssrRenderList(days, (day) => {
            _push2(`<div class="py-1 text-center text-xs font-semibold text-gray-500 dark:text-gray-400" data-v-4c7d7abc>${ssrInterpolate(day)}</div>`);
          });
          _push2(`<!--]--></div><div class="grid grid-cols-7 grid-rows-6 gap-1" data-v-4c7d7abc><!--[-->`);
          ssrRenderList(unref(firstDayOfMonth), (n) => {
            _push2(`<div class="h-9 w-9" data-v-4c7d7abc></div>`);
          });
          _push2(`<!--]--><!--[-->`);
          ssrRenderList(unref(datesInMonth), (date) => {
            _push2(`<button type="button" class="${ssrRenderClass([getDayClasses(date), "flex h-9 w-9 items-center justify-center text-sm text-gray-700 transition-all duration-150 dark:text-gray-300"])}" data-v-4c7d7abc>${ssrInterpolate(date)}</button>`);
          });
          _push2(`<!--]--></div></div><div class="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/50" data-v-4c7d7abc><button type="button" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium transition-colors" data-v-4c7d7abc> Aujourd&#39;hui </button><div class="flex gap-3" data-v-4c7d7abc><button type="button" class="px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200" data-v-4c7d7abc> Annuler </button><button type="button"${ssrIncludeBooleanAttr(!unref(startDate) || !unref(endDate)) ? " disabled" : ""} class="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 dark:disabled:bg-primary-800 rounded-lg px-4 py-1.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed" data-v-4c7d7abc> Valider </button></div></div>`);
          if (unref(showSelectMonth)) {
            _push2(`<div class="absolute inset-0 flex flex-col bg-white dark:bg-gray-900" data-v-4c7d7abc><div class="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-800" data-v-4c7d7abc><h3 class="font-semibold text-gray-800 dark:text-gray-200" data-v-4c7d7abc>Sélectionner un mois</h3><button type="button" class="rounded p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800" data-v-4c7d7abc>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:x",
              class: "h-5 w-5 text-gray-500"
            }, null, _parent));
            _push2(`</button></div><div class="grid flex-1 grid-cols-3 gap-2 overflow-y-auto p-4" data-v-4c7d7abc><!--[-->`);
            ssrRenderList(months, (month, index) => {
              _push2(`<button type="button" class="${ssrRenderClass([
                index === unref(currentMonth) ? "bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300" : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                "rounded-lg px-2 py-3 text-sm font-medium transition-colors"
              ])}" data-v-4c7d7abc>${ssrInterpolate(month)}</button>`);
            });
            _push2(`<!--]--></div></div>`);
          } else {
            _push2(`<!---->`);
          }
          if (unref(showSelectYear)) {
            _push2(`<div class="absolute inset-0 flex flex-col bg-white dark:bg-gray-900" data-v-4c7d7abc><div class="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-800" data-v-4c7d7abc><h3 class="font-semibold text-gray-800 dark:text-gray-200" data-v-4c7d7abc>Sélectionner une année</h3><button type="button" class="rounded p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800" data-v-4c7d7abc>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:x",
              class: "h-5 w-5 text-gray-500"
            }, null, _parent));
            _push2(`</button></div><div class="grid flex-1 grid-cols-3 gap-2 overflow-y-auto p-4" data-v-4c7d7abc><!--[-->`);
            ssrRenderList(unref(yearOptions), (year) => {
              _push2(`<button type="button" class="${ssrRenderClass([
                year === unref(currentYear) ? "bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300" : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                "rounded-lg px-2 py-3 text-sm font-medium transition-colors"
              ])}" data-v-4c7d7abc>${ssrInterpolate(year)}</button>`);
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
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/app/datePickerRange.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_3 = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-4c7d7abc"]]);
const _sfc_main = {
  __name: "AppSelectMultiple",
  __ssrInlineRender: true,
  props: /* @__PURE__ */ mergeModels({
    title: { type: String, default: "" },
    name: { type: String, default: "" },
    options: { type: Array, default: () => [] },
    placeholder: { type: String, default: "Sélectionner..." },
    searchable: { type: Boolean, default: true },
    showSelectAll: { type: Boolean, default: false }
  }, {
    "modelValue": { default: () => [] },
    "modelModifiers": {}
  }),
  emits: ["update:modelValue"],
  setup(__props) {
    const model = useModel(__props, "modelValue");
    const isOpen = ref(false);
    const search = ref("");
    const props = __props;
    const isSelected = (id) => model.value.includes(id);
    const toggleOption = (id) => {
      if (isSelected(id)) {
        model.value = model.value.filter((v) => v !== id);
      } else {
        model.value = [...model.value, id];
      }
    };
    const selectedOptions = computed(() => props.options.filter((o) => model.value.includes(o.id)));
    const filteredOptions = computed(() => {
      const q = search.value?.toString().trim().toLowerCase();
      if (!q) return props.options;
      return props.options.filter((o) => (o.label || "").toString().toLowerCase().includes(q));
    });
    const selectAllVisible = () => {
      const visibles = filteredOptions.value.map((o) => o.id);
      const next = Array.from(/* @__PURE__ */ new Set([...model.value, ...visibles]));
      model.value = next;
    };
    const clearAllVisible = () => {
      const visibles = new Set(filteredOptions.value.map((o) => o.id));
      model.value = model.value.filter((id) => !visibles.has(id));
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppDropdownMenu = __nuxt_component_2;
      const _component_Icon = __nuxt_component_1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "w-full break-inside-avoid" }, _attrs))} data-v-d6f7b940>`);
      if (props.title) {
        _push(`<label${ssrRenderAttr("for", props.name)} class="mb-0.5 block text-sm" data-v-d6f7b940>${ssrInterpolate(props.title)}</label>`);
      } else {
        _push(`<!---->`);
      }
      _push(ssrRenderComponent(_component_AppDropdownMenu, {
        open: unref(isOpen),
        "onUpdate:open": ($event) => isRef(isOpen) ? isOpen.value = $event : null,
        "full-width": "",
        "match-trigger-width": ""
      }, {
        trigger: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div${ssrRenderAttr("id", props.name)} class="${ssrRenderClass([unref(isOpen) ? "border-primary-700 ring-primary-700 ring-1" : "", "flex min-h-[38px] w-full cursor-pointer flex-wrap items-center gap-2 rounded-md border border-gray-300 bg-white py-1.5 pr-2.5 pl-3 text-sm transition-colors hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"])}" data-v-d6f7b940${_scopeId}>`);
            if (unref(selectedOptions).length === 0) {
              _push2(`<span class="text-gray-400" data-v-d6f7b940${_scopeId}>${ssrInterpolate(props.placeholder)}</span>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<!--[-->`);
            ssrRenderList(unref(selectedOptions), (opt) => {
              _push2(`<div class="bg-primary-500/20 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 mr-1 mb-1 flex items-center gap-1 rounded-md px-2 py-0.5 text-xs" data-v-d6f7b940${_scopeId}><span class="leading-none" data-v-d6f7b940${_scopeId}>${ssrInterpolate(opt.label)}</span><button type="button" class="leading-none" aria-label="Retirer" data-v-d6f7b940${_scopeId}>`);
              _push2(ssrRenderComponent(_component_Icon, {
                name: "lucide:x",
                class: "h-3 w-3"
              }, null, _parent2, _scopeId));
              _push2(`</button></div>`);
            });
            _push2(`<!--]-->`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:chevron-down",
              class: ["ml-auto h-4 w-4 text-gray-500 transition-transform duration-200 dark:text-gray-400", unref(isOpen) ? "rotate-180" : ""]
            }, null, _parent2, _scopeId));
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", {
                id: props.name,
                class: ["flex min-h-[38px] w-full cursor-pointer flex-wrap items-center gap-2 rounded-md border border-gray-300 bg-white py-1.5 pr-2.5 pl-3 text-sm transition-colors hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500", unref(isOpen) ? "border-primary-700 ring-primary-700 ring-1" : ""]
              }, [
                unref(selectedOptions).length === 0 ? (openBlock(), createBlock("span", {
                  key: 0,
                  class: "text-gray-400"
                }, toDisplayString(props.placeholder), 1)) : createCommentVNode("", true),
                (openBlock(true), createBlock(Fragment, null, renderList(unref(selectedOptions), (opt) => {
                  return openBlock(), createBlock("div", {
                    key: opt.id,
                    class: "bg-primary-500/20 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 mr-1 mb-1 flex items-center gap-1 rounded-md px-2 py-0.5 text-xs"
                  }, [
                    createVNode("span", { class: "leading-none" }, toDisplayString(opt.label), 1),
                    createVNode("button", {
                      type: "button",
                      class: "leading-none",
                      onClick: withModifiers(($event) => toggleOption(opt.id), ["stop"]),
                      "aria-label": "Retirer"
                    }, [
                      createVNode(_component_Icon, {
                        name: "lucide:x",
                        class: "h-3 w-3"
                      })
                    ], 8, ["onClick"])
                  ]);
                }), 128)),
                createVNode(_component_Icon, {
                  name: "lucide:chevron-down",
                  class: ["ml-auto h-4 w-4 text-gray-500 transition-transform duration-200 dark:text-gray-400", unref(isOpen) ? "rotate-180" : ""]
                }, null, 8, ["class"])
              ], 10, ["id"])
            ];
          }
        }),
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="w-full py-2" data-v-d6f7b940${_scopeId}>`);
            if (props.searchable) {
              _push2(`<div class="px-3 pb-2" data-v-d6f7b940${_scopeId}><div class="flex items-center gap-2" data-v-d6f7b940${_scopeId}><input type="text"${ssrRenderAttr("value", unref(search))} placeholder="Rechercher..." class="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm placeholder-gray-400 focus:ring-0 dark:border-gray-700 dark:bg-gray-800 dark:placeholder-gray-500" data-v-d6f7b940${_scopeId}>`);
              if (unref(search)) {
                _push2(`<button type="button" class="rounded-md px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700" data-v-d6f7b940${_scopeId}> Effacer </button>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (props.showSelectAll) {
              _push2(`<div class="px-3 pb-2" data-v-d6f7b940${_scopeId}><div class="flex gap-2" data-v-d6f7b940${_scopeId}><button type="button" class="rounded border px-2 py-1 text-xs" data-v-d6f7b940${_scopeId}> Tout sélectionner </button><button type="button" class="rounded border px-2 py-1 text-xs" data-v-d6f7b940${_scopeId}> Tout retirer </button></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div class="max-h-60 w-full overflow-y-auto" data-v-d6f7b940${_scopeId}><!--[-->`);
            ssrRenderList(unref(filteredOptions), (option) => {
              _push2(`<div class="${ssrRenderClass([
                isSelected(option.id) ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium" : "text-gray-700 dark:text-gray-200",
                "flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
              ])}" data-v-d6f7b940${_scopeId}><input type="checkbox"${ssrIncludeBooleanAttr(isSelected(option.id)) ? " checked" : ""} aria-label="Sélectionner" class="accent-primary-500 h-4 w-4" data-v-d6f7b940${_scopeId}><span class="flex-1" data-v-d6f7b940${_scopeId}>${ssrInterpolate(option.label)}</span>`);
              if (isSelected(option.id)) {
                _push2(ssrRenderComponent(_component_Icon, {
                  name: "lucide:check",
                  class: "text-primary-500 h-4 w-4"
                }, null, _parent2, _scopeId));
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
            });
            _push2(`<!--]-->`);
            if (unref(filteredOptions).length === 0) {
              _push2(`<div class="px-3 py-2 text-sm text-gray-500" data-v-d6f7b940${_scopeId}>Aucun résultat</div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div>`);
          } else {
            return [
              createVNode("div", { class: "w-full py-2" }, [
                props.searchable ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "px-3 pb-2"
                }, [
                  createVNode("div", { class: "flex items-center gap-2" }, [
                    withDirectives(createVNode("input", {
                      type: "text",
                      "onUpdate:modelValue": ($event) => isRef(search) ? search.value = $event : null,
                      placeholder: "Rechercher...",
                      class: "w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm placeholder-gray-400 focus:ring-0 dark:border-gray-700 dark:bg-gray-800 dark:placeholder-gray-500"
                    }, null, 8, ["onUpdate:modelValue"]), [
                      [vModelText, unref(search)]
                    ]),
                    unref(search) ? (openBlock(), createBlock("button", {
                      key: 0,
                      type: "button",
                      class: "rounded-md px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700",
                      onClick: ($event) => search.value = ""
                    }, " Effacer ", 8, ["onClick"])) : createCommentVNode("", true)
                  ])
                ])) : createCommentVNode("", true),
                props.showSelectAll ? (openBlock(), createBlock("div", {
                  key: 1,
                  class: "px-3 pb-2"
                }, [
                  createVNode("div", { class: "flex gap-2" }, [
                    createVNode("button", {
                      type: "button",
                      class: "rounded border px-2 py-1 text-xs",
                      onClick: withModifiers(selectAllVisible, ["prevent"])
                    }, " Tout sélectionner "),
                    createVNode("button", {
                      type: "button",
                      class: "rounded border px-2 py-1 text-xs",
                      onClick: withModifiers(clearAllVisible, ["prevent"])
                    }, " Tout retirer ")
                  ])
                ])) : createCommentVNode("", true),
                createVNode("div", { class: "max-h-60 w-full overflow-y-auto" }, [
                  (openBlock(true), createBlock(Fragment, null, renderList(unref(filteredOptions), (option) => {
                    return openBlock(), createBlock("div", {
                      key: option.id,
                      class: [
                        "flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800",
                        isSelected(option.id) ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium" : "text-gray-700 dark:text-gray-200"
                      ],
                      onClick: withModifiers(($event) => toggleOption(option.id), ["stop"])
                    }, [
                      createVNode("input", {
                        type: "checkbox",
                        checked: isSelected(option.id),
                        onClick: withModifiers(($event) => toggleOption(option.id), ["stop"]),
                        "aria-label": "Sélectionner",
                        class: "accent-primary-500 h-4 w-4"
                      }, null, 8, ["checked", "onClick"]),
                      createVNode("span", { class: "flex-1" }, toDisplayString(option.label), 1),
                      isSelected(option.id) ? (openBlock(), createBlock(_component_Icon, {
                        key: 0,
                        name: "lucide:check",
                        class: "text-primary-500 h-4 w-4"
                      })) : createCommentVNode("", true)
                    ], 10, ["onClick"]);
                  }), 128)),
                  unref(filteredOptions).length === 0 ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "px-3 py-2 text-sm text-gray-500"
                  }, "Aucun résultat")) : createCommentVNode("", true)
                ])
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/app/selectMultiple.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_6 = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-d6f7b940"]]);

export { __nuxt_component_3 as _, __nuxt_component_6 as a };
//# sourceMappingURL=selectMultiple-BvatzygK.mjs.map
