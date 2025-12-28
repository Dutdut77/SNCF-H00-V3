import { i as useRoute, c as useAuthUser, u as useHead, d as __nuxt_component_1 } from './server.mjs';
import { ref, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrRenderStyle } from 'vue/server-renderer';
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
  __name: "taches",
  __ssrInlineRender: true,
  setup(__props) {
    useRoute();
    const user = useAuthUser();
    const taches = ref([]);
    const isLoading = ref(true);
    useHead({
      title: "Impression - Liste des tâches"
    });
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
        return { type: "fait", label: "Fait", color: "#10b981" };
      }
      if (status === 1) {
        return { type: "en_cours", label: "En cours", color: "#f59e0b" };
      }
      if (status === 0 && prevision) {
        const now = /* @__PURE__ */ new Date();
        const previsionDate = new Date(prevision);
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const previsionMonth = new Date(previsionDate.getFullYear(), previsionDate.getMonth(), 1);
        if (previsionMonth <= currentMonth) {
          return { type: "a_faire", label: "À faire", color: "#ef4444" };
        }
      }
      return { type: "planifie", label: "Planifié", color: "#6b7280" };
    };
    const tachesGroupedByChantier = computed(() => {
      const grouped = {};
      taches.value.forEach((tache) => {
        tache.chantier_id;
        const chantierKey = `${tache.chantiers?.compte || "N/A"} - ${tache.chantiers?.name || "Sans nom"}`;
        if (!grouped[chantierKey]) {
          grouped[chantierKey] = {
            chantier: tache.chantiers,
            taches: []
          };
        }
        grouped[chantierKey].taches.push(tache);
      });
      return grouped;
    });
    const printDate = (/* @__PURE__ */ new Date()).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
    const userName = computed(() => {
      if (!user.value) return "Utilisateur";
      return user.value.prenom && user.value.nom ? `${user.value.prenom} ${user.value.nom}` : user.value.email;
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Icon = __nuxt_component_1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "print-page min-h-screen bg-gray-100 print:bg-white" }, _attrs))}>`);
      if (unref(isLoading)) {
        _push(`<div class="flex min-h-screen flex-col items-center justify-center gap-4"><div class="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"></div><p class="text-gray-600">Préparation du document...</p></div>`);
      } else {
        _push(`<div class="mx-auto max-w-4xl bg-white p-8 shadow-lg print:max-w-none print:p-0 print:shadow-none"><div class="mb-6 flex gap-3 print:hidden"><button class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:printer",
          size: "18"
        }, null, _parent));
        _push(` Imprimer </button></div><header class="mb-8 border-b-2 border-indigo-600 pb-6"><div class="flex items-start justify-between"><div><h1 class="text-3xl font-bold text-gray-900">Liste des Tâches</h1><p class="mt-1 text-lg text-gray-600">${ssrInterpolate(unref(userName))}</p></div><div class="text-right"><div class="inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2">`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:calendar",
          size: "20",
          class: "text-indigo-600"
        }, null, _parent));
        _push(`<span class="font-medium text-indigo-700">${ssrInterpolate(unref(printDate))}</span></div><p class="mt-2 text-sm text-gray-500">${ssrInterpolate(unref(taches).length)} tâche(s) sélectionnée(s)</p></div></div></header>`);
        if (unref(taches).length === 0) {
          _push(`<div class="py-12 text-center">`);
          _push(ssrRenderComponent(_component_Icon, {
            name: "lucide:clipboard-x",
            size: "48",
            class: "mx-auto mb-4 text-gray-300"
          }, null, _parent));
          _push(`<p class="text-lg text-gray-500">Aucune tâche à afficher</p><p class="mt-1 text-sm text-gray-400">Sélectionnez des tâches avant d&#39;imprimer</p></div>`);
        } else {
          _push(`<div class="space-y-8"><!--[-->`);
          ssrRenderList(unref(tachesGroupedByChantier), (group, chantierKey) => {
            _push(`<section class="page-break-inside-avoid"><div class="from-primary-400 to-primary-600 border-primary-400 mb-4 flex items-center gap-3 rounded-lg bg-linear-to-br px-4 py-3"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">`);
            _push(ssrRenderComponent(_component_Icon, {
              name: "lucide:building-2",
              size: "20",
              class: "text-white"
            }, null, _parent));
            _push(`</div><div><h2 class="text-lg font-bold text-white">${ssrInterpolate(group.chantier?.compte || "N/A")}</h2><p class="text-sm text-indigo-100">${ssrInterpolate(group.chantier?.name || "Sans nom")}</p></div><div class="ml-auto rounded-full bg-white/20 px-3 py-1"><span class="text-sm font-semibold text-white">${ssrInterpolate(group.taches.length)} tâche(s)</span></div></div><table class="w-full border-collapse"><thead><tr class="border-b-2 border-gray-200 bg-gray-50"><th class="px-3 py-3 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase">Tâche</th><th class="px-3 py-3 text-center text-xs font-semibold tracking-wider text-gray-600 uppercase"> Catégorie </th><th class="px-3 py-3 text-center text-xs font-semibold tracking-wider text-gray-600 uppercase"> Prévision </th><th class="px-3 py-3 text-center text-xs font-semibold tracking-wider text-gray-600 uppercase"> Status </th><th class="px-3 py-3 text-center text-xs font-semibold tracking-wider text-gray-600 uppercase"> Alertes </th></tr></thead><tbody class="divide-y divide-gray-100"><!--[-->`);
            ssrRenderList(group.taches, (tache) => {
              _push(`<tr class="hover:bg-gray-50"><td class="px-3 py-3"><div class="font-medium text-gray-900">${ssrInterpolate(tache.taches?.tache || "-")}</div>`);
              if (tache.commentaire) {
                _push(`<div class="mt-1 text-xs text-gray-500 italic">${ssrInterpolate(tache.commentaire)}</div>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</td><td class="px-3 py-3 text-center">`);
              if (tache.categories?.name) {
                _push(`<span class="inline-block rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">${ssrInterpolate(tache.categories.name)}</span>`);
              } else {
                _push(`<span class="text-gray-400">-</span>`);
              }
              _push(`</td><td class="px-3 py-3 text-center"><span class="font-medium text-gray-700">${ssrInterpolate(formatDateMonthYear(tache.prevision))}</span></td><td class="px-3 py-3 text-center"><span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold" style="${ssrRenderStyle({
                backgroundColor: getRealisationStatus(tache).color + "20",
                color: getRealisationStatus(tache).color
              })}">${ssrInterpolate(getRealisationStatus(tache).label)}</span></td><td class="px-3 py-3 text-center"><div class="flex items-center justify-center gap-2">`);
              if (tache.important) {
                _push(`<span class="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">`);
                _push(ssrRenderComponent(_component_Icon, {
                  name: "lucide:triangle-alert",
                  size: "12"
                }, null, _parent));
                _push(` Important </span>`);
              } else {
                _push(`<!---->`);
              }
              if (tache.alerte) {
                _push(`<span class="inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">`);
                _push(ssrRenderComponent(_component_Icon, {
                  name: "lucide:siren",
                  size: "12"
                }, null, _parent));
                _push(` Alerte </span>`);
              } else {
                _push(`<!---->`);
              }
              if (!tache.important && !tache.alerte) {
                _push(`<span class="text-gray-400">-</span>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</div></td></tr>`);
            });
            _push(`<!--]--></tbody></table></section>`);
          });
          _push(`<!--]--></div>`);
        }
        _push(`<footer class="mt-12 border-t border-gray-200 pt-6 text-center print:mt-8"><p class="text-sm text-gray-500">Document généré le ${ssrInterpolate(unref(printDate))} • H00 - Gestion des chantiers</p></footer></div>`);
      }
      _push(`</div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/print/taches.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=taches-BOozyzUD.mjs.map
