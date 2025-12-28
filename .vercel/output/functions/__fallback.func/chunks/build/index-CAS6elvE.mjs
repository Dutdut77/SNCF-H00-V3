import { _ as _sfc_main$1 } from './titleMain-BKNYl-Iw.mjs';
import { _ as __nuxt_component_1 } from './inputSearch-Xv57A_RG.mjs';
import { j as _export_sfc, u as useHead, h as useUsers, b as useLoader, a as useToast, g as useState, _ as _sfc_main$2, d as __nuxt_component_1$1 } from './server.mjs';
import { _ as _sfc_main$3 } from './select-CBkAiapS.mjs';
import { _ as _sfc_main$4, a as __nuxt_component_6, b as _sfc_main$5 } from './form-Dpzxh_Wd.mjs';
import { computed, ref, mergeProps, unref, isRef, withCtx, createVNode, createTextVNode, createBlock, createCommentVNode, openBlock, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList, ssrRenderClass, ssrInterpolate } from 'vue/server-renderer';
import { u as useChantiers } from './useChantiers-C2XRmo5v.mjs';
import { u as useContacts } from './useContacts-BdCjpTgN.mjs';
import { u as useTaches } from './useTaches-FqFKMoCT.mjs';
import { u as useH00 } from './useH00-CD0fct_m.mjs';
import { u as useTimeline } from './useTimeline-BdoQfffy.mjs';
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
import './modal-DW8NcVL0.mjs';
import './selectMultiple-BvatzygK.mjs';

const _sfc_main = {
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({
      title: "H00 - Chantiers",
      description: "Liste des chantiers H00"
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
    const { getAllContactsTravaux, upsertContactsTravaux } = useContacts();
    const { setLoader } = useLoader();
    const { taches } = useTaches();
    const { createH00Entries, recalculateH00Previsions } = useH00();
    const { addToast } = useToast();
    const { addWeekend, getAllWeekends, replaceWeekendsForChantier } = useTimeline();
    const { isAdmin, isSuperAdmin } = useLevelUser();
    const canEdit = computed(() => isAdmin.value || isSuperAdmin.value);
    const allChantiers = useState("allChantiers");
    const searchQuery = ref("");
    const selectedEtat = ref("all");
    const sortBy = ref("date_desc");
    const etatOptions = [
      { id: "all", label: "Tous les chantiers", icon: "lucide:layers", color: "bg-gray-100 text-gray-700 border-gray-300" },
      { id: "rlt", label: "RLT", icon: "lucide:zap", color: "bg-sky-100 text-sky-700 border-sky-300" },
      { id: "preop", label: "Pré-op", icon: "lucide:clipboard-check", color: "bg-lime-100 text-lime-700 border-lime-300" },
      {
        id: "externe",
        label: "Externe",
        icon: "lucide:external-link",
        color: "bg-purple-100 text-purple-700 border-purple-300"
      },
      {
        id: "termine",
        label: "Terminé",
        icon: "lucide:check-circle",
        color: "bg-slate-100 text-slate-700 border-slate-300"
      }
    ];
    const sortOptions = [
      { id: "date_desc", label: "Date (récent → ancien)" },
      { id: "date_asc", label: "Date (ancien → récent)" },
      { id: "name_asc", label: "Nom (A → Z)" },
      { id: "name_desc", label: "Nom (Z → A)" },
      { id: "compte_asc", label: "Compte (A → Z)" },
      { id: "compte_desc", label: "Compte (Z → A)" }
    ];
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
    const getEtatInfo = (etat) => {
      switch (etat) {
        case 0:
          return {
            label: "RLT",
            color: "bg-sky-500",
            textColor: "text-sky-700",
            bgLight: "bg-sky-100",
            border: "border-sky-500"
          };
        case 1:
          return {
            label: "Externe",
            color: "bg-purple-500",
            textColor: "text-purple-700",
            bgLight: "bg-purple-100",
            border: "border-purple-500"
          };
        case 2:
          return {
            label: "Pré-op",
            color: "bg-lime-500",
            textColor: "text-lime-700",
            bgLight: "bg-lime-100",
            border: "border-lime-500"
          };
        case -1:
          return {
            label: "Terminé",
            color: "bg-slate-500",
            textColor: "text-slate-700",
            bgLight: "bg-slate-100",
            border: "border-slate-500"
          };
        default:
          return {
            label: "Inconnu",
            color: "bg-gray-500",
            textColor: "text-gray-700",
            bgLight: "bg-gray-100",
            border: "border-gray-500"
          };
      }
    };
    const formatDate = (dateString) => {
      if (!dateString) return "-";
      const date = new Date(dateString);
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    };
    const getFirstReaDate = (chantier) => {
      if (!chantier.date_rea || chantier.date_rea.length === 0) return null;
      const dates = chantier.date_rea.map((r) => r.date_start_travaux).filter((d) => d).sort((a, b) => new Date(a) - new Date(b));
      return dates.length > 0 ? dates[0] : null;
    };
    const getLastReaDate = (chantier) => {
      if (!chantier.date_rea || chantier.date_rea.length === 0) return null;
      const dates = chantier.date_rea.map((r) => r.date_end_travaux || r.date_start_travaux).filter((d) => d).sort((a, b) => new Date(b) - new Date(a));
      return dates.length > 0 ? dates[0] : null;
    };
    const filteredChantiers = computed(() => {
      if (!allChantiers.value || !Array.isArray(allChantiers.value)) return [];
      const search = searchQuery.value.toLowerCase().trim();
      let result = allChantiers.value.filter((chantier) => {
        if (search) {
          const matchCompte = chantier.compte?.toLowerCase().includes(search);
          const matchName = chantier.name?.toLowerCase().includes(search);
          const matchLigne = chantier.ligne?.toLowerCase().includes(search);
          if (!matchCompte && !matchName && !matchLigne) return false;
        }
        if (selectedEtat.value !== "all") {
          switch (selectedEtat.value) {
            case "rlt":
              if (chantier.etat !== 0) return false;
              break;
            case "preop":
              if (chantier.etat !== 2) return false;
              break;
            case "externe":
              if (chantier.etat !== 1) return false;
              break;
            case "termine":
              if (chantier.etat !== -1) return false;
              break;
          }
        }
        return true;
      });
      result.sort((a, b) => {
        switch (sortBy.value) {
          case "date_desc":
            return new Date(getFirstReaDate(b) || 0) - new Date(getFirstReaDate(a) || 0);
          case "date_asc":
            return new Date(getFirstReaDate(a) || 0) - new Date(getFirstReaDate(b) || 0);
          case "name_asc":
            return (a.name || "").localeCompare(b.name || "");
          case "name_desc":
            return (b.name || "").localeCompare(a.name || "");
          case "compte_asc":
            return (a.compte || "").localeCompare(b.compte || "");
          case "compte_desc":
            return (b.compte || "").localeCompare(a.compte || "");
          default:
            return 0;
        }
      });
      return result;
    });
    const countByEtat = computed(() => {
      if (!allChantiers.value || !Array.isArray(allChantiers.value)) {
        return { all: 0, rlt: 0, preop: 0, externe: 0, termine: 0 };
      }
      return {
        all: allChantiers.value.length,
        rlt: allChantiers.value.filter((c) => c.etat === 0).length,
        preop: allChantiers.value.filter((c) => c.etat === 2).length,
        externe: allChantiers.value.filter((c) => c.etat === 1).length,
        termine: allChantiers.value.filter((c) => c.etat === -1).length
      };
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
      const _component_AppTitleMain = _sfc_main$1;
      const _component_AppInputSearch = __nuxt_component_1;
      const _component_AppButtonValidated = _sfc_main$2;
      const _component_Icon = __nuxt_component_1$1;
      const _component_AppSelect = _sfc_main$3;
      const _component_AppDrawer = _sfc_main$4;
      const _component_AppDrawerContent = __nuxt_component_6;
      const _component_ChantierForm = _sfc_main$5;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex h-full w-full flex-col gap-4 overflow-hidden p-4 lg:px-4 lg:py-0 lg:pt-4" }, _attrs))} data-v-76b6caff><div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" data-v-76b6caff>`);
      _push(ssrRenderComponent(_component_AppTitleMain, {
        title: "Liste des chantiers",
        description: "Gestion et suivi de tous les chantiers"
      }, null, _parent));
      _push(`</div><div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between" data-v-76b6caff><div class="flex-1" data-v-76b6caff>`);
      _push(ssrRenderComponent(_component_AppInputSearch, {
        modelValue: unref(searchQuery),
        "onUpdate:modelValue": ($event) => isRef(searchQuery) ? searchQuery.value = $event : null,
        class: "h-fit w-full max-w-sm",
        placeholder: "Rechercher un chantier ..."
      }, null, _parent));
      _push(`</div><div class="flex items-center gap-2" data-v-76b6caff>`);
      if (unref(canEdit)) {
        _push(ssrRenderComponent(_component_AppButtonValidated, {
          theme: "primary",
          type: "button",
          onClick: openCreateDrawer,
          class: "h-fit flex-none"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<span class="flex flex-none items-center gap-2 text-sm" data-v-76b6caff${_scopeId}>`);
              _push2(ssrRenderComponent(_component_Icon, {
                name: "lucide:plus",
                size: "18"
              }, null, _parent2, _scopeId));
              _push2(` Nouveau chantier </span>`);
            } else {
              return [
                createVNode("span", { class: "flex flex-none items-center gap-2 text-sm" }, [
                  createVNode(_component_Icon, {
                    name: "lucide:plus",
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
      _push(`</div></div><div class="flex flex-wrap items-center gap-2" data-v-76b6caff><!--[-->`);
      ssrRenderList(etatOptions, (option) => {
        _push(`<button class="${ssrRenderClass([
          unref(selectedEtat) === option.id ? option.color + " border-2 shadow-sm" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400",
          "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-200"
        ])}" data-v-76b6caff>`);
        _push(ssrRenderComponent(_component_Icon, {
          name: option.icon,
          size: "16"
        }, null, _parent));
        _push(` ${ssrInterpolate(option.label)} <span class="${ssrRenderClass([unref(selectedEtat) === option.id ? "bg-white/30" : "bg-gray-100 dark:bg-gray-700", "ml-1 rounded-full px-1.5 text-xs font-bold"])}" data-v-76b6caff>${ssrInterpolate(unref(countByEtat)[option.id])}</span></button>`);
      });
      _push(`<!--]--><div class="w-48 flex-none" data-v-76b6caff>`);
      _push(ssrRenderComponent(_component_AppSelect, {
        modelValue: unref(sortBy),
        "onUpdate:modelValue": ($event) => isRef(sortBy) ? sortBy.value = $event : null,
        options: sortOptions
      }, null, _parent));
      _push(`</div></div><div class="flex-1 overflow-auto rounded-lg" data-v-76b6caff>`);
      if (unref(filteredChantiers).length > 0) {
        _push(`<div class="grid grid-cols-1 gap-4 py-4 md:grid-cols-2 lg:grid-cols-3 lg:px-4 xl:grid-cols-5" data-v-76b6caff><!--[-->`);
        ssrRenderList(unref(filteredChantiers), (chantier) => {
          _push(`<div class="group hover:border-primary-200 hover:shadow-primary-200/40 relative cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg lg:hover:scale-105 dark:border-gray-700 dark:bg-gray-800" data-v-76b6caff><div class="flex h-full flex-col p-4" data-v-76b6caff><div class="mb-3 flex items-start justify-between" data-v-76b6caff><div class="flex items-center gap-2" data-v-76b6caff><span class="rounded-md bg-gray-100 px-2 py-1 font-mono text-sm font-bold text-gray-700 dark:bg-gray-700 dark:text-gray-300" data-v-76b6caff>${ssrInterpolate(chantier.compte)}</span></div><span class="${ssrRenderClass([getEtatInfo(chantier.etat).bgLight + " " + getEtatInfo(chantier.etat).textColor, "rounded-full px-2.5 py-0.5 text-xs font-semibold"])}" data-v-76b6caff>${ssrInterpolate(getEtatInfo(chantier.etat).label)}</span></div><h3 class="mb-3 line-clamp-2 text-lg font-semibold text-gray-900 dark:text-white" data-v-76b6caff>${ssrInterpolate(chantier.name)}</h3>`);
          if (getFirstReaDate(chantier)) {
            _push(`<div class="mb-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400" data-v-76b6caff>`);
            _push(ssrRenderComponent(_component_Icon, {
              name: "lucide:calendar",
              size: "16",
              class: "text-gray-400"
            }, null, _parent));
            _push(`<span data-v-76b6caff>${ssrInterpolate(formatDate(getFirstReaDate(chantier)))}</span>`);
            if (getLastReaDate(chantier) && getLastReaDate(chantier) !== getFirstReaDate(chantier)) {
              _push(`<!--[-->`);
              _push(ssrRenderComponent(_component_Icon, {
                name: "lucide:arrow-right",
                size: "14",
                class: "text-gray-400"
              }, null, _parent));
              _push(`<span data-v-76b6caff>${ssrInterpolate(formatDate(getLastReaDate(chantier)))}</span><!--]-->`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          } else {
            _push(`<div class="mb-3 flex items-center gap-2 text-sm text-gray-400 italic" data-v-76b6caff>`);
            _push(ssrRenderComponent(_component_Icon, {
              name: "lucide:calendar-x",
              size: "16"
            }, null, _parent));
            _push(`<span data-v-76b6caff>Aucune date de réalisation</span></div>`);
          }
          _push(`<div class="mb-3 flex flex-wrap gap-2" data-v-76b6caff>`);
          if (chantier.date_prepa?.length > 0) {
            _push(`<div class="flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" data-v-76b6caff>`);
            _push(ssrRenderComponent(_component_Icon, {
              name: "lucide:clock",
              size: "12"
            }, null, _parent));
            _push(` ${ssrInterpolate(chantier.date_prepa.length)} prépa. </div>`);
          } else {
            _push(`<!---->`);
          }
          if (chantier.date_rea?.length > 0) {
            _push(`<div class="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" data-v-76b6caff>`);
            _push(ssrRenderComponent(_component_Icon, {
              name: "lucide:hard-hat",
              size: "12"
            }, null, _parent));
            _push(` ${ssrInterpolate(chantier.date_rea.length)} réa. </div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><div class="mt-auto flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-700" data-v-76b6caff><button class="flex cursor-pointer items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-slate-700" data-v-76b6caff>`);
          _push(ssrRenderComponent(_component_Icon, {
            name: "lucide:eye",
            size: "16"
          }, null, _parent));
          _push(` Voir détails </button>`);
          if (unref(canEdit)) {
            _push(`<button class="flex items-center gap-1 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" data-v-76b6caff>`);
            _push(ssrRenderComponent(_component_Icon, {
              name: "lucide:pencil",
              size: "16"
            }, null, _parent));
            _push(` Modifier </button>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div></div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<div class="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 dark:border-gray-700 dark:bg-gray-800/50" data-v-76b6caff>`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:folder-open",
          size: "48",
          class: "mb-4 text-gray-300 dark:text-gray-600"
        }, null, _parent));
        _push(`<p class="mb-2 text-lg font-medium text-gray-500 dark:text-gray-400" data-v-76b6caff>Aucun chantier trouvé</p><p class="mb-4 text-sm text-gray-400 dark:text-gray-500" data-v-76b6caff>${ssrInterpolate(unref(searchQuery) ? "Essayez de modifier votre recherche" : "Commencez par créer un nouveau chantier")}</p>`);
        if (unref(canEdit) && !unref(searchQuery)) {
          _push(ssrRenderComponent(_component_AppButtonValidated, {
            theme: "primary",
            type: "button",
            onClick: openCreateDrawer
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<span class="flex items-center gap-2 text-sm" data-v-76b6caff${_scopeId}>`);
                _push2(ssrRenderComponent(_component_Icon, {
                  name: "lucide:plus",
                  size: "18"
                }, null, _parent2, _scopeId));
                _push2(` Créer un chantier </span>`);
              } else {
                return [
                  createVNode("span", { class: "flex items-center gap-2 text-sm" }, [
                    createVNode(_component_Icon, {
                      name: "lucide:plus",
                      size: "18"
                    }),
                    createTextVNode(" Créer un chantier ")
                  ])
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      }
      _push(`</div>`);
      _push(ssrRenderComponent(_component_AppDrawer, {
        "drawer-open": unref(drawerOpen),
        "close-drawer": toggleDrawer,
        "height-class": "h-[90vh] md:h-[70vh]"
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/chantiers/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-76b6caff"]]);

export { index as default };
//# sourceMappingURL=index-CAS6elvE.mjs.map
