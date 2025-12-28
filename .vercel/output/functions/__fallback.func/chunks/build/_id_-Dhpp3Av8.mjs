import { _ as __nuxt_component_0, a as _sfc_main$s } from './switch-Du8wHBlL.mjs';
import { _ as _sfc_main$n } from './leftNavBar-DmsDXGQs.mjs';
import { i as useRoute, b as useLoader, u as useHead, d as __nuxt_component_1, _ as _sfc_main$2$1, h as useUsers, f as useSupabaseClient, a as useToast, g as useState, j as _export_sfc } from './server.mjs';
import { _ as _sfc_main$o } from './titleMain-BKNYl-Iw.mjs';
import { _ as _sfc_main$1$1, a as _sfc_main$p } from './slideOverContent-DhkvxfVz.mjs';
import { _ as __nuxt_component_3$1, a as __nuxt_component_6 } from './selectMultiple-BvatzygK.mjs';
import { _ as _sfc_main$q } from './select-CBkAiapS.mjs';
import { _ as _sfc_main$1$2, a as _sfc_main$r } from './modal-DW8NcVL0.mjs';
import { computed, ref, watch, withCtx, unref, createBlock, openBlock, createCommentVNode, createVNode, isRef, toDisplayString, mergeProps, createTextVNode, Fragment, renderList, withDirectives, vModelText, withModifiers, mergeModels, watchEffect, useModel, withKeys, defineComponent, useSSRContext } from 'vue';
import { ssrRenderComponent, ssrInterpolate, ssrRenderClass, ssrRenderAttrs, ssrRenderList, ssrRenderAttr, ssrIncludeBooleanAttr, ssrRenderStyle, ssrRenderTeleport, ssrRenderSlot } from 'vue/server-renderer';
import { u as useChantiers } from './useChantiers-C2XRmo5v.mjs';
import { u as useTimeline } from './useTimeline-BdoQfffy.mjs';
import { u as useContacts } from './useContacts-BdCjpTgN.mjs';
import { _ as __nuxt_component_6$1 } from './datePicker-CE1CBEZO.mjs';
import { u as useEtudes, a as useCommentaires } from './useCommentaires-BS9ADy-v.mjs';
import { _ as __nuxt_component_2 } from './dropdownMenu-CEBe_L89.mjs';
import { _ as __nuxt_component_1$1 } from './inputSearch-Xv57A_RG.mjs';
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

const useLigne = () => {
  const client = useSupabaseClient();
  const { addToast } = useToast();
  const allLignes = useState("allLignes", () => []);
  const getAllLignes = async () => {
    try {
      const { data: response, error } = await client.from("lignes").select("*").order("id", { ascending: true });
      if (error) throw error;
      else {
        allLignes.value = response.map((item) => ({
          id: item.id,
          label: item.name
        }));
      }
    } catch (err) {
      addToast({
        title: "Problème lors du chargement des lignes",
        message: err.message,
        type: "Error"
      });
    }
  };
  return { getAllLignes, allLignes };
};
const _sfc_main$m = {
  __name: "ChantierGeneralites",
  __ssrInlineRender: true,
  props: {
    chantier: {
      type: Object,
      required: true
    }
  },
  emits: ["update"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const { updateChantier } = useChantiers();
    const { getWeekendsByChantier, replaceWeekendsForChantier } = useTimeline();
    const { allLignes } = useLigne();
    const { setLoader } = useLoader();
    const showEditSlideOver = ref(false);
    const weekends = ref([]);
    const sortedWeekends = computed(() => {
      return [...weekends.value].sort((a, b) => {
        if (a.annee_debut !== b.annee_debut) {
          return a.annee_debut - b.annee_debut;
        }
        return a.semaine_debut - b.semaine_debut;
      });
    });
    const isPreparationAdd = ref(false);
    const isRealisationAdd = ref(false);
    const isWeekendAdd = ref(false);
    const newWeekend = ref({
      semaineDebut: null,
      anneeDebut: (/* @__PURE__ */ new Date()).getFullYear()
    });
    const semaineOptions = computed(() => {
      return Array.from({ length: 53 }, (_, i) => ({
        id: i + 1,
        label: `S${i + 1}`
      }));
    });
    const anneeOptions = computed(() => {
      const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
      return Array.from({ length: 5 }, (_, i) => ({
        id: currentYear - 2 + i,
        label: String(currentYear - 2 + i)
      }));
    });
    const editForm = ref({
      preparation: [],
      realisation: [],
      weekends: [],
      // Champs généraux
      ligne_id: null,
      type_essais: null,
      decret: null,
      matiere: "",
      matiere_da: "",
      compte_moe: "",
      compte_slg: "",
      compte_matieres: "",
      autre: ""
    });
    const loadWeekends = async () => {
      if (props.chantier?.id) {
        weekends.value = await getWeekendsByChantier(props.chantier.id);
      }
    };
    const getNextWeek = (semaine, annee) => {
      if (semaine >= 52) {
        const dec31 = new Date(annee, 11, 31);
        const jan4 = new Date(annee, 0, 4);
        const jan4Day = jan4.getDay() || 7;
        const mondayWeek1 = new Date(jan4);
        mondayWeek1.setDate(jan4.getDate() - (jan4Day - 1));
        const weeksInYear = Math.ceil((dec31 - mondayWeek1) / (7 * 24 * 60 * 60 * 1e3));
        if (semaine >= weeksInYear) {
          return { semaine: 1, annee: annee + 1 };
        }
      }
      return { semaine: semaine + 1, annee };
    };
    const handleAddWeekend = async () => {
      if (!newWeekend.value.semaineDebut) return;
      const { semaine: semaineFin, annee: anneeFin } = getNextWeek(
        newWeekend.value.semaineDebut,
        newWeekend.value.anneeDebut
      );
      editForm.value.weekends.push({
        debutSemaine: newWeekend.value.semaineDebut,
        debutAnnee: newWeekend.value.anneeDebut,
        finSemaine: semaineFin,
        finAnnee: anneeFin
      });
      isWeekendAdd.value = false;
      newWeekend.value = {
        semaineDebut: null,
        anneeDebut: (/* @__PURE__ */ new Date()).getFullYear()
      };
    };
    const handleDeleteWeekend = (index) => {
      editForm.value.weekends.splice(index, 1);
    };
    const handleAddPreparationFromPicker = (range) => {
      editForm.value.preparation.push({
        date_start: range.date_start,
        date_end: range.date_end
      });
      isPreparationAdd.value = false;
    };
    const handleDeletePreparation = (index) => {
      editForm.value.preparation.splice(index, 1);
    };
    const handleAddRealisationFromPicker = (range) => {
      editForm.value.realisation.push({
        date_start: range.date_start,
        date_end: range.date_end
      });
      isRealisationAdd.value = false;
    };
    const handleDeleteRealisation = (index) => {
      editForm.value.realisation.splice(index, 1);
    };
    watch(() => props.chantier?.id, loadWeekends);
    const formatDateShort = (dateStr) => {
      if (!dateStr) return "-";
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = String(date.getFullYear()).slice(-2);
      return `${day}/${month}/${year}`;
    };
    const formatTimestampToDisplay = (timestamp) => {
      if (!timestamp) return "-";
      const date = new Date(timestamp);
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      });
    };
    const getWeekNumber = (dateStr) => {
      if (!dateStr) return "-";
      const date = new Date(dateStr);
      const target = new Date(date.valueOf());
      const dayNr = (date.getDay() + 6) % 7;
      target.setDate(target.getDate() - dayNr + 3);
      const firstThursday = target.valueOf();
      target.setMonth(0, 1);
      if (target.getDay() !== 4) {
        target.setMonth(0, 1 + (4 - target.getDay() + 7) % 7);
      }
      return "S" + (1 + Math.ceil((firstThursday - target) / 6048e5));
    };
    const weekRange = computed(() => {
      const allWeeks = [];
      if (props.chantier?.date_prepa) {
        props.chantier.date_prepa.forEach((p) => {
          if (p.date_start_prepa) {
            const startWeek = getWeekNumberValue(p.date_start_prepa);
            const startYear = new Date(p.date_start_prepa).getFullYear();
            const endWeek2 = p.date_end_prepa ? getWeekNumberValue(p.date_end_prepa) : startWeek;
            const endYear2 = p.date_end_prepa ? new Date(p.date_end_prepa).getFullYear() : startYear;
            allWeeks.push({ week: startWeek, year: startYear });
            allWeeks.push({ week: endWeek2, year: endYear2 });
          }
        });
      }
      if (props.chantier?.date_rea) {
        props.chantier.date_rea.forEach((r) => {
          if (r.date_start_travaux) {
            const startWeek = getWeekNumberValue(r.date_start_travaux);
            const startYear = new Date(r.date_start_travaux).getFullYear();
            const endWeek2 = r.date_end_travaux ? getWeekNumberValue(r.date_end_travaux) : startWeek;
            const endYear2 = r.date_end_travaux ? new Date(r.date_end_travaux).getFullYear() : startYear;
            allWeeks.push({ week: startWeek, year: startYear });
            allWeeks.push({ week: endWeek2, year: endYear2 });
          }
        });
      }
      weekends.value.forEach((w) => {
        allWeeks.push({ week: w.semaine_debut, year: w.annee_debut });
        allWeeks.push({ week: w.semaine_fin, year: w.annee_fin });
      });
      if (allWeeks.length === 0) return { weeks: [], minWeek: 1, maxWeek: 53, year: (/* @__PURE__ */ new Date()).getFullYear() };
      const sorted = allWeeks.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.week - b.week;
      });
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      if (min.year === max.year) {
        const minWeek = Math.max(1, min.week - 2);
        const maxWeek = Math.min(53, max.week + 2);
        const weeks2 = [];
        for (let i = minWeek; i <= maxWeek; i++) {
          weeks2.push({ number: i, year: min.year });
        }
        return { weeks: weeks2, minWeek, maxWeek, year: min.year };
      }
      const weeks = [];
      let currentYear = min.year;
      let currentWeek = Math.max(1, min.week - 2);
      const endWeek = Math.min(53, max.week + 2);
      const endYear = max.year;
      while (currentYear < endYear || currentYear === endYear && currentWeek <= endWeek) {
        weeks.push({ number: currentWeek, year: currentYear });
        currentWeek++;
        if (currentWeek > 53) {
          currentWeek = 1;
          currentYear++;
        }
        if (weeks.length > 104) break;
      }
      return { weeks, minWeek: min.week, maxWeek: max.week, year: min.year };
    });
    const getWeekNumberValue = (dateStr) => {
      if (!dateStr) return 1;
      const date = new Date(dateStr);
      const target = new Date(date.valueOf());
      const dayNr = (date.getDay() + 6) % 7;
      target.setDate(target.getDate() - dayNr + 3);
      const firstThursday = target.valueOf();
      target.setMonth(0, 1);
      if (target.getDay() !== 4) {
        target.setMonth(0, 1 + (4 - target.getDay() + 7) % 7);
      }
      return 1 + Math.ceil((firstThursday - target) / 6048e5);
    };
    const isPreparationWeek = (weekNum, year) => {
      if (!props.chantier?.date_prepa) return false;
      return props.chantier.date_prepa.some((p) => {
        if (!p.date_start_prepa) return false;
        const startDate = new Date(p.date_start_prepa);
        const endDate = p.date_end_prepa ? new Date(p.date_end_prepa) : startDate;
        const startWeek = getWeekNumberValue(p.date_start_prepa);
        const startYear = startDate.getFullYear();
        const endWeek = getWeekNumberValue(p.date_end_prepa || p.date_start_prepa);
        const endYear = endDate.getFullYear();
        if (startYear === endYear && year === startYear) {
          return weekNum >= startWeek && weekNum <= endWeek;
        }
        if (year === startYear && weekNum >= startWeek) return true;
        if (year === endYear && weekNum <= endWeek) return true;
        if (year > startYear && year < endYear) return true;
        return false;
      });
    };
    const isRealisationWeek = (weekNum, year) => {
      if (!props.chantier?.date_rea) return false;
      return props.chantier.date_rea.some((r) => {
        if (!r.date_start_travaux) return false;
        const startDate = new Date(r.date_start_travaux);
        const endDate = r.date_end_travaux ? new Date(r.date_end_travaux) : startDate;
        const startWeek = getWeekNumberValue(r.date_start_travaux);
        const startYear = startDate.getFullYear();
        const endWeek = getWeekNumberValue(r.date_end_travaux || r.date_start_travaux);
        const endYear = endDate.getFullYear();
        if (startYear === endYear && year === startYear) {
          return weekNum >= startWeek && weekNum <= endWeek;
        }
        if (year === startYear && weekNum >= startWeek) return true;
        if (year === endYear && weekNum <= endWeek) return true;
        if (year > startYear && year < endYear) return true;
        return false;
      });
    };
    const isWeekendWeek = (weekNum, year) => {
      return weekends.value.some((w) => {
        return weekNum === w.semaine_debut && year === w.annee_debut;
      });
    };
    const typeEssaisOptions = [
      { id: "simple", label: "Simple" },
      { id: "complexe", label: "Complexe" }
    ];
    const decretOptions = [
      { id: "92", label: "Décret 92" },
      { id: "94", label: "Décret 94" }
    ];
    const toTimestamp = (date) => {
      if (!date) return null;
      if (typeof date === "number") return date;
      const d = new Date(date);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0).getTime();
    };
    const timestampToISODate = (timestamp) => {
      if (!timestamp) return null;
      const date = new Date(timestamp);
      return date.toISOString().split("T")[0];
    };
    const openEditSlideOver = () => {
      const preparations = (props.chantier.date_prepa || []).map((p) => ({
        date_start: p.date_start_prepa ? toTimestamp(p.date_start_prepa) : null,
        date_end: p.date_end_prepa ? toTimestamp(p.date_end_prepa) : null
      }));
      const realisations = (props.chantier.date_rea || []).map((r) => ({
        date_start: r.date_start_travaux ? toTimestamp(r.date_start_travaux) : null,
        date_end: r.date_end_travaux ? toTimestamp(r.date_end_travaux) : null
      }));
      const weekendsList = weekends.value.map((w) => ({
        debutSemaine: w.semaine_debut,
        debutAnnee: w.annee_debut,
        finSemaine: w.semaine_fin,
        finAnnee: w.annee_fin
      }));
      editForm.value = {
        preparation: preparations,
        realisation: realisations,
        weekends: weekendsList,
        // Champs généraux
        ligne_id: props.chantier.ligne_id || null,
        type_essais: props.chantier.type_essais || null,
        decret: props.chantier.decret || null,
        matiere: props.chantier.matiere || "",
        matiere_da: props.chantier.matiere_da || "",
        compte_moe: props.chantier.compte_moe || "",
        compte_slg: props.chantier.compte_slg || "",
        compte_matieres: props.chantier.compte_matieres || "",
        autre: props.chantier.autre || ""
      };
      showEditSlideOver.value = true;
    };
    const closeEditSlideOver = () => {
      showEditSlideOver.value = false;
    };
    const saveChanges = async () => {
      setLoader(true);
      try {
        const datePrepa = editForm.value.preparation.map((p) => ({
          date_start_prepa: timestampToISODate(p.date_start),
          date_end_prepa: timestampToISODate(p.date_end)
        }));
        const dateRea = editForm.value.realisation.map((r) => ({
          date_start_travaux: timestampToISODate(r.date_start),
          date_end_travaux: timestampToISODate(r.date_end)
        }));
        const updated = await updateChantier(props.chantier.id, {
          date_prepa: datePrepa,
          date_rea: dateRea,
          ligne_id: editForm.value.ligne_id || null,
          type_essais: editForm.value.type_essais || null,
          decret: editForm.value.decret || null,
          matiere: editForm.value.matiere || null,
          matiere_da: editForm.value.matiere_da || null,
          compte_moe: editForm.value.compte_moe || null,
          compte_slg: editForm.value.compte_slg || null,
          compte_matieres: editForm.value.compte_matieres || null,
          autre: editForm.value.autre || null
        });
        await replaceWeekendsForChantier(props.chantier.id, editForm.value.weekends);
        if (updated) {
          Object.assign(props.chantier, updated);
          await loadWeekends();
          closeEditSlideOver();
        }
      } finally {
        setLoader(false);
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppTitleMain = _sfc_main$o;
      const _component_AppButtonValidated = _sfc_main$2$1;
      const _component_Icon = __nuxt_component_1;
      const _component_AppSlideOver = _sfc_main$1$1;
      const _component_AppSlideOverContent = _sfc_main$p;
      const _component_AppDatePickerRange = __nuxt_component_3$1;
      const _component_AppSelect = _sfc_main$q;
      const _component_AppInput = _sfc_main$1$2;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-4" }, _attrs))}><div class="flex flex-row items-center justify-between gap-4">`);
      _push(ssrRenderComponent(_component_AppTitleMain, {
        title: "Généralités du chantier",
        description: "Informations générales du chantier"
      }, null, _parent));
      _push(ssrRenderComponent(_component_AppButtonValidated, {
        type: "button",
        theme: "primary",
        onClick: openEditSlideOver
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<span class="flex items-center gap-2"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:pencil",
              size: "16"
            }, null, _parent2, _scopeId));
            _push2(` Modifier </span>`);
          } else {
            return [
              createVNode("span", { class: "flex items-center gap-2" }, [
                createVNode(_component_Icon, {
                  name: "lucide:pencil",
                  size: "16"
                }),
                createTextVNode(" Modifier ")
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="grid grid-cols-1 gap-4 md:grid-cols-3"><div class="flex items-center gap-4 rounded-lg bg-white p-5 shadow-md transition hover:shadow-lg"><div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-600/20 text-gray-700">`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:train-track",
        size: "20"
      }, null, _parent));
      _push(`</div><div><p class="text-sm text-gray-500">Ligne ferroviaire</p><p class="text-xl font-semibold text-gray-900">${ssrInterpolate(__props.chantier.ligne || "-")}</p></div></div><div class="flex items-center gap-4 rounded-lg bg-white p-5 shadow-md transition hover:shadow-lg"><div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-600/20 text-gray-700">`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:scale",
        size: "20"
      }, null, _parent));
      _push(`</div><div><p class="text-sm text-gray-500">Réglementation</p><p class="text-xl font-semibold text-gray-900">${ssrInterpolate(__props.chantier.decret ? `Décret ${__props.chantier.decret}` : "-")}</p></div></div><div class="flex items-center gap-4 rounded-lg bg-white p-5 shadow-md transition hover:shadow-lg"><div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-600/20 text-gray-700">`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:flask-conical",
        size: "20"
      }, null, _parent));
      _push(`</div><div><p class="text-sm text-gray-500">Type d&#39;essais</p><p class="text-xl font-semibold text-gray-900">${ssrInterpolate(__props.chantier.type_essais ? __props.chantier.type_essais === "simple" ? "Simple" : "Complexe" : "-")}</p></div></div></div><div class="rounded-lg border border-gray-100 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"><div class="p-6"><div class="mb-6 flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-600/20 text-gray-700">`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:calendar-range",
        size: "20"
      }, null, _parent));
      _push(`</div><div><h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">Période des travaux</h2><p class="text-xs text-gray-500 dark:text-gray-400">Planification temporelle</p></div></div><div class="mb-6 flex flex-wrap items-center justify-center gap-4"><div class="flex items-center gap-2"><div class="h-4 w-6 rounded border border-red-900/40 bg-red-900/20"></div><span class="text-xs font-medium text-gray-600 dark:text-gray-400">Préparation</span></div><div class="flex items-center gap-2"><div class="h-4 w-6 rounded border border-red-900 bg-red-800/60"></div><span class="text-xs font-medium text-gray-600 dark:text-gray-400">Réalisation</span></div><div class="flex items-center gap-2"><div class="h-4 w-1.5 rounded bg-orange-500"></div><span class="text-xs font-medium text-gray-600 dark:text-gray-400">Week-end</span></div></div>`);
      if (unref(weekRange).weeks.length > 0) {
        _push(`<div class="overflow-x-auto pb-2"><div class="flex min-w-full flex-wrap items-center justify-center gap-0.5"><!--[-->`);
        ssrRenderList(unref(weekRange).weeks, (week) => {
          _push(`<div class="relative flex flex-col items-center py-4"><span class="mb-1 text-[10px] font-medium text-gray-500 dark:text-gray-400">${ssrInterpolate(week.number)}</span><div class="relative h-4 w-6 rounded-sm">`);
          if (isPreparationWeek(week.number, week.year)) {
            _push(`<div class="absolute inset-0 rounded-sm border border-red-900/40 bg-red-900/20"></div>`);
          } else {
            _push(`<!---->`);
          }
          if (isRealisationWeek(week.number, week.year)) {
            _push(`<div class="absolute inset-0 rounded-sm border border-red-900 bg-red-800/60"></div>`);
          } else {
            _push(`<!---->`);
          }
          if (!isPreparationWeek(week.number, week.year) && !isRealisationWeek(week.number, week.year)) {
            _push(`<div class="absolute inset-0 rounded-sm border border-gray-200 bg-gray-100 dark:border-gray-600 dark:bg-gray-700"></div>`);
          } else {
            _push(`<!---->`);
          }
          if (isWeekendWeek(week.number, week.year)) {
            _push(`<div class="absolute -top-2 -right-0.75 -bottom-2 z-10 w-1 rounded bg-orange-500 shadow-md"></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
          if (week.number === 1 || unref(weekRange).weeks.indexOf(week) === 0) {
            _push(`<span class="pt-1 text-[9px] font-bold text-gray-500 dark:text-gray-500">${ssrInterpolate(week.year)}</span>`);
          } else {
            _push(`<span class="pt-1 text-[9px] font-bold text-gray-500 dark:text-gray-500"> </span>`);
          }
          _push(`</div>`);
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<div class="flex flex-col items-center justify-center py-8 text-center">`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:calendar-x",
          size: "32",
          class: "mb-2 text-gray-300 dark:text-gray-600"
        }, null, _parent));
        _push(`<p class="text-sm text-gray-400 italic dark:text-gray-500">Aucune période définie</p></div>`);
      }
      if (__props.chantier.date_prepa && __props.chantier.date_prepa.length > 0 || __props.chantier.date_rea && __props.chantier.date_rea.length > 0 || unref(weekends).length > 0) {
        _push(`<div class="mt-2 flex h-full flex-col items-start justify-center gap-4 space-y-4 border-t border-gray-100 pt-4 lg:flex-row dark:border-gray-700">`);
        if (__props.chantier.date_prepa && __props.chantier.date_prepa.length > 0) {
          _push(`<div class="flex-1 px-4"><p class="text-sm font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-400">Préparation</p><div class="mt-2 flex flex-wrap gap-2"><!--[-->`);
          ssrRenderList(__props.chantier.date_prepa, (periode, index) => {
            _push(`<div class="inline-flex items-center gap-1 rounded-lg border border-red-900/40 bg-red-900/20 px-2 py-1 text-xs font-medium text-red-900">`);
            _push(ssrRenderComponent(_component_Icon, {
              name: "lucide:calendar",
              size: "12"
            }, null, _parent));
            _push(` ${ssrInterpolate(getWeekNumber(periode.date_start_prepa))} → ${ssrInterpolate(getWeekNumber(periode.date_end_prepa || periode.date_start_prepa))} <span class="text-red-900"> (${ssrInterpolate(formatDateShort(periode.date_start_prepa))} - ${ssrInterpolate(formatDateShort(periode.date_end_prepa || periode.date_start_prepa))}) </span></div>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (__props.chantier.date_rea && __props.chantier.date_rea.length > 0) {
          _push(`<div class="flex-1 px-4"><p class="text-sm font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-400">Réalisation</p><div class="mt-2 flex flex-wrap gap-2"><!--[-->`);
          ssrRenderList(__props.chantier.date_rea, (periode, index) => {
            _push(`<div class="inline-flex items-center gap-1 rounded-lg border border-red-900 bg-red-800/60 px-2 py-1 text-xs font-medium text-white">`);
            _push(ssrRenderComponent(_component_Icon, {
              name: "lucide:calendar-check",
              size: "12"
            }, null, _parent));
            _push(` ${ssrInterpolate(getWeekNumber(periode.date_start_travaux))} → ${ssrInterpolate(getWeekNumber(periode.date_end_travaux || periode.date_start_travaux))} <span class="text-white"> (${ssrInterpolate(formatDateShort(periode.date_start_travaux))} - ${ssrInterpolate(formatDateShort(periode.date_end_travaux || periode.date_start_travaux))}) </span></div>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(weekends).length > 0) {
          _push(`<div class="flex-1 px-4"><p class="text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-400"> Week-ends (${ssrInterpolate(unref(weekends).length)}) </p><div class="mt-2 flex flex-wrap gap-2 border-l-2 border-gray-200 pl-2"><!--[-->`);
          ssrRenderList(unref(sortedWeekends), (weekend) => {
            _push(`<div class="inline-flex items-center gap-1 rounded-lg border border-orange-200 bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 dark:border-orange-800 dark:bg-orange-900/30 dark:text-orange-400">`);
            _push(ssrRenderComponent(_component_Icon, {
              name: "lucide:calendar-days",
              size: "12"
            }, null, _parent));
            _push(` S${ssrInterpolate(weekend.semaine_debut)}/${ssrInterpolate(weekend.annee_debut)} → S${ssrInterpolate(weekend.semaine_fin)}/${ssrInterpolate(weekend.annee_fin)}</div>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="grid grid-cols-1 gap-4 md:grid-cols-2"><div class="rounded-lg border border-gray-100 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"><div class="p-6"><div class="flex items-center justify-between"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-600/20 text-gray-700">`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:package",
        size: "20"
      }, null, _parent));
      _push(`</div><div><h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">Matières DM</h2><p class="text-xs text-gray-500 dark:text-gray-400">Accès au suivi des commandes</p></div></div>`);
      if (__props.chantier.matiere) {
        _push(`<div><a${ssrRenderAttr("href", __props.chantier.matiere)} target="_blank" rel="noopener noreferrer" class="border-secondary-900 bg-secondary-800/60 inline-flex items-center gap-2 rounded-lg border px-4 py-1 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:external-link",
          size: "16"
        }, null, _parent));
        _push(` Ouvrir le lien </a></div>`);
      } else {
        _push(`<span class="text-sm text-gray-400 italic dark:text-gray-500">Aucun lien défini</span>`);
      }
      _push(`</div></div></div><div class="rounded-lg border border-gray-100 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"><div class="p-6"><div class="flex items-center justify-between"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-600/20 text-gray-700">`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:package",
        size: "20"
      }, null, _parent));
      _push(`</div><div><h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">Matières DA</h2><p class="text-xs text-gray-500 dark:text-gray-400">Accès au suivi des commandes</p></div></div>`);
      if (__props.chantier.matiere_da) {
        _push(`<div><a${ssrRenderAttr("href", __props.chantier.matiere_da)} target="_blank" rel="noopener noreferrer" class="border-secondary-900 bg-secondary-800/60 inline-flex items-center gap-2 rounded-lg border px-4 py-1 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:external-link",
          size: "16"
        }, null, _parent));
        _push(` Ouvrir le lien </a></div>`);
      } else {
        _push(`<span class="text-sm text-gray-400 italic dark:text-gray-500">Aucun lien défini</span>`);
      }
      _push(`</div></div></div></div><div class="rounded-lg border border-gray-100 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"><div class="p-6"><div class="mb-5 flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-600/20 text-gray-700">`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:wallet",
        size: "20"
      }, null, _parent));
      _push(`</div><div><h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">Comptes</h2><p class="text-xs text-gray-500 dark:text-gray-400">Références comptables du chantier</p></div></div><div class="grid grid-cols-1 gap-4 md:grid-cols-3"><div class="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/50"><label class="text-secondary-900 text-xs font-semibold tracking-wider uppercase dark:text-cyan-400"> Compte MOE </label><p class="mt-2 font-mono text-lg font-bold text-gray-900 dark:text-white">${ssrInterpolate(__props.chantier.compte_moe || "-")}</p></div><div class="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/50"><label class="text-secondary-900 text-xs font-semibold tracking-wider uppercase dark:text-cyan-400"> Compte SLG </label><p class="mt-2 font-mono text-lg font-bold text-gray-900 dark:text-white">${ssrInterpolate(__props.chantier.compte_slg || "-")}</p></div><div class="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/50"><label class="text-secondary-900 text-xs font-semibold tracking-wider uppercase dark:text-cyan-400"> Compte Matière </label><p class="mt-2 font-mono text-lg font-bold text-gray-900 dark:text-white">${ssrInterpolate(__props.chantier.compte_matieres || "-")}</p></div></div></div></div><div class="rounded-lg border border-gray-100 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"><div class="p-6"><div class="mb-5 flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-600/20 text-gray-700">`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:file-text",
        size: "20"
      }, null, _parent));
      _push(`</div><div><h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">Autre</h2><p class="text-xs text-gray-500 dark:text-gray-400">Informations complémentaires</p></div></div>`);
      if (__props.chantier.autre) {
        _push(`<div class="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/50"><p class="text-sm leading-relaxed whitespace-pre-wrap text-gray-700 dark:text-gray-300">${ssrInterpolate(__props.chantier.autre)}</p></div>`);
      } else {
        _push(`<div class="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center dark:border-gray-600 dark:bg-gray-700/50">`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:file-x",
          size: "32",
          class: "mx-auto mb-2 text-gray-300 dark:text-gray-600"
        }, null, _parent));
        _push(`<p class="text-sm text-gray-400 italic dark:text-gray-500">Aucune information complémentaire</p></div>`);
      }
      _push(`</div></div>`);
      _push(ssrRenderComponent(_component_AppSlideOver, {
        sideModal: unref(showEditSlideOver),
        closeSideModal: closeEditSlideOver
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (unref(showEditSlideOver)) {
              _push2(ssrRenderComponent(_component_AppSlideOverContent, { closeSideModal: closeEditSlideOver }, {
                header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<h2 class="font-[Pacifico] text-3xl text-gray-800 dark:text-white"${_scopeId2}>Périodes du chantier</h2><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId2}> Gérez les périodes de préparation, réalisation et week-ends </p>`);
                  } else {
                    return [
                      createVNode("h2", { class: "font-[Pacifico] text-3xl text-gray-800 dark:text-white" }, "Périodes du chantier"),
                      createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, " Gérez les périodes de préparation, réalisation et week-ends ")
                    ];
                  }
                }),
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="space-y-6"${_scopeId2}><div class="space-y-4"${_scopeId2}><div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700"${_scopeId2}><div class="border-secondary-900/40 bg-secondary-900/20 h-4 w-6 rounded border"${_scopeId2}></div><h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId2}> Périodes de préparation </h3><div class="hover:text-secondary-700 ml-auto flex h-4 w-6 cursor-pointer items-center justify-center rounded text-gray-900 transition-all duration-300"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:plus",
                      size: "16",
                      class: ""
                    }, null, _parent3, _scopeId2));
                    _push3(`</div></div>`);
                    if (unref(editForm).preparation.length > 0) {
                      _push3(`<div class="space-y-2"${_scopeId2}><!--[-->`);
                      ssrRenderList(unref(editForm).preparation, (periode, index) => {
                        _push3(`<div class="border-secondary-900/40 bg-secondary-900/20 text-secondary-900 flex items-center justify-between rounded-lg border p-3"${_scopeId2}><div class="flex items-center gap-2"${_scopeId2}>`);
                        _push3(ssrRenderComponent(_component_Icon, {
                          name: "lucide:calendar",
                          size: "16",
                          class: "text-secondary-900"
                        }, null, _parent3, _scopeId2));
                        _push3(`<span class="text-sm font-medium text-gray-700 dark:text-gray-300"${_scopeId2}>${ssrInterpolate(formatTimestampToDisplay(periode.date_start))} → ${ssrInterpolate(formatTimestampToDisplay(periode.date_end))}</span></div><button type="button" class="cursor-pointer rounded p-1 text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"${_scopeId2}>`);
                        _push3(ssrRenderComponent(_component_Icon, {
                          name: "lucide:x",
                          size: "16"
                        }, null, _parent3, _scopeId2));
                        _push3(`</button></div>`);
                      });
                      _push3(`<!--]--></div>`);
                    } else {
                      _push3(`<p class="text-sm text-gray-400 italic"${_scopeId2}>Aucune période de préparation</p>`);
                    }
                    _push3(ssrRenderComponent(_component_AppDatePickerRange, {
                      "is-open": unref(isPreparationAdd),
                      title: "Période de préparation",
                      onSelect: handleAddPreparationFromPicker,
                      onClose: ($event) => isPreparationAdd.value = false
                    }, null, _parent3, _scopeId2));
                    _push3(`</div><div class="space-y-4"${_scopeId2}><div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700"${_scopeId2}><div class="h-4 w-6 rounded border border-red-900 bg-red-800/60"${_scopeId2}></div><h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId2}> Périodes de réalisation </h3><div class="hover:text-secondary-700 ml-auto flex h-4 w-6 cursor-pointer items-center justify-center rounded text-gray-900 transition-all duration-300"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:plus",
                      size: "16",
                      class: ""
                    }, null, _parent3, _scopeId2));
                    _push3(`</div></div>`);
                    if (unref(editForm).realisation.length > 0) {
                      _push3(`<div class="space-y-2"${_scopeId2}><!--[-->`);
                      ssrRenderList(unref(editForm).realisation, (periode, index) => {
                        _push3(`<div class="flex items-center justify-between rounded-lg border border-red-900 bg-red-800/60 p-3 text-white"${_scopeId2}><div class="flex items-center gap-2"${_scopeId2}>`);
                        _push3(ssrRenderComponent(_component_Icon, {
                          name: "lucide:calendar-check",
                          size: "16",
                          class: "text-white"
                        }, null, _parent3, _scopeId2));
                        _push3(`<span class="text-sm font-medium text-white"${_scopeId2}>${ssrInterpolate(formatTimestampToDisplay(periode.date_start))} → ${ssrInterpolate(formatTimestampToDisplay(periode.date_end))}</span></div><button type="button" class="cursor-pointer rounded p-1 text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"${_scopeId2}>`);
                        _push3(ssrRenderComponent(_component_Icon, {
                          name: "lucide:x",
                          size: "16"
                        }, null, _parent3, _scopeId2));
                        _push3(`</button></div>`);
                      });
                      _push3(`<!--]--></div>`);
                    } else {
                      _push3(`<p class="text-sm text-white italic"${_scopeId2}>Aucune période de réalisation</p>`);
                    }
                    _push3(ssrRenderComponent(_component_AppDatePickerRange, {
                      "is-open": unref(isRealisationAdd),
                      title: "Période de réalisation",
                      onSelect: handleAddRealisationFromPicker,
                      onClose: ($event) => isRealisationAdd.value = false
                    }, null, _parent3, _scopeId2));
                    _push3(`</div><div class="space-y-4"${_scopeId2}><div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700"${_scopeId2}><div class="h-4 w-1.5 rounded bg-orange-500"${_scopeId2}></div><h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId2}> Week-ends </h3><div class="hover:text-secondary-700 ml-auto flex h-4 w-6 cursor-pointer items-center justify-center rounded text-gray-900 transition-all duration-300"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:plus",
                      size: "16",
                      class: ""
                    }, null, _parent3, _scopeId2));
                    _push3(`</div></div>`);
                    if (unref(editForm).weekends.length > 0) {
                      _push3(`<div class="space-y-2"${_scopeId2}><!--[-->`);
                      ssrRenderList(unref(editForm).weekends, (weekend, index) => {
                        _push3(`<div class="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-900/20"${_scopeId2}><div class="flex items-center gap-2"${_scopeId2}>`);
                        _push3(ssrRenderComponent(_component_Icon, {
                          name: "lucide:calendar-days",
                          size: "16",
                          class: "text-orange-500"
                        }, null, _parent3, _scopeId2));
                        _push3(`<span class="text-sm font-medium text-gray-700 dark:text-gray-300"${_scopeId2}> S${ssrInterpolate(weekend.debutSemaine)}/${ssrInterpolate(weekend.debutAnnee)} → S${ssrInterpolate(weekend.finSemaine)}/${ssrInterpolate(weekend.finAnnee)}</span></div><button type="button" class="cursor-pointer rounded p-1 text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"${_scopeId2}>`);
                        _push3(ssrRenderComponent(_component_Icon, {
                          name: "lucide:x",
                          size: "16"
                        }, null, _parent3, _scopeId2));
                        _push3(`</button></div>`);
                      });
                      _push3(`<!--]--></div>`);
                    } else {
                      _push3(`<p class="text-sm text-gray-400 italic"${_scopeId2}>Aucun week-end programmé</p>`);
                    }
                    if (!unref(isWeekendAdd)) {
                      _push3(`<div${_scopeId2}></div>`);
                    } else {
                      _push3(`<div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"${_scopeId2}><p class="mb-3 text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-400"${_scopeId2}> Semaine de début (la fin sera automatiquement définie) </p><div class="grid grid-cols-2 gap-3"${_scopeId2}><div${_scopeId2}><label class="mb-1 block text-xs text-gray-500"${_scopeId2}>Semaine</label>`);
                      _push3(ssrRenderComponent(_component_AppSelect, {
                        modelValue: unref(newWeekend).semaineDebut,
                        "onUpdate:modelValue": ($event) => unref(newWeekend).semaineDebut = $event,
                        options: unref(semaineOptions),
                        placeholder: "S...",
                        nullable: ""
                      }, null, _parent3, _scopeId2));
                      _push3(`</div><div${_scopeId2}><label class="mb-1 block text-xs text-gray-500"${_scopeId2}>Année</label>`);
                      _push3(ssrRenderComponent(_component_AppSelect, {
                        modelValue: unref(newWeekend).anneeDebut,
                        "onUpdate:modelValue": ($event) => unref(newWeekend).anneeDebut = $event,
                        options: unref(anneeOptions),
                        placeholder: "Année"
                      }, null, _parent3, _scopeId2));
                      _push3(`</div></div><div class="mt-3 flex gap-2"${_scopeId2}>`);
                      _push3(ssrRenderComponent(_component_AppButtonValidated, {
                        type: "button",
                        theme: "primary",
                        validated: !!unref(newWeekend).semaineDebut,
                        onClick: handleAddWeekend
                      }, {
                        default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                          if (_push4) {
                            _push4(`<span class="flex items-center gap-2"${_scopeId3}>`);
                            _push4(ssrRenderComponent(_component_Icon, {
                              name: "lucide:plus",
                              size: "16"
                            }, null, _parent4, _scopeId3));
                            _push4(` Ajouter </span>`);
                          } else {
                            return [
                              createVNode("span", { class: "flex items-center gap-2" }, [
                                createVNode(_component_Icon, {
                                  name: "lucide:plus",
                                  size: "16"
                                }),
                                createTextVNode(" Ajouter ")
                              ])
                            ];
                          }
                        }),
                        _: 1
                      }, _parent3, _scopeId2));
                      _push3(`<button type="button" class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"${_scopeId2}> Annuler </button></div></div>`);
                    }
                    _push3(`</div><div class="space-y-4"${_scopeId2}><div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:info",
                      size: "16",
                      class: "text-gray-500"
                    }, null, _parent3, _scopeId2));
                    _push3(`<h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId2}> Informations générales </h3></div>`);
                    _push3(ssrRenderComponent(_component_AppSelect, {
                      modelValue: unref(editForm).ligne_id,
                      "onUpdate:modelValue": ($event) => unref(editForm).ligne_id = $event,
                      name: "type_essais",
                      title: "Ligne",
                      options: unref(allLignes),
                      placeholder: "Sélectionner la ligne...",
                      nullable: ""
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppSelect, {
                      modelValue: unref(editForm).type_essais,
                      "onUpdate:modelValue": ($event) => unref(editForm).type_essais = $event,
                      name: "type_essais",
                      title: "Type d'essais",
                      options: typeEssaisOptions,
                      placeholder: "Sélectionner le type d'essais...",
                      nullable: ""
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppSelect, {
                      modelValue: unref(editForm).decret,
                      "onUpdate:modelValue": ($event) => unref(editForm).decret = $event,
                      name: "decret",
                      title: "Décret",
                      options: decretOptions,
                      placeholder: "Sélectionner...",
                      nullable: ""
                    }, null, _parent3, _scopeId2));
                    _push3(`</div><div class="space-y-4"${_scopeId2}><div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:package",
                      size: "16",
                      class: "text-gray-500"
                    }, null, _parent3, _scopeId2));
                    _push3(`<h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId2}> Matières DM </h3></div>`);
                    _push3(ssrRenderComponent(_component_AppInput, {
                      modelValue: unref(editForm).matiere,
                      "onUpdate:modelValue": ($event) => unref(editForm).matiere = $event,
                      name: "matiere",
                      title: "Lien web",
                      type: "url",
                      placeholder: "https://..."
                    }, null, _parent3, _scopeId2));
                    _push3(`</div><div class="space-y-4"${_scopeId2}><div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:package",
                      size: "16",
                      class: "text-gray-500"
                    }, null, _parent3, _scopeId2));
                    _push3(`<h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId2}> Matières DA </h3></div>`);
                    _push3(ssrRenderComponent(_component_AppInput, {
                      modelValue: unref(editForm).matiere_da,
                      "onUpdate:modelValue": ($event) => unref(editForm).matiere_da = $event,
                      name: "matiere_da",
                      title: "Lien web",
                      type: "url",
                      placeholder: "https://..."
                    }, null, _parent3, _scopeId2));
                    _push3(`</div><div class="space-y-4"${_scopeId2}><div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:wallet",
                      size: "16",
                      class: "text-gray-500"
                    }, null, _parent3, _scopeId2));
                    _push3(`<h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId2}>Comptes</h3></div>`);
                    _push3(ssrRenderComponent(_component_AppInput, {
                      modelValue: unref(editForm).compte_moe,
                      "onUpdate:modelValue": ($event) => unref(editForm).compte_moe = $event,
                      name: "compte_moe",
                      title: "Compte MOE",
                      placeholder: "Numéro de compte MOE"
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppInput, {
                      modelValue: unref(editForm).compte_slg,
                      "onUpdate:modelValue": ($event) => unref(editForm).compte_slg = $event,
                      name: "compte_slg",
                      title: "Compte SLG",
                      placeholder: "Numéro de compte SLG"
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppInput, {
                      modelValue: unref(editForm).compte_matieres,
                      "onUpdate:modelValue": ($event) => unref(editForm).compte_matieres = $event,
                      name: "compte_matieres",
                      title: "Compte Matière",
                      placeholder: "Numéro de compte Matière"
                    }, null, _parent3, _scopeId2));
                    _push3(`</div><div class="space-y-4"${_scopeId2}><div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:file-text",
                      size: "16",
                      class: "text-gray-500"
                    }, null, _parent3, _scopeId2));
                    _push3(`<h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId2}>Autre</h3></div><div class="w-full"${_scopeId2}><label for="autre" class="mb-0.5 block text-sm"${_scopeId2}>Informations complémentaires</label><textarea id="autre" name="autre" rows="4" class="focus:border-primary-500 focus:ring-primary-500 w-full resize-none appearance-none rounded-md border border-gray-300 px-3 py-2 text-sm leading-tight text-gray-700 focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200" placeholder="Notes, remarques, informations diverses..."${_scopeId2}>${ssrInterpolate(unref(editForm).autre)}</textarea></div></div></div>`);
                  } else {
                    return [
                      createVNode("div", { class: "space-y-6" }, [
                        createVNode("div", { class: "space-y-4" }, [
                          createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                            createVNode("div", { class: "border-secondary-900/40 bg-secondary-900/20 h-4 w-6 rounded border" }),
                            createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " Périodes de préparation "),
                            createVNode("div", {
                              class: "hover:text-secondary-700 ml-auto flex h-4 w-6 cursor-pointer items-center justify-center rounded text-gray-900 transition-all duration-300",
                              onClick: ($event) => isPreparationAdd.value = true
                            }, [
                              createVNode(_component_Icon, {
                                name: "lucide:plus",
                                size: "16",
                                class: ""
                              })
                            ], 8, ["onClick"])
                          ]),
                          unref(editForm).preparation.length > 0 ? (openBlock(), createBlock("div", {
                            key: 0,
                            class: "space-y-2"
                          }, [
                            (openBlock(true), createBlock(Fragment, null, renderList(unref(editForm).preparation, (periode, index) => {
                              return openBlock(), createBlock("div", {
                                key: "edit-prepa-" + index,
                                class: "border-secondary-900/40 bg-secondary-900/20 text-secondary-900 flex items-center justify-between rounded-lg border p-3"
                              }, [
                                createVNode("div", { class: "flex items-center gap-2" }, [
                                  createVNode(_component_Icon, {
                                    name: "lucide:calendar",
                                    size: "16",
                                    class: "text-secondary-900"
                                  }),
                                  createVNode("span", { class: "text-sm font-medium text-gray-700 dark:text-gray-300" }, toDisplayString(formatTimestampToDisplay(periode.date_start)) + " → " + toDisplayString(formatTimestampToDisplay(periode.date_end)), 1)
                                ]),
                                createVNode("button", {
                                  type: "button",
                                  onClick: ($event) => handleDeletePreparation(index),
                                  class: "cursor-pointer rounded p-1 text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                }, [
                                  createVNode(_component_Icon, {
                                    name: "lucide:x",
                                    size: "16"
                                  })
                                ], 8, ["onClick"])
                              ]);
                            }), 128))
                          ])) : (openBlock(), createBlock("p", {
                            key: 1,
                            class: "text-sm text-gray-400 italic"
                          }, "Aucune période de préparation")),
                          createVNode(_component_AppDatePickerRange, {
                            "is-open": unref(isPreparationAdd),
                            title: "Période de préparation",
                            onSelect: handleAddPreparationFromPicker,
                            onClose: ($event) => isPreparationAdd.value = false
                          }, null, 8, ["is-open", "onClose"])
                        ]),
                        createVNode("div", { class: "space-y-4" }, [
                          createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                            createVNode("div", { class: "h-4 w-6 rounded border border-red-900 bg-red-800/60" }),
                            createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " Périodes de réalisation "),
                            createVNode("div", {
                              class: "hover:text-secondary-700 ml-auto flex h-4 w-6 cursor-pointer items-center justify-center rounded text-gray-900 transition-all duration-300",
                              onClick: ($event) => isRealisationAdd.value = true
                            }, [
                              createVNode(_component_Icon, {
                                name: "lucide:plus",
                                size: "16",
                                class: ""
                              })
                            ], 8, ["onClick"])
                          ]),
                          unref(editForm).realisation.length > 0 ? (openBlock(), createBlock("div", {
                            key: 0,
                            class: "space-y-2"
                          }, [
                            (openBlock(true), createBlock(Fragment, null, renderList(unref(editForm).realisation, (periode, index) => {
                              return openBlock(), createBlock("div", {
                                key: "edit-rea-" + index,
                                class: "flex items-center justify-between rounded-lg border border-red-900 bg-red-800/60 p-3 text-white"
                              }, [
                                createVNode("div", { class: "flex items-center gap-2" }, [
                                  createVNode(_component_Icon, {
                                    name: "lucide:calendar-check",
                                    size: "16",
                                    class: "text-white"
                                  }),
                                  createVNode("span", { class: "text-sm font-medium text-white" }, toDisplayString(formatTimestampToDisplay(periode.date_start)) + " → " + toDisplayString(formatTimestampToDisplay(periode.date_end)), 1)
                                ]),
                                createVNode("button", {
                                  type: "button",
                                  onClick: ($event) => handleDeleteRealisation(index),
                                  class: "cursor-pointer rounded p-1 text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                }, [
                                  createVNode(_component_Icon, {
                                    name: "lucide:x",
                                    size: "16"
                                  })
                                ], 8, ["onClick"])
                              ]);
                            }), 128))
                          ])) : (openBlock(), createBlock("p", {
                            key: 1,
                            class: "text-sm text-white italic"
                          }, "Aucune période de réalisation")),
                          createVNode(_component_AppDatePickerRange, {
                            "is-open": unref(isRealisationAdd),
                            title: "Période de réalisation",
                            onSelect: handleAddRealisationFromPicker,
                            onClose: ($event) => isRealisationAdd.value = false
                          }, null, 8, ["is-open", "onClose"])
                        ]),
                        createVNode("div", { class: "space-y-4" }, [
                          createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                            createVNode("div", { class: "h-4 w-1.5 rounded bg-orange-500" }),
                            createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " Week-ends "),
                            createVNode("div", {
                              class: "hover:text-secondary-700 ml-auto flex h-4 w-6 cursor-pointer items-center justify-center rounded text-gray-900 transition-all duration-300",
                              onClick: ($event) => isWeekendAdd.value = true
                            }, [
                              createVNode(_component_Icon, {
                                name: "lucide:plus",
                                size: "16",
                                class: ""
                              })
                            ], 8, ["onClick"])
                          ]),
                          unref(editForm).weekends.length > 0 ? (openBlock(), createBlock("div", {
                            key: 0,
                            class: "space-y-2"
                          }, [
                            (openBlock(true), createBlock(Fragment, null, renderList(unref(editForm).weekends, (weekend, index) => {
                              return openBlock(), createBlock("div", {
                                key: "edit-weekend-" + index,
                                class: "flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-900/20"
                              }, [
                                createVNode("div", { class: "flex items-center gap-2" }, [
                                  createVNode(_component_Icon, {
                                    name: "lucide:calendar-days",
                                    size: "16",
                                    class: "text-orange-500"
                                  }),
                                  createVNode("span", { class: "text-sm font-medium text-gray-700 dark:text-gray-300" }, " S" + toDisplayString(weekend.debutSemaine) + "/" + toDisplayString(weekend.debutAnnee) + " → S" + toDisplayString(weekend.finSemaine) + "/" + toDisplayString(weekend.finAnnee), 1)
                                ]),
                                createVNode("button", {
                                  type: "button",
                                  onClick: ($event) => handleDeleteWeekend(index),
                                  class: "cursor-pointer rounded p-1 text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                }, [
                                  createVNode(_component_Icon, {
                                    name: "lucide:x",
                                    size: "16"
                                  })
                                ], 8, ["onClick"])
                              ]);
                            }), 128))
                          ])) : (openBlock(), createBlock("p", {
                            key: 1,
                            class: "text-sm text-gray-400 italic"
                          }, "Aucun week-end programmé")),
                          !unref(isWeekendAdd) ? (openBlock(), createBlock("div", { key: 2 })) : (openBlock(), createBlock("div", {
                            key: 3,
                            class: "rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
                          }, [
                            createVNode("p", { class: "mb-3 text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-400" }, " Semaine de début (la fin sera automatiquement définie) "),
                            createVNode("div", { class: "grid grid-cols-2 gap-3" }, [
                              createVNode("div", null, [
                                createVNode("label", { class: "mb-1 block text-xs text-gray-500" }, "Semaine"),
                                createVNode(_component_AppSelect, {
                                  modelValue: unref(newWeekend).semaineDebut,
                                  "onUpdate:modelValue": ($event) => unref(newWeekend).semaineDebut = $event,
                                  options: unref(semaineOptions),
                                  placeholder: "S...",
                                  nullable: ""
                                }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                              ]),
                              createVNode("div", null, [
                                createVNode("label", { class: "mb-1 block text-xs text-gray-500" }, "Année"),
                                createVNode(_component_AppSelect, {
                                  modelValue: unref(newWeekend).anneeDebut,
                                  "onUpdate:modelValue": ($event) => unref(newWeekend).anneeDebut = $event,
                                  options: unref(anneeOptions),
                                  placeholder: "Année"
                                }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                              ])
                            ]),
                            createVNode("div", { class: "mt-3 flex gap-2" }, [
                              createVNode(_component_AppButtonValidated, {
                                type: "button",
                                theme: "primary",
                                validated: !!unref(newWeekend).semaineDebut,
                                onClick: handleAddWeekend
                              }, {
                                default: withCtx(() => [
                                  createVNode("span", { class: "flex items-center gap-2" }, [
                                    createVNode(_component_Icon, {
                                      name: "lucide:plus",
                                      size: "16"
                                    }),
                                    createTextVNode(" Ajouter ")
                                  ])
                                ]),
                                _: 1
                              }, 8, ["validated"]),
                              createVNode("button", {
                                type: "button",
                                onClick: ($event) => isWeekendAdd.value = false,
                                class: "text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                              }, " Annuler ", 8, ["onClick"])
                            ])
                          ]))
                        ]),
                        createVNode("div", { class: "space-y-4" }, [
                          createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                            createVNode(_component_Icon, {
                              name: "lucide:info",
                              size: "16",
                              class: "text-gray-500"
                            }),
                            createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " Informations générales ")
                          ]),
                          createVNode(_component_AppSelect, {
                            modelValue: unref(editForm).ligne_id,
                            "onUpdate:modelValue": ($event) => unref(editForm).ligne_id = $event,
                            name: "type_essais",
                            title: "Ligne",
                            options: unref(allLignes),
                            placeholder: "Sélectionner la ligne...",
                            nullable: ""
                          }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                          createVNode(_component_AppSelect, {
                            modelValue: unref(editForm).type_essais,
                            "onUpdate:modelValue": ($event) => unref(editForm).type_essais = $event,
                            name: "type_essais",
                            title: "Type d'essais",
                            options: typeEssaisOptions,
                            placeholder: "Sélectionner le type d'essais...",
                            nullable: ""
                          }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                          createVNode(_component_AppSelect, {
                            modelValue: unref(editForm).decret,
                            "onUpdate:modelValue": ($event) => unref(editForm).decret = $event,
                            name: "decret",
                            title: "Décret",
                            options: decretOptions,
                            placeholder: "Sélectionner...",
                            nullable: ""
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ]),
                        createVNode("div", { class: "space-y-4" }, [
                          createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                            createVNode(_component_Icon, {
                              name: "lucide:package",
                              size: "16",
                              class: "text-gray-500"
                            }),
                            createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " Matières DM ")
                          ]),
                          createVNode(_component_AppInput, {
                            modelValue: unref(editForm).matiere,
                            "onUpdate:modelValue": ($event) => unref(editForm).matiere = $event,
                            name: "matiere",
                            title: "Lien web",
                            type: "url",
                            placeholder: "https://..."
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ]),
                        createVNode("div", { class: "space-y-4" }, [
                          createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                            createVNode(_component_Icon, {
                              name: "lucide:package",
                              size: "16",
                              class: "text-gray-500"
                            }),
                            createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " Matières DA ")
                          ]),
                          createVNode(_component_AppInput, {
                            modelValue: unref(editForm).matiere_da,
                            "onUpdate:modelValue": ($event) => unref(editForm).matiere_da = $event,
                            name: "matiere_da",
                            title: "Lien web",
                            type: "url",
                            placeholder: "https://..."
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ]),
                        createVNode("div", { class: "space-y-4" }, [
                          createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                            createVNode(_component_Icon, {
                              name: "lucide:wallet",
                              size: "16",
                              class: "text-gray-500"
                            }),
                            createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, "Comptes")
                          ]),
                          createVNode(_component_AppInput, {
                            modelValue: unref(editForm).compte_moe,
                            "onUpdate:modelValue": ($event) => unref(editForm).compte_moe = $event,
                            name: "compte_moe",
                            title: "Compte MOE",
                            placeholder: "Numéro de compte MOE"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                          createVNode(_component_AppInput, {
                            modelValue: unref(editForm).compte_slg,
                            "onUpdate:modelValue": ($event) => unref(editForm).compte_slg = $event,
                            name: "compte_slg",
                            title: "Compte SLG",
                            placeholder: "Numéro de compte SLG"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                          createVNode(_component_AppInput, {
                            modelValue: unref(editForm).compte_matieres,
                            "onUpdate:modelValue": ($event) => unref(editForm).compte_matieres = $event,
                            name: "compte_matieres",
                            title: "Compte Matière",
                            placeholder: "Numéro de compte Matière"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ]),
                        createVNode("div", { class: "space-y-4" }, [
                          createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                            createVNode(_component_Icon, {
                              name: "lucide:file-text",
                              size: "16",
                              class: "text-gray-500"
                            }),
                            createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, "Autre")
                          ]),
                          createVNode("div", { class: "w-full" }, [
                            createVNode("label", {
                              for: "autre",
                              class: "mb-0.5 block text-sm"
                            }, "Informations complémentaires"),
                            withDirectives(createVNode("textarea", {
                              "onUpdate:modelValue": ($event) => unref(editForm).autre = $event,
                              id: "autre",
                              name: "autre",
                              rows: "4",
                              class: "focus:border-primary-500 focus:ring-primary-500 w-full resize-none appearance-none rounded-md border border-gray-300 px-3 py-2 text-sm leading-tight text-gray-700 focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200",
                              placeholder: "Notes, remarques, informations diverses..."
                            }, null, 8, ["onUpdate:modelValue"]), [
                              [vModelText, unref(editForm).autre]
                            ])
                          ])
                        ])
                      ])
                    ];
                  }
                }),
                footer: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_AppButtonValidated, {
                      theme: "cancel",
                      type: "button",
                      onClick: closeEditSlideOver
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`Annuler`);
                        } else {
                          return [
                            createTextVNode("Annuler")
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppButtonValidated, {
                      theme: "primary",
                      type: "button",
                      onClick: saveChanges
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`Enregistrer`);
                        } else {
                          return [
                            createTextVNode("Enregistrer")
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(`</div>`);
                  } else {
                    return [
                      createVNode("div", { class: "flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700" }, [
                        createVNode(_component_AppButtonValidated, {
                          theme: "cancel",
                          type: "button",
                          onClick: closeEditSlideOver
                        }, {
                          default: withCtx(() => [
                            createTextVNode("Annuler")
                          ]),
                          _: 1
                        }),
                        createVNode(_component_AppButtonValidated, {
                          theme: "primary",
                          type: "button",
                          onClick: saveChanges
                        }, {
                          default: withCtx(() => [
                            createTextVNode("Enregistrer")
                          ]),
                          _: 1
                        })
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
              unref(showEditSlideOver) ? (openBlock(), createBlock(_component_AppSlideOverContent, {
                key: 0,
                closeSideModal: closeEditSlideOver
              }, {
                header: withCtx(() => [
                  createVNode("h2", { class: "font-[Pacifico] text-3xl text-gray-800 dark:text-white" }, "Périodes du chantier"),
                  createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, " Gérez les périodes de préparation, réalisation et week-ends ")
                ]),
                default: withCtx(() => [
                  createVNode("div", { class: "space-y-6" }, [
                    createVNode("div", { class: "space-y-4" }, [
                      createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                        createVNode("div", { class: "border-secondary-900/40 bg-secondary-900/20 h-4 w-6 rounded border" }),
                        createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " Périodes de préparation "),
                        createVNode("div", {
                          class: "hover:text-secondary-700 ml-auto flex h-4 w-6 cursor-pointer items-center justify-center rounded text-gray-900 transition-all duration-300",
                          onClick: ($event) => isPreparationAdd.value = true
                        }, [
                          createVNode(_component_Icon, {
                            name: "lucide:plus",
                            size: "16",
                            class: ""
                          })
                        ], 8, ["onClick"])
                      ]),
                      unref(editForm).preparation.length > 0 ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "space-y-2"
                      }, [
                        (openBlock(true), createBlock(Fragment, null, renderList(unref(editForm).preparation, (periode, index) => {
                          return openBlock(), createBlock("div", {
                            key: "edit-prepa-" + index,
                            class: "border-secondary-900/40 bg-secondary-900/20 text-secondary-900 flex items-center justify-between rounded-lg border p-3"
                          }, [
                            createVNode("div", { class: "flex items-center gap-2" }, [
                              createVNode(_component_Icon, {
                                name: "lucide:calendar",
                                size: "16",
                                class: "text-secondary-900"
                              }),
                              createVNode("span", { class: "text-sm font-medium text-gray-700 dark:text-gray-300" }, toDisplayString(formatTimestampToDisplay(periode.date_start)) + " → " + toDisplayString(formatTimestampToDisplay(periode.date_end)), 1)
                            ]),
                            createVNode("button", {
                              type: "button",
                              onClick: ($event) => handleDeletePreparation(index),
                              class: "cursor-pointer rounded p-1 text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            }, [
                              createVNode(_component_Icon, {
                                name: "lucide:x",
                                size: "16"
                              })
                            ], 8, ["onClick"])
                          ]);
                        }), 128))
                      ])) : (openBlock(), createBlock("p", {
                        key: 1,
                        class: "text-sm text-gray-400 italic"
                      }, "Aucune période de préparation")),
                      createVNode(_component_AppDatePickerRange, {
                        "is-open": unref(isPreparationAdd),
                        title: "Période de préparation",
                        onSelect: handleAddPreparationFromPicker,
                        onClose: ($event) => isPreparationAdd.value = false
                      }, null, 8, ["is-open", "onClose"])
                    ]),
                    createVNode("div", { class: "space-y-4" }, [
                      createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                        createVNode("div", { class: "h-4 w-6 rounded border border-red-900 bg-red-800/60" }),
                        createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " Périodes de réalisation "),
                        createVNode("div", {
                          class: "hover:text-secondary-700 ml-auto flex h-4 w-6 cursor-pointer items-center justify-center rounded text-gray-900 transition-all duration-300",
                          onClick: ($event) => isRealisationAdd.value = true
                        }, [
                          createVNode(_component_Icon, {
                            name: "lucide:plus",
                            size: "16",
                            class: ""
                          })
                        ], 8, ["onClick"])
                      ]),
                      unref(editForm).realisation.length > 0 ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "space-y-2"
                      }, [
                        (openBlock(true), createBlock(Fragment, null, renderList(unref(editForm).realisation, (periode, index) => {
                          return openBlock(), createBlock("div", {
                            key: "edit-rea-" + index,
                            class: "flex items-center justify-between rounded-lg border border-red-900 bg-red-800/60 p-3 text-white"
                          }, [
                            createVNode("div", { class: "flex items-center gap-2" }, [
                              createVNode(_component_Icon, {
                                name: "lucide:calendar-check",
                                size: "16",
                                class: "text-white"
                              }),
                              createVNode("span", { class: "text-sm font-medium text-white" }, toDisplayString(formatTimestampToDisplay(periode.date_start)) + " → " + toDisplayString(formatTimestampToDisplay(periode.date_end)), 1)
                            ]),
                            createVNode("button", {
                              type: "button",
                              onClick: ($event) => handleDeleteRealisation(index),
                              class: "cursor-pointer rounded p-1 text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            }, [
                              createVNode(_component_Icon, {
                                name: "lucide:x",
                                size: "16"
                              })
                            ], 8, ["onClick"])
                          ]);
                        }), 128))
                      ])) : (openBlock(), createBlock("p", {
                        key: 1,
                        class: "text-sm text-white italic"
                      }, "Aucune période de réalisation")),
                      createVNode(_component_AppDatePickerRange, {
                        "is-open": unref(isRealisationAdd),
                        title: "Période de réalisation",
                        onSelect: handleAddRealisationFromPicker,
                        onClose: ($event) => isRealisationAdd.value = false
                      }, null, 8, ["is-open", "onClose"])
                    ]),
                    createVNode("div", { class: "space-y-4" }, [
                      createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                        createVNode("div", { class: "h-4 w-1.5 rounded bg-orange-500" }),
                        createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " Week-ends "),
                        createVNode("div", {
                          class: "hover:text-secondary-700 ml-auto flex h-4 w-6 cursor-pointer items-center justify-center rounded text-gray-900 transition-all duration-300",
                          onClick: ($event) => isWeekendAdd.value = true
                        }, [
                          createVNode(_component_Icon, {
                            name: "lucide:plus",
                            size: "16",
                            class: ""
                          })
                        ], 8, ["onClick"])
                      ]),
                      unref(editForm).weekends.length > 0 ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "space-y-2"
                      }, [
                        (openBlock(true), createBlock(Fragment, null, renderList(unref(editForm).weekends, (weekend, index) => {
                          return openBlock(), createBlock("div", {
                            key: "edit-weekend-" + index,
                            class: "flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-900/20"
                          }, [
                            createVNode("div", { class: "flex items-center gap-2" }, [
                              createVNode(_component_Icon, {
                                name: "lucide:calendar-days",
                                size: "16",
                                class: "text-orange-500"
                              }),
                              createVNode("span", { class: "text-sm font-medium text-gray-700 dark:text-gray-300" }, " S" + toDisplayString(weekend.debutSemaine) + "/" + toDisplayString(weekend.debutAnnee) + " → S" + toDisplayString(weekend.finSemaine) + "/" + toDisplayString(weekend.finAnnee), 1)
                            ]),
                            createVNode("button", {
                              type: "button",
                              onClick: ($event) => handleDeleteWeekend(index),
                              class: "cursor-pointer rounded p-1 text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            }, [
                              createVNode(_component_Icon, {
                                name: "lucide:x",
                                size: "16"
                              })
                            ], 8, ["onClick"])
                          ]);
                        }), 128))
                      ])) : (openBlock(), createBlock("p", {
                        key: 1,
                        class: "text-sm text-gray-400 italic"
                      }, "Aucun week-end programmé")),
                      !unref(isWeekendAdd) ? (openBlock(), createBlock("div", { key: 2 })) : (openBlock(), createBlock("div", {
                        key: 3,
                        class: "rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
                      }, [
                        createVNode("p", { class: "mb-3 text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-400" }, " Semaine de début (la fin sera automatiquement définie) "),
                        createVNode("div", { class: "grid grid-cols-2 gap-3" }, [
                          createVNode("div", null, [
                            createVNode("label", { class: "mb-1 block text-xs text-gray-500" }, "Semaine"),
                            createVNode(_component_AppSelect, {
                              modelValue: unref(newWeekend).semaineDebut,
                              "onUpdate:modelValue": ($event) => unref(newWeekend).semaineDebut = $event,
                              options: unref(semaineOptions),
                              placeholder: "S...",
                              nullable: ""
                            }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                          ]),
                          createVNode("div", null, [
                            createVNode("label", { class: "mb-1 block text-xs text-gray-500" }, "Année"),
                            createVNode(_component_AppSelect, {
                              modelValue: unref(newWeekend).anneeDebut,
                              "onUpdate:modelValue": ($event) => unref(newWeekend).anneeDebut = $event,
                              options: unref(anneeOptions),
                              placeholder: "Année"
                            }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                          ])
                        ]),
                        createVNode("div", { class: "mt-3 flex gap-2" }, [
                          createVNode(_component_AppButtonValidated, {
                            type: "button",
                            theme: "primary",
                            validated: !!unref(newWeekend).semaineDebut,
                            onClick: handleAddWeekend
                          }, {
                            default: withCtx(() => [
                              createVNode("span", { class: "flex items-center gap-2" }, [
                                createVNode(_component_Icon, {
                                  name: "lucide:plus",
                                  size: "16"
                                }),
                                createTextVNode(" Ajouter ")
                              ])
                            ]),
                            _: 1
                          }, 8, ["validated"]),
                          createVNode("button", {
                            type: "button",
                            onClick: ($event) => isWeekendAdd.value = false,
                            class: "text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                          }, " Annuler ", 8, ["onClick"])
                        ])
                      ]))
                    ]),
                    createVNode("div", { class: "space-y-4" }, [
                      createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                        createVNode(_component_Icon, {
                          name: "lucide:info",
                          size: "16",
                          class: "text-gray-500"
                        }),
                        createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " Informations générales ")
                      ]),
                      createVNode(_component_AppSelect, {
                        modelValue: unref(editForm).ligne_id,
                        "onUpdate:modelValue": ($event) => unref(editForm).ligne_id = $event,
                        name: "type_essais",
                        title: "Ligne",
                        options: unref(allLignes),
                        placeholder: "Sélectionner la ligne...",
                        nullable: ""
                      }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                      createVNode(_component_AppSelect, {
                        modelValue: unref(editForm).type_essais,
                        "onUpdate:modelValue": ($event) => unref(editForm).type_essais = $event,
                        name: "type_essais",
                        title: "Type d'essais",
                        options: typeEssaisOptions,
                        placeholder: "Sélectionner le type d'essais...",
                        nullable: ""
                      }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                      createVNode(_component_AppSelect, {
                        modelValue: unref(editForm).decret,
                        "onUpdate:modelValue": ($event) => unref(editForm).decret = $event,
                        name: "decret",
                        title: "Décret",
                        options: decretOptions,
                        placeholder: "Sélectionner...",
                        nullable: ""
                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                    ]),
                    createVNode("div", { class: "space-y-4" }, [
                      createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                        createVNode(_component_Icon, {
                          name: "lucide:package",
                          size: "16",
                          class: "text-gray-500"
                        }),
                        createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " Matières DM ")
                      ]),
                      createVNode(_component_AppInput, {
                        modelValue: unref(editForm).matiere,
                        "onUpdate:modelValue": ($event) => unref(editForm).matiere = $event,
                        name: "matiere",
                        title: "Lien web",
                        type: "url",
                        placeholder: "https://..."
                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                    ]),
                    createVNode("div", { class: "space-y-4" }, [
                      createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                        createVNode(_component_Icon, {
                          name: "lucide:package",
                          size: "16",
                          class: "text-gray-500"
                        }),
                        createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " Matières DA ")
                      ]),
                      createVNode(_component_AppInput, {
                        modelValue: unref(editForm).matiere_da,
                        "onUpdate:modelValue": ($event) => unref(editForm).matiere_da = $event,
                        name: "matiere_da",
                        title: "Lien web",
                        type: "url",
                        placeholder: "https://..."
                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                    ]),
                    createVNode("div", { class: "space-y-4" }, [
                      createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                        createVNode(_component_Icon, {
                          name: "lucide:wallet",
                          size: "16",
                          class: "text-gray-500"
                        }),
                        createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, "Comptes")
                      ]),
                      createVNode(_component_AppInput, {
                        modelValue: unref(editForm).compte_moe,
                        "onUpdate:modelValue": ($event) => unref(editForm).compte_moe = $event,
                        name: "compte_moe",
                        title: "Compte MOE",
                        placeholder: "Numéro de compte MOE"
                      }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                      createVNode(_component_AppInput, {
                        modelValue: unref(editForm).compte_slg,
                        "onUpdate:modelValue": ($event) => unref(editForm).compte_slg = $event,
                        name: "compte_slg",
                        title: "Compte SLG",
                        placeholder: "Numéro de compte SLG"
                      }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                      createVNode(_component_AppInput, {
                        modelValue: unref(editForm).compte_matieres,
                        "onUpdate:modelValue": ($event) => unref(editForm).compte_matieres = $event,
                        name: "compte_matieres",
                        title: "Compte Matière",
                        placeholder: "Numéro de compte Matière"
                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                    ]),
                    createVNode("div", { class: "space-y-4" }, [
                      createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                        createVNode(_component_Icon, {
                          name: "lucide:file-text",
                          size: "16",
                          class: "text-gray-500"
                        }),
                        createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, "Autre")
                      ]),
                      createVNode("div", { class: "w-full" }, [
                        createVNode("label", {
                          for: "autre",
                          class: "mb-0.5 block text-sm"
                        }, "Informations complémentaires"),
                        withDirectives(createVNode("textarea", {
                          "onUpdate:modelValue": ($event) => unref(editForm).autre = $event,
                          id: "autre",
                          name: "autre",
                          rows: "4",
                          class: "focus:border-primary-500 focus:ring-primary-500 w-full resize-none appearance-none rounded-md border border-gray-300 px-3 py-2 text-sm leading-tight text-gray-700 focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200",
                          placeholder: "Notes, remarques, informations diverses..."
                        }, null, 8, ["onUpdate:modelValue"]), [
                          [vModelText, unref(editForm).autre]
                        ])
                      ])
                    ])
                  ])
                ]),
                footer: withCtx(() => [
                  createVNode("div", { class: "flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700" }, [
                    createVNode(_component_AppButtonValidated, {
                      theme: "cancel",
                      type: "button",
                      onClick: closeEditSlideOver
                    }, {
                      default: withCtx(() => [
                        createTextVNode("Annuler")
                      ]),
                      _: 1
                    }),
                    createVNode(_component_AppButtonValidated, {
                      theme: "primary",
                      type: "button",
                      onClick: saveChanges
                    }, {
                      default: withCtx(() => [
                        createTextVNode("Enregistrer")
                      ]),
                      _: 1
                    })
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
const _sfc_setup$m = _sfc_main$m.setup;
_sfc_main$m.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/chantier/generalites.vue");
  return _sfc_setup$m ? _sfc_setup$m(props, ctx) : void 0;
};
const _sfc_main$l = {
  __name: "ChantierContactsGeneralites",
  __ssrInlineRender: true,
  props: {
    chantier: {
      type: Object,
      required: true
    }
  },
  setup(__props) {
    const props = __props;
    const { upsertContactsGeneralites } = useContacts();
    const { users } = useUsers();
    const { setLoader } = useLoader();
    const contactsGeneralites = ref([]);
    const showEditGeneralites = ref(false);
    const editFormGeneralites = ref({
      chef_projet_nom: "",
      chef_projet_email: "",
      coordinateur_securite_nom: "",
      coordinateur_securite_email: ""
    });
    computed(() => {
      return users.value.map((u) => ({
        id: u.id,
        label: u.prenom && u.nom ? `${u.prenom} ${u.nom}` : u.email
      }));
    });
    const openEditGeneralites = () => {
      editFormGeneralites.value = {
        chef_projet_nom: contactsGeneralites.value?.chef_projet_nom || "",
        chef_projet_email: contactsGeneralites.value?.chef_projet_email || "",
        coordinateur_securite_nom: contactsGeneralites.value?.coordinateur_securite_nom || "",
        coordinateur_securite_email: contactsGeneralites.value?.coordinateur_securite_email || ""
      };
      showEditGeneralites.value = true;
    };
    const saveGeneralites = async () => {
      setLoader(true);
      try {
        const result = await upsertContactsGeneralites(props.chantier.id, editFormGeneralites.value);
        if (result) {
          contactsGeneralites.value = result;
          showEditGeneralites.value = false;
        }
      } finally {
        setLoader(false);
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Icon = __nuxt_component_1;
      const _component_AppButtonValidated = _sfc_main$2$1;
      const _component_AppSlideOver = _sfc_main$1$1;
      const _component_AppSlideOverContent = _sfc_main$p;
      const _component_AppInput = _sfc_main$1$2;
      _push(`<div${ssrRenderAttrs(_attrs)}><div class="space-y-6"><div class="flex items-center justify-between gap-2"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-600/20 text-gray-700">`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:user-circle",
        size: "20"
      }, null, _parent));
      _push(`</div><div><h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">Contacts généraux</h2><p class="text-xs text-gray-500 dark:text-gray-400">Chef de projet et coordinateur sécurité</p></div></div>`);
      _push(ssrRenderComponent(_component_AppButtonValidated, {
        type: "button",
        theme: "primary",
        onClick: openEditGeneralites
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<span class="flex items-center gap-2"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:pencil",
              size: "16"
            }, null, _parent2, _scopeId));
            _push2(`<p class="hidden lg:block"${_scopeId}>Modifier</p></span>`);
          } else {
            return [
              createVNode("span", { class: "flex items-center gap-2" }, [
                createVNode(_component_Icon, {
                  name: "lucide:pencil",
                  size: "16"
                }),
                createVNode("p", { class: "hidden lg:block" }, "Modifier")
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="rounded-lg bg-white p-4 shadow-lg">`);
      if (unref(contactsGeneralites) && (unref(contactsGeneralites)?.chef_projet_nom || unref(contactsGeneralites)?.coordinateur_securite_nom)) {
        _push(`<div class="mb-4"><p class="pb-4 text-base font-semibold tracking-wide text-gray-500 uppercase">Généralités</p><table class="w-full text-left text-sm"><thead><tr class="bg-secondary-900/10 border-b border-gray-200"><th class="text-secondary-900 px-2 py-1.5 font-semibold">Fonction</th><th class="text-secondary-900 px-2 py-1.5 font-semibold">Nom</th><th class="text-secondary-900 px-2 py-1.5 font-semibold">Email</th></tr></thead><tbody>`);
        if (unref(contactsGeneralites)?.chef_projet_nom) {
          _push(`<tr class="border-b border-gray-100"><td class="px-2 py-1.5 font-bold text-gray-700">Chef de projet</td><td class="px-2 py-1.5 text-gray-700">${ssrInterpolate(unref(contactsGeneralites).chef_projet_nom)}</td><td class="px-2 py-1.5 text-gray-700">`);
          if (unref(contactsGeneralites)?.chef_projet_email) {
            _push(`<a${ssrRenderAttr("href", `mailto:${unref(contactsGeneralites).chef_projet_email}`)} class="hover:underline">${ssrInterpolate(unref(contactsGeneralites).chef_projet_email)}</a>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</td></tr>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(contactsGeneralites)?.coordinateur_securite_nom) {
          _push(`<tr class="border-b border-gray-100"><td class="px-2 py-1.5 font-bold text-gray-700">Coordinateur sécurité</td><td class="px-2 py-1.5 text-gray-700">${ssrInterpolate(unref(contactsGeneralites).coordinateur_securite_nom)}</td><td class="px-2 py-1.5 text-gray-700">`);
          if (unref(contactsGeneralites)?.coordinateur_securite_email) {
            _push(`<a${ssrRenderAttr("href", `mailto:${unref(contactsGeneralites).coordinateur_securite_email}`)} class="hover:underline">${ssrInterpolate(unref(contactsGeneralites).coordinateur_securite_email)}</a>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</td></tr>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</tbody></table></div>`);
      } else {
        _push(`<div class="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:users",
          size: "48",
          class: "mb-4 opacity-50"
        }, null, _parent));
        _push(`<p class="text-lg font-medium">Aucun contact d&#39;enregistré</p><p class="text-sm">Cliquez sur &quot;Modifier&quot; pour ajouter un contact</p></div>`);
      }
      _push(`</div></div>`);
      _push(ssrRenderComponent(_component_AppSlideOver, {
        sideModal: unref(showEditGeneralites),
        closeSideModal: () => showEditGeneralites.value = false
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (unref(showEditGeneralites)) {
              _push2(ssrRenderComponent(_component_AppSlideOverContent, {
                closeSideModal: () => showEditGeneralites.value = false
              }, {
                header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<h2 class="font-[Pacifico] text-3xl text-gray-800 dark:text-white"${_scopeId2}>Contacts généraux</h2><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId2}>Modifier les contacts généraux du chantier</p>`);
                  } else {
                    return [
                      createVNode("h2", { class: "font-[Pacifico] text-3xl text-gray-800 dark:text-white" }, "Contacts généraux"),
                      createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, "Modifier les contacts généraux du chantier")
                    ];
                  }
                }),
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<form class="space-y-6"${_scopeId2}><div class="space-y-4"${_scopeId2}><div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:briefcase",
                      size: "16",
                      class: "text-gray-700"
                    }, null, _parent3, _scopeId2));
                    _push3(`<h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId2}> Chef de projet </h3></div>`);
                    _push3(ssrRenderComponent(_component_AppInput, {
                      modelValue: unref(editFormGeneralites).chef_projet_nom,
                      "onUpdate:modelValue": ($event) => unref(editFormGeneralites).chef_projet_nom = $event,
                      name: "chef_projet_nom",
                      title: "Nom",
                      placeholder: "Nom du chef de projet"
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppInput, {
                      modelValue: unref(editFormGeneralites).chef_projet_email,
                      "onUpdate:modelValue": ($event) => unref(editFormGeneralites).chef_projet_email = $event,
                      name: "chef_projet_email",
                      title: "Email",
                      type: "email",
                      placeholder: "email@exemple.com"
                    }, null, _parent3, _scopeId2));
                    _push3(`</div><div class="space-y-4"${_scopeId2}><div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:shield-check",
                      size: "16",
                      class: "text-gray-700"
                    }, null, _parent3, _scopeId2));
                    _push3(`<h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId2}> Coordinateur sécurité </h3></div>`);
                    _push3(ssrRenderComponent(_component_AppInput, {
                      modelValue: unref(editFormGeneralites).coordinateur_securite_nom,
                      "onUpdate:modelValue": ($event) => unref(editFormGeneralites).coordinateur_securite_nom = $event,
                      name: "coordinateur_securite_nom",
                      title: "Nom",
                      placeholder: "Nom du coordinateur"
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppInput, {
                      modelValue: unref(editFormGeneralites).coordinateur_securite_email,
                      "onUpdate:modelValue": ($event) => unref(editFormGeneralites).coordinateur_securite_email = $event,
                      name: "coordinateur_securite_email",
                      title: "Email",
                      type: "email",
                      placeholder: "email@exemple.com"
                    }, null, _parent3, _scopeId2));
                    _push3(`</div></form>`);
                  } else {
                    return [
                      createVNode("form", {
                        onSubmit: withModifiers(saveGeneralites, ["prevent"]),
                        class: "space-y-6"
                      }, [
                        createVNode("div", { class: "space-y-4" }, [
                          createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                            createVNode(_component_Icon, {
                              name: "lucide:briefcase",
                              size: "16",
                              class: "text-gray-700"
                            }),
                            createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " Chef de projet ")
                          ]),
                          createVNode(_component_AppInput, {
                            modelValue: unref(editFormGeneralites).chef_projet_nom,
                            "onUpdate:modelValue": ($event) => unref(editFormGeneralites).chef_projet_nom = $event,
                            name: "chef_projet_nom",
                            title: "Nom",
                            placeholder: "Nom du chef de projet"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                          createVNode(_component_AppInput, {
                            modelValue: unref(editFormGeneralites).chef_projet_email,
                            "onUpdate:modelValue": ($event) => unref(editFormGeneralites).chef_projet_email = $event,
                            name: "chef_projet_email",
                            title: "Email",
                            type: "email",
                            placeholder: "email@exemple.com"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ]),
                        createVNode("div", { class: "space-y-4" }, [
                          createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                            createVNode(_component_Icon, {
                              name: "lucide:shield-check",
                              size: "16",
                              class: "text-gray-700"
                            }),
                            createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " Coordinateur sécurité ")
                          ]),
                          createVNode(_component_AppInput, {
                            modelValue: unref(editFormGeneralites).coordinateur_securite_nom,
                            "onUpdate:modelValue": ($event) => unref(editFormGeneralites).coordinateur_securite_nom = $event,
                            name: "coordinateur_securite_nom",
                            title: "Nom",
                            placeholder: "Nom du coordinateur"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                          createVNode(_component_AppInput, {
                            modelValue: unref(editFormGeneralites).coordinateur_securite_email,
                            "onUpdate:modelValue": ($event) => unref(editFormGeneralites).coordinateur_securite_email = $event,
                            name: "coordinateur_securite_email",
                            title: "Email",
                            type: "email",
                            placeholder: "email@exemple.com"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ])
                      ], 32)
                    ];
                  }
                }),
                footer: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_AppButtonValidated, {
                      theme: "cancel",
                      type: "button",
                      onClick: ($event) => showEditGeneralites.value = false
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`Annuler`);
                        } else {
                          return [
                            createTextVNode("Annuler")
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppButtonValidated, {
                      theme: "primary",
                      type: "button",
                      onClick: saveGeneralites
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`Enregistrer`);
                        } else {
                          return [
                            createTextVNode("Enregistrer")
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(`</div>`);
                  } else {
                    return [
                      createVNode("div", { class: "flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700" }, [
                        createVNode(_component_AppButtonValidated, {
                          theme: "cancel",
                          type: "button",
                          onClick: ($event) => showEditGeneralites.value = false
                        }, {
                          default: withCtx(() => [
                            createTextVNode("Annuler")
                          ]),
                          _: 1
                        }, 8, ["onClick"]),
                        createVNode(_component_AppButtonValidated, {
                          theme: "primary",
                          type: "button",
                          onClick: saveGeneralites
                        }, {
                          default: withCtx(() => [
                            createTextVNode("Enregistrer")
                          ]),
                          _: 1
                        })
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
              unref(showEditGeneralites) ? (openBlock(), createBlock(_component_AppSlideOverContent, {
                key: 0,
                closeSideModal: () => showEditGeneralites.value = false
              }, {
                header: withCtx(() => [
                  createVNode("h2", { class: "font-[Pacifico] text-3xl text-gray-800 dark:text-white" }, "Contacts généraux"),
                  createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, "Modifier les contacts généraux du chantier")
                ]),
                default: withCtx(() => [
                  createVNode("form", {
                    onSubmit: withModifiers(saveGeneralites, ["prevent"]),
                    class: "space-y-6"
                  }, [
                    createVNode("div", { class: "space-y-4" }, [
                      createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                        createVNode(_component_Icon, {
                          name: "lucide:briefcase",
                          size: "16",
                          class: "text-gray-700"
                        }),
                        createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " Chef de projet ")
                      ]),
                      createVNode(_component_AppInput, {
                        modelValue: unref(editFormGeneralites).chef_projet_nom,
                        "onUpdate:modelValue": ($event) => unref(editFormGeneralites).chef_projet_nom = $event,
                        name: "chef_projet_nom",
                        title: "Nom",
                        placeholder: "Nom du chef de projet"
                      }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                      createVNode(_component_AppInput, {
                        modelValue: unref(editFormGeneralites).chef_projet_email,
                        "onUpdate:modelValue": ($event) => unref(editFormGeneralites).chef_projet_email = $event,
                        name: "chef_projet_email",
                        title: "Email",
                        type: "email",
                        placeholder: "email@exemple.com"
                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                    ]),
                    createVNode("div", { class: "space-y-4" }, [
                      createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                        createVNode(_component_Icon, {
                          name: "lucide:shield-check",
                          size: "16",
                          class: "text-gray-700"
                        }),
                        createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " Coordinateur sécurité ")
                      ]),
                      createVNode(_component_AppInput, {
                        modelValue: unref(editFormGeneralites).coordinateur_securite_nom,
                        "onUpdate:modelValue": ($event) => unref(editFormGeneralites).coordinateur_securite_nom = $event,
                        name: "coordinateur_securite_nom",
                        title: "Nom",
                        placeholder: "Nom du coordinateur"
                      }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                      createVNode(_component_AppInput, {
                        modelValue: unref(editFormGeneralites).coordinateur_securite_email,
                        "onUpdate:modelValue": ($event) => unref(editFormGeneralites).coordinateur_securite_email = $event,
                        name: "coordinateur_securite_email",
                        title: "Email",
                        type: "email",
                        placeholder: "email@exemple.com"
                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                    ])
                  ], 32)
                ]),
                footer: withCtx(() => [
                  createVNode("div", { class: "flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700" }, [
                    createVNode(_component_AppButtonValidated, {
                      theme: "cancel",
                      type: "button",
                      onClick: ($event) => showEditGeneralites.value = false
                    }, {
                      default: withCtx(() => [
                        createTextVNode("Annuler")
                      ]),
                      _: 1
                    }, 8, ["onClick"]),
                    createVNode(_component_AppButtonValidated, {
                      theme: "primary",
                      type: "button",
                      onClick: saveGeneralites
                    }, {
                      default: withCtx(() => [
                        createTextVNode("Enregistrer")
                      ]),
                      _: 1
                    })
                  ])
                ]),
                _: 1
              }, 8, ["closeSideModal"])) : createCommentVNode("", true)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
    };
  }
};
const _sfc_setup$l = _sfc_main$l.setup;
_sfc_main$l.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/chantier/contacts/generalites.vue");
  return _sfc_setup$l ? _sfc_setup$l(props, ctx) : void 0;
};
const _sfc_main$k = {
  __name: "ChantierContactsTravaux",
  __ssrInlineRender: true,
  props: {
    chantier: {
      type: Object,
      required: true
    }
  },
  setup(__props) {
    const props = __props;
    const { upsertContactsTravaux } = useContacts();
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
    const { setLoader } = useLoader();
    const contactsTravaux = ref([]);
    const showEditTravaux = ref(false);
    const editFormTravaux = ref({
      rlt_voie_principale: null,
      rlt_voie_secondaire: [],
      rlt_ses_principale: null,
      rlt_ses_secondaire: [],
      rlt_cat_principale: null,
      rlt_cat_secondaire: [],
      kv_voie: [],
      kv_ses: [],
      kv_cat: [],
      preop_voie: null,
      preop_ses: null,
      logistique: null,
      supervisor: []
    });
    const userOptions = (users2) => {
      if (users2?.length > 0) {
        return users2.map((u) => ({
          id: u.id,
          label: u.prenom && u.nom ? `${u.prenom} ${u.nom}` : u.email
        }));
      }
      return [];
    };
    const getUserEmail = (userId) => {
      if (!userId) return null;
      const user = users.value.find((u) => u.id === userId);
      return user?.email || null;
    };
    const getUserName = (userId) => {
      if (!userId) return "-";
      const user = users.value.find((u) => u.id === userId);
      if (!user) return "-";
      return user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.email;
    };
    const openEditTravaux = () => {
      editFormTravaux.value = {
        rlt_voie_principale: contactsTravaux.value?.rlt_voie_principale || null,
        rlt_voie_secondaire: contactsTravaux.value?.rlt_voie_secondaire || [],
        rlt_ses_principale: contactsTravaux.value?.rlt_ses_principale || null,
        rlt_ses_secondaire: contactsTravaux.value?.rlt_ses_secondaire || [],
        rlt_cat_principale: contactsTravaux.value?.rlt_cat_principale || null,
        rlt_cat_secondaire: contactsTravaux.value?.rlt_cat_secondaire || [],
        kv_voie: contactsTravaux.value?.kv_voie || [],
        kv_ses: contactsTravaux.value?.kv_ses || [],
        kv_cat: contactsTravaux.value?.kv_cat || [],
        preop_voie: contactsTravaux.value?.preop_voie || null,
        preop_ses: contactsTravaux.value?.preop_ses || null,
        logistique: contactsTravaux.value?.logistique || null,
        supervisor: contactsTravaux.value?.supervisor || []
      };
      showEditTravaux.value = true;
    };
    const saveTravaux = async () => {
      setLoader(true);
      try {
        const result = await upsertContactsTravaux(props.chantier.id, editFormTravaux.value);
        if (result) {
          contactsTravaux.value = result;
          showEditTravaux.value = false;
        }
      } finally {
        setLoader(false);
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Icon = __nuxt_component_1;
      const _component_AppButtonValidated = _sfc_main$2$1;
      const _component_AppSlideOver = _sfc_main$1$1;
      const _component_AppSlideOverContent = _sfc_main$p;
      const _component_AppSelect = _sfc_main$q;
      const _component_AppSelectMultiple = __nuxt_component_6;
      _push(`<div${ssrRenderAttrs(_attrs)}><div class="space-y-6"><div class="flex items-center justify-between"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-600/20 text-gray-700">`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:hard-hat",
        size: "20"
      }, null, _parent));
      _push(`</div><div><h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">Équipe travaux</h2><p class="text-xs text-gray-500 dark:text-gray-400">RLT, Pré-op, Logistique et Superviseurs</p></div></div>`);
      _push(ssrRenderComponent(_component_AppButtonValidated, {
        type: "button",
        theme: "primary",
        onClick: openEditTravaux
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<span class="flex items-center gap-2"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:pencil",
              size: "16"
            }, null, _parent2, _scopeId));
            _push2(`<p class="hidden lg:block"${_scopeId}>Modifier</p></span>`);
          } else {
            return [
              createVNode("span", { class: "flex items-center gap-2" }, [
                createVNode(_component_Icon, {
                  name: "lucide:pencil",
                  size: "16"
                }),
                createVNode("p", { class: "hidden lg:block" }, "Modifier")
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="rounded-lg bg-white p-4 shadow-lg">`);
      if (unref(contactsTravaux) && (getUserName(unref(contactsTravaux)?.rlt_voie_principale) || getUserName(unref(contactsTravaux)?.rlt_ses_principale) || getUserName(unref(contactsTravaux)?.rlt_cat_principale) || getUserName(unref(contactsTravaux)?.preop_voie) || getUserName(unref(contactsTravaux)?.preop_ses) || getUserName(unref(contactsTravaux)?.logistique))) {
        _push(`<div class="mb-4"><p class="mb-2 text-base font-semibold tracking-wide text-gray-500 uppercase">équipe VOIE</p><table class="w-full text-left text-xs"><thead><tr class="bg-secondary-900/10 border-b border-gray-200"><th class="text-secondary-900 px-2 py-1.5 font-semibold">Fonction</th><th class="text-secondary-900 px-2 py-1.5 font-semibold">Nom</th><th class="text-secondary-900 px-2 py-1.5 font-semibold">Email</th></tr></thead><tbody>`);
        if (getUserName(unref(contactsTravaux)?.rlt_voie_principale)) {
          _push(`<tr class="border-b border-gray-100"><td class="px-2 py-1.5 font-bold text-gray-700">RLT Voie Principal</td><td class="px-2 py-1.5 text-gray-700">${ssrInterpolate(getUserName(unref(contactsTravaux).rlt_voie_principale))}</td><td class="px-2 py-1.5 text-gray-700">`);
          if (getUserEmail(unref(contactsTravaux).rlt_voie_principale)) {
            _push(`<a${ssrRenderAttr("href", `mailto:${getUserEmail(unref(contactsTravaux).rlt_voie_principale)}`)} class="hover:underline">${ssrInterpolate(getUserEmail(unref(contactsTravaux).rlt_voie_principale))}</a>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</td></tr>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--[-->`);
        ssrRenderList(unref(contactsTravaux)?.rlt_voie_secondaire, (user) => {
          _push(`<tr class="border-b border-gray-100"><td class="px-2 py-1.5 font-bold text-gray-700">RLT Voie Secondaire</td><td class="px-2 py-1.5 text-gray-700">${ssrInterpolate(getUserName(user))}</td><td class="px-2 py-1.5 text-gray-700">`);
          if (getUserEmail(user)) {
            _push(`<a${ssrRenderAttr("href", `mailto:${getUserEmail(user)}`)} class="hover:underline">${ssrInterpolate(getUserEmail(user))}</a>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</td></tr>`);
        });
        _push(`<!--]--><!--[-->`);
        ssrRenderList(unref(contactsTravaux)?.kv_voie, (user) => {
          _push(`<tr class="border-b border-gray-100"><td class="px-2 py-1.5 font-bold text-gray-700">Contrôleur Voie</td><td class="px-2 py-1.5 text-gray-700">${ssrInterpolate(getUserName(user))}</td><td class="px-2 py-1.5 text-gray-700">`);
          if (getUserEmail(user)) {
            _push(`<a${ssrRenderAttr("href", `mailto:${getUserEmail(user)}`)} class="hover:underline">${ssrInterpolate(getUserEmail(user))}</a>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</td></tr>`);
        });
        _push(`<!--]--></tbody></table></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(contactsTravaux) && (getUserName(unref(contactsTravaux)?.rlt_voie_principale) || getUserName(unref(contactsTravaux)?.rlt_ses_principale) || getUserName(unref(contactsTravaux)?.rlt_cat_principale) || getUserName(unref(contactsTravaux)?.preop_voie) || getUserName(unref(contactsTravaux)?.preop_ses) || getUserName(unref(contactsTravaux)?.logistique))) {
        _push(`<div class="mb-4"><p class="mb-2 pt-8 text-base font-semibold tracking-wide text-gray-500 uppercase">équipe SES</p><table class="w-full text-left text-xs"><thead><tr class="bg-secondary-900/10 border-b border-gray-200"><th class="text-secondary-900 px-2 py-1.5 font-semibold">Fonction</th><th class="text-secondary-900 px-2 py-1.5 font-semibold">Nom</th><th class="text-secondary-900 px-2 py-1.5 font-semibold">Email</th></tr></thead><tbody>`);
        if (getUserName(unref(contactsTravaux)?.rlt_ses_principale)) {
          _push(`<tr class="border-b border-gray-100"><td class="px-2 py-1.5 font-bold text-gray-700">RLT SES Principal</td><td class="px-2 py-1.5 text-gray-700">${ssrInterpolate(getUserName(unref(contactsTravaux).rlt_ses_principale))}</td><td class="px-2 py-1.5 text-gray-700">`);
          if (getUserEmail(unref(contactsTravaux).rlt_ses_principale)) {
            _push(`<a${ssrRenderAttr("href", `mailto:${getUserEmail(unref(contactsTravaux).rlt_ses_principale)}`)} class="hover:underline">${ssrInterpolate(getUserEmail(unref(contactsTravaux).rlt_ses_principale))}</a>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</td></tr>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--[-->`);
        ssrRenderList(unref(contactsTravaux)?.rlt_ses_secondaire, (user) => {
          _push(`<tr class="border-b border-gray-100"><td class="px-2 py-1.5 font-bold text-gray-700">RLT SES Secondaire</td><td class="px-2 py-1.5 text-gray-700">${ssrInterpolate(getUserName(user))}</td><td class="px-2 py-1.5 text-gray-700">`);
          if (getUserEmail(user)) {
            _push(`<a${ssrRenderAttr("href", `mailto:${getUserEmail(user)}`)} class="hover:underline">${ssrInterpolate(getUserEmail(user))}</a>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</td></tr>`);
        });
        _push(`<!--]--><!--[-->`);
        ssrRenderList(unref(contactsTravaux)?.kv_ses, (user) => {
          _push(`<tr class="border-b border-gray-100"><td class="px-2 py-1.5 font-bold text-gray-700">Contrôleur SES</td><td class="px-2 py-1.5 text-gray-700">${ssrInterpolate(getUserName(user))}</td><td class="px-2 py-1.5 text-gray-700">`);
          if (getUserEmail(user)) {
            _push(`<a${ssrRenderAttr("href", `mailto:${getUserEmail(user)}`)} class="hover:underline">${ssrInterpolate(getUserEmail(user))}</a>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</td></tr>`);
        });
        _push(`<!--]--></tbody></table></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(contactsTravaux) && (getUserName(unref(contactsTravaux)?.rlt_cat_principale) || getUserName(unref(contactsTravaux)?.rlt_cat_secondaire) || getUserName(unref(contactsTravaux)?.kv_cat))) {
        _push(`<div class="mb-4"><p class="mb-2 pt-8 text-base font-semibold tracking-wide text-gray-500 uppercase">équipe CAT</p><table class="w-full text-left text-xs"><thead><tr class="bg-secondary-900/10 border-b border-gray-200"><th class="text-secondary-900 px-2 py-1.5 font-semibold">Fonction</th><th class="text-secondary-900 px-2 py-1.5 font-semibold">Nom</th><th class="text-secondary-900 px-2 py-1.5 font-semibold">Email</th></tr></thead><tbody>`);
        if (getUserName(unref(contactsTravaux)?.rlt_cat_principale)) {
          _push(`<tr class="border-b border-gray-100"><td class="px-2 py-1.5 font-bold text-gray-700">RLT CAT Principal</td><td class="px-2 py-1.5 text-gray-700">${ssrInterpolate(getUserName(unref(contactsTravaux).rlt_cat_principale))}</td><td class="px-2 py-1.5 text-gray-700">`);
          if (getUserEmail(unref(contactsTravaux).rlt_cat_principale)) {
            _push(`<a${ssrRenderAttr("href", `mailto:${getUserEmail(unref(contactsTravaux).rlt_cat_principale)}`)} class="hover:underline">${ssrInterpolate(getUserEmail(unref(contactsTravaux).rlt_cat_principale))}</a>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</td></tr>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--[-->`);
        ssrRenderList(unref(contactsTravaux)?.rlt_cat_secondaire, (user) => {
          _push(`<tr class="border-b border-gray-100"><td class="px-2 py-1.5 font-bold text-gray-700">RLT CAT Secondaire</td><td class="px-2 py-1.5 text-gray-700">${ssrInterpolate(getUserName(user))}</td><td class="px-2 py-1.5 text-gray-700">`);
          if (getUserEmail(user)) {
            _push(`<a${ssrRenderAttr("href", `mailto:${getUserEmail(user)}`)} class="hover:underline">${ssrInterpolate(getUserEmail(user))}</a>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</td></tr>`);
        });
        _push(`<!--]--><!--[-->`);
        ssrRenderList(unref(contactsTravaux)?.kv_cat, (user) => {
          _push(`<tr class="border-b border-gray-100"><td class="px-2 py-1.5 font-bold text-gray-700">Contrôleur CAT</td><td class="px-2 py-1.5 text-gray-700">${ssrInterpolate(getUserName(user))}</td><td class="px-2 py-1.5 text-gray-700">`);
          if (getUserEmail(user)) {
            _push(`<a${ssrRenderAttr("href", `mailto:${getUserEmail(user)}`)} class="hover:underline">${ssrInterpolate(getUserEmail(user))}</a>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</td></tr>`);
        });
        _push(`<!--]--></tbody></table></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(contactsTravaux) && (getUserName(unref(contactsTravaux)?.preop_voie) || getUserName(unref(contactsTravaux)?.preop_ses) || getUserName(unref(contactsTravaux)?.logistique))) {
        _push(`<div class="mb-4"><p class="mb-2 pt-8 text-base font-semibold tracking-wide text-gray-500 uppercase">Cellule Pré-op</p><table class="w-full text-left text-xs"><thead><tr class="bg-secondary-900/10 border-b border-gray-200"><th class="text-secondary-900 px-2 py-1.5 font-semibold">Fonction</th><th class="text-secondary-900 px-2 py-1.5 font-semibold">Nom</th><th class="text-secondary-900 px-2 py-1.5 font-semibold">Email</th></tr></thead><tbody>`);
        if (getUserName(unref(contactsTravaux)?.preop_voie)) {
          _push(`<tr class="border-b border-gray-100"><td class="px-2 py-1.5 font-bold text-gray-700">Spécialité Voie</td><td class="px-2 py-1.5 text-gray-700">${ssrInterpolate(getUserName(unref(contactsTravaux).preop_voie))}</td><td class="px-2 py-1.5 text-gray-700">`);
          if (getUserEmail(unref(contactsTravaux).preop_voie)) {
            _push(`<a${ssrRenderAttr("href", `mailto:${getUserEmail(unref(contactsTravaux).preop_voie)}`)} class="hover:underline">${ssrInterpolate(getUserEmail(unref(contactsTravaux).preop_voie))}</a>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</td></tr>`);
        } else {
          _push(`<!---->`);
        }
        if (getUserName(unref(contactsTravaux)?.preop_ses)) {
          _push(`<tr class="border-b border-gray-100"><td class="px-2 py-1.5 font-bold text-gray-700">Spécialité SES</td><td class="px-2 py-1.5 text-gray-700">${ssrInterpolate(getUserName(unref(contactsTravaux).preop_ses))}</td><td class="px-2 py-1.5 text-gray-700">`);
          if (getUserEmail(unref(contactsTravaux).preop_ses)) {
            _push(`<a${ssrRenderAttr("href", `mailto:${getUserEmail(unref(contactsTravaux).preop_ses)}`)} class="hover:underline">${ssrInterpolate(getUserEmail(unref(contactsTravaux).preop_ses))}</a>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</td></tr>`);
        } else {
          _push(`<!---->`);
        }
        if (getUserName(unref(contactsTravaux)?.logistique)) {
          _push(`<tr class="border-b border-gray-100"><td class="px-2 py-1.5 font-bold text-gray-700">Spécialité Logistique</td><td class="px-2 py-1.5 text-gray-700">${ssrInterpolate(getUserName(unref(contactsTravaux).logistique))}</td><td class="px-2 py-1.5 text-gray-700">`);
          if (getUserEmail(unref(contactsTravaux).logistique)) {
            _push(`<a${ssrRenderAttr("href", `mailto:${getUserEmail(unref(contactsTravaux).logistique)}`)} class="hover:underline">${ssrInterpolate(getUserEmail(unref(contactsTravaux).logistique))}</a>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</td></tr>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</tbody></table></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(contactsTravaux) && getUserName(unref(contactsTravaux)?.supervisor)) {
        _push(`<div class="mb-4"><p class="mb-2 pt-8 text-base font-semibold tracking-wide text-gray-500 uppercase">Superviseurs</p><table class="w-full text-left text-xs"><thead><tr class="bg-secondary-900/10 border-b border-gray-200"><th class="text-secondary-900 px-2 py-1.5 font-semibold">Fonction</th><th class="text-secondary-900 px-2 py-1.5 font-semibold">Nom</th><th class="text-secondary-900 px-2 py-1.5 font-semibold">Email</th></tr></thead><tbody><!--[-->`);
        ssrRenderList(unref(contactsTravaux)?.supervisor, (user) => {
          _push(`<tr class="border-b border-gray-100"><td class="px-2 py-1.5 font-bold text-gray-700">Superviseur</td><td class="px-2 py-1.5 text-gray-700">${ssrInterpolate(getUserName(user))}</td><td class="px-2 py-1.5 text-gray-700">`);
          if (getUserEmail(user)) {
            _push(`<a${ssrRenderAttr("href", `mailto:${getUserEmail(user)}`)} class="hover:underline">${ssrInterpolate(getUserEmail(user))}</a>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</td></tr>`);
        });
        _push(`<!--]--></tbody></table></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
      _push(ssrRenderComponent(_component_AppSlideOver, {
        sideModal: unref(showEditTravaux),
        closeSideModal: () => showEditTravaux.value = false
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (unref(showEditTravaux)) {
              _push2(ssrRenderComponent(_component_AppSlideOverContent, {
                closeSideModal: () => showEditTravaux.value = false
              }, {
                header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<h2 class="font-[Pacifico] text-3xl text-gray-800 dark:text-white"${_scopeId2}>Équipe travaux</h2><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId2}>Modifier l&#39;équipe travaux du chantier</p>`);
                  } else {
                    return [
                      createVNode("h2", { class: "font-[Pacifico] text-3xl text-gray-800 dark:text-white" }, "Équipe travaux"),
                      createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, "Modifier l'équipe travaux du chantier")
                    ];
                  }
                }),
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<form class="space-y-6"${_scopeId2}><div class="space-y-4"${_scopeId2}><div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:train-track",
                      size: "16",
                      class: "text-gray-700"
                    }, null, _parent3, _scopeId2));
                    _push3(`<h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId2}> RLT Voie </h3></div>`);
                    _push3(ssrRenderComponent(_component_AppSelect, {
                      modelValue: unref(editFormTravaux).rlt_voie_principale,
                      "onUpdate:modelValue": ($event) => unref(editFormTravaux).rlt_voie_principale = $event,
                      options: userOptions(unref(getUsersRltVoie)),
                      title: "Principal",
                      placeholder: "Sélectionner...",
                      nullable: ""
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppSelectMultiple, {
                      modelValue: unref(editFormTravaux).rlt_voie_secondaire,
                      "onUpdate:modelValue": ($event) => unref(editFormTravaux).rlt_voie_secondaire = $event,
                      options: userOptions(unref(getUsersRltVoie)),
                      title: "Secondaire(s)",
                      placeholder: "Sélectionner un profil Voie"
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppSelectMultiple, {
                      modelValue: unref(editFormTravaux).kv_voie,
                      "onUpdate:modelValue": ($event) => unref(editFormTravaux).kv_voie = $event,
                      options: userOptions(unref(getUsersKvVoie)),
                      title: "Contrôleur(s)",
                      placeholder: "Sélectionner un profil Voie"
                    }, null, _parent3, _scopeId2));
                    _push3(`</div><div class="space-y-4"${_scopeId2}><div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:zap",
                      size: "16",
                      class: "text-gray-700"
                    }, null, _parent3, _scopeId2));
                    _push3(`<h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId2}>RLT SES</h3></div>`);
                    _push3(ssrRenderComponent(_component_AppSelect, {
                      modelValue: unref(editFormTravaux).rlt_ses_principale,
                      "onUpdate:modelValue": ($event) => unref(editFormTravaux).rlt_ses_principale = $event,
                      options: userOptions(unref(getUsersRltSes)),
                      title: "Principal",
                      placeholder: "Sélectionner...",
                      nullable: ""
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppSelectMultiple, {
                      modelValue: unref(editFormTravaux).rlt_ses_secondaire,
                      "onUpdate:modelValue": ($event) => unref(editFormTravaux).rlt_ses_secondaire = $event,
                      options: userOptions(unref(getUsersRltSes)),
                      title: "Secondaire(s)",
                      placeholder: "Sélectionner un profil SES"
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppSelectMultiple, {
                      modelValue: unref(editFormTravaux).kv_ses,
                      "onUpdate:modelValue": ($event) => unref(editFormTravaux).kv_ses = $event,
                      options: userOptions(unref(getUsersKvSes)),
                      title: "Contrôleur(s)",
                      placeholder: "Sélectionner un profil SES"
                    }, null, _parent3, _scopeId2));
                    _push3(`</div><div class="space-y-4"${_scopeId2}><div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:cable",
                      size: "16",
                      class: "text-gray-700"
                    }, null, _parent3, _scopeId2));
                    _push3(`<h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId2}>RLT CAT</h3></div>`);
                    _push3(ssrRenderComponent(_component_AppSelect, {
                      modelValue: unref(editFormTravaux).rlt_cat_principale,
                      "onUpdate:modelValue": ($event) => unref(editFormTravaux).rlt_cat_principale = $event,
                      options: userOptions(unref(getUsersRltCat)),
                      title: "Principal",
                      placeholder: "Sélectionner...",
                      nullable: ""
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppSelectMultiple, {
                      modelValue: unref(editFormTravaux).rlt_cat_secondaire,
                      "onUpdate:modelValue": ($event) => unref(editFormTravaux).rlt_cat_secondaire = $event,
                      options: userOptions(unref(getUsersRltCat)),
                      title: "Secondaire(s)",
                      placeholder: "Sélectionner un profil CAT"
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppSelectMultiple, {
                      modelValue: unref(editFormTravaux).kv_cat,
                      "onUpdate:modelValue": ($event) => unref(editFormTravaux).kv_cat = $event,
                      options: userOptions(unref(getUsersKvCat)),
                      title: "Contrôleur(s)",
                      placeholder: "Sélectionner un profil CAT"
                    }, null, _parent3, _scopeId2));
                    _push3(`</div><div class="space-y-4"${_scopeId2}><div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:clipboard-check",
                      size: "16",
                      class: "text-gray-700"
                    }, null, _parent3, _scopeId2));
                    _push3(`<h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId2}>Pré-op</h3></div><div class="grid grid-cols-2 gap-4"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_AppSelect, {
                      modelValue: unref(editFormTravaux).preop_voie,
                      "onUpdate:modelValue": ($event) => unref(editFormTravaux).preop_voie = $event,
                      options: userOptions(unref(getUsersPreopVoie)),
                      title: "Voie",
                      placeholder: "Sélectionner...",
                      nullable: ""
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppSelect, {
                      modelValue: unref(editFormTravaux).preop_ses,
                      "onUpdate:modelValue": ($event) => unref(editFormTravaux).preop_ses = $event,
                      options: userOptions(unref(getUsersPreopSes)),
                      title: "SES",
                      placeholder: "Sélectionner...",
                      nullable: ""
                    }, null, _parent3, _scopeId2));
                    _push3(`</div></div><div class="space-y-4"${_scopeId2}><div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:truck",
                      size: "16",
                      class: "text-gray-700"
                    }, null, _parent3, _scopeId2));
                    _push3(`<h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId2}> Logistique </h3></div>`);
                    _push3(ssrRenderComponent(_component_AppSelect, {
                      modelValue: unref(editFormTravaux).logistique,
                      "onUpdate:modelValue": ($event) => unref(editFormTravaux).logistique = $event,
                      options: userOptions(unref(getUsersLogistique)),
                      title: "Responsable logistique",
                      placeholder: "Sélectionner...",
                      nullable: ""
                    }, null, _parent3, _scopeId2));
                    _push3(`</div><div class="space-y-4"${_scopeId2}><div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:eye",
                      size: "16",
                      class: "text-gray-700"
                    }, null, _parent3, _scopeId2));
                    _push3(`<h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId2}> Superviseurs </h3></div>`);
                    _push3(ssrRenderComponent(_component_AppSelectMultiple, {
                      modelValue: unref(editFormTravaux).supervisor,
                      "onUpdate:modelValue": ($event) => unref(editFormTravaux).supervisor = $event,
                      options: userOptions(unref(getUsersRefRdu)),
                      title: "Superviseurs",
                      placeholder: "Sélectionner un superviseur"
                    }, null, _parent3, _scopeId2));
                    _push3(`</div></form>`);
                  } else {
                    return [
                      createVNode("form", {
                        onSubmit: withModifiers(saveTravaux, ["prevent"]),
                        class: "space-y-6"
                      }, [
                        createVNode("div", { class: "space-y-4" }, [
                          createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                            createVNode(_component_Icon, {
                              name: "lucide:train-track",
                              size: "16",
                              class: "text-gray-700"
                            }),
                            createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " RLT Voie ")
                          ]),
                          createVNode(_component_AppSelect, {
                            modelValue: unref(editFormTravaux).rlt_voie_principale,
                            "onUpdate:modelValue": ($event) => unref(editFormTravaux).rlt_voie_principale = $event,
                            options: userOptions(unref(getUsersRltVoie)),
                            title: "Principal",
                            placeholder: "Sélectionner...",
                            nullable: ""
                          }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                          createVNode(_component_AppSelectMultiple, {
                            modelValue: unref(editFormTravaux).rlt_voie_secondaire,
                            "onUpdate:modelValue": ($event) => unref(editFormTravaux).rlt_voie_secondaire = $event,
                            options: userOptions(unref(getUsersRltVoie)),
                            title: "Secondaire(s)",
                            placeholder: "Sélectionner un profil Voie"
                          }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                          createVNode(_component_AppSelectMultiple, {
                            modelValue: unref(editFormTravaux).kv_voie,
                            "onUpdate:modelValue": ($event) => unref(editFormTravaux).kv_voie = $event,
                            options: userOptions(unref(getUsersKvVoie)),
                            title: "Contrôleur(s)",
                            placeholder: "Sélectionner un profil Voie"
                          }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                        ]),
                        createVNode("div", { class: "space-y-4" }, [
                          createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                            createVNode(_component_Icon, {
                              name: "lucide:zap",
                              size: "16",
                              class: "text-gray-700"
                            }),
                            createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, "RLT SES")
                          ]),
                          createVNode(_component_AppSelect, {
                            modelValue: unref(editFormTravaux).rlt_ses_principale,
                            "onUpdate:modelValue": ($event) => unref(editFormTravaux).rlt_ses_principale = $event,
                            options: userOptions(unref(getUsersRltSes)),
                            title: "Principal",
                            placeholder: "Sélectionner...",
                            nullable: ""
                          }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                          createVNode(_component_AppSelectMultiple, {
                            modelValue: unref(editFormTravaux).rlt_ses_secondaire,
                            "onUpdate:modelValue": ($event) => unref(editFormTravaux).rlt_ses_secondaire = $event,
                            options: userOptions(unref(getUsersRltSes)),
                            title: "Secondaire(s)",
                            placeholder: "Sélectionner un profil SES"
                          }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                          createVNode(_component_AppSelectMultiple, {
                            modelValue: unref(editFormTravaux).kv_ses,
                            "onUpdate:modelValue": ($event) => unref(editFormTravaux).kv_ses = $event,
                            options: userOptions(unref(getUsersKvSes)),
                            title: "Contrôleur(s)",
                            placeholder: "Sélectionner un profil SES"
                          }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                        ]),
                        createVNode("div", { class: "space-y-4" }, [
                          createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                            createVNode(_component_Icon, {
                              name: "lucide:cable",
                              size: "16",
                              class: "text-gray-700"
                            }),
                            createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, "RLT CAT")
                          ]),
                          createVNode(_component_AppSelect, {
                            modelValue: unref(editFormTravaux).rlt_cat_principale,
                            "onUpdate:modelValue": ($event) => unref(editFormTravaux).rlt_cat_principale = $event,
                            options: userOptions(unref(getUsersRltCat)),
                            title: "Principal",
                            placeholder: "Sélectionner...",
                            nullable: ""
                          }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                          createVNode(_component_AppSelectMultiple, {
                            modelValue: unref(editFormTravaux).rlt_cat_secondaire,
                            "onUpdate:modelValue": ($event) => unref(editFormTravaux).rlt_cat_secondaire = $event,
                            options: userOptions(unref(getUsersRltCat)),
                            title: "Secondaire(s)",
                            placeholder: "Sélectionner un profil CAT"
                          }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                          createVNode(_component_AppSelectMultiple, {
                            modelValue: unref(editFormTravaux).kv_cat,
                            "onUpdate:modelValue": ($event) => unref(editFormTravaux).kv_cat = $event,
                            options: userOptions(unref(getUsersKvCat)),
                            title: "Contrôleur(s)",
                            placeholder: "Sélectionner un profil CAT"
                          }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                        ]),
                        createVNode("div", { class: "space-y-4" }, [
                          createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                            createVNode(_component_Icon, {
                              name: "lucide:clipboard-check",
                              size: "16",
                              class: "text-gray-700"
                            }),
                            createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, "Pré-op")
                          ]),
                          createVNode("div", { class: "grid grid-cols-2 gap-4" }, [
                            createVNode(_component_AppSelect, {
                              modelValue: unref(editFormTravaux).preop_voie,
                              "onUpdate:modelValue": ($event) => unref(editFormTravaux).preop_voie = $event,
                              options: userOptions(unref(getUsersPreopVoie)),
                              title: "Voie",
                              placeholder: "Sélectionner...",
                              nullable: ""
                            }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                            createVNode(_component_AppSelect, {
                              modelValue: unref(editFormTravaux).preop_ses,
                              "onUpdate:modelValue": ($event) => unref(editFormTravaux).preop_ses = $event,
                              options: userOptions(unref(getUsersPreopSes)),
                              title: "SES",
                              placeholder: "Sélectionner...",
                              nullable: ""
                            }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                          ])
                        ]),
                        createVNode("div", { class: "space-y-4" }, [
                          createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                            createVNode(_component_Icon, {
                              name: "lucide:truck",
                              size: "16",
                              class: "text-gray-700"
                            }),
                            createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " Logistique ")
                          ]),
                          createVNode(_component_AppSelect, {
                            modelValue: unref(editFormTravaux).logistique,
                            "onUpdate:modelValue": ($event) => unref(editFormTravaux).logistique = $event,
                            options: userOptions(unref(getUsersLogistique)),
                            title: "Responsable logistique",
                            placeholder: "Sélectionner...",
                            nullable: ""
                          }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                        ]),
                        createVNode("div", { class: "space-y-4" }, [
                          createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                            createVNode(_component_Icon, {
                              name: "lucide:eye",
                              size: "16",
                              class: "text-gray-700"
                            }),
                            createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " Superviseurs ")
                          ]),
                          createVNode(_component_AppSelectMultiple, {
                            modelValue: unref(editFormTravaux).supervisor,
                            "onUpdate:modelValue": ($event) => unref(editFormTravaux).supervisor = $event,
                            options: userOptions(unref(getUsersRefRdu)),
                            title: "Superviseurs",
                            placeholder: "Sélectionner un superviseur"
                          }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                        ])
                      ], 32)
                    ];
                  }
                }),
                footer: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_AppButtonValidated, {
                      theme: "cancel",
                      type: "button",
                      onClick: ($event) => showEditTravaux.value = false
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`Annuler`);
                        } else {
                          return [
                            createTextVNode("Annuler")
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppButtonValidated, {
                      theme: "primary",
                      type: "button",
                      onClick: saveTravaux
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`Enregistrer`);
                        } else {
                          return [
                            createTextVNode("Enregistrer")
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(`</div>`);
                  } else {
                    return [
                      createVNode("div", { class: "flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700" }, [
                        createVNode(_component_AppButtonValidated, {
                          theme: "cancel",
                          type: "button",
                          onClick: ($event) => showEditTravaux.value = false
                        }, {
                          default: withCtx(() => [
                            createTextVNode("Annuler")
                          ]),
                          _: 1
                        }, 8, ["onClick"]),
                        createVNode(_component_AppButtonValidated, {
                          theme: "primary",
                          type: "button",
                          onClick: saveTravaux
                        }, {
                          default: withCtx(() => [
                            createTextVNode("Enregistrer")
                          ]),
                          _: 1
                        })
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
              unref(showEditTravaux) ? (openBlock(), createBlock(_component_AppSlideOverContent, {
                key: 0,
                closeSideModal: () => showEditTravaux.value = false
              }, {
                header: withCtx(() => [
                  createVNode("h2", { class: "font-[Pacifico] text-3xl text-gray-800 dark:text-white" }, "Équipe travaux"),
                  createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, "Modifier l'équipe travaux du chantier")
                ]),
                default: withCtx(() => [
                  createVNode("form", {
                    onSubmit: withModifiers(saveTravaux, ["prevent"]),
                    class: "space-y-6"
                  }, [
                    createVNode("div", { class: "space-y-4" }, [
                      createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                        createVNode(_component_Icon, {
                          name: "lucide:train-track",
                          size: "16",
                          class: "text-gray-700"
                        }),
                        createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " RLT Voie ")
                      ]),
                      createVNode(_component_AppSelect, {
                        modelValue: unref(editFormTravaux).rlt_voie_principale,
                        "onUpdate:modelValue": ($event) => unref(editFormTravaux).rlt_voie_principale = $event,
                        options: userOptions(unref(getUsersRltVoie)),
                        title: "Principal",
                        placeholder: "Sélectionner...",
                        nullable: ""
                      }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                      createVNode(_component_AppSelectMultiple, {
                        modelValue: unref(editFormTravaux).rlt_voie_secondaire,
                        "onUpdate:modelValue": ($event) => unref(editFormTravaux).rlt_voie_secondaire = $event,
                        options: userOptions(unref(getUsersRltVoie)),
                        title: "Secondaire(s)",
                        placeholder: "Sélectionner un profil Voie"
                      }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                      createVNode(_component_AppSelectMultiple, {
                        modelValue: unref(editFormTravaux).kv_voie,
                        "onUpdate:modelValue": ($event) => unref(editFormTravaux).kv_voie = $event,
                        options: userOptions(unref(getUsersKvVoie)),
                        title: "Contrôleur(s)",
                        placeholder: "Sélectionner un profil Voie"
                      }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                    ]),
                    createVNode("div", { class: "space-y-4" }, [
                      createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                        createVNode(_component_Icon, {
                          name: "lucide:zap",
                          size: "16",
                          class: "text-gray-700"
                        }),
                        createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, "RLT SES")
                      ]),
                      createVNode(_component_AppSelect, {
                        modelValue: unref(editFormTravaux).rlt_ses_principale,
                        "onUpdate:modelValue": ($event) => unref(editFormTravaux).rlt_ses_principale = $event,
                        options: userOptions(unref(getUsersRltSes)),
                        title: "Principal",
                        placeholder: "Sélectionner...",
                        nullable: ""
                      }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                      createVNode(_component_AppSelectMultiple, {
                        modelValue: unref(editFormTravaux).rlt_ses_secondaire,
                        "onUpdate:modelValue": ($event) => unref(editFormTravaux).rlt_ses_secondaire = $event,
                        options: userOptions(unref(getUsersRltSes)),
                        title: "Secondaire(s)",
                        placeholder: "Sélectionner un profil SES"
                      }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                      createVNode(_component_AppSelectMultiple, {
                        modelValue: unref(editFormTravaux).kv_ses,
                        "onUpdate:modelValue": ($event) => unref(editFormTravaux).kv_ses = $event,
                        options: userOptions(unref(getUsersKvSes)),
                        title: "Contrôleur(s)",
                        placeholder: "Sélectionner un profil SES"
                      }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                    ]),
                    createVNode("div", { class: "space-y-4" }, [
                      createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                        createVNode(_component_Icon, {
                          name: "lucide:cable",
                          size: "16",
                          class: "text-gray-700"
                        }),
                        createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, "RLT CAT")
                      ]),
                      createVNode(_component_AppSelect, {
                        modelValue: unref(editFormTravaux).rlt_cat_principale,
                        "onUpdate:modelValue": ($event) => unref(editFormTravaux).rlt_cat_principale = $event,
                        options: userOptions(unref(getUsersRltCat)),
                        title: "Principal",
                        placeholder: "Sélectionner...",
                        nullable: ""
                      }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                      createVNode(_component_AppSelectMultiple, {
                        modelValue: unref(editFormTravaux).rlt_cat_secondaire,
                        "onUpdate:modelValue": ($event) => unref(editFormTravaux).rlt_cat_secondaire = $event,
                        options: userOptions(unref(getUsersRltCat)),
                        title: "Secondaire(s)",
                        placeholder: "Sélectionner un profil CAT"
                      }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                      createVNode(_component_AppSelectMultiple, {
                        modelValue: unref(editFormTravaux).kv_cat,
                        "onUpdate:modelValue": ($event) => unref(editFormTravaux).kv_cat = $event,
                        options: userOptions(unref(getUsersKvCat)),
                        title: "Contrôleur(s)",
                        placeholder: "Sélectionner un profil CAT"
                      }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                    ]),
                    createVNode("div", { class: "space-y-4" }, [
                      createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                        createVNode(_component_Icon, {
                          name: "lucide:clipboard-check",
                          size: "16",
                          class: "text-gray-700"
                        }),
                        createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, "Pré-op")
                      ]),
                      createVNode("div", { class: "grid grid-cols-2 gap-4" }, [
                        createVNode(_component_AppSelect, {
                          modelValue: unref(editFormTravaux).preop_voie,
                          "onUpdate:modelValue": ($event) => unref(editFormTravaux).preop_voie = $event,
                          options: userOptions(unref(getUsersPreopVoie)),
                          title: "Voie",
                          placeholder: "Sélectionner...",
                          nullable: ""
                        }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                        createVNode(_component_AppSelect, {
                          modelValue: unref(editFormTravaux).preop_ses,
                          "onUpdate:modelValue": ($event) => unref(editFormTravaux).preop_ses = $event,
                          options: userOptions(unref(getUsersPreopSes)),
                          title: "SES",
                          placeholder: "Sélectionner...",
                          nullable: ""
                        }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                      ])
                    ]),
                    createVNode("div", { class: "space-y-4" }, [
                      createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                        createVNode(_component_Icon, {
                          name: "lucide:truck",
                          size: "16",
                          class: "text-gray-700"
                        }),
                        createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " Logistique ")
                      ]),
                      createVNode(_component_AppSelect, {
                        modelValue: unref(editFormTravaux).logistique,
                        "onUpdate:modelValue": ($event) => unref(editFormTravaux).logistique = $event,
                        options: userOptions(unref(getUsersLogistique)),
                        title: "Responsable logistique",
                        placeholder: "Sélectionner...",
                        nullable: ""
                      }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                    ]),
                    createVNode("div", { class: "space-y-4" }, [
                      createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                        createVNode(_component_Icon, {
                          name: "lucide:eye",
                          size: "16",
                          class: "text-gray-700"
                        }),
                        createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " Superviseurs ")
                      ]),
                      createVNode(_component_AppSelectMultiple, {
                        modelValue: unref(editFormTravaux).supervisor,
                        "onUpdate:modelValue": ($event) => unref(editFormTravaux).supervisor = $event,
                        options: userOptions(unref(getUsersRefRdu)),
                        title: "Superviseurs",
                        placeholder: "Sélectionner un superviseur"
                      }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                    ])
                  ], 32)
                ]),
                footer: withCtx(() => [
                  createVNode("div", { class: "flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700" }, [
                    createVNode(_component_AppButtonValidated, {
                      theme: "cancel",
                      type: "button",
                      onClick: ($event) => showEditTravaux.value = false
                    }, {
                      default: withCtx(() => [
                        createTextVNode("Annuler")
                      ]),
                      _: 1
                    }, 8, ["onClick"]),
                    createVNode(_component_AppButtonValidated, {
                      theme: "primary",
                      type: "button",
                      onClick: saveTravaux
                    }, {
                      default: withCtx(() => [
                        createTextVNode("Enregistrer")
                      ]),
                      _: 1
                    })
                  ])
                ]),
                _: 1
              }, 8, ["closeSideModal"])) : createCommentVNode("", true)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
    };
  }
};
const _sfc_setup$k = _sfc_main$k.setup;
_sfc_main$k.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/chantier/contacts/travaux.vue");
  return _sfc_setup$k ? _sfc_setup$k(props, ctx) : void 0;
};
const _sfc_main$j = {
  __name: "ChantierContactsEntreprises",
  __ssrInlineRender: true,
  props: {
    chantier: {
      type: Object,
      required: true
    }
  },
  setup(__props) {
    const props = __props;
    const { getContactsEntreprises, addContactEntreprise, updateContactEntreprise } = useContacts();
    useUsers();
    const { setLoader } = useLoader();
    const contactsEntreprises = ref([]);
    const showAddEntreprise = ref(false);
    const showEditEntreprise = ref(false);
    const editFormEntreprise = ref({
      id: null,
      metier: "",
      entreprise: "",
      responsable_nom: "",
      responsable_email: ""
    });
    const openAddEntreprise = () => {
      editFormEntreprise.value = {
        id: null,
        metier: "",
        entreprise: "",
        responsable_nom: "",
        responsable_email: ""
      };
      showAddEntreprise.value = true;
    };
    const saveEntreprise = async () => {
      setLoader(true);
      try {
        let result;
        if (editFormEntreprise.value.id) {
          result = await updateContactEntreprise(editFormEntreprise.value.id, editFormEntreprise.value);
        } else {
          result = await addContactEntreprise(props.chantier.id, editFormEntreprise.value);
        }
        if (result) {
          contactsEntreprises.value = await getContactsEntreprises(props.chantier.id);
          showAddEntreprise.value = false;
          showEditEntreprise.value = false;
        }
      } finally {
        setLoader(false);
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Icon = __nuxt_component_1;
      const _component_AppButtonValidated = _sfc_main$2$1;
      const _component_AppSlideOver = _sfc_main$1$1;
      const _component_AppSlideOverContent = _sfc_main$p;
      const _component_AppInput = _sfc_main$1$2;
      _push(`<div${ssrRenderAttrs(_attrs)}><div class="space-y-6"><div class="flex items-center justify-between"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-600/20 text-gray-700">`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:building-2",
        size: "20"
      }, null, _parent));
      _push(`</div><div><h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">Entreprises</h2><p class="text-xs text-gray-500 dark:text-gray-400">Entreprises intervenantes sur le chantier</p></div></div>`);
      _push(ssrRenderComponent(_component_AppButtonValidated, {
        type: "button",
        theme: "primary",
        onClick: openAddEntreprise
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<span class="flex items-center gap-2"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:plus",
              size: "16"
            }, null, _parent2, _scopeId));
            _push2(`<p class="hidden lg:block"${_scopeId}>Ajouter</p></span>`);
          } else {
            return [
              createVNode("span", { class: "flex items-center gap-2" }, [
                createVNode(_component_Icon, {
                  name: "lucide:plus",
                  size: "16"
                }),
                createVNode("p", { class: "hidden lg:block" }, "Ajouter")
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
      if (unref(contactsEntreprises).length > 0) {
        _push(`<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"><!--[-->`);
        ssrRenderList(unref(contactsEntreprises), (contact) => {
          _push(`<div class="hover:border-secondary-900 dark:hover:border-secondary-900 rounded-lg border border-gray-200 bg-white p-4 shadow-lg transition-colors dark:border-gray-600 dark:bg-gray-700/50"><div class="flex items-start justify-between"><div class="flex-1"><div class="mb-2 flex items-center gap-2"><span class="border-secondary-900 bg-secondary-800/20 text-secondary-900 dark:bg-secondary-900/40 dark:text-secondary-900 rounded-lg border px-2 py-0.5 text-xs font-medium">${ssrInterpolate(contact.metier || "Non défini")}</span></div><p class="text-lg font-bold text-gray-900 dark:text-white">${ssrInterpolate(contact.entreprise || "-")}</p><div class="mt-2 space-y-1"><p class="text-sm text-gray-600 dark:text-gray-300"><span class="text-gray-400">Responsable:</span> ${ssrInterpolate(contact.responsable_nom || "-")}</p>`);
          if (contact.responsable_email) {
            _push(`<a${ssrRenderAttr("href", `mailto:${contact.responsable_email}`)} class="text-primary-600 dark:text-primary-400 flex items-center gap-1 text-sm hover:underline">`);
            _push(ssrRenderComponent(_component_Icon, {
              name: "lucide:mail",
              size: "14"
            }, null, _parent));
            _push(` ${ssrInterpolate(contact.responsable_email)}</a>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div><div class="flex items-center gap-2"><button class="hover:text-primary-600 flex items-center justify-center rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-200 dark:hover:bg-gray-600">`);
          _push(ssrRenderComponent(_component_Icon, {
            name: "lucide:pencil",
            size: "16"
          }, null, _parent));
          _push(`</button><button class="flex items-center justify-center rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30">`);
          _push(ssrRenderComponent(_component_Icon, {
            name: "lucide:trash-2",
            size: "16"
          }, null, _parent));
          _push(`</button></div></div></div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<div class="flex flex-col items-center justify-center rounded-lg bg-white p-4 py-12 text-gray-400 shadow-lg dark:text-gray-500">`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:building-2",
          size: "48",
          class: "mb-4 opacity-50"
        }, null, _parent));
        _push(`<p class="text-lg font-medium">Aucune entreprise</p><p class="text-sm">Cliquez sur &quot;Ajouter&quot; pour créer un contact</p></div>`);
      }
      _push(`</div>`);
      _push(ssrRenderComponent(_component_AppSlideOver, {
        sideModal: unref(showAddEntreprise) || unref(showEditEntreprise),
        closeSideModal: () => {
          showAddEntreprise.value = false;
          showEditEntreprise.value = false;
        }
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (unref(showAddEntreprise) || unref(showEditEntreprise)) {
              _push2(ssrRenderComponent(_component_AppSlideOverContent, {
                closeSideModal: () => {
                  showAddEntreprise.value = false;
                  showEditEntreprise.value = false;
                }
              }, {
                header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<h2 class="font-[Pacifico] text-3xl text-gray-800 dark:text-white"${_scopeId2}>${ssrInterpolate(unref(editFormEntreprise).id ? "Modifier" : "Ajouter")} une entreprise </h2><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId2}>Informations de l&#39;entreprise intervenante</p>`);
                  } else {
                    return [
                      createVNode("h2", { class: "font-[Pacifico] text-3xl text-gray-800 dark:text-white" }, toDisplayString(unref(editFormEntreprise).id ? "Modifier" : "Ajouter") + " une entreprise ", 1),
                      createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, "Informations de l'entreprise intervenante")
                    ];
                  }
                }),
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<form class="space-y-4"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_AppInput, {
                      modelValue: unref(editFormEntreprise).metier,
                      "onUpdate:modelValue": ($event) => unref(editFormEntreprise).metier = $event,
                      name: "metier",
                      title: "Métier / Spécialité",
                      placeholder: "Ex: Électricité, Terrassement..."
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppInput, {
                      modelValue: unref(editFormEntreprise).entreprise,
                      "onUpdate:modelValue": ($event) => unref(editFormEntreprise).entreprise = $event,
                      name: "entreprise",
                      title: "Nom de l'entreprise",
                      placeholder: "Nom de l'entreprise"
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppInput, {
                      modelValue: unref(editFormEntreprise).responsable_nom,
                      "onUpdate:modelValue": ($event) => unref(editFormEntreprise).responsable_nom = $event,
                      name: "responsable_nom",
                      title: "Nom du responsable",
                      placeholder: "Nom du contact"
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppInput, {
                      modelValue: unref(editFormEntreprise).responsable_email,
                      "onUpdate:modelValue": ($event) => unref(editFormEntreprise).responsable_email = $event,
                      name: "responsable_email",
                      title: "Email",
                      type: "email",
                      placeholder: "email@exemple.com"
                    }, null, _parent3, _scopeId2));
                    _push3(`</form>`);
                  } else {
                    return [
                      createVNode("form", {
                        onSubmit: withModifiers(saveEntreprise, ["prevent"]),
                        class: "space-y-4"
                      }, [
                        createVNode(_component_AppInput, {
                          modelValue: unref(editFormEntreprise).metier,
                          "onUpdate:modelValue": ($event) => unref(editFormEntreprise).metier = $event,
                          name: "metier",
                          title: "Métier / Spécialité",
                          placeholder: "Ex: Électricité, Terrassement..."
                        }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                        createVNode(_component_AppInput, {
                          modelValue: unref(editFormEntreprise).entreprise,
                          "onUpdate:modelValue": ($event) => unref(editFormEntreprise).entreprise = $event,
                          name: "entreprise",
                          title: "Nom de l'entreprise",
                          placeholder: "Nom de l'entreprise"
                        }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                        createVNode(_component_AppInput, {
                          modelValue: unref(editFormEntreprise).responsable_nom,
                          "onUpdate:modelValue": ($event) => unref(editFormEntreprise).responsable_nom = $event,
                          name: "responsable_nom",
                          title: "Nom du responsable",
                          placeholder: "Nom du contact"
                        }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                        createVNode(_component_AppInput, {
                          modelValue: unref(editFormEntreprise).responsable_email,
                          "onUpdate:modelValue": ($event) => unref(editFormEntreprise).responsable_email = $event,
                          name: "responsable_email",
                          title: "Email",
                          type: "email",
                          placeholder: "email@exemple.com"
                        }, null, 8, ["modelValue", "onUpdate:modelValue"])
                      ], 32)
                    ];
                  }
                }),
                footer: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_AppButtonValidated, {
                      theme: "cancel",
                      type: "button",
                      onClick: ($event) => (showAddEntreprise.value = false, showEditEntreprise.value = false)
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`Annuler`);
                        } else {
                          return [
                            createTextVNode("Annuler")
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppButtonValidated, {
                      theme: "primary",
                      type: "button",
                      onClick: saveEntreprise
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`${ssrInterpolate(unref(editFormEntreprise).id ? "Modifier" : "Ajouter")}`);
                        } else {
                          return [
                            createTextVNode(toDisplayString(unref(editFormEntreprise).id ? "Modifier" : "Ajouter"), 1)
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(`</div>`);
                  } else {
                    return [
                      createVNode("div", { class: "flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700" }, [
                        createVNode(_component_AppButtonValidated, {
                          theme: "cancel",
                          type: "button",
                          onClick: ($event) => (showAddEntreprise.value = false, showEditEntreprise.value = false)
                        }, {
                          default: withCtx(() => [
                            createTextVNode("Annuler")
                          ]),
                          _: 1
                        }, 8, ["onClick"]),
                        createVNode(_component_AppButtonValidated, {
                          theme: "primary",
                          type: "button",
                          onClick: saveEntreprise
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(editFormEntreprise).id ? "Modifier" : "Ajouter"), 1)
                          ]),
                          _: 1
                        })
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
              unref(showAddEntreprise) || unref(showEditEntreprise) ? (openBlock(), createBlock(_component_AppSlideOverContent, {
                key: 0,
                closeSideModal: () => {
                  showAddEntreprise.value = false;
                  showEditEntreprise.value = false;
                }
              }, {
                header: withCtx(() => [
                  createVNode("h2", { class: "font-[Pacifico] text-3xl text-gray-800 dark:text-white" }, toDisplayString(unref(editFormEntreprise).id ? "Modifier" : "Ajouter") + " une entreprise ", 1),
                  createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, "Informations de l'entreprise intervenante")
                ]),
                default: withCtx(() => [
                  createVNode("form", {
                    onSubmit: withModifiers(saveEntreprise, ["prevent"]),
                    class: "space-y-4"
                  }, [
                    createVNode(_component_AppInput, {
                      modelValue: unref(editFormEntreprise).metier,
                      "onUpdate:modelValue": ($event) => unref(editFormEntreprise).metier = $event,
                      name: "metier",
                      title: "Métier / Spécialité",
                      placeholder: "Ex: Électricité, Terrassement..."
                    }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                    createVNode(_component_AppInput, {
                      modelValue: unref(editFormEntreprise).entreprise,
                      "onUpdate:modelValue": ($event) => unref(editFormEntreprise).entreprise = $event,
                      name: "entreprise",
                      title: "Nom de l'entreprise",
                      placeholder: "Nom de l'entreprise"
                    }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                    createVNode(_component_AppInput, {
                      modelValue: unref(editFormEntreprise).responsable_nom,
                      "onUpdate:modelValue": ($event) => unref(editFormEntreprise).responsable_nom = $event,
                      name: "responsable_nom",
                      title: "Nom du responsable",
                      placeholder: "Nom du contact"
                    }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                    createVNode(_component_AppInput, {
                      modelValue: unref(editFormEntreprise).responsable_email,
                      "onUpdate:modelValue": ($event) => unref(editFormEntreprise).responsable_email = $event,
                      name: "responsable_email",
                      title: "Email",
                      type: "email",
                      placeholder: "email@exemple.com"
                    }, null, 8, ["modelValue", "onUpdate:modelValue"])
                  ], 32)
                ]),
                footer: withCtx(() => [
                  createVNode("div", { class: "flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700" }, [
                    createVNode(_component_AppButtonValidated, {
                      theme: "cancel",
                      type: "button",
                      onClick: ($event) => (showAddEntreprise.value = false, showEditEntreprise.value = false)
                    }, {
                      default: withCtx(() => [
                        createTextVNode("Annuler")
                      ]),
                      _: 1
                    }, 8, ["onClick"]),
                    createVNode(_component_AppButtonValidated, {
                      theme: "primary",
                      type: "button",
                      onClick: saveEntreprise
                    }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(unref(editFormEntreprise).id ? "Modifier" : "Ajouter"), 1)
                      ]),
                      _: 1
                    })
                  ])
                ]),
                _: 1
              }, 8, ["closeSideModal"])) : createCommentVNode("", true)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
    };
  }
};
const _sfc_setup$j = _sfc_main$j.setup;
_sfc_main$j.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/chantier/contacts/entreprises.vue");
  return _sfc_setup$j ? _sfc_setup$j(props, ctx) : void 0;
};
const _sfc_main$i = {
  __name: "ChantierContactsEtudes",
  __ssrInlineRender: true,
  props: {
    chantier: {
      type: Object,
      required: true
    }
  },
  setup(__props) {
    const props = __props;
    const { upsertContactsEtudes } = useContacts();
    useUsers();
    const { setLoader } = useLoader();
    const contactsEtudes = ref([]);
    const showEditEtudes = ref(false);
    const editFormEtudes = ref({
      plan_technique_nom: "",
      plan_technique_email: "",
      documents_execution_nom: "",
      documents_execution_email: ""
    });
    const openEditEtudes = () => {
      editFormEtudes.value = {
        plan_technique_nom: contactsEtudes.value?.plan_technique_nom || "",
        plan_technique_email: contactsEtudes.value?.plan_technique_email || "",
        documents_execution_nom: contactsEtudes.value?.documents_execution_nom || "",
        documents_execution_email: contactsEtudes.value?.documents_execution_email || ""
      };
      showEditEtudes.value = true;
    };
    const saveEtudes = async () => {
      setLoader(true);
      try {
        const result = await upsertContactsEtudes(props.chantier.id, editFormEtudes.value);
        if (result) {
          contactsEtudes.value = result;
          showEditEtudes.value = false;
        }
      } finally {
        setLoader(false);
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Icon = __nuxt_component_1;
      const _component_AppButtonValidated = _sfc_main$2$1;
      const _component_AppSlideOver = _sfc_main$1$1;
      const _component_AppSlideOverContent = _sfc_main$p;
      const _component_AppInput = _sfc_main$1$2;
      _push(`<div${ssrRenderAttrs(_attrs)}><div class="space-y-6"><div class="flex items-center justify-between"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-600/20 text-gray-700">`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:book-open",
        size: "20"
      }, null, _parent));
      _push(`</div><div><h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">Contacts études</h2><p class="text-xs text-gray-500 dark:text-gray-400">Plans techniques et documents d&#39;exécution</p></div></div>`);
      _push(ssrRenderComponent(_component_AppButtonValidated, {
        type: "button",
        theme: "primary",
        onClick: openEditEtudes
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<span class="flex items-center gap-2"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:pencil",
              size: "16"
            }, null, _parent2, _scopeId));
            _push2(`<p class="hidden lg:block"${_scopeId}>Modifier</p></span>`);
          } else {
            return [
              createVNode("span", { class: "flex items-center gap-2" }, [
                createVNode(_component_Icon, {
                  name: "lucide:pencil",
                  size: "16"
                }),
                createVNode("p", { class: "hidden lg:block" }, "Modifier")
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="grid grid-cols-1 gap-4 md:grid-cols-2"><div class="rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-600 dark:bg-gray-700/50"><div class="mb-3 flex items-center gap-2">`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:file-text",
        size: "16",
        class: "text-secondary-900"
      }, null, _parent));
      _push(`<label class="text-secondary-900 text-xs font-semibold tracking-wider uppercase">Plans techniques</label></div><p class="text-base font-semibold text-gray-900 dark:text-white">${ssrInterpolate(unref(contactsEtudes)?.plan_technique_nom || "-")}</p>`);
      if (unref(contactsEtudes)?.plan_technique_email) {
        _push(`<a${ssrRenderAttr("href", `mailto:${unref(contactsEtudes).plan_technique_email}`)} class="text-secondary-900 mt-1 flex items-center gap-1 text-sm hover:underline">`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:mail",
          size: "14"
        }, null, _parent));
        _push(` ${ssrInterpolate(unref(contactsEtudes).plan_technique_email)}</a>`);
      } else {
        _push(`<p class="text-sm text-gray-400">Aucun email</p>`);
      }
      _push(`</div><div class="rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-600 dark:bg-gray-700/50"><div class="mb-3 flex items-center gap-2">`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:folder-open",
        size: "16",
        class: "text-primary-700"
      }, null, _parent));
      _push(`<label class="text-primary-700 text-xs font-semibold tracking-wider uppercase">Documents d&#39;exécution</label></div><p class="text-base font-semibold text-gray-900 dark:text-white">${ssrInterpolate(unref(contactsEtudes)?.documents_execution_nom || "-")}</p>`);
      if (unref(contactsEtudes)?.documents_execution_email) {
        _push(`<a${ssrRenderAttr("href", `mailto:${unref(contactsEtudes).documents_execution_email}`)} class="text-primary-700 mt-1 flex items-center gap-1 text-sm hover:underline">`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:mail",
          size: "14"
        }, null, _parent));
        _push(` ${ssrInterpolate(unref(contactsEtudes).documents_execution_email)}</a>`);
      } else {
        _push(`<p class="text-sm text-gray-400">Aucun email</p>`);
      }
      _push(`</div></div></div>`);
      _push(ssrRenderComponent(_component_AppSlideOver, {
        sideModal: unref(showEditEtudes),
        closeSideModal: () => showEditEtudes.value = false
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (unref(showEditEtudes)) {
              _push2(ssrRenderComponent(_component_AppSlideOverContent, {
                closeSideModal: () => showEditEtudes.value = false
              }, {
                header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<h2 class="font-[Pacifico] text-3xl text-gray-800 dark:text-white"${_scopeId2}>Contacts études</h2><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId2}>Modifier les contacts études du chantier</p>`);
                  } else {
                    return [
                      createVNode("h2", { class: "font-[Pacifico] text-3xl text-gray-800 dark:text-white" }, "Contacts études"),
                      createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, "Modifier les contacts études du chantier")
                    ];
                  }
                }),
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<form class="space-y-6"${_scopeId2}><div class="space-y-4"${_scopeId2}><div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:file-text",
                      size: "16",
                      class: "text-gray-900"
                    }, null, _parent3, _scopeId2));
                    _push3(`<h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId2}> Plans techniques </h3></div>`);
                    _push3(ssrRenderComponent(_component_AppInput, {
                      modelValue: unref(editFormEtudes).plan_technique_nom,
                      "onUpdate:modelValue": ($event) => unref(editFormEtudes).plan_technique_nom = $event,
                      name: "plan_technique_nom",
                      title: "Nom",
                      placeholder: "Nom du contact"
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppInput, {
                      modelValue: unref(editFormEtudes).plan_technique_email,
                      "onUpdate:modelValue": ($event) => unref(editFormEtudes).plan_technique_email = $event,
                      name: "plan_technique_email",
                      title: "Email",
                      type: "email",
                      placeholder: "email@exemple.com"
                    }, null, _parent3, _scopeId2));
                    _push3(`</div><div class="space-y-4"${_scopeId2}><div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:folder-open",
                      size: "16",
                      class: "text-gray-900"
                    }, null, _parent3, _scopeId2));
                    _push3(`<h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId2}> Documents d&#39;exécution </h3></div>`);
                    _push3(ssrRenderComponent(_component_AppInput, {
                      modelValue: unref(editFormEtudes).documents_execution_nom,
                      "onUpdate:modelValue": ($event) => unref(editFormEtudes).documents_execution_nom = $event,
                      name: "documents_execution_nom",
                      title: "Nom",
                      placeholder: "Nom du contact"
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppInput, {
                      modelValue: unref(editFormEtudes).documents_execution_email,
                      "onUpdate:modelValue": ($event) => unref(editFormEtudes).documents_execution_email = $event,
                      name: "documents_execution_email",
                      title: "Email",
                      type: "email",
                      placeholder: "email@exemple.com"
                    }, null, _parent3, _scopeId2));
                    _push3(`</div></form>`);
                  } else {
                    return [
                      createVNode("form", {
                        onSubmit: withModifiers(saveEtudes, ["prevent"]),
                        class: "space-y-6"
                      }, [
                        createVNode("div", { class: "space-y-4" }, [
                          createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                            createVNode(_component_Icon, {
                              name: "lucide:file-text",
                              size: "16",
                              class: "text-gray-900"
                            }),
                            createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " Plans techniques ")
                          ]),
                          createVNode(_component_AppInput, {
                            modelValue: unref(editFormEtudes).plan_technique_nom,
                            "onUpdate:modelValue": ($event) => unref(editFormEtudes).plan_technique_nom = $event,
                            name: "plan_technique_nom",
                            title: "Nom",
                            placeholder: "Nom du contact"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                          createVNode(_component_AppInput, {
                            modelValue: unref(editFormEtudes).plan_technique_email,
                            "onUpdate:modelValue": ($event) => unref(editFormEtudes).plan_technique_email = $event,
                            name: "plan_technique_email",
                            title: "Email",
                            type: "email",
                            placeholder: "email@exemple.com"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ]),
                        createVNode("div", { class: "space-y-4" }, [
                          createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                            createVNode(_component_Icon, {
                              name: "lucide:folder-open",
                              size: "16",
                              class: "text-gray-900"
                            }),
                            createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " Documents d'exécution ")
                          ]),
                          createVNode(_component_AppInput, {
                            modelValue: unref(editFormEtudes).documents_execution_nom,
                            "onUpdate:modelValue": ($event) => unref(editFormEtudes).documents_execution_nom = $event,
                            name: "documents_execution_nom",
                            title: "Nom",
                            placeholder: "Nom du contact"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                          createVNode(_component_AppInput, {
                            modelValue: unref(editFormEtudes).documents_execution_email,
                            "onUpdate:modelValue": ($event) => unref(editFormEtudes).documents_execution_email = $event,
                            name: "documents_execution_email",
                            title: "Email",
                            type: "email",
                            placeholder: "email@exemple.com"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ])
                      ], 32)
                    ];
                  }
                }),
                footer: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_AppButtonValidated, {
                      theme: "cancel",
                      type: "button",
                      onClick: ($event) => showEditEtudes.value = false
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`Annuler`);
                        } else {
                          return [
                            createTextVNode("Annuler")
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppButtonValidated, {
                      theme: "primary",
                      type: "button",
                      onClick: saveEtudes
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`Enregistrer`);
                        } else {
                          return [
                            createTextVNode("Enregistrer")
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(`</div>`);
                  } else {
                    return [
                      createVNode("div", { class: "flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700" }, [
                        createVNode(_component_AppButtonValidated, {
                          theme: "cancel",
                          type: "button",
                          onClick: ($event) => showEditEtudes.value = false
                        }, {
                          default: withCtx(() => [
                            createTextVNode("Annuler")
                          ]),
                          _: 1
                        }, 8, ["onClick"]),
                        createVNode(_component_AppButtonValidated, {
                          theme: "primary",
                          type: "button",
                          onClick: saveEtudes
                        }, {
                          default: withCtx(() => [
                            createTextVNode("Enregistrer")
                          ]),
                          _: 1
                        })
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
              unref(showEditEtudes) ? (openBlock(), createBlock(_component_AppSlideOverContent, {
                key: 0,
                closeSideModal: () => showEditEtudes.value = false
              }, {
                header: withCtx(() => [
                  createVNode("h2", { class: "font-[Pacifico] text-3xl text-gray-800 dark:text-white" }, "Contacts études"),
                  createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, "Modifier les contacts études du chantier")
                ]),
                default: withCtx(() => [
                  createVNode("form", {
                    onSubmit: withModifiers(saveEtudes, ["prevent"]),
                    class: "space-y-6"
                  }, [
                    createVNode("div", { class: "space-y-4" }, [
                      createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                        createVNode(_component_Icon, {
                          name: "lucide:file-text",
                          size: "16",
                          class: "text-gray-900"
                        }),
                        createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " Plans techniques ")
                      ]),
                      createVNode(_component_AppInput, {
                        modelValue: unref(editFormEtudes).plan_technique_nom,
                        "onUpdate:modelValue": ($event) => unref(editFormEtudes).plan_technique_nom = $event,
                        name: "plan_technique_nom",
                        title: "Nom",
                        placeholder: "Nom du contact"
                      }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                      createVNode(_component_AppInput, {
                        modelValue: unref(editFormEtudes).plan_technique_email,
                        "onUpdate:modelValue": ($event) => unref(editFormEtudes).plan_technique_email = $event,
                        name: "plan_technique_email",
                        title: "Email",
                        type: "email",
                        placeholder: "email@exemple.com"
                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                    ]),
                    createVNode("div", { class: "space-y-4" }, [
                      createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                        createVNode(_component_Icon, {
                          name: "lucide:folder-open",
                          size: "16",
                          class: "text-gray-900"
                        }),
                        createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " Documents d'exécution ")
                      ]),
                      createVNode(_component_AppInput, {
                        modelValue: unref(editFormEtudes).documents_execution_nom,
                        "onUpdate:modelValue": ($event) => unref(editFormEtudes).documents_execution_nom = $event,
                        name: "documents_execution_nom",
                        title: "Nom",
                        placeholder: "Nom du contact"
                      }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                      createVNode(_component_AppInput, {
                        modelValue: unref(editFormEtudes).documents_execution_email,
                        "onUpdate:modelValue": ($event) => unref(editFormEtudes).documents_execution_email = $event,
                        name: "documents_execution_email",
                        title: "Email",
                        type: "email",
                        placeholder: "email@exemple.com"
                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                    ])
                  ], 32)
                ]),
                footer: withCtx(() => [
                  createVNode("div", { class: "flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700" }, [
                    createVNode(_component_AppButtonValidated, {
                      theme: "cancel",
                      type: "button",
                      onClick: ($event) => showEditEtudes.value = false
                    }, {
                      default: withCtx(() => [
                        createTextVNode("Annuler")
                      ]),
                      _: 1
                    }, 8, ["onClick"]),
                    createVNode(_component_AppButtonValidated, {
                      theme: "primary",
                      type: "button",
                      onClick: saveEtudes
                    }, {
                      default: withCtx(() => [
                        createTextVNode("Enregistrer")
                      ]),
                      _: 1
                    })
                  ])
                ]),
                _: 1
              }, 8, ["closeSideModal"])) : createCommentVNode("", true)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
    };
  }
};
const _sfc_setup$i = _sfc_main$i.setup;
_sfc_main$i.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/chantier/contacts/etudes.vue");
  return _sfc_setup$i ? _sfc_setup$i(props, ctx) : void 0;
};
const _sfc_main$h = {
  __name: "ChantierContactsAutres",
  __ssrInlineRender: true,
  props: {
    chantier: {
      type: Object,
      required: true
    }
  },
  setup(__props) {
    const props = __props;
    const { getContactsAutres, addContactAutre, updateContactAutre } = useContacts();
    useUsers();
    const { setLoader } = useLoader();
    const contactsAutres = ref([]);
    const showAddAutre = ref(false);
    const showEditAutre = ref(false);
    const editFormAutre = ref({
      id: null,
      metier: "",
      entreprise: "",
      responsable_nom: "",
      responsable_email: ""
    });
    const openAddAutre = () => {
      editFormAutre.value = {
        id: null,
        metier: "",
        entreprise: "",
        responsable_nom: "",
        responsable_email: ""
      };
      showAddAutre.value = true;
    };
    const saveAutre = async () => {
      setLoader(true);
      try {
        let result;
        if (editFormAutre.value.id) {
          result = await updateContactAutre(editFormAutre.value.id, editFormAutre.value);
        } else {
          result = await addContactAutre(props.chantier.id, editFormAutre.value);
        }
        if (result) {
          contactsAutres.value = await getContactsAutres(props.chantier.id);
          showAddAutre.value = false;
          showEditAutre.value = false;
        }
      } finally {
        setLoader(false);
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Icon = __nuxt_component_1;
      const _component_AppButtonValidated = _sfc_main$2$1;
      const _component_AppSlideOver = _sfc_main$1$1;
      const _component_AppSlideOverContent = _sfc_main$p;
      const _component_AppInput = _sfc_main$1$2;
      _push(`<div${ssrRenderAttrs(_attrs)}><div class="space-y-6"><div class="flex items-center justify-between"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-600/20 text-gray-700">`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:users",
        size: "20"
      }, null, _parent));
      _push(`</div><div><h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">Autres contacts</h2><p class="text-xs text-gray-500 dark:text-gray-400">Contacts divers du chantier</p></div></div>`);
      _push(ssrRenderComponent(_component_AppButtonValidated, {
        type: "button",
        theme: "primary",
        onClick: openAddAutre
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<span class="flex items-center gap-2"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:plus",
              size: "16"
            }, null, _parent2, _scopeId));
            _push2(`<p class="hidden lg:block"${_scopeId}>Ajouter</p></span>`);
          } else {
            return [
              createVNode("span", { class: "flex items-center gap-2" }, [
                createVNode(_component_Icon, {
                  name: "lucide:plus",
                  size: "16"
                }),
                createVNode("p", { class: "hidden lg:block" }, "Ajouter")
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
      if (unref(contactsAutres).length > 0) {
        _push(`<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"><!--[-->`);
        ssrRenderList(unref(contactsAutres), (contact) => {
          _push(`<div class="hover:border-secondary-900 dark:hover:border-secondary-900 rounded-lg border border-gray-200 bg-white p-4 shadow-lg transition-colors dark:border-gray-600 dark:bg-gray-700/50"><div class="flex items-start justify-between"><div class="flex-1"><div class="mb-2 flex items-center gap-2"><span class="border-secondary-900 bg-secondary-800/20 text-secondary-900 dark:bg-secondary-900/40 dark:text-secondary-900 rounded-lg border px-2 py-0.5 text-xs font-medium">${ssrInterpolate(contact.metier || "Non défini")}</span></div><p class="text-lg font-bold text-gray-900 dark:text-white">${ssrInterpolate(contact.entreprise || "-")}</p><div class="mt-2 space-y-1"><p class="text-sm text-gray-600 dark:text-gray-300"><span class="text-gray-400">Responsable:</span> ${ssrInterpolate(contact.responsable_nom || "-")}</p>`);
          if (contact.responsable_email) {
            _push(`<a${ssrRenderAttr("href", `mailto:${contact.responsable_email}`)} class="text-primary-600 dark:text-primary-400 flex items-center gap-1 text-sm hover:underline">`);
            _push(ssrRenderComponent(_component_Icon, {
              name: "lucide:mail",
              size: "14"
            }, null, _parent));
            _push(` ${ssrInterpolate(contact.responsable_email)}</a>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div><div class="flex items-center gap-2"><button class="hover:text-primary-600 flex items-center justify-center rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-200 dark:hover:bg-gray-600">`);
          _push(ssrRenderComponent(_component_Icon, {
            name: "lucide:pencil",
            size: "16"
          }, null, _parent));
          _push(`</button><button class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30">`);
          _push(ssrRenderComponent(_component_Icon, {
            name: "lucide:trash-2",
            size: "16"
          }, null, _parent));
          _push(`</button></div></div></div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<div class="flex flex-col items-center justify-center rounded-lg bg-white p-4 py-12 text-gray-400 shadow-lg dark:text-gray-500">`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:users",
          size: "48",
          class: "mb-4 opacity-50"
        }, null, _parent));
        _push(`<p class="text-lg font-medium">Aucun autre contact</p><p class="text-sm">Cliquez sur &quot;Ajouter&quot; pour créer un contact</p></div>`);
      }
      _push(`</div>`);
      _push(ssrRenderComponent(_component_AppSlideOver, {
        sideModal: unref(showAddAutre) || unref(showEditAutre),
        closeSideModal: () => {
          showAddAutre.value = false, showEditAutre.value = false;
        }
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (unref(showAddAutre) || unref(showEditAutre)) {
              _push2(ssrRenderComponent(_component_AppSlideOverContent, {
                closeSideModal: () => {
                  showAddAutre.value = false, showEditAutre.value = false;
                }
              }, {
                header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<h2 class="font-[Pacifico] text-3xl text-gray-800 dark:text-white"${_scopeId2}>${ssrInterpolate(unref(editFormAutre).id ? "Modifier" : "Ajouter")} un contact </h2><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId2}>Informations du contact</p>`);
                  } else {
                    return [
                      createVNode("h2", { class: "font-[Pacifico] text-3xl text-gray-800 dark:text-white" }, toDisplayString(unref(editFormAutre).id ? "Modifier" : "Ajouter") + " un contact ", 1),
                      createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, "Informations du contact")
                    ];
                  }
                }),
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<form class="space-y-4"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_AppInput, {
                      modelValue: unref(editFormAutre).metier,
                      "onUpdate:modelValue": ($event) => unref(editFormAutre).metier = $event,
                      name: "metier",
                      title: "Fonction / Rôle",
                      placeholder: "Ex: Mairie, Riverain..."
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppInput, {
                      modelValue: unref(editFormAutre).entreprise,
                      "onUpdate:modelValue": ($event) => unref(editFormAutre).entreprise = $event,
                      name: "entreprise",
                      title: "Organisme / Société",
                      placeholder: "Nom de l'organisme"
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppInput, {
                      modelValue: unref(editFormAutre).responsable_nom,
                      "onUpdate:modelValue": ($event) => unref(editFormAutre).responsable_nom = $event,
                      name: "responsable_nom",
                      title: "Nom du contact",
                      placeholder: "Nom du contact"
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppInput, {
                      modelValue: unref(editFormAutre).responsable_email,
                      "onUpdate:modelValue": ($event) => unref(editFormAutre).responsable_email = $event,
                      name: "responsable_email",
                      title: "Email",
                      type: "email",
                      placeholder: "email@exemple.com"
                    }, null, _parent3, _scopeId2));
                    _push3(`</form>`);
                  } else {
                    return [
                      createVNode("form", {
                        onSubmit: withModifiers(saveAutre, ["prevent"]),
                        class: "space-y-4"
                      }, [
                        createVNode(_component_AppInput, {
                          modelValue: unref(editFormAutre).metier,
                          "onUpdate:modelValue": ($event) => unref(editFormAutre).metier = $event,
                          name: "metier",
                          title: "Fonction / Rôle",
                          placeholder: "Ex: Mairie, Riverain..."
                        }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                        createVNode(_component_AppInput, {
                          modelValue: unref(editFormAutre).entreprise,
                          "onUpdate:modelValue": ($event) => unref(editFormAutre).entreprise = $event,
                          name: "entreprise",
                          title: "Organisme / Société",
                          placeholder: "Nom de l'organisme"
                        }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                        createVNode(_component_AppInput, {
                          modelValue: unref(editFormAutre).responsable_nom,
                          "onUpdate:modelValue": ($event) => unref(editFormAutre).responsable_nom = $event,
                          name: "responsable_nom",
                          title: "Nom du contact",
                          placeholder: "Nom du contact"
                        }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                        createVNode(_component_AppInput, {
                          modelValue: unref(editFormAutre).responsable_email,
                          "onUpdate:modelValue": ($event) => unref(editFormAutre).responsable_email = $event,
                          name: "responsable_email",
                          title: "Email",
                          type: "email",
                          placeholder: "email@exemple.com"
                        }, null, 8, ["modelValue", "onUpdate:modelValue"])
                      ], 32)
                    ];
                  }
                }),
                footer: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_AppButtonValidated, {
                      theme: "cancel",
                      type: "button",
                      onClick: ($event) => (showAddAutre.value = false, showEditAutre.value = false)
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`Annuler`);
                        } else {
                          return [
                            createTextVNode("Annuler")
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppButtonValidated, {
                      theme: "primary",
                      type: "button",
                      onClick: saveAutre
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`${ssrInterpolate(unref(editFormAutre).id ? "Modifier" : "Ajouter")}`);
                        } else {
                          return [
                            createTextVNode(toDisplayString(unref(editFormAutre).id ? "Modifier" : "Ajouter"), 1)
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(`</div>`);
                  } else {
                    return [
                      createVNode("div", { class: "flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700" }, [
                        createVNode(_component_AppButtonValidated, {
                          theme: "cancel",
                          type: "button",
                          onClick: ($event) => (showAddAutre.value = false, showEditAutre.value = false)
                        }, {
                          default: withCtx(() => [
                            createTextVNode("Annuler")
                          ]),
                          _: 1
                        }, 8, ["onClick"]),
                        createVNode(_component_AppButtonValidated, {
                          theme: "primary",
                          type: "button",
                          onClick: saveAutre
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(editFormAutre).id ? "Modifier" : "Ajouter"), 1)
                          ]),
                          _: 1
                        })
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
              unref(showAddAutre) || unref(showEditAutre) ? (openBlock(), createBlock(_component_AppSlideOverContent, {
                key: 0,
                closeSideModal: () => {
                  showAddAutre.value = false, showEditAutre.value = false;
                }
              }, {
                header: withCtx(() => [
                  createVNode("h2", { class: "font-[Pacifico] text-3xl text-gray-800 dark:text-white" }, toDisplayString(unref(editFormAutre).id ? "Modifier" : "Ajouter") + " un contact ", 1),
                  createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, "Informations du contact")
                ]),
                default: withCtx(() => [
                  createVNode("form", {
                    onSubmit: withModifiers(saveAutre, ["prevent"]),
                    class: "space-y-4"
                  }, [
                    createVNode(_component_AppInput, {
                      modelValue: unref(editFormAutre).metier,
                      "onUpdate:modelValue": ($event) => unref(editFormAutre).metier = $event,
                      name: "metier",
                      title: "Fonction / Rôle",
                      placeholder: "Ex: Mairie, Riverain..."
                    }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                    createVNode(_component_AppInput, {
                      modelValue: unref(editFormAutre).entreprise,
                      "onUpdate:modelValue": ($event) => unref(editFormAutre).entreprise = $event,
                      name: "entreprise",
                      title: "Organisme / Société",
                      placeholder: "Nom de l'organisme"
                    }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                    createVNode(_component_AppInput, {
                      modelValue: unref(editFormAutre).responsable_nom,
                      "onUpdate:modelValue": ($event) => unref(editFormAutre).responsable_nom = $event,
                      name: "responsable_nom",
                      title: "Nom du contact",
                      placeholder: "Nom du contact"
                    }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                    createVNode(_component_AppInput, {
                      modelValue: unref(editFormAutre).responsable_email,
                      "onUpdate:modelValue": ($event) => unref(editFormAutre).responsable_email = $event,
                      name: "responsable_email",
                      title: "Email",
                      type: "email",
                      placeholder: "email@exemple.com"
                    }, null, 8, ["modelValue", "onUpdate:modelValue"])
                  ], 32)
                ]),
                footer: withCtx(() => [
                  createVNode("div", { class: "flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700" }, [
                    createVNode(_component_AppButtonValidated, {
                      theme: "cancel",
                      type: "button",
                      onClick: ($event) => (showAddAutre.value = false, showEditAutre.value = false)
                    }, {
                      default: withCtx(() => [
                        createTextVNode("Annuler")
                      ]),
                      _: 1
                    }, 8, ["onClick"]),
                    createVNode(_component_AppButtonValidated, {
                      theme: "primary",
                      type: "button",
                      onClick: saveAutre
                    }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(unref(editFormAutre).id ? "Modifier" : "Ajouter"), 1)
                      ]),
                      _: 1
                    })
                  ])
                ]),
                _: 1
              }, 8, ["closeSideModal"])) : createCommentVNode("", true)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
    };
  }
};
const _sfc_setup$h = _sfc_main$h.setup;
_sfc_main$h.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/chantier/contacts/autres.vue");
  return _sfc_setup$h ? _sfc_setup$h(props, ctx) : void 0;
};
const _sfc_main$g = {
  __name: "ChantierTimeline",
  __ssrInlineRender: true,
  props: {
    chantier: {
      type: Object,
      required: true
    }
  },
  setup(__props) {
    const props = __props;
    const { getTimelineByChantier, addTimelineItem, updateTimelineItem, deleteTimelineItem } = useTimeline();
    const { setLoader } = useLoader();
    const showSlideOver = ref(false);
    const editMode = ref(false);
    const editingItem = ref(null);
    const showDeleteModal = ref(false);
    const itemToDelete = ref(null);
    const timelineItems = ref([]);
    const form = ref({
      type: "semaine",
      semaineDebut: null,
      anneeDebut: (/* @__PURE__ */ new Date()).getFullYear(),
      semaineFin: null,
      anneeFin: (/* @__PURE__ */ new Date()).getFullYear(),
      contenu: ""
    });
    const semaineOptions = computed(() => {
      return Array.from({ length: 53 }, (_, i) => ({
        id: i + 1,
        label: `S${i + 1}`
      }));
    });
    const anneeOptions = computed(() => {
      const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
      return Array.from({ length: 5 }, (_, i) => ({
        id: currentYear - 2 + i,
        label: String(currentYear - 2 + i)
      }));
    });
    computed(() => {
      return [
        { id: "semaine", label: "Semaine entière" },
        { id: "weekend", label: "Week-end" }
      ];
    });
    const needsSemaineFin = computed(() => {
      return form.value.type === "weekend";
    });
    const sortedItems = computed(() => {
      return [...timelineItems.value].sort((a, b) => {
        if (a.annee_debut !== b.annee_debut) return a.annee_debut - b.annee_debut;
        return a.semaine_debut - b.semaine_debut;
      });
    });
    const loadTimeline = async () => {
      if (props.chantier?.id) {
        timelineItems.value = await getTimelineByChantier(props.chantier.id);
      }
    };
    const getTypeColor = (type) => {
      const colors = {
        weekend: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
        semaine: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800"
      };
      return colors[type] || colors.semaine;
    };
    const getTypeDotColor = (type) => {
      const colors = {
        weekend: "bg-orange-500 shadow-orange-500/50",
        semaine: "bg-blue-500 shadow-blue-500/50"
      };
      return colors[type] || colors.semaine;
    };
    const getTypeLineColor = (type) => {
      const colors = {
        weekend: "bg-orange-300 dark:bg-orange-700",
        semaine: "bg-blue-300 dark:bg-blue-700"
      };
      return colors[type] || colors.semaine;
    };
    const getTypeLabel = (type) => {
      const labels = {
        weekend: "Week-end",
        semaine: "Semaine"
      };
      return labels[type] || "Semaine";
    };
    const getTypeIcon = (type) => {
      const icons = {
        weekend: "lucide:sun",
        semaine: "lucide:calendar-days"
      };
      return icons[type] || "lucide:calendar-days";
    };
    const getWeekNumber = (date) => {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      return Math.ceil(((d - yearStart) / 864e5 + 1) / 7);
    };
    const openAddSlideOver = () => {
      editMode.value = false;
      editingItem.value = null;
      form.value = {
        type: "semaine",
        semaineDebut: getWeekNumber(/* @__PURE__ */ new Date()),
        anneeDebut: (/* @__PURE__ */ new Date()).getFullYear(),
        semaineFin: null,
        anneeFin: (/* @__PURE__ */ new Date()).getFullYear(),
        contenu: ""
      };
      showSlideOver.value = true;
    };
    const closeSlideOver = () => {
      showSlideOver.value = false;
      editMode.value = false;
      editingItem.value = null;
    };
    watch(
      () => form.value.type,
      (newType) => {
        if (newType === "semaine") {
          form.value.semaineFin = null;
          form.value.anneeFin = null;
        }
      }
    );
    const handleSave = async () => {
      if (!form.value.semaineDebut || !form.value.contenu) return;
      setLoader(true);
      try {
        if (editMode.value && editingItem.value) {
          const result = await updateTimelineItem(editingItem.value.id, {
            type: form.value.type,
            semaine_debut: form.value.semaineDebut,
            annee_debut: form.value.anneeDebut,
            semaine_fin: needsSemaineFin.value ? form.value.semaineFin : null,
            annee_fin: needsSemaineFin.value ? form.value.anneeFin : null,
            contenu: form.value.contenu
          });
          if (result) {
            await loadTimeline();
            closeSlideOver();
          }
        } else {
          const result = await addTimelineItem(
            props.chantier.id,
            form.value.type,
            form.value.semaineDebut,
            form.value.anneeDebut,
            needsSemaineFin.value ? form.value.semaineFin : null,
            needsSemaineFin.value ? form.value.anneeFin : null,
            form.value.contenu
          );
          if (result) {
            await loadTimeline();
            closeSlideOver();
          }
        }
      } finally {
        setLoader(false);
      }
    };
    const closeDeleteModal = () => {
      showDeleteModal.value = false;
      itemToDelete.value = null;
    };
    const confirmDelete = async () => {
      if (!itemToDelete.value) return;
      setLoader(true);
      try {
        const success = await deleteTimelineItem(itemToDelete.value.id);
        if (success) {
          await loadTimeline();
          closeDeleteModal();
        }
      } finally {
        setLoader(false);
      }
    };
    watch(() => props.chantier?.id, loadTimeline);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppTitleMain = _sfc_main$o;
      const _component_AppButtonValidated = _sfc_main$2$1;
      const _component_Icon = __nuxt_component_1;
      const _component_AppSlideOver = _sfc_main$1$1;
      const _component_AppSlideOverContent = _sfc_main$p;
      const _component_AppSelect = _sfc_main$q;
      const _component_AppModal = _sfc_main$r;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-4" }, _attrs))}><div class="flex flex-col items-center justify-between gap-4 lg:flex-row">`);
      _push(ssrRenderComponent(_component_AppTitleMain, {
        title: "Timeline",
        description: "Semaines et week-ends du chantier"
      }, null, _parent));
      _push(ssrRenderComponent(_component_AppButtonValidated, {
        type: "button",
        theme: "primary",
        onClick: openAddSlideOver
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<span class="flex items-center gap-2"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:plus",
              size: "16"
            }, null, _parent2, _scopeId));
            _push2(` Ajouter </span>`);
          } else {
            return [
              createVNode("span", { class: "flex items-center gap-2" }, [
                createVNode(_component_Icon, {
                  name: "lucide:plus",
                  size: "16"
                }),
                createTextVNode(" Ajouter ")
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><button class="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900 focus:ring-2 focus:ring-slate-500 focus:outline-none active:scale-[0.98]"> Valider </button><button class="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 focus:ring-2 focus:ring-slate-300 focus:outline-none active:scale-[0.98]"> Annuler </button><button class="inline-flex items-center justify-center gap-2 rounded-lg bg-red-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800 focus:ring-2 focus:ring-red-500 focus:outline-none active:scale-[0.98]"> Supprimer </button><button class="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black focus:ring-2 focus:ring-slate-600 focus:outline-none active:scale-[0.98]"> Supprimer </button><button class="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-black hover:text-red-500 focus:ring-2 focus:ring-slate-600 focus:outline-none active:scale-[0.98]"> Supprimer </button><button class="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:ring-2 focus:ring-slate-400 focus:outline-none active:scale-[0.98]"> Supprimer </button><div class="rounded-lg border border-gray-100 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"><div class="p-6"><div class="mb-6 flex items-center justify-between"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-200 dark:from-indigo-900/50 dark:to-purple-800/50">`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:git-branch",
        size: "20",
        class: "text-gray-600 dark:text-indigo-400"
      }, null, _parent));
      _push(`</div><div><h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">Vue chronologique</h2><p class="text-xs text-gray-500 dark:text-gray-400">${ssrInterpolate(unref(sortedItems).length)} événement${ssrInterpolate(unref(sortedItems).length > 1 ? "s" : "")}</p></div></div><div class="flex items-center gap-4"><div class="flex items-center gap-2"><div class="h-3 w-3 rounded-full bg-blue-500"></div><span class="text-sm text-gray-600 dark:text-gray-400">Semaine</span></div><div class="flex items-center gap-2"><div class="h-3 w-3 rounded-full bg-orange-500"></div><span class="text-sm text-gray-600 dark:text-gray-400">Week-end</span></div></div></div>`);
      if (unref(sortedItems).length > 0) {
        _push(`<div class="relative py-6"><div class="from-primary-200 via-primary-400 to-primary-200 dark:from-primary-800 dark:via-primary-600 dark:to-primary-800 absolute top-0 bottom-0 left-4 w-0.5 bg-linear-to-b md:left-1/2 md:-translate-x-1/2"></div><div class="space-y-3 md:space-y-4"><!--[-->`);
        ssrRenderList(unref(sortedItems), (item, index) => {
          _push(`<div class="${ssrRenderClass([[
            // Mobile : toujours à droite, Desktop : alternance
            "justify-end md:justify-start",
            { "md:justify-end!": index % 2 === 1 }
          ], "relative flex items-center"])}">`);
          if (index % 2 === 0) {
            _push(`<div class="hidden w-5/12 pr-6 text-right md:block"><div class="${ssrRenderClass([getTypeColor(item.type), "group relative transform cursor-pointer rounded-xl border-2 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"])}"><div class="${ssrRenderClass([getTypeLineColor(item.type), "absolute top-1/2 right-0 h-0.5 w-6 translate-x-full -translate-y-1/2 transform"])}"></div><div class="mb-1.5 flex items-center justify-end gap-2"><span class="text-xs font-medium opacity-75"> S${ssrInterpolate(item.semaine_debut)}/${ssrInterpolate(item.annee_debut)} `);
            if (item.semaine_fin) {
              _push(`<!--[-->→ S${ssrInterpolate(item.semaine_fin)}/${ssrInterpolate(item.annee_fin)}<!--]-->`);
            } else {
              _push(`<!---->`);
            }
            _push(`</span><div class="flex items-center gap-1.5 rounded-full bg-white/50 px-2 py-0.5 dark:bg-black/20">`);
            _push(ssrRenderComponent(_component_Icon, {
              name: getTypeIcon(item.type),
              size: "12"
            }, null, _parent));
            _push(`<span class="text-xs font-semibold">${ssrInterpolate(getTypeLabel(item.type))}</span></div></div><p class="text-sm leading-snug font-medium whitespace-pre-line">${ssrInterpolate(item.contenu)}</p><div class="absolute top-2 left-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100"><button class="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 text-red-500 transition-colors hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50">`);
            _push(ssrRenderComponent(_component_Icon, {
              name: "lucide:trash-2",
              size: "16"
            }, null, _parent));
            _push(`</button></div></div></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="absolute left-4 z-10 -translate-x-1/2 transform md:left-1/2"><div class="${ssrRenderClass([getTypeDotColor(item.type), "h-4 w-4 rounded-full shadow-lg ring-2 ring-white transition-transform hover:scale-125 md:h-5 md:w-5 md:ring-4 dark:ring-gray-800"])}"></div></div>`);
          if (index % 2 === 1) {
            _push(`<div class="hidden w-5/12 md:block"></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="${ssrRenderClass([index % 2 === 0 ? "md:hidden" : "md:pl-6", "w-[calc(100%-2rem)] pl-10 md:w-5/12 md:pl-0"])}"><div class="${ssrRenderClass([getTypeColor(item.type), "group relative transform cursor-pointer rounded-xl border-2 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"])}"><div class="${ssrRenderClass([getTypeLineColor(item.type), "absolute top-1/2 left-0 h-0.5 w-4 -translate-x-full -translate-y-1/2 transform md:w-6"])}"></div><div class="mb-1.5 flex flex-wrap items-center gap-2"><div class="flex items-center gap-1.5 rounded-full bg-white/50 px-2 py-0.5 dark:bg-black/20">`);
          _push(ssrRenderComponent(_component_Icon, {
            name: getTypeIcon(item.type),
            size: "12"
          }, null, _parent));
          _push(`<span class="text-xs font-semibold">${ssrInterpolate(getTypeLabel(item.type))}</span></div><span class="text-xs font-medium opacity-75"> S${ssrInterpolate(item.semaine_debut)}/${ssrInterpolate(item.annee_debut)} `);
          if (item.semaine_fin) {
            _push(`<!--[-->→ S${ssrInterpolate(item.semaine_fin)}/${ssrInterpolate(item.annee_fin)}<!--]-->`);
          } else {
            _push(`<!---->`);
          }
          _push(`</span></div><p class="text-sm leading-snug font-medium whitespace-pre-line">${ssrInterpolate(item.contenu)}</p><div class="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100"><button class="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 text-red-500 transition-colors hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50">`);
          _push(ssrRenderComponent(_component_Icon, {
            name: "lucide:trash-2",
            size: "16"
          }, null, _parent));
          _push(`</button></div></div></div>`);
          if (index % 2 === 0) {
            _push(`<div class="hidden w-5/12 md:block"></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        });
        _push(`<!--]--></div><div class="absolute top-0 left-4 -translate-x-1/2 -translate-y-1/2 transform md:left-1/2"><div class="bg-primary-500 ring-primary-100 dark:ring-primary-900/50 h-2.5 w-2.5 rounded-full ring-2 md:h-3 md:w-3 md:ring-4"></div></div><div class="absolute bottom-0 left-4 -translate-x-1/2 translate-y-1/2 transform md:left-1/2"><div class="bg-primary-500 ring-primary-100 dark:ring-primary-900/50 h-2.5 w-2.5 rounded-full ring-2 md:h-3 md:w-3 md:ring-4"></div></div></div>`);
      } else {
        _push(`<div class="py-16 text-center"><div class="relative inline-block"><div class="from-primary-200 dark:from-primary-900/30 absolute inset-0 rounded-full bg-linear-to-br to-purple-200 opacity-50 blur-2xl dark:to-purple-900/30"></div>`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:calendar-plus",
          size: "64",
          class: "relative text-gray-300 dark:text-gray-600"
        }, null, _parent));
        _push(`</div><p class="mt-4 text-lg font-medium text-gray-500 dark:text-gray-400">Aucun événement planifié</p><p class="mt-1 text-sm text-gray-400 dark:text-gray-500">Ajoutez des semaines ou week-ends à la timeline</p><button class="bg-primary-500 hover:bg-primary-600 mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-white transition-colors">`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:plus",
          size: "16"
        }, null, _parent));
        _push(` Ajouter un événement </button></div>`);
      }
      _push(`</div></div>`);
      _push(ssrRenderComponent(_component_AppSlideOver, {
        sideModal: unref(showSlideOver),
        closeSideModal: closeSlideOver
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (unref(showSlideOver)) {
              _push2(ssrRenderComponent(_component_AppSlideOverContent, { closeSideModal: closeSlideOver }, {
                header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<h2 class="font-[Pacifico] text-3xl text-gray-800 dark:text-white"${_scopeId2}>${ssrInterpolate(unref(editMode) ? "Modifier" : "Ajouter")} un événement </h2><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId2}>${ssrInterpolate(unref(editMode) ? "Modifiez les informations" : "Ajoutez une semaine ou un week-end")}</p>`);
                  } else {
                    return [
                      createVNode("h2", { class: "font-[Pacifico] text-3xl text-gray-800 dark:text-white" }, toDisplayString(unref(editMode) ? "Modifier" : "Ajouter") + " un événement ", 1),
                      createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, toDisplayString(unref(editMode) ? "Modifiez les informations" : "Ajoutez une semaine ou un week-end"), 1)
                    ];
                  }
                }),
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<form class="space-y-6"${_scopeId2}><div class="space-y-4"${_scopeId2}><div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:tag",
                      size: "16",
                      class: "text-primary-500"
                    }, null, _parent3, _scopeId2));
                    _push3(`<h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId2}>Type</h3></div><div class="grid grid-cols-2 gap-3"${_scopeId2}><button type="button" class="${ssrRenderClass([
                      unref(form).type === "semaine" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600",
                      "relative rounded-xl border-2 p-4 transition-all duration-200"
                    ])}"${_scopeId2}><div class="flex flex-col items-center gap-2"${_scopeId2}><div class="${ssrRenderClass([
                      unref(form).type === "semaine" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500 dark:bg-gray-700",
                      "flex h-10 w-10 items-center justify-center rounded-full"
                    ])}"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:calendar-days",
                      size: "20"
                    }, null, _parent3, _scopeId2));
                    _push3(`</div><span class="${ssrRenderClass([
                      unref(form).type === "semaine" ? "text-blue-700 dark:text-blue-400" : "text-gray-600 dark:text-gray-400",
                      "text-sm font-medium"
                    ])}"${_scopeId2}> Semaine entière </span></div>`);
                    if (unref(form).type === "semaine") {
                      _push3(`<div class="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500"${_scopeId2}>`);
                      _push3(ssrRenderComponent(_component_Icon, {
                        name: "lucide:check",
                        size: "12",
                        class: "text-white"
                      }, null, _parent3, _scopeId2));
                      _push3(`</div>`);
                    } else {
                      _push3(`<!---->`);
                    }
                    _push3(`</button><button type="button" class="${ssrRenderClass([
                      unref(form).type === "weekend" ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20" : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600",
                      "relative rounded-xl border-2 p-4 transition-all duration-200"
                    ])}"${_scopeId2}><div class="flex flex-col items-center gap-2"${_scopeId2}><div class="${ssrRenderClass([
                      unref(form).type === "weekend" ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-500 dark:bg-gray-700",
                      "flex h-10 w-10 items-center justify-center rounded-full"
                    ])}"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:sun",
                      size: "20"
                    }, null, _parent3, _scopeId2));
                    _push3(`</div><span class="${ssrRenderClass([
                      unref(form).type === "weekend" ? "text-orange-700 dark:text-orange-400" : "text-gray-600 dark:text-gray-400",
                      "text-sm font-medium"
                    ])}"${_scopeId2}> Week-end </span></div>`);
                    if (unref(form).type === "weekend") {
                      _push3(`<div class="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500"${_scopeId2}>`);
                      _push3(ssrRenderComponent(_component_Icon, {
                        name: "lucide:check",
                        size: "12",
                        class: "text-white"
                      }, null, _parent3, _scopeId2));
                      _push3(`</div>`);
                    } else {
                      _push3(`<!---->`);
                    }
                    _push3(`</button></div></div><div class="space-y-4"${_scopeId2}><div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:calendar",
                      size: "16",
                      class: "text-primary-500"
                    }, null, _parent3, _scopeId2));
                    _push3(`<h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId2}>${ssrInterpolate(unref(form).type === "weekend" ? "Période du week-end" : "Semaine")}</h3></div><div${_scopeId2}><label class="mb-1 block text-xs text-gray-500"${_scopeId2}>${ssrInterpolate(unref(form).type === "weekend" ? "Semaine de début *" : "Semaine *")}</label><div class="grid grid-cols-2 gap-3"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_AppSelect, {
                      modelValue: unref(form).semaineDebut,
                      "onUpdate:modelValue": ($event) => unref(form).semaineDebut = $event,
                      options: unref(semaineOptions),
                      placeholder: "S...",
                      nullable: ""
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppSelect, {
                      modelValue: unref(form).anneeDebut,
                      "onUpdate:modelValue": ($event) => unref(form).anneeDebut = $event,
                      options: unref(anneeOptions),
                      placeholder: "Année"
                    }, null, _parent3, _scopeId2));
                    _push3(`</div></div>`);
                    if (unref(needsSemaineFin)) {
                      _push3(`<div${_scopeId2}><label class="mb-1 block text-xs text-gray-500"${_scopeId2}>Semaine de fin *</label><div class="grid grid-cols-2 gap-3"${_scopeId2}>`);
                      _push3(ssrRenderComponent(_component_AppSelect, {
                        modelValue: unref(form).semaineFin,
                        "onUpdate:modelValue": ($event) => unref(form).semaineFin = $event,
                        options: unref(semaineOptions),
                        placeholder: "S...",
                        nullable: ""
                      }, null, _parent3, _scopeId2));
                      _push3(ssrRenderComponent(_component_AppSelect, {
                        modelValue: unref(form).anneeFin,
                        "onUpdate:modelValue": ($event) => unref(form).anneeFin = $event,
                        options: unref(anneeOptions),
                        placeholder: "Année"
                      }, null, _parent3, _scopeId2));
                      _push3(`</div></div>`);
                    } else {
                      _push3(`<!---->`);
                    }
                    _push3(`</div><div class="space-y-4"${_scopeId2}><div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:text",
                      size: "16",
                      class: "text-primary-500"
                    }, null, _parent3, _scopeId2));
                    _push3(`<h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId2}> Description </h3></div><div class="w-full"${_scopeId2}><label class="mb-0.5 block text-sm"${_scopeId2}>Contenu *</label><textarea rows="4" class="focus:border-primary-500 focus:ring-primary-500 w-full resize-none appearance-none rounded-md border border-gray-300 px-3 py-2 text-sm leading-tight text-gray-700 focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"${ssrRenderAttr(
                      "placeholder",
                      unref(form).type === "weekend" ? "Description du week-end..." : "Description de la semaine..."
                    )}${_scopeId2}>${ssrInterpolate(unref(form).contenu)}</textarea></div></div></form>`);
                  } else {
                    return [
                      createVNode("form", {
                        onSubmit: withModifiers(handleSave, ["prevent"]),
                        class: "space-y-6"
                      }, [
                        createVNode("div", { class: "space-y-4" }, [
                          createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                            createVNode(_component_Icon, {
                              name: "lucide:tag",
                              size: "16",
                              class: "text-primary-500"
                            }),
                            createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, "Type")
                          ]),
                          createVNode("div", { class: "grid grid-cols-2 gap-3" }, [
                            createVNode("button", {
                              type: "button",
                              onClick: ($event) => unref(form).type = "semaine",
                              class: [
                                "relative rounded-xl border-2 p-4 transition-all duration-200",
                                unref(form).type === "semaine" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                              ]
                            }, [
                              createVNode("div", { class: "flex flex-col items-center gap-2" }, [
                                createVNode("div", {
                                  class: [
                                    "flex h-10 w-10 items-center justify-center rounded-full",
                                    unref(form).type === "semaine" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500 dark:bg-gray-700"
                                  ]
                                }, [
                                  createVNode(_component_Icon, {
                                    name: "lucide:calendar-days",
                                    size: "20"
                                  })
                                ], 2),
                                createVNode("span", {
                                  class: [
                                    "text-sm font-medium",
                                    unref(form).type === "semaine" ? "text-blue-700 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"
                                  ]
                                }, " Semaine entière ", 2)
                              ]),
                              unref(form).type === "semaine" ? (openBlock(), createBlock("div", {
                                key: 0,
                                class: "absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500"
                              }, [
                                createVNode(_component_Icon, {
                                  name: "lucide:check",
                                  size: "12",
                                  class: "text-white"
                                })
                              ])) : createCommentVNode("", true)
                            ], 10, ["onClick"]),
                            createVNode("button", {
                              type: "button",
                              onClick: ($event) => unref(form).type = "weekend",
                              class: [
                                "relative rounded-xl border-2 p-4 transition-all duration-200",
                                unref(form).type === "weekend" ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20" : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                              ]
                            }, [
                              createVNode("div", { class: "flex flex-col items-center gap-2" }, [
                                createVNode("div", {
                                  class: [
                                    "flex h-10 w-10 items-center justify-center rounded-full",
                                    unref(form).type === "weekend" ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-500 dark:bg-gray-700"
                                  ]
                                }, [
                                  createVNode(_component_Icon, {
                                    name: "lucide:sun",
                                    size: "20"
                                  })
                                ], 2),
                                createVNode("span", {
                                  class: [
                                    "text-sm font-medium",
                                    unref(form).type === "weekend" ? "text-orange-700 dark:text-orange-400" : "text-gray-600 dark:text-gray-400"
                                  ]
                                }, " Week-end ", 2)
                              ]),
                              unref(form).type === "weekend" ? (openBlock(), createBlock("div", {
                                key: 0,
                                class: "absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500"
                              }, [
                                createVNode(_component_Icon, {
                                  name: "lucide:check",
                                  size: "12",
                                  class: "text-white"
                                })
                              ])) : createCommentVNode("", true)
                            ], 10, ["onClick"])
                          ])
                        ]),
                        createVNode("div", { class: "space-y-4" }, [
                          createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                            createVNode(_component_Icon, {
                              name: "lucide:calendar",
                              size: "16",
                              class: "text-primary-500"
                            }),
                            createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, toDisplayString(unref(form).type === "weekend" ? "Période du week-end" : "Semaine"), 1)
                          ]),
                          createVNode("div", null, [
                            createVNode("label", { class: "mb-1 block text-xs text-gray-500" }, toDisplayString(unref(form).type === "weekend" ? "Semaine de début *" : "Semaine *"), 1),
                            createVNode("div", { class: "grid grid-cols-2 gap-3" }, [
                              createVNode(_component_AppSelect, {
                                modelValue: unref(form).semaineDebut,
                                "onUpdate:modelValue": ($event) => unref(form).semaineDebut = $event,
                                options: unref(semaineOptions),
                                placeholder: "S...",
                                nullable: ""
                              }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                              createVNode(_component_AppSelect, {
                                modelValue: unref(form).anneeDebut,
                                "onUpdate:modelValue": ($event) => unref(form).anneeDebut = $event,
                                options: unref(anneeOptions),
                                placeholder: "Année"
                              }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                            ])
                          ]),
                          unref(needsSemaineFin) ? (openBlock(), createBlock("div", { key: 0 }, [
                            createVNode("label", { class: "mb-1 block text-xs text-gray-500" }, "Semaine de fin *"),
                            createVNode("div", { class: "grid grid-cols-2 gap-3" }, [
                              createVNode(_component_AppSelect, {
                                modelValue: unref(form).semaineFin,
                                "onUpdate:modelValue": ($event) => unref(form).semaineFin = $event,
                                options: unref(semaineOptions),
                                placeholder: "S...",
                                nullable: ""
                              }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                              createVNode(_component_AppSelect, {
                                modelValue: unref(form).anneeFin,
                                "onUpdate:modelValue": ($event) => unref(form).anneeFin = $event,
                                options: unref(anneeOptions),
                                placeholder: "Année"
                              }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                            ])
                          ])) : createCommentVNode("", true)
                        ]),
                        createVNode("div", { class: "space-y-4" }, [
                          createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                            createVNode(_component_Icon, {
                              name: "lucide:text",
                              size: "16",
                              class: "text-primary-500"
                            }),
                            createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " Description ")
                          ]),
                          createVNode("div", { class: "w-full" }, [
                            createVNode("label", { class: "mb-0.5 block text-sm" }, "Contenu *"),
                            withDirectives(createVNode("textarea", {
                              "onUpdate:modelValue": ($event) => unref(form).contenu = $event,
                              rows: "4",
                              class: "focus:border-primary-500 focus:ring-primary-500 w-full resize-none appearance-none rounded-md border border-gray-300 px-3 py-2 text-sm leading-tight text-gray-700 focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200",
                              placeholder: unref(form).type === "weekend" ? "Description du week-end..." : "Description de la semaine..."
                            }, null, 8, ["onUpdate:modelValue", "placeholder"]), [
                              [vModelText, unref(form).contenu]
                            ])
                          ])
                        ])
                      ], 32)
                    ];
                  }
                }),
                footer: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_AppButtonValidated, {
                      theme: "cancel",
                      type: "button",
                      onClick: closeSlideOver
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`Annuler`);
                        } else {
                          return [
                            createTextVNode("Annuler")
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppButtonValidated, {
                      theme: "primary",
                      type: "button",
                      validated: !!unref(form).semaineDebut && !!unref(form).contenu && (unref(form).type === "semaine" || !!unref(form).semaineFin),
                      onClick: handleSave
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`${ssrInterpolate(unref(editMode) ? "Enregistrer" : "Ajouter")}`);
                        } else {
                          return [
                            createTextVNode(toDisplayString(unref(editMode) ? "Enregistrer" : "Ajouter"), 1)
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(`</div>`);
                  } else {
                    return [
                      createVNode("div", { class: "flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700" }, [
                        createVNode(_component_AppButtonValidated, {
                          theme: "cancel",
                          type: "button",
                          onClick: closeSlideOver
                        }, {
                          default: withCtx(() => [
                            createTextVNode("Annuler")
                          ]),
                          _: 1
                        }),
                        createVNode(_component_AppButtonValidated, {
                          theme: "primary",
                          type: "button",
                          validated: !!unref(form).semaineDebut && !!unref(form).contenu && (unref(form).type === "semaine" || !!unref(form).semaineFin),
                          onClick: handleSave
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(editMode) ? "Enregistrer" : "Ajouter"), 1)
                          ]),
                          _: 1
                        }, 8, ["validated"])
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
                closeSideModal: closeSlideOver
              }, {
                header: withCtx(() => [
                  createVNode("h2", { class: "font-[Pacifico] text-3xl text-gray-800 dark:text-white" }, toDisplayString(unref(editMode) ? "Modifier" : "Ajouter") + " un événement ", 1),
                  createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, toDisplayString(unref(editMode) ? "Modifiez les informations" : "Ajoutez une semaine ou un week-end"), 1)
                ]),
                default: withCtx(() => [
                  createVNode("form", {
                    onSubmit: withModifiers(handleSave, ["prevent"]),
                    class: "space-y-6"
                  }, [
                    createVNode("div", { class: "space-y-4" }, [
                      createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                        createVNode(_component_Icon, {
                          name: "lucide:tag",
                          size: "16",
                          class: "text-primary-500"
                        }),
                        createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, "Type")
                      ]),
                      createVNode("div", { class: "grid grid-cols-2 gap-3" }, [
                        createVNode("button", {
                          type: "button",
                          onClick: ($event) => unref(form).type = "semaine",
                          class: [
                            "relative rounded-xl border-2 p-4 transition-all duration-200",
                            unref(form).type === "semaine" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                          ]
                        }, [
                          createVNode("div", { class: "flex flex-col items-center gap-2" }, [
                            createVNode("div", {
                              class: [
                                "flex h-10 w-10 items-center justify-center rounded-full",
                                unref(form).type === "semaine" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500 dark:bg-gray-700"
                              ]
                            }, [
                              createVNode(_component_Icon, {
                                name: "lucide:calendar-days",
                                size: "20"
                              })
                            ], 2),
                            createVNode("span", {
                              class: [
                                "text-sm font-medium",
                                unref(form).type === "semaine" ? "text-blue-700 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"
                              ]
                            }, " Semaine entière ", 2)
                          ]),
                          unref(form).type === "semaine" ? (openBlock(), createBlock("div", {
                            key: 0,
                            class: "absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500"
                          }, [
                            createVNode(_component_Icon, {
                              name: "lucide:check",
                              size: "12",
                              class: "text-white"
                            })
                          ])) : createCommentVNode("", true)
                        ], 10, ["onClick"]),
                        createVNode("button", {
                          type: "button",
                          onClick: ($event) => unref(form).type = "weekend",
                          class: [
                            "relative rounded-xl border-2 p-4 transition-all duration-200",
                            unref(form).type === "weekend" ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20" : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                          ]
                        }, [
                          createVNode("div", { class: "flex flex-col items-center gap-2" }, [
                            createVNode("div", {
                              class: [
                                "flex h-10 w-10 items-center justify-center rounded-full",
                                unref(form).type === "weekend" ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-500 dark:bg-gray-700"
                              ]
                            }, [
                              createVNode(_component_Icon, {
                                name: "lucide:sun",
                                size: "20"
                              })
                            ], 2),
                            createVNode("span", {
                              class: [
                                "text-sm font-medium",
                                unref(form).type === "weekend" ? "text-orange-700 dark:text-orange-400" : "text-gray-600 dark:text-gray-400"
                              ]
                            }, " Week-end ", 2)
                          ]),
                          unref(form).type === "weekend" ? (openBlock(), createBlock("div", {
                            key: 0,
                            class: "absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500"
                          }, [
                            createVNode(_component_Icon, {
                              name: "lucide:check",
                              size: "12",
                              class: "text-white"
                            })
                          ])) : createCommentVNode("", true)
                        ], 10, ["onClick"])
                      ])
                    ]),
                    createVNode("div", { class: "space-y-4" }, [
                      createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                        createVNode(_component_Icon, {
                          name: "lucide:calendar",
                          size: "16",
                          class: "text-primary-500"
                        }),
                        createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, toDisplayString(unref(form).type === "weekend" ? "Période du week-end" : "Semaine"), 1)
                      ]),
                      createVNode("div", null, [
                        createVNode("label", { class: "mb-1 block text-xs text-gray-500" }, toDisplayString(unref(form).type === "weekend" ? "Semaine de début *" : "Semaine *"), 1),
                        createVNode("div", { class: "grid grid-cols-2 gap-3" }, [
                          createVNode(_component_AppSelect, {
                            modelValue: unref(form).semaineDebut,
                            "onUpdate:modelValue": ($event) => unref(form).semaineDebut = $event,
                            options: unref(semaineOptions),
                            placeholder: "S...",
                            nullable: ""
                          }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                          createVNode(_component_AppSelect, {
                            modelValue: unref(form).anneeDebut,
                            "onUpdate:modelValue": ($event) => unref(form).anneeDebut = $event,
                            options: unref(anneeOptions),
                            placeholder: "Année"
                          }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                        ])
                      ]),
                      unref(needsSemaineFin) ? (openBlock(), createBlock("div", { key: 0 }, [
                        createVNode("label", { class: "mb-1 block text-xs text-gray-500" }, "Semaine de fin *"),
                        createVNode("div", { class: "grid grid-cols-2 gap-3" }, [
                          createVNode(_component_AppSelect, {
                            modelValue: unref(form).semaineFin,
                            "onUpdate:modelValue": ($event) => unref(form).semaineFin = $event,
                            options: unref(semaineOptions),
                            placeholder: "S...",
                            nullable: ""
                          }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                          createVNode(_component_AppSelect, {
                            modelValue: unref(form).anneeFin,
                            "onUpdate:modelValue": ($event) => unref(form).anneeFin = $event,
                            options: unref(anneeOptions),
                            placeholder: "Année"
                          }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                        ])
                      ])) : createCommentVNode("", true)
                    ]),
                    createVNode("div", { class: "space-y-4" }, [
                      createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                        createVNode(_component_Icon, {
                          name: "lucide:text",
                          size: "16",
                          class: "text-primary-500"
                        }),
                        createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " Description ")
                      ]),
                      createVNode("div", { class: "w-full" }, [
                        createVNode("label", { class: "mb-0.5 block text-sm" }, "Contenu *"),
                        withDirectives(createVNode("textarea", {
                          "onUpdate:modelValue": ($event) => unref(form).contenu = $event,
                          rows: "4",
                          class: "focus:border-primary-500 focus:ring-primary-500 w-full resize-none appearance-none rounded-md border border-gray-300 px-3 py-2 text-sm leading-tight text-gray-700 focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200",
                          placeholder: unref(form).type === "weekend" ? "Description du week-end..." : "Description de la semaine..."
                        }, null, 8, ["onUpdate:modelValue", "placeholder"]), [
                          [vModelText, unref(form).contenu]
                        ])
                      ])
                    ])
                  ], 32)
                ]),
                footer: withCtx(() => [
                  createVNode("div", { class: "flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700" }, [
                    createVNode(_component_AppButtonValidated, {
                      theme: "cancel",
                      type: "button",
                      onClick: closeSlideOver
                    }, {
                      default: withCtx(() => [
                        createTextVNode("Annuler")
                      ]),
                      _: 1
                    }),
                    createVNode(_component_AppButtonValidated, {
                      theme: "primary",
                      type: "button",
                      validated: !!unref(form).semaineDebut && !!unref(form).contenu && (unref(form).type === "semaine" || !!unref(form).semaineFin),
                      onClick: handleSave
                    }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(unref(editMode) ? "Enregistrer" : "Ajouter"), 1)
                      ]),
                      _: 1
                    }, 8, ["validated"])
                  ])
                ]),
                _: 1
              })) : createCommentVNode("", true)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_AppModal, {
        modelValue: unref(showDeleteModal),
        "onUpdate:modelValue": ($event) => isRef(showDeleteModal) ? showDeleteModal.value = $event : null,
        size: "lg",
        showCloseButton: false
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="p-6 text-center"${_scopeId}><div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:alert-triangle",
              size: "32",
              class: "text-red-500"
            }, null, _parent2, _scopeId));
            _push2(`</div><h3 class="mb-2 text-xl font-bold text-gray-800 dark:text-white"${_scopeId}>Supprimer cet événement ?</h3><p class="mb-2 text-gray-500 dark:text-gray-400"${_scopeId}>Cette action est irréversible.</p>`);
            if (unref(itemToDelete)) {
              _push2(`<div class="mb-6 rounded-lg bg-gray-100 p-3 dark:bg-gray-700/50"${_scopeId}><div class="mb-1 flex items-center justify-center gap-2"${_scopeId}><div class="${ssrRenderClass([unref(itemToDelete).type === "weekend" ? "bg-orange-500" : "bg-blue-500", "h-3 w-3 rounded-full"])}"${_scopeId}></div><span class="font-medium text-gray-700 dark:text-gray-300"${_scopeId}>${ssrInterpolate(getTypeLabel(unref(itemToDelete).type))}</span><span class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}> S${ssrInterpolate(unref(itemToDelete).semaine_debut)}/${ssrInterpolate(unref(itemToDelete).annee_debut)} `);
              if (unref(itemToDelete).semaine_fin) {
                _push2(`<!--[--> → S${ssrInterpolate(unref(itemToDelete).semaine_fin)}/${ssrInterpolate(unref(itemToDelete).annee_fin)}<!--]-->`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</span></div><p class="truncate text-sm text-gray-600 dark:text-gray-400"${_scopeId}>${ssrInterpolate(unref(itemToDelete).contenu)}</p></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div class="flex justify-center gap-3"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_AppButtonValidated, {
              theme: "cancel",
              type: "button",
              onClick: closeDeleteModal
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`Annuler`);
                } else {
                  return [
                    createTextVNode("Annuler")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_AppButtonValidated, {
              theme: "danger",
              type: "button",
              validated: true,
              onClick: confirmDelete
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<span class="flex items-center gap-2"${_scopeId2}>`);
                  _push3(ssrRenderComponent(_component_Icon, {
                    name: "lucide:trash-2",
                    size: "16"
                  }, null, _parent3, _scopeId2));
                  _push3(` Supprimer </span>`);
                } else {
                  return [
                    createVNode("span", { class: "flex items-center gap-2" }, [
                      createVNode(_component_Icon, {
                        name: "lucide:trash-2",
                        size: "16"
                      }),
                      createTextVNode(" Supprimer ")
                    ])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div></div>`);
          } else {
            return [
              createVNode("div", { class: "p-6 text-center" }, [
                createVNode("div", { class: "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30" }, [
                  createVNode(_component_Icon, {
                    name: "lucide:alert-triangle",
                    size: "32",
                    class: "text-red-500"
                  })
                ]),
                createVNode("h3", { class: "mb-2 text-xl font-bold text-gray-800 dark:text-white" }, "Supprimer cet événement ?"),
                createVNode("p", { class: "mb-2 text-gray-500 dark:text-gray-400" }, "Cette action est irréversible."),
                unref(itemToDelete) ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "mb-6 rounded-lg bg-gray-100 p-3 dark:bg-gray-700/50"
                }, [
                  createVNode("div", { class: "mb-1 flex items-center justify-center gap-2" }, [
                    createVNode("div", {
                      class: ["h-3 w-3 rounded-full", unref(itemToDelete).type === "weekend" ? "bg-orange-500" : "bg-blue-500"]
                    }, null, 2),
                    createVNode("span", { class: "font-medium text-gray-700 dark:text-gray-300" }, toDisplayString(getTypeLabel(unref(itemToDelete).type)), 1),
                    createVNode("span", { class: "text-sm text-gray-500 dark:text-gray-400" }, [
                      createTextVNode(" S" + toDisplayString(unref(itemToDelete).semaine_debut) + "/" + toDisplayString(unref(itemToDelete).annee_debut) + " ", 1),
                      unref(itemToDelete).semaine_fin ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                        createTextVNode(" → S" + toDisplayString(unref(itemToDelete).semaine_fin) + "/" + toDisplayString(unref(itemToDelete).annee_fin), 1)
                      ], 64)) : createCommentVNode("", true)
                    ])
                  ]),
                  createVNode("p", { class: "truncate text-sm text-gray-600 dark:text-gray-400" }, toDisplayString(unref(itemToDelete).contenu), 1)
                ])) : createCommentVNode("", true),
                createVNode("div", { class: "flex justify-center gap-3" }, [
                  createVNode(_component_AppButtonValidated, {
                    theme: "cancel",
                    type: "button",
                    onClick: closeDeleteModal
                  }, {
                    default: withCtx(() => [
                      createTextVNode("Annuler")
                    ]),
                    _: 1
                  }),
                  createVNode(_component_AppButtonValidated, {
                    theme: "danger",
                    type: "button",
                    validated: true,
                    onClick: confirmDelete
                  }, {
                    default: withCtx(() => [
                      createVNode("span", { class: "flex items-center gap-2" }, [
                        createVNode(_component_Icon, {
                          name: "lucide:trash-2",
                          size: "16"
                        }),
                        createTextVNode(" Supprimer ")
                      ])
                    ]),
                    _: 1
                  })
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
const _sfc_setup$g = _sfc_main$g.setup;
_sfc_main$g.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/chantier/timeline.vue");
  return _sfc_setup$g ? _sfc_setup$g(props, ctx) : void 0;
};
const _sfc_main$f = {
  __name: "ChantierEtudesDocumentsExecution",
  __ssrInlineRender: true,
  props: {
    chantier: {
      type: Object,
      required: true
    }
  },
  setup(__props) {
    const props = __props;
    const {
      getDexByChantier,
      addDex,
      updateDex,
      deleteDex,
      getDocumentStatus,
      getDateRc,
      formatDate,
      getDaysRemaining
    } = useEtudes();
    const { setLoader } = useLoader();
    const showSlideOver = ref(false);
    const editMode = ref(false);
    const editingItem = ref(null);
    const showDeleteModal = ref(false);
    const itemToDelete = ref(null);
    const documents = ref([]);
    const form = ref({
      indice: "",
      titre: "",
      date_prevu: [],
      date_mes: null,
      date_recu: null,
      observation: ""
    });
    const newDatePrevu = ref(null);
    const sortedDocuments = computed(() => {
      return [...documents.value].sort((a, b) => {
        return a.indice.localeCompare(b.indice, "fr", { numeric: true });
      });
    });
    const stats = computed(() => {
      const total = documents.value.length;
      const received = documents.value.filter((d) => d.date_recu).length;
      const overdue = documents.value.filter((d) => {
        const status = getDocumentStatus(d, true);
        return status.status === "overdue";
      }).length;
      const attention = documents.value.filter((d) => {
        const status = getDocumentStatus(d, true);
        return status.status === "attention";
      }).length;
      return { total, received, overdue, attention };
    });
    const loadDocuments = async () => {
      if (props.chantier?.id) {
        documents.value = await getDexByChantier(props.chantier.id);
      }
    };
    const toDateForDB = (timestamp) => {
      if (!timestamp) return null;
      const d = new Date(timestamp);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };
    const openAddSlideOver = () => {
      editMode.value = false;
      editingItem.value = null;
      form.value = {
        indice: "",
        titre: "",
        date_prevu: [],
        date_mes: null,
        date_recu: null,
        observation: ""
      };
      newDatePrevu.value = null;
      showSlideOver.value = true;
    };
    const closeSlideOver = () => {
      showSlideOver.value = false;
      editMode.value = false;
      editingItem.value = null;
    };
    const addDatePrevu = () => {
      if (newDatePrevu.value) {
        const dateStr = toDateForDB(newDatePrevu.value);
        if (dateStr && !form.value.date_prevu.includes(dateStr)) {
          form.value.date_prevu.push(dateStr);
        }
        newDatePrevu.value = null;
      }
    };
    const removeDatePrevu = (index) => {
      form.value.date_prevu.splice(index, 1);
    };
    const handleSave = async () => {
      if (!form.value.indice) return;
      setLoader(true);
      try {
        const data = {
          indice: form.value.indice,
          titre: form.value.titre || null,
          date_prevu: form.value.date_prevu,
          date_mes: toDateForDB(form.value.date_mes),
          date_recu: toDateForDB(form.value.date_recu),
          observation: form.value.observation || null
        };
        if (editMode.value && editingItem.value) {
          const result = await updateDex(editingItem.value.id, data);
          if (result) {
            await loadDocuments();
            closeSlideOver();
          }
        } else {
          const result = await addDex(props.chantier.id, data);
          if (result) {
            await loadDocuments();
            closeSlideOver();
          }
        }
      } finally {
        setLoader(false);
      }
    };
    const closeDeleteModal = () => {
      showDeleteModal.value = false;
      itemToDelete.value = null;
    };
    const confirmDelete = async () => {
      if (!itemToDelete.value) return;
      setLoader(true);
      try {
        const success = await deleteDex(itemToDelete.value.id);
        if (success) {
          await loadDocuments();
          closeDeleteModal();
        }
      } finally {
        setLoader(false);
      }
    };
    const getStatusClasses = (status) => {
      const colors = {
        received: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
        attention: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
        overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
        pending: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-600"
      };
      return colors[status] || colors.pending;
    };
    const getCardClasses = (status) => {
      const colors = {
        received: "border-l-emerald-500",
        attention: "border-l-amber-500",
        overdue: "border-l-red-500",
        pending: "border-l-gray-300 dark:border-l-gray-600"
      };
      return colors[status] || colors.pending;
    };
    const getPreviousStatusLabel = (previousStatus) => {
      if (!previousStatus) return "";
      const labels = {
        pending: "dans les temps",
        attention: "avec retard sur prévision",
        overdue: "après la date RC"
      };
      return labels[previousStatus.status] || "";
    };
    const getSortedDates = (doc) => {
      const dates = [];
      if (doc.date_prevu && doc.date_prevu.length > 0) {
        doc.date_prevu.forEach((dateP, idx) => {
          dates.push({
            type: "prevu",
            label: "Prévu",
            date: dateP,
            sortDate: new Date(dateP),
            daysRemaining: getDaysRemaining(dateP)
          });
        });
      }
      if (doc.date_mes) {
        const rcDate = getDateRc(doc.date_mes);
        dates.push({
          type: "rc",
          label: "RC",
          date: rcDate,
          sortDate: new Date(rcDate),
          daysRemaining: getDaysRemaining(rcDate)
        });
      }
      if (doc.date_mes) {
        dates.push({
          type: "mes",
          label: "MES",
          date: doc.date_mes,
          sortDate: new Date(doc.date_mes),
          daysRemaining: getDaysRemaining(doc.date_mes)
        });
      }
      if (doc.date_recu) {
        dates.push({
          type: "recu",
          label: "Reçu",
          date: doc.date_recu,
          sortDate: new Date(doc.date_recu),
          daysRemaining: null
        });
      }
      return dates.sort((a, b) => a.sortDate - b.sortDate);
    };
    watch(() => props.chantier?.id, loadDocuments);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppTitleMain = _sfc_main$o;
      const _component_AppButtonValidated = _sfc_main$2$1;
      const _component_Icon = __nuxt_component_1;
      const _component_AppSlideOver = _sfc_main$1$1;
      const _component_AppSlideOverContent = _sfc_main$p;
      const _component_AppInput = _sfc_main$1$2;
      const _component_AppDatePicker = __nuxt_component_6$1;
      const _component_AppModal = _sfc_main$r;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-4" }, _attrs))}><div class="flex flex-col lg:flex-row gap-4 items-center justify-between">`);
      _push(ssrRenderComponent(_component_AppTitleMain, {
        title: "Documents d'exécution",
        description: "Suivi des DEX du chantier"
      }, null, _parent));
      _push(ssrRenderComponent(_component_AppButtonValidated, {
        type: "button",
        theme: "primary",
        onClick: openAddSlideOver
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<span class="flex items-center gap-2"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:plus",
              size: "16"
            }, null, _parent2, _scopeId));
            _push2(` Ajouter un DEX </span>`);
          } else {
            return [
              createVNode("span", { class: "flex items-center gap-2" }, [
                createVNode(_component_Icon, {
                  name: "lucide:plus",
                  size: "16"
                }),
                createTextVNode(" Ajouter un DEX ")
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="grid grid-cols-2 md:grid-cols-4 gap-3"><div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"><div class="flex items-center gap-3"><div class="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700">`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:file-text",
        size: "20",
        class: "text-gray-600 dark:text-gray-400"
      }, null, _parent));
      _push(`</div><div><p class="text-2xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(unref(stats).total)}</p><p class="text-xs text-gray-500 dark:text-gray-400">Total</p></div></div></div><div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"><div class="flex items-center gap-3"><div class="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:check-circle-2",
        size: "20",
        class: "text-emerald-600 dark:text-emerald-400"
      }, null, _parent));
      _push(`</div><div><p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${ssrInterpolate(unref(stats).received)}</p><p class="text-xs text-gray-500 dark:text-gray-400">Reçus</p></div></div></div><div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"><div class="flex items-center gap-3"><div class="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30">`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:alert-triangle",
        size: "20",
        class: "text-amber-600 dark:text-amber-400"
      }, null, _parent));
      _push(`</div><div><p class="text-2xl font-bold text-amber-600 dark:text-amber-400">${ssrInterpolate(unref(stats).attention)}</p><p class="text-xs text-gray-500 dark:text-gray-400">Attention</p></div></div></div><div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"><div class="flex items-center gap-3"><div class="flex items-center justify-center w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30">`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:alert-circle",
        size: "20",
        class: "text-red-600 dark:text-red-400"
      }, null, _parent));
      _push(`</div><div><p class="text-2xl font-bold text-red-600 dark:text-red-400">${ssrInterpolate(unref(stats).overdue)}</p><p class="text-xs text-gray-500 dark:text-gray-400">En retard</p></div></div></div></div><div class="bg-white h-full min-h-full dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700"><div class="p-6"><div class="flex items-center gap-3 mb-6"><div class="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-indigo-100 to-purple-200 dark:from-indigo-900/50 dark:to-purple-800/50">`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:file-text",
        size: "20",
        class: "text-indigo-600 dark:text-indigo-400"
      }, null, _parent));
      _push(`</div><div><h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">Liste des DEX</h2><p class="text-xs text-gray-500 dark:text-gray-400">${ssrInterpolate(unref(sortedDocuments).length)} document${ssrInterpolate(unref(sortedDocuments).length > 1 ? "s" : "")}</p></div></div><div class="flex flex-wrap items-center gap-4 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700"><span class="text-xs font-medium text-gray-500 dark:text-gray-400">Légende :</span><div class="flex items-center gap-1.5"><div class="w-3 h-3 rounded-full bg-emerald-500"></div><span class="text-xs text-gray-600 dark:text-gray-400">Reçu</span></div><div class="flex items-center gap-1.5"><div class="w-3 h-3 rounded-full bg-gray-400"></div><span class="text-xs text-gray-600 dark:text-gray-400">En attente</span></div><div class="flex items-center gap-1.5"><div class="w-3 h-3 rounded-full bg-amber-500"></div><span class="text-xs text-gray-600 dark:text-gray-400">Attention (date prévue dépassée)</span></div><div class="flex items-center gap-1.5"><div class="w-3 h-3 rounded-full bg-red-500"></div><span class="text-xs text-gray-600 dark:text-gray-400">En retard (date RC dépassée)</span></div></div>`);
      if (unref(sortedDocuments).length > 0) {
        _push(`<div class="space-y-3"><!--[-->`);
        ssrRenderList(unref(sortedDocuments), (doc) => {
          _push(`<div class="${ssrRenderClass([getCardClasses(unref(getDocumentStatus)(doc, true).status), "group relative p-4 rounded-lg border border-gray-200 dark:border-gray-700 border-l-4 transition-all duration-200 hover:shadow-md cursor-pointer"])}"><div class="flex flex-col md:flex-row md:items-center gap-4"><div class="flex-1 min-w-0"><div class="flex items-center gap-3 mb-1 flex-wrap"><span class="font-mono text-lg font-bold text-gray-900 dark:text-white">${ssrInterpolate(doc.indice)}</span><span class="${ssrRenderClass([getStatusClasses(unref(getDocumentStatus)(doc, true).status), "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border"])}">`);
          _push(ssrRenderComponent(_component_Icon, {
            name: unref(getDocumentStatus)(doc, true).icon,
            size: "12"
          }, null, _parent));
          _push(` ${ssrInterpolate(unref(getDocumentStatus)(doc, true).label)}</span>`);
          if (unref(getDocumentStatus)(doc, true).status === "received" && unref(getDocumentStatus)(doc, true).previousStatus) {
            _push(`<span class="${ssrRenderClass([getStatusClasses(unref(getDocumentStatus)(doc, true).previousStatus.status), "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium"])}">${ssrInterpolate(getPreviousStatusLabel(unref(getDocumentStatus)(doc, true).previousStatus))}</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
          if (doc.titre) {
            _push(`<p class="text-sm text-gray-600 dark:text-gray-400 truncate">${ssrInterpolate(doc.titre)}</p>`);
          } else {
            _push(`<!---->`);
          }
          if (doc.observation) {
            _push(`<p class="mt-2 text-xs text-gray-500 dark:text-gray-400 italic line-clamp-2">${ssrInterpolate(doc.observation)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><div class="flex items-stretch gap-0.5 text-xs self-stretch"><!--[-->`);
          ssrRenderList(getSortedDates(doc), (dateItem, idx) => {
            _push(`<div class="${ssrRenderClass([[
              dateItem.type === "prevu" ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300" : "",
              dateItem.type === "rc" && (!doc.date_recu && unref(getDaysRemaining)(dateItem.date) < 0) ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300" : "",
              dateItem.type === "rc" && !(!doc.date_recu && unref(getDaysRemaining)(dateItem.date) < 0) ? "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300" : "",
              dateItem.type === "mes" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" : "",
              dateItem.type === "recu" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300" : "",
              idx === 0 ? "rounded-l-lg" : "",
              idx === getSortedDates(doc).length - 1 ? "rounded-r-lg" : ""
            ], "flex flex-col items-center justify-center px-3 min-w-[70px]"])}"><span class="${ssrRenderClass([[
              dateItem.type === "prevu" ? "text-purple-500" : "",
              dateItem.type === "rc" && (!doc.date_recu && unref(getDaysRemaining)(dateItem.date) < 0) ? "text-red-500" : "",
              dateItem.type === "rc" && !(!doc.date_recu && unref(getDaysRemaining)(dateItem.date) < 0) ? "text-orange-500" : "",
              dateItem.type === "mes" ? "text-blue-500" : "",
              dateItem.type === "recu" ? "text-emerald-500" : ""
            ], "uppercase tracking-wider font-medium text-xs"])}">${ssrInterpolate(dateItem.label)}</span><span class="font-semibold">${ssrInterpolate(unref(formatDate)(dateItem.date))}</span>`);
            if (dateItem.daysRemaining !== null && !doc.date_recu && dateItem.type !== "recu") {
              _push(`<span class="${ssrRenderClass([dateItem.daysRemaining < 0 ? "text-red-500" : dateItem.daysRemaining <= 60 ? "text-amber-600" : "text-gray-400", "text-xs italic"])}">${ssrInterpolate(dateItem.daysRemaining < 0 ? dateItem.type === "rc" ? "Dépassé" : `${Math.abs(dateItem.daysRemaining)}j retard` : `J-${dateItem.daysRemaining}`)}</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          });
          _push(`<!--]--></div><div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors">`);
          _push(ssrRenderComponent(_component_Icon, {
            name: "lucide:trash-2",
            size: "16"
          }, null, _parent));
          _push(`</button></div></div></div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<div class="text-center py-12"><div class="relative inline-block"><div class="absolute inset-0 bg-linear-to-br from-indigo-200 to-purple-200 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full blur-2xl opacity-50"></div>`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:file-plus",
          size: "64",
          class: "relative text-gray-300 dark:text-gray-600"
        }, null, _parent));
        _push(`</div><p class="mt-4 text-lg font-medium text-gray-500 dark:text-gray-400"> Aucun document d&#39;exécution </p><p class="text-sm text-gray-400 dark:text-gray-500 mt-1"> Ajoutez des DEX pour suivre leur avancement </p><button class="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors">`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:plus",
          size: "16"
        }, null, _parent));
        _push(` Ajouter un DEX </button></div>`);
      }
      _push(`</div></div>`);
      _push(ssrRenderComponent(_component_AppSlideOver, {
        sideModal: unref(showSlideOver),
        closeSideModal: closeSlideOver
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (unref(showSlideOver)) {
              _push2(ssrRenderComponent(_component_AppSlideOverContent, { closeSideModal: closeSlideOver }, {
                header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<h2 class="text-3xl font-[Pacifico] text-gray-800 dark:text-white"${_scopeId2}>${ssrInterpolate(unref(editMode) ? "Modifier" : "Ajouter")} un DEX </h2><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId2}>${ssrInterpolate(unref(editMode) ? "Modifiez les informations du document" : "Ajoutez un nouveau document d'exécution")}</p>`);
                  } else {
                    return [
                      createVNode("h2", { class: "text-3xl font-[Pacifico] text-gray-800 dark:text-white" }, toDisplayString(unref(editMode) ? "Modifier" : "Ajouter") + " un DEX ", 1),
                      createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, toDisplayString(unref(editMode) ? "Modifiez les informations du document" : "Ajoutez un nouveau document d'exécution"), 1)
                    ];
                  }
                }),
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<form class="space-y-6"${_scopeId2}><div class="space-y-4"${_scopeId2}><div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:tag",
                      size: "16",
                      class: "text-primary-500"
                    }, null, _parent3, _scopeId2));
                    _push3(`<h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"${_scopeId2}>Identification</h3></div>`);
                    _push3(ssrRenderComponent(_component_AppInput, {
                      modelValue: unref(form).indice,
                      "onUpdate:modelValue": ($event) => unref(form).indice = $event,
                      name: "indice",
                      title: "Indice *",
                      placeholder: "Ex: DEX-001"
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppInput, {
                      modelValue: unref(form).titre,
                      "onUpdate:modelValue": ($event) => unref(form).titre = $event,
                      name: "titre",
                      title: "Titre",
                      placeholder: "Description du document"
                    }, null, _parent3, _scopeId2));
                    _push3(`</div><div class="space-y-4"${_scopeId2}><div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:calendar",
                      size: "16",
                      class: "text-primary-500"
                    }, null, _parent3, _scopeId2));
                    _push3(`<h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"${_scopeId2}>Dates</h3></div><div class="grid grid-cols-1 md:grid-cols-2 gap-4"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_AppDatePicker, {
                      modelValue: unref(form).date_mes,
                      "onUpdate:modelValue": ($event) => unref(form).date_mes = $event,
                      title: "Date MES",
                      placeholder: "Date de mise en service",
                      clearable: ""
                    }, null, _parent3, _scopeId2));
                    if (unref(form).date_mes) {
                      _push3(`<div class="flex flex-col"${_scopeId2}><label class="block text-sm mb-0.5 text-red-600 dark:text-red-400 font-medium"${_scopeId2}>Date RC (calculée)</label><div class="flex items-center gap-2 px-3 py-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"${_scopeId2}>`);
                      _push3(ssrRenderComponent(_component_Icon, {
                        name: "lucide:alert-circle",
                        size: "16",
                        class: "text-red-500"
                      }, null, _parent3, _scopeId2));
                      _push3(`<span class="font-semibold text-red-700 dark:text-red-400"${_scopeId2}>${ssrInterpolate(unref(formatDate)(unref(getDateRc)(new Date(unref(form).date_mes))))}</span><span class="text-xs text-red-600 dark:text-red-500"${_scopeId2}>(2 mois avant MES)</span></div></div>`);
                    } else {
                      _push3(`<!---->`);
                    }
                    _push3(`</div>`);
                    _push3(ssrRenderComponent(_component_AppDatePicker, {
                      modelValue: unref(form).date_recu,
                      "onUpdate:modelValue": ($event) => unref(form).date_recu = $event,
                      title: "Date de réception",
                      placeholder: "Date de réception",
                      clearable: ""
                    }, null, _parent3, _scopeId2));
                    _push3(`</div><div class="space-y-4"${_scopeId2}><div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:calendar-range",
                      size: "16",
                      class: "text-primary-500"
                    }, null, _parent3, _scopeId2));
                    _push3(`<h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"${_scopeId2}>Dates prévues</h3></div>`);
                    if (unref(form).date_prevu.length > 0) {
                      _push3(`<div class="flex flex-wrap gap-2"${_scopeId2}><!--[-->`);
                      ssrRenderList(unref(form).date_prevu, (dateP, idx) => {
                        _push3(`<div class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm"${_scopeId2}>`);
                        _push3(ssrRenderComponent(_component_Icon, {
                          name: "lucide:calendar",
                          size: "14",
                          class: "text-gray-500"
                        }, null, _parent3, _scopeId2));
                        _push3(`<span class="text-gray-700 dark:text-gray-300"${_scopeId2}>${ssrInterpolate(unref(formatDate)(dateP))}</span><button type="button" class="ml-1 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"${_scopeId2}>`);
                        _push3(ssrRenderComponent(_component_Icon, {
                          name: "lucide:x",
                          size: "12"
                        }, null, _parent3, _scopeId2));
                        _push3(`</button></div>`);
                      });
                      _push3(`<!--]--></div>`);
                    } else {
                      _push3(`<p class="text-sm text-gray-400 italic"${_scopeId2}>Aucune date prévue</p>`);
                    }
                    _push3(`<div class="flex items-end gap-2"${_scopeId2}><div class="flex-1"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_AppDatePicker, {
                      modelValue: unref(newDatePrevu),
                      "onUpdate:modelValue": ($event) => isRef(newDatePrevu) ? newDatePrevu.value = $event : null,
                      title: "Nouvelle date prévue",
                      placeholder: "Sélectionner...",
                      clearable: ""
                    }, null, _parent3, _scopeId2));
                    _push3(`</div><button type="button"${ssrIncludeBooleanAttr(!unref(newDatePrevu)) ? " disabled" : ""} class="${ssrRenderClass([unref(newDatePrevu) ? "bg-linear-to-br from-indigo-300 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white cursor-pointer" : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed", "shrink-0 h-9 w-9 flex items-center justify-center rounded-lg transition-colors"])}"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:plus",
                      size: "18"
                    }, null, _parent3, _scopeId2));
                    _push3(`</button></div></div><div class="space-y-4"${_scopeId2}><div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:message-square",
                      size: "16",
                      class: "text-primary-500"
                    }, null, _parent3, _scopeId2));
                    _push3(`<h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"${_scopeId2}>Observation</h3></div><div class="w-full"${_scopeId2}><textarea rows="3" class="appearance-none border border-gray-300 dark:border-gray-600 text-sm rounded-md py-2 px-3 w-full text-gray-700 dark:text-gray-200 dark:bg-gray-800 leading-tight focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none" placeholder="Notes, remarques..."${_scopeId2}>${ssrInterpolate(unref(form).observation)}</textarea></div></div></form>`);
                  } else {
                    return [
                      createVNode("form", {
                        onSubmit: withModifiers(handleSave, ["prevent"]),
                        class: "space-y-6"
                      }, [
                        createVNode("div", { class: "space-y-4" }, [
                          createVNode("div", { class: "flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700" }, [
                            createVNode(_component_Icon, {
                              name: "lucide:tag",
                              size: "16",
                              class: "text-primary-500"
                            }),
                            createVNode("h3", { class: "text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider" }, "Identification")
                          ]),
                          createVNode(_component_AppInput, {
                            modelValue: unref(form).indice,
                            "onUpdate:modelValue": ($event) => unref(form).indice = $event,
                            name: "indice",
                            title: "Indice *",
                            placeholder: "Ex: DEX-001"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                          createVNode(_component_AppInput, {
                            modelValue: unref(form).titre,
                            "onUpdate:modelValue": ($event) => unref(form).titre = $event,
                            name: "titre",
                            title: "Titre",
                            placeholder: "Description du document"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ]),
                        createVNode("div", { class: "space-y-4" }, [
                          createVNode("div", { class: "flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700" }, [
                            createVNode(_component_Icon, {
                              name: "lucide:calendar",
                              size: "16",
                              class: "text-primary-500"
                            }),
                            createVNode("h3", { class: "text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider" }, "Dates")
                          ]),
                          createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-4" }, [
                            createVNode(_component_AppDatePicker, {
                              modelValue: unref(form).date_mes,
                              "onUpdate:modelValue": ($event) => unref(form).date_mes = $event,
                              title: "Date MES",
                              placeholder: "Date de mise en service",
                              clearable: ""
                            }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                            unref(form).date_mes ? (openBlock(), createBlock("div", {
                              key: 0,
                              class: "flex flex-col"
                            }, [
                              createVNode("label", { class: "block text-sm mb-0.5 text-red-600 dark:text-red-400 font-medium" }, "Date RC (calculée)"),
                              createVNode("div", { class: "flex items-center gap-2 px-3 py-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800" }, [
                                createVNode(_component_Icon, {
                                  name: "lucide:alert-circle",
                                  size: "16",
                                  class: "text-red-500"
                                }),
                                createVNode("span", { class: "font-semibold text-red-700 dark:text-red-400" }, toDisplayString(unref(formatDate)(unref(getDateRc)(new Date(unref(form).date_mes)))), 1),
                                createVNode("span", { class: "text-xs text-red-600 dark:text-red-500" }, "(2 mois avant MES)")
                              ])
                            ])) : createCommentVNode("", true)
                          ]),
                          createVNode(_component_AppDatePicker, {
                            modelValue: unref(form).date_recu,
                            "onUpdate:modelValue": ($event) => unref(form).date_recu = $event,
                            title: "Date de réception",
                            placeholder: "Date de réception",
                            clearable: ""
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ]),
                        createVNode("div", { class: "space-y-4" }, [
                          createVNode("div", { class: "flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700" }, [
                            createVNode(_component_Icon, {
                              name: "lucide:calendar-range",
                              size: "16",
                              class: "text-primary-500"
                            }),
                            createVNode("h3", { class: "text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider" }, "Dates prévues")
                          ]),
                          unref(form).date_prevu.length > 0 ? (openBlock(), createBlock("div", {
                            key: 0,
                            class: "flex flex-wrap gap-2"
                          }, [
                            (openBlock(true), createBlock(Fragment, null, renderList(unref(form).date_prevu, (dateP, idx) => {
                              return openBlock(), createBlock("div", {
                                key: idx,
                                class: "inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm"
                              }, [
                                createVNode(_component_Icon, {
                                  name: "lucide:calendar",
                                  size: "14",
                                  class: "text-gray-500"
                                }),
                                createVNode("span", { class: "text-gray-700 dark:text-gray-300" }, toDisplayString(unref(formatDate)(dateP)), 1),
                                createVNode("button", {
                                  type: "button",
                                  onClick: ($event) => removeDatePrevu(idx),
                                  class: "ml-1 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                                }, [
                                  createVNode(_component_Icon, {
                                    name: "lucide:x",
                                    size: "12"
                                  })
                                ], 8, ["onClick"])
                              ]);
                            }), 128))
                          ])) : (openBlock(), createBlock("p", {
                            key: 1,
                            class: "text-sm text-gray-400 italic"
                          }, "Aucune date prévue")),
                          createVNode("div", { class: "flex items-end gap-2" }, [
                            createVNode("div", { class: "flex-1" }, [
                              createVNode(_component_AppDatePicker, {
                                modelValue: unref(newDatePrevu),
                                "onUpdate:modelValue": ($event) => isRef(newDatePrevu) ? newDatePrevu.value = $event : null,
                                title: "Nouvelle date prévue",
                                placeholder: "Sélectionner...",
                                clearable: ""
                              }, null, 8, ["modelValue", "onUpdate:modelValue"])
                            ]),
                            createVNode("button", {
                              type: "button",
                              onClick: addDatePrevu,
                              disabled: !unref(newDatePrevu),
                              class: ["shrink-0 h-9 w-9 flex items-center justify-center rounded-lg transition-colors", unref(newDatePrevu) ? "bg-linear-to-br from-indigo-300 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white cursor-pointer" : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"]
                            }, [
                              createVNode(_component_Icon, {
                                name: "lucide:plus",
                                size: "18"
                              })
                            ], 10, ["disabled"])
                          ])
                        ]),
                        createVNode("div", { class: "space-y-4" }, [
                          createVNode("div", { class: "flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700" }, [
                            createVNode(_component_Icon, {
                              name: "lucide:message-square",
                              size: "16",
                              class: "text-primary-500"
                            }),
                            createVNode("h3", { class: "text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider" }, "Observation")
                          ]),
                          createVNode("div", { class: "w-full" }, [
                            withDirectives(createVNode("textarea", {
                              "onUpdate:modelValue": ($event) => unref(form).observation = $event,
                              rows: "3",
                              class: "appearance-none border border-gray-300 dark:border-gray-600 text-sm rounded-md py-2 px-3 w-full text-gray-700 dark:text-gray-200 dark:bg-gray-800 leading-tight focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none",
                              placeholder: "Notes, remarques..."
                            }, null, 8, ["onUpdate:modelValue"]), [
                              [vModelText, unref(form).observation]
                            ])
                          ])
                        ])
                      ], 32)
                    ];
                  }
                }),
                footer: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_AppButtonValidated, {
                      theme: "cancel",
                      type: "button",
                      onClick: closeSlideOver
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`Annuler`);
                        } else {
                          return [
                            createTextVNode("Annuler")
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppButtonValidated, {
                      theme: "primary",
                      type: "button",
                      validated: !!unref(form).indice,
                      onClick: handleSave
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`${ssrInterpolate(unref(editMode) ? "Enregistrer" : "Ajouter")}`);
                        } else {
                          return [
                            createTextVNode(toDisplayString(unref(editMode) ? "Enregistrer" : "Ajouter"), 1)
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(`</div>`);
                  } else {
                    return [
                      createVNode("div", { class: "flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700" }, [
                        createVNode(_component_AppButtonValidated, {
                          theme: "cancel",
                          type: "button",
                          onClick: closeSlideOver
                        }, {
                          default: withCtx(() => [
                            createTextVNode("Annuler")
                          ]),
                          _: 1
                        }),
                        createVNode(_component_AppButtonValidated, {
                          theme: "primary",
                          type: "button",
                          validated: !!unref(form).indice,
                          onClick: handleSave
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(editMode) ? "Enregistrer" : "Ajouter"), 1)
                          ]),
                          _: 1
                        }, 8, ["validated"])
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
                closeSideModal: closeSlideOver
              }, {
                header: withCtx(() => [
                  createVNode("h2", { class: "text-3xl font-[Pacifico] text-gray-800 dark:text-white" }, toDisplayString(unref(editMode) ? "Modifier" : "Ajouter") + " un DEX ", 1),
                  createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, toDisplayString(unref(editMode) ? "Modifiez les informations du document" : "Ajoutez un nouveau document d'exécution"), 1)
                ]),
                default: withCtx(() => [
                  createVNode("form", {
                    onSubmit: withModifiers(handleSave, ["prevent"]),
                    class: "space-y-6"
                  }, [
                    createVNode("div", { class: "space-y-4" }, [
                      createVNode("div", { class: "flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700" }, [
                        createVNode(_component_Icon, {
                          name: "lucide:tag",
                          size: "16",
                          class: "text-primary-500"
                        }),
                        createVNode("h3", { class: "text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider" }, "Identification")
                      ]),
                      createVNode(_component_AppInput, {
                        modelValue: unref(form).indice,
                        "onUpdate:modelValue": ($event) => unref(form).indice = $event,
                        name: "indice",
                        title: "Indice *",
                        placeholder: "Ex: DEX-001"
                      }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                      createVNode(_component_AppInput, {
                        modelValue: unref(form).titre,
                        "onUpdate:modelValue": ($event) => unref(form).titre = $event,
                        name: "titre",
                        title: "Titre",
                        placeholder: "Description du document"
                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                    ]),
                    createVNode("div", { class: "space-y-4" }, [
                      createVNode("div", { class: "flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700" }, [
                        createVNode(_component_Icon, {
                          name: "lucide:calendar",
                          size: "16",
                          class: "text-primary-500"
                        }),
                        createVNode("h3", { class: "text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider" }, "Dates")
                      ]),
                      createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-4" }, [
                        createVNode(_component_AppDatePicker, {
                          modelValue: unref(form).date_mes,
                          "onUpdate:modelValue": ($event) => unref(form).date_mes = $event,
                          title: "Date MES",
                          placeholder: "Date de mise en service",
                          clearable: ""
                        }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                        unref(form).date_mes ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "flex flex-col"
                        }, [
                          createVNode("label", { class: "block text-sm mb-0.5 text-red-600 dark:text-red-400 font-medium" }, "Date RC (calculée)"),
                          createVNode("div", { class: "flex items-center gap-2 px-3 py-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800" }, [
                            createVNode(_component_Icon, {
                              name: "lucide:alert-circle",
                              size: "16",
                              class: "text-red-500"
                            }),
                            createVNode("span", { class: "font-semibold text-red-700 dark:text-red-400" }, toDisplayString(unref(formatDate)(unref(getDateRc)(new Date(unref(form).date_mes)))), 1),
                            createVNode("span", { class: "text-xs text-red-600 dark:text-red-500" }, "(2 mois avant MES)")
                          ])
                        ])) : createCommentVNode("", true)
                      ]),
                      createVNode(_component_AppDatePicker, {
                        modelValue: unref(form).date_recu,
                        "onUpdate:modelValue": ($event) => unref(form).date_recu = $event,
                        title: "Date de réception",
                        placeholder: "Date de réception",
                        clearable: ""
                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                    ]),
                    createVNode("div", { class: "space-y-4" }, [
                      createVNode("div", { class: "flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700" }, [
                        createVNode(_component_Icon, {
                          name: "lucide:calendar-range",
                          size: "16",
                          class: "text-primary-500"
                        }),
                        createVNode("h3", { class: "text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider" }, "Dates prévues")
                      ]),
                      unref(form).date_prevu.length > 0 ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "flex flex-wrap gap-2"
                      }, [
                        (openBlock(true), createBlock(Fragment, null, renderList(unref(form).date_prevu, (dateP, idx) => {
                          return openBlock(), createBlock("div", {
                            key: idx,
                            class: "inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm"
                          }, [
                            createVNode(_component_Icon, {
                              name: "lucide:calendar",
                              size: "14",
                              class: "text-gray-500"
                            }),
                            createVNode("span", { class: "text-gray-700 dark:text-gray-300" }, toDisplayString(unref(formatDate)(dateP)), 1),
                            createVNode("button", {
                              type: "button",
                              onClick: ($event) => removeDatePrevu(idx),
                              class: "ml-1 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                            }, [
                              createVNode(_component_Icon, {
                                name: "lucide:x",
                                size: "12"
                              })
                            ], 8, ["onClick"])
                          ]);
                        }), 128))
                      ])) : (openBlock(), createBlock("p", {
                        key: 1,
                        class: "text-sm text-gray-400 italic"
                      }, "Aucune date prévue")),
                      createVNode("div", { class: "flex items-end gap-2" }, [
                        createVNode("div", { class: "flex-1" }, [
                          createVNode(_component_AppDatePicker, {
                            modelValue: unref(newDatePrevu),
                            "onUpdate:modelValue": ($event) => isRef(newDatePrevu) ? newDatePrevu.value = $event : null,
                            title: "Nouvelle date prévue",
                            placeholder: "Sélectionner...",
                            clearable: ""
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ]),
                        createVNode("button", {
                          type: "button",
                          onClick: addDatePrevu,
                          disabled: !unref(newDatePrevu),
                          class: ["shrink-0 h-9 w-9 flex items-center justify-center rounded-lg transition-colors", unref(newDatePrevu) ? "bg-linear-to-br from-indigo-300 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white cursor-pointer" : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"]
                        }, [
                          createVNode(_component_Icon, {
                            name: "lucide:plus",
                            size: "18"
                          })
                        ], 10, ["disabled"])
                      ])
                    ]),
                    createVNode("div", { class: "space-y-4" }, [
                      createVNode("div", { class: "flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700" }, [
                        createVNode(_component_Icon, {
                          name: "lucide:message-square",
                          size: "16",
                          class: "text-primary-500"
                        }),
                        createVNode("h3", { class: "text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider" }, "Observation")
                      ]),
                      createVNode("div", { class: "w-full" }, [
                        withDirectives(createVNode("textarea", {
                          "onUpdate:modelValue": ($event) => unref(form).observation = $event,
                          rows: "3",
                          class: "appearance-none border border-gray-300 dark:border-gray-600 text-sm rounded-md py-2 px-3 w-full text-gray-700 dark:text-gray-200 dark:bg-gray-800 leading-tight focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none",
                          placeholder: "Notes, remarques..."
                        }, null, 8, ["onUpdate:modelValue"]), [
                          [vModelText, unref(form).observation]
                        ])
                      ])
                    ])
                  ], 32)
                ]),
                footer: withCtx(() => [
                  createVNode("div", { class: "flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700" }, [
                    createVNode(_component_AppButtonValidated, {
                      theme: "cancel",
                      type: "button",
                      onClick: closeSlideOver
                    }, {
                      default: withCtx(() => [
                        createTextVNode("Annuler")
                      ]),
                      _: 1
                    }),
                    createVNode(_component_AppButtonValidated, {
                      theme: "primary",
                      type: "button",
                      validated: !!unref(form).indice,
                      onClick: handleSave
                    }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(unref(editMode) ? "Enregistrer" : "Ajouter"), 1)
                      ]),
                      _: 1
                    }, 8, ["validated"])
                  ])
                ]),
                _: 1
              })) : createCommentVNode("", true)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_AppModal, {
        modelValue: unref(showDeleteModal),
        "onUpdate:modelValue": ($event) => isRef(showDeleteModal) ? showDeleteModal.value = $event : null,
        size: "lg",
        showCloseButton: false
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="p-6 text-center"${_scopeId}><div class="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:alert-triangle",
              size: "32",
              class: "text-red-500"
            }, null, _parent2, _scopeId));
            _push2(`</div><h3 class="text-xl font-bold text-gray-800 dark:text-white mb-2"${_scopeId}> Supprimer ce document ? </h3><p class="text-gray-500 dark:text-gray-400 mb-2"${_scopeId}> Cette action est irréversible. </p>`);
            if (unref(itemToDelete)) {
              _push2(`<div class="mb-6 p-3 rounded-lg bg-gray-100 dark:bg-gray-700/50"${_scopeId}><p class="font-mono font-bold text-gray-700 dark:text-gray-300"${_scopeId}>${ssrInterpolate(unref(itemToDelete).indice)}</p>`);
              if (unref(itemToDelete).titre) {
                _push2(`<p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}>${ssrInterpolate(unref(itemToDelete).titre)}</p>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div class="flex justify-center gap-3"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_AppButtonValidated, {
              theme: "cancel",
              type: "button",
              onClick: closeDeleteModal
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`Annuler`);
                } else {
                  return [
                    createTextVNode("Annuler")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_AppButtonValidated, {
              theme: "danger",
              type: "button",
              validated: true,
              onClick: confirmDelete
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<span class="flex items-center gap-2"${_scopeId2}>`);
                  _push3(ssrRenderComponent(_component_Icon, {
                    name: "lucide:trash-2",
                    size: "16"
                  }, null, _parent3, _scopeId2));
                  _push3(` Supprimer </span>`);
                } else {
                  return [
                    createVNode("span", { class: "flex items-center gap-2" }, [
                      createVNode(_component_Icon, {
                        name: "lucide:trash-2",
                        size: "16"
                      }),
                      createTextVNode(" Supprimer ")
                    ])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div></div>`);
          } else {
            return [
              createVNode("div", { class: "p-6 text-center" }, [
                createVNode("div", { class: "mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4" }, [
                  createVNode(_component_Icon, {
                    name: "lucide:alert-triangle",
                    size: "32",
                    class: "text-red-500"
                  })
                ]),
                createVNode("h3", { class: "text-xl font-bold text-gray-800 dark:text-white mb-2" }, " Supprimer ce document ? "),
                createVNode("p", { class: "text-gray-500 dark:text-gray-400 mb-2" }, " Cette action est irréversible. "),
                unref(itemToDelete) ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "mb-6 p-3 rounded-lg bg-gray-100 dark:bg-gray-700/50"
                }, [
                  createVNode("p", { class: "font-mono font-bold text-gray-700 dark:text-gray-300" }, toDisplayString(unref(itemToDelete).indice), 1),
                  unref(itemToDelete).titre ? (openBlock(), createBlock("p", {
                    key: 0,
                    class: "text-sm text-gray-500 dark:text-gray-400"
                  }, toDisplayString(unref(itemToDelete).titre), 1)) : createCommentVNode("", true)
                ])) : createCommentVNode("", true),
                createVNode("div", { class: "flex justify-center gap-3" }, [
                  createVNode(_component_AppButtonValidated, {
                    theme: "cancel",
                    type: "button",
                    onClick: closeDeleteModal
                  }, {
                    default: withCtx(() => [
                      createTextVNode("Annuler")
                    ]),
                    _: 1
                  }),
                  createVNode(_component_AppButtonValidated, {
                    theme: "danger",
                    type: "button",
                    validated: true,
                    onClick: confirmDelete
                  }, {
                    default: withCtx(() => [
                      createVNode("span", { class: "flex items-center gap-2" }, [
                        createVNode(_component_Icon, {
                          name: "lucide:trash-2",
                          size: "16"
                        }),
                        createTextVNode(" Supprimer ")
                      ])
                    ]),
                    _: 1
                  })
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
const _sfc_setup$f = _sfc_main$f.setup;
_sfc_main$f.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/chantier/etudes/documentsExecution.vue");
  return _sfc_setup$f ? _sfc_setup$f(props, ctx) : void 0;
};
const _sfc_main$e = {
  __name: "ChantierEtudesPlansTechniques",
  __ssrInlineRender: true,
  props: {
    chantier: {
      type: Object,
      required: true
    }
  },
  setup(__props) {
    const props = __props;
    const {
      getPtByChantier,
      addPt,
      updatePt,
      deletePt,
      getPtStatus,
      formatDate,
      getDaysRemaining
    } = useEtudes();
    const { setLoader } = useLoader();
    const showSlideOver = ref(false);
    const editMode = ref(false);
    const editingItem = ref(null);
    const showDeleteModal = ref(false);
    const itemToDelete = ref(null);
    const plans = ref([]);
    const form = ref({
      indice: "",
      titre: "",
      date_prevu: [],
      date_mes: null,
      date_recu: null,
      observation: ""
    });
    const newDatePrevu = ref(null);
    const sortedPlans = computed(() => {
      return [...plans.value].sort((a, b) => {
        return a.indice.localeCompare(b.indice, "fr", { numeric: true });
      });
    });
    const stats = computed(() => {
      const total = plans.value.length;
      const received = plans.value.filter((p) => p.date_recu).length;
      const overdue = plans.value.filter((p) => {
        const status = getPtStatus(p);
        return status.status === "overdue";
      }).length;
      const attention = plans.value.filter((p) => {
        const status = getPtStatus(p);
        return status.status === "attention";
      }).length;
      return { total, received, overdue, attention };
    });
    const loadPlans = async () => {
      if (props.chantier?.id) {
        plans.value = await getPtByChantier(props.chantier.id);
      }
    };
    const toDateForDB = (timestamp) => {
      if (!timestamp) return null;
      const d = new Date(timestamp);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };
    const openAddSlideOver = () => {
      editMode.value = false;
      editingItem.value = null;
      form.value = {
        indice: "",
        titre: "",
        date_prevu: [],
        date_mes: null,
        date_recu: null,
        observation: ""
      };
      newDatePrevu.value = null;
      showSlideOver.value = true;
    };
    const closeSlideOver = () => {
      showSlideOver.value = false;
      editMode.value = false;
      editingItem.value = null;
    };
    const addDatePrevu = () => {
      if (newDatePrevu.value) {
        const dateStr = toDateForDB(newDatePrevu.value);
        if (dateStr && !form.value.date_prevu.includes(dateStr)) {
          form.value.date_prevu.push(dateStr);
        }
        newDatePrevu.value = null;
      }
    };
    const removeDatePrevu = (index) => {
      form.value.date_prevu.splice(index, 1);
    };
    const handleSave = async () => {
      if (!form.value.indice) return;
      setLoader(true);
      try {
        const data = {
          indice: form.value.indice,
          titre: form.value.titre || null,
          date_prevu: form.value.date_prevu,
          date_mes: toDateForDB(form.value.date_mes),
          date_recu: toDateForDB(form.value.date_recu),
          observation: form.value.observation || null
        };
        if (editMode.value && editingItem.value) {
          const result = await updatePt(editingItem.value.id, data);
          if (result) {
            await loadPlans();
            closeSlideOver();
          }
        } else {
          const result = await addPt(props.chantier.id, data);
          if (result) {
            await loadPlans();
            closeSlideOver();
          }
        }
      } finally {
        setLoader(false);
      }
    };
    const closeDeleteModal = () => {
      showDeleteModal.value = false;
      itemToDelete.value = null;
    };
    const confirmDelete = async () => {
      if (!itemToDelete.value) return;
      setLoader(true);
      try {
        const success = await deletePt(itemToDelete.value.id);
        if (success) {
          await loadPlans();
          closeDeleteModal();
        }
      } finally {
        setLoader(false);
      }
    };
    const getStatusClasses = (status) => {
      const colors = {
        received: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
        attention: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
        overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
        pending: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-600"
      };
      return colors[status] || colors.pending;
    };
    const getCardClasses = (status) => {
      const colors = {
        received: "border-l-emerald-500",
        attention: "border-l-amber-500",
        overdue: "border-l-red-500",
        pending: "border-l-gray-300 dark:border-l-gray-600"
      };
      return colors[status] || colors.pending;
    };
    const getPreviousStatusLabel = (previousStatus) => {
      if (!previousStatus) return "";
      const labels = {
        pending: "dans les temps",
        attention: "avec retard sur prévision",
        overdue: "après la date MES"
      };
      return labels[previousStatus.status] || "";
    };
    const getSortedDates = (plan) => {
      const dates = [];
      if (plan.date_prevu && plan.date_prevu.length > 0) {
        plan.date_prevu.forEach((dateP, idx) => {
          dates.push({
            type: "prevu",
            label: plan.date_prevu.length > 1 ? `Prévu ${idx + 1}` : "Prévu",
            date: dateP,
            sortDate: new Date(dateP),
            daysRemaining: getDaysRemaining(dateP)
          });
        });
      }
      if (plan.date_mes) {
        dates.push({
          type: "mes",
          label: "MES",
          date: plan.date_mes,
          sortDate: new Date(plan.date_mes),
          daysRemaining: getDaysRemaining(plan.date_mes)
        });
      }
      if (plan.date_recu) {
        dates.push({
          type: "recu",
          label: "Reçu",
          date: plan.date_recu,
          sortDate: new Date(plan.date_recu),
          daysRemaining: null
        });
      }
      return dates.sort((a, b) => a.sortDate - b.sortDate);
    };
    watch(() => props.chantier?.id, loadPlans);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppTitleMain = _sfc_main$o;
      const _component_AppButtonValidated = _sfc_main$2$1;
      const _component_Icon = __nuxt_component_1;
      const _component_AppSlideOver = _sfc_main$1$1;
      const _component_AppSlideOverContent = _sfc_main$p;
      const _component_AppInput = _sfc_main$1$2;
      const _component_AppDatePicker = __nuxt_component_6$1;
      const _component_AppModal = _sfc_main$r;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-4" }, _attrs))}><div class="flex flex-col lg:flex-row gap-4 items-center justify-between">`);
      _push(ssrRenderComponent(_component_AppTitleMain, {
        title: "Plans techniques",
        description: "Suivi des PT du chantier"
      }, null, _parent));
      _push(ssrRenderComponent(_component_AppButtonValidated, {
        type: "button",
        theme: "primary",
        onClick: openAddSlideOver
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<span class="flex items-center gap-2"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:plus",
              size: "16"
            }, null, _parent2, _scopeId));
            _push2(` Ajouter un PT </span>`);
          } else {
            return [
              createVNode("span", { class: "flex items-center gap-2" }, [
                createVNode(_component_Icon, {
                  name: "lucide:plus",
                  size: "16"
                }),
                createTextVNode(" Ajouter un PT ")
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="grid grid-cols-2 md:grid-cols-4 gap-3"><div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"><div class="flex items-center gap-3"><div class="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700">`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:map",
        size: "20",
        class: "text-gray-600 dark:text-gray-400"
      }, null, _parent));
      _push(`</div><div><p class="text-2xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(unref(stats).total)}</p><p class="text-xs text-gray-500 dark:text-gray-400">Total</p></div></div></div><div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"><div class="flex items-center gap-3"><div class="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:check-circle-2",
        size: "20",
        class: "text-emerald-600 dark:text-emerald-400"
      }, null, _parent));
      _push(`</div><div><p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${ssrInterpolate(unref(stats).received)}</p><p class="text-xs text-gray-500 dark:text-gray-400">Reçus</p></div></div></div><div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"><div class="flex items-center gap-3"><div class="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30">`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:alert-triangle",
        size: "20",
        class: "text-amber-600 dark:text-amber-400"
      }, null, _parent));
      _push(`</div><div><p class="text-2xl font-bold text-amber-600 dark:text-amber-400">${ssrInterpolate(unref(stats).attention)}</p><p class="text-xs text-gray-500 dark:text-gray-400">Attention</p></div></div></div><div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"><div class="flex items-center gap-3"><div class="flex items-center justify-center w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30">`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:alert-circle",
        size: "20",
        class: "text-red-600 dark:text-red-400"
      }, null, _parent));
      _push(`</div><div><p class="text-2xl font-bold text-red-600 dark:text-red-400">${ssrInterpolate(unref(stats).overdue)}</p><p class="text-xs text-gray-500 dark:text-gray-400">En retard</p></div></div></div></div><div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700"><div class="p-6"><div class="flex items-center gap-3 mb-6"><div class="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-sky-100 to-blue-200 dark:from-sky-900/50 dark:to-blue-800/50">`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:map",
        size: "20",
        class: "text-sky-600 dark:text-sky-400"
      }, null, _parent));
      _push(`</div><div><h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">Liste des PT</h2><p class="text-xs text-gray-500 dark:text-gray-400">${ssrInterpolate(unref(sortedPlans).length)} plan${ssrInterpolate(unref(sortedPlans).length > 1 ? "s" : "")}</p></div></div><div class="flex flex-wrap items-center gap-4 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700"><span class="text-xs font-medium text-gray-500 dark:text-gray-400">Légende :</span><div class="flex items-center gap-1.5"><div class="w-3 h-3 rounded-full bg-emerald-500"></div><span class="text-xs text-gray-600 dark:text-gray-400">Reçu</span></div><div class="flex items-center gap-1.5"><div class="w-3 h-3 rounded-full bg-gray-400"></div><span class="text-xs text-gray-600 dark:text-gray-400">En attente</span></div><div class="flex items-center gap-1.5"><div class="w-3 h-3 rounded-full bg-amber-500"></div><span class="text-xs text-gray-600 dark:text-gray-400">Attention (date prévue dépassée)</span></div><div class="flex items-center gap-1.5"><div class="w-3 h-3 rounded-full bg-red-500"></div><span class="text-xs text-gray-600 dark:text-gray-400">En retard (date MES dépassée)</span></div></div>`);
      if (unref(sortedPlans).length > 0) {
        _push(`<div class="space-y-3"><!--[-->`);
        ssrRenderList(unref(sortedPlans), (plan) => {
          _push(`<div class="${ssrRenderClass([getCardClasses(unref(getPtStatus)(plan).status), "group relative p-4 rounded-lg border border-gray-200 dark:border-gray-700 border-l-4 transition-all duration-200 hover:shadow-md cursor-pointer"])}"><div class="flex flex-col md:flex-row md:items-center gap-4"><div class="flex-1 min-w-0"><div class="flex items-center gap-3 mb-1 flex-wrap"><span class="font-mono text-lg font-bold text-gray-900 dark:text-white">${ssrInterpolate(plan.indice)}</span><span class="${ssrRenderClass([getStatusClasses(unref(getPtStatus)(plan).status), "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border"])}">`);
          _push(ssrRenderComponent(_component_Icon, {
            name: unref(getPtStatus)(plan).icon,
            size: "12"
          }, null, _parent));
          _push(` ${ssrInterpolate(unref(getPtStatus)(plan).label)}</span>`);
          if (unref(getPtStatus)(plan).status === "received" && unref(getPtStatus)(plan).previousStatus) {
            _push(`<span class="${ssrRenderClass([getStatusClasses(unref(getPtStatus)(plan).previousStatus.status), "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"])}">${ssrInterpolate(getPreviousStatusLabel(unref(getPtStatus)(plan).previousStatus))}</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
          if (plan.titre) {
            _push(`<p class="text-sm text-gray-600 dark:text-gray-400 truncate">${ssrInterpolate(plan.titre)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><div class="flex items-stretch gap-0.5 text-xs self-stretch"><!--[-->`);
          ssrRenderList(getSortedDates(plan), (dateItem, idx) => {
            _push(`<div class="${ssrRenderClass([[
              dateItem.type === "prevu" ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300" : "",
              dateItem.type === "mes" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" : "",
              dateItem.type === "recu" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300" : "",
              idx === 0 ? "rounded-l-lg" : "",
              idx === getSortedDates(plan).length - 1 ? "rounded-r-lg" : ""
            ], "flex flex-col items-center justify-center px-3 min-w-[70px]"])}"><span class="${ssrRenderClass([[
              dateItem.type === "prevu" ? "text-purple-500" : "",
              dateItem.type === "mes" ? "text-blue-500" : "",
              dateItem.type === "recu" ? "text-emerald-500" : ""
            ], "uppercase tracking-wider font-medium text-xs"])}">${ssrInterpolate(dateItem.label)}</span><span class="font-semibold">${ssrInterpolate(unref(formatDate)(dateItem.date))}</span>`);
            if (dateItem.daysRemaining !== null && !plan.date_recu && dateItem.type !== "recu") {
              _push(`<span class="${ssrRenderClass([dateItem.daysRemaining < 0 ? "text-red-500" : dateItem.daysRemaining <= 60 ? "text-amber-600" : "text-gray-400", "text-xs italic"])}">${ssrInterpolate(dateItem.daysRemaining < 0 ? `${Math.abs(dateItem.daysRemaining)}j retard` : `J-${dateItem.daysRemaining}`)}</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          });
          _push(`<!--]--></div><div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors">`);
          _push(ssrRenderComponent(_component_Icon, {
            name: "lucide:trash-2",
            size: "16"
          }, null, _parent));
          _push(`</button></div></div>`);
          if (plan.observation) {
            _push(`<p class="mt-2 text-xs text-gray-500 dark:text-gray-400 italic line-clamp-2">${ssrInterpolate(plan.observation)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<div class="text-center py-12"><div class="relative inline-block"><div class="absolute inset-0 bg-linear-to-br from-sky-200 to-blue-200 dark:from-sky-900/30 dark:to-blue-900/30 rounded-full blur-2xl opacity-50"></div>`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:map-pin-plus",
          size: "64",
          class: "relative text-gray-300 dark:text-gray-600"
        }, null, _parent));
        _push(`</div><p class="mt-4 text-lg font-medium text-gray-500 dark:text-gray-400"> Aucun plan technique </p><p class="text-sm text-gray-400 dark:text-gray-500 mt-1"> Ajoutez des PT pour suivre leur avancement </p><button class="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors">`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:plus",
          size: "16"
        }, null, _parent));
        _push(` Ajouter un PT </button></div>`);
      }
      _push(`</div></div>`);
      _push(ssrRenderComponent(_component_AppSlideOver, {
        sideModal: unref(showSlideOver),
        closeSideModal: closeSlideOver
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (unref(showSlideOver)) {
              _push2(ssrRenderComponent(_component_AppSlideOverContent, { closeSideModal: closeSlideOver }, {
                header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<h2 class="text-3xl font-[Pacifico] text-gray-800 dark:text-white"${_scopeId2}>${ssrInterpolate(unref(editMode) ? "Modifier" : "Ajouter")} un PT </h2><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId2}>${ssrInterpolate(unref(editMode) ? "Modifiez les informations du plan" : "Ajoutez un nouveau plan technique")}</p>`);
                  } else {
                    return [
                      createVNode("h2", { class: "text-3xl font-[Pacifico] text-gray-800 dark:text-white" }, toDisplayString(unref(editMode) ? "Modifier" : "Ajouter") + " un PT ", 1),
                      createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, toDisplayString(unref(editMode) ? "Modifiez les informations du plan" : "Ajoutez un nouveau plan technique"), 1)
                    ];
                  }
                }),
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<form class="space-y-6"${_scopeId2}><div class="space-y-4"${_scopeId2}><div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:tag",
                      size: "16",
                      class: "text-primary-500"
                    }, null, _parent3, _scopeId2));
                    _push3(`<h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"${_scopeId2}>Identification</h3></div>`);
                    _push3(ssrRenderComponent(_component_AppInput, {
                      modelValue: unref(form).indice,
                      "onUpdate:modelValue": ($event) => unref(form).indice = $event,
                      name: "indice",
                      title: "Indice *",
                      placeholder: "Ex: 34.1"
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppInput, {
                      modelValue: unref(form).titre,
                      "onUpdate:modelValue": ($event) => unref(form).titre = $event,
                      name: "titre",
                      title: "Titre",
                      placeholder: "Nom du plan technique"
                    }, null, _parent3, _scopeId2));
                    _push3(`</div><div class="space-y-4"${_scopeId2}><div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:calendar",
                      size: "16",
                      class: "text-primary-500"
                    }, null, _parent3, _scopeId2));
                    _push3(`<h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"${_scopeId2}>Dates</h3></div><div class="grid grid-cols-1 md:grid-cols-2 gap-4"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_AppDatePicker, {
                      modelValue: unref(form).date_mes,
                      "onUpdate:modelValue": ($event) => unref(form).date_mes = $event,
                      title: "Date MES",
                      placeholder: "Date de mise en service",
                      clearable: ""
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppDatePicker, {
                      modelValue: unref(form).date_recu,
                      "onUpdate:modelValue": ($event) => unref(form).date_recu = $event,
                      title: "Date de réception",
                      placeholder: "Date de réception",
                      clearable: ""
                    }, null, _parent3, _scopeId2));
                    _push3(`</div></div><div class="space-y-4"${_scopeId2}><div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:calendar-range",
                      size: "16",
                      class: "text-primary-500"
                    }, null, _parent3, _scopeId2));
                    _push3(`<h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"${_scopeId2}>Dates prévues</h3></div>`);
                    if (unref(form).date_prevu.length > 0) {
                      _push3(`<div class="flex flex-wrap gap-2"${_scopeId2}><!--[-->`);
                      ssrRenderList(unref(form).date_prevu, (dateP, idx) => {
                        _push3(`<div class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm"${_scopeId2}>`);
                        _push3(ssrRenderComponent(_component_Icon, {
                          name: "lucide:calendar",
                          size: "14",
                          class: "text-gray-500"
                        }, null, _parent3, _scopeId2));
                        _push3(`<span class="text-gray-700 dark:text-gray-300"${_scopeId2}>${ssrInterpolate(unref(formatDate)(dateP))}</span><button type="button" class="ml-1 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"${_scopeId2}>`);
                        _push3(ssrRenderComponent(_component_Icon, {
                          name: "lucide:x",
                          size: "12"
                        }, null, _parent3, _scopeId2));
                        _push3(`</button></div>`);
                      });
                      _push3(`<!--]--></div>`);
                    } else {
                      _push3(`<p class="text-sm text-gray-400 italic"${_scopeId2}>Aucune date prévue</p>`);
                    }
                    _push3(`<div class="flex items-end gap-2"${_scopeId2}><div class="flex-1"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_AppDatePicker, {
                      modelValue: unref(newDatePrevu),
                      "onUpdate:modelValue": ($event) => isRef(newDatePrevu) ? newDatePrevu.value = $event : null,
                      title: "Nouvelle date prévue",
                      placeholder: "Sélectionner...",
                      clearable: ""
                    }, null, _parent3, _scopeId2));
                    _push3(`</div><button type="button"${ssrIncludeBooleanAttr(!unref(newDatePrevu)) ? " disabled" : ""} class="${ssrRenderClass([unref(newDatePrevu) ? "bg-linear-to-br from-indigo-300 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white cursor-pointer" : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed", "shrink-0 h-9 w-9 flex items-center justify-center rounded-lg transition-colors"])}"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:plus",
                      size: "18"
                    }, null, _parent3, _scopeId2));
                    _push3(`</button></div></div><div class="space-y-4"${_scopeId2}><div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:message-square",
                      size: "16",
                      class: "text-primary-500"
                    }, null, _parent3, _scopeId2));
                    _push3(`<h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"${_scopeId2}>Observation</h3></div><div class="w-full"${_scopeId2}><textarea rows="3" class="appearance-none border border-gray-300 dark:border-gray-600 text-sm rounded-md py-2 px-3 w-full text-gray-700 dark:text-gray-200 dark:bg-gray-800 leading-tight focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none" placeholder="Notes, remarques..."${_scopeId2}>${ssrInterpolate(unref(form).observation)}</textarea></div></div></form>`);
                  } else {
                    return [
                      createVNode("form", {
                        onSubmit: withModifiers(handleSave, ["prevent"]),
                        class: "space-y-6"
                      }, [
                        createVNode("div", { class: "space-y-4" }, [
                          createVNode("div", { class: "flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700" }, [
                            createVNode(_component_Icon, {
                              name: "lucide:tag",
                              size: "16",
                              class: "text-primary-500"
                            }),
                            createVNode("h3", { class: "text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider" }, "Identification")
                          ]),
                          createVNode(_component_AppInput, {
                            modelValue: unref(form).indice,
                            "onUpdate:modelValue": ($event) => unref(form).indice = $event,
                            name: "indice",
                            title: "Indice *",
                            placeholder: "Ex: 34.1"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                          createVNode(_component_AppInput, {
                            modelValue: unref(form).titre,
                            "onUpdate:modelValue": ($event) => unref(form).titre = $event,
                            name: "titre",
                            title: "Titre",
                            placeholder: "Nom du plan technique"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ]),
                        createVNode("div", { class: "space-y-4" }, [
                          createVNode("div", { class: "flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700" }, [
                            createVNode(_component_Icon, {
                              name: "lucide:calendar",
                              size: "16",
                              class: "text-primary-500"
                            }),
                            createVNode("h3", { class: "text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider" }, "Dates")
                          ]),
                          createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-4" }, [
                            createVNode(_component_AppDatePicker, {
                              modelValue: unref(form).date_mes,
                              "onUpdate:modelValue": ($event) => unref(form).date_mes = $event,
                              title: "Date MES",
                              placeholder: "Date de mise en service",
                              clearable: ""
                            }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                            createVNode(_component_AppDatePicker, {
                              modelValue: unref(form).date_recu,
                              "onUpdate:modelValue": ($event) => unref(form).date_recu = $event,
                              title: "Date de réception",
                              placeholder: "Date de réception",
                              clearable: ""
                            }, null, 8, ["modelValue", "onUpdate:modelValue"])
                          ])
                        ]),
                        createVNode("div", { class: "space-y-4" }, [
                          createVNode("div", { class: "flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700" }, [
                            createVNode(_component_Icon, {
                              name: "lucide:calendar-range",
                              size: "16",
                              class: "text-primary-500"
                            }),
                            createVNode("h3", { class: "text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider" }, "Dates prévues")
                          ]),
                          unref(form).date_prevu.length > 0 ? (openBlock(), createBlock("div", {
                            key: 0,
                            class: "flex flex-wrap gap-2"
                          }, [
                            (openBlock(true), createBlock(Fragment, null, renderList(unref(form).date_prevu, (dateP, idx) => {
                              return openBlock(), createBlock("div", {
                                key: idx,
                                class: "inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm"
                              }, [
                                createVNode(_component_Icon, {
                                  name: "lucide:calendar",
                                  size: "14",
                                  class: "text-gray-500"
                                }),
                                createVNode("span", { class: "text-gray-700 dark:text-gray-300" }, toDisplayString(unref(formatDate)(dateP)), 1),
                                createVNode("button", {
                                  type: "button",
                                  onClick: ($event) => removeDatePrevu(idx),
                                  class: "ml-1 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                                }, [
                                  createVNode(_component_Icon, {
                                    name: "lucide:x",
                                    size: "12"
                                  })
                                ], 8, ["onClick"])
                              ]);
                            }), 128))
                          ])) : (openBlock(), createBlock("p", {
                            key: 1,
                            class: "text-sm text-gray-400 italic"
                          }, "Aucune date prévue")),
                          createVNode("div", { class: "flex items-end gap-2" }, [
                            createVNode("div", { class: "flex-1" }, [
                              createVNode(_component_AppDatePicker, {
                                modelValue: unref(newDatePrevu),
                                "onUpdate:modelValue": ($event) => isRef(newDatePrevu) ? newDatePrevu.value = $event : null,
                                title: "Nouvelle date prévue",
                                placeholder: "Sélectionner...",
                                clearable: ""
                              }, null, 8, ["modelValue", "onUpdate:modelValue"])
                            ]),
                            createVNode("button", {
                              type: "button",
                              onClick: addDatePrevu,
                              disabled: !unref(newDatePrevu),
                              class: ["shrink-0 h-9 w-9 flex items-center justify-center rounded-lg transition-colors", unref(newDatePrevu) ? "bg-linear-to-br from-indigo-300 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white cursor-pointer" : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"]
                            }, [
                              createVNode(_component_Icon, {
                                name: "lucide:plus",
                                size: "18"
                              })
                            ], 10, ["disabled"])
                          ])
                        ]),
                        createVNode("div", { class: "space-y-4" }, [
                          createVNode("div", { class: "flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700" }, [
                            createVNode(_component_Icon, {
                              name: "lucide:message-square",
                              size: "16",
                              class: "text-primary-500"
                            }),
                            createVNode("h3", { class: "text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider" }, "Observation")
                          ]),
                          createVNode("div", { class: "w-full" }, [
                            withDirectives(createVNode("textarea", {
                              "onUpdate:modelValue": ($event) => unref(form).observation = $event,
                              rows: "3",
                              class: "appearance-none border border-gray-300 dark:border-gray-600 text-sm rounded-md py-2 px-3 w-full text-gray-700 dark:text-gray-200 dark:bg-gray-800 leading-tight focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none",
                              placeholder: "Notes, remarques..."
                            }, null, 8, ["onUpdate:modelValue"]), [
                              [vModelText, unref(form).observation]
                            ])
                          ])
                        ])
                      ], 32)
                    ];
                  }
                }),
                footer: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_AppButtonValidated, {
                      theme: "cancel",
                      type: "button",
                      onClick: closeSlideOver
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`Annuler`);
                        } else {
                          return [
                            createTextVNode("Annuler")
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppButtonValidated, {
                      theme: "primary",
                      type: "button",
                      validated: !!unref(form).indice,
                      onClick: handleSave
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`${ssrInterpolate(unref(editMode) ? "Enregistrer" : "Ajouter")}`);
                        } else {
                          return [
                            createTextVNode(toDisplayString(unref(editMode) ? "Enregistrer" : "Ajouter"), 1)
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(`</div>`);
                  } else {
                    return [
                      createVNode("div", { class: "flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700" }, [
                        createVNode(_component_AppButtonValidated, {
                          theme: "cancel",
                          type: "button",
                          onClick: closeSlideOver
                        }, {
                          default: withCtx(() => [
                            createTextVNode("Annuler")
                          ]),
                          _: 1
                        }),
                        createVNode(_component_AppButtonValidated, {
                          theme: "primary",
                          type: "button",
                          validated: !!unref(form).indice,
                          onClick: handleSave
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(editMode) ? "Enregistrer" : "Ajouter"), 1)
                          ]),
                          _: 1
                        }, 8, ["validated"])
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
                closeSideModal: closeSlideOver
              }, {
                header: withCtx(() => [
                  createVNode("h2", { class: "text-3xl font-[Pacifico] text-gray-800 dark:text-white" }, toDisplayString(unref(editMode) ? "Modifier" : "Ajouter") + " un PT ", 1),
                  createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, toDisplayString(unref(editMode) ? "Modifiez les informations du plan" : "Ajoutez un nouveau plan technique"), 1)
                ]),
                default: withCtx(() => [
                  createVNode("form", {
                    onSubmit: withModifiers(handleSave, ["prevent"]),
                    class: "space-y-6"
                  }, [
                    createVNode("div", { class: "space-y-4" }, [
                      createVNode("div", { class: "flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700" }, [
                        createVNode(_component_Icon, {
                          name: "lucide:tag",
                          size: "16",
                          class: "text-primary-500"
                        }),
                        createVNode("h3", { class: "text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider" }, "Identification")
                      ]),
                      createVNode(_component_AppInput, {
                        modelValue: unref(form).indice,
                        "onUpdate:modelValue": ($event) => unref(form).indice = $event,
                        name: "indice",
                        title: "Indice *",
                        placeholder: "Ex: 34.1"
                      }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                      createVNode(_component_AppInput, {
                        modelValue: unref(form).titre,
                        "onUpdate:modelValue": ($event) => unref(form).titre = $event,
                        name: "titre",
                        title: "Titre",
                        placeholder: "Nom du plan technique"
                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                    ]),
                    createVNode("div", { class: "space-y-4" }, [
                      createVNode("div", { class: "flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700" }, [
                        createVNode(_component_Icon, {
                          name: "lucide:calendar",
                          size: "16",
                          class: "text-primary-500"
                        }),
                        createVNode("h3", { class: "text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider" }, "Dates")
                      ]),
                      createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-4" }, [
                        createVNode(_component_AppDatePicker, {
                          modelValue: unref(form).date_mes,
                          "onUpdate:modelValue": ($event) => unref(form).date_mes = $event,
                          title: "Date MES",
                          placeholder: "Date de mise en service",
                          clearable: ""
                        }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                        createVNode(_component_AppDatePicker, {
                          modelValue: unref(form).date_recu,
                          "onUpdate:modelValue": ($event) => unref(form).date_recu = $event,
                          title: "Date de réception",
                          placeholder: "Date de réception",
                          clearable: ""
                        }, null, 8, ["modelValue", "onUpdate:modelValue"])
                      ])
                    ]),
                    createVNode("div", { class: "space-y-4" }, [
                      createVNode("div", { class: "flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700" }, [
                        createVNode(_component_Icon, {
                          name: "lucide:calendar-range",
                          size: "16",
                          class: "text-primary-500"
                        }),
                        createVNode("h3", { class: "text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider" }, "Dates prévues")
                      ]),
                      unref(form).date_prevu.length > 0 ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "flex flex-wrap gap-2"
                      }, [
                        (openBlock(true), createBlock(Fragment, null, renderList(unref(form).date_prevu, (dateP, idx) => {
                          return openBlock(), createBlock("div", {
                            key: idx,
                            class: "inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm"
                          }, [
                            createVNode(_component_Icon, {
                              name: "lucide:calendar",
                              size: "14",
                              class: "text-gray-500"
                            }),
                            createVNode("span", { class: "text-gray-700 dark:text-gray-300" }, toDisplayString(unref(formatDate)(dateP)), 1),
                            createVNode("button", {
                              type: "button",
                              onClick: ($event) => removeDatePrevu(idx),
                              class: "ml-1 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                            }, [
                              createVNode(_component_Icon, {
                                name: "lucide:x",
                                size: "12"
                              })
                            ], 8, ["onClick"])
                          ]);
                        }), 128))
                      ])) : (openBlock(), createBlock("p", {
                        key: 1,
                        class: "text-sm text-gray-400 italic"
                      }, "Aucune date prévue")),
                      createVNode("div", { class: "flex items-end gap-2" }, [
                        createVNode("div", { class: "flex-1" }, [
                          createVNode(_component_AppDatePicker, {
                            modelValue: unref(newDatePrevu),
                            "onUpdate:modelValue": ($event) => isRef(newDatePrevu) ? newDatePrevu.value = $event : null,
                            title: "Nouvelle date prévue",
                            placeholder: "Sélectionner...",
                            clearable: ""
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ]),
                        createVNode("button", {
                          type: "button",
                          onClick: addDatePrevu,
                          disabled: !unref(newDatePrevu),
                          class: ["shrink-0 h-9 w-9 flex items-center justify-center rounded-lg transition-colors", unref(newDatePrevu) ? "bg-linear-to-br from-indigo-300 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white cursor-pointer" : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"]
                        }, [
                          createVNode(_component_Icon, {
                            name: "lucide:plus",
                            size: "18"
                          })
                        ], 10, ["disabled"])
                      ])
                    ]),
                    createVNode("div", { class: "space-y-4" }, [
                      createVNode("div", { class: "flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700" }, [
                        createVNode(_component_Icon, {
                          name: "lucide:message-square",
                          size: "16",
                          class: "text-primary-500"
                        }),
                        createVNode("h3", { class: "text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider" }, "Observation")
                      ]),
                      createVNode("div", { class: "w-full" }, [
                        withDirectives(createVNode("textarea", {
                          "onUpdate:modelValue": ($event) => unref(form).observation = $event,
                          rows: "3",
                          class: "appearance-none border border-gray-300 dark:border-gray-600 text-sm rounded-md py-2 px-3 w-full text-gray-700 dark:text-gray-200 dark:bg-gray-800 leading-tight focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none",
                          placeholder: "Notes, remarques..."
                        }, null, 8, ["onUpdate:modelValue"]), [
                          [vModelText, unref(form).observation]
                        ])
                      ])
                    ])
                  ], 32)
                ]),
                footer: withCtx(() => [
                  createVNode("div", { class: "flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700" }, [
                    createVNode(_component_AppButtonValidated, {
                      theme: "cancel",
                      type: "button",
                      onClick: closeSlideOver
                    }, {
                      default: withCtx(() => [
                        createTextVNode("Annuler")
                      ]),
                      _: 1
                    }),
                    createVNode(_component_AppButtonValidated, {
                      theme: "primary",
                      type: "button",
                      validated: !!unref(form).indice,
                      onClick: handleSave
                    }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(unref(editMode) ? "Enregistrer" : "Ajouter"), 1)
                      ]),
                      _: 1
                    }, 8, ["validated"])
                  ])
                ]),
                _: 1
              })) : createCommentVNode("", true)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_AppModal, {
        modelValue: unref(showDeleteModal),
        "onUpdate:modelValue": ($event) => isRef(showDeleteModal) ? showDeleteModal.value = $event : null,
        size: "lg",
        showCloseButton: false
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="p-6 text-center"${_scopeId}><div class="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:alert-triangle",
              size: "32",
              class: "text-red-500"
            }, null, _parent2, _scopeId));
            _push2(`</div><h3 class="text-xl font-bold text-gray-800 dark:text-white mb-2"${_scopeId}> Supprimer ce plan ? </h3><p class="text-gray-500 dark:text-gray-400 mb-2"${_scopeId}> Cette action est irréversible. </p>`);
            if (unref(itemToDelete)) {
              _push2(`<div class="mb-6 p-3 rounded-lg bg-gray-100 dark:bg-gray-700/50"${_scopeId}><p class="font-mono font-bold text-gray-700 dark:text-gray-300"${_scopeId}>${ssrInterpolate(unref(itemToDelete).indice)}</p>`);
              if (unref(itemToDelete).titre) {
                _push2(`<p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}>${ssrInterpolate(unref(itemToDelete).titre)}</p>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div class="flex justify-center gap-3"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_AppButtonValidated, {
              theme: "cancel",
              type: "button",
              onClick: closeDeleteModal
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`Annuler`);
                } else {
                  return [
                    createTextVNode("Annuler")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_AppButtonValidated, {
              theme: "danger",
              type: "button",
              validated: true,
              onClick: confirmDelete
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<span class="flex items-center gap-2"${_scopeId2}>`);
                  _push3(ssrRenderComponent(_component_Icon, {
                    name: "lucide:trash-2",
                    size: "16"
                  }, null, _parent3, _scopeId2));
                  _push3(` Supprimer </span>`);
                } else {
                  return [
                    createVNode("span", { class: "flex items-center gap-2" }, [
                      createVNode(_component_Icon, {
                        name: "lucide:trash-2",
                        size: "16"
                      }),
                      createTextVNode(" Supprimer ")
                    ])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div></div>`);
          } else {
            return [
              createVNode("div", { class: "p-6 text-center" }, [
                createVNode("div", { class: "mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4" }, [
                  createVNode(_component_Icon, {
                    name: "lucide:alert-triangle",
                    size: "32",
                    class: "text-red-500"
                  })
                ]),
                createVNode("h3", { class: "text-xl font-bold text-gray-800 dark:text-white mb-2" }, " Supprimer ce plan ? "),
                createVNode("p", { class: "text-gray-500 dark:text-gray-400 mb-2" }, " Cette action est irréversible. "),
                unref(itemToDelete) ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "mb-6 p-3 rounded-lg bg-gray-100 dark:bg-gray-700/50"
                }, [
                  createVNode("p", { class: "font-mono font-bold text-gray-700 dark:text-gray-300" }, toDisplayString(unref(itemToDelete).indice), 1),
                  unref(itemToDelete).titre ? (openBlock(), createBlock("p", {
                    key: 0,
                    class: "text-sm text-gray-500 dark:text-gray-400"
                  }, toDisplayString(unref(itemToDelete).titre), 1)) : createCommentVNode("", true)
                ])) : createCommentVNode("", true),
                createVNode("div", { class: "flex justify-center gap-3" }, [
                  createVNode(_component_AppButtonValidated, {
                    theme: "cancel",
                    type: "button",
                    onClick: closeDeleteModal
                  }, {
                    default: withCtx(() => [
                      createTextVNode("Annuler")
                    ]),
                    _: 1
                  }),
                  createVNode(_component_AppButtonValidated, {
                    theme: "danger",
                    type: "button",
                    validated: true,
                    onClick: confirmDelete
                  }, {
                    default: withCtx(() => [
                      createVNode("span", { class: "flex items-center gap-2" }, [
                        createVNode(_component_Icon, {
                          name: "lucide:trash-2",
                          size: "16"
                        }),
                        createTextVNode(" Supprimer ")
                      ])
                    ]),
                    _: 1
                  })
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
const _sfc_setup$e = _sfc_main$e.setup;
_sfc_main$e.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/chantier/etudes/plansTechniques.vue");
  return _sfc_setup$e ? _sfc_setup$e(props, ctx) : void 0;
};
const _sfc_main$d = /* @__PURE__ */ defineComponent({
  __name: "quillEditor",
  __ssrInlineRender: true,
  props: {
    modelValue: {}
  },
  emits: ["update:modelValue"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const editor = ref(null);
    watch(
      () => props.modelValue,
      (newVal) => {
      }
    );
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        ref_key: "editor",
        ref: editor,
        class: "flex h-full min-h-[240px] flex-col border-0"
      }, _attrs))} data-v-d0cbc756></div>`);
    };
  }
});
const _sfc_setup$d = _sfc_main$d.setup;
_sfc_main$d.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/quillEditor.vue");
  return _sfc_setup$d ? _sfc_setup$d(props, ctx) : void 0;
};
const __nuxt_component_3 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$d, [["__scopeId", "data-v-d0cbc756"]]), { __name: "QuillEditor" });
const _sfc_main$c = {
  __name: "ChantierCommentairesCommentaireEditor",
  __ssrInlineRender: true,
  props: {
    chantier: {
      type: Object,
      required: true
    },
    typeKey: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ""
    },
    icon: {
      type: String,
      default: "lucide:message-square-text"
    },
    tone: {
      type: String,
      default: "primary"
    }
  },
  setup(__props) {
    const props = __props;
    const { getCommentaire, saveCommentaire } = useCommentaires();
    const { addToast } = useToast();
    const content = ref("");
    const loading = ref(false);
    const saving = ref(false);
    const lastSavedContent = ref("");
    const lastSavedAt = ref(null);
    const autoSaveTimer = ref(null);
    const toneMap = {
      primary: {
        icon: "bg-primary-500/10 text-primary-500 ring-primary-500/20",
        badge: "bg-primary-500/10 text-primary-600 border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-200 dark:border-primary-500/30"
      },
      amber: {
        icon: "bg-amber-500/10 text-amber-500 ring-amber-500/20",
        badge: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/30"
      },
      emerald: {
        icon: "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20",
        badge: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200 dark:border-emerald-500/30"
      },
      sky: {
        icon: "bg-sky-500/10 text-sky-500 ring-sky-500/20",
        badge: "bg-sky-500/10 text-sky-700 border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200 dark:border-sky-500/30"
      },
      violet: {
        icon: "bg-violet-500/10 text-violet-500 ring-violet-500/20",
        badge: "bg-violet-500/10 text-violet-700 border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-200 dark:border-violet-500/30"
      }
    };
    computed(() => toneMap[props.tone] || toneMap.primary);
    const hasUnsavedChanges = computed(() => content.value !== lastSavedContent.value);
    const formattedLastSavedAt = computed(() => {
      if (!lastSavedAt.value) return null;
      return new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "short",
        timeStyle: "short"
      }).format(lastSavedAt.value);
    });
    const statusBadge = computed(() => {
      if (loading.value) {
        return {
          label: "Chargement du commentaire",
          icon: "lucide:loader-2",
          classes: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/30"
        };
      }
      if (saving.value) {
        return {
          label: "Sauvegarde en cours",
          icon: "lucide:loader-2",
          classes: "bg-primary-500/10 text-primary-600 border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-200 dark:border-primary-500/30"
        };
      }
      if (hasUnsavedChanges.value) {
        return {
          label: "Modifications non enregistrées",
          icon: "lucide:alert-triangle",
          classes: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/30"
        };
      }
      if (lastSavedAt.value) {
        return {
          label: "Dernière version sauvegardée",
          icon: "lucide:check",
          classes: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200 dark:border-emerald-500/30"
        };
      }
      return null;
    });
    const resetEditor = () => {
      content.value = "";
      lastSavedContent.value = "";
      lastSavedAt.value = null;
    };
    const clearAutoSaveTimer = () => {
      if (autoSaveTimer.value) {
        clearTimeout(autoSaveTimer.value);
        autoSaveTimer.value = null;
      }
    };
    const loadCommentaire = async () => {
      if (!props.chantier?.id) return;
      loading.value = true;
      try {
        const commentaire = await getCommentaire(props.chantier.id, props.typeKey);
        content.value = commentaire?.content || "";
        lastSavedContent.value = commentaire?.content || "";
        lastSavedAt.value = commentaire?.updated_at ? new Date(commentaire.updated_at) : commentaire?.created_at ? new Date(commentaire.created_at) : commentaire ? /* @__PURE__ */ new Date() : null;
      } catch (err) {
        console.error("Erreur lors du chargement du commentaire :", err);
      } finally {
        loading.value = false;
      }
    };
    const handleSave = async (mode = "manual") => {
      if (!props.chantier?.id || saving.value) return;
      saving.value = true;
      clearAutoSaveTimer();
      try {
        await saveCommentaire(props.chantier.id, props.typeKey, content.value);
        lastSavedContent.value = content.value;
        lastSavedAt.value = /* @__PURE__ */ new Date();
        addToast({
          title: mode === "manual" ? "Commentaire enregistré" : "Sauvegarde automatique",
          message: mode === "manual" ? "Le commentaire a été enregistré avec succès." : "Le commentaire a été sauvegardé automatiquement.",
          type: "Success"
        });
      } catch (err) {
        console.error("Erreur lors de l’enregistrement du commentaire :", err);
      } finally {
        saving.value = false;
      }
    };
    watch(
      () => props.chantier?.id,
      (newId, oldId) => {
        if (!newId) {
          resetEditor();
          return;
        }
        if (newId !== oldId) {
          clearAutoSaveTimer();
          resetEditor();
          loadCommentaire();
        }
      },
      { immediate: true }
    );
    watch(content, () => {
      if (!props.chantier?.id) return;
      clearAutoSaveTimer();
      if (!hasUnsavedChanges.value) return;
      autoSaveTimer.value = setTimeout(() => {
        if (hasUnsavedChanges.value) {
          handleSave("auto");
        }
      }, 5e3);
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppTitleMain = _sfc_main$o;
      const _component_AppButtonValidated = _sfc_main$2$1;
      const _component_Icon = __nuxt_component_1;
      const _component_QuillEditor = __nuxt_component_3;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-5" }, _attrs))}><div class="flex flex-col gap-5"><div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div class="flex items-start gap-4"><div class="flex-1">`);
      _push(ssrRenderComponent(_component_AppTitleMain, {
        title: __props.title,
        description: __props.description
      }, null, _parent));
      _push(`</div></div><div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-4">`);
      if (unref(formattedLastSavedAt)) {
        _push(`<p class="text-xs text-gray-500 dark:text-gray-400"> Dernière sauvegarde<br><span class="font-semibold text-gray-900 dark:text-gray-100">${ssrInterpolate(unref(formattedLastSavedAt))}</span></p>`);
      } else {
        _push(`<!---->`);
      }
      _push(ssrRenderComponent(_component_AppButtonValidated, {
        type: "button",
        theme: "primary",
        validated: Boolean(props.chantier?.id),
        onClick: ($event) => handleSave("manual")
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<span class="flex items-center gap-2 text-sm"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: unref(saving) ? "lucide:loader-2" : "lucide:save",
              size: "16",
              class: unref(saving) ? "animate-spin" : ""
            }, null, _parent2, _scopeId));
            _push2(` ${ssrInterpolate(unref(saving) ? "Enregistrement..." : "Enregistrer")}</span>`);
          } else {
            return [
              createVNode("span", { class: "flex items-center gap-2 text-sm" }, [
                createVNode(_component_Icon, {
                  name: unref(saving) ? "lucide:loader-2" : "lucide:save",
                  size: "16",
                  class: unref(saving) ? "animate-spin" : ""
                }, null, 8, ["name", "class"]),
                createTextVNode(" " + toDisplayString(unref(saving) ? "Enregistrement..." : "Enregistrer"), 1)
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div><div class="flex flex-wrap items-center gap-3">`);
      if (unref(statusBadge)) {
        _push(`<span class="${ssrRenderClass([unref(statusBadge).classes, "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"])}">`);
        _push(ssrRenderComponent(_component_Icon, {
          name: unref(statusBadge).icon,
          size: "14",
          class: unref(statusBadge).icon === "lucide:loader-2" ? "animate-spin" : ""
        }, null, _parent));
        _push(` ${ssrInterpolate(unref(statusBadge).label)}</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<span class="text-xs text-gray-400 dark:text-gray-500"> Sauvegarde automatique après 5 secondes d’inactivité. </span></div></div><div class="rounded-lg border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/70 shadow-md">`);
      if (unref(loading)) {
        _push(`<div class="flex h-[420px] flex-col items-center justify-center gap-3 text-gray-400 dark:text-gray-500">`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:loader-2",
          size: "32",
          class: "animate-spin"
        }, null, _parent));
        _push(`<p class="text-sm font-medium">Chargement du commentaire...</p></div>`);
      } else {
        _push(`<div class="">`);
        _push(ssrRenderComponent(_component_QuillEditor, {
          modelValue: unref(content),
          "onUpdate:modelValue": ($event) => isRef(content) ? content.value = $event : null,
          class: "h-full border-0"
        }, null, _parent));
        _push(`</div>`);
      }
      _push(`</div></div>`);
    };
  }
};
const _sfc_setup$c = _sfc_main$c.setup;
_sfc_main$c.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/chantier/commentaires/commentaireEditor.vue");
  return _sfc_setup$c ? _sfc_setup$c(props, ctx) : void 0;
};
const _sfc_main$b = {
  __name: "ChantierCommentairesGeneralites",
  __ssrInlineRender: true,
  props: {
    chantier: {
      type: Object,
      required: true
    }
  },
  setup(__props) {
    const props = __props;
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ChantierCommentairesCommentaireEditor = _sfc_main$c;
      _push(ssrRenderComponent(_component_ChantierCommentairesCommentaireEditor, mergeProps({
        chantier: props.chantier,
        "type-key": "generalite",
        title: "Commentaires - Généralités",
        description: "Espace pour consigner tous les commentaires d’ordre général.",
        icon: "lucide:message-square-more",
        tone: "primary"
      }, _attrs), null, _parent));
    };
  }
};
const _sfc_setup$b = _sfc_main$b.setup;
_sfc_main$b.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/chantier/commentaires/generalites.vue");
  return _sfc_setup$b ? _sfc_setup$b(props, ctx) : void 0;
};
const _sfc_main$a = {
  __name: "ChantierCommentairesSes",
  __ssrInlineRender: true,
  props: {
    chantier: {
      type: Object,
      required: true
    }
  },
  setup(__props) {
    const props = __props;
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ChantierCommentairesCommentaireEditor = _sfc_main$c;
      _push(ssrRenderComponent(_component_ChantierCommentairesCommentaireEditor, mergeProps({
        chantier: props.chantier,
        "type-key": "ses",
        title: "Commentaires - SES",
        description: "Suivi de la signalisation, particulariés SES...",
        icon: "lucide:zap",
        tone: "amber"
      }, _attrs), null, _parent));
    };
  }
};
const _sfc_setup$a = _sfc_main$a.setup;
_sfc_main$a.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/chantier/commentaires/ses.vue");
  return _sfc_setup$a ? _sfc_setup$a(props, ctx) : void 0;
};
const _sfc_main$9 = {
  __name: "ChantierCommentairesVoie",
  __ssrInlineRender: true,
  props: {
    chantier: {
      type: Object,
      required: true
    }
  },
  setup(__props) {
    const props = __props;
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ChantierCommentairesCommentaireEditor = _sfc_main$c;
      _push(ssrRenderComponent(_component_ChantierCommentairesCommentaireEditor, mergeProps({
        chantier: props.chantier,
        "type-key": "voie",
        title: "Commentaires - Voie",
        description: "Suivi des travaux voie, particulariés...",
        icon: "lucide:train-track",
        tone: "emerald"
      }, _attrs), null, _parent));
    };
  }
};
const _sfc_setup$9 = _sfc_main$9.setup;
_sfc_main$9.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/chantier/commentaires/voie.vue");
  return _sfc_setup$9 ? _sfc_setup$9(props, ctx) : void 0;
};
const _sfc_main$8 = {
  __name: "ChantierCommentairesLogistique",
  __ssrInlineRender: true,
  props: {
    chantier: {
      type: Object,
      required: true
    }
  },
  setup(__props) {
    const props = __props;
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ChantierCommentairesCommentaireEditor = _sfc_main$c;
      _push(ssrRenderComponent(_component_ChantierCommentairesCommentaireEditor, mergeProps({
        chantier: props.chantier,
        "type-key": "logistique",
        title: "Commentaires - Logistique",
        description: "Organisation des moyens, accès, approvisionnements et base vie...",
        icon: "lucide:truck",
        tone: "sky"
      }, _attrs), null, _parent));
    };
  }
};
const _sfc_setup$8 = _sfc_main$8.setup;
_sfc_main$8.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/chantier/commentaires/logistique.vue");
  return _sfc_setup$8 ? _sfc_setup$8(props, ctx) : void 0;
};
const _sfc_main$7 = {
  __name: "ChantierCommentairesTerrain",
  __ssrInlineRender: true,
  props: {
    chantier: {
      type: Object,
      required: true
    }
  },
  setup(__props) {
    const props = __props;
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ChantierCommentairesCommentaireEditor = _sfc_main$c;
      _push(ssrRenderComponent(_component_ChantierCommentairesCommentaireEditor, mergeProps({
        chantier: props.chantier,
        "type-key": "terrain",
        title: "Commentaires - Terrain",
        description: "Retours d'informations du terrain.",
        icon: "lucide:land-plot",
        tone: "violet"
      }, _attrs), null, _parent));
    };
  }
};
const _sfc_setup$7 = _sfc_main$7.setup;
_sfc_main$7.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/chantier/commentaires/terrain.vue");
  return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
const intervalError = "[nuxt] `setInterval` should not be used on the server. Consider wrapping it with an `onNuxtReady`, `onBeforeMount` or `onMounted` lifecycle hook, or ensure you only call it in the browser by checking `false`.";
const setInterval = () => {
  console.error(intervalError);
};
const usePhotos = () => {
  const supabase = useSupabaseClient();
  const { addToast } = useToast();
  const BUCKET_NAME = "photos";
  const repertoires = useState("photo_repertoires", () => []);
  const photos = useState("photos_list", () => []);
  const getRepertoires = async (chantierId) => {
    try {
      const { data, error } = await supabase.from("photo_repertoires").select("*").eq("chantier_id", chantierId).order("nom", { ascending: true });
      if (error) throw error;
      repertoires.value = data || [];
      return { data, error: null };
    } catch (err) {
      console.error("Erreur lors de la récupération des répertoires:", err);
      addToast({
        title: "Erreur",
        message: err.message || "Impossible de récupérer les répertoires",
        type: "Error"
      });
      return { data: null, error: err };
    }
  };
  const createRepertoire = async (chantierId, nom) => {
    try {
      const { data, error } = await supabase.from("photo_repertoires").insert({
        chantier_id: chantierId,
        nom: nom.trim()
      }).select().single();
      if (error) throw error;
      await getRepertoires(chantierId);
      addToast({
        title: "Répertoire créé",
        message: `Le répertoire "${nom}" a été créé avec succès.`,
        type: "Success"
      });
      return { data, error: null };
    } catch (err) {
      console.error("Erreur lors de la création du répertoire:", err);
      addToast({
        title: "Erreur",
        message: err.message || "Impossible de créer le répertoire",
        type: "Error"
      });
      return { data: null, error: err };
    }
  };
  const updateRepertoire = async (repertoireId, updates) => {
    try {
      const { data, error } = await supabase.from("photo_repertoires").update(updates).eq("id", repertoireId).select().single();
      if (error) throw error;
      const chantierId = repertoires.value.find((r) => r.id === repertoireId)?.chantier_id;
      if (chantierId) await getRepertoires(chantierId);
      addToast({
        title: "Répertoire mis à jour",
        message: "Le répertoire a été mis à jour avec succès.",
        type: "Success"
      });
      return { data, error: null };
    } catch (err) {
      console.error("Erreur lors de la mise à jour du répertoire:", err);
      addToast({
        title: "Erreur",
        message: err.message || "Impossible de mettre à jour le répertoire",
        type: "Error"
      });
      return { data: null, error: err };
    }
  };
  const deleteRepertoire = async (repertoireId) => {
    try {
      const repertoire = repertoires.value.find((r) => r.id === repertoireId);
      if (!repertoire) throw new Error("Répertoire non trouvé");
      const { error: updateError } = await supabase.from("photos").update({ repertoire_id: null }).eq("repertoire_id", repertoireId);
      if (updateError) throw updateError;
      const { error: deleteError } = await supabase.from("photo_repertoires").delete().eq("id", repertoireId);
      if (deleteError) throw deleteError;
      await getRepertoires(repertoire.chantier_id);
      addToast({
        title: "Répertoire supprimé",
        message: "Le répertoire a été supprimé avec succès.",
        type: "Success"
      });
      return { error: null };
    } catch (err) {
      console.error("Erreur lors de la suppression du répertoire:", err);
      addToast({
        title: "Erreur",
        message: err.message || "Impossible de supprimer le répertoire",
        type: "Error"
      });
      return { error: err };
    }
  };
  const getPhotos = async (chantierId, repertoireId = null) => {
    try {
      let query = supabase.from("photos").select("*").eq("chantier_id", chantierId).order("created_at", { ascending: false });
      if (repertoireId !== null) {
        query = query.eq("repertoire_id", repertoireId);
      }
      const { data, error } = await query;
      if (error) throw error;
      photos.value = data || [];
      return { data, error: null };
    } catch (err) {
      console.error("Erreur lors de la récupération des photos:", err);
      addToast({
        title: "Erreur",
        message: err.message || "Impossible de récupérer les photos",
        type: "Error"
      });
      return { data: null, error: err };
    }
  };
  const uploadPhoto = async (file, chantierId, repertoireId = null, onProgress = null) => {
    try {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExt = file.name.split(".").pop();
      const fileName = `${chantierId}/${timestamp}_${randomString}.${fileExt}`;
      const filePath = fileName;
      let progressInterval;
      let simulatedProgress = 0;
      const simulateProgress = () => {
        progressInterval = setInterval(() => {
          simulatedProgress += 10;
          if (simulatedProgress <= 90 && onProgress) {
            onProgress(simulatedProgress);
          }
          if (simulatedProgress >= 100) {
            clearInterval(progressInterval);
          }
        }, 100);
      };
      simulateProgress();
      const { data: uploadData, error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file, {
        cacheControl: "3600",
        upsert: false
      });
      if (progressInterval) clearInterval(progressInterval);
      if (uploadError) {
        if (onProgress) onProgress(0);
        throw uploadError;
      }
      if (onProgress) onProgress(100);
      const { data: photoData, error: dbError } = await supabase.from("photos").insert({
        chantier_id: chantierId,
        repertoire_id: repertoireId,
        nom_fichier: file.name,
        chemin_storage: filePath,
        taille: file.size,
        mime_type: file.type
      }).select().single();
      if (dbError) {
        await supabase.storage.from(BUCKET_NAME).remove([filePath]);
        throw dbError;
      }
      await getPhotos(chantierId, repertoireId);
      return { data: photoData, error: null };
    } catch (err) {
      console.error("Erreur lors de l'upload de la photo:", err);
      if (onProgress) onProgress(0);
      addToast({
        title: "Erreur",
        message: err.message || "Impossible d'uploader la photo",
        type: "Error"
      });
      return { data: null, error: err };
    }
  };
  const uploadMultiplePhotos = async (files, chantierId, repertoireId = null, onProgress = null) => {
    const results = [];
    const total = files.length;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileProgress = (progress) => {
        if (onProgress) {
          onProgress(i, progress, total);
        }
      };
      const result = await uploadPhoto(file, chantierId, repertoireId, fileProgress);
      results.push(result);
    }
    return results;
  };
  const getPhotoUrl = (cheminStorage) => {
    if (!cheminStorage) return null;
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(cheminStorage);
    return data?.publicUrl || null;
  };
  const getSignedPhotoUrl = async (cheminStorage, expiresIn = 3600) => {
    if (!cheminStorage) return null;
    try {
      const { data, error } = await supabase.storage.from(BUCKET_NAME).createSignedUrl(cheminStorage, expiresIn);
      if (error) throw error;
      return data?.signedUrl || null;
    } catch (err) {
      console.error("Erreur lors de la génération de l'URL signée:", err);
      return null;
    }
  };
  const movePhotoToRepertoire = async (photoId, repertoireId) => {
    try {
      const { data, error } = await supabase.from("photos").update({ repertoire_id: repertoireId }).eq("id", photoId).select().single();
      if (error) throw error;
      const chantierId = photos.value.find((p) => p.id === photoId)?.chantier_id;
      if (chantierId) await getPhotos(chantierId);
      addToast({
        title: "Photo déplacée",
        message: "La photo a été déplacée avec succès.",
        type: "Success"
      });
      return { data, error: null };
    } catch (err) {
      console.error("Erreur lors du déplacement de la photo:", err);
      addToast({
        title: "Erreur",
        message: err.message || "Impossible de déplacer la photo",
        type: "Error"
      });
      return { data: null, error: err };
    }
  };
  const deletePhoto = async (photoId) => {
    try {
      const photo = photos.value.find((p) => p.id === photoId);
      if (!photo) throw new Error("Photo non trouvée");
      const { error: storageError } = await supabase.storage.from(BUCKET_NAME).remove([photo.chemin_storage]);
      if (storageError) {
        console.warn("Erreur lors de la suppression du fichier:", storageError);
      }
      const { error: dbError } = await supabase.from("photos").delete().eq("id", photoId);
      if (dbError) throw dbError;
      await getPhotos(photo.chantier_id, photo.repertoire_id);
      addToast({
        title: "Photo supprimée",
        message: "La photo a été supprimée avec succès.",
        type: "Success"
      });
      return { error: null };
    } catch (err) {
      console.error("Erreur lors de la suppression de la photo:", err);
      addToast({
        title: "Erreur",
        message: err.message || "Impossible de supprimer la photo",
        type: "Error"
      });
      return { error: err };
    }
  };
  const updatePhoto = async (photoId, updates) => {
    try {
      const { data, error } = await supabase.from("photos").update(updates).eq("id", photoId).select().single();
      if (error) throw error;
      const chantierId = photos.value.find((p) => p.id === photoId)?.chantier_id;
      if (chantierId) await getPhotos(chantierId);
      addToast({
        title: "Photo mise à jour",
        message: "La photo a été mise à jour avec succès.",
        type: "Success"
      });
      return { data, error: null };
    } catch (err) {
      console.error("Erreur lors de la mise à jour de la photo:", err);
      addToast({
        title: "Erreur",
        message: err.message || "Impossible de mettre à jour la photo",
        type: "Error"
      });
      return { data: null, error: err };
    }
  };
  return {
    // États
    repertoires,
    photos,
    // Répertoires
    getRepertoires,
    createRepertoire,
    updateRepertoire,
    deleteRepertoire,
    // Photos
    getPhotos,
    uploadPhoto,
    uploadMultiplePhotos,
    getPhotoUrl,
    getSignedPhotoUrl,
    movePhotoToRepertoire,
    deletePhoto,
    updatePhoto
  };
};
const _sfc_main$6 = {
  __name: "PhotosRepertoireManager",
  __ssrInlineRender: true,
  props: /* @__PURE__ */ mergeModels({
    chantierId: {
      type: [String, Number],
      required: true
    }
  }, {
    "modelValue": {
      type: [String, Number],
      default: null
    },
    "modelModifiers": {}
  }),
  emits: /* @__PURE__ */ mergeModels(["changed"], ["update:modelValue"]),
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const selectedRepertoireId = useModel(__props, "modelValue");
    const {
      repertoires,
      createRepertoire,
      updateRepertoire,
      deleteRepertoire
    } = usePhotos();
    const isSidebarOpen = ref(false);
    const editingRepertoires = ref({});
    const newRepertoireForm = ref({
      nom: ""
    });
    const isDeleteModalOpen = ref(false);
    const repertoireToDelete = ref(null);
    const openSidebar = () => {
      isSidebarOpen.value = true;
      editingRepertoires.value = {};
      newRepertoireForm.value = { nom: "" };
    };
    const closeSidebar = () => {
      isSidebarOpen.value = false;
    };
    const startEdit = (repertoire) => {
      editingRepertoires.value[repertoire.id] = {
        nom: repertoire.nom
      };
    };
    const cancelEdit = (repertoireId) => {
      delete editingRepertoires.value[repertoireId];
    };
    const handleSaveRepertoire = async (repertoireId) => {
      const form = editingRepertoires.value[repertoireId];
      if (!form?.nom.trim()) {
        return;
      }
      try {
        const result = await updateRepertoire(repertoireId, {
          nom: form.nom.trim()
        });
        if (!result.error) {
          cancelEdit(repertoireId);
          emit("changed");
        }
      } catch (error) {
        console.error("Erreur lors de la sauvegarde:", error);
      }
    };
    const handleAddRepertoire = async () => {
      if (!newRepertoireForm.value.nom.trim()) {
        return;
      }
      try {
        const result = await createRepertoire(
          props.chantierId,
          newRepertoireForm.value.nom.trim()
        );
        if (!result.error) {
          newRepertoireForm.value = { nom: "" };
          emit("changed");
        }
      } catch (error) {
        console.error("Erreur lors de la création:", error);
      }
    };
    const openDeleteModal = (repertoire) => {
      repertoireToDelete.value = repertoire;
      isDeleteModalOpen.value = true;
    };
    const confirmDeleteRepertoire = async () => {
      if (!repertoireToDelete.value) return;
      const repertoireId = repertoireToDelete.value.id;
      try {
        const result = await deleteRepertoire(repertoireId);
        if (!result.error) {
          if (selectedRepertoireId.value === repertoireId) {
            selectedRepertoireId.value = null;
          }
          isDeleteModalOpen.value = false;
          repertoireToDelete.value = null;
          emit("changed");
        }
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
      }
    };
    const cancelDelete = () => {
      isDeleteModalOpen.value = false;
      repertoireToDelete.value = null;
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppButtonValidated = _sfc_main$2$1;
      const _component_Icon = __nuxt_component_1;
      const _component_AppSlideOver = _sfc_main$1$1;
      const _component_AppSlideOverContent = _sfc_main$p;
      const _component_AppInput = _sfc_main$1$2;
      const _component_AppModal = _sfc_main$r;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-4 border p-4 rounded-lg border-gray-300 dark:border-gray-700" }, _attrs))}><div class="flex items-center justify-between"><h3 class="text-lg font-semibold">Dossiers</h3>`);
      _push(ssrRenderComponent(_component_AppButtonValidated, {
        type: "button",
        theme: "primary",
        onClick: ($event) => openSidebar()
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<span class="flex items-center gap-2"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:folder-edit",
              size: "16"
            }, null, _parent2, _scopeId));
            _push2(` Edition </span>`);
          } else {
            return [
              createVNode("span", { class: "flex items-center gap-2" }, [
                createVNode(_component_Icon, {
                  name: "lucide:folder-edit",
                  size: "16"
                }),
                createTextVNode(" Edition ")
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="flex flex-wrap gap-2"><button type="button" class="${ssrRenderClass([
        selectedRepertoireId.value === null ? "bg-primary-200 text-primary-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700",
        "bg-gray-100 text-gray-500 hover:bg-primary-200 hover:text-primary-700 rounded-lg p-2 cursor-pointer text-sm flex items-center gap-2"
      ])}">`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:images",
        size: "16"
      }, null, _parent));
      _push(` Toutes les photos </button><!--[-->`);
      ssrRenderList(unref(repertoires), (repertoire) => {
        _push(`<button type="button" class="${ssrRenderClass([
          selectedRepertoireId.value === repertoire.id ? "bg-primary-200 text-primary-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700",
          "bg-gray-100 text-gray-500 hover:bg-primary-200 hover:text-primary-700 rounded-lg p-2 cursor-pointer text-sm flex items-center gap-2"
        ])}">`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:folder",
          size: "16"
        }, null, _parent));
        _push(` ${ssrInterpolate(repertoire.nom)}</button>`);
      });
      _push(`<!--]--></div>`);
      _push(ssrRenderComponent(_component_AppSlideOver, {
        sideModal: unref(isSidebarOpen),
        closeSideModal: closeSidebar
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (unref(isSidebarOpen)) {
              _push2(ssrRenderComponent(_component_AppSlideOverContent, { closeSideModal: closeSidebar }, {
                header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<h3 class="text-lg font-semibold"${_scopeId2}>Gestion des dossiers</h3>`);
                  } else {
                    return [
                      createVNode("h3", { class: "text-lg font-semibold" }, "Gestion des dossiers")
                    ];
                  }
                }),
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="flex flex-col h-full"${_scopeId2}><div class="flex-1 overflow-y-auto space-y-2 mb-4"${_scopeId2}>`);
                    if (unref(repertoires).length === 0) {
                      _push3(`<div class="text-center py-8 text-muted text-sm"${_scopeId2}>`);
                      _push3(ssrRenderComponent(_component_Icon, {
                        name: "lucide:folder-edit",
                        size: "28",
                        class: "mx-auto mb-2 opacity-50"
                      }, null, _parent3, _scopeId2));
                      _push3(`<p${_scopeId2}>Aucun répertoire</p><p class="text-xs mt-1"${_scopeId2}>Créez un répertoire ci-dessous</p></div>`);
                    } else {
                      _push3(`<!---->`);
                    }
                    _push3(`<!--[-->`);
                    ssrRenderList(unref(repertoires), (repertoire) => {
                      _push3(`<div${_scopeId2}>`);
                      if (!unref(editingRepertoires)[repertoire.id]) {
                        _push3(`<div class="space-y-1"${_scopeId2}><div class="flex items-start justify-between gap-2"${_scopeId2}><div class="flex items-center gap-3"${_scopeId2}><div class="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center"${_scopeId2}>`);
                        _push3(ssrRenderComponent(_component_Icon, {
                          name: "lucide:folder",
                          size: "16",
                          class: "text-primary-500"
                        }, null, _parent3, _scopeId2));
                        _push3(`</div><span class="font-medium text-gray-900 dark:text-white"${_scopeId2}>${ssrInterpolate(repertoire.nom)}</span></div><div class="flex items-center justify-center gap-1"${_scopeId2}><button class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Modifier"${_scopeId2}>`);
                        _push3(ssrRenderComponent(_component_Icon, {
                          name: "lucide:pencil",
                          class: "w-4 h-4 text-gray-500 hover:text-primary-500"
                        }, null, _parent3, _scopeId2));
                        _push3(`</button><button class="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Supprimer"${_scopeId2}>`);
                        _push3(ssrRenderComponent(_component_Icon, {
                          name: "lucide:trash-2",
                          class: "w-4 h-4 text-gray-500 hover:text-red-500"
                        }, null, _parent3, _scopeId2));
                        _push3(`</button></div></div></div>`);
                      } else {
                        _push3(`<div class="border border-primary rounded-lg p-4 space-y-4"${_scopeId2}>`);
                        _push3(ssrRenderComponent(_component_AppInput, {
                          modelValue: unref(editingRepertoires)[repertoire.id].nom,
                          "onUpdate:modelValue": ($event) => unref(editingRepertoires)[repertoire.id].nom = $event,
                          placeholder: "Ex: Avant travaux",
                          onKeyup: ($event) => handleSaveRepertoire(repertoire.id),
                          title: "Nom du répertoire",
                          name: "repertoire"
                        }, null, _parent3, _scopeId2));
                        _push3(`<div class="flex justify-end gap-2"${_scopeId2}>`);
                        _push3(ssrRenderComponent(_component_AppButtonValidated, {
                          type: "button",
                          theme: "secondary",
                          onClick: ($event) => cancelEdit(repertoire.id)
                        }, {
                          default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                            if (_push4) {
                              _push4(`<span class="flex items-center gap-2"${_scopeId3}>`);
                              _push4(ssrRenderComponent(_component_Icon, {
                                name: "lucide:x",
                                size: "16"
                              }, null, _parent4, _scopeId3));
                              _push4(` Annuler </span>`);
                            } else {
                              return [
                                createVNode("span", { class: "flex items-center gap-2" }, [
                                  createVNode(_component_Icon, {
                                    name: "lucide:x",
                                    size: "16"
                                  }),
                                  createTextVNode(" Annuler ")
                                ])
                              ];
                            }
                          }),
                          _: 2
                        }, _parent3, _scopeId2));
                        _push3(ssrRenderComponent(_component_AppButtonValidated, {
                          type: "button",
                          theme: "secondary",
                          onClick: ($event) => handleSaveRepertoire(repertoire.id),
                          disabled: !unref(editingRepertoires)[repertoire.id].nom.trim()
                        }, {
                          default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                            if (_push4) {
                              _push4(`<span class="flex items-center gap-2"${_scopeId3}>`);
                              _push4(ssrRenderComponent(_component_Icon, {
                                name: "lucide:save",
                                size: "16"
                              }, null, _parent4, _scopeId3));
                              _push4(` Enregistrer </span>`);
                            } else {
                              return [
                                createVNode("span", { class: "flex items-center gap-2" }, [
                                  createVNode(_component_Icon, {
                                    name: "lucide:save",
                                    size: "16"
                                  }),
                                  createTextVNode(" Enregistrer ")
                                ])
                              ];
                            }
                          }),
                          _: 2
                        }, _parent3, _scopeId2));
                        _push3(`</div></div>`);
                      }
                      _push3(`</div>`);
                    });
                    _push3(`<!--]--></div><div class="border-t border-gray-300 my-4"${_scopeId2}></div><div class="border border-gray-300 rounded-lg p-4 space-y-4"${_scopeId2}><h4 class="font-semibold text-base"${_scopeId2}>Nouveau dossier</h4>`);
                    _push3(ssrRenderComponent(_component_AppInput, {
                      modelValue: unref(newRepertoireForm).nom,
                      "onUpdate:modelValue": ($event) => unref(newRepertoireForm).nom = $event,
                      placeholder: "Ex: Avant travaux",
                      onKeyup: handleAddRepertoire,
                      title: "Nom du répertoire",
                      name: "repertoire"
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppButtonValidated, {
                      type: "button",
                      theme: "secondary",
                      onClick: handleAddRepertoire,
                      validated: !!unref(newRepertoireForm).nom.trim()
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`<span class="flex items-center gap-2"${_scopeId3}>`);
                          _push4(ssrRenderComponent(_component_Icon, {
                            name: "lucide:plus",
                            size: "16"
                          }, null, _parent4, _scopeId3));
                          _push4(` Ajouter le dossier </span>`);
                        } else {
                          return [
                            createVNode("span", { class: "flex items-center gap-2" }, [
                              createVNode(_component_Icon, {
                                name: "lucide:plus",
                                size: "16"
                              }),
                              createTextVNode(" Ajouter le dossier ")
                            ])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(`</div></div>`);
                  } else {
                    return [
                      createVNode("div", { class: "flex flex-col h-full" }, [
                        createVNode("div", { class: "flex-1 overflow-y-auto space-y-2 mb-4" }, [
                          unref(repertoires).length === 0 ? (openBlock(), createBlock("div", {
                            key: 0,
                            class: "text-center py-8 text-muted text-sm"
                          }, [
                            createVNode(_component_Icon, {
                              name: "lucide:folder-edit",
                              size: "28",
                              class: "mx-auto mb-2 opacity-50"
                            }),
                            createVNode("p", null, "Aucun répertoire"),
                            createVNode("p", { class: "text-xs mt-1" }, "Créez un répertoire ci-dessous")
                          ])) : createCommentVNode("", true),
                          (openBlock(true), createBlock(Fragment, null, renderList(unref(repertoires), (repertoire) => {
                            return openBlock(), createBlock("div", {
                              key: repertoire.id
                            }, [
                              !unref(editingRepertoires)[repertoire.id] ? (openBlock(), createBlock("div", {
                                key: 0,
                                class: "space-y-1"
                              }, [
                                createVNode("div", { class: "flex items-start justify-between gap-2" }, [
                                  createVNode("div", { class: "flex items-center gap-3" }, [
                                    createVNode("div", { class: "w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center" }, [
                                      createVNode(_component_Icon, {
                                        name: "lucide:folder",
                                        size: "16",
                                        class: "text-primary-500"
                                      })
                                    ]),
                                    createVNode("span", { class: "font-medium text-gray-900 dark:text-white" }, toDisplayString(repertoire.nom), 1)
                                  ]),
                                  createVNode("div", { class: "flex items-center justify-center gap-1" }, [
                                    createVNode("button", {
                                      class: "p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                                      onClick: withModifiers(($event) => startEdit(repertoire), ["stop"]),
                                      title: "Modifier"
                                    }, [
                                      createVNode(_component_Icon, {
                                        name: "lucide:pencil",
                                        class: "w-4 h-4 text-gray-500 hover:text-primary-500"
                                      })
                                    ], 8, ["onClick"]),
                                    createVNode("button", {
                                      class: "p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors",
                                      onClick: withModifiers(($event) => openDeleteModal(repertoire), ["stop"]),
                                      title: "Supprimer"
                                    }, [
                                      createVNode(_component_Icon, {
                                        name: "lucide:trash-2",
                                        class: "w-4 h-4 text-gray-500 hover:text-red-500"
                                      })
                                    ], 8, ["onClick"])
                                  ])
                                ])
                              ])) : (openBlock(), createBlock("div", {
                                key: 1,
                                class: "border border-primary rounded-lg p-4 space-y-4"
                              }, [
                                createVNode(_component_AppInput, {
                                  modelValue: unref(editingRepertoires)[repertoire.id].nom,
                                  "onUpdate:modelValue": ($event) => unref(editingRepertoires)[repertoire.id].nom = $event,
                                  placeholder: "Ex: Avant travaux",
                                  onKeyup: withKeys(($event) => handleSaveRepertoire(repertoire.id), ["enter"]),
                                  title: "Nom du répertoire",
                                  name: "repertoire"
                                }, null, 8, ["modelValue", "onUpdate:modelValue", "onKeyup"]),
                                createVNode("div", { class: "flex justify-end gap-2" }, [
                                  createVNode(_component_AppButtonValidated, {
                                    type: "button",
                                    theme: "secondary",
                                    onClick: ($event) => cancelEdit(repertoire.id)
                                  }, {
                                    default: withCtx(() => [
                                      createVNode("span", { class: "flex items-center gap-2" }, [
                                        createVNode(_component_Icon, {
                                          name: "lucide:x",
                                          size: "16"
                                        }),
                                        createTextVNode(" Annuler ")
                                      ])
                                    ]),
                                    _: 1
                                  }, 8, ["onClick"]),
                                  createVNode(_component_AppButtonValidated, {
                                    type: "button",
                                    theme: "secondary",
                                    onClick: ($event) => handleSaveRepertoire(repertoire.id),
                                    disabled: !unref(editingRepertoires)[repertoire.id].nom.trim()
                                  }, {
                                    default: withCtx(() => [
                                      createVNode("span", { class: "flex items-center gap-2" }, [
                                        createVNode(_component_Icon, {
                                          name: "lucide:save",
                                          size: "16"
                                        }),
                                        createTextVNode(" Enregistrer ")
                                      ])
                                    ]),
                                    _: 1
                                  }, 8, ["onClick", "disabled"])
                                ])
                              ]))
                            ]);
                          }), 128))
                        ]),
                        createVNode("div", { class: "border-t border-gray-300 my-4" }),
                        createVNode("div", { class: "border border-gray-300 rounded-lg p-4 space-y-4" }, [
                          createVNode("h4", { class: "font-semibold text-base" }, "Nouveau dossier"),
                          createVNode(_component_AppInput, {
                            modelValue: unref(newRepertoireForm).nom,
                            "onUpdate:modelValue": ($event) => unref(newRepertoireForm).nom = $event,
                            placeholder: "Ex: Avant travaux",
                            onKeyup: withKeys(handleAddRepertoire, ["enter"]),
                            title: "Nom du répertoire",
                            name: "repertoire"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                          createVNode(_component_AppButtonValidated, {
                            type: "button",
                            theme: "secondary",
                            onClick: handleAddRepertoire,
                            validated: !!unref(newRepertoireForm).nom.trim()
                          }, {
                            default: withCtx(() => [
                              createVNode("span", { class: "flex items-center gap-2" }, [
                                createVNode(_component_Icon, {
                                  name: "lucide:plus",
                                  size: "16"
                                }),
                                createTextVNode(" Ajouter le dossier ")
                              ])
                            ]),
                            _: 1
                          }, 8, ["validated"])
                        ])
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
              unref(isSidebarOpen) ? (openBlock(), createBlock(_component_AppSlideOverContent, {
                key: 0,
                closeSideModal: closeSidebar
              }, {
                header: withCtx(() => [
                  createVNode("h3", { class: "text-lg font-semibold" }, "Gestion des dossiers")
                ]),
                default: withCtx(() => [
                  createVNode("div", { class: "flex flex-col h-full" }, [
                    createVNode("div", { class: "flex-1 overflow-y-auto space-y-2 mb-4" }, [
                      unref(repertoires).length === 0 ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "text-center py-8 text-muted text-sm"
                      }, [
                        createVNode(_component_Icon, {
                          name: "lucide:folder-edit",
                          size: "28",
                          class: "mx-auto mb-2 opacity-50"
                        }),
                        createVNode("p", null, "Aucun répertoire"),
                        createVNode("p", { class: "text-xs mt-1" }, "Créez un répertoire ci-dessous")
                      ])) : createCommentVNode("", true),
                      (openBlock(true), createBlock(Fragment, null, renderList(unref(repertoires), (repertoire) => {
                        return openBlock(), createBlock("div", {
                          key: repertoire.id
                        }, [
                          !unref(editingRepertoires)[repertoire.id] ? (openBlock(), createBlock("div", {
                            key: 0,
                            class: "space-y-1"
                          }, [
                            createVNode("div", { class: "flex items-start justify-between gap-2" }, [
                              createVNode("div", { class: "flex items-center gap-3" }, [
                                createVNode("div", { class: "w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center" }, [
                                  createVNode(_component_Icon, {
                                    name: "lucide:folder",
                                    size: "16",
                                    class: "text-primary-500"
                                  })
                                ]),
                                createVNode("span", { class: "font-medium text-gray-900 dark:text-white" }, toDisplayString(repertoire.nom), 1)
                              ]),
                              createVNode("div", { class: "flex items-center justify-center gap-1" }, [
                                createVNode("button", {
                                  class: "p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                                  onClick: withModifiers(($event) => startEdit(repertoire), ["stop"]),
                                  title: "Modifier"
                                }, [
                                  createVNode(_component_Icon, {
                                    name: "lucide:pencil",
                                    class: "w-4 h-4 text-gray-500 hover:text-primary-500"
                                  })
                                ], 8, ["onClick"]),
                                createVNode("button", {
                                  class: "p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors",
                                  onClick: withModifiers(($event) => openDeleteModal(repertoire), ["stop"]),
                                  title: "Supprimer"
                                }, [
                                  createVNode(_component_Icon, {
                                    name: "lucide:trash-2",
                                    class: "w-4 h-4 text-gray-500 hover:text-red-500"
                                  })
                                ], 8, ["onClick"])
                              ])
                            ])
                          ])) : (openBlock(), createBlock("div", {
                            key: 1,
                            class: "border border-primary rounded-lg p-4 space-y-4"
                          }, [
                            createVNode(_component_AppInput, {
                              modelValue: unref(editingRepertoires)[repertoire.id].nom,
                              "onUpdate:modelValue": ($event) => unref(editingRepertoires)[repertoire.id].nom = $event,
                              placeholder: "Ex: Avant travaux",
                              onKeyup: withKeys(($event) => handleSaveRepertoire(repertoire.id), ["enter"]),
                              title: "Nom du répertoire",
                              name: "repertoire"
                            }, null, 8, ["modelValue", "onUpdate:modelValue", "onKeyup"]),
                            createVNode("div", { class: "flex justify-end gap-2" }, [
                              createVNode(_component_AppButtonValidated, {
                                type: "button",
                                theme: "secondary",
                                onClick: ($event) => cancelEdit(repertoire.id)
                              }, {
                                default: withCtx(() => [
                                  createVNode("span", { class: "flex items-center gap-2" }, [
                                    createVNode(_component_Icon, {
                                      name: "lucide:x",
                                      size: "16"
                                    }),
                                    createTextVNode(" Annuler ")
                                  ])
                                ]),
                                _: 1
                              }, 8, ["onClick"]),
                              createVNode(_component_AppButtonValidated, {
                                type: "button",
                                theme: "secondary",
                                onClick: ($event) => handleSaveRepertoire(repertoire.id),
                                disabled: !unref(editingRepertoires)[repertoire.id].nom.trim()
                              }, {
                                default: withCtx(() => [
                                  createVNode("span", { class: "flex items-center gap-2" }, [
                                    createVNode(_component_Icon, {
                                      name: "lucide:save",
                                      size: "16"
                                    }),
                                    createTextVNode(" Enregistrer ")
                                  ])
                                ]),
                                _: 1
                              }, 8, ["onClick", "disabled"])
                            ])
                          ]))
                        ]);
                      }), 128))
                    ]),
                    createVNode("div", { class: "border-t border-gray-300 my-4" }),
                    createVNode("div", { class: "border border-gray-300 rounded-lg p-4 space-y-4" }, [
                      createVNode("h4", { class: "font-semibold text-base" }, "Nouveau dossier"),
                      createVNode(_component_AppInput, {
                        modelValue: unref(newRepertoireForm).nom,
                        "onUpdate:modelValue": ($event) => unref(newRepertoireForm).nom = $event,
                        placeholder: "Ex: Avant travaux",
                        onKeyup: withKeys(handleAddRepertoire, ["enter"]),
                        title: "Nom du répertoire",
                        name: "repertoire"
                      }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                      createVNode(_component_AppButtonValidated, {
                        type: "button",
                        theme: "secondary",
                        onClick: handleAddRepertoire,
                        validated: !!unref(newRepertoireForm).nom.trim()
                      }, {
                        default: withCtx(() => [
                          createVNode("span", { class: "flex items-center gap-2" }, [
                            createVNode(_component_Icon, {
                              name: "lucide:plus",
                              size: "16"
                            }),
                            createTextVNode(" Ajouter le dossier ")
                          ])
                        ]),
                        _: 1
                      }, 8, ["validated"])
                    ])
                  ])
                ]),
                _: 1
              })) : createCommentVNode("", true)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_AppModal, {
        modelValue: unref(isDeleteModalOpen),
        "onUpdate:modelValue": ($event) => isRef(isDeleteModalOpen) ? isDeleteModalOpen.value = $event : null,
        size: "lg",
        showCloseButton: false
      }, {
        header: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="text-center"${_scopeId}><div class="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:triangle-alert",
              size: "28",
              class: "text-red-600 dark:text-red-400"
            }, null, _parent2, _scopeId));
            _push2(`</div><h3 class="text-lg font-semibold text-gray-900 dark:text-white"${_scopeId}> Supprimer un dossier </h3></div>`);
          } else {
            return [
              createVNode("div", { class: "text-center" }, [
                createVNode("div", { class: "w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center" }, [
                  createVNode(_component_Icon, {
                    name: "lucide:triangle-alert",
                    size: "28",
                    class: "text-red-600 dark:text-red-400"
                  })
                ]),
                createVNode("h3", { class: "text-lg font-semibold text-gray-900 dark:text-white" }, " Supprimer un dossier ")
              ])
            ];
          }
        }),
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<p class="text-sm text-muted"${_scopeId}> Les photos qu&#39;il contient seront déplacées sans répertoire. Cette action est irréversible. </p>`);
          } else {
            return [
              createVNode("p", { class: "text-sm text-muted" }, " Les photos qu'il contient seront déplacées sans répertoire. Cette action est irréversible. ")
            ];
          }
        }),
        footer: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex justify-end gap-2"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_AppButtonValidated, {
              type: "button",
              theme: "cancel",
              onClick: cancelDelete
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(` Annuler `);
                } else {
                  return [
                    createTextVNode(" Annuler ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_AppButtonValidated, {
              type: "button",
              theme: "delete",
              onClick: confirmDeleteRepertoire
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(` Supprimer `);
                } else {
                  return [
                    createTextVNode(" Supprimer ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", { class: "flex justify-end gap-2" }, [
                createVNode(_component_AppButtonValidated, {
                  type: "button",
                  theme: "cancel",
                  onClick: cancelDelete
                }, {
                  default: withCtx(() => [
                    createTextVNode(" Annuler ")
                  ]),
                  _: 1
                }),
                createVNode(_component_AppButtonValidated, {
                  type: "button",
                  theme: "delete",
                  onClick: confirmDeleteRepertoire
                }, {
                  default: withCtx(() => [
                    createTextVNode(" Supprimer ")
                  ]),
                  _: 1
                })
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
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/photos/repertoireManager.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const _sfc_main$5 = {
  __name: "PhotosPhotoUploader",
  __ssrInlineRender: true,
  props: {
    chantierId: {
      type: [String, Number],
      required: true
    },
    repertoireId: {
      type: [String, Number],
      default: null
    }
  },
  emits: ["uploaded", "error"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const { uploadMultiplePhotos } = usePhotos();
    const { addToast } = useToast();
    const isUploading = ref(false);
    const uploadProgress = ref(0);
    ref(null);
    const selectedFiles = ref([]);
    const uploadingFiles = ref([]);
    const uploadedCount = ref(0);
    const totalPhotos = ref(0);
    const loadImage = (file) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(img);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error("Impossible de charger l'image"));
        };
        img.src = url;
      });
    };
    const resizeImage = async (file) => {
      try {
        const img = await loadImage(file);
        const canvas = (void 0).createElement("canvas");
        const ctx = canvas.getContext("2d");
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        return new Promise((resolve, reject) => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
                const newFile = new File([blob], newFileName, {
                  type: "image/webp"
                });
                resolve(newFile);
              } else {
                reject(new Error("Impossible de créer le blob"));
              }
            },
            "image/webp",
            0.75
            // Qualité de compression
          );
        });
      } catch (error) {
        console.error("Erreur lors du redimensionnement:", error);
        return file;
      }
    };
    const uploadFiles = async () => {
      if (selectedFiles.value.length === 0) return;
      isUploading.value = true;
      uploadProgress.value = 0;
      uploadedCount.value = 0;
      totalPhotos.value = selectedFiles.value.length;
      uploadingFiles.value = selectedFiles.value.map((item) => ({
        name: item.name,
        size: item.size,
        progress: 0,
        completed: false
      }));
      try {
        const resizedFiles = await Promise.all(
          selectedFiles.value.map(async (item) => {
            try {
              return await resizeImage(item.file);
            } catch (error) {
              console.error(
                `Erreur lors du redimensionnement de ${item.name}:`,
                error
              );
              return item.file;
            }
          })
        );
        const onProgress = (index, progress, total) => {
          if (uploadingFiles.value[index]) {
            uploadingFiles.value[index].progress = Math.round(progress);
            if (progress >= 100 && !uploadingFiles.value[index].completed) {
              uploadingFiles.value[index].completed = true;
            }
          }
          const completedPhotos = uploadingFiles.value.filter(
            (f) => f.completed
          ).length;
          uploadedCount.value = completedPhotos;
          const overallProgress = total > 0 ? Math.round(completedPhotos / total * 100) : 0;
          uploadProgress.value = overallProgress;
        };
        const results = await uploadMultiplePhotos(
          resizedFiles,
          props.chantierId,
          props.repertoireId,
          onProgress
        );
        const errors = results.filter((r) => r.error);
        const successes = results.filter((r) => !r.error);
        if (errors.length > 0) {
          errors.forEach((result) => {
            addToast({
              title: "Upload error",
              message: result.error?.message || "Erreur lors de l'upload",
              type: "Error"
            });
          });
          emit("error", errors);
        }
        if (successes.length > 0) {
          addToast({
            title: "Upload success",
            message: `${successes.length} photo(s) uploadée(s) avec succès`,
            type: "Success"
          });
          emit(
            "uploaded",
            successes.map((r) => r.data)
          );
          selectedFiles.value.forEach((item) => {
            if (item.preview) {
              URL.revokeObjectURL(item.preview);
            }
          });
          selectedFiles.value = [];
        }
        uploadProgress.value = 100;
        uploadedCount.value = totalPhotos.value;
      } catch (error) {
        console.error("Erreur lors de l'upload:", error);
        addToast({
          title: "Erreur upload",
          message: error.message || "Erreur lors de l'upload des photos",
          type: "Error"
        });
        emit("error", [error]);
      } finally {
        setTimeout(() => {
          isUploading.value = false;
          uploadingFiles.value = [];
          uploadProgress.value = 0;
          uploadedCount.value = 0;
          totalPhotos.value = 0;
        }, 1e3);
      }
    };
    const formatFileSize = (bytes) => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Icon = __nuxt_component_1;
      const _component_AppButtonValidated = _sfc_main$2$1;
      _push(`<!--[--><div class="space-y-4"><div class="${ssrRenderClass([unref(isUploading) ? "border-primary bg-primary/5" : "border-muted", "border-2 border-dashed border-gray-400 rounded-lg p-6 text-center transition-colors cursor-pointer hover:border-primary"])}"><input type="file" accept="image/*" multiple class="hidden">`);
      if (!unref(isUploading)) {
        _push(`<div class="space-y-2">`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:upload-cloud",
          size: "44",
          class: "text-gray-700 mx-auto"
        }, null, _parent));
        _push(`<p class="text-sm font-medium text-gray-900 dark:text-white"> Glisser-déposer des photos ici </p><p class="text-xs text-gray-500 dark:text-gray-400 mt-1"> ou cliquez pour sélectionner </p><p class="text-xs text-gray-500 dark:text-gray-400 mt-1"> Formats acceptés: JPG, PNG, WEBP, GIF (max 50MB) </p></div>`);
      } else {
        _push(`<div class="space-y-4 relative w-32 h-32 mx-auto"><svg class="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" stroke-width="8" class="text-muted"></circle><circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"${ssrRenderAttr("stroke-dasharray", 2 * Math.PI * 50)}${ssrRenderAttr("stroke-dashoffset", 2 * Math.PI * 50 * (1 - unref(uploadProgress) / 100))} class="text-primary transition-all duration-300"></circle></svg><div class="absolute inset-0 flex flex-col items-center justify-center"><div class="text-lg font-semibold">${ssrInterpolate(unref(uploadedCount))} / ${ssrInterpolate(unref(totalPhotos))}</div><div class="text-xs text-muted mt-1">photos</div></div></div>`);
      }
      _push(`<div class="space-y-2 max-h-40 overflow-y-auto"><!--[-->`);
      ssrRenderList(unref(uploadingFiles), (file, index) => {
        _push(`<div class="text-xs text-left p-2 bg-muted/50 rounded"><div class="flex items-center justify-between mb-1"><span class="truncate flex-1">${ssrInterpolate(file.name)}</span><span class="ml-2 text-muted">${ssrInterpolate(formatFileSize(file.size))}</span></div><div class="w-full bg-elevated rounded-full h-1.5"><div class="bg-primary h-1.5 rounded-full transition-all duration-300" style="${ssrRenderStyle({ width: `${file.progress}%` })}"></div></div></div>`);
      });
      _push(`<!--]--></div></div></div>`);
      if (!unref(isUploading) && unref(selectedFiles).length > 0) {
        _push(`<div class="space-y-2 mt-4"><div class="text-sm font-medium"> Photos sélectionnées (${ssrInterpolate(unref(selectedFiles).length)}) </div><div class="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto"><!--[-->`);
        ssrRenderList(unref(selectedFiles), (item, index) => {
          _push(`<div class="relative aspect-square rounded-lg overflow-hidden group"><img${ssrRenderAttr("src", item.preview)}${ssrRenderAttr("alt", item.name)} class="w-full h-full object-cover"><div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><button aria-label="Retirer" class="cursor-pointer w-8 h-8 rounded bg-red-300 flex items-center justify-center hover:bg-red-600 transition-colors">`);
          _push(ssrRenderComponent(_component_Icon, {
            name: "lucide:x",
            size: "16",
            class: "text-white"
          }, null, _parent));
          _push(`</button></div><div class="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">${ssrInterpolate(item.name)}</div></div>`);
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (!unref(isUploading) && unref(selectedFiles).length > 0) {
        _push(`<div class="mt-auto pt-4 border-t border-gray-300 flex justify-center">`);
        _push(ssrRenderComponent(_component_AppButtonValidated, {
          theme: "primary",
          block: "",
          size: "lg",
          onClick: uploadFiles,
          class: "",
          disabled: unref(isUploading)
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(_component_Icon, {
                name: "lucide:upload",
                size: "16",
                class: "mr-2"
              }, null, _parent2, _scopeId));
              _push2(`<span${_scopeId}>Envoyer ${ssrInterpolate(unref(selectedFiles).length)} photo(s)</span>`);
            } else {
              return [
                createVNode(_component_Icon, {
                  name: "lucide:upload",
                  size: "16",
                  class: "mr-2"
                }),
                createVNode("span", null, "Envoyer " + toDisplayString(unref(selectedFiles).length) + " photo(s)", 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<!--]-->`);
    };
  }
};
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/photos/photoUploader.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const _sfc_main$4 = {
  __name: "AppModalFullScreen",
  __ssrInlineRender: true,
  props: /* @__PURE__ */ mergeModels({
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
          _push2(`<div class="fixed inset-0 z-50 flex items-center justify-center"><div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>`);
          if (model.value) {
            _push2(`<div class="relative w-full bg-black dark:bg-gray-800 overflow-hidden flex flex-col justify-center items-center h-dvh">`);
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
            _push2(`<div class="overflow-hidden">`);
            ssrRenderSlot(_ctx.$slots, "default", {}, null, _push2, _parent);
            _push2(`</div></div>`);
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
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/app/modalFullScreen.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const _sfc_main$3 = {
  __name: "PhotosGaleriePhoto",
  __ssrInlineRender: true,
  props: {
    photos: {
      type: Array,
      default: () => []
    },
    repertoireId: {
      type: [String, Number],
      default: null
    }
  },
  emits: ["photo-deleted", "photo-moved"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const {
      getSignedPhotoUrl,
      deletePhoto,
      movePhotoToRepertoire,
      repertoires,
      getRepertoires
    } = usePhotos();
    const photoUrls = ref({});
    const isDeleteModalOpen = ref(false);
    const photoToDelete = ref(null);
    const isViewerModalOpen = ref(false);
    const currentPhotoIndex = ref(0);
    const loadPhotoUrls = async () => {
      const photosToLoad = props.photos.filter(
        (photo) => photo.chemin_storage && !photoUrls.value[photo.id]
      );
      await Promise.all(
        photosToLoad.map(async (photo) => {
          try {
            const url = await getSignedPhotoUrl(photo.chemin_storage, 3600);
            if (url) {
              photoUrls.value[photo.id] = url;
            }
          } catch (error) {
            console.error("Erreur lors du chargement de l'URL:", error);
          }
        })
      );
    };
    const loadRepertoires = async () => {
      if (props.photos.length > 0) {
        const chantierId = props.photos[0]?.chantier_id;
        if (chantierId) {
          await getRepertoires(chantierId);
        }
      }
    };
    watch(
      () => props.photos,
      () => {
        loadPhotoUrls();
        loadRepertoires();
      },
      { immediate: true }
    );
    const openDeleteModal = (photo, event) => {
      photoToDelete.value = photo;
      isDeleteModalOpen.value = true;
    };
    const movePhoto = async (photo, targetRepertoireId) => {
      try {
        const result = await movePhotoToRepertoire(photo.id, targetRepertoireId);
        if (!result.error) {
          emit("photo-moved", {
            photoId: photo.id,
            repertoireId: targetRepertoireId
          });
        }
      } catch (error) {
        console.error("Erreur lors du déplacement de la photo:", error);
      }
    };
    const availableRepertoires = computed(() => {
      return repertoires.value.filter((r) => r.id !== props.repertoireId);
    });
    const getDropdownItems = (photo) => {
      const items = [];
      const moveOptions = [];
      if (props.repertoireId !== null) {
        moveOptions.push({
          label: "Toutes les photos",
          icon: "lucide:images",
          onSelect: () => movePhoto(photo, null)
        });
      }
      availableRepertoires.value.forEach((repertoire) => {
        moveOptions.push({
          label: repertoire.nom,
          icon: "lucide:folder",
          onSelect: () => movePhoto(photo, repertoire.id)
        });
      });
      if (moveOptions.length > 0) {
        items.push([
          {
            label: "Déplacer vers…",
            icon: "lucide:folder",
            children: [moveOptions]
          }
        ]);
      }
      items.push([
        {
          label: "Supprimer",
          icon: "lucide:trash-2",
          color: "error",
          onSelect: () => openDeleteModal(photo)
        }
      ]);
      return items;
    };
    const confirmDeletePhoto = async () => {
      if (!photoToDelete.value) return;
      const photoId = photoToDelete.value.id;
      try {
        const result = await deletePhoto(photoId);
        if (!result.error) {
          if (photoUrls.value[photoId]) {
            delete photoUrls.value[photoId];
          }
          isDeleteModalOpen.value = false;
          photoToDelete.value = null;
          emit("photo-deleted", photoId);
        }
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
      }
    };
    const cancelDelete = () => {
      isDeleteModalOpen.value = false;
      photoToDelete.value = null;
    };
    const closeViewer = () => {
      isViewerModalOpen.value = false;
    };
    const previousPhoto = () => {
      if (currentPhotoIndex.value > 0) {
        currentPhotoIndex.value--;
      } else {
        currentPhotoIndex.value = props.photos.length - 1;
      }
    };
    const nextPhoto = () => {
      if (currentPhotoIndex.value < props.photos.length - 1) {
        currentPhotoIndex.value++;
      } else {
        currentPhotoIndex.value = 0;
      }
    };
    const currentPhoto = computed(() => {
      return props.photos[currentPhotoIndex.value] || null;
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Icon = __nuxt_component_1;
      const _component_AppDropdownMenu = __nuxt_component_2;
      const _component_AppModal = _sfc_main$r;
      const _component_AppButtonValidated = _sfc_main$2$1;
      const _component_AppModalFullScreen = _sfc_main$4;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-4" }, _attrs))}>`);
      if (__props.photos.length > 0) {
        _push(`<div class="columns-2 sm:columns-4 md:columns-5 gap-4"><!--[-->`);
        ssrRenderList(__props.photos, (photo) => {
          _push(`<div class="group relative rounded-lg overflow-hidden cursor-pointer bg-muted hover:shadow-xl transition-shadow duration-300 mb-4 break-inside-avoid">`);
          if (unref(photoUrls)[photo.id]) {
            _push(`<img${ssrRenderAttr("src", unref(photoUrls)[photo.id])}${ssrRenderAttr("alt", photo.nom_fichier)} class="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy">`);
          } else {
            _push(`<div class="w-full aspect-square flex items-center justify-center bg-muted">`);
            _push(ssrRenderComponent(_component_Icon, {
              name: "lucide:loader-2",
              size: "28",
              class: "animate-spin text-gray-400"
            }, null, _parent));
            _push(`</div>`);
          }
          _push(`<div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 pointer-events-none"><div class="flex justify-end gap-2 z-50 pointer-events-auto">`);
          _push(ssrRenderComponent(_component_AppDropdownMenu, {
            trigger: "hover",
            onClick: () => {
            }
          }, {
            trigger: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<div class="w-8 h-8 rounded-lg cursor-pointer bg-primary-500 dark:bg-primary-900/30 flex items-center justify-center hover:shadow-lg hover:scale-110 transition-all duration-300"${_scopeId}>`);
                _push2(ssrRenderComponent(_component_Icon, {
                  name: "lucide:more-horizontal",
                  size: "16",
                  class: "text-primary-50"
                }, null, _parent2, _scopeId));
                _push2(`</div>`);
              } else {
                return [
                  createVNode("div", { class: "w-8 h-8 rounded-lg cursor-pointer bg-primary-500 dark:bg-primary-900/30 flex items-center justify-center hover:shadow-lg hover:scale-110 transition-all duration-300" }, [
                    createVNode(_component_Icon, {
                      name: "lucide:more-horizontal",
                      size: "16",
                      class: "text-primary-50"
                    })
                  ])
                ];
              }
            }),
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<div class="space-y-2"${_scopeId}><div${_scopeId}><div class="text-sm font-medium text-center cursor-default w-full text-primary-700"${_scopeId}> Déplacer vers : </div><!--[-->`);
                ssrRenderList(getDropdownItems(photo)[0][0].children, (item) => {
                  _push2(`<div${_scopeId}><!--[-->`);
                  ssrRenderList(item, (child) => {
                    _push2(`<div class=""${_scopeId}><div class="flex items-center gap-2 group cursor-pointer hover:bg-primary-100 transition-all duration-300 rounded-lg pr-2 mt-2"${_scopeId}><div class="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center"${_scopeId}>`);
                    _push2(ssrRenderComponent(_component_Icon, {
                      name: child.icon,
                      size: "16",
                      class: "text-primary-500"
                    }, null, _parent2, _scopeId));
                    _push2(`</div><div class="text-gray-700 text-sm"${_scopeId}>${ssrInterpolate(child.label)}</div></div></div>`);
                  });
                  _push2(`<!--]--></div>`);
                });
                _push2(`<!--]--></div><div class="h-0.5 bg-gray-200 w-full"${_scopeId}></div><div class="flex items-center gap-2 group cursor-pointer hover:bg-red-100 transition-all duration-300 rounded-lg pr-2"${_scopeId}><div class="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center"${_scopeId}>`);
                _push2(ssrRenderComponent(_component_Icon, {
                  name: getDropdownItems(photo)[1][0].icon,
                  size: "16",
                  class: "text-red-700"
                }, null, _parent2, _scopeId));
                _push2(`</div><div class="text-red-700 text-sm"${_scopeId}>${ssrInterpolate(getDropdownItems(photo)[1][0].label)}</div></div></div>`);
              } else {
                return [
                  createVNode("div", { class: "space-y-2" }, [
                    createVNode("div", null, [
                      createVNode("div", { class: "text-sm font-medium text-center cursor-default w-full text-primary-700" }, " Déplacer vers : "),
                      (openBlock(true), createBlock(Fragment, null, renderList(getDropdownItems(photo)[0][0].children, (item) => {
                        return openBlock(), createBlock("div", {
                          key: item.label
                        }, [
                          (openBlock(true), createBlock(Fragment, null, renderList(item, (child) => {
                            return openBlock(), createBlock("div", {
                              key: child.label,
                              class: ""
                            }, [
                              createVNode("div", {
                                class: "flex items-center gap-2 group cursor-pointer hover:bg-primary-100 transition-all duration-300 rounded-lg pr-2 mt-2",
                                onClick: child.onSelect
                              }, [
                                createVNode("div", { class: "w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center" }, [
                                  createVNode(_component_Icon, {
                                    name: child.icon,
                                    size: "16",
                                    class: "text-primary-500"
                                  }, null, 8, ["name"])
                                ]),
                                createVNode("div", { class: "text-gray-700 text-sm" }, toDisplayString(child.label), 1)
                              ], 8, ["onClick"])
                            ]);
                          }), 128))
                        ]);
                      }), 128))
                    ]),
                    createVNode("div", { class: "h-0.5 bg-gray-200 w-full" }),
                    createVNode("div", {
                      class: "flex items-center gap-2 group cursor-pointer hover:bg-red-100 transition-all duration-300 rounded-lg pr-2",
                      onClick: getDropdownItems(photo)[1][0].onSelect
                    }, [
                      createVNode("div", { class: "w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center" }, [
                        createVNode(_component_Icon, {
                          name: getDropdownItems(photo)[1][0].icon,
                          size: "16",
                          class: "text-red-700"
                        }, null, 8, ["name"])
                      ]),
                      createVNode("div", { class: "text-red-700 text-sm" }, toDisplayString(getDropdownItems(photo)[1][0].label), 1)
                    ], 8, ["onClick"])
                  ])
                ];
              }
            }),
            _: 2
          }, _parent));
          _push(`</div><div class="text-white text-xs"><p class="font-medium truncate">${ssrInterpolate(photo.nom_fichier)}</p></div></div></div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<div class="text-center py-12 text-primary-700 dark:text-primary-300">`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:image-off",
          size: "24",
          class: "w-16 h-16 mx-auto mb-4 opacity-50"
        }, null, _parent));
        _push(`<p class="text-lg font-medium text-primary-700">Aucune photo</p><p class="text-sm mt-1 text-primary-700 dark:text-primary-300"> Ajoutez des photos pour commencer </p></div>`);
      }
      _push(ssrRenderComponent(_component_AppModal, {
        modelValue: unref(isDeleteModalOpen),
        "onUpdate:modelValue": ($event) => isRef(isDeleteModalOpen) ? isDeleteModalOpen.value = $event : null,
        size: "md",
        onClose: ($event) => isDeleteModalOpen.value = false
      }, {
        header: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="text-center"${_scopeId}><div class="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:triangle-alert",
              size: "28",
              class: "text-red-600 dark:text-red-400"
            }, null, _parent2, _scopeId));
            _push2(`</div><h3 class="text-lg font-semibold text-gray-900 dark:text-white"${_scopeId}> Attention </h3></div>`);
          } else {
            return [
              createVNode("div", { class: "text-center" }, [
                createVNode("div", { class: "w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center" }, [
                  createVNode(_component_Icon, {
                    name: "lucide:triangle-alert",
                    size: "28",
                    class: "text-red-600 dark:text-red-400"
                  })
                ]),
                createVNode("h3", { class: "text-lg font-semibold text-gray-900 dark:text-white" }, " Attention ")
              ])
            ];
          }
        }),
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<p class="text-center text-gray-600 dark:text-gray-300 text-sm leading-relaxed"${_scopeId}> Vous êtes sur le point de supprimer la photo <span class="font-semibold text-gray-900 dark:text-white"${_scopeId}>« ${ssrInterpolate(unref(photoToDelete)?.nom_fichier || "")} »</span> ? Cette action est irréversible. </p>`);
          } else {
            return [
              createVNode("p", { class: "text-center text-gray-600 dark:text-gray-300 text-sm leading-relaxed" }, [
                createTextVNode(" Vous êtes sur le point de supprimer la photo "),
                createVNode("span", { class: "font-semibold text-gray-900 dark:text-white" }, "« " + toDisplayString(unref(photoToDelete)?.nom_fichier || "") + " »", 1),
                createTextVNode(" ? Cette action est irréversible. ")
              ])
            ];
          }
        }),
        footer: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex gap-3 justify-end"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_AppButtonValidated, {
              theme: "cancel",
              type: "button",
              onClick: cancelDelete
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`Annuler`);
                } else {
                  return [
                    createTextVNode("Annuler")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_AppButtonValidated, {
              theme: "delete",
              type: "button",
              onClick: confirmDeletePhoto
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`Supprimer`);
                } else {
                  return [
                    createTextVNode("Supprimer")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", { class: "flex gap-3 justify-end" }, [
                createVNode(_component_AppButtonValidated, {
                  theme: "cancel",
                  type: "button",
                  onClick: cancelDelete
                }, {
                  default: withCtx(() => [
                    createTextVNode("Annuler")
                  ]),
                  _: 1
                }),
                createVNode(_component_AppButtonValidated, {
                  theme: "delete",
                  type: "button",
                  onClick: confirmDeletePhoto
                }, {
                  default: withCtx(() => [
                    createTextVNode("Supprimer")
                  ]),
                  _: 1
                })
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_AppModalFullScreen, {
        modelValue: unref(isViewerModalOpen),
        "onUpdate:modelValue": ($event) => isRef(isViewerModalOpen) ? isViewerModalOpen.value = $event : null,
        showCloseButton: false,
        onClose: closeViewer
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="w-full h-full flex items-center justify-center"${_scopeId}><img${ssrRenderAttr("src", unref(photoUrls)[unref(currentPhoto).id])}${ssrRenderAttr("alt", unref(currentPhoto).nom_fichier)} class="max-w-full max-h-full object-contain"${_scopeId}></div><div class="absolute left-4 top-1/2 -translate-y-1/2 z-10 opacity-80 hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-amber-100 to-orange-200 dark:from-amber-900/50 dark:to-orange-800/50"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:chevron-left",
              size: "20",
              class: "text-amber-600 dark:text-amber-400"
            }, null, _parent2, _scopeId));
            _push2(`</div><div class="absolute right-4 top-1/2 -translate-y-1/2 z-10 opacity-80 hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-amber-100 to-orange-200 dark:from-amber-900/50 dark:to-orange-800/50"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:chevron-right",
              size: "20",
              class: "text-amber-600 dark:text-amber-400"
            }, null, _parent2, _scopeId));
            _push2(`</div><div class="absolute right-4 top-0 translate-y-1/2 z-10 opacity-80 hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-amber-100 to-orange-200 dark:from-amber-900/50 dark:to-orange-800/50"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:x",
              size: "20",
              class: "text-amber-600 dark:text-amber-400"
            }, null, _parent2, _scopeId));
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", { class: "w-full h-full flex items-center justify-center" }, [
                createVNode("img", {
                  src: unref(photoUrls)[unref(currentPhoto).id],
                  alt: unref(currentPhoto).nom_fichier,
                  class: "max-w-full max-h-full object-contain"
                }, null, 8, ["src", "alt"])
              ]),
              createVNode("div", {
                class: "absolute left-4 top-1/2 -translate-y-1/2 z-10 opacity-80 hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-amber-100 to-orange-200 dark:from-amber-900/50 dark:to-orange-800/50",
                onClick: previousPhoto
              }, [
                createVNode(_component_Icon, {
                  name: "lucide:chevron-left",
                  size: "20",
                  class: "text-amber-600 dark:text-amber-400"
                })
              ]),
              createVNode("div", {
                class: "absolute right-4 top-1/2 -translate-y-1/2 z-10 opacity-80 hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-amber-100 to-orange-200 dark:from-amber-900/50 dark:to-orange-800/50",
                onClick: nextPhoto
              }, [
                createVNode(_component_Icon, {
                  name: "lucide:chevron-right",
                  size: "20",
                  class: "text-amber-600 dark:text-amber-400"
                })
              ]),
              createVNode("div", {
                class: "absolute right-4 top-0 translate-y-1/2 z-10 opacity-80 hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-amber-100 to-orange-200 dark:from-amber-900/50 dark:to-orange-800/50",
                onClick: closeViewer
              }, [
                createVNode(_component_Icon, {
                  name: "lucide:x",
                  size: "20",
                  class: "text-amber-600 dark:text-amber-400"
                })
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
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/photos/galeriePhoto.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const _sfc_main$2 = {
  __name: "ChantierPhotos",
  __ssrInlineRender: true,
  props: {
    chantier: {
      type: Object,
      required: true
    }
  },
  setup(__props) {
    const props = __props;
    const { photos, getPhotos, repertoires } = usePhotos();
    const selectedRepertoireId = ref(null);
    const showUploader = ref(false);
    const selectedRepertoireName = computed(() => {
      if (!selectedRepertoireId.value) return "Toutes les photos";
      const repertoire = repertoires.value.find(
        (r) => r.id === selectedRepertoireId.value
      );
      return repertoire?.nom || "Répertoire sélectionné";
    });
    const loadPhotos = async () => {
      await getPhotos(props.chantier.id, selectedRepertoireId.value);
    };
    watch(selectedRepertoireId, () => {
      loadPhotos();
    });
    const handleUploaded = () => {
      loadPhotos();
      showUploader.value = false;
    };
    const handleRepertoireChanged = () => {
      loadPhotos();
    };
    const handlePhotoDeleted = () => {
      loadPhotos();
    };
    const handlePhotoMoved = () => {
      loadPhotos();
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppTitleMain = _sfc_main$o;
      const _component_PhotosRepertoireManager = _sfc_main$6;
      const _component_AppButtonValidated = _sfc_main$2$1;
      const _component_Icon = __nuxt_component_1;
      const _component_AppSlideOver = _sfc_main$1$1;
      const _component_AppSlideOverContent = _sfc_main$p;
      const _component_PhotosPhotoUploader = _sfc_main$5;
      const _component_PhotosGaleriePhoto = _sfc_main$3;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-6" }, _attrs))}>`);
      _push(ssrRenderComponent(_component_AppTitleMain, {
        title: "Photos",
        description: "Galerie de photos du chantier"
      }, null, _parent));
      _push(ssrRenderComponent(_component_PhotosRepertoireManager, {
        modelValue: unref(selectedRepertoireId),
        "onUpdate:modelValue": ($event) => isRef(selectedRepertoireId) ? selectedRepertoireId.value = $event : null,
        "chantier-id": __props.chantier.id,
        onChanged: handleRepertoireChanged
      }, null, _parent));
      _push(`<div class="space-y-6"><div class="flex items-center justify-between"><div><h3 class="text-lg font-semibold">${ssrInterpolate(unref(selectedRepertoireId) === null ? "Toutes les photos" : "Photos du répertoire : " + unref(selectedRepertoireName))}</h3><p class="text-sm text-muted mt-1">${ssrInterpolate(unref(photos).length)} photo(s)</p></div>`);
      _push(ssrRenderComponent(_component_AppButtonValidated, {
        theme: "primary",
        onClick: ($event) => showUploader.value = true
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<span class="flex items-center gap-2"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:upload",
              size: "16"
            }, null, _parent2, _scopeId));
            _push2(` Ajouter des photos </span>`);
          } else {
            return [
              createVNode("span", { class: "flex items-center gap-2" }, [
                createVNode(_component_Icon, {
                  name: "lucide:upload",
                  size: "16"
                }),
                createTextVNode(" Ajouter des photos ")
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div>`);
      _push(ssrRenderComponent(_component_AppSlideOver, {
        sideModal: unref(showUploader),
        closeSideModal: () => showUploader.value = false
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (unref(showUploader)) {
              _push2(ssrRenderComponent(_component_AppSlideOverContent, {
                closeSideModal: () => showUploader.value = false
              }, {
                header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:camera",
                      size: "44",
                      class: "text-primary-500"
                    }, null, _parent3, _scopeId2));
                    _push3(`<h3 class="text-lg font-semibold"${_scopeId2}>Ajouter des photos</h3><div class="text-xl font-bold text-primary-700 bg-primary-200 px-4 rounded-lg dark:text-gray-400"${_scopeId2}>${ssrInterpolate(unref(selectedRepertoireName))}</div>`);
                  } else {
                    return [
                      createVNode(_component_Icon, {
                        name: "lucide:camera",
                        size: "44",
                        class: "text-primary-500"
                      }),
                      createVNode("h3", { class: "text-lg font-semibold" }, "Ajouter des photos"),
                      createVNode("div", { class: "text-xl font-bold text-primary-700 bg-primary-200 px-4 rounded-lg dark:text-gray-400" }, toDisplayString(unref(selectedRepertoireName)), 1)
                    ];
                  }
                }),
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(ssrRenderComponent(_component_PhotosPhotoUploader, {
                      chantierId: __props.chantier.id,
                      repertoireId: unref(selectedRepertoireId),
                      onUploaded: handleUploaded,
                      onError: handleUploaded
                    }, null, _parent3, _scopeId2));
                  } else {
                    return [
                      createVNode(_component_PhotosPhotoUploader, {
                        chantierId: __props.chantier.id,
                        repertoireId: unref(selectedRepertoireId),
                        onUploaded: handleUploaded,
                        onError: handleUploaded
                      }, null, 8, ["chantierId", "repertoireId"])
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
              unref(showUploader) ? (openBlock(), createBlock(_component_AppSlideOverContent, {
                key: 0,
                closeSideModal: () => showUploader.value = false
              }, {
                header: withCtx(() => [
                  createVNode(_component_Icon, {
                    name: "lucide:camera",
                    size: "44",
                    class: "text-primary-500"
                  }),
                  createVNode("h3", { class: "text-lg font-semibold" }, "Ajouter des photos"),
                  createVNode("div", { class: "text-xl font-bold text-primary-700 bg-primary-200 px-4 rounded-lg dark:text-gray-400" }, toDisplayString(unref(selectedRepertoireName)), 1)
                ]),
                default: withCtx(() => [
                  createVNode(_component_PhotosPhotoUploader, {
                    chantierId: __props.chantier.id,
                    repertoireId: unref(selectedRepertoireId),
                    onUploaded: handleUploaded,
                    onError: handleUploaded
                  }, null, 8, ["chantierId", "repertoireId"])
                ]),
                _: 1
              }, 8, ["closeSideModal"])) : createCommentVNode("", true)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_PhotosGaleriePhoto, {
        photos: unref(photos),
        "repertoire-id": unref(selectedRepertoireId),
        onPhotoDeleted: handlePhotoDeleted,
        onPhotoMoved: handlePhotoMoved
      }, null, _parent));
      _push(`</div>`);
    };
  }
};
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/chantier/photos.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const _sfc_main$1 = {
  __name: "ChantierTaches",
  __ssrInlineRender: true,
  props: {
    chantier: {
      type: Object,
      required: true
    }
  },
  setup(__props) {
    const props = __props;
    const { getH00ByChantier, updateH00Entry, deleteH00Entry } = useH00();
    const { setLoader } = useLoader();
    const { isAuthorizedForTache } = useLevelUser();
    const taches = ref([]);
    const globalFilter = ref("");
    const open = ref(false);
    const selectedTache = ref({});
    const commentaire = ref("");
    const important = ref(false);
    const alerte = ref(false);
    const dateCloture = ref(null);
    const showOnlyAuthorized = ref(false);
    const authorizedMap = ref({});
    const canEdit = ref(false);
    watch(
      [() => selectedTache.value, () => props.chantier],
      async () => {
        if (!selectedTache.value?.taches) {
          canEdit.value = false;
          return;
        }
        try {
          canEdit.value = await isAuthorizedForTache(props.chantier, selectedTache.value.taches.tache_profil);
        } catch (error) {
          console.error("Erreur lors de la vérification des autorisations:", error);
          canEdit.value = false;
        }
      },
      { immediate: true }
    );
    const formatDateMonthYear = (dateString) => {
      if (!dateString) return "-";
      const date = new Date(dateString);
      const monthYear = date.toLocaleDateString("fr-FR", {
        month: "short",
        year: "numeric"
      });
      return monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
    };
    const getRealisationStatus = (tache) => {
      const status = tache.status;
      const prevision = tache.prevision;
      if (status === 2) {
        return { type: "fait", label: "Fait" };
      }
      if (status === 1) {
        return { type: "en_cours", label: "En cours" };
      }
      if (status === 0 && prevision) {
        const now = /* @__PURE__ */ new Date();
        const previsionDate = new Date(prevision);
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const previsionMonth = new Date(previsionDate.getFullYear(), previsionDate.getMonth(), 1);
        if (previsionMonth <= currentMonth) {
          return { type: "a_faire", label: "À faire" };
        }
      }
      return null;
    };
    const formatDateForInput = (dateString) => {
      if (!dateString) return null;
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };
    const showSlide = (row) => {
      if (row) {
        selectedTache.value = row;
        commentaire.value = row.commentaire || "";
        important.value = row.important || false;
        alerte.value = row.alerte || false;
        if (row.status === 2 && row.realisation) {
          dateCloture.value = formatDateForInput(row.realisation);
        } else {
          dateCloture.value = null;
        }
        open.value = true;
      } else {
        open.value = !open.value;
      }
    };
    const cloturerTache = async () => {
      if (!canEdit.value) return;
      setLoader(true);
      try {
        const { error } = await updateH00Entry(selectedTache.value.id, {
          status: 2,
          realisation: formatDateForInput(dateCloture.value),
          commentaire: commentaire.value,
          important: important.value,
          alerte: alerte.value
        });
        if (error) throw error;
        await loadTaches();
        open.value = false;
      } catch (err) {
        console.error("Erreur lors de la clôture:", err);
      } finally {
        setLoader(false);
      }
    };
    const enregistrer = async () => {
      if (!canEdit.value) return;
      setLoader(true);
      try {
        const newStatus = commentaire.value.trim() !== "" ? 1 : 0;
        const { error } = await updateH00Entry(selectedTache.value.id, {
          status: newStatus,
          commentaire: commentaire.value,
          important: important.value,
          alerte: alerte.value
        });
        if (error) throw error;
        await loadTaches();
        open.value = false;
      } catch (err) {
        console.error("Erreur lors de l'enregistrement:", err);
      } finally {
        setLoader(false);
      }
    };
    const nonConcerne = async () => {
      if (!canEdit.value) return;
      setLoader(true);
      try {
        const { error } = await deleteH00Entry(selectedTache.value.id);
        if (error) throw error;
        await loadTaches();
        open.value = false;
      } catch (err) {
        console.error("Erreur lors de la suppression:", err);
      } finally {
        setLoader(false);
      }
    };
    const loadTaches = async () => {
      if (!props.chantier?.id) return;
      setLoader(true);
      try {
        const { data, error } = await getH00ByChantier(props.chantier.id);
        if (error) throw error;
        taches.value = data || [];
      } catch (err) {
        console.error("Erreur lors du chargement des tâches:", err);
      } finally {
        setLoader(false);
      }
    };
    const filteredTaches = computed(() => {
      const search = globalFilter.value?.toLowerCase() ?? "";
      let result = taches.value;
      if (search) {
        result = result.filter(
          (t) => t.taches?.tache?.toLowerCase().includes(search) || t.categories?.name?.toLowerCase().includes(search)
        );
      }
      if (showOnlyAuthorized.value) {
        result = result.filter((t) => authorizedMap.value[t.id]);
      }
      return result;
    });
    watchEffect(async () => {
      const map = {};
      for (const t of taches.value) {
        map[t.id] = await isAuthorizedForTache(props.chantier, t.taches.tache_profil);
      }
      authorizedMap.value = map;
    });
    const progressStats = computed(() => {
      if (!taches.value || taches.value.length === 0) {
        return {
          cloturees: 0,
          enCours: 0,
          total: 0,
          clotureesCount: 0,
          enCoursCount: 0
        };
      }
      const total = taches.value.length;
      const cloturees = taches.value.filter((t) => t.status === 2).length;
      const enCours = taches.value.filter((t) => t.status === 1).length;
      const pctCloturees = cloturees / total * 100;
      const pctEnCours = enCours / total * 100;
      return {
        cloturees: Math.round(pctCloturees),
        enCours: Math.round(pctEnCours),
        total,
        clotureesCount: cloturees,
        enCoursCount: enCours
      };
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppTitleMain = _sfc_main$o;
      const _component_AppInputSearch = __nuxt_component_1$1;
      const _component_AppSwitch = _sfc_main$s;
      const _component_Icon = __nuxt_component_1;
      const _component_AppSlideOver = _sfc_main$1$1;
      const _component_AppSlideOverContent = _sfc_main$p;
      const _component_AppDatePicker = __nuxt_component_6$1;
      const _component_AppButtonValidated = _sfc_main$2$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-4" }, _attrs))}><div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">`);
      _push(ssrRenderComponent(_component_AppTitleMain, {
        title: "Liste des tâches",
        description: "Toutes les tâches associées à ce chantier"
      }, null, _parent));
      if (unref(taches).length > 0) {
        _push(`<div class="flex items-center gap-4 lg:min-w-[300px]"><div class="flex-1 lg:min-w-[400px]"><div class="mb-1 flex items-center justify-between"><div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400"><div class="flex items-center gap-1"><div class="h-2 w-2 rounded bg-green-200"></div><span>${ssrInterpolate(unref(progressStats).cloturees)}% clôturées</span></div><div class="flex items-center gap-1"><div class="h-2 w-2 rounded bg-yellow-200"></div><span>${ssrInterpolate(unref(progressStats).enCours)}% en cours</span></div></div><div class="pr-1 text-xs text-gray-500 dark:text-gray-400">${ssrInterpolate(unref(progressStats).clotureesCount + unref(progressStats).enCoursCount)} / ${ssrInterpolate(unref(progressStats).total)} tâches </div></div><div class="relative h-4 w-full overflow-hidden rounded-full bg-gray-200">`);
        if (unref(progressStats).cloturees > 0) {
          _push(`<div class="absolute top-0 left-0 h-full bg-green-200 transition-all duration-300" style="${ssrRenderStyle({ width: `${unref(progressStats).cloturees}%` })}"></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(progressStats).enCours > 0) {
          _push(`<div class="absolute top-0 h-full bg-yellow-200 transition-all duration-300" style="${ssrRenderStyle({
            left: `${unref(progressStats).cloturees}%`,
            width: `${unref(progressStats).enCours}%`
          })}"></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="flex w-full flex-col items-center gap-4 lg:flex-row">`);
      _push(ssrRenderComponent(_component_AppInputSearch, {
        modelValue: unref(globalFilter),
        "onUpdate:modelValue": ($event) => isRef(globalFilter) ? globalFilter.value = $event : null,
        class: "w-full max-w-md",
        placeholder: "Rechercher une tâche ..."
      }, null, _parent));
      _push(ssrRenderComponent(_component_AppSwitch, {
        modelValue: unref(showOnlyAuthorized),
        "onUpdate:modelValue": ($event) => isRef(showOnlyAuthorized) ? showOnlyAuthorized.value = $event : null,
        label: "Mes taches",
        class: "ml-auto flex-none"
      }, null, _parent));
      _push(`</div><div class="flex min-h-0 w-full flex-1 flex-col rounded-md border border-gray-200 bg-white lg:overflow-auto dark:border-gray-700 dark:bg-gray-900"><div class="min-h-0 flex-1 overflow-auto"><table class="w-full text-sm"><thead class="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"><tr><th class="hidden items-center justify-center py-3 font-semibold text-gray-700 lg:flex dark:text-gray-200"> Catégorie </th><th class="py-3 pl-2 text-left font-semibold text-gray-700 lg:pl-0 dark:text-gray-200">Tâche</th><th class="px-8 py-3 text-center font-semibold text-gray-700 dark:text-gray-200">Prévision</th><th>Status</th><th>#</th></tr></thead><tbody class="divide-y divide-gray-100 dark:divide-gray-800"><!--[-->`);
      ssrRenderList(unref(filteredTaches), (t) => {
        _push(`<tr class="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"><td class="hidden py-4 lg:flex">`);
        if (t.categories?.name) {
          _push(`<div class="w-full px-4"><div class="bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-700 mx-auto w-full rounded-md border px-2 text-center text-xs text-gray-600 italic">${ssrInterpolate(t.categories.name)}</div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</td><td class="pl-2 lg:pl-0">${ssrInterpolate(t.taches?.tache)}</td><td class="px-4 py-3"><div class="flex w-full items-center justify-center whitespace-nowrap">${ssrInterpolate(formatDateMonthYear(t.prevision))}</div></td><td class="px-4 py-3"><div class="flex w-full items-center justify-center gap-2">`);
        if (t.important) {
          _push(ssrRenderComponent(_component_Icon, {
            name: "lucide:triangle-alert",
            size: "16",
            class: "text-yellow-500"
          }, null, _parent));
        } else {
          _push(ssrRenderComponent(_component_Icon, {
            name: "lucide:triangle-alert",
            size: "16",
            class: "text-gray-300"
          }, null, _parent));
        }
        if (t.alerte) {
          _push(ssrRenderComponent(_component_Icon, {
            name: "lucide:siren",
            size: "18",
            class: "mb-0.5 text-red-500"
          }, null, _parent));
        } else {
          _push(ssrRenderComponent(_component_Icon, {
            name: "lucide:siren",
            size: "18",
            class: "mb-0.5 text-gray-300"
          }, null, _parent));
        }
        _push(`</div></td><td class="px-4 py-3"><div class="flex w-full items-center justify-center">`);
        if (getRealisationStatus(t)) {
          _push(`<div class="${ssrRenderClass([
            getRealisationStatus(t).type === "fait" ? "bg-green-100 text-green-700" : getRealisationStatus(t).type === "en_cours" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700",
            "flex w-20 items-center justify-center rounded-md px-2 py-1 text-xs whitespace-nowrap"
          ])}">${ssrInterpolate(getRealisationStatus(t).label)}</div>`);
        } else {
          _push(`<span class="text-muted">-</span>`);
        }
        _push(`</div></td></tr>`);
      });
      _push(`<!--]--></tbody></table></div></div>`);
      _push(ssrRenderComponent(_component_AppSlideOver, {
        sideModal: unref(open),
        closeSideModal: showSlide
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (unref(open)) {
              _push2(ssrRenderComponent(_component_AppSlideOverContent, { closeSideModal: showSlide }, {
                header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="text-center"${_scopeId2}><div class="bg-primary-100 dark:bg-primary-900/30 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:clipboard-edit",
                      size: "28",
                      class: "text-primary-500"
                    }, null, _parent3, _scopeId2));
                    _push3(`</div><h2 class="text-xl font-semibold text-gray-900 dark:text-white"${_scopeId2}>${ssrInterpolate(props.chantier?.name)}</h2><p class="mt-1 text-sm text-gray-500 dark:text-gray-400"${_scopeId2}>${ssrInterpolate(unref(selectedTache).taches?.tache)}</p></div>`);
                  } else {
                    return [
                      createVNode("div", { class: "text-center" }, [
                        createVNode("div", { class: "bg-primary-100 dark:bg-primary-900/30 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" }, [
                          createVNode(_component_Icon, {
                            name: "lucide:clipboard-edit",
                            size: "28",
                            class: "text-primary-500"
                          })
                        ]),
                        createVNode("h2", { class: "text-xl font-semibold text-gray-900 dark:text-white" }, toDisplayString(props.chantier?.name), 1),
                        createVNode("p", { class: "mt-1 text-sm text-gray-500 dark:text-gray-400" }, toDisplayString(unref(selectedTache).taches?.tache), 1)
                      ])
                    ];
                  }
                }),
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="flex flex-col gap-6"${_scopeId2}><div class="flex items-center border-b py-2 text-left text-base font-medium uppercase"${_scopeId2}>Informations</div><div class="flex items-center justify-between gap-2"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_AppSwitch, {
                      modelValue: unref(important),
                      "onUpdate:modelValue": ($event) => isRef(important) ? important.value = $event : null,
                      label: "Important",
                      class: "full",
                      disabled: !unref(canEdit)
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppSwitch, {
                      modelValue: unref(alerte),
                      "onUpdate:modelValue": ($event) => isRef(alerte) ? alerte.value = $event : null,
                      label: "Alerte",
                      class: "full",
                      disabled: !unref(canEdit)
                    }, null, _parent3, _scopeId2));
                    _push3(`</div><div class="flex items-center border-b py-2 text-left text-base font-medium uppercase"${_scopeId2}>Commentaires</div><div class="flex flex-col gap-1.5"${_scopeId2}><textarea rows="4" class="focus:ring-primary-500 w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-transparent focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white" placeholder="Ajoutez un commentaire..."${ssrIncludeBooleanAttr(!unref(canEdit)) ? " disabled" : ""}${_scopeId2}>${ssrInterpolate(unref(commentaire))}</textarea></div>`);
                    if (unref(canEdit)) {
                      _push3(ssrRenderComponent(_component_AppDatePicker, {
                        modelValue: unref(dateCloture),
                        "onUpdate:modelValue": ($event) => isRef(dateCloture) ? dateCloture.value = $event : null,
                        title: "Date de clôture",
                        placeholder: "Sélectionnez une date",
                        clearable: ""
                      }, null, _parent3, _scopeId2));
                    } else {
                      _push3(`<!---->`);
                    }
                    _push3(`</div>`);
                  } else {
                    return [
                      createVNode("div", { class: "flex flex-col gap-6" }, [
                        createVNode("div", { class: "flex items-center border-b py-2 text-left text-base font-medium uppercase" }, "Informations"),
                        createVNode("div", { class: "flex items-center justify-between gap-2" }, [
                          createVNode(_component_AppSwitch, {
                            modelValue: unref(important),
                            "onUpdate:modelValue": ($event) => isRef(important) ? important.value = $event : null,
                            label: "Important",
                            class: "full",
                            disabled: !unref(canEdit)
                          }, null, 8, ["modelValue", "onUpdate:modelValue", "disabled"]),
                          createVNode(_component_AppSwitch, {
                            modelValue: unref(alerte),
                            "onUpdate:modelValue": ($event) => isRef(alerte) ? alerte.value = $event : null,
                            label: "Alerte",
                            class: "full",
                            disabled: !unref(canEdit)
                          }, null, 8, ["modelValue", "onUpdate:modelValue", "disabled"])
                        ]),
                        createVNode("div", { class: "flex items-center border-b py-2 text-left text-base font-medium uppercase" }, "Commentaires"),
                        createVNode("div", { class: "flex flex-col gap-1.5" }, [
                          withDirectives(createVNode("textarea", {
                            "onUpdate:modelValue": ($event) => isRef(commentaire) ? commentaire.value = $event : null,
                            rows: "4",
                            class: "focus:ring-primary-500 w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-transparent focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white",
                            placeholder: "Ajoutez un commentaire...",
                            disabled: !unref(canEdit)
                          }, null, 8, ["onUpdate:modelValue", "disabled"]), [
                            [vModelText, unref(commentaire)]
                          ])
                        ]),
                        unref(canEdit) ? (openBlock(), createBlock(_component_AppDatePicker, {
                          key: 0,
                          modelValue: unref(dateCloture),
                          "onUpdate:modelValue": ($event) => isRef(dateCloture) ? dateCloture.value = $event : null,
                          title: "Date de clôture",
                          placeholder: "Sélectionnez une date",
                          clearable: ""
                        }, null, 8, ["modelValue", "onUpdate:modelValue"])) : createCommentVNode("", true)
                      ])
                    ];
                  }
                }),
                footer: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    if (unref(canEdit)) {
                      _push3(`<div class="flex flex-col items-center justify-end gap-2 lg:flex-row"${_scopeId2}>`);
                      _push3(ssrRenderComponent(_component_AppButtonValidated, {
                        type: "button",
                        theme: "primary",
                        validated: !!unref(dateCloture),
                        onClick: ($event) => cloturerTache(),
                        class: "w-full lg:w-auto"
                      }, {
                        default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                          if (_push4) {
                            _push4(`<span class="flex items-center gap-2"${_scopeId3}>`);
                            _push4(ssrRenderComponent(_component_Icon, {
                              name: "lucide:infinity",
                              size: "16"
                            }, null, _parent4, _scopeId3));
                            _push4(` Clôturer </span>`);
                          } else {
                            return [
                              createVNode("span", { class: "flex items-center gap-2" }, [
                                createVNode(_component_Icon, {
                                  name: "lucide:infinity",
                                  size: "16"
                                }),
                                createTextVNode(" Clôturer ")
                              ])
                            ];
                          }
                        }),
                        _: 1
                      }, _parent3, _scopeId2));
                      _push3(ssrRenderComponent(_component_AppButtonValidated, {
                        type: "button",
                        theme: "delete",
                        onClick: ($event) => nonConcerne(),
                        class: "w-full lg:w-auto"
                      }, {
                        default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                          if (_push4) {
                            _push4(`<span class="flex items-center gap-2"${_scopeId3}>`);
                            _push4(ssrRenderComponent(_component_Icon, {
                              name: "lucide:x",
                              size: "16"
                            }, null, _parent4, _scopeId3));
                            _push4(` Non concerné </span>`);
                          } else {
                            return [
                              createVNode("span", { class: "flex items-center gap-2" }, [
                                createVNode(_component_Icon, {
                                  name: "lucide:x",
                                  size: "16"
                                }),
                                createTextVNode(" Non concerné ")
                              ])
                            ];
                          }
                        }),
                        _: 1
                      }, _parent3, _scopeId2));
                      _push3(ssrRenderComponent(_component_AppButtonValidated, {
                        type: "button",
                        theme: "cancel",
                        onClick: ($event) => enregistrer(),
                        class: "w-full lg:w-auto"
                      }, {
                        default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                          if (_push4) {
                            _push4(`<span class="flex items-center gap-2"${_scopeId3}>`);
                            _push4(ssrRenderComponent(_component_Icon, {
                              name: "lucide:save",
                              size: "16"
                            }, null, _parent4, _scopeId3));
                            _push4(` Enregistrer </span>`);
                          } else {
                            return [
                              createVNode("span", { class: "flex items-center gap-2" }, [
                                createVNode(_component_Icon, {
                                  name: "lucide:save",
                                  size: "16"
                                }),
                                createTextVNode(" Enregistrer ")
                              ])
                            ];
                          }
                        }),
                        _: 1
                      }, _parent3, _scopeId2));
                      _push3(`</div>`);
                    } else {
                      _push3(`<!---->`);
                    }
                  } else {
                    return [
                      unref(canEdit) ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "flex flex-col items-center justify-end gap-2 lg:flex-row"
                      }, [
                        createVNode(_component_AppButtonValidated, {
                          type: "button",
                          theme: "primary",
                          validated: !!unref(dateCloture),
                          onClick: ($event) => cloturerTache(),
                          class: "w-full lg:w-auto"
                        }, {
                          default: withCtx(() => [
                            createVNode("span", { class: "flex items-center gap-2" }, [
                              createVNode(_component_Icon, {
                                name: "lucide:infinity",
                                size: "16"
                              }),
                              createTextVNode(" Clôturer ")
                            ])
                          ]),
                          _: 1
                        }, 8, ["validated", "onClick"]),
                        createVNode(_component_AppButtonValidated, {
                          type: "button",
                          theme: "delete",
                          onClick: ($event) => nonConcerne(),
                          class: "w-full lg:w-auto"
                        }, {
                          default: withCtx(() => [
                            createVNode("span", { class: "flex items-center gap-2" }, [
                              createVNode(_component_Icon, {
                                name: "lucide:x",
                                size: "16"
                              }),
                              createTextVNode(" Non concerné ")
                            ])
                          ]),
                          _: 1
                        }, 8, ["onClick"]),
                        createVNode(_component_AppButtonValidated, {
                          type: "button",
                          theme: "cancel",
                          onClick: ($event) => enregistrer(),
                          class: "w-full lg:w-auto"
                        }, {
                          default: withCtx(() => [
                            createVNode("span", { class: "flex items-center gap-2" }, [
                              createVNode(_component_Icon, {
                                name: "lucide:save",
                                size: "16"
                              }),
                              createTextVNode(" Enregistrer ")
                            ])
                          ]),
                          _: 1
                        }, 8, ["onClick"])
                      ])) : createCommentVNode("", true)
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
              unref(open) ? (openBlock(), createBlock(_component_AppSlideOverContent, {
                key: 0,
                closeSideModal: showSlide
              }, {
                header: withCtx(() => [
                  createVNode("div", { class: "text-center" }, [
                    createVNode("div", { class: "bg-primary-100 dark:bg-primary-900/30 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" }, [
                      createVNode(_component_Icon, {
                        name: "lucide:clipboard-edit",
                        size: "28",
                        class: "text-primary-500"
                      })
                    ]),
                    createVNode("h2", { class: "text-xl font-semibold text-gray-900 dark:text-white" }, toDisplayString(props.chantier?.name), 1),
                    createVNode("p", { class: "mt-1 text-sm text-gray-500 dark:text-gray-400" }, toDisplayString(unref(selectedTache).taches?.tache), 1)
                  ])
                ]),
                default: withCtx(() => [
                  createVNode("div", { class: "flex flex-col gap-6" }, [
                    createVNode("div", { class: "flex items-center border-b py-2 text-left text-base font-medium uppercase" }, "Informations"),
                    createVNode("div", { class: "flex items-center justify-between gap-2" }, [
                      createVNode(_component_AppSwitch, {
                        modelValue: unref(important),
                        "onUpdate:modelValue": ($event) => isRef(important) ? important.value = $event : null,
                        label: "Important",
                        class: "full",
                        disabled: !unref(canEdit)
                      }, null, 8, ["modelValue", "onUpdate:modelValue", "disabled"]),
                      createVNode(_component_AppSwitch, {
                        modelValue: unref(alerte),
                        "onUpdate:modelValue": ($event) => isRef(alerte) ? alerte.value = $event : null,
                        label: "Alerte",
                        class: "full",
                        disabled: !unref(canEdit)
                      }, null, 8, ["modelValue", "onUpdate:modelValue", "disabled"])
                    ]),
                    createVNode("div", { class: "flex items-center border-b py-2 text-left text-base font-medium uppercase" }, "Commentaires"),
                    createVNode("div", { class: "flex flex-col gap-1.5" }, [
                      withDirectives(createVNode("textarea", {
                        "onUpdate:modelValue": ($event) => isRef(commentaire) ? commentaire.value = $event : null,
                        rows: "4",
                        class: "focus:ring-primary-500 w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-transparent focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white",
                        placeholder: "Ajoutez un commentaire...",
                        disabled: !unref(canEdit)
                      }, null, 8, ["onUpdate:modelValue", "disabled"]), [
                        [vModelText, unref(commentaire)]
                      ])
                    ]),
                    unref(canEdit) ? (openBlock(), createBlock(_component_AppDatePicker, {
                      key: 0,
                      modelValue: unref(dateCloture),
                      "onUpdate:modelValue": ($event) => isRef(dateCloture) ? dateCloture.value = $event : null,
                      title: "Date de clôture",
                      placeholder: "Sélectionnez une date",
                      clearable: ""
                    }, null, 8, ["modelValue", "onUpdate:modelValue"])) : createCommentVNode("", true)
                  ])
                ]),
                footer: withCtx(() => [
                  unref(canEdit) ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "flex flex-col items-center justify-end gap-2 lg:flex-row"
                  }, [
                    createVNode(_component_AppButtonValidated, {
                      type: "button",
                      theme: "primary",
                      validated: !!unref(dateCloture),
                      onClick: ($event) => cloturerTache(),
                      class: "w-full lg:w-auto"
                    }, {
                      default: withCtx(() => [
                        createVNode("span", { class: "flex items-center gap-2" }, [
                          createVNode(_component_Icon, {
                            name: "lucide:infinity",
                            size: "16"
                          }),
                          createTextVNode(" Clôturer ")
                        ])
                      ]),
                      _: 1
                    }, 8, ["validated", "onClick"]),
                    createVNode(_component_AppButtonValidated, {
                      type: "button",
                      theme: "delete",
                      onClick: ($event) => nonConcerne(),
                      class: "w-full lg:w-auto"
                    }, {
                      default: withCtx(() => [
                        createVNode("span", { class: "flex items-center gap-2" }, [
                          createVNode(_component_Icon, {
                            name: "lucide:x",
                            size: "16"
                          }),
                          createTextVNode(" Non concerné ")
                        ])
                      ]),
                      _: 1
                    }, 8, ["onClick"]),
                    createVNode(_component_AppButtonValidated, {
                      type: "button",
                      theme: "cancel",
                      onClick: ($event) => enregistrer(),
                      class: "w-full lg:w-auto"
                    }, {
                      default: withCtx(() => [
                        createVNode("span", { class: "flex items-center gap-2" }, [
                          createVNode(_component_Icon, {
                            name: "lucide:save",
                            size: "16"
                          }),
                          createTextVNode(" Enregistrer ")
                        ])
                      ]),
                      _: 1
                    }, 8, ["onClick"])
                  ])) : createCommentVNode("", true)
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
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/chantier/taches.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = {
  __name: "[id]",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const { getChantierById } = useChantiers();
    const { allH00Taches, getH00ByChantier } = useH00();
    const { setLoader } = useLoader();
    const chantierId = computed(() => route.params.id);
    const chantier = ref(null);
    const h00 = ref(null);
    const selectedMenu = ref("generalites");
    const menuItems = [
      {
        value: "generalites",
        label: "Généralités",
        icon: "lucide:info"
      },
      {
        value: "contact",
        label: "Contact",
        icon: "lucide:contact",
        children: [
          { value: "contacts-generalites", label: "Généralités" },
          { value: "contacts-travaux", label: "Travaux" },
          { value: "contacts-entreprises", label: "Entreprises" },
          { value: "contacts-etudes", label: "Etudes" },
          { value: "contacts-autres", label: "Autres" }
        ]
      },
      {
        value: "timeline",
        label: "Timeline",
        icon: "lucide:git-branch"
      },
      {
        value: "etudes",
        label: "Études",
        icon: "lucide:graduation-cap",
        children: [
          { value: "etudes-documents", label: "Documents d'exécution" },
          { value: "etudes-plans", label: "Plans techniques" }
        ]
      },
      {
        value: "commentaires",
        label: "Commentaires",
        icon: "lucide:message-square-more",
        children: [
          { value: "commentaires-generalites", label: "Généralités" },
          { value: "commentaires-ses", label: "SES" },
          { value: "commentaires-voie", label: "Voie" },
          { value: "commentaires-logistique", label: "Logistique" },
          { value: "commentaires-terrain", label: "Terrain" }
        ]
      },
      {
        value: "photos",
        label: "Photos",
        icon: "lucide:image"
      },
      {
        value: "taches",
        label: "Tâches",
        icon: "lucide:clipboard-check",
        badge: computed(() => allH00Taches.value?.length || 0)
      }
    ];
    useHead({
      title: computed(() => chantier.value ? `H00 - ${chantier.value.compte} - ${chantier.value.name}` : "H00 - Chantier")
    });
    const getEtatLabel = (etat) => {
      switch (etat) {
        case 2:
          return "Pré-op";
        case 1:
          return "Externe";
        case 0:
          return "RLT";
        case -1:
          return "Terminé";
        default:
          return "Inconnu";
      }
    };
    const getEtatClasses = (etat) => {
      switch (etat) {
        case 2:
          return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
        case 1:
          return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
        case 0:
          return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
        case -1:
          return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
        default:
          return "bg-gray-100 text-gray-500";
      }
    };
    watch(chantierId, async (newId) => {
      if (newId) {
        setLoader(true);
        try {
          chantier.value = await getChantierById(newId);
          h00.value = await getH00ByChantier(newId);
        } finally {
          setLoader(false);
        }
      }
    });
    const openPrintPage = () => {
      const printUrl = `/chantiers/print/${chantierId.value}`;
      (void 0).open(printUrl, "_blank");
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppPageLayout = __nuxt_component_0;
      const _component_AppLeftNavBar = _sfc_main$n;
      const _component_Icon = __nuxt_component_1;
      const _component_ChantierGeneralites = _sfc_main$m;
      const _component_ChantierContactsGeneralites = _sfc_main$l;
      const _component_ChantierContactsTravaux = _sfc_main$k;
      const _component_ChantierContactsEntreprises = _sfc_main$j;
      const _component_ChantierContactsEtudes = _sfc_main$i;
      const _component_ChantierContactsAutres = _sfc_main$h;
      const _component_ChantierTimeline = _sfc_main$g;
      const _component_ChantierEtudesDocumentsExecution = _sfc_main$f;
      const _component_ChantierEtudesPlansTechniques = _sfc_main$e;
      const _component_ChantierCommentairesGeneralites = _sfc_main$b;
      const _component_ChantierCommentairesSes = _sfc_main$a;
      const _component_ChantierCommentairesVoie = _sfc_main$9;
      const _component_ChantierCommentairesLogistique = _sfc_main$8;
      const _component_ChantierCommentairesTerrain = _sfc_main$7;
      const _component_ChantierPhotos = _sfc_main$2;
      const _component_ChantierTaches = _sfc_main$1;
      _push(ssrRenderComponent(_component_AppPageLayout, _attrs, {
        "sidebar-header": withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="p-4 lg:mb-4 dark:border-gray-700"${_scopeId}>`);
            if (unref(chantier)) {
              _push2(`<div class="flex flex-col items-center gap-2 lg:items-start"${_scopeId}><div class="relative flex w-full items-center justify-center gap-2 lg:justify-start"${_scopeId}><h2 class="text-xl leading-tight font-semibold text-gray-700 dark:text-white"${_scopeId}>${ssrInterpolate(unref(chantier).compte || "Sans intitulé")}</h2><div class="${ssrRenderClass([getEtatClasses(unref(chantier).etat), "absolute top-0 right-0 rounded-full px-2 py-0.5 text-xs font-medium"])}"${_scopeId}>${ssrInterpolate(getEtatLabel(unref(chantier).etat))}</div></div><h2 class="-mt-2 text-base leading-tight font-semibold text-gray-700 dark:text-gray-100"${_scopeId}>${ssrInterpolate(unref(chantier).name || "Sans intitulé")}</h2></div>`);
            } else {
              _push2(`<div class="space-y-2"${_scopeId}><div class="h-5 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"${_scopeId}></div><div class="h-6 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700"${_scopeId}></div><div class="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700"${_scopeId}></div></div>`);
            }
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", { class: "p-4 lg:mb-4 dark:border-gray-700" }, [
                unref(chantier) ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "flex flex-col items-center gap-2 lg:items-start"
                }, [
                  createVNode("div", { class: "relative flex w-full items-center justify-center gap-2 lg:justify-start" }, [
                    createVNode("h2", { class: "text-xl leading-tight font-semibold text-gray-700 dark:text-white" }, toDisplayString(unref(chantier).compte || "Sans intitulé"), 1),
                    createVNode("div", {
                      class: ["absolute top-0 right-0 rounded-full px-2 py-0.5 text-xs font-medium", getEtatClasses(unref(chantier).etat)]
                    }, toDisplayString(getEtatLabel(unref(chantier).etat)), 3)
                  ]),
                  createVNode("h2", { class: "-mt-2 text-base leading-tight font-semibold text-gray-700 dark:text-gray-100" }, toDisplayString(unref(chantier).name || "Sans intitulé"), 1)
                ])) : (openBlock(), createBlock("div", {
                  key: 1,
                  class: "space-y-2"
                }, [
                  createVNode("div", { class: "h-5 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" }),
                  createVNode("div", { class: "h-6 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" }),
                  createVNode("div", { class: "h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" })
                ]))
              ])
            ];
          }
        }),
        sidebar: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_AppLeftNavBar, {
              modelValue: unref(selectedMenu),
              "onUpdate:modelValue": ($event) => isRef(selectedMenu) ? selectedMenu.value = $event : null,
              items: menuItems,
              title: ""
            }, null, _parent2, _scopeId));
          } else {
            return [
              createVNode(_component_AppLeftNavBar, {
                modelValue: unref(selectedMenu),
                "onUpdate:modelValue": ($event) => isRef(selectedMenu) ? selectedMenu.value = $event : null,
                items: menuItems,
                title: ""
              }, null, 8, ["modelValue", "onUpdate:modelValue"])
            ];
          }
        }),
        "sidebar-footer": withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (unref(chantier)) {
              _push2(`<div class="hidden border-gray-200 pt-4 lg:flex lg:items-center lg:justify-center lg:border-t dark:border-gray-700"${_scopeId}><button class="group flex w-fit items-center justify-center gap-3 rounded-lg bg-linear-to-r from-slate-700 to-gray-800 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:from-slate-600 hover:to-gray-700 hover:shadow-xl dark:from-slate-600 dark:to-gray-700 dark:hover:from-slate-500 dark:hover:to-gray-600"${_scopeId}>`);
              _push2(ssrRenderComponent(_component_Icon, {
                name: "lucide:printer",
                size: "18",
                class: "transition-transform duration-300 group-hover:scale-110"
              }, null, _parent2, _scopeId));
              _push2(`<span${_scopeId}>Imprimer le chantier</span></button></div>`);
            } else {
              _push2(`<!---->`);
            }
          } else {
            return [
              unref(chantier) ? (openBlock(), createBlock("div", {
                key: 0,
                class: "hidden border-gray-200 pt-4 lg:flex lg:items-center lg:justify-center lg:border-t dark:border-gray-700"
              }, [
                createVNode("button", {
                  onClick: openPrintPage,
                  class: "group flex w-fit items-center justify-center gap-3 rounded-lg bg-linear-to-r from-slate-700 to-gray-800 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:from-slate-600 hover:to-gray-700 hover:shadow-xl dark:from-slate-600 dark:to-gray-700 dark:hover:from-slate-500 dark:hover:to-gray-600"
                }, [
                  createVNode(_component_Icon, {
                    name: "lucide:printer",
                    size: "18",
                    class: "transition-transform duration-300 group-hover:scale-110"
                  }),
                  createVNode("span", null, "Imprimer le chantier")
                ])
              ])) : createCommentVNode("", true)
            ];
          }
        }),
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (unref(chantier)) {
              _push2(`<div${_scopeId}>`);
              if (unref(selectedMenu) === "generalites") {
                _push2(ssrRenderComponent(_component_ChantierGeneralites, { chantier: unref(chantier) }, null, _parent2, _scopeId));
              } else if (unref(selectedMenu) === "contacts-generalites") {
                _push2(ssrRenderComponent(_component_ChantierContactsGeneralites, { chantier: unref(chantier) }, null, _parent2, _scopeId));
              } else if (unref(selectedMenu) === "contacts-travaux") {
                _push2(ssrRenderComponent(_component_ChantierContactsTravaux, { chantier: unref(chantier) }, null, _parent2, _scopeId));
              } else if (unref(selectedMenu) === "contacts-entreprises") {
                _push2(ssrRenderComponent(_component_ChantierContactsEntreprises, { chantier: unref(chantier) }, null, _parent2, _scopeId));
              } else if (unref(selectedMenu) === "contacts-etudes") {
                _push2(ssrRenderComponent(_component_ChantierContactsEtudes, { chantier: unref(chantier) }, null, _parent2, _scopeId));
              } else if (unref(selectedMenu) === "contacts-autres") {
                _push2(ssrRenderComponent(_component_ChantierContactsAutres, { chantier: unref(chantier) }, null, _parent2, _scopeId));
              } else if (unref(selectedMenu) === "timeline") {
                _push2(ssrRenderComponent(_component_ChantierTimeline, { chantier: unref(chantier) }, null, _parent2, _scopeId));
              } else if (unref(selectedMenu) === "etudes-documents") {
                _push2(ssrRenderComponent(_component_ChantierEtudesDocumentsExecution, { chantier: unref(chantier) }, null, _parent2, _scopeId));
              } else if (unref(selectedMenu) === "etudes-plans") {
                _push2(ssrRenderComponent(_component_ChantierEtudesPlansTechniques, { chantier: unref(chantier) }, null, _parent2, _scopeId));
              } else if (unref(selectedMenu) === "commentaires-generalites") {
                _push2(ssrRenderComponent(_component_ChantierCommentairesGeneralites, { chantier: unref(chantier) }, null, _parent2, _scopeId));
              } else if (unref(selectedMenu) === "commentaires-ses") {
                _push2(ssrRenderComponent(_component_ChantierCommentairesSes, { chantier: unref(chantier) }, null, _parent2, _scopeId));
              } else if (unref(selectedMenu) === "commentaires-voie") {
                _push2(ssrRenderComponent(_component_ChantierCommentairesVoie, { chantier: unref(chantier) }, null, _parent2, _scopeId));
              } else if (unref(selectedMenu) === "commentaires-logistique") {
                _push2(ssrRenderComponent(_component_ChantierCommentairesLogistique, { chantier: unref(chantier) }, null, _parent2, _scopeId));
              } else if (unref(selectedMenu) === "commentaires-terrain") {
                _push2(ssrRenderComponent(_component_ChantierCommentairesTerrain, { chantier: unref(chantier) }, null, _parent2, _scopeId));
              } else if (unref(selectedMenu) === "photos") {
                _push2(ssrRenderComponent(_component_ChantierPhotos, { chantier: unref(chantier) }, null, _parent2, _scopeId));
              } else if (unref(selectedMenu) === "taches") {
                _push2(ssrRenderComponent(_component_ChantierTaches, { chantier: unref(chantier) }, null, _parent2, _scopeId));
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
            } else {
              _push2(`<div class="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-500"${_scopeId}>`);
              _push2(ssrRenderComponent(_component_Icon, {
                name: "lucide:hard-hat",
                size: "64",
                class: "mb-4 opacity-50"
              }, null, _parent2, _scopeId));
              _push2(`<p class="text-lg font-medium"${_scopeId}>Chargement du chantier...</p></div>`);
            }
          } else {
            return [
              unref(chantier) ? (openBlock(), createBlock("div", { key: 0 }, [
                unref(selectedMenu) === "generalites" ? (openBlock(), createBlock(_component_ChantierGeneralites, {
                  key: 0,
                  chantier: unref(chantier)
                }, null, 8, ["chantier"])) : unref(selectedMenu) === "contacts-generalites" ? (openBlock(), createBlock(_component_ChantierContactsGeneralites, {
                  key: 1,
                  chantier: unref(chantier)
                }, null, 8, ["chantier"])) : unref(selectedMenu) === "contacts-travaux" ? (openBlock(), createBlock(_component_ChantierContactsTravaux, {
                  key: 2,
                  chantier: unref(chantier)
                }, null, 8, ["chantier"])) : unref(selectedMenu) === "contacts-entreprises" ? (openBlock(), createBlock(_component_ChantierContactsEntreprises, {
                  key: 3,
                  chantier: unref(chantier)
                }, null, 8, ["chantier"])) : unref(selectedMenu) === "contacts-etudes" ? (openBlock(), createBlock(_component_ChantierContactsEtudes, {
                  key: 4,
                  chantier: unref(chantier)
                }, null, 8, ["chantier"])) : unref(selectedMenu) === "contacts-autres" ? (openBlock(), createBlock(_component_ChantierContactsAutres, {
                  key: 5,
                  chantier: unref(chantier)
                }, null, 8, ["chantier"])) : unref(selectedMenu) === "timeline" ? (openBlock(), createBlock(_component_ChantierTimeline, {
                  key: 6,
                  chantier: unref(chantier)
                }, null, 8, ["chantier"])) : unref(selectedMenu) === "etudes-documents" ? (openBlock(), createBlock(_component_ChantierEtudesDocumentsExecution, {
                  key: 7,
                  chantier: unref(chantier)
                }, null, 8, ["chantier"])) : unref(selectedMenu) === "etudes-plans" ? (openBlock(), createBlock(_component_ChantierEtudesPlansTechniques, {
                  key: 8,
                  chantier: unref(chantier)
                }, null, 8, ["chantier"])) : unref(selectedMenu) === "commentaires-generalites" ? (openBlock(), createBlock(_component_ChantierCommentairesGeneralites, {
                  key: 9,
                  chantier: unref(chantier)
                }, null, 8, ["chantier"])) : unref(selectedMenu) === "commentaires-ses" ? (openBlock(), createBlock(_component_ChantierCommentairesSes, {
                  key: 10,
                  chantier: unref(chantier)
                }, null, 8, ["chantier"])) : unref(selectedMenu) === "commentaires-voie" ? (openBlock(), createBlock(_component_ChantierCommentairesVoie, {
                  key: 11,
                  chantier: unref(chantier)
                }, null, 8, ["chantier"])) : unref(selectedMenu) === "commentaires-logistique" ? (openBlock(), createBlock(_component_ChantierCommentairesLogistique, {
                  key: 12,
                  chantier: unref(chantier)
                }, null, 8, ["chantier"])) : unref(selectedMenu) === "commentaires-terrain" ? (openBlock(), createBlock(_component_ChantierCommentairesTerrain, {
                  key: 13,
                  chantier: unref(chantier)
                }, null, 8, ["chantier"])) : unref(selectedMenu) === "photos" ? (openBlock(), createBlock(_component_ChantierPhotos, {
                  key: 14,
                  chantier: unref(chantier)
                }, null, 8, ["chantier"])) : unref(selectedMenu) === "taches" ? (openBlock(), createBlock(_component_ChantierTaches, {
                  key: 15,
                  chantier: unref(chantier)
                }, null, 8, ["chantier"])) : createCommentVNode("", true)
              ])) : (openBlock(), createBlock("div", {
                key: 1,
                class: "flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-500"
              }, [
                createVNode(_component_Icon, {
                  name: "lucide:hard-hat",
                  size: "64",
                  class: "mb-4 opacity-50"
                }),
                createVNode("p", { class: "text-lg font-medium" }, "Chargement du chantier...")
              ]))
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/chantiers/[id].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_id_-Dhpp3Av8.mjs.map
