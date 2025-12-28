import { _ as _sfc_main$2 } from './titleMain-BKNYl-Iw.mjs';
import { j as _export_sfc, u as useHead, h as useUsers, b as useLoader, g as useState, d as __nuxt_component_1 } from './server.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-BeAZEQV9.mjs';
import { computed, ref, mergeProps, unref, withCtx, createVNode, createTextVNode, isRef, createBlock, createCommentVNode, toDisplayString, openBlock, withDirectives, vModelRadio, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderClass, ssrInterpolate, ssrRenderList, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseEqual } from 'vue/server-renderer';
import { u as useTimeline } from './useTimeline-BdoQfffy.mjs';
import { _ as _sfc_main$1$1, a as _sfc_main$3 } from './slideOverContent-DhkvxfVz.mjs';
import { _ as _sfc_main$4 } from './select-CBkAiapS.mjs';
import { u as useChantiers } from './useChantiers-C2XRmo5v.mjs';
import { u as useContacts } from './useContacts-BdCjpTgN.mjs';
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
import './dropdownMenu-CEBe_L89.mjs';

const _sfc_main$1 = {
  __name: "ChantierTimelineRowSimple",
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
    }
  },
  emits: ["week-hover", "week-leave"],
  setup(__props, { emit: __emit }) {
    const { isWeekendForChantier } = useTimeline();
    const getWeekNumber = (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + 4 - (d.getDay() || 7));
      const yearStart = new Date(d.getFullYear(), 0, 1);
      return Math.ceil(((d - yearStart) / 864e5 + 1) / 7);
    };
    const dateFromWeek = (week, year) => {
      const jan4 = new Date(year, 0, 4);
      const jan4Day = jan4.getDay() || 7;
      const mondayWeek1 = new Date(jan4);
      mondayWeek1.setDate(jan4.getDate() - (jan4Day - 1));
      const d = new Date(mondayWeek1);
      d.setDate(mondayWeek1.getDate() + (week - 1) * 7);
      return d;
    };
    const getChantierPrepaColor = (week, selectedYear, chantier) => {
      if (!week || !selectedYear || !chantier) return null;
      if (!chantier.date_prepa || !Array.isArray(chantier.date_prepa) || chantier.date_prepa.length === 0) return null;
      const { etat } = chantier;
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
      if (!chantier.date_rea || !Array.isArray(chantier.date_rea) || chantier.date_rea.length === 0) return null;
      const { etat } = chantier;
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
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<tr${ssrRenderAttrs(mergeProps({ class: "group transition-colors hover:bg-gray-200 dark:hover:bg-gray-700/30" }, _attrs))}><td class="sticky left-0 z-10 border-r border-gray-200 bg-white px-2 py-1 transition-colors group-hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:group-hover:bg-gray-700/30">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: `/chantiers/${__props.chantier.id}`,
        class: "truncate text-xs font-medium text-gray-700 transition-colors dark:text-white",
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
        _push(`<td class="${ssrRenderClass([{
          "bg-gray-200 dark:bg-gray-700/30": __props.hoveredWeek === week.number,
          "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold": week.number === getWeekNumber(/* @__PURE__ */ new Date()) && __props.selectedYear === (/* @__PURE__ */ new Date()).getFullYear()
        }, "relative px-px"])}"><div class="relative h-2.5">`);
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
      _push(`<!--]--></tr>`);
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/chantier/timelineRowSimple.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = {
  __name: "plan-de-charge-rlt",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({
      title: "H00 - Plan de Charge RLT",
      description: "Vue par RLT des chantiers"
    });
    useChantiers();
    const { users, getUsersRltVoie, getUsersRltSes, getUsersKvVoie, getUsersKvSes } = useUsers();
    const { getAllContactsTravaux, allContactsTravaux, getContactsTravaux, upsertContactsTravaux } = useContacts();
    const { setLoader } = useLoader();
    useTimeline();
    const { isAdmin, isSuperAdmin } = useLevelUser();
    const canEdit = computed(() => isAdmin.value || isSuperAdmin.value);
    const allChantiers = useState("allChantiers");
    const selectedYear = ref((/* @__PURE__ */ new Date()).getFullYear());
    const hoveredWeek = ref(null);
    const activeTab = ref("voie");
    const showSlideOver = ref(false);
    const selectedUser = ref(null);
    const selectedChantierId = ref(null);
    const selectedRoleType = ref("principale");
    const closeSlideOver = () => {
      showSlideOver.value = false;
      selectedUser.value = null;
      selectedChantierId.value = null;
      selectedRoleType.value = "principale";
    };
    const getFirstDateRea = (chantier) => {
      if (!chantier.date_rea || !Array.isArray(chantier.date_rea) || chantier.date_rea.length === 0) {
        return null;
      }
      const firstPeriode = chantier.date_rea[0];
      return firstPeriode?.date_start_travaux ? new Date(firstPeriode.date_start_travaux) : null;
    };
    const availableChantierOptions = computed(() => {
      if (!allChantiers.value || !selectedUser.value) return [];
      const existingChantierIds = selectedUser.value.chantiers?.map((c) => c.id) || [];
      return allChantiers.value.filter((c) => !existingChantierIds.includes(c.id)).map((c) => {
        const dateRea = getFirstDateRea(c);
        return {
          id: c.id,
          label: `${c.compte || ""} - ${c.name || "Sans nom"}`.trim(),
          dateRea
        };
      }).sort((a, b) => {
        if (!a.dateRea && !b.dateRea) return 0;
        if (!a.dateRea) return 1;
        if (!b.dateRea) return -1;
        return b.dateRea - a.dateRea;
      });
    });
    const assignChantierToUser = async () => {
      if (!selectedChantierId.value || !selectedUser.value) return;
      setLoader(true);
      try {
        const currentContacts = await getContactsTravaux(selectedChantierId.value);
        const contactData = currentContacts || {};
        const userId = selectedUser.value.id;
        const isRlt = selectedUser.value.type === "RLT";
        const domain = selectedUser.value.domain;
        if (isRlt) {
          if (domain === "voie") {
            if (selectedRoleType.value === "principale") {
              contactData.rlt_voie_principale = userId;
            } else {
              const currentSecondaires = contactData.rlt_voie_secondaire || [];
              if (!currentSecondaires.includes(userId)) {
                contactData.rlt_voie_secondaire = [...currentSecondaires, userId];
              }
            }
          } else {
            if (selectedRoleType.value === "principale") {
              contactData.rlt_ses_principale = userId;
            } else {
              const currentSecondaires = contactData.rlt_ses_secondaire || [];
              if (!currentSecondaires.includes(userId)) {
                contactData.rlt_ses_secondaire = [...currentSecondaires, userId];
              }
            }
          }
        } else {
          if (domain === "voie") {
            const currentKv = contactData.kv_voie || [];
            if (!currentKv.includes(userId)) {
              contactData.kv_voie = [...currentKv, userId];
            }
          } else {
            const currentKv = contactData.kv_ses || [];
            if (!currentKv.includes(userId)) {
              contactData.kv_ses = [...currentKv, userId];
            }
          }
        }
        await upsertContactsTravaux(selectedChantierId.value, contactData);
        await getAllContactsTravaux();
        closeSlideOver();
      } finally {
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
    const getUserInfo = (userId) => {
      if (!userId || !users.value) return null;
      const user = users.value.find((u) => u.id === userId);
      if (!user) return null;
      return {
        id: user.id,
        nom: user.nom || "",
        prenom: user.prenom || "",
        fullName: user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.email || "-"
      };
    };
    const allWeekends = useState("allWeekends");
    const isPeriodInYear = (startDateStr, endDateStr, year) => {
      if (!startDateStr) return false;
      const startDate = new Date(startDateStr);
      const endDate = endDateStr ? new Date(endDateStr) : startDate;
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();
      return startYear <= year && endYear >= year;
    };
    const isChantierVisibleForYear = (chantier) => {
      const year = selectedYear.value;
      const hasReaInYear = chantier.date_rea?.some(
        (p) => isPeriodInYear(p.date_start_travaux, p.date_end_travaux, year)
      );
      if (hasReaInYear) return true;
      const hasPrepaInYear = chantier.date_prepa?.some(
        (p) => isPeriodInYear(p.date_start_prepa, p.date_end_prepa, year)
      );
      if (hasPrepaInYear) return true;
      const weekendsForChantier = allWeekends.value?.filter((w) => w.chantier_id === chantier.id) || [];
      const hasWeekendInYear = weekendsForChantier.some((w) => w.annee_debut === year || w.annee_fin === year);
      if (hasWeekendInYear) return true;
      return false;
    };
    const getChantiersForUser = (userId, contactTypes) => {
      if (!allContactsTravaux.value || !allChantiers.value) return [];
      const chantierIds = allContactsTravaux.value.filter((contact) => {
        return contactTypes.some((type) => {
          const value = contact[type];
          if (Array.isArray(value)) {
            return value.includes(userId);
          }
          return value === userId;
        });
      }).map((c) => c.chantier_id);
      return allChantiers.value.filter((chantier) => chantierIds.includes(chantier.id) && isChantierVisibleForYear(chantier)).sort((a, b) => {
        const dateA = a.date_rea?.[0]?.date_start_travaux ? new Date(a.date_rea[0].date_start_travaux) : /* @__PURE__ */ new Date();
        const dateB = b.date_rea?.[0]?.date_start_travaux ? new Date(b.date_rea[0].date_start_travaux) : /* @__PURE__ */ new Date();
        return dateA - dateB;
      });
    };
    const rltVoieWithChantiers = computed(() => {
      if (!getUsersRltVoie.value) return [];
      return getUsersRltVoie.value.filter((user) => !user.pre_op && !user.ref_du_rdu).map((user) => {
        const userInfo = getUserInfo(user.id);
        const chantiers = getChantiersForUser(user.id, ["rlt_voie_principale", "rlt_voie_secondaire"]);
        return {
          ...userInfo,
          type: "RLT",
          chantiers
        };
      }).sort((a, b) => (a.nom || "").localeCompare(b.nom || ""));
    });
    const kvVoieWithChantiers = computed(() => {
      if (!getUsersKvVoie.value) return [];
      return getUsersKvVoie.value.filter((user) => !user.pre_op && !user.ref_du_rdu).map((user) => {
        const userInfo = getUserInfo(user.id);
        const chantiers = getChantiersForUser(user.id, ["kv_voie"]);
        return {
          ...userInfo,
          type: "KV",
          chantiers
        };
      }).sort((a, b) => (a.nom || "").localeCompare(b.nom || ""));
    });
    const rltSesWithChantiers = computed(() => {
      if (!getUsersRltSes.value) return [];
      return getUsersRltSes.value.filter((user) => !user.pre_op && !user.ref_du_rdu).map((user) => {
        const userInfo = getUserInfo(user.id);
        const chantiers = getChantiersForUser(user.id, ["rlt_ses_principale", "rlt_ses_secondaire"]);
        return {
          ...userInfo,
          type: "RLT",
          chantiers
        };
      }).sort((a, b) => (a.nom || "").localeCompare(b.nom || ""));
    });
    const kvSesWithChantiers = computed(() => {
      if (!getUsersKvSes.value) return [];
      return getUsersKvSes.value.filter((user) => !user.pre_op && !user.ref_du_rdu).map((user) => {
        const userInfo = getUserInfo(user.id);
        const chantiers = getChantiersForUser(user.id, ["kv_ses"]);
        return {
          ...userInfo,
          type: "KV",
          chantiers
        };
      }).sort((a, b) => (a.nom || "").localeCompare(b.nom || ""));
    });
    const voieData = computed(() => {
      return [...rltVoieWithChantiers.value, ...kvVoieWithChantiers.value];
    });
    const sesData = computed(() => {
      return [...rltSesWithChantiers.value, ...kvSesWithChantiers.value];
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppTitleMain = _sfc_main$2;
      const _component_Icon = __nuxt_component_1;
      const _component_ChantierTimelineRowSimple = _sfc_main$1;
      const _component_AppSlideOver = _sfc_main$1$1;
      const _component_AppSlideOverContent = _sfc_main$3;
      const _component_AppSelect = _sfc_main$4;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex h-full w-full flex-col gap-4 overflow-hidden p-4 lg:px-4 lg:py-0 lg:pt-4" }, _attrs))} data-v-aff0e8cc><div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" data-v-aff0e8cc>`);
      _push(ssrRenderComponent(_component_AppTitleMain, {
        title: "Planning RLT / Contrôleur",
        description: "Vue des chantiers par responsable RLT et contrôleur"
      }, null, _parent));
      _push(`</div><div class="flex flex-col items-center justify-between gap-4 lg:flex-row" data-v-aff0e8cc><div class="flex gap-4 rounded-lg" data-v-aff0e8cc><button type="button" class="${ssrRenderClass([
        unref(activeTab) === "voie" ? "border-purple-800 bg-purple-500 text-white shadow-sm" : "border-gray-300 bg-gray-100 text-gray-600 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-white",
        "flex w-34 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-all"
      ])}" data-v-aff0e8cc>`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:train-track",
        size: "18"
      }, null, _parent));
      _push(` Voie </button><button type="button" class="${ssrRenderClass([
        unref(activeTab) === "ses" ? "bg-primary-500 border-primary-800 text-white shadow-sm" : "border-gray-300 bg-gray-100 text-gray-600 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-white",
        "flex w-34 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-all"
      ])}" data-v-aff0e8cc>`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:zap",
        size: "18"
      }, null, _parent));
      _push(` SES </button></div><div class="flex cursor-default items-center gap-2" data-v-aff0e8cc><div class="rounded-md border border-slate-600 bg-slate-500/60 px-2 py-1 text-xs font-bold text-white" data-v-aff0e8cc> Terminé </div><div class="rounded-md border border-sky-600 bg-sky-500/60 px-2 py-1 text-xs font-bold text-white" data-v-aff0e8cc>RLT</div><div class="rounded-md border border-lime-600 bg-lime-500/60 px-2 py-1 text-xs font-bold text-white" data-v-aff0e8cc> Pré-op </div><div class="rounded-md border border-purple-600 bg-purple-500/60 px-2 py-1 text-xs font-bold text-white" data-v-aff0e8cc> Externe </div><div class="rounded-md border border-orange-600 bg-orange-500/60 px-2 py-1 text-xs font-bold text-white" data-v-aff0e8cc> Week-end </div></div><div class="w-44" data-v-aff0e8cc></div></div><div class="h-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800" data-v-aff0e8cc><table class="w-full min-w-[1400px]" data-v-aff0e8cc><thead class="sticky top-0 z-30" data-v-aff0e8cc><tr class="bg-gray-50 dark:bg-gray-900/50" data-v-aff0e8cc><th class="sticky left-0 z-40 mx-auto min-w-[280px] border-r border-b border-gray-200 bg-gray-50 px-3 py-2 text-left text-[10px] font-semibold tracking-wider text-gray-600 uppercase dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400" data-v-aff0e8cc><div class="flex items-center justify-center" data-v-aff0e8cc><button class="flex cursor-pointer items-center rounded-l-lg px-2 text-gray-600 transition-colors hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700" title="Année précédente" data-v-aff0e8cc>`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:chevron-left",
        size: "18"
      }, null, _parent));
      _push(`</button><span class="px-2 text-base font-semibold text-gray-700 dark:text-white" data-v-aff0e8cc>${ssrInterpolate(unref(selectedYear))}</span><button class="flex cursor-pointer items-center rounded-r-lg px-2 text-gray-600 transition-colors hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700" title="Année suivante" data-v-aff0e8cc>`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:chevron-right",
        size: "18"
      }, null, _parent));
      _push(`</button></div></th><!--[-->`);
      ssrRenderList(unref(weeks), (week) => {
        _push(`<th class="${ssrRenderClass([{
          "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold": week.number === getWeekNumber(/* @__PURE__ */ new Date()) && unref(selectedYear) === (/* @__PURE__ */ new Date()).getFullYear(),
          "bg-gray-200 dark:bg-gray-700/30": unref(hoveredWeek) === week.number
        }, "min-w-[24px] border-b border-gray-200 px-0 text-center text-sm font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400"])}" data-v-aff0e8cc>${ssrInterpolate(week.label)}</th>`);
      });
      _push(`<!--]--></tr></thead>`);
      if (unref(activeTab) === "voie") {
        _push(`<tbody class="divide-y divide-gray-100 dark:divide-gray-700/50" data-v-aff0e8cc>`);
        if (unref(rltVoieWithChantiers).length > 0) {
          _push(`<tr class="border-t-2 border-t-purple-400 bg-purple-100 dark:border-t-purple-600 dark:bg-purple-900/30" data-v-aff0e8cc><td class="sticky left-0 z-20 border-r border-gray-200 bg-purple-100 px-3 py-2 dark:border-gray-700 dark:bg-purple-900/30" data-v-aff0e8cc><span class="text-sm font-bold tracking-wide text-purple-700 uppercase dark:text-purple-300" data-v-aff0e8cc>RLT</span></td><td${ssrRenderAttr("colspan", 53)} data-v-aff0e8cc></td></tr>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--[-->`);
        ssrRenderList(unref(rltVoieWithChantiers), (user) => {
          _push(`<!--[--><tr class="bg-purple-50/50 dark:bg-purple-900/10" data-v-aff0e8cc><td class="sticky left-0 z-20 border-r border-gray-200 bg-purple-50/50 px-3 py-2 dark:border-gray-700 dark:bg-purple-900/10" data-v-aff0e8cc><div class="flex items-center gap-3" data-v-aff0e8cc><span class="text-sm font-semibold text-gray-800 dark:text-white" data-v-aff0e8cc>${ssrInterpolate(user.nom)} ${ssrInterpolate(user.prenom)}</span>`);
          if (unref(canEdit)) {
            _push(`<button type="button" class="ml-auto cursor-pointer text-gray-800 duration-300 hover:text-purple-600" title="Attribuer un chantier" data-v-aff0e8cc>`);
            _push(ssrRenderComponent(_component_Icon, {
              name: "lucide:plus",
              size: "14"
            }, null, _parent));
            _push(`</button>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></td><td${ssrRenderAttr("colspan", 53)} class="text-end" data-v-aff0e8cc><span class="mr-2 text-xs text-gray-500 italic dark:text-gray-400" data-v-aff0e8cc>${ssrInterpolate(user.chantiers.length)} chantier${ssrInterpolate(user.chantiers.length > 1 ? "s" : "")}</span></td></tr><!--[-->`);
          ssrRenderList(user.chantiers, (chantier) => {
            _push(ssrRenderComponent(_component_ChantierTimelineRowSimple, {
              key: `${user.id}-${chantier.id}`,
              chantier,
              weeks: unref(weeks),
              "selected-year": unref(selectedYear),
              "hovered-week": unref(hoveredWeek),
              onWeekHover: ($event) => hoveredWeek.value = $event,
              onWeekLeave: ($event) => hoveredWeek.value = null
            }, null, _parent));
          });
          _push(`<!--]-->`);
          if (user.chantiers.length === 0) {
            _push(`<tr class="bg-gray-50/50 dark:bg-gray-800/30" data-v-aff0e8cc><td class="sticky left-0 z-20 border-r border-gray-200 bg-gray-50/50 px-3 pl-6 dark:border-gray-700 dark:bg-gray-800/30" data-v-aff0e8cc><span class="text-xs text-gray-400 italic dark:text-gray-500" data-v-aff0e8cc>Aucun chantier attribué</span></td><td${ssrRenderAttr("colspan", 53)} data-v-aff0e8cc></td></tr>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<!--]-->`);
        });
        _push(`<!--]-->`);
        if (unref(kvVoieWithChantiers).length > 0) {
          _push(`<tr class="border-t-2 border-t-indigo-400 bg-indigo-100 dark:border-t-indigo-600 dark:bg-indigo-900/30" data-v-aff0e8cc><td class="sticky left-0 z-20 border-r border-gray-200 bg-indigo-100 px-3 py-2 dark:border-gray-700 dark:bg-indigo-900/30" data-v-aff0e8cc><span class="text-sm font-bold tracking-wide text-indigo-700 uppercase dark:text-indigo-300" data-v-aff0e8cc>KV</span></td><td${ssrRenderAttr("colspan", 53)} data-v-aff0e8cc></td></tr>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--[-->`);
        ssrRenderList(unref(kvVoieWithChantiers), (user) => {
          _push(`<!--[--><tr class="bg-indigo-50/50 dark:bg-indigo-900/10" data-v-aff0e8cc><td class="sticky left-0 z-20 border-r border-gray-200 bg-indigo-50/50 px-3 py-2 dark:border-gray-700 dark:bg-indigo-900/10" data-v-aff0e8cc><div class="flex items-center gap-3" data-v-aff0e8cc><span class="text-sm font-semibold text-gray-800 dark:text-white" data-v-aff0e8cc>${ssrInterpolate(user.fullName)}</span>`);
          if (unref(canEdit)) {
            _push(`<button type="button" class="ml-auto cursor-pointer text-gray-800 duration-300 hover:text-indigo-600" title="Attribuer un chantier" data-v-aff0e8cc>`);
            _push(ssrRenderComponent(_component_Icon, {
              name: "lucide:plus",
              size: "14"
            }, null, _parent));
            _push(`</button>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></td><td${ssrRenderAttr("colspan", 53)} class="text-end" data-v-aff0e8cc><span class="mr-2 text-xs text-gray-500 italic dark:text-gray-400" data-v-aff0e8cc>${ssrInterpolate(user.chantiers.length)} chantier${ssrInterpolate(user.chantiers.length > 1 ? "s" : "")}</span></td></tr><!--[-->`);
          ssrRenderList(user.chantiers, (chantier) => {
            _push(ssrRenderComponent(_component_ChantierTimelineRowSimple, {
              key: `${user.id}-${chantier.id}`,
              chantier,
              weeks: unref(weeks),
              "selected-year": unref(selectedYear),
              "hovered-week": unref(hoveredWeek),
              onWeekHover: ($event) => hoveredWeek.value = $event,
              onWeekLeave: ($event) => hoveredWeek.value = null
            }, null, _parent));
          });
          _push(`<!--]-->`);
          if (user.chantiers.length === 0) {
            _push(`<tr class="bg-gray-50/50 dark:bg-gray-800/30" data-v-aff0e8cc><td class="sticky left-0 z-20 border-r border-gray-200 bg-gray-50/50 px-3 pl-6 dark:border-gray-700 dark:bg-gray-800/30" data-v-aff0e8cc><span class="text-xs text-gray-400 italic dark:text-gray-500" data-v-aff0e8cc>Aucun chantier attribué</span></td><td${ssrRenderAttr("colspan", 53)} data-v-aff0e8cc></td></tr>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<!--]-->`);
        });
        _push(`<!--]-->`);
        if (unref(voieData).length === 0) {
          _push(`<tr data-v-aff0e8cc><td colspan="54" class="px-6 py-12 text-center" data-v-aff0e8cc><div class="flex flex-col items-center gap-3" data-v-aff0e8cc>`);
          _push(ssrRenderComponent(_component_Icon, {
            name: "lucide:users-x",
            size: "32",
            class: "text-gray-300 dark:text-gray-600"
          }, null, _parent));
          _push(`<p class="text-gray-500 dark:text-gray-400" data-v-aff0e8cc>Aucun RLT/KV Voie disponible</p></div></td></tr>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</tbody>`);
      } else if (unref(activeTab) === "ses") {
        _push(`<tbody class="divide-y divide-gray-100 dark:divide-gray-700/50" data-v-aff0e8cc>`);
        if (unref(rltSesWithChantiers).length > 0) {
          _push(`<tr class="border-t-primary-400 dark:border-t-primary-600 bg-primary-100 dark:bg-primary-900/30 border-t-2" data-v-aff0e8cc><td class="bg-primary-100 dark:bg-primary-900/30 sticky left-0 z-20 border-r border-gray-200 px-3 py-2 dark:border-gray-700" data-v-aff0e8cc><span class="text-primary-700 dark:text-primary-300 text-sm font-bold tracking-wide uppercase" data-v-aff0e8cc>RLT</span></td><td${ssrRenderAttr("colspan", 53)} data-v-aff0e8cc></td></tr>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--[-->`);
        ssrRenderList(unref(rltSesWithChantiers), (user) => {
          _push(`<!--[--><tr class="bg-primary-50/50 dark:bg-primary-900/10" data-v-aff0e8cc><td class="bg-primary-50/50 dark:bg-primary-900/10 sticky left-0 z-20 border-r border-gray-200 px-3 py-2 dark:border-gray-700" data-v-aff0e8cc><div class="flex items-center gap-3" data-v-aff0e8cc><span class="text-sm font-semibold text-gray-800 dark:text-white" data-v-aff0e8cc>${ssrInterpolate(user.fullName)}</span>`);
          if (unref(canEdit)) {
            _push(`<button type="button" class="hover:text-primary-600 ml-auto cursor-pointer text-gray-800 duration-300" title="Attribuer un chantier" data-v-aff0e8cc>`);
            _push(ssrRenderComponent(_component_Icon, {
              name: "lucide:plus",
              size: "14"
            }, null, _parent));
            _push(`</button>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></td><td${ssrRenderAttr("colspan", 53)} class="text-end" data-v-aff0e8cc><span class="mr-2 text-xs text-gray-500 italic dark:text-gray-400" data-v-aff0e8cc>${ssrInterpolate(user.chantiers.length)} chantier${ssrInterpolate(user.chantiers.length > 1 ? "s" : "")}</span></td></tr><!--[-->`);
          ssrRenderList(user.chantiers, (chantier) => {
            _push(ssrRenderComponent(_component_ChantierTimelineRowSimple, {
              key: `${user.id}-${chantier.id}`,
              chantier,
              weeks: unref(weeks),
              "selected-year": unref(selectedYear),
              "hovered-week": unref(hoveredWeek),
              onWeekHover: ($event) => hoveredWeek.value = $event,
              onWeekLeave: ($event) => hoveredWeek.value = null
            }, null, _parent));
          });
          _push(`<!--]-->`);
          if (user.chantiers.length === 0) {
            _push(`<tr class="bg-gray-50/50 dark:bg-gray-800/30" data-v-aff0e8cc><td class="sticky left-0 z-20 border-r border-gray-200 bg-gray-50/50 px-3 pl-6 dark:border-gray-700 dark:bg-gray-800/30" data-v-aff0e8cc><span class="text-xs text-gray-400 italic dark:text-gray-500" data-v-aff0e8cc>Aucun chantier attribué</span></td><td${ssrRenderAttr("colspan", 53)} data-v-aff0e8cc></td></tr>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<!--]-->`);
        });
        _push(`<!--]-->`);
        if (unref(kvSesWithChantiers).length > 0) {
          _push(`<tr class="border-t-2 border-t-teal-400 bg-teal-100 dark:border-t-teal-600 dark:bg-teal-900/30" data-v-aff0e8cc><td class="sticky left-0 z-20 border-r border-gray-200 bg-teal-100 px-3 py-2 dark:border-gray-700 dark:bg-teal-900/30" data-v-aff0e8cc><span class="text-sm font-bold tracking-wide text-teal-700 uppercase dark:text-teal-300" data-v-aff0e8cc>KV</span></td><td${ssrRenderAttr("colspan", 53)} data-v-aff0e8cc></td></tr>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--[-->`);
        ssrRenderList(unref(kvSesWithChantiers), (user) => {
          _push(`<!--[--><tr class="bg-teal-50/50 dark:bg-teal-900/10" data-v-aff0e8cc><td class="sticky left-0 z-20 border-r border-gray-200 bg-teal-50/50 px-3 py-2 dark:border-gray-700 dark:bg-teal-900/10" data-v-aff0e8cc><div class="flex items-center gap-3" data-v-aff0e8cc><span class="text-sm font-semibold text-gray-800 dark:text-white" data-v-aff0e8cc>${ssrInterpolate(user.fullName)}</span>`);
          if (unref(canEdit)) {
            _push(`<button type="button" class="ml-auto cursor-pointer text-gray-800 duration-300 hover:text-teal-600" title="Attribuer un chantier" data-v-aff0e8cc>`);
            _push(ssrRenderComponent(_component_Icon, {
              name: "lucide:plus",
              size: "14"
            }, null, _parent));
            _push(`</button>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></td><td${ssrRenderAttr("colspan", 53)} class="text-end" data-v-aff0e8cc><span class="mr-2 text-xs text-gray-500 italic dark:text-gray-400" data-v-aff0e8cc>${ssrInterpolate(user.chantiers.length)} chantier${ssrInterpolate(user.chantiers.length > 1 ? "s" : "")}</span></td></tr><!--[-->`);
          ssrRenderList(user.chantiers, (chantier) => {
            _push(ssrRenderComponent(_component_ChantierTimelineRowSimple, {
              key: `${user.id}-${chantier.id}`,
              chantier,
              weeks: unref(weeks),
              "selected-year": unref(selectedYear),
              "hovered-week": unref(hoveredWeek),
              onWeekHover: ($event) => hoveredWeek.value = $event,
              onWeekLeave: ($event) => hoveredWeek.value = null
            }, null, _parent));
          });
          _push(`<!--]-->`);
          if (user.chantiers.length === 0) {
            _push(`<tr class="bg-gray-50/50 dark:bg-gray-800/30" data-v-aff0e8cc><td class="sticky left-0 z-20 border-r border-gray-200 bg-gray-50/50 px-3 pl-6 dark:border-gray-700 dark:bg-gray-800/30" data-v-aff0e8cc><span class="text-xs text-gray-400 italic dark:text-gray-500" data-v-aff0e8cc>Aucun chantier attribué</span></td><td${ssrRenderAttr("colspan", 53)} data-v-aff0e8cc></td></tr>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<!--]-->`);
        });
        _push(`<!--]-->`);
        if (unref(sesData).length === 0) {
          _push(`<tr data-v-aff0e8cc><td colspan="54" class="px-6 py-12 text-center" data-v-aff0e8cc><div class="flex flex-col items-center gap-3" data-v-aff0e8cc>`);
          _push(ssrRenderComponent(_component_Icon, {
            name: "lucide:users-x",
            size: "32",
            class: "text-gray-300 dark:text-gray-600"
          }, null, _parent));
          _push(`<p class="text-gray-500 dark:text-gray-400" data-v-aff0e8cc>Aucun RLT/KV SES disponible</p></div></td></tr>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</tbody>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</table></div>`);
      _push(ssrRenderComponent(_component_AppSlideOver, {
        "side-modal": unref(showSlideOver),
        "close-side-modal": closeSlideOver
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (unref(showSlideOver)) {
              _push2(ssrRenderComponent(_component_AppSlideOverContent, { "close-side-modal": closeSlideOver }, {
                header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<h2 class="text-xl font-bold text-gray-800 dark:text-white" data-v-aff0e8cc${_scopeId2}>Attribuer un chantier</h2><p class="text-sm text-gray-500 dark:text-gray-400" data-v-aff0e8cc${_scopeId2}> Attribuer un chantier à <span class="font-semibold" data-v-aff0e8cc${_scopeId2}>${ssrInterpolate(unref(selectedUser)?.fullName)}</span></p>`);
                  } else {
                    return [
                      createVNode("h2", { class: "text-xl font-bold text-gray-800 dark:text-white" }, "Attribuer un chantier"),
                      createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, [
                        createTextVNode(" Attribuer un chantier à "),
                        createVNode("span", { class: "font-semibold" }, toDisplayString(unref(selectedUser)?.fullName), 1)
                      ])
                    ];
                  }
                }),
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="flex flex-col gap-6" data-v-aff0e8cc${_scopeId2}><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800" data-v-aff0e8cc${_scopeId2}><div class="flex items-center gap-3" data-v-aff0e8cc${_scopeId2}><div class="${ssrRenderClass([
                      unref(selectedUser)?.type === "RLT" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
                      "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold"
                    ])}" data-v-aff0e8cc${_scopeId2}>${ssrInterpolate(unref(selectedUser)?.prenom?.[0] || "")}${ssrInterpolate(unref(selectedUser)?.nom?.[0] || "")}</div><div data-v-aff0e8cc${_scopeId2}><p class="font-semibold text-gray-800 dark:text-white" data-v-aff0e8cc${_scopeId2}>${ssrInterpolate(unref(selectedUser)?.fullName)}</p><div class="flex gap-1" data-v-aff0e8cc${_scopeId2}><span class="text-sm font-medium" data-v-aff0e8cc${_scopeId2}>${ssrInterpolate(unref(selectedUser)?.type)}</span><span class="text-sm font-medium" data-v-aff0e8cc${_scopeId2}>${ssrInterpolate(unref(selectedUser)?.domain === "voie" ? "Voie" : "SES")}</span></div></div></div></div>`);
                    _push3(ssrRenderComponent(_component_AppSelect, {
                      modelValue: unref(selectedChantierId),
                      "onUpdate:modelValue": ($event) => isRef(selectedChantierId) ? selectedChantierId.value = $event : null,
                      options: unref(availableChantierOptions),
                      title: "Chantier à attribuer",
                      placeholder: "Sélectionner un chantier...",
                      "search-placeholder": "Rechercher un chantier...",
                      searchable: "",
                      nullable: ""
                    }, null, _parent3, _scopeId2));
                    if (unref(selectedUser)?.type === "RLT") {
                      _push3(`<div class="flex flex-col gap-3" data-v-aff0e8cc${_scopeId2}><label class="text-sm font-medium text-gray-700 dark:text-gray-300" data-v-aff0e8cc${_scopeId2}>Type de responsabilité</label><div class="flex gap-4" data-v-aff0e8cc${_scopeId2}><label class="${ssrRenderClass([
                        unref(selectedRoleType) === "principale" ? "border-purple-500 bg-purple-50 dark:border-purple-400 dark:bg-purple-900/30" : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600",
                        "flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-3 transition-all"
                      ])}" data-v-aff0e8cc${_scopeId2}><input${ssrIncludeBooleanAttr(ssrLooseEqual(unref(selectedRoleType), "principale")) ? " checked" : ""} type="radio" name="roleType" value="principale" class="text-purple-500 focus:ring-purple-500" data-v-aff0e8cc${_scopeId2}><div data-v-aff0e8cc${_scopeId2}><span class="font-medium text-gray-800 dark:text-white" data-v-aff0e8cc${_scopeId2}>Principale</span><p class="text-xs text-gray-500 dark:text-gray-400" data-v-aff0e8cc${_scopeId2}>Responsable principal du chantier</p></div></label><label class="${ssrRenderClass([
                        unref(selectedRoleType) === "secondaire" ? "border-purple-500 bg-purple-50 dark:border-purple-400 dark:bg-purple-900/30" : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600",
                        "flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-3 transition-all"
                      ])}" data-v-aff0e8cc${_scopeId2}><input${ssrIncludeBooleanAttr(ssrLooseEqual(unref(selectedRoleType), "secondaire")) ? " checked" : ""} type="radio" name="roleType" value="secondaire" class="text-purple-500 focus:ring-purple-500" data-v-aff0e8cc${_scopeId2}><div data-v-aff0e8cc${_scopeId2}><span class="font-medium text-gray-800 dark:text-white" data-v-aff0e8cc${_scopeId2}>Secondaire</span><p class="text-xs text-gray-500 dark:text-gray-400" data-v-aff0e8cc${_scopeId2}>Responsable secondaire / backup</p></div></label></div></div>`);
                    } else {
                      _push3(`<!---->`);
                    }
                    if (unref(selectedUser)?.type === "KV") {
                      _push3(`<div class="rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-900/30" data-v-aff0e8cc${_scopeId2}><div class="flex items-start gap-3" data-v-aff0e8cc${_scopeId2}>`);
                      _push3(ssrRenderComponent(_component_Icon, {
                        name: "lucide:info",
                        size: "20",
                        class: "mt-0.5 text-indigo-500"
                      }, null, _parent3, _scopeId2));
                      _push3(`<p class="text-sm text-indigo-700 dark:text-indigo-300" data-v-aff0e8cc${_scopeId2}> Le chantier sera attribué en tant que contrôleur KV ${ssrInterpolate(unref(selectedUser)?.domain === "voie" ? "Voie" : "SES")}. </p></div></div>`);
                    } else {
                      _push3(`<!---->`);
                    }
                    _push3(`</div>`);
                  } else {
                    return [
                      createVNode("div", { class: "flex flex-col gap-6" }, [
                        createVNode("div", { class: "rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800" }, [
                          createVNode("div", { class: "flex items-center gap-3" }, [
                            createVNode("div", {
                              class: [
                                "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold",
                                unref(selectedUser)?.type === "RLT" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                              ]
                            }, toDisplayString(unref(selectedUser)?.prenom?.[0] || "") + toDisplayString(unref(selectedUser)?.nom?.[0] || ""), 3),
                            createVNode("div", null, [
                              createVNode("p", { class: "font-semibold text-gray-800 dark:text-white" }, toDisplayString(unref(selectedUser)?.fullName), 1),
                              createVNode("div", { class: "flex gap-1" }, [
                                createVNode("span", { class: "text-sm font-medium" }, toDisplayString(unref(selectedUser)?.type), 1),
                                createVNode("span", { class: "text-sm font-medium" }, toDisplayString(unref(selectedUser)?.domain === "voie" ? "Voie" : "SES"), 1)
                              ])
                            ])
                          ])
                        ]),
                        createVNode(_component_AppSelect, {
                          modelValue: unref(selectedChantierId),
                          "onUpdate:modelValue": ($event) => isRef(selectedChantierId) ? selectedChantierId.value = $event : null,
                          options: unref(availableChantierOptions),
                          title: "Chantier à attribuer",
                          placeholder: "Sélectionner un chantier...",
                          "search-placeholder": "Rechercher un chantier...",
                          searchable: "",
                          nullable: ""
                        }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                        unref(selectedUser)?.type === "RLT" ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "flex flex-col gap-3"
                        }, [
                          createVNode("label", { class: "text-sm font-medium text-gray-700 dark:text-gray-300" }, "Type de responsabilité"),
                          createVNode("div", { class: "flex gap-4" }, [
                            createVNode("label", {
                              class: [
                                "flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-3 transition-all",
                                unref(selectedRoleType) === "principale" ? "border-purple-500 bg-purple-50 dark:border-purple-400 dark:bg-purple-900/30" : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                              ]
                            }, [
                              withDirectives(createVNode("input", {
                                "onUpdate:modelValue": ($event) => isRef(selectedRoleType) ? selectedRoleType.value = $event : null,
                                type: "radio",
                                name: "roleType",
                                value: "principale",
                                class: "text-purple-500 focus:ring-purple-500"
                              }, null, 8, ["onUpdate:modelValue"]), [
                                [vModelRadio, unref(selectedRoleType)]
                              ]),
                              createVNode("div", null, [
                                createVNode("span", { class: "font-medium text-gray-800 dark:text-white" }, "Principale"),
                                createVNode("p", { class: "text-xs text-gray-500 dark:text-gray-400" }, "Responsable principal du chantier")
                              ])
                            ], 2),
                            createVNode("label", {
                              class: [
                                "flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-3 transition-all",
                                unref(selectedRoleType) === "secondaire" ? "border-purple-500 bg-purple-50 dark:border-purple-400 dark:bg-purple-900/30" : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                              ]
                            }, [
                              withDirectives(createVNode("input", {
                                "onUpdate:modelValue": ($event) => isRef(selectedRoleType) ? selectedRoleType.value = $event : null,
                                type: "radio",
                                name: "roleType",
                                value: "secondaire",
                                class: "text-purple-500 focus:ring-purple-500"
                              }, null, 8, ["onUpdate:modelValue"]), [
                                [vModelRadio, unref(selectedRoleType)]
                              ]),
                              createVNode("div", null, [
                                createVNode("span", { class: "font-medium text-gray-800 dark:text-white" }, "Secondaire"),
                                createVNode("p", { class: "text-xs text-gray-500 dark:text-gray-400" }, "Responsable secondaire / backup")
                              ])
                            ], 2)
                          ])
                        ])) : createCommentVNode("", true),
                        unref(selectedUser)?.type === "KV" ? (openBlock(), createBlock("div", {
                          key: 1,
                          class: "rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-900/30"
                        }, [
                          createVNode("div", { class: "flex items-start gap-3" }, [
                            createVNode(_component_Icon, {
                              name: "lucide:info",
                              size: "20",
                              class: "mt-0.5 text-indigo-500"
                            }),
                            createVNode("p", { class: "text-sm text-indigo-700 dark:text-indigo-300" }, " Le chantier sera attribué en tant que contrôleur KV " + toDisplayString(unref(selectedUser)?.domain === "voie" ? "Voie" : "SES") + ". ", 1)
                          ])
                        ])) : createCommentVNode("", true)
                      ])
                    ];
                  }
                }),
                footer: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="flex justify-end gap-3" data-v-aff0e8cc${_scopeId2}><button type="button" class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800" data-v-aff0e8cc${_scopeId2}> Annuler </button><button type="button"${ssrIncludeBooleanAttr(!unref(selectedChantierId)) ? " disabled" : ""} class="rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50" data-v-aff0e8cc${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:check",
                      size: "16",
                      class: "mr-1 inline"
                    }, null, _parent3, _scopeId2));
                    _push3(` Attribuer </button></div>`);
                  } else {
                    return [
                      createVNode("div", { class: "flex justify-end gap-3" }, [
                        createVNode("button", {
                          type: "button",
                          onClick: closeSlideOver,
                          class: "rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                        }, " Annuler "),
                        createVNode("button", {
                          type: "button",
                          onClick: assignChantierToUser,
                          disabled: !unref(selectedChantierId),
                          class: "rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
                        }, [
                          createVNode(_component_Icon, {
                            name: "lucide:check",
                            size: "16",
                            class: "mr-1 inline"
                          }),
                          createTextVNode(" Attribuer ")
                        ], 8, ["disabled"])
                      ])
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
              unref(showSlideOver) ? (openBlock(), createBlock(_component_AppSlideOverContent, {
                key: 0,
                "close-side-modal": closeSlideOver
              }, {
                header: withCtx(() => [
                  createVNode("h2", { class: "text-xl font-bold text-gray-800 dark:text-white" }, "Attribuer un chantier"),
                  createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, [
                    createTextVNode(" Attribuer un chantier à "),
                    createVNode("span", { class: "font-semibold" }, toDisplayString(unref(selectedUser)?.fullName), 1)
                  ])
                ]),
                default: withCtx(() => [
                  createVNode("div", { class: "flex flex-col gap-6" }, [
                    createVNode("div", { class: "rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800" }, [
                      createVNode("div", { class: "flex items-center gap-3" }, [
                        createVNode("div", {
                          class: [
                            "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold",
                            unref(selectedUser)?.type === "RLT" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                          ]
                        }, toDisplayString(unref(selectedUser)?.prenom?.[0] || "") + toDisplayString(unref(selectedUser)?.nom?.[0] || ""), 3),
                        createVNode("div", null, [
                          createVNode("p", { class: "font-semibold text-gray-800 dark:text-white" }, toDisplayString(unref(selectedUser)?.fullName), 1),
                          createVNode("div", { class: "flex gap-1" }, [
                            createVNode("span", { class: "text-sm font-medium" }, toDisplayString(unref(selectedUser)?.type), 1),
                            createVNode("span", { class: "text-sm font-medium" }, toDisplayString(unref(selectedUser)?.domain === "voie" ? "Voie" : "SES"), 1)
                          ])
                        ])
                      ])
                    ]),
                    createVNode(_component_AppSelect, {
                      modelValue: unref(selectedChantierId),
                      "onUpdate:modelValue": ($event) => isRef(selectedChantierId) ? selectedChantierId.value = $event : null,
                      options: unref(availableChantierOptions),
                      title: "Chantier à attribuer",
                      placeholder: "Sélectionner un chantier...",
                      "search-placeholder": "Rechercher un chantier...",
                      searchable: "",
                      nullable: ""
                    }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                    unref(selectedUser)?.type === "RLT" ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "flex flex-col gap-3"
                    }, [
                      createVNode("label", { class: "text-sm font-medium text-gray-700 dark:text-gray-300" }, "Type de responsabilité"),
                      createVNode("div", { class: "flex gap-4" }, [
                        createVNode("label", {
                          class: [
                            "flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-3 transition-all",
                            unref(selectedRoleType) === "principale" ? "border-purple-500 bg-purple-50 dark:border-purple-400 dark:bg-purple-900/30" : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                          ]
                        }, [
                          withDirectives(createVNode("input", {
                            "onUpdate:modelValue": ($event) => isRef(selectedRoleType) ? selectedRoleType.value = $event : null,
                            type: "radio",
                            name: "roleType",
                            value: "principale",
                            class: "text-purple-500 focus:ring-purple-500"
                          }, null, 8, ["onUpdate:modelValue"]), [
                            [vModelRadio, unref(selectedRoleType)]
                          ]),
                          createVNode("div", null, [
                            createVNode("span", { class: "font-medium text-gray-800 dark:text-white" }, "Principale"),
                            createVNode("p", { class: "text-xs text-gray-500 dark:text-gray-400" }, "Responsable principal du chantier")
                          ])
                        ], 2),
                        createVNode("label", {
                          class: [
                            "flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-3 transition-all",
                            unref(selectedRoleType) === "secondaire" ? "border-purple-500 bg-purple-50 dark:border-purple-400 dark:bg-purple-900/30" : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                          ]
                        }, [
                          withDirectives(createVNode("input", {
                            "onUpdate:modelValue": ($event) => isRef(selectedRoleType) ? selectedRoleType.value = $event : null,
                            type: "radio",
                            name: "roleType",
                            value: "secondaire",
                            class: "text-purple-500 focus:ring-purple-500"
                          }, null, 8, ["onUpdate:modelValue"]), [
                            [vModelRadio, unref(selectedRoleType)]
                          ]),
                          createVNode("div", null, [
                            createVNode("span", { class: "font-medium text-gray-800 dark:text-white" }, "Secondaire"),
                            createVNode("p", { class: "text-xs text-gray-500 dark:text-gray-400" }, "Responsable secondaire / backup")
                          ])
                        ], 2)
                      ])
                    ])) : createCommentVNode("", true),
                    unref(selectedUser)?.type === "KV" ? (openBlock(), createBlock("div", {
                      key: 1,
                      class: "rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-900/30"
                    }, [
                      createVNode("div", { class: "flex items-start gap-3" }, [
                        createVNode(_component_Icon, {
                          name: "lucide:info",
                          size: "20",
                          class: "mt-0.5 text-indigo-500"
                        }),
                        createVNode("p", { class: "text-sm text-indigo-700 dark:text-indigo-300" }, " Le chantier sera attribué en tant que contrôleur KV " + toDisplayString(unref(selectedUser)?.domain === "voie" ? "Voie" : "SES") + ". ", 1)
                      ])
                    ])) : createCommentVNode("", true)
                  ])
                ]),
                footer: withCtx(() => [
                  createVNode("div", { class: "flex justify-end gap-3" }, [
                    createVNode("button", {
                      type: "button",
                      onClick: closeSlideOver,
                      class: "rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                    }, " Annuler "),
                    createVNode("button", {
                      type: "button",
                      onClick: assignChantierToUser,
                      disabled: !unref(selectedChantierId),
                      class: "rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
                    }, [
                      createVNode(_component_Icon, {
                        name: "lucide:check",
                        size: "16",
                        class: "mr-1 inline"
                      }),
                      createTextVNode(" Attribuer ")
                    ], 8, ["disabled"])
                  ])
                ]),
                _: 1
              })) : createCommentVNode("", true)
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/chantiers/plan-de-charge-rlt.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const planDeChargeRlt = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-aff0e8cc"]]);

export { planDeChargeRlt as default };
//# sourceMappingURL=plan-de-charge-rlt-B3UBd5Jc.mjs.map
