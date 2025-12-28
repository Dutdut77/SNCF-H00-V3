import { _ as __nuxt_component_2 } from './dropdownMenu-CEBe_L89.mjs';
import { d as __nuxt_component_1 } from './server.mjs';
import { mergeModels, useModel, ref, computed, watch, mergeProps, unref, isRef, withCtx, createVNode, createBlock, createCommentVNode, openBlock, withDirectives, withModifiers, vModelText, toDisplayString, Fragment, renderList, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderAttr, ssrInterpolate, ssrRenderComponent, ssrRenderClass, ssrRenderList } from 'vue/server-renderer';

const _sfc_main = {
  __name: "AppSelect",
  __ssrInlineRender: true,
  props: /* @__PURE__ */ mergeModels({
    title: {
      type: String,
      default: ""
    },
    name: {
      type: String,
      default: ""
    },
    options: {
      type: Array,
      default: () => []
      // Format: [{ id: value, label: 'Label' }]
    },
    placeholder: {
      type: String,
      default: "Sélectionner..."
    },
    nullable: {
      type: Boolean,
      default: false
    },
    searchable: {
      type: Boolean,
      default: false
    },
    searchPlaceholder: {
      type: String,
      default: "Rechercher..."
    }
  }, {
    "modelValue": { default: null },
    "modelModifiers": {}
  }),
  emits: ["update:modelValue"],
  setup(__props) {
    const model = useModel(__props, "modelValue");
    const isOpen = ref(false);
    const searchQuery = ref("");
    const props = __props;
    const selectedLabel = computed(() => {
      if (model.value === null || model.value === void 0) {
        return props.placeholder;
      }
      const option = props.options.find((o) => o.id === model.value);
      return option?.label || props.placeholder;
    });
    const filteredOptions = computed(() => {
      if (!props.searchable || !searchQuery.value.trim()) {
        return props.options;
      }
      const query = searchQuery.value.toLowerCase().trim();
      return props.options.filter((option) => option.label.toLowerCase().includes(query));
    });
    const selectOption = (value) => {
      model.value = value;
      isOpen.value = false;
      searchQuery.value = "";
    };
    watch(isOpen, (newValue) => {
      if (!newValue) {
        searchQuery.value = "";
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppDropdownMenu = __nuxt_component_2;
      const _component_Icon = __nuxt_component_1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "w-full break-inside-avoid" }, _attrs))}>`);
      if (props.title) {
        _push(`<label${ssrRenderAttr("for", props.name)} class="mb-0.5 block text-sm">${ssrInterpolate(props.title)}</label>`);
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
            _push2(`<div${ssrRenderAttr("id", props.name)} class="${ssrRenderClass([unref(isOpen) ? "border-primary-500 ring-primary-500 ring-1" : "", "flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-gray-300 bg-white py-1.5 pr-2.5 pl-3 text-sm transition-colors hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"])}"${_scopeId}><span class="${ssrRenderClass(model.value === null || model.value === void 0 ? "text-gray-400" : "text-gray-700 dark:text-gray-200")}"${_scopeId}>${ssrInterpolate(unref(selectedLabel))}</span>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:chevron-down",
              class: ["h-4 w-4 text-gray-500 transition-transform duration-200 dark:text-gray-400", unref(isOpen) ? "rotate-180" : ""]
            }, null, _parent2, _scopeId));
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", {
                id: props.name,
                class: ["flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-gray-300 bg-white py-1.5 pr-2.5 pl-3 text-sm transition-colors hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500", unref(isOpen) ? "border-primary-500 ring-primary-500 ring-1" : ""]
              }, [
                createVNode("span", {
                  class: model.value === null || model.value === void 0 ? "text-gray-400" : "text-gray-700 dark:text-gray-200"
                }, toDisplayString(unref(selectedLabel)), 3),
                createVNode(_component_Icon, {
                  name: "lucide:chevron-down",
                  class: ["h-4 w-4 text-gray-500 transition-transform duration-200 dark:text-gray-400", unref(isOpen) ? "rotate-180" : ""]
                }, null, 8, ["class"])
              ], 10, ["id"])
            ];
          }
        }),
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="w-full"${_scopeId}>`);
            if (props.searchable) {
              _push2(`<div class="sticky top-0 border-b border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-900"${_scopeId}><div class="relative"${_scopeId}>`);
              _push2(ssrRenderComponent(_component_Icon, {
                name: "lucide:search",
                class: "absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-gray-400"
              }, null, _parent2, _scopeId));
              _push2(`<input${ssrRenderAttr("value", unref(searchQuery))} type="text"${ssrRenderAttr("placeholder", props.searchPlaceholder)} class="w-full rounded-md border border-gray-300 bg-white py-1.5 pr-3 pl-8 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder:text-gray-500"${_scopeId}></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div class="max-h-60 overflow-y-auto"${_scopeId}>`);
            if (props.nullable && !unref(searchQuery)) {
              _push2(`<div class="${ssrRenderClass([
                model.value === null ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800",
                "cursor-pointer rounded-md px-3 py-2 text-sm transition-colors"
              ])}"${_scopeId}>${ssrInterpolate(props.placeholder)}</div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<!--[-->`);
            ssrRenderList(unref(filteredOptions), (option) => {
              _push2(`<div class="${ssrRenderClass([
                model.value === option.id ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium" : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800",
                "cursor-pointer rounded-md px-3 py-2 text-sm transition-colors"
              ])}"${_scopeId}><div class="flex items-center justify-between"${_scopeId}><span${_scopeId}>${ssrInterpolate(option.label)}</span>`);
              if (model.value === option.id) {
                _push2(ssrRenderComponent(_component_Icon, {
                  name: "lucide:check",
                  class: "text-primary-500 h-4 w-4"
                }, null, _parent2, _scopeId));
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div></div>`);
            });
            _push2(`<!--]-->`);
            if (unref(filteredOptions).length === 0 && unref(searchQuery)) {
              _push2(`<div class="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400"${_scopeId}> Aucun résultat pour &quot;${ssrInterpolate(unref(searchQuery))}&quot; </div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div>`);
          } else {
            return [
              createVNode("div", { class: "w-full" }, [
                props.searchable ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "sticky top-0 border-b border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-900"
                }, [
                  createVNode("div", { class: "relative" }, [
                    createVNode(_component_Icon, {
                      name: "lucide:search",
                      class: "absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-gray-400"
                    }),
                    withDirectives(createVNode("input", {
                      "onUpdate:modelValue": ($event) => isRef(searchQuery) ? searchQuery.value = $event : null,
                      type: "text",
                      placeholder: props.searchPlaceholder,
                      class: "w-full rounded-md border border-gray-300 bg-white py-1.5 pr-3 pl-8 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder:text-gray-500",
                      onClick: withModifiers(() => {
                      }, ["stop"])
                    }, null, 8, ["onUpdate:modelValue", "placeholder", "onClick"]), [
                      [vModelText, unref(searchQuery)]
                    ])
                  ])
                ])) : createCommentVNode("", true),
                createVNode("div", { class: "max-h-60 overflow-y-auto" }, [
                  props.nullable && !unref(searchQuery) ? (openBlock(), createBlock("div", {
                    key: 0,
                    onClick: ($event) => selectOption(null),
                    class: [
                      "cursor-pointer rounded-md px-3 py-2 text-sm transition-colors",
                      model.value === null ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                    ]
                  }, toDisplayString(props.placeholder), 11, ["onClick"])) : createCommentVNode("", true),
                  (openBlock(true), createBlock(Fragment, null, renderList(unref(filteredOptions), (option) => {
                    return openBlock(), createBlock("div", {
                      key: option.id,
                      onClick: ($event) => selectOption(option.id),
                      class: [
                        "cursor-pointer rounded-md px-3 py-2 text-sm transition-colors",
                        model.value === option.id ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium" : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                      ]
                    }, [
                      createVNode("div", { class: "flex items-center justify-between" }, [
                        createVNode("span", null, toDisplayString(option.label), 1),
                        model.value === option.id ? (openBlock(), createBlock(_component_Icon, {
                          key: 0,
                          name: "lucide:check",
                          class: "text-primary-500 h-4 w-4"
                        })) : createCommentVNode("", true)
                      ])
                    ], 10, ["onClick"]);
                  }), 128)),
                  unref(filteredOptions).length === 0 && unref(searchQuery) ? (openBlock(), createBlock("div", {
                    key: 1,
                    class: "px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                  }, ' Aucun résultat pour "' + toDisplayString(unref(searchQuery)) + '" ', 1)) : createCommentVNode("", true)
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/app/select.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as _ };
//# sourceMappingURL=select-CBkAiapS.mjs.map
