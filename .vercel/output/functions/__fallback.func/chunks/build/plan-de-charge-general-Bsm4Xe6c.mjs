import { _ as _sfc_main$3 } from './titleMain-BKNYl-Iw.mjs';
import { _ as __nuxt_component_1$1 } from './inputSearch-Xv57A_RG.mjs';
import { j as _export_sfc, u as useHead, h as useUsers, b as useLoader, a as useToast, g as useState, _ as _sfc_main$2$1, d as __nuxt_component_1$2 } from './server.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-BeAZEQV9.mjs';
import { computed, ref, mergeProps, unref, isRef, withCtx, createVNode, createTextVNode, createBlock, createCommentVNode, openBlock, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrRenderAttr, ssrRenderSlot } from 'vue/server-renderer';
import { _ as _sfc_main$4, a as __nuxt_component_6, b as _sfc_main$5, c as _sfc_main$1$1 } from './form-Dpzxh_Wd.mjs';
import { u as useTimeline } from './useTimeline-BdoQfffy.mjs';
import { u as useContacts } from './useContacts-BdCjpTgN.mjs';
import { u as useChantiers } from './useChantiers-C2XRmo5v.mjs';
import { u as useTaches } from './useTaches-FqFKMoCT.mjs';
import { u as useH00 } from './useH00-CD0fct_m.mjs';
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
import './modal-DW8NcVL0.mjs';
import './selectMultiple-BvatzygK.mjs';
import './dropdownMenu-CEBe_L89.mjs';
import './select-CBkAiapS.mjs';

const _sfc_main$2 = {
  __name: "AppTooltip",
  __ssrInlineRender: true,
  props: {
    text: { type: String, required: true },
    position: { type: String, default: "top" }
    // top | bottom | left | right
  },
  setup(__props) {
    const show = ref(false);
    const POSITIONS = {
      top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
      bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
      left: "right-full top-1/2 -translate-y-1/2 mr-2",
      right: "left-full top-1/2 -translate-y-1/2 ml-2"
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "relative inline-flex" }, _attrs))} data-v-137c08e5>`);
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      if (show.value) {
        _push(`<div class="${ssrRenderClass([
          "absolute z-50 rounded bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white shadow-lg",
          POSITIONS[__props.position]
        ])}" data-v-137c08e5>${ssrInterpolate(__props.text)}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
};
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/app/tooltip.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_1 = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["__scopeId", "data-v-137c08e5"]]);
const _sfc_main$1 = {
  __name: "ChantierTimelineRow",
  __ssrInlineRender: true,
  props: {
    chantier: {
      type: Object,
      required: true
    },
    weeks: {
      type: Array,
      required: true
    },
    selectedYear: {
      type: Number,
      required: true
    },
    hoveredWeek: {
      type: Number,
      default: null
    },
    showContacts: {
      type: Boolean,
      default: true
    },
    clickable: {
      type: Boolean,
      default: true
    }
  },
  emits: ["week-click", "week-hover", "week-leave"],
  setup(__props, { emit: __emit }) {
    const { isWeekendForChantier } = useTimeline();
    const { users } = useUsers();
    const { allContactsTravaux } = useContacts();
    const getWeekNumber = (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + 4 - (d.getDay() || 7));
      const yearStart = new Date(d.getFullYear(), 0, 1);
      return Math.ceil(((d - yearStart) / 864e5 + 1) / 7);
    };
    const getChantierPrepaColor = (week, selectedYear, chantier) => {
      if (!week || !selectedYear || !chantier) return null;
      if (!chantier.date_prepa || !Array.isArray(chantier.date_prepa) || chantier.date_prepa.length === 0) {
        return null;
      }
      const { etat } = chantier;
      const dateFromWeek = (week2, year) => {
        const jan4 = new Date(year, 0, 4);
        const jan4Day = jan4.getDay() || 7;
        const mondayWeek1 = new Date(jan4);
        mondayWeek1.setDate(jan4.getDate() - (jan4Day - 1));
        const d = new Date(mondayWeek1);
        d.setDate(mondayWeek1.getDate() + (week2 - 1) * 7);
        return d;
      };
      const weekDate = dateFromWeek(week, selectedYear);
      const isInPeriod = chantier.date_prepa.some((periode) => {
        if (!periode.date_start_prepa) return false;
        const start = new Date(periode.date_start_prepa);
        const end = periode.date_end_prepa ? new Date(periode.date_end_prepa) : start;
        return weekDate >= start && weekDate <= end;
      });
      if (!isInPeriod) return null;
      switch (etat) {
        case 2:
          return "bg-lime-500/60 border border-lime-600";
        case 1:
          return "bg-purple-500/60 border border-purple-600";
        case 0:
          return "bg-sky-500/60 border border-sky-600";
        case -1:
          return "bg-slate-500/60 border border-slate-600";
        default:
          return "bg-gray-500/60 border border-gray-600";
      }
    };
    const getChantierColor = (week, selectedYear, chantier) => {
      if (!week || !selectedYear || !chantier) return null;
      if (!chantier.date_rea || !Array.isArray(chantier.date_rea) || chantier.date_rea.length === 0) {
        return null;
      }
      const { etat } = chantier;
      const dateFromWeek = (week2, year) => {
        const jan4 = new Date(year, 0, 4);
        const jan4Day = jan4.getDay() || 7;
        const mondayWeek1 = new Date(jan4);
        mondayWeek1.setDate(jan4.getDate() - (jan4Day - 1));
        const d = new Date(mondayWeek1);
        d.setDate(mondayWeek1.getDate() + (week2 - 1) * 7);
        return d;
      };
      const weekDate = dateFromWeek(week, selectedYear);
      const isInPeriod = chantier.date_rea.some((periode) => {
        if (!periode.date_start_travaux) return false;
        const start = new Date(periode.date_start_travaux);
        const end = periode.date_end_travaux ? new Date(periode.date_end_travaux) : start;
        return weekDate >= start && weekDate <= end;
      });
      if (!isInPeriod) return null;
      switch (etat) {
        case 2:
          return "bg-lime-500/60 border border-lime-600";
        case 1:
          return "bg-purple-500/60 border border-purple-600";
        case 0:
          return "bg-sky-500/60 border border-sky-600";
        case -1:
          return "bg-slate-500/60 border border-slate-600";
        default:
          return "bg-gray-500/60 border border-gray-600";
      }
    };
    const getEtatColor = (etat) => {
      switch (etat) {
        case 2:
          return "bg-lime-500";
        case 1:
          return "bg-purple-500";
        case 0:
          return "bg-sky-500";
        case -1:
          return "bg-slate-500";
        default:
          return "bg-gray-500";
      }
    };
    const getContactName = (chantierId, contactType, isSecondary = false) => {
      if (!allContactsTravaux.value || !Array.isArray(allContactsTravaux.value)) return null;
      const contact = allContactsTravaux.value.find((c) => c.chantier_id === chantierId);
      if (!contact) return null;
      const contactData = contact[contactType];
      if (isSecondary && Array.isArray(contactData)) {
        if (contactData.length === 0) return null;
        return contactData[0];
      }
      return contactData || null;
    };
    const getUserInfo = (userId) => {
      if (!userId || !users.value) return null;
      const user = users.value.find((u) => u.id === userId);
      if (!user) return null;
      return {
        nom: user.nom || "",
        prenom: user.prenom || "",
        fullName: user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.email || "-"
      };
    };
    const getContactInfo = (chantierId, contactType, isSecondary = false) => {
      const contactId = getContactName(chantierId, contactType, isSecondary);
      if (!contactId) return null;
      return getUserInfo(contactId);
    };
    const getAllSecondaryContacts = (chantierId, contactType) => {
      if (!allContactsTravaux.value || !Array.isArray(allContactsTravaux.value)) return [];
      const contact = allContactsTravaux.value.find((c) => c.chantier_id === chantierId);
      if (!contact) return [];
      const contactData = contact[contactType];
      if (!Array.isArray(contactData) || contactData.length === 0) return [];
      return contactData.map((userId) => getUserInfo(userId)).filter((info) => info !== null);
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_AppTooltip = __nuxt_component_1;
      const _component_AppAvatar = _sfc_main$1$1;
      _push(`<tr${ssrRenderAttrs(mergeProps({ class: "group transition-colors hover:bg-gray-200 dark:hover:bg-gray-700/30" }, _attrs))}><td class="sticky left-0 z-10 border-r border-gray-200 bg-white px-2 py-1 transition-colors group-hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:group-hover:bg-gray-700/30">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: `/chantiers/${__props.chantier.id}`,
        class: "truncate text-sm font-medium text-gray-700 transition-colors dark:text-white",
        title: __props.chantier.name
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex items-center gap-1.5"${_scopeId}><span class="${ssrRenderClass([getEtatColor(__props.chantier.etat), "h-3 w-1 shrink-0 rounded-full"])}"${_scopeId}></span><span class="shrink-0 rounded bg-gray-100 px-1 py-0.5 font-mono text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-400"${_scopeId}>${ssrInterpolate(__props.chantier.compte || "-")}</span> ${ssrInterpolate(__props.chantier.name || "Sans intitulé")}</div>`);
          } else {
            return [
              createVNode("div", { class: "flex items-center gap-1.5" }, [
                createVNode("span", {
                  class: ["h-3 w-1 shrink-0 rounded-full", getEtatColor(__props.chantier.etat)]
                }, null, 2),
                createVNode("span", { class: "shrink-0 rounded bg-gray-100 px-1 py-0.5 font-mono text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-400" }, toDisplayString(__props.chantier.compte || "-"), 1),
                createTextVNode(" " + toDisplayString(__props.chantier.name || "Sans intitulé"), 1)
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</td><!--[-->`);
      ssrRenderList(__props.weeks, (week) => {
        _push(`<td class="${ssrRenderClass([[
          {
            "bg-gray-200 dark:bg-gray-700/30": __props.hoveredWeek === week.number,
            "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold": week.number === getWeekNumber(/* @__PURE__ */ new Date()) && __props.selectedYear === (/* @__PURE__ */ new Date()).getFullYear()
          },
          __props.clickable ? "cursor-pointer" : ""
        ], "relative px-px"])}"><div class="relative h-2.5">`);
        if (getChantierPrepaColor(week.number, __props.selectedYear, __props.chantier)) {
          _push(`<div class="${ssrRenderClass([getChantierPrepaColor(week.number, __props.selectedYear, __props.chantier), "absolute inset-0 rounded-xs opacity-50"])}"></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="${ssrRenderClass([getChantierColor(week.number, __props.selectedYear, __props.chantier), "absolute inset-0 rounded-xs border border-gray-200"])}"></div>`);
        if (unref(isWeekendForChantier)(week.number, __props.selectedYear, __props.chantier.id)) {
          _push(`<div class="absolute -top-1.5 -right-[3px] -bottom-1.5 z-2 w-[4px] bg-orange-500"${ssrRenderAttr("title", `Week-end S${week.number}`)}></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></td>`);
      });
      _push(`<!--]-->`);
      if (__props.showContacts) {
        _push(`<!--[--><td class="border-r border-l border-gray-200 dark:border-gray-700">`);
        if (getContactInfo(__props.chantier.id, "rlt_voie_principale")) {
          _push(ssrRenderComponent(_component_AppTooltip, {
            text: getContactInfo(__props.chantier.id, "rlt_voie_principale").fullName,
            class: "h-full w-full"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<div class="flex h-full w-full items-center justify-center"${_scopeId}>`);
                _push2(ssrRenderComponent(_component_AppAvatar, {
                  nom: getContactInfo(__props.chantier.id, "rlt_voie_principale").nom,
                  prenom: getContactInfo(__props.chantier.id, "rlt_voie_principale").prenom,
                  size: "xs",
                  color: "bg-purple-200 text-purple-600"
                }, null, _parent2, _scopeId));
                _push2(`</div>`);
              } else {
                return [
                  createVNode("div", { class: "flex h-full w-full items-center justify-center" }, [
                    createVNode(_component_AppAvatar, {
                      nom: getContactInfo(__props.chantier.id, "rlt_voie_principale").nom,
                      prenom: getContactInfo(__props.chantier.id, "rlt_voie_principale").prenom,
                      size: "xs",
                      color: "bg-purple-200 text-purple-600"
                    }, null, 8, ["nom", "prenom"])
                  ])
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<div class="flex h-full w-full items-center justify-center text-gray-400">-</div>`);
        }
        _push(`</td><td class="border-r border-l border-gray-200 dark:border-gray-700">`);
        if (getAllSecondaryContacts(__props.chantier.id, "rlt_voie_secondaire").length > 0) {
          _push(`<div class="flex h-full w-full items-center justify-center"><div class="flex -space-x-2"><!--[-->`);
          ssrRenderList(getAllSecondaryContacts(__props.chantier.id, "rlt_voie_secondaire"), (contact, idx) => {
            _push(ssrRenderComponent(_component_AppTooltip, {
              key: idx,
              text: contact.fullName,
              class: "hover:z-10"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(ssrRenderComponent(_component_AppAvatar, {
                    nom: contact.nom,
                    prenom: contact.prenom,
                    size: "xs",
                    class: "ring-2 ring-white dark:ring-gray-800",
                    color: "bg-purple-200 text-purple-600"
                  }, null, _parent2, _scopeId));
                } else {
                  return [
                    createVNode(_component_AppAvatar, {
                      nom: contact.nom,
                      prenom: contact.prenom,
                      size: "xs",
                      class: "ring-2 ring-white dark:ring-gray-800",
                      color: "bg-purple-200 text-purple-600"
                    }, null, 8, ["nom", "prenom"])
                  ];
                }
              }),
              _: 2
            }, _parent));
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<div class="flex h-full w-full items-center justify-center text-gray-400">-</div>`);
        }
        _push(`</td><td class="border-r border-l border-gray-200 dark:border-gray-700">`);
        if (getAllSecondaryContacts(__props.chantier.id, "kv_voie").length > 0) {
          _push(`<div class="flex h-full w-full items-center justify-center"><div class="flex -space-x-2"><!--[-->`);
          ssrRenderList(getAllSecondaryContacts(__props.chantier.id, "kv_voie"), (contact, idx) => {
            _push(ssrRenderComponent(_component_AppTooltip, {
              key: idx,
              text: contact.fullName,
              class: "hover:z-10"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(ssrRenderComponent(_component_AppAvatar, {
                    nom: contact.nom,
                    prenom: contact.prenom,
                    size: "xs",
                    class: "ring-2 ring-white dark:ring-gray-800",
                    color: "bg-purple-200 text-purple-600"
                  }, null, _parent2, _scopeId));
                } else {
                  return [
                    createVNode(_component_AppAvatar, {
                      nom: contact.nom,
                      prenom: contact.prenom,
                      size: "xs",
                      class: "ring-2 ring-white dark:ring-gray-800",
                      color: "bg-purple-200 text-purple-600"
                    }, null, 8, ["nom", "prenom"])
                  ];
                }
              }),
              _: 2
            }, _parent));
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<div class="flex h-full w-full items-center justify-center text-gray-400">-</div>`);
        }
        _push(`</td><td class="border-r border-l border-gray-200 dark:border-gray-700">`);
        if (getContactInfo(__props.chantier.id, "rlt_ses_principale")) {
          _push(ssrRenderComponent(_component_AppTooltip, {
            text: getContactInfo(__props.chantier.id, "rlt_ses_principale").fullName,
            class: "h-full w-full"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<div class="flex h-full w-full items-center justify-center"${_scopeId}>`);
                _push2(ssrRenderComponent(_component_AppAvatar, {
                  nom: getContactInfo(__props.chantier.id, "rlt_ses_principale").nom,
                  prenom: getContactInfo(__props.chantier.id, "rlt_ses_principale").prenom,
                  size: "xs",
                  color: "bg-primary-200 text-primary-600"
                }, null, _parent2, _scopeId));
                _push2(`</div>`);
              } else {
                return [
                  createVNode("div", { class: "flex h-full w-full items-center justify-center" }, [
                    createVNode(_component_AppAvatar, {
                      nom: getContactInfo(__props.chantier.id, "rlt_ses_principale").nom,
                      prenom: getContactInfo(__props.chantier.id, "rlt_ses_principale").prenom,
                      size: "xs",
                      color: "bg-primary-200 text-primary-600"
                    }, null, 8, ["nom", "prenom"])
                  ])
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<div class="flex h-full w-full items-center justify-center text-gray-400">-</div>`);
        }
        _push(`</td><td class="border-r border-l border-gray-200 dark:border-gray-700">`);
        if (getAllSecondaryContacts(__props.chantier.id, "rlt_ses_secondaire").length > 0) {
          _push(`<div class="flex h-full w-full items-center justify-center"><div class="flex -space-x-2"><!--[-->`);
          ssrRenderList(getAllSecondaryContacts(__props.chantier.id, "rlt_ses_secondaire"), (contact, idx) => {
            _push(ssrRenderComponent(_component_AppTooltip, {
              key: idx,
              text: contact.fullName,
              class: "hover:z-10"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(ssrRenderComponent(_component_AppAvatar, {
                    nom: contact.nom,
                    prenom: contact.prenom,
                    size: "xs",
                    class: "ring-2 ring-white dark:ring-gray-800",
                    color: "bg-primary-200 text-primary-600"
                  }, null, _parent2, _scopeId));
                } else {
                  return [
                    createVNode(_component_AppAvatar, {
                      nom: contact.nom,
                      prenom: contact.prenom,
                      size: "xs",
                      class: "ring-2 ring-white dark:ring-gray-800",
                      color: "bg-primary-200 text-primary-600"
                    }, null, 8, ["nom", "prenom"])
                  ];
                }
              }),
              _: 2
            }, _parent));
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<div class="flex h-full w-full items-center justify-center text-gray-400">-</div>`);
        }
        _push(`</td><td class="border-r border-l border-gray-200 dark:border-gray-700">`);
        if (getAllSecondaryContacts(__props.chantier.id, "kv_ses").length > 0) {
          _push(`<div class="flex h-full w-full items-center justify-center"><div class="flex -space-x-2"><!--[-->`);
          ssrRenderList(getAllSecondaryContacts(__props.chantier.id, "kv_ses"), (contact, idx) => {
            _push(ssrRenderComponent(_component_AppTooltip, {
              key: idx,
              text: contact.fullName,
              class: "hover:z-10"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(ssrRenderComponent(_component_AppAvatar, {
                    nom: contact.nom,
                    prenom: contact.prenom,
                    size: "xs",
                    class: "ring-2 ring-white dark:ring-gray-800",
                    color: "bg-primary-200 text-primary-600"
                  }, null, _parent2, _scopeId));
                } else {
                  return [
                    createVNode(_component_AppAvatar, {
                      nom: contact.nom,
                      prenom: contact.prenom,
                      size: "xs",
                      class: "ring-2 ring-white dark:ring-gray-800",
                      color: "bg-primary-200 text-primary-600"
                    }, null, 8, ["nom", "prenom"])
                  ];
                }
              }),
              _: 2
            }, _parent));
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<div class="flex h-full w-full items-center justify-center text-gray-400">-</div>`);
        }
        _push(`</td><td class="border-r border-l border-gray-200 dark:border-gray-700">`);
        if (getContactInfo(__props.chantier.id, "rlt_cat_principale")) {
          _push(ssrRenderComponent(_component_AppTooltip, {
            text: getContactInfo(__props.chantier.id, "rlt_cat_principale").fullName,
            class: "h-full w-full"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<div class="flex h-full w-full items-center justify-center"${_scopeId}>`);
                _push2(ssrRenderComponent(_component_AppAvatar, {
                  nom: getContactInfo(__props.chantier.id, "rlt_cat_principale").nom,
                  prenom: getContactInfo(__props.chantier.id, "rlt_cat_principale").prenom,
                  size: "xs",
                  color: "bg-blue-200 text-blue-600"
                }, null, _parent2, _scopeId));
                _push2(`</div>`);
              } else {
                return [
                  createVNode("div", { class: "flex h-full w-full items-center justify-center" }, [
                    createVNode(_component_AppAvatar, {
                      nom: getContactInfo(__props.chantier.id, "rlt_cat_principale").nom,
                      prenom: getContactInfo(__props.chantier.id, "rlt_cat_principale").prenom,
                      size: "xs",
                      color: "bg-blue-200 text-blue-600"
                    }, null, 8, ["nom", "prenom"])
                  ])
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<div class="flex h-full w-full items-center justify-center text-gray-400">-</div>`);
        }
        _push(`</td><td class="border-r border-l border-gray-200 dark:border-gray-700">`);
        if (getAllSecondaryContacts(__props.chantier.id, "rlt_cat_secondaire").length > 0) {
          _push(`<div class="flex h-full w-full items-center justify-center"><div class="flex -space-x-2"><!--[-->`);
          ssrRenderList(getAllSecondaryContacts(__props.chantier.id, "rlt_cat_secondaire"), (contact, idx) => {
            _push(ssrRenderComponent(_component_AppTooltip, {
              key: idx,
              text: contact.fullName,
              position: "left",
              class: "hover:z-10"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(ssrRenderComponent(_component_AppAvatar, {
                    nom: contact.nom,
                    prenom: contact.prenom,
                    size: "xs",
                    class: "ring-2 ring-white dark:ring-gray-800",
                    color: "bg-blue-200 text-blue-600"
                  }, null, _parent2, _scopeId));
                } else {
                  return [
                    createVNode(_component_AppAvatar, {
                      nom: contact.nom,
                      prenom: contact.prenom,
                      size: "xs",
                      class: "ring-2 ring-white dark:ring-gray-800",
                      color: "bg-blue-200 text-blue-600"
                    }, null, 8, ["nom", "prenom"])
                  ];
                }
              }),
              _: 2
            }, _parent));
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<div class="flex h-full w-full items-center justify-center text-gray-400">-</div>`);
        }
        _push(`</td><td class="border-r border-l border-gray-200 dark:border-gray-700">`);
        if (getAllSecondaryContacts(__props.chantier.id, "kv_cat").length > 0) {
          _push(`<div class="flex h-full w-full items-center justify-center"><div class="flex -space-x-2"><!--[-->`);
          ssrRenderList(getAllSecondaryContacts(__props.chantier.id, "kv_cat"), (contact, idx) => {
            _push(ssrRenderComponent(_component_AppTooltip, {
              key: idx,
              text: contact.fullName,
              class: "hover:z-10"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(ssrRenderComponent(_component_AppAvatar, {
                    nom: contact.nom,
                    prenom: contact.prenom,
                    size: "xs",
                    class: "ring-2 ring-white dark:ring-gray-800",
                    color: "bg-blue-200 text-blue-600"
                  }, null, _parent2, _scopeId));
                } else {
                  return [
                    createVNode(_component_AppAvatar, {
                      nom: contact.nom,
                      prenom: contact.prenom,
                      size: "xs",
                      class: "ring-2 ring-white dark:ring-gray-800",
                      color: "bg-blue-200 text-blue-600"
                    }, null, 8, ["nom", "prenom"])
                  ];
                }
              }),
              _: 2
            }, _parent));
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<div class="flex h-full w-full items-center justify-center text-gray-400">-</div>`);
        }
        _push(`</td><td class="border-r border-l border-gray-200 dark:border-gray-700">`);
        if (getContactInfo(__props.chantier.id, "preop_voie")) {
          _push(ssrRenderComponent(_component_AppTooltip, {
            text: getContactInfo(__props.chantier.id, "preop_voie").fullName,
            class: "h-full w-full"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<div class="flex h-full w-full items-center justify-center"${_scopeId}>`);
                _push2(ssrRenderComponent(_component_AppAvatar, {
                  nom: getContactInfo(__props.chantier.id, "preop_voie").nom,
                  prenom: getContactInfo(__props.chantier.id, "preop_voie").prenom,
                  size: "xs",
                  color: "bg-emerald-200 text-emerald-600"
                }, null, _parent2, _scopeId));
                _push2(`</div>`);
              } else {
                return [
                  createVNode("div", { class: "flex h-full w-full items-center justify-center" }, [
                    createVNode(_component_AppAvatar, {
                      nom: getContactInfo(__props.chantier.id, "preop_voie").nom,
                      prenom: getContactInfo(__props.chantier.id, "preop_voie").prenom,
                      size: "xs",
                      color: "bg-emerald-200 text-emerald-600"
                    }, null, 8, ["nom", "prenom"])
                  ])
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<div class="flex h-full w-full items-center justify-center text-gray-400">-</div>`);
        }
        _push(`</td><td class="border-r border-l border-gray-200 dark:border-gray-700">`);
        if (getContactInfo(__props.chantier.id, "preop_ses")) {
          _push(ssrRenderComponent(_component_AppTooltip, {
            text: getContactInfo(__props.chantier.id, "preop_ses").fullName,
            position: "left",
            class: "h-full w-full"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<div class="flex h-full w-full items-center justify-center"${_scopeId}>`);
                _push2(ssrRenderComponent(_component_AppAvatar, {
                  nom: getContactInfo(__props.chantier.id, "preop_ses").nom,
                  prenom: getContactInfo(__props.chantier.id, "preop_ses").prenom,
                  size: "xs",
                  color: "bg-emerald-200 text-emerald-600"
                }, null, _parent2, _scopeId));
                _push2(`</div>`);
              } else {
                return [
                  createVNode("div", { class: "flex h-full w-full items-center justify-center" }, [
                    createVNode(_component_AppAvatar, {
                      nom: getContactInfo(__props.chantier.id, "preop_ses").nom,
                      prenom: getContactInfo(__props.chantier.id, "preop_ses").prenom,
                      size: "xs",
                      color: "bg-emerald-200 text-emerald-600"
                    }, null, 8, ["nom", "prenom"])
                  ])
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<div class="flex h-full w-full items-center justify-center text-gray-400">-</div>`);
        }
        _push(`</td><td class="border-r border-l border-gray-200 dark:border-gray-700">`);
        if (getContactInfo(__props.chantier.id, "logistique")) {
          _push(ssrRenderComponent(_component_AppTooltip, {
            text: getContactInfo(__props.chantier.id, "logistique").fullName,
            position: "left",
            class: "h-full w-full"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<div class="flex h-full w-full items-center justify-center"${_scopeId}>`);
                _push2(ssrRenderComponent(_component_AppAvatar, {
                  nom: getContactInfo(__props.chantier.id, "logistique").nom,
                  prenom: getContactInfo(__props.chantier.id, "logistique").prenom,
                  size: "xs",
                  color: "bg-emerald-200 text-emerald-600"
                }, null, _parent2, _scopeId));
                _push2(`</div>`);
              } else {
                return [
                  createVNode("div", { class: "flex h-full w-full items-center justify-center" }, [
                    createVNode(_component_AppAvatar, {
                      nom: getContactInfo(__props.chantier.id, "logistique").nom,
                      prenom: getContactInfo(__props.chantier.id, "logistique").prenom,
                      size: "xs",
                      color: "bg-emerald-200 text-emerald-600"
                    }, null, 8, ["nom", "prenom"])
                  ])
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<div class="flex h-full w-full items-center justify-center text-gray-400">-</div>`);
        }
        _push(`</td><!--]-->`);
      } else {
        _push(`<!---->`);
      }
      _push(`</tr>`);
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/chantier/timelineRow.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = {
  __name: "plan-de-charge-general",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({
      title: "H00 - Plan de Charge Général",
      description: "Calendrier annuel des chantiers"
    });
    const { getChantiers, createChantier, updateChantier } = useChantiers();
    const {
      users,
      getUsersRltVoie,
      getUsersRltSes,
      getUsersRltCat,
      getUsersLogistique,
      getUsersKvVoie,
      getUsersKvSes,
      getUsersKvCat,
      getUsersPreopVoie,
      getUsersPreopSes,
      getUsersRefRdu
    } = useUsers();
    const { getAllContactsTravaux, upsertContactsTravaux, getContactsTravaux } = useContacts();
    const { setLoader } = useLoader();
    const { taches } = useTaches();
    const { createH00Entries, recalculateH00Previsions } = useH00();
    const { addToast } = useToast();
    const { addWeekend, getAllWeekends, getWeekendsByChantier, replaceWeekendsForChantier } = useTimeline();
    const { isAdmin, isSuperAdmin } = useLevelUser();
    const canEdit = computed(() => isAdmin.value || isSuperAdmin.value);
    const allChantiers = useState("allChantiers");
    const selectedYear = ref((/* @__PURE__ */ new Date()).getFullYear());
    const hoveredWeek = ref(null);
    const isEditMode = ref(false);
    const editingChantierId = ref(null);
    const originalDateRea = ref([]);
    const originalEtat = ref(null);
    const newChantier = ref({
      entite: "uo_travaux",
      compte: "",
      name: "",
      weekends: [],
      preparation: [],
      realisation: [],
      autre: "",
      rlt_voie_principale: null,
      rlt_voie_secondaire: [],
      rlt_ses_principale: null,
      rlt_ses_secondaire: [],
      rlt_cat_principale: null,
      rlt_cat_secondaire: [],
      preop_ses: null,
      preop_voie: null,
      logistique: null,
      supervisor: [],
      kv_voie: [],
      kv_ses: [],
      kv_cat: []
    });
    const timestampToISODate = (timestamp) => {
      if (!timestamp) return null;
      const date = new Date(timestamp);
      return date.toISOString().split("T")[0];
    };
    const getEarliestDate = (periods) => {
      if (!periods || periods.length === 0) return null;
      const dates = periods.map((p) => p.date_start).filter((d) => d).map((d) => new Date(d)).sort((a, b) => a - b);
      return dates.length > 0 ? dates[0] : null;
    };
    const calculatePrevisionDate = (referenceDate, delais, optDelais, endDate = null) => {
      if (!referenceDate) return null;
      let baseDate;
      if (optDelais === 1 && endDate) {
        baseDate = new Date(endDate);
      } else {
        baseDate = new Date(referenceDate);
      }
      baseDate.setDate(baseDate.getDate() - delais);
      return baseDate.toISOString().split("T")[0];
    };
    const isSubmitting = ref(false);
    const handleFormSubmit = async (formData) => {
      newChantier.value = { ...formData };
      if (isEditMode.value) {
        await handleSaveEdit();
      } else {
        await handleComplete();
      }
    };
    const handleComplete = async () => {
      if (isSubmitting.value) return;
      isSubmitting.value = true;
      setLoader(true);
      try {
        const etat = newChantier.value.entite === "uo_travaux" ? 2 : 1;
        const dateRea = newChantier.value.realisation.map((r) => ({
          date_start_travaux: timestampToISODate(r.date_start),
          date_end_travaux: timestampToISODate(r.date_end)
        }));
        const datePrepa = newChantier.value.preparation.map((p) => ({
          date_start_prepa: timestampToISODate(p.date_start),
          date_end_prepa: timestampToISODate(p.date_end)
        }));
        const chantierData = {
          compte: newChantier.value.compte,
          name: newChantier.value.name,
          etat,
          date_rea: dateRea,
          date_prepa: datePrepa,
          autre: newChantier.value.autre || null
        };
        const createdChantier = await createChantier(chantierData);
        if (!createdChantier) {
          throw new Error("Erreur lors de la création du chantier");
        }
        const contactsData = {
          rlt_voie_principale: newChantier.value.rlt_voie_principale,
          rlt_voie_secondaire: newChantier.value.rlt_voie_secondaire || [],
          rlt_ses_principale: newChantier.value.rlt_ses_principale,
          rlt_ses_secondaire: newChantier.value.rlt_ses_secondaire || [],
          rlt_cat_principale: newChantier.value.rlt_cat_principale,
          rlt_cat_secondaire: newChantier.value.rlt_cat_secondaire || [],
          kv_voie: newChantier.value.kv_voie || [],
          kv_ses: newChantier.value.kv_ses || [],
          kv_cat: newChantier.value.kv_cat || [],
          preop_voie: newChantier.value.preop_voie,
          preop_ses: newChantier.value.preop_ses,
          logistique: newChantier.value.logistique,
          supervisor: newChantier.value.supervisor || []
        };
        await upsertContactsTravaux(createdChantier.id, contactsData);
        if (etat === 2 && taches.value.length > 0) {
          const earliestReaDate = getEarliestDate(newChantier.value.realisation);
          const latestEndDate = newChantier.value.realisation.length > 0 ? new Date(
            Math.max(
              ...newChantier.value.realisation.map(
                (r) => r.date_end ? new Date(r.date_end) : new Date(r.date_start)
              )
            )
          ) : null;
          if (earliestReaDate) {
            const h00Entries = taches.value.map((tache) => {
              const previsionDate = calculatePrevisionDate(
                earliestReaDate,
                tache.delais || 0,
                tache.opt_delais || 0,
                latestEndDate
              );
              return {
                chantier_id: createdChantier.id,
                tache_id: tache.id,
                categorie_id: tache.id_categories,
                prevision: previsionDate,
                realisation: null,
                commentaire: null
              };
            });
            await createH00Entries(h00Entries);
          }
        }
        if (newChantier.value.weekends.length > 0) {
          for (const weekend of newChantier.value.weekends) {
            await addWeekend(
              createdChantier.id,
              weekend.debutSemaine,
              weekend.debutAnnee,
              weekend.finSemaine,
              weekend.finAnnee
            );
          }
        }
        await Promise.all([getAllContactsTravaux(), getAllWeekends()]);
        addToast({
          title: "Chantier créé",
          message: `Le chantier "${newChantier.value.name}" a été créé avec succès.`,
          type: "Success"
        });
        drawerOpen.value = false;
        resetNewChantier();
      } catch (err) {
        console.error("Erreur lors de la création du chantier:", err);
        addToast({
          title: "Erreur",
          message: err.message || "Une erreur est survenue lors de la création du chantier",
          type: "Error"
        });
      } finally {
        isSubmitting.value = false;
        setLoader(false);
      }
    };
    const resetNewChantier = () => {
      newChantier.value = {
        entite: "uo_travaux",
        compte: "",
        name: "",
        weekends: [],
        preparation: [],
        realisation: [],
        autre: [],
        rlt_voie_principale: null,
        rlt_voie_secondaire: [],
        rlt_ses_principale: null,
        rlt_ses_secondaire: [],
        rlt_cat_principale: null,
        rlt_cat_secondaire: [],
        preop_ses: null,
        preop_voie: null,
        logistique: null,
        supervisor: [],
        kv_voie: [],
        kv_ses: [],
        kv_cat: []
      };
      initializeDefaultUsers();
    };
    const searchQuery = ref("");
    const drawerOpen = ref(false);
    const toggleDrawer = () => {
      drawerOpen.value = !drawerOpen.value;
      if (!drawerOpen.value) {
        isEditMode.value = false;
        editingChantierId.value = null;
      }
    };
    const openCreateDrawer = () => {
      isEditMode.value = false;
      editingChantierId.value = null;
      resetNewChantier();
      drawerOpen.value = true;
    };
    const openEditDrawer = async (chantier) => {
      setLoader(true);
      try {
        isEditMode.value = true;
        editingChantierId.value = chantier.id;
        const contactsData = await getContactsTravaux(chantier.id);
        const weekendsData = await getWeekendsByChantier(chantier.id);
        const realisations = (chantier.date_rea || []).map((r) => ({
          date_start: r.date_start_travaux ? new Date(r.date_start_travaux).getTime() : null,
          date_end: r.date_end_travaux ? new Date(r.date_end_travaux).getTime() : null
        }));
        const preparations = (chantier.date_prepa || []).map((p) => ({
          date_start: p.date_start_prepa ? new Date(p.date_start_prepa).getTime() : null,
          date_end: p.date_end_prepa ? new Date(p.date_end_prepa).getTime() : null
        }));
        const weekends = (weekendsData || []).map((w) => ({
          debutSemaine: w.semaine_debut,
          debutAnnee: w.annee_debut,
          finSemaine: w.semaine_fin,
          finAnnee: w.annee_fin
        }));
        originalDateRea.value = JSON.stringify(chantier.date_rea || []);
        originalEtat.value = chantier.etat;
        newChantier.value = {
          entite: chantier.etat !== 1 ? "uo_travaux" : "autre",
          compte: chantier.compte || "",
          name: chantier.name || "",
          weekends,
          preparation: preparations,
          realisation: realisations,
          autre: chantier.autre || "",
          rlt_voie_principale: contactsData?.rlt_voie_principale || null,
          rlt_voie_secondaire: contactsData?.rlt_voie_secondaire || [],
          rlt_ses_principale: contactsData?.rlt_ses_principale || null,
          rlt_ses_secondaire: contactsData?.rlt_ses_secondaire || [],
          rlt_cat_principale: contactsData?.rlt_cat_principale || null,
          rlt_cat_secondaire: contactsData?.rlt_cat_secondaire || [],
          preop_ses: contactsData?.preop_ses || null,
          preop_voie: contactsData?.preop_voie || null,
          logistique: contactsData?.logistique || null,
          supervisor: contactsData?.supervisor || [],
          kv_voie: contactsData?.kv_voie || [],
          kv_ses: contactsData?.kv_ses || [],
          kv_cat: contactsData?.kv_cat || []
        };
        drawerOpen.value = true;
      } catch (err) {
        console.error("Erreur lors du chargement du chantier:", err);
        addToast({
          title: "Erreur",
          message: "Impossible de charger les données du chantier",
          type: "Error"
        });
      } finally {
        setLoader(false);
      }
    };
    const handleSaveEdit = async () => {
      if (isSubmitting.value) return;
      isSubmitting.value = true;
      setLoader(true);
      try {
        const wasExternal = originalEtat.value === 1;
        const isNowExternal = newChantier.value.entite === "autre";
        let etat;
        if (wasExternal !== isNowExternal) {
          etat = isNowExternal ? 1 : 2;
        } else {
          etat = originalEtat.value;
        }
        const dateRea = newChantier.value.realisation.map((r) => ({
          date_start_travaux: timestampToISODate(r.date_start),
          date_end_travaux: timestampToISODate(r.date_end)
        }));
        const datePrepa = newChantier.value.preparation.map((p) => ({
          date_start_prepa: timestampToISODate(p.date_start),
          date_end_prepa: timestampToISODate(p.date_end)
        }));
        await updateChantier(editingChantierId.value, {
          compte: newChantier.value.compte,
          name: newChantier.value.name,
          etat,
          date_rea: dateRea,
          date_prepa: datePrepa,
          autre: newChantier.value.autre || null
        });
        const contactsData = {
          rlt_voie_principale: newChantier.value.rlt_voie_principale,
          rlt_voie_secondaire: newChantier.value.rlt_voie_secondaire || [],
          rlt_ses_principale: newChantier.value.rlt_ses_principale,
          rlt_ses_secondaire: newChantier.value.rlt_ses_secondaire || [],
          rlt_cat_principale: newChantier.value.rlt_cat_principale,
          rlt_cat_secondaire: newChantier.value.rlt_cat_secondaire || [],
          kv_voie: newChantier.value.kv_voie || [],
          kv_ses: newChantier.value.kv_ses || [],
          kv_cat: newChantier.value.kv_cat || [],
          preop_voie: newChantier.value.preop_voie,
          preop_ses: newChantier.value.preop_ses,
          logistique: newChantier.value.logistique,
          supervisor: newChantier.value.supervisor || []
        };
        await upsertContactsTravaux(editingChantierId.value, contactsData);
        await replaceWeekendsForChantier(editingChantierId.value, newChantier.value.weekends);
        const newDateReaStr = JSON.stringify(dateRea);
        if (etat !== 1 && originalDateRea.value !== newDateReaStr && taches.value.length > 0) {
          const { updated } = await recalculateH00Previsions(editingChantierId.value, dateRea, taches.value);
          if (updated > 0) {
            addToast({
              title: "Tâches H00 recalculées",
              message: `${updated} dates de prévision ont été mises à jour.`,
              type: "Info"
            });
          }
        }
        await Promise.all([getChantiers(), getAllContactsTravaux(), getAllWeekends()]);
        addToast({
          title: "Chantier mis à jour",
          message: `Le chantier "${newChantier.value.name}" a été modifié avec succès.`,
          type: "Success"
        });
        drawerOpen.value = false;
        isEditMode.value = false;
        editingChantierId.value = null;
      } catch (err) {
        console.error("Erreur lors de la mise à jour:", err);
        addToast({
          title: "Erreur",
          message: err.message || "Une erreur est survenue",
          type: "Error"
        });
      } finally {
        isSubmitting.value = false;
        setLoader(false);
      }
    };
    const weeks = computed(() => {
      return Array.from({ length: 53 }, (_, i) => ({
        number: i + 1,
        label: `${i + 1}`
      }));
    });
    const getWeekNumber = (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + 4 - (d.getDay() || 7));
      const yearStart = new Date(d.getFullYear(), 0, 1);
      return Math.ceil(((d - yearStart) / 864e5 + 1) / 7);
    };
    const isPeriodInYear = (startDateStr, endDateStr, year) => {
      if (!startDateStr) return false;
      const startDate = new Date(startDateStr);
      const endDate = endDateStr ? new Date(endDateStr) : startDate;
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();
      return startYear <= year && endYear >= year;
    };
    const isChantierVisibleForYear = (chantier, year) => {
      const hasReaInYear = chantier.date_rea?.some((p) => isPeriodInYear(p.date_start_travaux, p.date_end_travaux, year));
      if (hasReaInYear) return true;
      const hasPrepaInYear = chantier.date_prepa?.some((p) => isPeriodInYear(p.date_start_prepa, p.date_end_prepa, year));
      if (hasPrepaInYear) return true;
      const weekendsForChantier = allWeekends.value?.filter((w) => w.chantier_id === chantier.id) || [];
      const hasWeekendInYear = weekendsForChantier.some((w) => w.annee_debut === year || w.annee_fin === year);
      if (hasWeekendInYear) return true;
      return false;
    };
    const allWeekends = useState("allWeekends");
    const filteredChantiers = computed(() => {
      if (!allChantiers.value || !Array.isArray(allChantiers.value)) return [];
      const search = searchQuery.value.toLowerCase().trim();
      return allChantiers.value.filter((chantier) => {
        if (search) {
          const matchCompte = chantier.compte?.toLowerCase().includes(search);
          const matchName = chantier.name?.toLowerCase().includes(search);
          const matchLigne = chantier.ligne?.toLowerCase().includes(search);
          if (!matchCompte && !matchName && !matchLigne) return false;
        }
        return isChantierVisibleForYear(chantier, selectedYear.value);
      }).sort((a, b) => {
        const getFirstDate = (chantier) => {
          if (chantier.date_rea?.[0]?.date_start_travaux) {
            return new Date(chantier.date_rea[0].date_start_travaux);
          }
          if (chantier.date_prepa?.[0]?.date_start_prepa) {
            return new Date(chantier.date_prepa[0].date_start_prepa);
          }
          return /* @__PURE__ */ new Date();
        };
        return getFirstDate(a) - getFirstDate(b);
      });
    });
    const initializeDefaultUsers = () => {
      if (getUsersPreopSes.value?.length > 0 && newChantier.value.preop_ses === null) {
        newChantier.value.preop_ses = getUsersPreopSes.value[0].id;
      }
      if (getUsersPreopVoie.value?.length > 0 && newChantier.value.preop_voie === null) {
        newChantier.value.preop_voie = getUsersPreopVoie.value[0].id;
      }
      if (getUsersLogistique.value?.length > 0 && newChantier.value.logistique === null) {
        newChantier.value.logistique = getUsersLogistique.value[0].id;
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppTitleMain = _sfc_main$3;
      const _component_AppInputSearch = __nuxt_component_1$1;
      const _component_AppButtonValidated = _sfc_main$2$1;
      const _component_Icon = __nuxt_component_1$2;
      const _component_ChantierTimelineRow = _sfc_main$1;
      const _component_AppDrawer = _sfc_main$4;
      const _component_AppDrawerContent = __nuxt_component_6;
      const _component_ChantierForm = _sfc_main$5;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex h-full w-full flex-col gap-4 overflow-hidden p-4 lg:px-4 lg:py-0 lg:pt-4" }, _attrs))} data-v-d5010226><div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" data-v-d5010226>`);
      _push(ssrRenderComponent(_component_AppTitleMain, {
        title: "Plan de charge générale",
        description: "Calendrier des chantiers pour l'année en cours"
      }, null, _parent));
      _push(`</div><div class="flex flex-col items-center justify-between gap-4 lg:flex-row" data-v-d5010226><div class="flex-1" data-v-d5010226>`);
      _push(ssrRenderComponent(_component_AppInputSearch, {
        modelValue: unref(searchQuery),
        "onUpdate:modelValue": ($event) => isRef(searchQuery) ? searchQuery.value = $event : null,
        class: "h-fit w-full max-w-sm",
        placeholder: "Rechercher un chantier ..."
      }, null, _parent));
      _push(`</div><div class="bg-red-20 flex flex-1 cursor-default items-center justify-center gap-2" data-v-d5010226><div class="rounded-md border border-slate-600 bg-slate-500/60 px-2 py-1 text-xs font-bold text-white" data-v-d5010226> Terminé </div><div class="rounded-md border border-sky-600 bg-sky-500/60 px-2 py-1 text-xs font-bold text-white" data-v-d5010226>RLT</div><div class="rounded-md border border-lime-600 bg-lime-500/60 px-2 py-1 text-xs font-bold text-white" data-v-d5010226> Pré-op </div><div class="rounded-md border border-purple-600 bg-purple-500/60 px-2 py-1 text-xs font-bold text-white" data-v-d5010226> Externe </div><div class="rounded-md border border-orange-600 bg-orange-500/60 px-2 py-1 text-xs font-bold text-white" data-v-d5010226> Week-end </div></div><div class="flex flex-1 justify-end" data-v-d5010226>`);
      if (unref(canEdit)) {
        _push(ssrRenderComponent(_component_AppButtonValidated, {
          theme: "primary",
          type: "button",
          onClick: openCreateDrawer,
          class: "h-fit w-44"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<span class="flex items-center gap-2 text-sm" data-v-d5010226${_scopeId}>`);
              _push2(ssrRenderComponent(_component_Icon, {
                name: "lucide:diamond-plus",
                size: "18"
              }, null, _parent2, _scopeId));
              _push2(` Nouveau chantier </span>`);
            } else {
              return [
                createVNode("span", { class: "flex items-center gap-2 text-sm" }, [
                  createVNode(_component_Icon, {
                    name: "lucide:diamond-plus",
                    size: "18"
                  }),
                  createTextVNode(" Nouveau chantier ")
                ])
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="h-fit overflow-auto rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800" data-v-d5010226><table class="w-full min-w-[1400px]" data-v-d5010226><thead class="sticky top-0 z-30" data-v-d5010226><tr class="bg-gray-50 dark:bg-gray-900/50" data-v-d5010226><th rowspan="2" class="sticky left-0 z-40 mx-auto min-w-[240px] border-r border-b border-gray-200 bg-gray-50 px-3 py-2 text-left text-[10px] font-semibold tracking-wider text-gray-600 uppercase dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400" data-v-d5010226><div class="flex items-center justify-center" data-v-d5010226><button class="flex cursor-pointer items-center rounded-l-lg px-2 text-gray-600 transition-colors hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700" title="Année précédente" data-v-d5010226>`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:chevron-left",
        size: "18"
      }, null, _parent));
      _push(`</button><span class="px-2 text-base font-semibold text-gray-700 dark:text-white" data-v-d5010226>${ssrInterpolate(unref(selectedYear))}</span><button class="flex cursor-pointer items-center rounded-r-lg px-2 text-gray-600 transition-colors hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700" title="Année suivante" data-v-d5010226>`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:chevron-right",
        size: "18"
      }, null, _parent));
      _push(`</button></div></th><!--[-->`);
      ssrRenderList(unref(weeks), (week) => {
        _push(`<th rowspan="2" class="${ssrRenderClass([{
          "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold": week.number === getWeekNumber(/* @__PURE__ */ new Date()) && unref(selectedYear) === (/* @__PURE__ */ new Date()).getFullYear(),
          "bg-gray-200 dark:bg-gray-700/30": unref(hoveredWeek) === week.number
        }, "min-w-[24px] border-b border-gray-200 px-0 text-center text-sm font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400"])}" data-v-d5010226>${ssrInterpolate(week.label)}</th>`);
      });
      _push(`<!--]--><th colspan="3" class="min-w-[24px] border-r border-l border-gray-200 px-0 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400" data-v-d5010226> RLT VOIE </th><th colspan="3" class="min-w-[24px] border-r border-l border-gray-200 px-0 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400" data-v-d5010226> RLT SES </th><th colspan="3" class="min-w-[24px] border-r border-l border-gray-200 px-0 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400" data-v-d5010226> RLT CAT </th><th colspan="3" class="min-w-[24px] border-r border-l border-gray-200 px-0 text-center text-xs font-medium text-gray-500 uppercase transition-colors dark:border-gray-700 dark:text-gray-400" data-v-d5010226> Pré-op </th></tr><tr class="bg-gray-50 dark:bg-gray-900/50" data-v-d5010226><th class="min-w-[56px] border-r border-l border-gray-200 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400" data-v-d5010226> 1er </th><th class="min-w-[56px] border-r border-l border-gray-200 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400" data-v-d5010226> 2nd </th><th class="min-w-[56px] border-r border-l border-gray-200 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400" data-v-d5010226> Kv </th><th class="min-w-[56px] border-r border-l border-gray-200 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400" data-v-d5010226> 1er </th><th class="min-w-[56px] border-r border-l border-gray-200 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400" data-v-d5010226> 2nd </th><th class="min-w-[56px] border-r border-l border-gray-200 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400" data-v-d5010226> Kv </th><th class="min-w-[56px] border-r border-l border-gray-200 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400" data-v-d5010226> 1er </th><th class="min-w-[56px] border-r border-l border-gray-200 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400" data-v-d5010226> 2nd </th><th class="min-w-[56px] border-r border-l border-gray-200 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400" data-v-d5010226> Kv </th><th class="min-w-[56px] border-r border-l border-gray-200 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400" data-v-d5010226> Voie </th><th class="min-w-[56px] border-r border-l border-gray-200 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400" data-v-d5010226> Ses </th><th class="min-w-[56px] border-r border-l border-gray-200 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400" data-v-d5010226> Log </th></tr></thead><tbody class="divide-y divide-gray-100 dark:divide-gray-700/50" data-v-d5010226><!--[-->`);
      ssrRenderList(unref(filteredChantiers), (chantier) => {
        _push(ssrRenderComponent(_component_ChantierTimelineRow, {
          key: chantier.id,
          chantier,
          weeks: unref(weeks),
          "selected-year": unref(selectedYear),
          "hovered-week": unref(hoveredWeek),
          "show-contacts": true,
          clickable: unref(canEdit),
          onWeekClick: openEditDrawer,
          onWeekHover: ($event) => hoveredWeek.value = $event,
          onWeekLeave: ($event) => hoveredWeek.value = null
        }, null, _parent));
      });
      _push(`<!--]-->`);
      if (unref(filteredChantiers).length === 0) {
        _push(`<tr data-v-d5010226><td colspan="54" class="px-6 py-12 text-center" data-v-d5010226><div class="flex flex-col items-center gap-3" data-v-d5010226>`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:calendar-x",
          size: "32",
          class: "text-gray-300 dark:text-gray-600"
        }, null, _parent));
        _push(`<p class="text-gray-500 dark:text-gray-400" data-v-d5010226>Aucun chantier pour l&#39;année ${ssrInterpolate(unref(selectedYear))}</p><div class="mt-2 flex gap-2" data-v-d5010226><button class="text-primary-600 hover:text-primary-700 dark:text-primary-400 cursor-pointer text-sm font-medium" data-v-d5010226> Revenir à ${ssrInterpolate((/* @__PURE__ */ new Date()).getFullYear())}</button></div></div></td></tr>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</tbody></table></div>`);
      _push(ssrRenderComponent(_component_AppDrawer, {
        "drawer-open": unref(drawerOpen),
        "close-drawer": toggleDrawer,
        "height-class": "h-[90vh] md:h-[70vh] "
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (unref(drawerOpen)) {
              _push2(ssrRenderComponent(_component_AppDrawerContent, {
                "drawer-open": unref(drawerOpen),
                "close-drawer": toggleDrawer,
                "height-class": "h-[90vh] md:h-[70vh]"
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(ssrRenderComponent(_component_ChantierForm, {
                      "model-value": unref(newChantier),
                      "is-edit-mode": unref(isEditMode),
                      "users-rlt-voie": unref(getUsersRltVoie),
                      "users-rlt-ses": unref(getUsersRltSes),
                      "users-rlt-cat": unref(getUsersRltCat),
                      "users-logistique": unref(getUsersLogistique),
                      "users-kv-voie": unref(getUsersKvVoie),
                      "users-kv-ses": unref(getUsersKvSes),
                      "users-kv-cat": unref(getUsersKvCat),
                      "users-preop-voie": unref(getUsersPreopVoie),
                      "users-preop-ses": unref(getUsersPreopSes),
                      "users-ref-rdu": unref(getUsersRefRdu),
                      users: unref(users),
                      taches: unref(taches),
                      "is-submitting": unref(isSubmitting),
                      onSubmit: handleFormSubmit,
                      onCancel: toggleDrawer
                    }, null, _parent3, _scopeId2));
                  } else {
                    return [
                      createVNode(_component_ChantierForm, {
                        "model-value": unref(newChantier),
                        "is-edit-mode": unref(isEditMode),
                        "users-rlt-voie": unref(getUsersRltVoie),
                        "users-rlt-ses": unref(getUsersRltSes),
                        "users-rlt-cat": unref(getUsersRltCat),
                        "users-logistique": unref(getUsersLogistique),
                        "users-kv-voie": unref(getUsersKvVoie),
                        "users-kv-ses": unref(getUsersKvSes),
                        "users-kv-cat": unref(getUsersKvCat),
                        "users-preop-voie": unref(getUsersPreopVoie),
                        "users-preop-ses": unref(getUsersPreopSes),
                        "users-ref-rdu": unref(getUsersRefRdu),
                        users: unref(users),
                        taches: unref(taches),
                        "is-submitting": unref(isSubmitting),
                        onSubmit: handleFormSubmit,
                        onCancel: toggleDrawer
                      }, null, 8, ["model-value", "is-edit-mode", "users-rlt-voie", "users-rlt-ses", "users-rlt-cat", "users-logistique", "users-kv-voie", "users-kv-ses", "users-kv-cat", "users-preop-voie", "users-preop-ses", "users-ref-rdu", "users", "taches", "is-submitting"])
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
            } else {
              _push2(`<!---->`);
            }
          } else {
            return [
              unref(drawerOpen) ? (openBlock(), createBlock(_component_AppDrawerContent, {
                key: 0,
                "drawer-open": unref(drawerOpen),
                "close-drawer": toggleDrawer,
                "height-class": "h-[90vh] md:h-[70vh]"
              }, {
                default: withCtx(() => [
                  createVNode(_component_ChantierForm, {
                    "model-value": unref(newChantier),
                    "is-edit-mode": unref(isEditMode),
                    "users-rlt-voie": unref(getUsersRltVoie),
                    "users-rlt-ses": unref(getUsersRltSes),
                    "users-rlt-cat": unref(getUsersRltCat),
                    "users-logistique": unref(getUsersLogistique),
                    "users-kv-voie": unref(getUsersKvVoie),
                    "users-kv-ses": unref(getUsersKvSes),
                    "users-kv-cat": unref(getUsersKvCat),
                    "users-preop-voie": unref(getUsersPreopVoie),
                    "users-preop-ses": unref(getUsersPreopSes),
                    "users-ref-rdu": unref(getUsersRefRdu),
                    users: unref(users),
                    taches: unref(taches),
                    "is-submitting": unref(isSubmitting),
                    onSubmit: handleFormSubmit,
                    onCancel: toggleDrawer
                  }, null, 8, ["model-value", "is-edit-mode", "users-rlt-voie", "users-rlt-ses", "users-rlt-cat", "users-logistique", "users-kv-voie", "users-kv-ses", "users-kv-cat", "users-preop-voie", "users-preop-ses", "users-ref-rdu", "users", "taches", "is-submitting"])
                ]),
                _: 1
              }, 8, ["drawer-open"])) : createCommentVNode("", true)
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/chantiers/plan-de-charge-general.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const planDeChargeGeneral = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-d5010226"]]);

export { planDeChargeGeneral as default };
//# sourceMappingURL=plan-de-charge-general-Bsm4Xe6c.mjs.map
