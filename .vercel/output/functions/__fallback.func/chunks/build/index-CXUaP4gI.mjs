import { _ as __nuxt_component_0, a as _sfc_main$5 } from './switch-Du8wHBlL.mjs';
import { _ as __nuxt_component_1 } from './inputSearch-Xv57A_RG.mjs';
import { u as useHead, a as useToast, b as useLoader, c as useAuthUser, _ as _sfc_main$2, d as __nuxt_component_1$1, n as navigateTo } from './server.mjs';
import { _ as _sfc_main$1 } from './titleMain-BKNYl-Iw.mjs';
import { _ as _sfc_main$3 } from './checkbox-BtivfJtA.mjs';
import { _ as _sfc_main$1$1, a as _sfc_main$4 } from './slideOverContent-DhkvxfVz.mjs';
import { _ as __nuxt_component_6 } from './datePicker-CE1CBEZO.mjs';
import { ref, computed, withCtx, unref, isRef, createVNode, createTextVNode, createBlock, createCommentVNode, openBlock, toDisplayString, withDirectives, vModelText, Fragment, renderList, withModifiers, useSSRContext } from 'vue';
import { ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrRenderStyle } from 'vue/server-renderer';
import { u as useChantiers } from './useChantiers-C2XRmo5v.mjs';
import { u as useContacts } from './useContacts-BdCjpTgN.mjs';
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

const _sfc_main = {
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({
      title: "H00 - Mes taches",
      description: "Liste de mes taches H00"
    });
    useToast();
    const { setLoader } = useLoader();
    const user = useAuthUser();
    const { getChantiers, getChantiersNonTermines, getAllChantiers } = useChantiers();
    const { getContactsTravauxChantiersArray } = useContacts();
    const { getH00ByChantierArray, updateH00Entry, deleteH00Entry } = useH00();
    const { isAuthorizedForTache } = useLevelUser();
    const userChantiers = ref([]);
    const allTaches = ref([]);
    const selectedChantier = ref(null);
    const globalFilterChantier = ref("");
    const globalFilterTache = ref("");
    const selectedTache = ref({});
    const commentaire = ref("");
    const important = ref(false);
    const alerte = ref(false);
    const dateCloture = ref(null);
    const open = ref(false);
    const selectedRows = ref([]);
    function formatMonthYear(year, month) {
      const date = new Date(year, month - 1, 1);
      const monthName = date.toLocaleDateString("fr-FR", { month: "long" }).toUpperCase();
      return {
        month: monthName,
        year: date.getFullYear()
      };
    }
    const selectedMonth = ref("current");
    const selectedMonthData = computed(() => {
      return selectedMonth.value === "current" ? currentMonth.value : nextMonth.value;
    });
    const currentDate = /* @__PURE__ */ new Date();
    const currentMonth = computed(() => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      return { year, month, label: formatMonthYear(year, month + 1) };
    });
    const nextMonth = computed(() => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const nextMonthDate = new Date(year, month, 1);
      return {
        year: nextMonthDate.getFullYear(),
        month: nextMonthDate.getMonth(),
        // 0-11 pour les calculs
        label: formatMonthYear(nextMonthDate.getFullYear(), nextMonthDate.getMonth() + 1)
      };
    });
    const itemsRadio = computed(() => [
      {
        label: {
          month: currentMonth.value.label.month,
          year: currentMonth.value.label.year
        },
        value: "current",
        nbTotalTaches: listTachesCurrentMonth.value.length
      },
      {
        label: {
          month: nextMonth.value.label.month,
          year: nextMonth.value.label.year
        },
        value: "next",
        nbTotalTaches: listTachesNextMonth.value.length
      }
    ]);
    const listTachesCurrentMonth = computed(() => {
      const selectedYear = selectedMonthData.value.year;
      const selectedMonthNum = selectedMonthData.value.month;
      const endOfMonth = new Date(selectedYear, selectedMonthNum + 1, 0, 23, 59, 59);
      return allTaches.value.filter((tache) => {
        if (!tache.prevision) return false;
        const previsionDate = new Date(tache.prevision);
        return previsionDate <= endOfMonth;
      });
    });
    const listTachesNextMonth = computed(() => {
      const selectedYear = nextMonth.value.year;
      const selectedMonthNum = nextMonth.value.month;
      const startOfMonth = new Date(selectedYear, selectedMonthNum, 1);
      const endOfMonth = new Date(selectedYear, selectedMonthNum + 1, 0, 23, 59, 59);
      return allTaches.value.filter((tache) => {
        if (!tache.prevision) return false;
        const previsionDate = new Date(tache.prevision);
        return previsionDate >= startOfMonth && previsionDate <= endOfMonth;
      });
    });
    const itemsLeftNavBar = computed(() => {
      if (selectedMonth.value === "current") {
        const grouped = listTachesCurrentMonth.value.reduce((acc, item) => {
          const id = item.chantier_id;
          if (!acc[id]) {
            acc[id] = {
              chantier: item.chantiers,
              taches: []
            };
          }
          acc[id].taches.push(item);
          return acc;
        }, {});
        const items = [
          {
            value: null,
            label: "Tous les chantiers",
            icon: "lucide-folder",
            badge: allTaches.length
          },
          ...Object.values(grouped).map((group) => ({
            value: group.chantier.id,
            compte: group.chantier.compte,
            label: group.chantier.name,
            icon: "lucide-folder",
            badge: group.taches.length
          }))
        ];
        return items;
      }
      if (selectedMonth.value === "next") {
        const grouped = listTachesNextMonth.value.reduce((acc, item) => {
          const id = item.chantier_id;
          if (!acc[id]) {
            acc[id] = {
              chantier: item.chantiers,
              taches: []
            };
          }
          acc[id].taches.push(item);
          return acc;
        }, {});
        const items = [
          {
            value: null,
            label: "Tous les chantiers",
            icon: "lucide-folder",
            badge: allTaches.length
          },
          ...Object.values(grouped).map((group) => ({
            value: group.chantier.id,
            label: `${group.chantier.compte} ${group.chantier.name}`,
            icon: "lucide-folder",
            badge: group.taches.length
          }))
        ];
        return items;
      }
      return [];
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
        return { type: "fait", label: "Fait" };
      }
      if (status === 1) {
        return { type: "en_cours", label: "En cours" };
      }
      if (status === 0 && prevision) {
        const now = /* @__PURE__ */ new Date();
        const previsionDate = new Date(prevision);
        const currentMonth2 = new Date(now.getFullYear(), now.getMonth(), 1);
        const previsionMonth = new Date(previsionDate.getFullYear(), previsionDate.getMonth(), 1);
        if (previsionMonth <= currentMonth2) {
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
    const isAllSelected = computed(() => {
      return selectedRows.value.length === filteredlistTachesSelected.value.length && filteredlistTachesSelected.value.length > 0;
    });
    const toggleSelectAll = (checked) => {
      if (checked) {
        selectedRows.value = filteredlistTachesSelected.value.map((r) => r);
      } else {
        selectedRows.value = [];
      }
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
    const listTachesSelected = computed(() => {
      const list = selectedMonth.value === "current" ? listTachesCurrentMonth.value : listTachesNextMonth.value;
      if (!selectedChantier.value) {
        return list;
      }
      return list.filter((t) => t.chantier_id === selectedChantier.value);
    });
    const filteredlistTachesSelected = computed(() => {
      const search = globalFilterTache.value?.toLowerCase() ?? "";
      let result = listTachesSelected.value;
      if (search) {
        result = result.filter(
          (t) => t.categories?.name?.toLowerCase().includes(search) || t.taches?.tache?.toLowerCase().includes(search) || t.chantiers?.compte?.toLowerCase().includes(search) || t.chantiers?.name?.toLowerCase().includes(search)
        );
      }
      return result;
    });
    const filteredItemsLeftNavBar = computed(() => {
      const search = globalFilterChantier.value?.toLowerCase() ?? "";
      let result = itemsLeftNavBar.value;
      if (search) {
        result = result.filter((t) => t.compte?.toLowerCase().includes(search) || t.label?.toLowerCase().includes(search));
      }
      return result;
    });
    const userIdPresentInContactsTravaux = (userId, contactsTravaux) => {
      return contactsTravaux.filter((item) => {
        const fields = [
          item.rlt_voie_principale,
          ...item.rlt_voie_secondaire || [],
          item.rlt_ses_principale,
          ...item.rlt_ses_secondaire || [],
          item.rlt_cat_principale,
          ...item.rlt_cat_secondaire || [],
          item.preop_voie,
          item.preop_ses,
          item.logistique,
          ...item.supervisor || []
        ];
        return fields.includes(userId);
      }).map((item) => item.chantier_id);
    };
    const sortByPrevision = (entries) => {
      if (!Array.isArray(entries)) return [];
      return [...entries].sort((a, b) => {
        const dateA = new Date(a.prevision);
        const dateB = new Date(b.prevision);
        const diffDate = dateA - dateB;
        if (diffDate !== 0) return diffDate;
        return a.id - b.id;
      });
    };
    const loadAllData = async () => {
      setLoader(true);
      try {
        await getChantiers();
        if (getChantiersNonTermines.value.length > 0) {
          const chantiersNonTermineIds = getChantiersNonTermines.value.map((chantier) => chantier.id);
          const contactsTravaux = await getContactsTravauxChantiersArray(chantiersNonTermineIds);
          const matchingChantierContactIds = userIdPresentInContactsTravaux(user.value.id, contactsTravaux);
          userChantiers.value = getAllChantiers.value.filter((chantier) => matchingChantierContactIds.includes(chantier.id));
          const h00Entries = await getH00ByChantierArray(matchingChantierContactIds);
          const filtered = await Promise.all(
            h00Entries.data.map(async (item) => {
              const authorized = await isAuthorizedForTache(
                item.chantiers,
                // ou props.chantier selon ton contexte
                item.taches.tache_profil
              );
              return authorized ? item : null;
            })
          );
          const filteredH00EntriesNotNull = filtered.filter((item) => item !== null);
          const filteredH00EntriesNotCloturer = filteredH00EntriesNotNull.filter((item) => item.status !== 2);
          const sortedEntries = sortByPrevision(filteredH00EntriesNotCloturer);
          allTaches.value = sortedEntries;
        }
      } finally {
        setLoader(false);
      }
    };
    const cloturerTache = async () => {
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
        await loadAllData();
        open.value = false;
      } catch (err) {
        console.error("Erreur lors de la clôture:", err);
      } finally {
        setLoader(false);
      }
    };
    const enregistrer = async () => {
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
        await loadAllData();
        open.value = false;
      } catch (err) {
        console.error("Erreur lors de l'enregistrement:", err);
      } finally {
        setLoader(false);
      }
    };
    const nonConcerne = async () => {
      setLoader(true);
      try {
        const { error } = await deleteH00Entry(selectedTache.value.id);
        if (error) throw error;
        await loadAllData();
        open.value = false;
      } catch (err) {
        console.error("Erreur lors de la suppression:", err);
      } finally {
        setLoader(false);
      }
    };
    const goToChantier = () => {
      if (selectedChantier.value) {
        navigateTo(`/chantiers/${selectedChantier.value}`);
      }
    };
    const printTaches = () => {
      if (selectedRows.value.length === 0) return;
      sessionStorage.setItem("printTaches", JSON.stringify(selectedRows.value));
      (void 0).open("/print/taches", "_blank");
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppPageLayout = __nuxt_component_0;
      const _component_AppInputSearch = __nuxt_component_1;
      const _component_Icon = __nuxt_component_1$1;
      const _component_AppTitleMain = _sfc_main$1;
      const _component_AppButtonValidated = _sfc_main$2;
      const _component_AppCheckbox = _sfc_main$3;
      const _component_AppSlideOver = _sfc_main$1$1;
      const _component_AppSlideOverContent = _sfc_main$4;
      const _component_AppSwitch = _sfc_main$5;
      const _component_AppDatePicker = __nuxt_component_6;
      _push(ssrRenderComponent(_component_AppPageLayout, _attrs, {
        sidebar: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="space-y-4"${_scopeId}><div class="flex gap-2"${_scopeId}><!--[-->`);
            ssrRenderList(unref(itemsRadio), (item) => {
              _push2(`<div class="${ssrRenderClass([
                unref(selectedMonth) === item.value ? "border-slate-600 bg-linear-to-br from-slate-600 to-slate-800 text-white" : "hover:border-primary-700/30 border-gray-200 bg-white hover:shadow-lg",
                "group flex flex-1 cursor-pointer flex-col items-center justify-between rounded-xl border bg-red-200 p-3 transition-all duration-300 hover:shadow-lg"
              ])}"${_scopeId}><div class="flex w-full flex-col items-center justify-center"${_scopeId}><div class="text-center text-xl font-bold"${_scopeId}>${ssrInterpolate(item.label.month)}</div><div class="-mt-2 text-lg font-bold tracking-widest"${_scopeId}>${ssrInterpolate(item.label.year)}</div></div><div class="${ssrRenderClass([
                unref(selectedMonth) === item.value ? "bg-primary-200 text-primary-800 border-primary-700 dark:from-primary-900/50 dark:to-primary-800/50" : "bg-primary-200 text-primary-800 border-primary-700/30 group-hover:bg-primary-700/30 group-hover:border-primary-700/40 group-hover:text-primary-900 duration-300 group-hover:shadow-md",
                "mt-1 w-full rounded-lg border text-center text-lg font-medium tracking-wide transition-all duration-300"
              ])}"${_scopeId}>${ssrInterpolate(item.nbTotalTaches)}</div></div>`);
            });
            _push2(`<!--]--></div>`);
            _push2(ssrRenderComponent(_component_AppInputSearch, {
              modelValue: unref(globalFilterChantier),
              "onUpdate:modelValue": ($event) => isRef(globalFilterChantier) ? globalFilterChantier.value = $event : null,
              class: "w-full max-w-md",
              placeholder: "Rechercher un chantier ..."
            }, null, _parent2, _scopeId));
            _push2(`<div class="flex flex-col gap-1.5 overflow-y-auto pr-1 pb-8" style="${ssrRenderStyle({ "max-height": "calc(100vh - 320px)" })}"${_scopeId}><!--[-->`);
            ssrRenderList(unref(filteredItemsLeftNavBar), (item) => {
              _push2(`<div class="${ssrRenderClass([
                unref(selectedChantier) === item.value ? "border-primary-700/30 from-primary-600 to-primary-800 bg-linear-to-br shadow-lg" : "hover:border-primary-700/30 border-gray-200 bg-white hover:shadow-lg",
                "group relative cursor-pointer overflow-hidden rounded-lg border p-3 transition-all duration-200"
              ])}"${_scopeId}><div class="${ssrRenderClass([
                unref(selectedChantier) === item.value ? "bg-white/50" : "bg-primary-600/30 scale-y-0 group-hover:scale-y-100",
                "absolute top-0 left-0 h-full w-1 transition-all duration-200"
              ])}"${_scopeId}></div><div class="flex items-center gap-3"${_scopeId}><div class="${ssrRenderClass([
                unref(selectedChantier) === item.value ? "bg-white/20 text-white" : "bg-primary-700/20 text-primary-800 group-hover:bg-primary-700/30",
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200"
              ])}"${_scopeId}>`);
              _push2(ssrRenderComponent(_component_Icon, {
                name: item.icon || "lucide:folder",
                size: "18"
              }, null, _parent2, _scopeId));
              _push2(`</div><div class="min-w-0 flex-1"${_scopeId}><div class="flex flex-col"${_scopeId}><div class="${ssrRenderClass([unref(selectedChantier) === item.value ? "text-white" : "text-gray-700", "text-sm font-medium transition-colors duration-200"])}"${_scopeId}>${ssrInterpolate(item.compte)}</div><div class="${ssrRenderClass([unref(selectedChantier) === item.value ? "text-white" : "text-gray-700", "truncate text-sm font-medium transition-colors duration-200"])}"${_scopeId}>${ssrInterpolate(item.label)}</div></div></div>`);
              if (item.badge !== void 0) {
                _push2(`<div class="${ssrRenderClass([
                  unref(selectedChantier) === item.value ? "text-primary-600 bg-white" : "bg-primary-700/20 text-primary-800 group-hover:bg-primary-700/30",
                  "flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold transition-all duration-200"
                ])}"${_scopeId}>${ssrInterpolate(item.badge)}</div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div></div>`);
            });
            _push2(`<!--]-->`);
            if (unref(filteredItemsLeftNavBar).length === 0) {
              _push2(`<div class="flex flex-col items-center justify-center py-8 text-gray-400"${_scopeId}>`);
              _push2(ssrRenderComponent(_component_Icon, {
                name: "lucide:search-x",
                size: "32",
                class: "mb-2"
              }, null, _parent2, _scopeId));
              _push2(`<p class="text-sm"${_scopeId}>Aucun chantier trouvé</p></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div>`);
          } else {
            return [
              createVNode("div", { class: "space-y-4" }, [
                createVNode("div", { class: "flex gap-2" }, [
                  (openBlock(true), createBlock(Fragment, null, renderList(unref(itemsRadio), (item) => {
                    return openBlock(), createBlock("div", {
                      key: item.value,
                      onClick: ($event) => selectedMonth.value = item.value,
                      class: [
                        "group flex flex-1 cursor-pointer flex-col items-center justify-between rounded-xl border bg-red-200 p-3 transition-all duration-300 hover:shadow-lg",
                        unref(selectedMonth) === item.value ? "border-slate-600 bg-linear-to-br from-slate-600 to-slate-800 text-white" : "hover:border-primary-700/30 border-gray-200 bg-white hover:shadow-lg"
                      ]
                    }, [
                      createVNode("div", { class: "flex w-full flex-col items-center justify-center" }, [
                        createVNode("div", { class: "text-center text-xl font-bold" }, toDisplayString(item.label.month), 1),
                        createVNode("div", { class: "-mt-2 text-lg font-bold tracking-widest" }, toDisplayString(item.label.year), 1)
                      ]),
                      createVNode("div", {
                        class: [
                          "mt-1 w-full rounded-lg border text-center text-lg font-medium tracking-wide transition-all duration-300",
                          unref(selectedMonth) === item.value ? "bg-primary-200 text-primary-800 border-primary-700 dark:from-primary-900/50 dark:to-primary-800/50" : "bg-primary-200 text-primary-800 border-primary-700/30 group-hover:bg-primary-700/30 group-hover:border-primary-700/40 group-hover:text-primary-900 duration-300 group-hover:shadow-md"
                        ]
                      }, toDisplayString(item.nbTotalTaches), 3)
                    ], 10, ["onClick"]);
                  }), 128))
                ]),
                createVNode(_component_AppInputSearch, {
                  modelValue: unref(globalFilterChantier),
                  "onUpdate:modelValue": ($event) => isRef(globalFilterChantier) ? globalFilterChantier.value = $event : null,
                  class: "w-full max-w-md",
                  placeholder: "Rechercher un chantier ..."
                }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                createVNode("div", {
                  class: "flex flex-col gap-1.5 overflow-y-auto pr-1 pb-8",
                  style: { "max-height": "calc(100vh - 320px)" }
                }, [
                  (openBlock(true), createBlock(Fragment, null, renderList(unref(filteredItemsLeftNavBar), (item) => {
                    return openBlock(), createBlock("div", {
                      key: item.value,
                      onClick: ($event) => selectedChantier.value = item.value,
                      class: [
                        "group relative cursor-pointer overflow-hidden rounded-lg border p-3 transition-all duration-200",
                        unref(selectedChantier) === item.value ? "border-primary-700/30 from-primary-600 to-primary-800 bg-linear-to-br shadow-lg" : "hover:border-primary-700/30 border-gray-200 bg-white hover:shadow-lg"
                      ]
                    }, [
                      createVNode("div", {
                        class: [
                          "absolute top-0 left-0 h-full w-1 transition-all duration-200",
                          unref(selectedChantier) === item.value ? "bg-white/50" : "bg-primary-600/30 scale-y-0 group-hover:scale-y-100"
                        ]
                      }, null, 2),
                      createVNode("div", { class: "flex items-center gap-3" }, [
                        createVNode("div", {
                          class: [
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
                            unref(selectedChantier) === item.value ? "bg-white/20 text-white" : "bg-primary-700/20 text-primary-800 group-hover:bg-primary-700/30"
                          ]
                        }, [
                          createVNode(_component_Icon, {
                            name: item.icon || "lucide:folder",
                            size: "18"
                          }, null, 8, ["name"])
                        ], 2),
                        createVNode("div", { class: "min-w-0 flex-1" }, [
                          createVNode("div", { class: "flex flex-col" }, [
                            createVNode("div", {
                              class: ["text-sm font-medium transition-colors duration-200", unref(selectedChantier) === item.value ? "text-white" : "text-gray-700"]
                            }, toDisplayString(item.compte), 3),
                            createVNode("div", {
                              class: ["truncate text-sm font-medium transition-colors duration-200", unref(selectedChantier) === item.value ? "text-white" : "text-gray-700"]
                            }, toDisplayString(item.label), 3)
                          ])
                        ]),
                        item.badge !== void 0 ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: [
                            "flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold transition-all duration-200",
                            unref(selectedChantier) === item.value ? "text-primary-600 bg-white" : "bg-primary-700/20 text-primary-800 group-hover:bg-primary-700/30"
                          ]
                        }, toDisplayString(item.badge), 3)) : createCommentVNode("", true)
                      ])
                    ], 10, ["onClick"]);
                  }), 128)),
                  unref(filteredItemsLeftNavBar).length === 0 ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "flex flex-col items-center justify-center py-8 text-gray-400"
                  }, [
                    createVNode(_component_Icon, {
                      name: "lucide:search-x",
                      size: "32",
                      class: "mb-2"
                    }),
                    createVNode("p", { class: "text-sm" }, "Aucun chantier trouvé")
                  ])) : createCommentVNode("", true)
                ])
              ])
            ];
          }
        }),
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="space-y-4"${_scopeId}><div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_AppTitleMain, {
              title: "Liste des tâches",
              description: "Toutes les tâches en cours pour le mois sélectionné"
            }, null, _parent2, _scopeId));
            _push2(`</div><div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_AppInputSearch, {
              modelValue: unref(globalFilterTache),
              "onUpdate:modelValue": ($event) => isRef(globalFilterTache) ? globalFilterTache.value = $event : null,
              class: "w-full max-w-md",
              placeholder: "Rechercher une tâche ..."
            }, null, _parent2, _scopeId));
            _push2(`<div class="ml-auto flex items-center gap-2"${_scopeId}>`);
            if (unref(selectedChantier)) {
              _push2(ssrRenderComponent(_component_AppButtonValidated, {
                theme: "",
                type: "button",
                onClick: goToChantier,
                validated: true
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<span class="flex items-center gap-2"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:external-link",
                      size: "18"
                    }, null, _parent3, _scopeId2));
                    _push3(` Voir le chantier </span>`);
                  } else {
                    return [
                      createVNode("span", { class: "flex items-center gap-2" }, [
                        createVNode(_component_Icon, {
                          name: "lucide:external-link",
                          size: "18"
                        }),
                        createTextVNode(" Voir le chantier ")
                      ])
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
            } else {
              _push2(`<!---->`);
            }
            _push2(ssrRenderComponent(_component_AppButtonValidated, {
              theme: "cancel",
              type: "button",
              onClick: printTaches,
              validated: unref(selectedRows).length > 0
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<span class="flex items-center gap-2"${_scopeId2}>`);
                  _push3(ssrRenderComponent(_component_Icon, {
                    name: "lucide:printer",
                    size: "18"
                  }, null, _parent3, _scopeId2));
                  _push3(` Imprimer </span>`);
                  if (unref(selectedRows).length > 0) {
                    _push3(`<div class="absolute top-0 right-0 flex h-6 w-6 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gray-700 text-xs text-white shadow-md"${_scopeId2}>${ssrInterpolate(unref(selectedRows).length)}</div>`);
                  } else {
                    _push3(`<!---->`);
                  }
                } else {
                  return [
                    createVNode("span", { class: "flex items-center gap-2" }, [
                      createVNode(_component_Icon, {
                        name: "lucide:printer",
                        size: "18"
                      }),
                      createTextVNode(" Imprimer ")
                    ]),
                    unref(selectedRows).length > 0 ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "absolute top-0 right-0 flex h-6 w-6 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gray-700 text-xs text-white shadow-md"
                    }, toDisplayString(unref(selectedRows).length), 1)) : createCommentVNode("", true)
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div></div><div class="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-md border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"${_scopeId}><div class="flex-1"${_scopeId}><table class="h-full w-full overflow-auto text-sm"${_scopeId}><thead class="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"${_scopeId}><tr${_scopeId}><th class="pl-2"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_AppCheckbox, {
              "model-value": unref(isAllSelected),
              "onUpdate:modelValue": toggleSelectAll
            }, null, _parent2, _scopeId));
            _push2(`</th><th class="hidden items-center justify-center py-3 font-semibold text-gray-700 lg:flex dark:text-gray-200"${_scopeId}> Compte </th><th class="py-3 pl-2 text-left font-semibold text-gray-700 lg:pl-0 dark:text-gray-200"${_scopeId}>Tâche</th><th class="px-8 py-3 text-center font-semibold text-gray-700 dark:text-gray-200"${_scopeId}>Prévision</th><th${_scopeId}>Status</th><th${_scopeId}>#</th></tr></thead><tbody class="divide-y divide-gray-100 dark:divide-gray-800"${_scopeId}><!--[-->`);
            ssrRenderList(unref(filteredlistTachesSelected), (t) => {
              _push2(`<tr class="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"${_scopeId}><td class="pl-2"${_scopeId}>`);
              _push2(ssrRenderComponent(_component_AppCheckbox, {
                modelValue: unref(selectedRows),
                "onUpdate:modelValue": ($event) => isRef(selectedRows) ? selectedRows.value = $event : null,
                value: t
              }, null, _parent2, _scopeId));
              _push2(`</td><td class="hidden py-4 lg:flex"${_scopeId}>`);
              if (t.categories?.name) {
                _push2(`<div class="w-full px-4"${_scopeId}><div class="border-secondary-900/40 bg-secondary-900/20 text-secondary-900 mx-auto w-full rounded-md border px-2 text-center text-xs italic"${_scopeId}>${ssrInterpolate(t.chantiers.compte)}</div></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</td><td class="pl-2 lg:pl-0"${_scopeId}>${ssrInterpolate(t.taches?.tache)}</td><td class="px-4 py-3"${_scopeId}><div class="flex w-full items-center justify-center whitespace-nowrap"${_scopeId}>${ssrInterpolate(formatDateMonthYear(t.prevision))}</div></td><td class="px-4 py-3"${_scopeId}><div class="flex w-full items-center justify-center gap-2"${_scopeId}>`);
              if (t.important) {
                _push2(ssrRenderComponent(_component_Icon, {
                  name: "lucide:triangle-alert",
                  size: "16",
                  class: "text-yellow-500"
                }, null, _parent2, _scopeId));
              } else {
                _push2(ssrRenderComponent(_component_Icon, {
                  name: "lucide:triangle-alert",
                  size: "16",
                  class: "text-gray-300"
                }, null, _parent2, _scopeId));
              }
              if (t.alerte) {
                _push2(ssrRenderComponent(_component_Icon, {
                  name: "lucide:siren",
                  size: "18",
                  class: "mb-0.5 text-red-500"
                }, null, _parent2, _scopeId));
              } else {
                _push2(ssrRenderComponent(_component_Icon, {
                  name: "lucide:siren",
                  size: "18",
                  class: "mb-0.5 text-gray-300"
                }, null, _parent2, _scopeId));
              }
              _push2(`</div></td><td class="px-4 py-3"${_scopeId}><div class="flex w-full items-center justify-center"${_scopeId}>`);
              if (getRealisationStatus(t)) {
                _push2(`<div class="${ssrRenderClass([
                  getRealisationStatus(t).type === "fait" ? "bg-green-100 text-green-700" : getRealisationStatus(t).type === "en_cours" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700",
                  "flex w-20 items-center justify-center rounded-md px-2 py-1 text-xs whitespace-nowrap"
                ])}"${_scopeId}>${ssrInterpolate(getRealisationStatus(t).label)}</div>`);
              } else {
                _push2(`<span class="text-muted"${_scopeId}>-</span>`);
              }
              _push2(`</div></td></tr>`);
            });
            _push2(`<!--]--></tbody></table></div></div>`);
            _push2(ssrRenderComponent(_component_AppSlideOver, {
              sideModal: unref(open),
              closeSideModal: showSlide
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  if (unref(open)) {
                    _push3(ssrRenderComponent(_component_AppSlideOverContent, { closeSideModal: showSlide }, {
                      header: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`<div class="text-center"${_scopeId3}><div class="bg-primary-500/20 dark:bg-primary-900/30 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"${_scopeId3}>`);
                          _push4(ssrRenderComponent(_component_Icon, {
                            name: "lucide:clipboard-edit",
                            size: "28",
                            class: "text-primary-700"
                          }, null, _parent4, _scopeId3));
                          _push4(`</div><h2 class="text-xl font-semibold text-gray-900 dark:text-white"${_scopeId3}>${ssrInterpolate(unref(selectedTache).chantiers?.name)}</h2><p class="mt-1 text-sm text-gray-500 dark:text-gray-400"${_scopeId3}>${ssrInterpolate(unref(selectedTache).taches?.tache)}</p></div>`);
                        } else {
                          return [
                            createVNode("div", { class: "text-center" }, [
                              createVNode("div", { class: "bg-primary-500/20 dark:bg-primary-900/30 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" }, [
                                createVNode(_component_Icon, {
                                  name: "lucide:clipboard-edit",
                                  size: "28",
                                  class: "text-primary-700"
                                })
                              ]),
                              createVNode("h2", { class: "text-xl font-semibold text-gray-900 dark:text-white" }, toDisplayString(unref(selectedTache).chantiers?.name), 1),
                              createVNode("p", { class: "mt-1 text-sm text-gray-500 dark:text-gray-400" }, toDisplayString(unref(selectedTache).taches?.tache), 1)
                            ])
                          ];
                        }
                      }),
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`<div class="flex flex-col gap-6"${_scopeId3}><div class="flex items-center border-b py-2 text-left text-base font-medium uppercase"${_scopeId3}> Informations </div><div class="flex items-center justify-between gap-2"${_scopeId3}>`);
                          _push4(ssrRenderComponent(_component_AppSwitch, {
                            modelValue: unref(important),
                            "onUpdate:modelValue": ($event) => isRef(important) ? important.value = $event : null,
                            label: "Important",
                            class: "full"
                          }, null, _parent4, _scopeId3));
                          _push4(ssrRenderComponent(_component_AppSwitch, {
                            modelValue: unref(alerte),
                            "onUpdate:modelValue": ($event) => isRef(alerte) ? alerte.value = $event : null,
                            label: "Alerte",
                            class: "full"
                          }, null, _parent4, _scopeId3));
                          _push4(`</div><div class="flex items-center border-b py-2 text-left text-base font-medium uppercase"${_scopeId3}> Commentaires </div><div class="flex flex-col gap-1.5"${_scopeId3}><textarea rows="4" class="focus:ring-primary-500 w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-transparent focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white" placeholder="Ajoutez un commentaire..."${_scopeId3}>${ssrInterpolate(unref(commentaire))}</textarea></div>`);
                          _push4(ssrRenderComponent(_component_AppDatePicker, {
                            modelValue: unref(dateCloture),
                            "onUpdate:modelValue": ($event) => isRef(dateCloture) ? dateCloture.value = $event : null,
                            title: "Date de clôture",
                            placeholder: "Sélectionnez une date",
                            clearable: ""
                          }, null, _parent4, _scopeId3));
                          _push4(`</div>`);
                        } else {
                          return [
                            createVNode("div", { class: "flex flex-col gap-6" }, [
                              createVNode("div", { class: "flex items-center border-b py-2 text-left text-base font-medium uppercase" }, " Informations "),
                              createVNode("div", { class: "flex items-center justify-between gap-2" }, [
                                createVNode(_component_AppSwitch, {
                                  modelValue: unref(important),
                                  "onUpdate:modelValue": ($event) => isRef(important) ? important.value = $event : null,
                                  label: "Important",
                                  class: "full"
                                }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                                createVNode(_component_AppSwitch, {
                                  modelValue: unref(alerte),
                                  "onUpdate:modelValue": ($event) => isRef(alerte) ? alerte.value = $event : null,
                                  label: "Alerte",
                                  class: "full"
                                }, null, 8, ["modelValue", "onUpdate:modelValue"])
                              ]),
                              createVNode("div", { class: "flex items-center border-b py-2 text-left text-base font-medium uppercase" }, " Commentaires "),
                              createVNode("div", { class: "flex flex-col gap-1.5" }, [
                                withDirectives(createVNode("textarea", {
                                  "onUpdate:modelValue": ($event) => isRef(commentaire) ? commentaire.value = $event : null,
                                  rows: "4",
                                  class: "focus:ring-primary-500 w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-transparent focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white",
                                  placeholder: "Ajoutez un commentaire..."
                                }, null, 8, ["onUpdate:modelValue"]), [
                                  [vModelText, unref(commentaire)]
                                ])
                              ]),
                              createVNode(_component_AppDatePicker, {
                                modelValue: unref(dateCloture),
                                "onUpdate:modelValue": ($event) => isRef(dateCloture) ? dateCloture.value = $event : null,
                                title: "Date de clôture",
                                placeholder: "Sélectionnez une date",
                                clearable: ""
                              }, null, 8, ["modelValue", "onUpdate:modelValue"])
                            ])
                          ];
                        }
                      }),
                      footer: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`<div class="flex flex-col items-center justify-end gap-2 lg:flex-row"${_scopeId3}>`);
                          _push4(ssrRenderComponent(_component_AppButtonValidated, {
                            type: "button",
                            theme: "primary",
                            validated: !!unref(dateCloture),
                            onClick: ($event) => cloturerTache(),
                            class: "w-full lg:w-auto"
                          }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(`<span class="flex items-center gap-2"${_scopeId4}>`);
                                _push5(ssrRenderComponent(_component_Icon, {
                                  name: "lucide:infinity",
                                  size: "16"
                                }, null, _parent5, _scopeId4));
                                _push5(` Clôturer </span>`);
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
                          }, _parent4, _scopeId3));
                          _push4(ssrRenderComponent(_component_AppButtonValidated, {
                            type: "button",
                            theme: "delete",
                            onClick: ($event) => nonConcerne(),
                            class: "w-full lg:w-auto"
                          }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(`<span class="flex items-center gap-2"${_scopeId4}>`);
                                _push5(ssrRenderComponent(_component_Icon, {
                                  name: "lucide:x",
                                  size: "16"
                                }, null, _parent5, _scopeId4));
                                _push5(` Non concerné </span>`);
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
                          }, _parent4, _scopeId3));
                          _push4(ssrRenderComponent(_component_AppButtonValidated, {
                            type: "button",
                            theme: "cancel",
                            onClick: ($event) => enregistrer(),
                            class: "w-full lg:w-auto"
                          }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(`<span class="flex items-center gap-2"${_scopeId4}>`);
                                _push5(ssrRenderComponent(_component_Icon, {
                                  name: "lucide:save",
                                  size: "16"
                                }, null, _parent5, _scopeId4));
                                _push5(` Enregistrer </span>`);
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
                          }, _parent4, _scopeId3));
                          _push4(`</div>`);
                        } else {
                          return [
                            createVNode("div", { class: "flex flex-col items-center justify-end gap-2 lg:flex-row" }, [
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
                            ])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                  } else {
                    _push3(`<!---->`);
                  }
                } else {
                  return [
                    unref(open) ? (openBlock(), createBlock(_component_AppSlideOverContent, {
                      key: 0,
                      closeSideModal: showSlide
                    }, {
                      header: withCtx(() => [
                        createVNode("div", { class: "text-center" }, [
                          createVNode("div", { class: "bg-primary-500/20 dark:bg-primary-900/30 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" }, [
                            createVNode(_component_Icon, {
                              name: "lucide:clipboard-edit",
                              size: "28",
                              class: "text-primary-700"
                            })
                          ]),
                          createVNode("h2", { class: "text-xl font-semibold text-gray-900 dark:text-white" }, toDisplayString(unref(selectedTache).chantiers?.name), 1),
                          createVNode("p", { class: "mt-1 text-sm text-gray-500 dark:text-gray-400" }, toDisplayString(unref(selectedTache).taches?.tache), 1)
                        ])
                      ]),
                      default: withCtx(() => [
                        createVNode("div", { class: "flex flex-col gap-6" }, [
                          createVNode("div", { class: "flex items-center border-b py-2 text-left text-base font-medium uppercase" }, " Informations "),
                          createVNode("div", { class: "flex items-center justify-between gap-2" }, [
                            createVNode(_component_AppSwitch, {
                              modelValue: unref(important),
                              "onUpdate:modelValue": ($event) => isRef(important) ? important.value = $event : null,
                              label: "Important",
                              class: "full"
                            }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                            createVNode(_component_AppSwitch, {
                              modelValue: unref(alerte),
                              "onUpdate:modelValue": ($event) => isRef(alerte) ? alerte.value = $event : null,
                              label: "Alerte",
                              class: "full"
                            }, null, 8, ["modelValue", "onUpdate:modelValue"])
                          ]),
                          createVNode("div", { class: "flex items-center border-b py-2 text-left text-base font-medium uppercase" }, " Commentaires "),
                          createVNode("div", { class: "flex flex-col gap-1.5" }, [
                            withDirectives(createVNode("textarea", {
                              "onUpdate:modelValue": ($event) => isRef(commentaire) ? commentaire.value = $event : null,
                              rows: "4",
                              class: "focus:ring-primary-500 w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-transparent focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white",
                              placeholder: "Ajoutez un commentaire..."
                            }, null, 8, ["onUpdate:modelValue"]), [
                              [vModelText, unref(commentaire)]
                            ])
                          ]),
                          createVNode(_component_AppDatePicker, {
                            modelValue: unref(dateCloture),
                            "onUpdate:modelValue": ($event) => isRef(dateCloture) ? dateCloture.value = $event : null,
                            title: "Date de clôture",
                            placeholder: "Sélectionnez une date",
                            clearable: ""
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ])
                      ]),
                      footer: withCtx(() => [
                        createVNode("div", { class: "flex flex-col items-center justify-end gap-2 lg:flex-row" }, [
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
                        ])
                      ]),
                      _: 1
                    })) : createCommentVNode("", true)
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", { class: "space-y-4" }, [
                createVNode("div", { class: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between" }, [
                  createVNode(_component_AppTitleMain, {
                    title: "Liste des tâches",
                    description: "Toutes les tâches en cours pour le mois sélectionné"
                  })
                ]),
                createVNode("div", { class: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between" }, [
                  createVNode(_component_AppInputSearch, {
                    modelValue: unref(globalFilterTache),
                    "onUpdate:modelValue": ($event) => isRef(globalFilterTache) ? globalFilterTache.value = $event : null,
                    class: "w-full max-w-md",
                    placeholder: "Rechercher une tâche ..."
                  }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                  createVNode("div", { class: "ml-auto flex items-center gap-2" }, [
                    unref(selectedChantier) ? (openBlock(), createBlock(_component_AppButtonValidated, {
                      key: 0,
                      theme: "",
                      type: "button",
                      onClick: goToChantier,
                      validated: true
                    }, {
                      default: withCtx(() => [
                        createVNode("span", { class: "flex items-center gap-2" }, [
                          createVNode(_component_Icon, {
                            name: "lucide:external-link",
                            size: "18"
                          }),
                          createTextVNode(" Voir le chantier ")
                        ])
                      ]),
                      _: 1
                    })) : createCommentVNode("", true),
                    createVNode(_component_AppButtonValidated, {
                      theme: "cancel",
                      type: "button",
                      onClick: printTaches,
                      validated: unref(selectedRows).length > 0
                    }, {
                      default: withCtx(() => [
                        createVNode("span", { class: "flex items-center gap-2" }, [
                          createVNode(_component_Icon, {
                            name: "lucide:printer",
                            size: "18"
                          }),
                          createTextVNode(" Imprimer ")
                        ]),
                        unref(selectedRows).length > 0 ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "absolute top-0 right-0 flex h-6 w-6 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gray-700 text-xs text-white shadow-md"
                        }, toDisplayString(unref(selectedRows).length), 1)) : createCommentVNode("", true)
                      ]),
                      _: 1
                    }, 8, ["validated"])
                  ])
                ]),
                createVNode("div", { class: "flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-md border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900" }, [
                  createVNode("div", { class: "flex-1" }, [
                    createVNode("table", { class: "h-full w-full overflow-auto text-sm" }, [
                      createVNode("thead", { class: "sticky top-0 z-10 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800" }, [
                        createVNode("tr", null, [
                          createVNode("th", { class: "pl-2" }, [
                            createVNode(_component_AppCheckbox, {
                              "model-value": unref(isAllSelected),
                              "onUpdate:modelValue": toggleSelectAll
                            }, null, 8, ["model-value"])
                          ]),
                          createVNode("th", { class: "hidden items-center justify-center py-3 font-semibold text-gray-700 lg:flex dark:text-gray-200" }, " Compte "),
                          createVNode("th", { class: "py-3 pl-2 text-left font-semibold text-gray-700 lg:pl-0 dark:text-gray-200" }, "Tâche"),
                          createVNode("th", { class: "px-8 py-3 text-center font-semibold text-gray-700 dark:text-gray-200" }, "Prévision"),
                          createVNode("th", null, "Status"),
                          createVNode("th", null, "#")
                        ])
                      ]),
                      createVNode("tbody", { class: "divide-y divide-gray-100 dark:divide-gray-800" }, [
                        (openBlock(true), createBlock(Fragment, null, renderList(unref(filteredlistTachesSelected), (t) => {
                          return openBlock(), createBlock("tr", {
                            key: t.id,
                            class: "cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50",
                            onClick: ($event) => showSlide(t)
                          }, [
                            createVNode("td", {
                              class: "pl-2",
                              onClick: withModifiers(() => {
                              }, ["stop"])
                            }, [
                              createVNode(_component_AppCheckbox, {
                                modelValue: unref(selectedRows),
                                "onUpdate:modelValue": ($event) => isRef(selectedRows) ? selectedRows.value = $event : null,
                                value: t
                              }, null, 8, ["modelValue", "onUpdate:modelValue", "value"])
                            ], 8, ["onClick"]),
                            createVNode("td", { class: "hidden py-4 lg:flex" }, [
                              t.categories?.name ? (openBlock(), createBlock("div", {
                                key: 0,
                                class: "w-full px-4"
                              }, [
                                createVNode("div", { class: "border-secondary-900/40 bg-secondary-900/20 text-secondary-900 mx-auto w-full rounded-md border px-2 text-center text-xs italic" }, toDisplayString(t.chantiers.compte), 1)
                              ])) : createCommentVNode("", true)
                            ]),
                            createVNode("td", { class: "pl-2 lg:pl-0" }, toDisplayString(t.taches?.tache), 1),
                            createVNode("td", { class: "px-4 py-3" }, [
                              createVNode("div", { class: "flex w-full items-center justify-center whitespace-nowrap" }, toDisplayString(formatDateMonthYear(t.prevision)), 1)
                            ]),
                            createVNode("td", { class: "px-4 py-3" }, [
                              createVNode("div", { class: "flex w-full items-center justify-center gap-2" }, [
                                t.important ? (openBlock(), createBlock(_component_Icon, {
                                  key: 0,
                                  name: "lucide:triangle-alert",
                                  size: "16",
                                  class: "text-yellow-500"
                                })) : (openBlock(), createBlock(_component_Icon, {
                                  key: 1,
                                  name: "lucide:triangle-alert",
                                  size: "16",
                                  class: "text-gray-300"
                                })),
                                t.alerte ? (openBlock(), createBlock(_component_Icon, {
                                  key: 2,
                                  name: "lucide:siren",
                                  size: "18",
                                  class: "mb-0.5 text-red-500"
                                })) : (openBlock(), createBlock(_component_Icon, {
                                  key: 3,
                                  name: "lucide:siren",
                                  size: "18",
                                  class: "mb-0.5 text-gray-300"
                                }))
                              ])
                            ]),
                            createVNode("td", { class: "px-4 py-3" }, [
                              createVNode("div", { class: "flex w-full items-center justify-center" }, [
                                getRealisationStatus(t) ? (openBlock(), createBlock("div", {
                                  key: 0,
                                  class: [
                                    "flex w-20 items-center justify-center rounded-md px-2 py-1 text-xs whitespace-nowrap",
                                    getRealisationStatus(t).type === "fait" ? "bg-green-100 text-green-700" : getRealisationStatus(t).type === "en_cours" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                                  ]
                                }, toDisplayString(getRealisationStatus(t).label), 3)) : (openBlock(), createBlock("span", {
                                  key: 1,
                                  class: "text-muted"
                                }, "-"))
                              ])
                            ])
                          ], 8, ["onClick"]);
                        }), 128))
                      ])
                    ])
                  ])
                ]),
                createVNode(_component_AppSlideOver, {
                  sideModal: unref(open),
                  closeSideModal: showSlide
                }, {
                  default: withCtx(() => [
                    unref(open) ? (openBlock(), createBlock(_component_AppSlideOverContent, {
                      key: 0,
                      closeSideModal: showSlide
                    }, {
                      header: withCtx(() => [
                        createVNode("div", { class: "text-center" }, [
                          createVNode("div", { class: "bg-primary-500/20 dark:bg-primary-900/30 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" }, [
                            createVNode(_component_Icon, {
                              name: "lucide:clipboard-edit",
                              size: "28",
                              class: "text-primary-700"
                            })
                          ]),
                          createVNode("h2", { class: "text-xl font-semibold text-gray-900 dark:text-white" }, toDisplayString(unref(selectedTache).chantiers?.name), 1),
                          createVNode("p", { class: "mt-1 text-sm text-gray-500 dark:text-gray-400" }, toDisplayString(unref(selectedTache).taches?.tache), 1)
                        ])
                      ]),
                      default: withCtx(() => [
                        createVNode("div", { class: "flex flex-col gap-6" }, [
                          createVNode("div", { class: "flex items-center border-b py-2 text-left text-base font-medium uppercase" }, " Informations "),
                          createVNode("div", { class: "flex items-center justify-between gap-2" }, [
                            createVNode(_component_AppSwitch, {
                              modelValue: unref(important),
                              "onUpdate:modelValue": ($event) => isRef(important) ? important.value = $event : null,
                              label: "Important",
                              class: "full"
                            }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                            createVNode(_component_AppSwitch, {
                              modelValue: unref(alerte),
                              "onUpdate:modelValue": ($event) => isRef(alerte) ? alerte.value = $event : null,
                              label: "Alerte",
                              class: "full"
                            }, null, 8, ["modelValue", "onUpdate:modelValue"])
                          ]),
                          createVNode("div", { class: "flex items-center border-b py-2 text-left text-base font-medium uppercase" }, " Commentaires "),
                          createVNode("div", { class: "flex flex-col gap-1.5" }, [
                            withDirectives(createVNode("textarea", {
                              "onUpdate:modelValue": ($event) => isRef(commentaire) ? commentaire.value = $event : null,
                              rows: "4",
                              class: "focus:ring-primary-500 w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-transparent focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white",
                              placeholder: "Ajoutez un commentaire..."
                            }, null, 8, ["onUpdate:modelValue"]), [
                              [vModelText, unref(commentaire)]
                            ])
                          ]),
                          createVNode(_component_AppDatePicker, {
                            modelValue: unref(dateCloture),
                            "onUpdate:modelValue": ($event) => isRef(dateCloture) ? dateCloture.value = $event : null,
                            title: "Date de clôture",
                            placeholder: "Sélectionnez une date",
                            clearable: ""
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ])
                      ]),
                      footer: withCtx(() => [
                        createVNode("div", { class: "flex flex-col items-center justify-end gap-2 lg:flex-row" }, [
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
                        ])
                      ]),
                      _: 1
                    })) : createCommentVNode("", true)
                  ]),
                  _: 1
                }, 8, ["sideModal"])
              ])
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-CXUaP4gI.mjs.map
