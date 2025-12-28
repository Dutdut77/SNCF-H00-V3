import { _ as __nuxt_component_0$1 } from './nuxt-link-BeAZEQV9.mjs';
import { j as _export_sfc, c as useAuthUser, e as _imports_0, d as __nuxt_component_1$1 } from './server.mjs';
import { _ as __nuxt_component_2 } from './dropdownMenu-CEBe_L89.mjs';
import { mergeProps, computed, ref, reactive, watch, unref, withCtx, createVNode, createBlock, createCommentVNode, openBlock, toDisplayString, Fragment, renderList, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderSlot, ssrRenderAttr, ssrRenderClass, ssrRenderList, ssrInterpolate, ssrRenderStyle } from 'vue/server-renderer';
import { u as useLevelUser } from './useLevelUser-nJv9VN0C.mjs';
import '../nitro/nitro.mjs';
import 'jsonwebtoken';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import '@iconify/utils';
import 'consola';
import 'vue-router';
import '@supabase/ssr';
import '@iconify/vue';
import '@iconify/utils/lib/css/icon';
import 'perfect-debounce';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';

const _sfc_main$2 = {
  __name: "Navbar",
  __ssrInlineRender: true,
  setup(__props) {
    const user = useAuthUser();
    const { isAdmin, isSuperAdmin } = useLevelUser();
    const isAtLeastAdmin = computed(() => isAdmin.value || isSuperAdmin.value);
    const allItems = [
      {
        label: "Taches",
        icon: "i-lucide:clock-4",
        to: "/"
      },
      {
        label: "Chantiers",
        icon: "i-lucide:traffic-cone",
        children: [
          {
            label: "Chantiers",
            icon: "i-lucide:folder-open",
            description: "Tous les chantiers",
            to: "/chantiers"
          },
          {
            label: "Plan de charge général",
            icon: "i-lucide:calendar-days",
            description: "Visualisation de tous les chantiers par année",
            to: "/chantiers/plan-de-charge-general"
          },
          {
            label: "Planning RLT",
            icon: "i-lucide:user-round",
            description: "Plan de charge annuel des RLT",
            to: "/chantiers/plan-de-charge-rlt"
          }
        ]
      },
      {
        label: "Dashboard",
        icon: "i-lucide:layout-dashboard",
        requiresAdmin: true,
        // Nécessite admin ou superadmin
        children: [
          {
            label: "Alertes",
            icon: "i-lucide:siren",
            description: "Visualisation des alertes de tous les chantiers. ",
            to: "/dashboard/alertes"
          },
          {
            label: "RP1 / RP3",
            icon: "i-lucide:file-text",
            description: "Listing des taches RP1 et RP3 de tous les chantiers",
            to: ""
          },
          {
            label: "Cellulues Pré-op",
            icon: "i-lucide:clipboard-list",
            description: "Listes des taches de la cellule pré-op.",
            to: ""
          }
        ]
      },
      {
        label: "Paramètres",
        icon: "lucide:settings",
        to: "/parametres",
        requiresAdmin: true
        // Nécessite admin ou superadmin
      }
    ];
    const filteredItems = computed(() => {
      return allItems.filter((item) => {
        if (item.requiresAdmin) {
          return isAtLeastAdmin.value;
        }
        return true;
      });
    });
    const viewMenu = ref(false);
    const expandedChildren = reactive({});
    const isDesktop = ref(false);
    const closeMenu = () => {
      viewMenu.value = false;
    };
    watch(viewMenu, (isOpen) => {
      if (!isOpen) {
        Object.keys(expandedChildren).forEach((key) => {
          expandedChildren[key] = false;
        });
      }
    });
    watch(isDesktop, (desktop) => {
      if (desktop) {
        closeMenu();
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0$1;
      const _component_Icon = __nuxt_component_1$1;
      const _component_AppDropdownMenu = __nuxt_component_2;
      _push(`<header${ssrRenderAttrs(mergeProps({
        class: ["fixed top-0 z-50 flex w-full justify-center border-b border-emerald-800/10 bg-white/80 text-sm backdrop-blur-xl duration-500 print:hidden", unref(viewMenu) ? "h-screen lg:h-16" : "h-16"]
      }, _attrs))} data-v-90eab171><div class="relative flex h-full w-full max-w-[1400px] flex-col items-center px-6 lg:flex-row lg:px-2" data-v-90eab171><div class="flex w-full items-center lg:w-auto" data-v-90eab171><div class="animate__animated animate__jackInTheBox flex h-16 flex-none flex-col justify-center py-2.5" data-v-90eab171><div class="flex items-center gap-2" data-v-90eab171><img${ssrRenderAttr("src", _imports_0)} alt="Logo" class="h-14 w-auto" data-v-90eab171><div class="flex flex-col font-[Pacifico] text-3xl text-gray-700" data-v-90eab171><div class="relative" data-v-90eab171><div data-v-90eab171>H00</div></div><div class="-mt-2 pl-1 text-base" data-v-90eab171>travaux</div></div><div class="border-primary-700 bg-primary-700/20 text-primary-800 mb-auto flex items-center justify-center rounded border border-dashed px-1 text-xs italic" data-v-90eab171><div data-v-90eab171>v3.00</div></div></div></div><div class="ml-auto flex h-16 cursor-pointer flex-col items-center justify-center gap-1 lg:hidden" data-v-90eab171><div class="${ssrRenderClass([unref(viewMenu) ? "translate-y-1.5 rotate-45" : "", "h-0.5 w-5 bg-gray-700 transition-transform duration-300"])}" data-v-90eab171></div><div class="${ssrRenderClass([unref(viewMenu) ? "opacity-0" : "", "ml-auto h-0.5 w-3 bg-gray-700 transition-opacity duration-300"])}" data-v-90eab171></div><div class="${ssrRenderClass([unref(viewMenu) ? "-translate-y-1.5 -rotate-45" : "", "h-0.5 w-5 bg-gray-700 transition-transform duration-300"])}" data-v-90eab171></div></div></div><div class="font-avenirMedium flex h-full w-full flex-col items-center overflow-y-auto text-gray-600 lg:flex-row lg:justify-end lg:overflow-visible" data-v-90eab171><div class="flex h-full list-none flex-col items-center gap-1 pt-8 pb-20 lg:flex-row lg:pt-0 lg:pb-0" data-v-90eab171><!--[-->`);
      ssrRenderList(unref(filteredItems), (item) => {
        _push(`<!--[-->`);
        if (!item.children) {
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: item.to,
            class: "",
            onClick: closeMenu
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<div class="${ssrRenderClass([
                  item.to === _ctx.$route.path ? "bg-primary-700/80 text-white" : "hover:text-primary-900 hover:bg-primary-700/20 duration-500",
                  "0 flex w-80 cursor-pointer items-center gap-4 rounded-lg px-4 py-2 text-center lg:w-24 lg:flex-col lg:justify-center lg:gap-0 lg:px-2"
                ])}" data-v-90eab171${_scopeId}>`);
                if (item.icon) {
                  _push2(ssrRenderComponent(_component_Icon, {
                    name: item.icon,
                    size: "20"
                  }, null, _parent2, _scopeId));
                } else {
                  _push2(`<!---->`);
                }
                _push2(`<span class="text-sm" data-v-90eab171${_scopeId}>${ssrInterpolate(item.label)}</span></div>`);
              } else {
                return [
                  createVNode("div", {
                    class: [
                      "0 flex w-80 cursor-pointer items-center gap-4 rounded-lg px-4 py-2 text-center lg:w-24 lg:flex-col lg:justify-center lg:gap-0 lg:px-2",
                      item.to === _ctx.$route.path ? "bg-primary-700/80 text-white" : "hover:text-primary-900 hover:bg-primary-700/20 duration-500"
                    ]
                  }, [
                    item.icon ? (openBlock(), createBlock(_component_Icon, {
                      key: 0,
                      name: item.icon,
                      size: "20"
                    }, null, 8, ["name"])) : createCommentVNode("", true),
                    createVNode("span", { class: "text-sm" }, toDisplayString(item.label), 1)
                  ], 2)
                ];
              }
            }),
            _: 2
          }, _parent));
        } else {
          _push(`<div class="w-full" data-v-90eab171><div class="${ssrRenderClass([
            unref(expandedChildren)[item.label] ? "bg-primary-700/20 text-primary-800" : "hover:text-primary-900 hover:bg-primary-700/20 duration-500",
            "flex w-80 max-w-full cursor-pointer items-center gap-4 rounded-lg px-4 py-2 text-center lg:hidden lg:w-24 lg:px-2"
          ])}" data-v-90eab171><div class="flex items-center gap-4" data-v-90eab171>`);
          if (item.icon) {
            _push(ssrRenderComponent(_component_Icon, {
              name: item.icon,
              size: "20"
            }, null, _parent));
          } else {
            _push(`<!---->`);
          }
          _push(`<span class="text-sm" data-v-90eab171>${ssrInterpolate(item.label)}</span></div>`);
          _push(ssrRenderComponent(_component_Icon, {
            name: "i-lucide:chevron-right",
            size: "18",
            class: ["ml-auto text-gray-500 transition-transform duration-300", unref(expandedChildren)[item.label] ? "text-primary-800 rotate-90" : ""]
          }, null, _parent));
          _push(`</div><div class="mt-2 flex w-80 max-w-full flex-col pb-3 pl-6 lg:hidden" style="${ssrRenderStyle(unref(expandedChildren)[item.label] ? null : { display: "none" })}" data-v-90eab171><!--[-->`);
          ssrRenderList(item.children, (child) => {
            _push(ssrRenderComponent(_component_NuxtLink, {
              key: child.label,
              to: child.to,
              class: "border-primary-700/30 block w-full border-l pl-2",
              onClick: closeMenu
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`<div class="${ssrRenderClass([child.to === _ctx.$route.path ? "bg-slate-200 text-gray-700" : "", "cursor-pointer rounded-md px-3 py-2 text-sm text-gray-700 duration-500 hover:bg-slate-200"])}" data-v-90eab171${_scopeId}><span class="text-left wrap-break-word" data-v-90eab171${_scopeId}>${ssrInterpolate(child.label)}</span></div>`);
                } else {
                  return [
                    createVNode("div", {
                      class: ["cursor-pointer rounded-md px-3 py-2 text-sm text-gray-700 duration-500 hover:bg-slate-200", child.to === _ctx.$route.path ? "bg-slate-200 text-gray-700" : ""]
                    }, [
                      createVNode("span", { class: "text-left wrap-break-word" }, toDisplayString(child.label), 1)
                    ], 2)
                  ];
                }
              }),
              _: 2
            }, _parent));
          });
          _push(`<!--]--></div>`);
          if (unref(isDesktop)) {
            _push(ssrRenderComponent(_component_AppDropdownMenu, {
              trigger: "hover",
              class: "hidden lg:block"
            }, {
              trigger: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`<div class="${ssrRenderClass([
                    item.to === _ctx.$route.path ? "bg-primary-700/80 text-white" : "hover:text-primary-900 hover:bg-primary-700/20 duration-500",
                    "flex w-48 cursor-pointer items-center gap-4 rounded-lg px-4 py-2 text-center lg:w-24 lg:flex-col lg:justify-center lg:gap-0 lg:px-2"
                  ])}" data-v-90eab171${_scopeId}>`);
                  if (item.icon) {
                    _push2(ssrRenderComponent(_component_Icon, {
                      name: item.icon,
                      size: "20"
                    }, null, _parent2, _scopeId));
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`<span class="text-sm" data-v-90eab171${_scopeId}>${ssrInterpolate(item.label)}</span></div>`);
                } else {
                  return [
                    createVNode("div", {
                      class: [
                        "flex w-48 cursor-pointer items-center gap-4 rounded-lg px-4 py-2 text-center lg:w-24 lg:flex-col lg:justify-center lg:gap-0 lg:px-2",
                        item.to === _ctx.$route.path ? "bg-primary-700/80 text-white" : "hover:text-primary-900 hover:bg-primary-700/20 duration-500"
                      ]
                    }, [
                      item.icon ? (openBlock(), createBlock(_component_Icon, {
                        key: 0,
                        name: item.icon,
                        size: "20"
                      }, null, 8, ["name"])) : createCommentVNode("", true),
                      createVNode("span", { class: "text-sm" }, toDisplayString(item.label), 1)
                    ], 2)
                  ];
                }
              }),
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`<div class="w-[calc(100vw-3rem)] max-w-2xl" data-v-90eab171${_scopeId}><div class="relative grid grid-cols-1 gap-x-6 gap-y-2 bg-white p-2 before:absolute before:top-4 before:bottom-4 before:left-1/2 before:hidden before:w-px before:-translate-x-1/2 before:bg-gray-200 lg:grid-cols-2 lg:before:block" data-v-90eab171${_scopeId}><!--[-->`);
                  ssrRenderList(item.children, (child) => {
                    _push2(ssrRenderComponent(_component_NuxtLink, {
                      key: child.label,
                      to: child.to,
                      class: "block",
                      onClick: closeMenu
                    }, {
                      default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                        if (_push3) {
                          _push3(`<div class="${ssrRenderClass([
                            child.to === _ctx.$route.path ? "bg-primary-700/80 text-white duration-300 group-hover:text-white" : "duration-300 group-hover:text-gray-700",
                            "group hover:bg-primary-700/20 cursor-pointer rounded-md px-3 py-2 text-sm text-gray-700 hover:text-gray-700"
                          ])}" data-v-90eab171${_scopeId2}>`);
                          if (child.icon || child.description) {
                            _push3(`<div class="flex items-start gap-2" data-v-90eab171${_scopeId2}><div class="mt-0.5 flex-none" data-v-90eab171${_scopeId2}>`);
                            if (child.icon) {
                              _push3(ssrRenderComponent(_component_Icon, {
                                name: child.icon,
                                size: "20"
                              }, null, _parent3, _scopeId2));
                            } else {
                              _push3(`<!---->`);
                            }
                            _push3(`</div><div class="flex min-w-0 flex-1 flex-col" data-v-90eab171${_scopeId2}><span class="font-medium wrap-break-word" data-v-90eab171${_scopeId2}>${ssrInterpolate(child.label)}</span>`);
                            if (child.description) {
                              _push3(`<span class="text-xs wrap-break-word duration-300" data-v-90eab171${_scopeId2}>${ssrInterpolate(child.description)}</span>`);
                            } else {
                              _push3(`<!---->`);
                            }
                            _push3(`</div></div>`);
                          } else {
                            _push3(`<span class="wrap-break-word" data-v-90eab171${_scopeId2}>${ssrInterpolate(child.label)}</span>`);
                          }
                          _push3(`</div>`);
                        } else {
                          return [
                            createVNode("div", {
                              class: [
                                "group hover:bg-primary-700/20 cursor-pointer rounded-md px-3 py-2 text-sm text-gray-700 hover:text-gray-700",
                                child.to === _ctx.$route.path ? "bg-primary-700/80 text-white duration-300 group-hover:text-white" : "duration-300 group-hover:text-gray-700"
                              ]
                            }, [
                              child.icon || child.description ? (openBlock(), createBlock("div", {
                                key: 0,
                                class: "flex items-start gap-2"
                              }, [
                                createVNode("div", { class: "mt-0.5 flex-none" }, [
                                  child.icon ? (openBlock(), createBlock(_component_Icon, {
                                    key: 0,
                                    name: child.icon,
                                    size: "20"
                                  }, null, 8, ["name"])) : createCommentVNode("", true)
                                ]),
                                createVNode("div", { class: "flex min-w-0 flex-1 flex-col" }, [
                                  createVNode("span", { class: "font-medium wrap-break-word" }, toDisplayString(child.label), 1),
                                  child.description ? (openBlock(), createBlock("span", {
                                    key: 0,
                                    class: "text-xs wrap-break-word duration-300"
                                  }, toDisplayString(child.description), 1)) : createCommentVNode("", true)
                                ])
                              ])) : (openBlock(), createBlock("span", {
                                key: 1,
                                class: "wrap-break-word"
                              }, toDisplayString(child.label), 1))
                            ], 2)
                          ];
                        }
                      }),
                      _: 2
                    }, _parent2, _scopeId));
                  });
                  _push2(`<!--]--></div></div>`);
                } else {
                  return [
                    createVNode("div", { class: "w-[calc(100vw-3rem)] max-w-2xl" }, [
                      createVNode("div", { class: "relative grid grid-cols-1 gap-x-6 gap-y-2 bg-white p-2 before:absolute before:top-4 before:bottom-4 before:left-1/2 before:hidden before:w-px before:-translate-x-1/2 before:bg-gray-200 lg:grid-cols-2 lg:before:block" }, [
                        (openBlock(true), createBlock(Fragment, null, renderList(item.children, (child) => {
                          return openBlock(), createBlock(_component_NuxtLink, {
                            key: child.label,
                            to: child.to,
                            class: "block",
                            onClick: closeMenu
                          }, {
                            default: withCtx(() => [
                              createVNode("div", {
                                class: [
                                  "group hover:bg-primary-700/20 cursor-pointer rounded-md px-3 py-2 text-sm text-gray-700 hover:text-gray-700",
                                  child.to === _ctx.$route.path ? "bg-primary-700/80 text-white duration-300 group-hover:text-white" : "duration-300 group-hover:text-gray-700"
                                ]
                              }, [
                                child.icon || child.description ? (openBlock(), createBlock("div", {
                                  key: 0,
                                  class: "flex items-start gap-2"
                                }, [
                                  createVNode("div", { class: "mt-0.5 flex-none" }, [
                                    child.icon ? (openBlock(), createBlock(_component_Icon, {
                                      key: 0,
                                      name: child.icon,
                                      size: "20"
                                    }, null, 8, ["name"])) : createCommentVNode("", true)
                                  ]),
                                  createVNode("div", { class: "flex min-w-0 flex-1 flex-col" }, [
                                    createVNode("span", { class: "font-medium wrap-break-word" }, toDisplayString(child.label), 1),
                                    child.description ? (openBlock(), createBlock("span", {
                                      key: 0,
                                      class: "text-xs wrap-break-word duration-300"
                                    }, toDisplayString(child.description), 1)) : createCommentVNode("", true)
                                  ])
                                ])) : (openBlock(), createBlock("span", {
                                  key: 1,
                                  class: "wrap-break-word"
                                }, toDisplayString(child.label), 1))
                              ], 2)
                            ]),
                            _: 2
                          }, 1032, ["to"]);
                        }), 128))
                      ])
                    ])
                  ];
                }
              }),
              _: 2
            }, _parent));
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        }
        _push(`<!--]-->`);
      });
      _push(`<!--]--></div>`);
      if (unref(viewMenu) && unref(user)) {
        _push(`<div class="bg-primary-700/20 border-primary-700/30 absolute right-0 bottom-4 left-0 mx-auto flex w-[calc(100%-2rem)] items-center justify-between rounded-xl border px-4 py-3 lg:hidden" data-v-90eab171><div class="flex items-center gap-3" data-v-90eab171><div class="from-primary-600 to-primary-800 flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br text-sm font-semibold text-white" data-v-90eab171>${ssrInterpolate(unref(user)?.prenom?.charAt(0) || "")}${ssrInterpolate(unref(user)?.nom?.charAt(0) || "")}</div><div class="flex flex-col" data-v-90eab171><span class="text-sm font-medium text-gray-700" data-v-90eab171>${ssrInterpolate(unref(user)?.prenom)} ${ssrInterpolate(unref(user)?.nom)}</span><span class="text-xs text-gray-500" data-v-90eab171>${ssrInterpolate(unref(user)?.email)}</span></div></div><button class="flex cursor-pointer items-center justify-center rounded-lg p-2 text-gray-400 transition-colors duration-300 hover:bg-red-100 hover:text-red-600" title="Se déconnecter" data-v-90eab171>`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "i-lucide:log-out",
          size: "18",
          class: "h-fit"
        }, null, _parent));
        _push(`</button></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(user)) {
        _push(`<div class="ml-6 hidden items-center gap-3 border-l border-gray-200 pl-6 lg:flex" data-v-90eab171><div class="flex items-center gap-2" data-v-90eab171><div class="from-primary-600 to-primary-800 flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br text-xs font-medium text-white shadow-sm" data-v-90eab171>${ssrInterpolate(unref(user)?.prenom?.charAt(0) || "")}${ssrInterpolate(unref(user)?.nom?.charAt(0) || "")}</div><div class="flex max-w-32 flex-col truncate" data-v-90eab171><span class="truncate text-xs text-gray-500" data-v-90eab171>${ssrInterpolate(unref(user)?.prenom)}</span><span class="truncate text-sm font-medium text-gray-700" data-v-90eab171>${ssrInterpolate(unref(user)?.nom)}</span></div></div><button class="flex cursor-pointer items-center justify-center rounded-lg p-2 text-gray-400 transition-colors duration-300 hover:bg-red-100 hover:text-red-600" title="Se déconnecter" data-v-90eab171>`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "i-lucide:log-out",
          size: "18",
          class: "h-fit"
        }, null, _parent));
        _push(`</button></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></header>`);
    };
  }
};
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/navbar.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_0 = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["__scopeId", "data-v-90eab171"]]);
const _sfc_main$1 = {};
function _sfc_ssrRender$1(_ctx, _push, _parent, _attrs) {
  _push(`<div${ssrRenderAttrs(mergeProps({ class: "w-full h-full flex justify-between items-center print:hidden z-40 text-sm px-6 text-gray-500" }, _attrs))}><p class="hidden lg:block">Copyright © 2024 - Tous droits réservés</p><p class="mx-auto lg:mx-0">Mentions légales</p></div>`);
}
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/footer.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_1 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$1, [["ssrRender", _sfc_ssrRender$1]]), { __name: "Footer" });
const _sfc_main = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  const _component_Navbar = __nuxt_component_0;
  const _component_Footer = __nuxt_component_1;
  _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex h-dvh w-full flex-col overflow-hidden bg-radial-[at_50%_50%] from-emerald-800/10 via-emerald-800/5 to-white text-gray-700 print:overflow-visible" }, _attrs))}>`);
  _push(ssrRenderComponent(_component_Navbar, { class: "w-full" }, null, _parent));
  _push(`<div class="maxh-full w-full flex-1 overflow-auto pt-16 print:pt-0">`);
  ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
  _push(`</div><div class="z-40 block h-8 w-full print:hidden">`);
  _push(ssrRenderComponent(_component_Footer, { class: "" }, null, _parent));
  _push(`</div></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/default.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _default = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);

export { _default as default };
//# sourceMappingURL=default-BSFAQi7v.mjs.map
