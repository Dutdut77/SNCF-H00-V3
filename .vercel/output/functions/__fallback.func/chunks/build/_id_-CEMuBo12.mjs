import { i as useRoute, h as useUsers, u as useHead, e as _imports_0, d as __nuxt_component_1 } from './server.mjs';
import { computed, ref, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderAttr, ssrInterpolate, ssrRenderComponent, ssrRenderList, ssrRenderClass } from 'vue/server-renderer';
import { u as useChantiers } from './useChantiers-C2XRmo5v.mjs';
import { u as useTimeline } from './useTimeline-BdoQfffy.mjs';
import { u as useContacts } from './useContacts-BdCjpTgN.mjs';
import { a as useCommentaires, u as useEtudes } from './useCommentaires-BS9ADy-v.mjs';
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

const _sfc_main = {
  __name: "[id]",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    useChantiers();
    useTimeline();
    useContacts();
    useCommentaires();
    const { getDocumentStatus, getPtStatus, formatDate } = useEtudes();
    const { users } = useUsers();
    computed(() => route.params.id);
    const chantier = ref(null);
    const timeline = ref([]);
    const weekends = ref([]);
    const contacts = ref(null);
    const commentaires = ref({});
    const dex = ref([]);
    const pt = ref([]);
    const isLoading = ref(true);
    useHead({
      title: computed(
        () => chantier.value ? `Impression - ${chantier.value.compte} - ${chantier.value.name}` : "Impression Chantier"
      )
    });
    const formatDateShort = (dateStr) => {
      if (!dateStr) return "-";
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = String(date.getFullYear()).slice(-2);
      return `${day}/${month}/${year}`;
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
    const sortedTimeline = computed(() => {
      return [...timeline.value].sort((a, b) => {
        if (a.annee_debut !== b.annee_debut) return a.annee_debut - b.annee_debut;
        return a.semaine_debut - b.semaine_debut;
      });
    });
    const getTypeLabel = (type) => {
      const labels = { weekend: "Week-end", semaine: "Semaine" };
      return labels[type] || "Semaine";
    };
    const getUserName = (userId) => {
      if (!userId) return null;
      const user = users.value.find((u) => u.id === userId);
      if (!user) return null;
      return user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.email;
    };
    const getUserEmail = (userId) => {
      if (!userId) return null;
      const user = users.value.find((u) => u.id === userId);
      return user?.email || null;
    };
    const getUserNames = (userIds) => {
      if (!userIds || userIds.length === 0) return null;
      const names = userIds.map((id) => getUserName(id)).filter((n) => n);
      return names.length > 0 ? names.join(", ") : null;
    };
    const printDate = (/* @__PURE__ */ new Date()).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
    const weekRange = computed(() => {
      const allWeeks = [];
      if (chantier.value?.date_prepa) {
        chantier.value.date_prepa.forEach((p) => {
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
      if (chantier.value?.date_rea) {
        chantier.value.date_rea.forEach((r) => {
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
      if (!chantier.value?.date_prepa) return false;
      return chantier.value.date_prepa.some((p) => {
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
      if (!chantier.value?.date_rea) return false;
      return chantier.value.date_rea.some((r) => {
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
    const sortedWeekends = computed(() => {
      return [...weekends.value].sort((a, b) => {
        if (a.annee_debut !== b.annee_debut) {
          return a.annee_debut - b.annee_debut;
        }
        return a.semaine_debut - b.semaine_debut;
      });
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Icon = __nuxt_component_1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-gray-100 print:bg-white" }, _attrs))}>`);
      if (unref(isLoading)) {
        _push(`<div class="flex min-h-screen flex-col items-center justify-center gap-4"><div class="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"></div><p class="text-gray-600">Préparation du document...</p></div>`);
      } else if (unref(chantier)) {
        _push(`<div class="mx-auto max-w-4xl bg-white p-8 shadow-lg print:max-w-none print:p-0 print:shadow-none"><header class="mb-8 flex h-full min-h-screen flex-col items-center justify-center border border-gray-400"><div class="flex flex-col items-center justify-center"><img${ssrRenderAttr("src", _imports_0)} alt="H00" class="h-80"><span class="font-[pacifico] text-4xl font-bold text-gray-700">H00 Travaux</span><span class="pl-3 text-xs text-gray-400">Imprimé le ${ssrInterpolate(unref(printDate))}</span><div class="mt-20 rounded-lg border border-gray-400 p-8 text-center shadow-2xl"><h1 class="font-[traverse] text-4xl font-bold text-gray-700">${ssrInterpolate(unref(chantier).compte)}</h1><h2 class="text-3xl font-medium text-gray-600">${ssrInterpolate(unref(chantier).name)}</h2></div></div></header><section class="mb-12"><div class=""><div class="mb-4 flex items-center gap-3 border-b border-gray-100 pb-2"><div class="bg-primary-600/20 text-primary-700 flex h-8 w-8 items-center justify-center rounded-lg">`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:calendar-range",
          size: "18"
        }, null, _parent));
        _push(`</div><h3 class="text-lg font-bold text-gray-700 uppercase">Période des travaux</h3></div><div class="mb-6 flex flex-wrap items-center justify-center gap-4"><div class="flex items-center gap-2"><div class="border-secondary-900/40 bg-secondary-900/20 h-4 w-6 rounded border"></div><span class="text-xs font-medium text-gray-600 dark:text-gray-400">Préparation</span></div><div class="flex items-center gap-2"><div class="border-secondary-900 bg-secondary-800/60 h-4 w-6 rounded border"></div><span class="text-xs font-medium text-gray-600 dark:text-gray-400">Réalisation</span></div><div class="flex items-center gap-2"><div class="h-4 w-1.5 rounded bg-orange-500"></div><span class="text-xs font-medium text-gray-600 dark:text-gray-400">Week-end</span></div></div>`);
        if (unref(weekRange).weeks.length > 0) {
          _push(`<div class="overflow-x-auto pb-2"><div class="flex min-w-full flex-wrap items-center justify-center gap-0.5"><!--[-->`);
          ssrRenderList(unref(weekRange).weeks, (week) => {
            _push(`<div class="relative flex flex-col items-center py-4"><span class="mb-1 text-[10px] font-medium text-gray-500 dark:text-gray-400">${ssrInterpolate(week.number)}</span><div class="relative h-4 w-6 rounded-sm">`);
            if (isPreparationWeek(week.number, week.year)) {
              _push(`<div class="border-secondary-900/40 bg-secondary-900/20 absolute inset-0 rounded-sm border"></div>`);
            } else {
              _push(`<!---->`);
            }
            if (isRealisationWeek(week.number, week.year)) {
              _push(`<div class="border-secondary-900 bg-secondary-800/60 absolute inset-0 rounded-sm border"></div>`);
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
        if (unref(chantier).date_prepa && unref(chantier).date_prepa.length > 0 || unref(chantier).date_rea && unref(chantier).date_rea.length > 0 || unref(weekends).length > 0) {
          _push(`<div class="mt-2 flex h-full flex-row items-start justify-center gap-4 space-y-4 border-t border-gray-100 pt-4 dark:border-gray-700">`);
          if (unref(chantier).date_prepa && unref(chantier).date_prepa.length > 0) {
            _push(`<div class="flex-1 px-4"><p class="text-sm font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-400">Préparation</p><div class="mt-2 flex flex-wrap gap-2"><!--[-->`);
            ssrRenderList(unref(chantier).date_prepa, (periode, index) => {
              _push(`<div class="border-secondary-900/40 bg-secondary-900/20 text-secondary-900 inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium">`);
              _push(ssrRenderComponent(_component_Icon, {
                name: "lucide:calendar",
                size: "12"
              }, null, _parent));
              _push(` ${ssrInterpolate(getWeekNumber(periode.date_start_prepa))} → ${ssrInterpolate(getWeekNumber(periode.date_end_prepa || periode.date_start_prepa))} <span class="text-secondary-900"> (${ssrInterpolate(formatDateShort(periode.date_start_prepa))} - ${ssrInterpolate(formatDateShort(periode.date_end_prepa || periode.date_start_prepa))}) </span></div>`);
            });
            _push(`<!--]--></div></div>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(chantier).date_rea && unref(chantier).date_rea.length > 0) {
            _push(`<div class="flex-1 px-4"><p class="text-sm font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-400">Réalisation</p><div class="mt-2 flex flex-wrap gap-2"><!--[-->`);
            ssrRenderList(unref(chantier).date_rea, (periode, index) => {
              _push(`<div class="border-secondary-900 bg-secondary-800/60 inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium text-white">`);
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
            _push(`<div class="flex-1 px-4"><p class="text-sm font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-400">Week-ends</p><div class="mt-2 flex flex-wrap gap-2"><!--[-->`);
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
        _push(`</div><div class="mt-12"><div class="mb-4 flex items-center gap-3 border-b border-gray-100 pb-2"><div class="bg-primary-600/20 text-primary-700 flex h-8 w-8 items-center justify-center rounded-lg">`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:info",
          size: "18"
        }, null, _parent));
        _push(`</div><h3 class="text-lg font-bold text-gray-700 uppercase">Généralités</h3></div><div class="grid grid-cols-3 gap-4 pl-4"><div class="flex items-center gap-4 rounded-lg"><div><p class="text-sm text-gray-500">Ligne ferroviaire</p><p class="text-xl font-semibold text-gray-900">${ssrInterpolate(unref(chantier).ligne || "-")}</p></div></div><div class="flex items-center gap-4 rounded-lg"><div><p class="text-sm text-gray-500">Réglementation</p><p class="text-xl font-semibold text-gray-900">${ssrInterpolate(unref(chantier).decret ? `Décret ${unref(chantier).decret}` : "-")}</p></div></div><div class="flex items-center gap-4 rounded-lg"><div><p class="text-sm text-gray-500">Type d&#39;essais</p><p class="text-xl font-semibold text-gray-900">${ssrInterpolate(unref(chantier).type_essais ? unref(chantier).type_essais === "simple" ? "Simple" : "Complexe" : "-")}</p></div></div></div></div><div class="mt-12"><div class="mb-4 flex items-center gap-3 border-b border-gray-100 pb-2"><div class="bg-primary-600/20 text-primary-700 flex h-8 w-8 items-center justify-center rounded-lg">`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:landmark",
          size: "18"
        }, null, _parent));
        _push(`</div><h3 class="text-lg font-bold text-gray-700 uppercase">Comptes</h3></div><div class="grid grid-cols-3 gap-4 pl-4"><div class="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/50"><label class="text-secondary-900 text-xs font-semibold tracking-wider uppercase">Compte MOE</label><p class="mt-2 font-mono text-lg font-bold text-gray-900 dark:text-white">${ssrInterpolate(unref(chantier).compte_moe || "-")}</p></div><div class="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/50"><label class="text-secondary-900 text-xs font-semibold tracking-wider uppercase dark:text-cyan-400"> Compte SLG </label><p class="mt-2 font-mono text-lg font-bold text-gray-900 dark:text-white">${ssrInterpolate(unref(chantier).compte_slg || "-")}</p></div><div class="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/50"><label class="text-secondary-900 text-xs font-semibold tracking-wider uppercase dark:text-cyan-400"> Compte Matière </label><p class="mt-2 font-mono text-lg font-bold text-gray-900 dark:text-white">${ssrInterpolate(unref(chantier).compte_matieres || "-")}</p></div></div></div>`);
        if (unref(chantier).autre) {
          _push(`<div class="mt-8"><div class="mb-4 flex items-center gap-3 border-b border-gray-100 pb-2"><div class="bg-primary-600/20 text-primary-700 flex h-8 w-8 items-center justify-center rounded-lg">`);
          _push(ssrRenderComponent(_component_Icon, {
            name: "lucide:wallet",
            size: "18"
          }, null, _parent));
          _push(`</div><h3 class="text-lg font-bold text-gray-900 uppercase">Informations complémentaires</h3></div><p class="pl-4 text-base whitespace-pre-wrap text-gray-700">${ssrInterpolate(unref(chantier).autre)}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</section>`);
        if (unref(contacts)) {
          _push(`<section class="mb-8 break-inside-avoid"><div class="mb-4 flex items-center gap-3 border-b border-gray-100 pb-2"><div class="bg-primary-600/20 text-primary-700 flex h-8 w-8 items-center justify-center rounded-lg">`);
          _push(ssrRenderComponent(_component_Icon, {
            name: "lucide:users",
            size: "18"
          }, null, _parent));
          _push(`</div><h3 class="text-lg font-bold text-gray-700 uppercase">Contacts</h3></div>`);
          if (unref(contacts).generalites && (unref(contacts).generalites.chef_projet_nom || unref(contacts).generalites.coordinateur_securite_nom)) {
            _push(`<div class="mb-4"><p class="mb-2 text-base font-semibold tracking-wide text-gray-500 uppercase">Généralités</p><table class="w-full text-left text-xs"><thead><tr class="bg-secondary-900/10 border-b border-gray-200"><th class="text-secondary-900 px-2 py-1.5 font-semibold">Fonction</th><th class="text-secondary-900 px-2 py-1.5 font-semibold">Nom</th><th class="text-secondary-900 px-2 py-1.5 font-semibold">Email</th></tr></thead><tbody>`);
            if (unref(contacts).generalites.chef_projet_nom) {
              _push(`<tr class="border-b border-gray-100"><td class="px-2 py-1.5 font-bold text-gray-700">Chef de projet</td><td class="px-2 py-1.5 text-gray-700">${ssrInterpolate(unref(contacts).generalites.chef_projet_nom)}</td><td class="px-2 py-1.5 text-gray-700">${ssrInterpolate(unref(contacts).generalites.chef_projet_email || "-")}</td></tr>`);
            } else {
              _push(`<!---->`);
            }
            if (unref(contacts).generalites.coordinateur_securite_nom) {
              _push(`<tr class="border-b border-gray-100"><td class="px-2 py-1.5 font-bold text-gray-700">Coordinateur sécurité</td><td class="px-2 py-1.5 text-gray-700">${ssrInterpolate(unref(contacts).generalites.coordinateur_securite_nom)}</td><td class="px-2 py-1.5 text-gray-700">${ssrInterpolate(unref(contacts).generalites.coordinateur_securite_email || "-")}</td></tr>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</tbody></table></div>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(contacts).travaux && (getUserName(unref(contacts).travaux.rlt_voie_principale) || getUserName(unref(contacts).travaux.rlt_ses_principale) || getUserName(unref(contacts).travaux.rlt_cat_principale) || getUserName(unref(contacts).travaux.preop_voie) || getUserName(unref(contacts).travaux.preop_ses) || getUserName(unref(contacts).travaux.logistique))) {
            _push(`<div class="mb-4"><p class="mb-2 text-base font-semibold tracking-wide text-gray-500 uppercase">Équipe Travaux</p><table class="w-full text-left text-xs"><thead><tr class="bg-secondary-900/10 border-b border-gray-200"><th class="text-secondary-900 px-2 py-1.5 font-semibold">Fonction</th><th class="text-secondary-900 px-2 py-1.5 font-semibold">Nom</th><th class="text-secondary-900 px-2 py-1.5 font-semibold">Email</th></tr></thead><tbody>`);
            if (getUserName(unref(contacts).travaux.rlt_voie_principale)) {
              _push(`<tr class="border-b border-gray-100"><td class="px-2 py-1.5 font-medium text-gray-600">RLT Voie</td><td class="px-2 py-1.5 text-gray-900">${ssrInterpolate(getUserName(unref(contacts).travaux.rlt_voie_principale))}</td><td class="px-2 py-1.5 text-gray-500">${ssrInterpolate(getUserEmail(unref(contacts).travaux.rlt_voie_principale) || "-")}</td></tr>`);
            } else {
              _push(`<!---->`);
            }
            if (getUserNames(unref(contacts).travaux.rlt_voie_secondaire)) {
              _push(`<tr class="border-b border-gray-100"><td class="px-2 py-1.5 font-medium text-gray-500">RLT Voie (sec.)</td><td class="px-2 py-1.5 text-gray-900">${ssrInterpolate(getUserNames(unref(contacts).travaux.rlt_voie_secondaire))}</td><td class="px-2 py-1.5 text-gray-500">-</td></tr>`);
            } else {
              _push(`<!---->`);
            }
            if (getUserName(unref(contacts).travaux.rlt_ses_principale)) {
              _push(`<tr class="border-b border-gray-100"><td class="px-2 py-1.5 font-medium text-gray-600">RLT SES</td><td class="px-2 py-1.5 text-gray-900">${ssrInterpolate(getUserName(unref(contacts).travaux.rlt_ses_principale))}</td><td class="px-2 py-1.5 text-gray-500">${ssrInterpolate(getUserEmail(unref(contacts).travaux.rlt_ses_principale) || "-")}</td></tr>`);
            } else {
              _push(`<!---->`);
            }
            if (getUserNames(unref(contacts).travaux.rlt_ses_secondaire)) {
              _push(`<tr class="border-b border-gray-100"><td class="px-2 py-1.5 font-medium text-gray-500">RLT SES (sec.)</td><td class="px-2 py-1.5 text-gray-900">${ssrInterpolate(getUserNames(unref(contacts).travaux.rlt_ses_secondaire))}</td><td class="px-2 py-1.5 text-gray-500">-</td></tr>`);
            } else {
              _push(`<!---->`);
            }
            if (getUserName(unref(contacts).travaux.rlt_cat_principale)) {
              _push(`<tr class="border-b border-gray-100"><td class="px-2 py-1.5 font-medium text-gray-600">RLT CAT</td><td class="px-2 py-1.5 text-gray-900">${ssrInterpolate(getUserName(unref(contacts).travaux.rlt_cat_principale))}</td><td class="px-2 py-1.5 text-gray-500">${ssrInterpolate(getUserEmail(unref(contacts).travaux.rlt_cat_principale) || "-")}</td></tr>`);
            } else {
              _push(`<!---->`);
            }
            if (getUserNames(unref(contacts).travaux.rlt_cat_secondaire)) {
              _push(`<tr class="border-b border-gray-100"><td class="px-2 py-1.5 font-medium text-gray-500">RLT CAT (sec.)</td><td class="px-2 py-1.5 text-gray-900">${ssrInterpolate(getUserNames(unref(contacts).travaux.rlt_cat_secondaire))}</td><td class="px-2 py-1.5 text-gray-500">-</td></tr>`);
            } else {
              _push(`<!---->`);
            }
            if (getUserNames(unref(contacts).travaux.kv_voie)) {
              _push(`<tr class="border-b border-gray-100"><td class="px-2 py-1.5 font-medium text-gray-600">Contrôleur Voie</td><td class="px-2 py-1.5 text-gray-900">${ssrInterpolate(getUserNames(unref(contacts).travaux.kv_voie))}</td><td class="px-2 py-1.5 text-gray-500">-</td></tr>`);
            } else {
              _push(`<!---->`);
            }
            if (getUserNames(unref(contacts).travaux.kv_ses)) {
              _push(`<tr class="border-b border-gray-100"><td class="px-2 py-1.5 font-medium text-gray-600">Contrôleur SES</td><td class="px-2 py-1.5 text-gray-900">${ssrInterpolate(getUserNames(unref(contacts).travaux.kv_ses))}</td><td class="px-2 py-1.5 text-gray-500">-</td></tr>`);
            } else {
              _push(`<!---->`);
            }
            if (getUserNames(unref(contacts).travaux.kv_cat)) {
              _push(`<tr class="border-b border-gray-100"><td class="px-2 py-1.5 font-medium text-gray-600">Contrôleur CAT</td><td class="px-2 py-1.5 text-gray-900">${ssrInterpolate(getUserNames(unref(contacts).travaux.kv_cat))}</td><td class="px-2 py-1.5 text-gray-500">-</td></tr>`);
            } else {
              _push(`<!---->`);
            }
            if (getUserName(unref(contacts).travaux.preop_voie)) {
              _push(`<tr class="border-b border-gray-100"><td class="px-2 py-1.5 font-medium text-gray-600">Pré-op Voie</td><td class="px-2 py-1.5 text-gray-900">${ssrInterpolate(getUserName(unref(contacts).travaux.preop_voie))}</td><td class="px-2 py-1.5 text-gray-500">${ssrInterpolate(getUserEmail(unref(contacts).travaux.preop_voie) || "-")}</td></tr>`);
            } else {
              _push(`<!---->`);
            }
            if (getUserName(unref(contacts).travaux.preop_ses)) {
              _push(`<tr class="border-b border-gray-100"><td class="px-2 py-1.5 font-medium text-gray-600">Pré-op SES</td><td class="px-2 py-1.5 text-gray-900">${ssrInterpolate(getUserName(unref(contacts).travaux.preop_ses))}</td><td class="px-2 py-1.5 text-gray-500">${ssrInterpolate(getUserEmail(unref(contacts).travaux.preop_ses) || "-")}</td></tr>`);
            } else {
              _push(`<!---->`);
            }
            if (getUserName(unref(contacts).travaux.logistique)) {
              _push(`<tr class="border-b border-gray-100"><td class="px-2 py-1.5 font-medium text-gray-600">Logistique</td><td class="px-2 py-1.5 text-gray-900">${ssrInterpolate(getUserName(unref(contacts).travaux.logistique))}</td><td class="px-2 py-1.5 text-gray-500">${ssrInterpolate(getUserEmail(unref(contacts).travaux.logistique) || "-")}</td></tr>`);
            } else {
              _push(`<!---->`);
            }
            if (getUserNames(unref(contacts).travaux.supervisor)) {
              _push(`<tr class="border-b border-gray-100"><td class="px-2 py-1.5 font-medium text-slate-600">Superviseurs</td><td class="px-2 py-1.5 text-gray-900">${ssrInterpolate(getUserNames(unref(contacts).travaux.supervisor))}</td><td class="px-2 py-1.5 text-gray-500">-</td></tr>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</tbody></table></div>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(contacts).etudes && (unref(contacts).etudes.plan_technique_nom || unref(contacts).etudes.documents_execution_nom)) {
            _push(`<div class="mb-4"><p class="mb-2 text-base font-semibold tracking-wide text-gray-500 uppercase">Études</p><table class="w-full text-left text-xs"><thead><tr class="bg-secondary-900/10 border-b border-gray-200"><th class="text-secondary-900 px-2 py-1.5 font-semibold">Fonction</th><th class="text-secondary-900 px-2 py-1.5 font-semibold">Nom</th><th class="text-secondary-900 px-2 py-1.5 font-semibold">Email</th></tr></thead><tbody>`);
            if (unref(contacts).etudes.plan_technique_nom) {
              _push(`<tr class="border-b border-gray-100"><td class="px-2 py-1.5 font-medium text-gray-600">Plan technique</td><td class="px-2 py-1.5 text-gray-900">${ssrInterpolate(unref(contacts).etudes.plan_technique_nom)}</td><td class="px-2 py-1.5 text-gray-500">${ssrInterpolate(unref(contacts).etudes.plan_technique_email || "-")}</td></tr>`);
            } else {
              _push(`<!---->`);
            }
            if (unref(contacts).etudes.documents_execution_nom) {
              _push(`<tr class="border-b border-gray-100"><td class="px-2 py-1.5 font-medium text-gray-600">Documents d&#39;exécution</td><td class="px-2 py-1.5 text-gray-900">${ssrInterpolate(unref(contacts).etudes.documents_execution_nom)}</td><td class="px-2 py-1.5 text-gray-500">${ssrInterpolate(unref(contacts).etudes.documents_execution_email || "-")}</td></tr>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</tbody></table></div>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(contacts).entreprises?.length) {
            _push(`<div class="mb-4"><p class="mb-2 text-base font-semibold tracking-wide text-gray-500 uppercase">Entreprises</p><table class="w-full text-left text-xs"><thead><tr class="bg-secondary-900/10 border-b border-gray-200"><th class="text-secondary-900 px-2 py-1.5 font-semibold">Métier</th><th class="text-secondary-900 px-2 py-1.5 font-semibold">Entreprise</th><th class="text-secondary-900 px-2 py-1.5 font-semibold">Responsable</th><th class="text-secondary-900 px-2 py-1.5 font-semibold">Email</th></tr></thead><tbody><!--[-->`);
            ssrRenderList(unref(contacts).entreprises, (ent) => {
              _push(`<tr class="border-b border-gray-100"><td class="px-2 py-1.5 font-medium text-gray-600">${ssrInterpolate(ent.metier || "-")}</td><td class="px-2 py-1.5 text-gray-900">${ssrInterpolate(ent.entreprise || "-")}</td><td class="px-2 py-1.5 text-gray-900">${ssrInterpolate(ent.responsable_nom || "-")}</td><td class="px-2 py-1.5 text-gray-500">${ssrInterpolate(ent.responsable_email || "-")}</td></tr>`);
            });
            _push(`<!--]--></tbody></table></div>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(contacts).autres?.length) {
            _push(`<div><p class="mb-2 text-base font-semibold tracking-wide text-gray-500 uppercase">Autres contacts</p><table class="w-full text-left text-xs"><thead><tr class="bg-secondary-900/10 border-b border-gray-200"><th class="text-secondary-900 px-2 py-1.5 font-semibold">Fonction</th><th class="text-secondary-900 px-2 py-1.5 font-semibold">Organisme</th><th class="text-secondary-900 px-2 py-1.5 font-semibold">Responsable</th><th class="text-secondary-900 px-2 py-1.5 font-semibold">Email</th></tr></thead><tbody><!--[-->`);
            ssrRenderList(unref(contacts).autres, (autre) => {
              _push(`<tr class="border-b border-gray-100"><td class="px-2 py-1.5 font-medium text-slate-600">${ssrInterpolate(autre.metier || "-")}</td><td class="px-2 py-1.5 text-gray-900">${ssrInterpolate(autre.entreprise || "-")}</td><td class="px-2 py-1.5 text-gray-900">${ssrInterpolate(autre.responsable_nom || "-")}</td><td class="px-2 py-1.5 text-gray-500">${ssrInterpolate(autre.responsable_email || "-")}</td></tr>`);
            });
            _push(`<!--]--></tbody></table></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</section>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(sortedTimeline).length > 0) {
          _push(`<section class="mb-8 break-inside-avoid"><div class="mb-4 flex items-center gap-3 border-b border-gray-100 pb-2"><div class="bg-primary-600/20 text-primary-700 flex h-8 w-8 items-center justify-center rounded-lg">`);
          _push(ssrRenderComponent(_component_Icon, {
            name: "lucide:git-branch",
            size: "18"
          }, null, _parent));
          _push(`</div><h3 class="text-lg font-bold text-gray-700 uppercase">Timeline</h3></div><div class="relative ml-4 border-l-2 border-gray-200 pl-4"><!--[-->`);
          ssrRenderList(unref(sortedTimeline), (item) => {
            _push(`<div class="relative mb-4 last:mb-0"><div class="${ssrRenderClass([item.type === "weekend" ? "bg-orange-500" : "bg-secondary-900", "absolute top-1 -left-[23px] h-3 w-3 rounded-full border-2 border-white"])}"></div><div class="rounded-lg border border-gray-100 bg-gray-50 p-3 print:bg-white"><div class="mb-1 flex items-center gap-2"><span class="${ssrRenderClass([item.type === "weekend" ? "text-orange-600" : "text-secondary-900", "text-[10px] font-semibold uppercase"])}">${ssrInterpolate(getTypeLabel(item.type))}</span><span class="text-xs text-gray-500"> S${ssrInterpolate(item.semaine_debut)}/${ssrInterpolate(item.annee_debut)} `);
            if (item.semaine_fin) {
              _push(`<!--[-->→ S${ssrInterpolate(item.semaine_fin)}/${ssrInterpolate(item.annee_fin)}<!--]-->`);
            } else {
              _push(`<!---->`);
            }
            _push(`</span></div><p class="text-sm whitespace-pre-line text-gray-800">${ssrInterpolate(item.contenu)}</p></div></div>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(dex).length > 0 || unref(pt).length > 0) {
          _push(`<section class="mb-8 break-before-page"><div class="mb-4 flex items-center gap-3 border-b border-gray-100 pb-2"><div class="bg-primary-600/20 text-primary-700 flex h-8 w-8 items-center justify-center rounded-lg">`);
          _push(ssrRenderComponent(_component_Icon, {
            name: "lucide:graduation-cap",
            size: "18"
          }, null, _parent));
          _push(`</div><h3 class="text-lg font-bold text-gray-700 uppercase">Études</h3></div>`);
          if (unref(dex).length > 0) {
            _push(`<div class="mb-4"><p class="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">Documents d&#39;exécution</p><table class="w-full text-left text-xs"><thead><tr class="border-b border-gray-200 bg-gray-50 print:bg-white"><th class="px-2 py-1.5 font-semibold text-gray-600">Indice</th><th class="px-2 py-1.5 font-semibold text-gray-600">Titre</th><th class="px-2 py-1.5 font-semibold text-gray-600">MES</th><th class="px-2 py-1.5 font-semibold text-gray-600">Demande</th><th class="px-2 py-1.5 font-semibold text-gray-600">Reçu</th><th class="px-2 py-1.5 font-semibold text-gray-600">Statut</th></tr></thead><tbody><!--[-->`);
            ssrRenderList(unref(dex), (doc) => {
              _push(`<tr class="border-b border-gray-100"><td class="px-2 py-1.5 font-mono text-gray-900">${ssrInterpolate(doc.indice)}</td><td class="px-2 py-1.5 text-gray-900">${ssrInterpolate(doc.titre || "-")}</td><td class="px-2 py-1.5 text-gray-600">${ssrInterpolate(unref(formatDate)(doc.date_mes))}</td><td class="px-2 py-1.5 text-gray-600">${ssrInterpolate(unref(formatDate)(doc.date_demande))}</td><td class="px-2 py-1.5 text-gray-600">${ssrInterpolate(unref(formatDate)(doc.date_recu))}</td><td class="px-2 py-1.5"><span class="${ssrRenderClass([{
                "bg-primary-100 text-primary-700 print:bg-primary-50": unref(getDocumentStatus)(doc, true).color === "primary",
                "bg-amber-100 text-amber-700 print:bg-amber-50": unref(getDocumentStatus)(doc, true).color === "amber",
                "bg-secondary-100 text-secondary-700 print:bg-secondary-50": unref(getDocumentStatus)(doc, true).color === "secondary",
                "bg-gray-100 text-gray-600 print:bg-gray-50": unref(getDocumentStatus)(doc, true).color === "gray"
              }, "inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold"])}">${ssrInterpolate(unref(getDocumentStatus)(doc, true).label)}</span></td></tr>`);
            });
            _push(`<!--]--></tbody></table></div>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(pt).length > 0) {
            _push(`<div><p class="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">Plans techniques</p><table class="w-full text-left text-xs"><thead><tr class="border-b border-gray-200 bg-gray-50 print:bg-white"><th class="px-2 py-1.5 font-semibold text-gray-600">Indice</th><th class="px-2 py-1.5 font-semibold text-gray-600">Titre</th><th class="px-2 py-1.5 font-semibold text-gray-600">MES</th><th class="px-2 py-1.5 font-semibold text-gray-600">Reçu</th><th class="px-2 py-1.5 font-semibold text-gray-600">Statut</th></tr></thead><tbody><!--[-->`);
            ssrRenderList(unref(pt), (plan) => {
              _push(`<tr class="border-b border-gray-100"><td class="px-2 py-1.5 font-mono text-gray-900">${ssrInterpolate(plan.indice)}</td><td class="px-2 py-1.5 text-gray-900">${ssrInterpolate(plan.titre || "-")}</td><td class="px-2 py-1.5 text-gray-600">${ssrInterpolate(unref(formatDate)(plan.date_mes))}</td><td class="px-2 py-1.5 text-gray-600">${ssrInterpolate(unref(formatDate)(plan.date_recu))}</td><td class="px-2 py-1.5"><span class="${ssrRenderClass([{
                "bg-primary-100 text-primary-700 print:bg-primary-50": unref(getPtStatus)(plan).color === "primary",
                "bg-amber-100 text-amber-700 print:bg-amber-50": unref(getPtStatus)(plan).color === "amber",
                "bg-secondary-100 text-secondary-700 print:bg-secondary-50": unref(getPtStatus)(plan).color === "secondary",
                "bg-gray-100 text-gray-600 print:bg-gray-50": unref(getPtStatus)(plan).color === "gray"
              }, "inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold"])}">${ssrInterpolate(unref(getPtStatus)(plan).label)}</span></td></tr>`);
            });
            _push(`<!--]--></tbody></table></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</section>`);
        } else {
          _push(`<!---->`);
        }
        if (Object.values(unref(commentaires)).some((c) => c?.content)) {
          _push(`<section class="mb-8"><div class="mb-4 flex items-center gap-3 border-b border-gray-100 pb-2"><div class="bg-primary-600/20 text-primary-700 flex h-8 w-8 items-center justify-center rounded-lg">`);
          _push(ssrRenderComponent(_component_Icon, {
            name: "lucide:message-square",
            size: "18"
          }, null, _parent));
          _push(`</div><h3 class="text-lg font-bold text-gray-700 uppercase">Commentaires</h3></div><div class="space-y-8">`);
          if (unref(commentaires).generalite.content) {
            _push(`<div class="break-inside-avoid border-b border-gray-200 pb-4"><h5 class="bg-secondary-900/10 text-secondary-900 mb-2 p-2 text-xs font-bold tracking-wide">Généralités</h5><div class="prose prose-sm max-w-none text-sm text-gray-700">${unref(commentaires).generalite.content ?? ""}</div></div>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(commentaires).ses?.content) {
            _push(`<div class="break-inside-avoid border-b border-gray-200 pb-4"><h5 class="bg-secondary-900/10 text-secondary-900 mb-2 p-2 text-xs font-bold tracking-wide">SES</h5><div class="prose prose-sm max-w-none text-sm text-gray-700">${unref(commentaires).ses.content ?? ""}</div></div>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(commentaires).voie?.content) {
            _push(`<div class="break-inside-avoid border-b border-gray-200 pb-4"><h5 class="bg-secondary-900/10 text-secondary-900 mb-2 p-2 text-sm font-bold tracking-wide">Voie</h5><div class="prose prose-sm max-w-none text-sm text-gray-700">${unref(commentaires).voie.content ?? ""}</div></div>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(commentaires).logistique?.content) {
            _push(`<div class="break-inside-avoid border-b border-gray-200 pb-4"><h5 class="bg-secondary-900/10 text-secondary-900 mb-2 p-2 text-xs font-bold tracking-wide">Logistique</h5><div class="prose prose-sm max-w-none text-sm text-gray-700">${unref(commentaires).logistique.content ?? ""}</div></div>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(commentaires).terrain?.content) {
            _push(`<div class="break-inside-avoid border-b border-gray-200 pb-4"><h5 class="bg-secondary-900/10 text-secondary-900 mb-2 p-2 text-xs font-bold tracking-wide">Terrain</h5><div class="prose prose-sm max-w-none text-sm text-gray-700">${unref(commentaires).terrain.content ?? ""}</div></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<footer class="mt-8 border-t-2 border-gray-200 pt-4"><div class="flex justify-between text-[10px] text-gray-400"><span>Document généré par H00</span><span>${ssrInterpolate(unref(chantier).compte)} - ${ssrInterpolate(unref(chantier).name)}</span></div></footer></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/chantiers/print/[id].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_id_-CEMuBo12.mjs.map
