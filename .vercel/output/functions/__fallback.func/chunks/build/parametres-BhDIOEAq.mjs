import { _ as __nuxt_component_0, a as _sfc_main$a } from './switch-Du8wHBlL.mjs';
import { _ as _sfc_main$6 } from './leftNavBar-DmsDXGQs.mjs';
import { _ as _sfc_main$7 } from './titleMain-BKNYl-Iw.mjs';
import { _ as __nuxt_component_1 } from './inputSearch-Xv57A_RG.mjs';
import { u as useHead, h as useUsers, b as useLoader, _ as _sfc_main$2$1, d as __nuxt_component_1$1, f as useSupabaseClient, a as useToast, g as useState } from './server.mjs';
import { _ as _sfc_main$1$1, a as _sfc_main$8 } from './slideOverContent-DhkvxfVz.mjs';
import { _ as _sfc_main$9 } from './select-CBkAiapS.mjs';
import { _ as _sfc_main$1$2, a as _sfc_main$c } from './modal-DW8NcVL0.mjs';
import { _ as _sfc_main$b } from './checkbox-BtivfJtA.mjs';
import { computed, ref, watch, withCtx, unref, createBlock, createCommentVNode, openBlock, createVNode, isRef, withAsyncContext, mergeProps, createTextVNode, toDisplayString, withModifiers, withDirectives, vModelText, Fragment, renderList, useSSRContext } from 'vue';
import { ssrRenderComponent, ssrRenderAttrs, ssrRenderList, ssrInterpolate, ssrRenderClass } from 'vue/server-renderer';
import { u as useTaches } from './useTaches-FqFKMoCT.mjs';
import { u as useChantiers } from './useChantiers-C2XRmo5v.mjs';
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

const _sfc_main$5 = {
  __name: "ParametresTachesPrint",
  __ssrInlineRender: true,
  props: {
    taches: {
      type: Array,
      required: true
    },
    profils: {
      type: Array,
      default: () => []
    }
  },
  setup(__props, { expose: __expose }) {
    const props = __props;
    const formatDelais = (delais) => {
      if (delais === null || delais === void 0) return "—";
      const absDelais = Math.abs(delais);
      const prefix = delais < 0 ? "J+" : "J-";
      return `${prefix}${absDelais}`;
    };
    const printTaches = () => {
      const printWindow = (void 0).open("", "_blank");
      if (!printWindow) {
        alert("Veuillez autoriser les popups pour imprimer");
        return;
      }
      const currentDate = (/* @__PURE__ */ new Date()).toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });
      const sortedTaches = [...props.taches].sort((a, b) => b.delais - a.delais);
      const totalTaches = sortedTaches.length;
      const rp1Count = sortedTaches.filter((t) => t.rp1 === 1).length;
      const categoriesCount = new Set(sortedTaches.map((t) => t.categorie)).size;
      const profilHeadersHtml = props.profils.map(
        (p) => `<th class="col-profil">${p.label}</th>`
      ).join("");
      const rowsHtml = sortedTaches.map((t, index) => {
        const profilCellsHtml = props.profils.map((p) => {
          const isSelected = t.tache_profil?.includes(p.id);
          return `<td class="profil-cell">${isSelected ? '<span class="check">✓</span>' : '<span class="uncheck">—</span>'}</td>`;
        }).join("");
        return `
    <tr class="${index % 2 === 0 ? "even" : "odd"}">
      <td class="delay-cell">
        <span class="delay-badge ${t.delais < 0 ? "delay-after" : "delay-before"}">${formatDelais(t.delais)}</span>
      </td>
      <td class="task-name">${t.tache || "—"}</td>
      <td class="category-cell">
        <span class="category-badge">${t.categorie || "Sans catégorie"}</span>
      </td>
      <td class="reference-cell">
        ${t.opt_delais === 1 ? '<span class="ref-badge ref-end"><span class="ref-icon">◀</span><span class="ref-text">Fin</span></span>' : '<span class="ref-badge ref-start"><span class="ref-icon">▶</span><span class="ref-text">Début</span></span>'}
      </td>
      <td class="rp1-cell">
        ${t.rp1 === 1 ? '<span class="rp1-badge">RP1</span>' : '<span class="rp1-empty">—</span>'}
      </td>
      ${profilCellsHtml}
    </tr>
  `;
      }).join("");
      const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Liste des Tâches - H00</title>
      <style>
        @font-face {
          font-family: 'Pacifico';
          src: url('/fonts/Pacifico.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
        }
        
        @page {
          size: landscape;
          margin: 10mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 10pt;
          line-height: 1.3;
          color: #1a1a1a;
          background: white;
          padding: 10mm;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 3px solid #2563eb;
        }
        
        .header-left h1 {
          font-family: 'Pacifico', cursive;
          font-size: 24pt;
          font-weight: 400;
          color: #1e3a5f;
          margin-bottom: 2px;
        }
        
        .header-left h1 .drop-cap {
          font-size: 38pt;
          line-height: 0.8;
          float: left;
          margin-right: 2px;
          color: #2563eb;
        }
        
        .header-left .subtitle {
          font-size: 10pt;
          color: #64748b;
        }
        
        .header-right {
          text-align: right;
          display: flex;
          align-items: center;
        }
        
        .header-right .logo {
          font-size: 12pt;
          font-weight: 700;
          color: #374151;
          letter-spacing: -0.5px;
        }
        
        .summary {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border-radius: 6px;
          padding: 10px 15px;
          margin-bottom: 15px;
          display: flex;
          gap: 20px;
        }
        
        .summary-item {
          display: flex;
          flex-direction: column;
        }
        
        .summary-item .label {
          font-size: 7pt;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .summary-item .value {
          font-size: 14pt;
          font-weight: 700;
          color: #1e3a5f;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8pt;
        }
        
        thead {
          background: #1e3a5f;
        }
        
        th {
          padding: 8px 5px;
          text-align: left;
          font-weight: 600;
          color: white;
          text-transform: uppercase;
          font-size: 6pt;
          letter-spacing: 0.4px;
        }
        
        td {
          padding: 6px 5px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }
        
        tr.odd {
          background: #fafbfc;
        }
        
        tr.even {
          background: white;
        }
        
        .col-delay { width: 6%; text-align: center; }
        .col-task { }
        .col-category { width: 12%; }
        .col-ref { width: 8%; }
        .col-rp1 { width: 5%; text-align: center; }
        .col-profil { width: 6%; text-align: center; }
        
        .task-name {
          font-weight: 500;
          color: #1e293b;
          font-size: 8pt;
        }
        
        .delay-cell {
          text-align: center;
        }
        
        .delay-badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 3px;
          font-weight: 700;
          font-size: 7pt;
          font-family: 'Consolas', 'Monaco', monospace;
          white-space: nowrap;
        }
        
        .delay-before {
          background: #dbeafe;
          color: #1d4ed8;
        }
        
        .delay-after {
          background: #dcfce7;
          color: #15803d;
        }
        
        .category-cell {
        }
        
        .category-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 7pt;
          font-weight: 500;
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
          text-align: center;
          white-space: nowrap;
        }
        
        .reference-cell {
        }
        
        .ref-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 7pt;
          font-weight: 600;
          white-space: nowrap;
        }
        
        .ref-icon {
          font-size: 5pt;
        }
        
        .ref-text {
          text-transform: uppercase;
          letter-spacing: 0.2px;
        }
        
        .ref-start {
          background: #e0f2fe;
          color: #0369a1;
          border: 1px solid #7dd3fc;
        }
        
        .ref-end {
          background: #fce7f3;
          color: #be185d;
          border: 1px solid #f9a8d4;
        }
        
        .rp1-cell {
          text-align: center;
        }
        
        .rp1-badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 6pt;
          font-weight: 700;
          background: #fef3c7;
          color: #b45309;
          border: 1px solid #fcd34d;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        
        .rp1-empty {
          color: #cbd5e1;
          font-size: 9pt;
        }
        
        .profil-cell {
          text-align: center;
        }
        
        .check {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #dcfce7;
          color: #15803d;
          font-size: 9pt;
          font-weight: 700;
        }
        
        .uncheck {
          color: #e2e8f0;
          font-size: 9pt;
        }
        
        .footer {
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          font-size: 7pt;
          color: #94a3b8;
        }
        
        @media print {
          body {
            padding: 5mm;
          }
          
          tr {
            page-break-inside: avoid;
          }
          
          thead {
            display: table-header-group;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-left">
          <h1><span class="drop-cap">L</span>iste des Tâches</h1>
          <div class="subtitle">Référentiel des tâches et délais</div>
        </div>
        <div class="header-right">
          <div class="logo">H00 Travaux</div>
        </div>
      </div>
      
      <div class="summary">
        <div class="summary-item">
          <span class="label">Total tâches</span>
          <span class="value">${totalTaches}</span>
        </div>
        <div class="summary-item">
          <span class="label">Catégories</span>
          <span class="value">${categoriesCount}</span>
        </div>
        <div class="summary-item">
          <span class="label">Tâches RP1</span>
          <span class="value">${rp1Count}</span>
        </div>
        <div class="summary-item">
          <span class="label">Profils</span>
          <span class="value">${props.profils.length}</span>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th class="col-delay">Délai</th>
            <th class="col-task">Tâche</th>
            <th class="col-category">Catégorie</th>
            <th class="col-ref">Réf.</th>
            <th class="col-rp1">RP1</th>
            ${profilHeadersHtml}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
      
      <div class="footer">
        Document généré le ${currentDate} — H00 Gestion de chantiers
      </div>
    </body>
    </html>
  `;
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    };
    __expose({ printTaches });
    return (_ctx, _push, _parent, _attrs) => {
    };
  }
};
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/parametres/tachesPrint.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const useCategories = () => {
  const supabase = useSupabaseClient();
  const { addToast } = useToast();
  const allCategories = useState("categories_list", () => []);
  const getCategories = async () => {
    try {
      const { data, error } = await supabase.from("categories").select("idcategories, name").order("name", { ascending: true });
      if (error) {
        console.error("Erreur Supabase:", error);
        throw error;
      }
      if (data && Array.isArray(data)) {
        allCategories.value = data.map((cat) => ({
          id: cat.idcategories,
          name: cat.name
        }));
      } else {
        allCategories.value = [];
      }
    } catch (err) {
      console.error("Erreur lors du chargement des catégories:", err);
      allCategories.value = [];
      addToast({
        title: "Problème lors du chargement des catégories",
        message: err.message || "La table categories n'existe peut-être pas encore.",
        type: "Error"
      });
    }
  };
  const createCategory = async (name) => {
    try {
      const { data, error } = await supabase.from("categories").insert({ name }).select().single();
      if (error) throw error;
      await getCategories();
      addToast({
        title: "Catégorie créée",
        message: `La catégorie "${name}" a été créée avec succès.`,
        type: "Success"
      });
      return data;
    } catch (err) {
      addToast({
        title: "Erreur",
        message: err.message || "Impossible de créer la catégorie",
        type: "Error"
      });
      return null;
    }
  };
  const updateCategory = async (categoryId, name) => {
    try {
      const { error } = await supabase.from("categories").update({ name }).eq("idcategories", categoryId);
      if (error) throw error;
      await getCategories();
      addToast({
        title: "Catégorie modifiée",
        message: `La catégorie a été modifiée avec succès.`,
        type: "Success"
      });
      return true;
    } catch (err) {
      addToast({
        title: "Erreur",
        message: err.message || "Impossible de modifier la catégorie",
        type: "Error"
      });
      return false;
    }
  };
  const deleteCategory = async (categoryId) => {
    try {
      const { error } = await supabase.from("categories").delete().eq("idcategories", categoryId);
      if (error) throw error;
      await getCategories();
      addToast({
        title: "Catégorie supprimée",
        message: "La catégorie a été supprimée avec succès.",
        type: "Success"
      });
      return true;
    } catch (err) {
      addToast({
        title: "Erreur",
        message: err.message || "Impossible de supprimer la catégorie",
        type: "Error"
      });
      return false;
    }
  };
  const categoriesSorted = computed(() => {
    return [...allCategories.value].sort((a, b) => a.name.localeCompare(b.name));
  });
  return {
    categories: allCategories,
    categoriesSorted,
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
  };
};
const useProfilTache = () => {
  const client = useSupabaseClient();
  const { addToast } = useToast();
  const profilTaches = useState("profilTaches", () => []);
  const getAllProfilTache = async () => {
    try {
      const { data: response, error } = await client.from("profil").select("*").order("num_profil", { ascending: true });
      if (error) throw error;
      else {
        profilTaches.value = response.map((item) => ({
          id: item.num_profil,
          label: item.name_profil
        }));
      }
    } catch (err) {
      addToast({
        title: "Problème lors du chargement des profils",
        message: err.message,
        type: "Error"
      });
    }
  };
  return { getAllProfilTache, profilTaches };
};
const _sfc_main$4 = {
  __name: "ParametresTaches",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const { taches, getTaches, createTache, updateTache, deleteTache } = useTaches();
    const { categories, getCategories } = useCategories();
    const { profilTaches, getAllProfilTache } = useProfilTache();
    const { setLoader } = useLoader();
    const globalFilter = ref("");
    const open = ref(false);
    const printComponentRef = ref(null);
    const isNewTache = ref(false);
    const tache = ref({});
    const oldTache = ref(null);
    const showDeleteModal = ref(false);
    const tacheToDelete = ref(null);
    const isDeleting = ref(false);
    const filteredTaches = computed(() => {
      if (!globalFilter.value) return taches.value;
      const search = globalFilter.value.toLowerCase();
      return taches.value.filter(
        (t) => t.tache?.toLowerCase().includes(search) || t.categorie?.toLowerCase().includes(search)
      );
    });
    const optDelaisOptions = [
      { id: 0, label: "Par rapport au début des travaux" },
      { id: 1, label: "Par rapport à la fin des travaux" }
    ];
    const rp1Switch = computed({
      get: () => tache.value.rp1 === 1,
      set: (val) => {
        tache.value.rp1 = val ? 1 : 0;
      }
    });
    const isProfilSelected = (profilId) => {
      return tache.value.tache_profil?.includes(profilId) || false;
    };
    const setProfilSelected = (profilId, selected) => {
      if (!tache.value.tache_profil) {
        tache.value.tache_profil = [];
      }
      const index = tache.value.tache_profil.indexOf(profilId);
      if (selected && index === -1) {
        tache.value.tache_profil.push(profilId);
      } else if (!selected && index > -1) {
        tache.value.tache_profil.splice(index, 1);
      }
    };
    const categoriesOptions = computed(() => {
      return categories.value.map((c) => ({
        id: c.id,
        label: c.name
      }));
    });
    const validatedFields = computed(() => {
      return tache.value.tache && tache.value.tache.trim().length > 0 && tache.value.id_categories && tache.value.delais !== null && tache.value.delais !== void 0;
    });
    const formatDelais = (delais) => {
      if (delais === null || delais === void 0) return "—";
      const absDelais = Math.abs(delais);
      const prefix = delais < 0 ? "J+" : "J-";
      return `${prefix}${absDelais}`;
    };
    const openSlideNew = () => {
      tache.value = {
        tache: "",
        id_categories: null,
        delais: 0,
        tache_profil: [],
        opt_delais: 0,
        rp1: 0
      };
      oldTache.value = null;
      isNewTache.value = true;
      open.value = true;
    };
    const closeSlide = () => {
      open.value = false;
      tache.value = {};
      oldTache.value = null;
      isNewTache.value = false;
    };
    const enregistrer = async () => {
      if (!validatedFields.value) return;
      setLoader(true);
      try {
        if (isNewTache.value) {
          await createTache({
            tache: tache.value.tache.trim(),
            id_categories: tache.value.id_categories,
            delais: parseInt(tache.value.delais),
            tache_profil: tache.value.tache_profil || [],
            opt_delais: tache.value.opt_delais || 0,
            rp1: tache.value.rp1 || 0
          });
        } else {
          await updateTache(
            tache.value.id,
            {
              tache: tache.value.tache.trim(),
              id_categories: tache.value.id_categories,
              delais: parseInt(tache.value.delais),
              tache_profil: tache.value.tache_profil || [],
              opt_delais: tache.value.opt_delais,
              rp1: tache.value.rp1
            },
            oldTache.value
          );
        }
        closeSlide();
      } finally {
        setLoader(false);
      }
    };
    const confirmDelete = async () => {
      if (!tacheToDelete.value?.id) return;
      isDeleting.value = true;
      try {
        await deleteTache(tacheToDelete.value.id);
        showDeleteModal.value = false;
        tacheToDelete.value = null;
        closeSlide();
      } finally {
        isDeleting.value = false;
      }
    };
    const cancelDelete = () => {
      tacheToDelete.value = null;
    };
    const printTaches = () => {
      printComponentRef.value?.printTaches();
    };
    setLoader(true);
    try {
      [__temp, __restore] = withAsyncContext(() => Promise.all([getTaches(), getCategories(), getAllProfilTache()])), await __temp, __restore();
    } finally {
      setLoader(false);
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppTitleMain = _sfc_main$7;
      const _component_AppInputSearch = __nuxt_component_1;
      const _component_AppButtonValidated = _sfc_main$2$1;
      const _component_Icon = __nuxt_component_1$1;
      const _component_AppSlideOver = _sfc_main$1$1;
      const _component_AppSlideOverContent = _sfc_main$8;
      const _component_AppSelect = _sfc_main$9;
      const _component_AppInput = _sfc_main$1$2;
      const _component_AppSwitch = _sfc_main$a;
      const _component_AppCheckbox = _sfc_main$b;
      const _component_AppModal = _sfc_main$c;
      const _component_ParametresTachesPrint = _sfc_main$5;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex h-full w-full flex-col gap-4 overflow-hidden" }, _attrs))}>`);
      _push(ssrRenderComponent(_component_AppTitleMain, {
        title: "Paramètres Tâches",
        description: "Gestion des tâches et de leurs délais"
      }, null, _parent));
      _push(`<div class="flex w-full flex-col items-center justify-between gap-4 sm:flex-row">`);
      _push(ssrRenderComponent(_component_AppInputSearch, {
        modelValue: unref(globalFilter),
        "onUpdate:modelValue": ($event) => isRef(globalFilter) ? globalFilter.value = $event : null,
        class: "w-full max-w-md",
        placeholder: "Rechercher une tâche ..."
      }, null, _parent));
      _push(`<div class="flex items-center gap-3">`);
      _push(ssrRenderComponent(_component_AppButtonValidated, {
        theme: "secondary",
        type: "button",
        onClick: printTaches
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<span class="flex items-center gap-2"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:printer",
              size: "18"
            }, null, _parent2, _scopeId));
            _push2(` Imprimer </span>`);
          } else {
            return [
              createVNode("span", { class: "flex items-center gap-2" }, [
                createVNode(_component_Icon, {
                  name: "lucide:printer",
                  size: "18"
                }),
                createTextVNode(" Imprimer ")
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_AppButtonValidated, {
        theme: "primary",
        type: "button",
        onClick: openSlideNew
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<span class="flex items-center gap-2"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:plus",
              size: "18"
            }, null, _parent2, _scopeId));
            _push2(` Ajouter </span>`);
          } else {
            return [
              createVNode("span", { class: "flex items-center gap-2" }, [
                createVNode(_component_Icon, {
                  name: "lucide:plus",
                  size: "18"
                }),
                createTextVNode(" Ajouter ")
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div><div class="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-md border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"><div class="flex-1 overflow-auto"><table class="w-full text-sm"><thead class="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"><tr><th class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Tâche</th><th class="hidden px-4 py-3 text-left font-semibold text-gray-700 md:table-cell dark:text-gray-200"> Catégorie </th><th class="w-24 px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-200">Délai</th><th class="hidden w-24 px-4 py-3 text-center font-semibold text-gray-700 lg:table-cell dark:text-gray-200"> RP1 </th><th class="w-24 px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-200">Actions</th></tr></thead><tbody class="divide-y divide-gray-100 dark:divide-gray-800"><!--[-->`);
      ssrRenderList(unref(filteredTaches), (t) => {
        _push(`<tr class="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"><td class="px-4 py-3"><div class="flex items-start gap-3"><div class="bg-primary-100 dark:bg-primary-900/30 mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg">`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:clipboard-list",
          size: "16",
          class: "text-primary-500"
        }, null, _parent));
        _push(`</div><div class="flex min-w-0 flex-col"><span class="line-clamp-2 font-medium text-gray-900 dark:text-white">${ssrInterpolate(t.tache || "—")}</span><span class="mt-1 text-xs text-gray-500 md:hidden dark:text-gray-400">${ssrInterpolate(t.categorie || "Sans catégorie")}</span></div></div></td><td class="hidden px-4 py-3 md:table-cell"><span class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">${ssrInterpolate(t.categorie || "Sans catégorie")}</span></td><td class="px-4 py-3 text-center"><span class="${ssrRenderClass([
          t.delais < 0 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
          "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
        ])}">${ssrInterpolate(formatDelais(t.delais))}</span></td><td class="hidden px-4 py-3 text-center lg:table-cell">`);
        if (t.rp1 === 1) {
          _push(`<span class="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"> RP1 </span>`);
        } else {
          _push(`<span class="text-xs text-gray-400 dark:text-gray-500">—</span>`);
        }
        _push(`</td><td class="px-4 py-3 text-center"><div class="flex items-center justify-center gap-1"><button class="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700" title="Modifier">`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:pencil",
          class: "hover:text-primary-500 h-4 w-4 text-gray-500"
        }, null, _parent));
        _push(`</button><button class="rounded-lg p-2 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20" title="Supprimer">`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:trash-2",
          class: "h-4 w-4 text-gray-500 hover:text-red-500"
        }, null, _parent));
        _push(`</button></div></td></tr>`);
      });
      _push(`<!--]-->`);
      if (unref(filteredTaches).length === 0) {
        _push(`<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:clipboard-x",
          class: "mx-auto mb-2 h-8 w-8 opacity-50"
        }, null, _parent));
        _push(`<p>Aucune tâche trouvée</p></td></tr>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</tbody></table></div></div>`);
      _push(ssrRenderComponent(_component_AppSlideOver, {
        sideModal: unref(open),
        closeSideModal: closeSlide
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (unref(open)) {
              _push2(ssrRenderComponent(_component_AppSlideOverContent, { closeSideModal: closeSlide }, {
                header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="text-center"${_scopeId2}><div class="bg-primary-100 dark:bg-primary-900/30 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: unref(isNewTache) ? "lucide:clipboard-plus" : "lucide:clipboard-edit",
                      size: "28",
                      class: "text-primary-500"
                    }, null, _parent3, _scopeId2));
                    _push3(`</div><h2 class="text-xl font-semibold text-gray-900 dark:text-white"${_scopeId2}>${ssrInterpolate(unref(isNewTache) ? "Nouvelle tâche" : "Modifier la tâche")}</h2>`);
                    if (!unref(isNewTache)) {
                      _push3(`<p class="mt-1 text-sm text-gray-500 dark:text-gray-400"${_scopeId2}>ID: ${ssrInterpolate(unref(tache).id)}</p>`);
                    } else {
                      _push3(`<!---->`);
                    }
                    _push3(`</div>`);
                  } else {
                    return [
                      createVNode("div", { class: "text-center" }, [
                        createVNode("div", { class: "bg-primary-100 dark:bg-primary-900/30 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" }, [
                          createVNode(_component_Icon, {
                            name: unref(isNewTache) ? "lucide:clipboard-plus" : "lucide:clipboard-edit",
                            size: "28",
                            class: "text-primary-500"
                          }, null, 8, ["name"])
                        ]),
                        createVNode("h2", { class: "text-xl font-semibold text-gray-900 dark:text-white" }, toDisplayString(unref(isNewTache) ? "Nouvelle tâche" : "Modifier la tâche"), 1),
                        !unref(isNewTache) ? (openBlock(), createBlock("p", {
                          key: 0,
                          class: "mt-1 text-sm text-gray-500 dark:text-gray-400"
                        }, "ID: " + toDisplayString(unref(tache).id), 1)) : createCommentVNode("", true)
                      ])
                    ];
                  }
                }),
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<form class="flex w-full flex-col gap-5"${_scopeId2}><div class="flex flex-col gap-1.5"${_scopeId2}><label class="text-sm font-medium text-gray-700 dark:text-gray-300"${_scopeId2}> Nom de la tâche <span class="text-red-500"${_scopeId2}>*</span></label><textarea rows="3" class="focus:ring-primary-500 w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-transparent focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white" placeholder="Description de la tâche..."${_scopeId2}>${ssrInterpolate(unref(tache).tache)}</textarea></div><div class="flex flex-col gap-1.5"${_scopeId2}><label class="text-sm font-medium text-gray-700 dark:text-gray-300"${_scopeId2}> Catégorie <span class="text-red-500"${_scopeId2}>*</span></label>`);
                    _push3(ssrRenderComponent(_component_AppSelect, {
                      modelValue: unref(tache).id_categories,
                      "onUpdate:modelValue": ($event) => unref(tache).id_categories = $event,
                      options: unref(categoriesOptions),
                      placeholder: "Sélectionner une catégorie..."
                    }, null, _parent3, _scopeId2));
                    _push3(`</div><div class="flex flex-col gap-1.5"${_scopeId2}><label class="text-sm font-medium text-gray-700 dark:text-gray-300"${_scopeId2}> Délai (en jours) <span class="text-red-500"${_scopeId2}>*</span></label>`);
                    _push3(ssrRenderComponent(_component_AppInput, {
                      name: "delais",
                      type: "number",
                      placeholder: "Ex: 30, -15...",
                      modelValue: unref(tache).delais,
                      "onUpdate:modelValue": ($event) => unref(tache).delais = $event
                    }, null, _parent3, _scopeId2));
                    _push3(`<p class="text-xs text-gray-500 dark:text-gray-400"${_scopeId2}> Valeur positive = avant la date de référence (J-X), négative = après (J+X) </p></div><div class="flex flex-col gap-1.5"${_scopeId2}><label class="text-sm font-medium text-gray-700 dark:text-gray-300"${_scopeId2}>Date de référence</label>`);
                    _push3(ssrRenderComponent(_component_AppSelect, {
                      modelValue: unref(tache).opt_delais,
                      "onUpdate:modelValue": ($event) => unref(tache).opt_delais = $event,
                      options: optDelaisOptions,
                      placeholder: "Sélectionner..."
                    }, null, _parent3, _scopeId2));
                    if (!unref(isNewTache)) {
                      _push3(`<p class="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400"${_scopeId2}>`);
                      _push3(ssrRenderComponent(_component_Icon, {
                        name: "lucide:alert-triangle",
                        class: "h-3 w-3"
                      }, null, _parent3, _scopeId2));
                      _push3(` Modifier cette valeur mettra à jour les prévisions existantes </p>`);
                    } else {
                      _push3(`<!---->`);
                    }
                    _push3(`</div><div class="flex flex-col gap-1.5"${_scopeId2}><label class="text-sm font-medium text-gray-700 dark:text-gray-300"${_scopeId2}>Tâche RP1</label>`);
                    _push3(ssrRenderComponent(_component_AppSwitch, {
                      modelValue: unref(rp1Switch),
                      "onUpdate:modelValue": ($event) => isRef(rp1Switch) ? rp1Switch.value = $event : null,
                      label: "Activer pour les tâches RP1"
                    }, null, _parent3, _scopeId2));
                    _push3(`</div><div class="flex flex-col gap-1.5"${_scopeId2}><label class="text-sm font-medium text-gray-700 dark:text-gray-300"${_scopeId2}>Profils concernés</label><div class="grid grid-cols-2 gap-3"${_scopeId2}><!--[-->`);
                    ssrRenderList(unref(profilTaches), (profil) => {
                      _push3(ssrRenderComponent(_component_AppCheckbox, {
                        key: profil.id,
                        label: profil.label,
                        "model-value": isProfilSelected(profil.id),
                        "onUpdate:modelValue": (val) => setProfilSelected(profil.id, val)
                      }, null, _parent3, _scopeId2));
                    });
                    _push3(`<!--]--></div></div></form>`);
                  } else {
                    return [
                      createVNode("form", {
                        onSubmit: withModifiers(enregistrer, ["prevent"]),
                        class: "flex w-full flex-col gap-5"
                      }, [
                        createVNode("div", { class: "flex flex-col gap-1.5" }, [
                          createVNode("label", { class: "text-sm font-medium text-gray-700 dark:text-gray-300" }, [
                            createTextVNode(" Nom de la tâche "),
                            createVNode("span", { class: "text-red-500" }, "*")
                          ]),
                          withDirectives(createVNode("textarea", {
                            "onUpdate:modelValue": ($event) => unref(tache).tache = $event,
                            rows: "3",
                            class: "focus:ring-primary-500 w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-transparent focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white",
                            placeholder: "Description de la tâche..."
                          }, null, 8, ["onUpdate:modelValue"]), [
                            [vModelText, unref(tache).tache]
                          ])
                        ]),
                        createVNode("div", { class: "flex flex-col gap-1.5" }, [
                          createVNode("label", { class: "text-sm font-medium text-gray-700 dark:text-gray-300" }, [
                            createTextVNode(" Catégorie "),
                            createVNode("span", { class: "text-red-500" }, "*")
                          ]),
                          createVNode(_component_AppSelect, {
                            modelValue: unref(tache).id_categories,
                            "onUpdate:modelValue": ($event) => unref(tache).id_categories = $event,
                            options: unref(categoriesOptions),
                            placeholder: "Sélectionner une catégorie..."
                          }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                        ]),
                        createVNode("div", { class: "flex flex-col gap-1.5" }, [
                          createVNode("label", { class: "text-sm font-medium text-gray-700 dark:text-gray-300" }, [
                            createTextVNode(" Délai (en jours) "),
                            createVNode("span", { class: "text-red-500" }, "*")
                          ]),
                          createVNode(_component_AppInput, {
                            name: "delais",
                            type: "number",
                            placeholder: "Ex: 30, -15...",
                            modelValue: unref(tache).delais,
                            "onUpdate:modelValue": ($event) => unref(tache).delais = $event
                          }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                          createVNode("p", { class: "text-xs text-gray-500 dark:text-gray-400" }, " Valeur positive = avant la date de référence (J-X), négative = après (J+X) ")
                        ]),
                        createVNode("div", { class: "flex flex-col gap-1.5" }, [
                          createVNode("label", { class: "text-sm font-medium text-gray-700 dark:text-gray-300" }, "Date de référence"),
                          createVNode(_component_AppSelect, {
                            modelValue: unref(tache).opt_delais,
                            "onUpdate:modelValue": ($event) => unref(tache).opt_delais = $event,
                            options: optDelaisOptions,
                            placeholder: "Sélectionner..."
                          }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                          !unref(isNewTache) ? (openBlock(), createBlock("p", {
                            key: 0,
                            class: "flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400"
                          }, [
                            createVNode(_component_Icon, {
                              name: "lucide:alert-triangle",
                              class: "h-3 w-3"
                            }),
                            createTextVNode(" Modifier cette valeur mettra à jour les prévisions existantes ")
                          ])) : createCommentVNode("", true)
                        ]),
                        createVNode("div", { class: "flex flex-col gap-1.5" }, [
                          createVNode("label", { class: "text-sm font-medium text-gray-700 dark:text-gray-300" }, "Tâche RP1"),
                          createVNode(_component_AppSwitch, {
                            modelValue: unref(rp1Switch),
                            "onUpdate:modelValue": ($event) => isRef(rp1Switch) ? rp1Switch.value = $event : null,
                            label: "Activer pour les tâches RP1"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ]),
                        createVNode("div", { class: "flex flex-col gap-1.5" }, [
                          createVNode("label", { class: "text-sm font-medium text-gray-700 dark:text-gray-300" }, "Profils concernés"),
                          createVNode("div", { class: "grid grid-cols-2 gap-3" }, [
                            (openBlock(true), createBlock(Fragment, null, renderList(unref(profilTaches), (profil) => {
                              return openBlock(), createBlock(_component_AppCheckbox, {
                                key: profil.id,
                                label: profil.label,
                                "model-value": isProfilSelected(profil.id),
                                "onUpdate:modelValue": (val) => setProfilSelected(profil.id, val)
                              }, null, 8, ["label", "model-value", "onUpdate:modelValue"]);
                            }), 128))
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
                      onClick: closeSlide
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
                      validated: unref(validatedFields),
                      onClick: enregistrer
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`${ssrInterpolate(unref(isNewTache) ? "Créer" : "Enregistrer")}`);
                        } else {
                          return [
                            createTextVNode(toDisplayString(unref(isNewTache) ? "Créer" : "Enregistrer"), 1)
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
                          onClick: closeSlide
                        }, {
                          default: withCtx(() => [
                            createTextVNode("Annuler")
                          ]),
                          _: 1
                        }),
                        createVNode(_component_AppButtonValidated, {
                          validated: unref(validatedFields),
                          onClick: enregistrer
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(isNewTache) ? "Créer" : "Enregistrer"), 1)
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
              unref(open) ? (openBlock(), createBlock(_component_AppSlideOverContent, {
                key: 0,
                closeSideModal: closeSlide
              }, {
                header: withCtx(() => [
                  createVNode("div", { class: "text-center" }, [
                    createVNode("div", { class: "bg-primary-100 dark:bg-primary-900/30 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" }, [
                      createVNode(_component_Icon, {
                        name: unref(isNewTache) ? "lucide:clipboard-plus" : "lucide:clipboard-edit",
                        size: "28",
                        class: "text-primary-500"
                      }, null, 8, ["name"])
                    ]),
                    createVNode("h2", { class: "text-xl font-semibold text-gray-900 dark:text-white" }, toDisplayString(unref(isNewTache) ? "Nouvelle tâche" : "Modifier la tâche"), 1),
                    !unref(isNewTache) ? (openBlock(), createBlock("p", {
                      key: 0,
                      class: "mt-1 text-sm text-gray-500 dark:text-gray-400"
                    }, "ID: " + toDisplayString(unref(tache).id), 1)) : createCommentVNode("", true)
                  ])
                ]),
                default: withCtx(() => [
                  createVNode("form", {
                    onSubmit: withModifiers(enregistrer, ["prevent"]),
                    class: "flex w-full flex-col gap-5"
                  }, [
                    createVNode("div", { class: "flex flex-col gap-1.5" }, [
                      createVNode("label", { class: "text-sm font-medium text-gray-700 dark:text-gray-300" }, [
                        createTextVNode(" Nom de la tâche "),
                        createVNode("span", { class: "text-red-500" }, "*")
                      ]),
                      withDirectives(createVNode("textarea", {
                        "onUpdate:modelValue": ($event) => unref(tache).tache = $event,
                        rows: "3",
                        class: "focus:ring-primary-500 w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-transparent focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white",
                        placeholder: "Description de la tâche..."
                      }, null, 8, ["onUpdate:modelValue"]), [
                        [vModelText, unref(tache).tache]
                      ])
                    ]),
                    createVNode("div", { class: "flex flex-col gap-1.5" }, [
                      createVNode("label", { class: "text-sm font-medium text-gray-700 dark:text-gray-300" }, [
                        createTextVNode(" Catégorie "),
                        createVNode("span", { class: "text-red-500" }, "*")
                      ]),
                      createVNode(_component_AppSelect, {
                        modelValue: unref(tache).id_categories,
                        "onUpdate:modelValue": ($event) => unref(tache).id_categories = $event,
                        options: unref(categoriesOptions),
                        placeholder: "Sélectionner une catégorie..."
                      }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                    ]),
                    createVNode("div", { class: "flex flex-col gap-1.5" }, [
                      createVNode("label", { class: "text-sm font-medium text-gray-700 dark:text-gray-300" }, [
                        createTextVNode(" Délai (en jours) "),
                        createVNode("span", { class: "text-red-500" }, "*")
                      ]),
                      createVNode(_component_AppInput, {
                        name: "delais",
                        type: "number",
                        placeholder: "Ex: 30, -15...",
                        modelValue: unref(tache).delais,
                        "onUpdate:modelValue": ($event) => unref(tache).delais = $event
                      }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                      createVNode("p", { class: "text-xs text-gray-500 dark:text-gray-400" }, " Valeur positive = avant la date de référence (J-X), négative = après (J+X) ")
                    ]),
                    createVNode("div", { class: "flex flex-col gap-1.5" }, [
                      createVNode("label", { class: "text-sm font-medium text-gray-700 dark:text-gray-300" }, "Date de référence"),
                      createVNode(_component_AppSelect, {
                        modelValue: unref(tache).opt_delais,
                        "onUpdate:modelValue": ($event) => unref(tache).opt_delais = $event,
                        options: optDelaisOptions,
                        placeholder: "Sélectionner..."
                      }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                      !unref(isNewTache) ? (openBlock(), createBlock("p", {
                        key: 0,
                        class: "flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400"
                      }, [
                        createVNode(_component_Icon, {
                          name: "lucide:alert-triangle",
                          class: "h-3 w-3"
                        }),
                        createTextVNode(" Modifier cette valeur mettra à jour les prévisions existantes ")
                      ])) : createCommentVNode("", true)
                    ]),
                    createVNode("div", { class: "flex flex-col gap-1.5" }, [
                      createVNode("label", { class: "text-sm font-medium text-gray-700 dark:text-gray-300" }, "Tâche RP1"),
                      createVNode(_component_AppSwitch, {
                        modelValue: unref(rp1Switch),
                        "onUpdate:modelValue": ($event) => isRef(rp1Switch) ? rp1Switch.value = $event : null,
                        label: "Activer pour les tâches RP1"
                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                    ]),
                    createVNode("div", { class: "flex flex-col gap-1.5" }, [
                      createVNode("label", { class: "text-sm font-medium text-gray-700 dark:text-gray-300" }, "Profils concernés"),
                      createVNode("div", { class: "grid grid-cols-2 gap-3" }, [
                        (openBlock(true), createBlock(Fragment, null, renderList(unref(profilTaches), (profil) => {
                          return openBlock(), createBlock(_component_AppCheckbox, {
                            key: profil.id,
                            label: profil.label,
                            "model-value": isProfilSelected(profil.id),
                            "onUpdate:modelValue": (val) => setProfilSelected(profil.id, val)
                          }, null, 8, ["label", "model-value", "onUpdate:modelValue"]);
                        }), 128))
                      ])
                    ])
                  ], 32)
                ]),
                footer: withCtx(() => [
                  createVNode("div", { class: "flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700" }, [
                    createVNode(_component_AppButtonValidated, {
                      theme: "cancel",
                      type: "button",
                      onClick: closeSlide
                    }, {
                      default: withCtx(() => [
                        createTextVNode("Annuler")
                      ]),
                      _: 1
                    }),
                    createVNode(_component_AppButtonValidated, {
                      validated: unref(validatedFields),
                      onClick: enregistrer
                    }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(unref(isNewTache) ? "Créer" : "Enregistrer"), 1)
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
        size: "md",
        persistent: unref(isDeleting),
        onClose: cancelDelete
      }, {
        header: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="text-center"${_scopeId}><div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:triangle-alert",
              size: "28",
              class: "text-red-600 dark:text-red-400"
            }, null, _parent2, _scopeId));
            _push2(`</div><h3 class="text-lg font-semibold text-gray-900 dark:text-white"${_scopeId}>Supprimer une tâche</h3></div>`);
          } else {
            return [
              createVNode("div", { class: "text-center" }, [
                createVNode("div", { class: "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30" }, [
                  createVNode(_component_Icon, {
                    name: "lucide:triangle-alert",
                    size: "28",
                    class: "text-red-600 dark:text-red-400"
                  })
                ]),
                createVNode("h3", { class: "text-lg font-semibold text-gray-900 dark:text-white" }, "Supprimer une tâche")
              ])
            ];
          }
        }),
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<p class="text-center text-sm leading-relaxed text-gray-600 dark:text-gray-300"${_scopeId}> Êtes-vous sûr de vouloir supprimer la tâche <span class="font-semibold text-gray-900 dark:text-white"${_scopeId}> « ${ssrInterpolate(unref(tacheToDelete)?.tache?.substring(0, 50) || "")}${ssrInterpolate(unref(tacheToDelete)?.tache?.length > 50 ? "..." : "")} » </span> ? Cette action est irréversible. </p>`);
          } else {
            return [
              createVNode("p", { class: "text-center text-sm leading-relaxed text-gray-600 dark:text-gray-300" }, [
                createTextVNode(" Êtes-vous sûr de vouloir supprimer la tâche "),
                createVNode("span", { class: "font-semibold text-gray-900 dark:text-white" }, " « " + toDisplayString(unref(tacheToDelete)?.tache?.substring(0, 50) || "") + toDisplayString(unref(tacheToDelete)?.tache?.length > 50 ? "..." : "") + " » ", 1),
                createTextVNode(" ? Cette action est irréversible. ")
              ])
            ];
          }
        }),
        footer: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex justify-end gap-3"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_AppButtonValidated, {
              theme: "cancel",
              type: "button",
              validated: !unref(isDeleting),
              onClick: ($event) => showDeleteModal.value = false
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
              loading: unref(isDeleting),
              onClick: confirmDelete
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
              createVNode("div", { class: "flex justify-end gap-3" }, [
                createVNode(_component_AppButtonValidated, {
                  theme: "cancel",
                  type: "button",
                  validated: !unref(isDeleting),
                  onClick: ($event) => showDeleteModal.value = false
                }, {
                  default: withCtx(() => [
                    createTextVNode("Annuler")
                  ]),
                  _: 1
                }, 8, ["validated", "onClick"]),
                createVNode(_component_AppButtonValidated, {
                  theme: "delete",
                  type: "button",
                  loading: unref(isDeleting),
                  onClick: confirmDelete
                }, {
                  default: withCtx(() => [
                    createTextVNode("Supprimer")
                  ]),
                  _: 1
                }, 8, ["loading"])
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_ParametresTachesPrint, {
        ref_key: "printComponentRef",
        ref: printComponentRef,
        taches: unref(taches),
        profils: unref(profilTaches)
      }, null, _parent));
      _push(`</div>`);
    };
  }
};
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/parametres/taches.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const _sfc_main$3 = {
  __name: "ParametresCategories",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const { categories, getCategories, createCategory, updateCategory, deleteCategory } = useCategories();
    const { setLoader } = useLoader();
    const globalFilter = ref("");
    const open = ref(false);
    const isNewCategory = ref(false);
    const category = ref({});
    const showDeleteModal = ref(false);
    const categoryToDelete = ref(null);
    const isDeleting = ref(false);
    const filteredCategories = computed(() => {
      if (!globalFilter.value) return categories.value;
      const search = globalFilter.value.toLowerCase();
      return categories.value.filter(
        (c) => c.name?.toLowerCase().includes(search)
      );
    });
    const validatedFields = computed(() => {
      return category.value.name && category.value.name.trim().length > 0;
    });
    const openSlideNew = () => {
      category.value = { name: "" };
      isNewCategory.value = true;
      open.value = true;
    };
    const closeSlide = () => {
      open.value = false;
      category.value = {};
      isNewCategory.value = false;
    };
    const enregistrer = async () => {
      if (!validatedFields.value) return;
      setLoader(true);
      try {
        if (isNewCategory.value) {
          await createCategory(category.value.name.trim());
        } else {
          await updateCategory(category.value.id, category.value.name.trim());
        }
        closeSlide();
      } finally {
        setLoader(false);
      }
    };
    const confirmDelete = async () => {
      if (!categoryToDelete.value?.id) return;
      isDeleting.value = true;
      try {
        await deleteCategory(categoryToDelete.value.id);
        showDeleteModal.value = false;
        categoryToDelete.value = null;
      } finally {
        isDeleting.value = false;
      }
    };
    const cancelDelete = () => {
      categoryToDelete.value = null;
    };
    setLoader(true);
    try {
      [__temp, __restore] = withAsyncContext(() => getCategories()), await __temp, __restore();
    } finally {
      setLoader(false);
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppTitleMain = _sfc_main$7;
      const _component_AppInputSearch = __nuxt_component_1;
      const _component_AppButtonValidated = _sfc_main$2$1;
      const _component_Icon = __nuxt_component_1$1;
      const _component_AppSlideOver = _sfc_main$1$1;
      const _component_AppSlideOverContent = _sfc_main$8;
      const _component_AppInput = _sfc_main$1$2;
      const _component_AppModal = _sfc_main$c;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex flex-col w-full h-full gap-4 overflow-hidden" }, _attrs))}>`);
      _push(ssrRenderComponent(_component_AppTitleMain, {
        title: "Paramètres Catégories",
        description: "Gestion des catégories de tâches"
      }, null, _parent));
      _push(`<div class="flex flex-col sm:flex-row gap-4 items-center justify-between w-full">`);
      _push(ssrRenderComponent(_component_AppInputSearch, {
        modelValue: unref(globalFilter),
        "onUpdate:modelValue": ($event) => isRef(globalFilter) ? globalFilter.value = $event : null,
        class: "w-full max-w-md",
        placeholder: "Rechercher une catégorie ..."
      }, null, _parent));
      _push(ssrRenderComponent(_component_AppButtonValidated, {
        theme: "primary",
        type: "button",
        onClick: openSlideNew
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<span class="flex items-center gap-2"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:plus",
              size: "18"
            }, null, _parent2, _scopeId));
            _push2(` Ajouter </span>`);
          } else {
            return [
              createVNode("span", { class: "flex items-center gap-2" }, [
                createVNode(_component_Icon, {
                  name: "lucide:plus",
                  size: "18"
                }),
                createTextVNode(" Ajouter ")
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="flex flex-col w-full flex-1 min-h-0 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"><div class="overflow-auto flex-1"><table class="w-full text-sm"><thead class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10"><tr><th class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Nom de la catégorie</th><th class="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-200 w-24">Actions</th></tr></thead><tbody class="divide-y divide-gray-100 dark:divide-gray-800"><!--[-->`);
      ssrRenderList(unref(filteredCategories), (c) => {
        _push(`<tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"><td class="px-4 py-3"><div class="flex items-center gap-3"><div class="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:folder",
          size: "16",
          class: "text-primary-500"
        }, null, _parent));
        _push(`</div><span class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(c.name || "—")}</span></div></td><td class="px-4 py-3 text-center"><div class="flex items-center justify-center gap-1"><button class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Modifier">`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:pencil",
          class: "w-4 h-4 text-gray-500 hover:text-primary-500"
        }, null, _parent));
        _push(`</button><button class="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Supprimer">`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:trash-2",
          class: "w-4 h-4 text-gray-500 hover:text-red-500"
        }, null, _parent));
        _push(`</button></div></td></tr>`);
      });
      _push(`<!--]-->`);
      if (unref(filteredCategories).length === 0) {
        _push(`<tr><td colspan="2" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:folder-x",
          class: "w-8 h-8 mx-auto mb-2 opacity-50"
        }, null, _parent));
        _push(`<p>Aucune catégorie trouvée</p></td></tr>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</tbody></table></div></div>`);
      _push(ssrRenderComponent(_component_AppSlideOver, {
        sideModal: unref(open),
        closeSideModal: closeSlide
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (unref(open)) {
              _push2(ssrRenderComponent(_component_AppSlideOverContent, { closeSideModal: closeSlide }, {
                header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="text-center"${_scopeId2}><div class="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: unref(isNewCategory) ? "lucide:folder-plus" : "lucide:folder-edit",
                      size: "28",
                      class: "text-primary-500"
                    }, null, _parent3, _scopeId2));
                    _push3(`</div><h2 class="text-xl font-semibold text-gray-900 dark:text-white"${_scopeId2}>${ssrInterpolate(unref(isNewCategory) ? "Nouvelle catégorie" : "Modifier la catégorie")}</h2>`);
                    if (!unref(isNewCategory)) {
                      _push3(`<p class="text-sm text-gray-500 dark:text-gray-400 mt-1"${_scopeId2}> ID: ${ssrInterpolate(unref(category).id)}</p>`);
                    } else {
                      _push3(`<!---->`);
                    }
                    _push3(`</div>`);
                  } else {
                    return [
                      createVNode("div", { class: "text-center" }, [
                        createVNode("div", { class: "w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center" }, [
                          createVNode(_component_Icon, {
                            name: unref(isNewCategory) ? "lucide:folder-plus" : "lucide:folder-edit",
                            size: "28",
                            class: "text-primary-500"
                          }, null, 8, ["name"])
                        ]),
                        createVNode("h2", { class: "text-xl font-semibold text-gray-900 dark:text-white" }, toDisplayString(unref(isNewCategory) ? "Nouvelle catégorie" : "Modifier la catégorie"), 1),
                        !unref(isNewCategory) ? (openBlock(), createBlock("p", {
                          key: 0,
                          class: "text-sm text-gray-500 dark:text-gray-400 mt-1"
                        }, " ID: " + toDisplayString(unref(category).id), 1)) : createCommentVNode("", true)
                      ])
                    ];
                  }
                }),
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<form class="flex flex-col gap-5 w-full"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_AppInput, {
                      name: "name",
                      title: "Nom de la catégorie",
                      placeholder: "Ex: Technique, Ressources, Matières...",
                      modelValue: unref(category).name,
                      "onUpdate:modelValue": ($event) => unref(category).name = $event
                    }, null, _parent3, _scopeId2));
                    _push3(`<p class="text-xs text-gray-500 dark:text-gray-400"${_scopeId2}> Le nom de la catégorie sera utilisé pour organiser et filtrer les tâches. </p></form>`);
                  } else {
                    return [
                      createVNode("form", {
                        onSubmit: withModifiers(enregistrer, ["prevent"]),
                        class: "flex flex-col gap-5 w-full"
                      }, [
                        createVNode(_component_AppInput, {
                          name: "name",
                          title: "Nom de la catégorie",
                          placeholder: "Ex: Technique, Ressources, Matières...",
                          modelValue: unref(category).name,
                          "onUpdate:modelValue": ($event) => unref(category).name = $event
                        }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                        createVNode("p", { class: "text-xs text-gray-500 dark:text-gray-400" }, " Le nom de la catégorie sera utilisé pour organiser et filtrer les tâches. ")
                      ], 32)
                    ];
                  }
                }),
                footer: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_AppButtonValidated, {
                      theme: "cancel",
                      type: "button",
                      onClick: closeSlide
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
                      validated: unref(validatedFields),
                      onClick: enregistrer
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`${ssrInterpolate(unref(isNewCategory) ? "Créer" : "Enregistrer")}`);
                        } else {
                          return [
                            createTextVNode(toDisplayString(unref(isNewCategory) ? "Créer" : "Enregistrer"), 1)
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(`</div>`);
                  } else {
                    return [
                      createVNode("div", { class: "flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700" }, [
                        createVNode(_component_AppButtonValidated, {
                          theme: "cancel",
                          type: "button",
                          onClick: closeSlide
                        }, {
                          default: withCtx(() => [
                            createTextVNode("Annuler")
                          ]),
                          _: 1
                        }),
                        createVNode(_component_AppButtonValidated, {
                          validated: unref(validatedFields),
                          onClick: enregistrer
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(isNewCategory) ? "Créer" : "Enregistrer"), 1)
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
              unref(open) ? (openBlock(), createBlock(_component_AppSlideOverContent, {
                key: 0,
                closeSideModal: closeSlide
              }, {
                header: withCtx(() => [
                  createVNode("div", { class: "text-center" }, [
                    createVNode("div", { class: "w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center" }, [
                      createVNode(_component_Icon, {
                        name: unref(isNewCategory) ? "lucide:folder-plus" : "lucide:folder-edit",
                        size: "28",
                        class: "text-primary-500"
                      }, null, 8, ["name"])
                    ]),
                    createVNode("h2", { class: "text-xl font-semibold text-gray-900 dark:text-white" }, toDisplayString(unref(isNewCategory) ? "Nouvelle catégorie" : "Modifier la catégorie"), 1),
                    !unref(isNewCategory) ? (openBlock(), createBlock("p", {
                      key: 0,
                      class: "text-sm text-gray-500 dark:text-gray-400 mt-1"
                    }, " ID: " + toDisplayString(unref(category).id), 1)) : createCommentVNode("", true)
                  ])
                ]),
                default: withCtx(() => [
                  createVNode("form", {
                    onSubmit: withModifiers(enregistrer, ["prevent"]),
                    class: "flex flex-col gap-5 w-full"
                  }, [
                    createVNode(_component_AppInput, {
                      name: "name",
                      title: "Nom de la catégorie",
                      placeholder: "Ex: Technique, Ressources, Matières...",
                      modelValue: unref(category).name,
                      "onUpdate:modelValue": ($event) => unref(category).name = $event
                    }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                    createVNode("p", { class: "text-xs text-gray-500 dark:text-gray-400" }, " Le nom de la catégorie sera utilisé pour organiser et filtrer les tâches. ")
                  ], 32)
                ]),
                footer: withCtx(() => [
                  createVNode("div", { class: "flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700" }, [
                    createVNode(_component_AppButtonValidated, {
                      theme: "cancel",
                      type: "button",
                      onClick: closeSlide
                    }, {
                      default: withCtx(() => [
                        createTextVNode("Annuler")
                      ]),
                      _: 1
                    }),
                    createVNode(_component_AppButtonValidated, {
                      validated: unref(validatedFields),
                      onClick: enregistrer
                    }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(unref(isNewCategory) ? "Créer" : "Enregistrer"), 1)
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
        size: "md",
        persistent: unref(isDeleting),
        onClose: cancelDelete
      }, {
        header: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="text-center"${_scopeId}><div class="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:triangle-alert",
              size: "28",
              class: "text-red-600 dark:text-red-400"
            }, null, _parent2, _scopeId));
            _push2(`</div><h3 class="text-lg font-semibold text-gray-900 dark:text-white"${_scopeId}>Supprimer une catégorie</h3></div>`);
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
                createVNode("h3", { class: "text-lg font-semibold text-gray-900 dark:text-white" }, "Supprimer une catégorie")
              ])
            ];
          }
        }),
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<p class="text-center text-gray-600 dark:text-gray-300 text-sm leading-relaxed"${_scopeId}> Êtes-vous sûr de vouloir supprimer la catégorie <span class="font-semibold text-gray-900 dark:text-white"${_scopeId}>« ${ssrInterpolate(unref(categoryToDelete)?.name || "")} »</span> ? Cette action est irréversible. </p>`);
          } else {
            return [
              createVNode("p", { class: "text-center text-gray-600 dark:text-gray-300 text-sm leading-relaxed" }, [
                createTextVNode(" Êtes-vous sûr de vouloir supprimer la catégorie "),
                createVNode("span", { class: "font-semibold text-gray-900 dark:text-white" }, "« " + toDisplayString(unref(categoryToDelete)?.name || "") + " »", 1),
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
              validated: !unref(isDeleting),
              onClick: ($event) => showDeleteModal.value = false
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
              loading: unref(isDeleting),
              onClick: confirmDelete
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
                  validated: !unref(isDeleting),
                  onClick: ($event) => showDeleteModal.value = false
                }, {
                  default: withCtx(() => [
                    createTextVNode("Annuler")
                  ]),
                  _: 1
                }, 8, ["validated", "onClick"]),
                createVNode(_component_AppButtonValidated, {
                  theme: "delete",
                  type: "button",
                  loading: unref(isDeleting),
                  onClick: confirmDelete
                }, {
                  default: withCtx(() => [
                    createTextVNode("Supprimer")
                  ]),
                  _: 1
                }, 8, ["loading"])
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/parametres/categories.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const _sfc_main$2 = {
  __name: "ParametresChantiers",
  __ssrInlineRender: true,
  setup(__props) {
    const {
      getChantiersEtat2,
      getChantiersEtat1,
      getChantiersEtat0,
      getChantiersTermines,
      passerChantier,
      terminerChantier,
      supprimerChantier
    } = useChantiers();
    const { setLoader } = useLoader();
    const selectedChantierPasser = ref(null);
    const selectedChantierTerminer = ref(null);
    const selectedChantierSupprimer = ref(null);
    const formatChantierLabel = (chantier) => {
      if (!chantier) return "";
      const parts = [];
      if (chantier.compte) parts.push(chantier.compte);
      if (chantier.name) parts.push(chantier.name);
      if (chantier.ligne) parts.push(chantier.ligne);
      return parts.length > 0 ? parts.join(" - ") : `Chantier #${chantier.id}`;
    };
    const chantiersEnCoursOptions = computed(() => {
      return getChantiersEtat2.value.map((chantier) => ({
        id: chantier.id,
        label: formatChantierLabel(chantier)
      }));
    });
    const chantiersATerminerOptions = computed(() => {
      const chantiersRLT = getChantiersEtat0.value.map((chantier) => ({
        id: chantier.id,
        label: `[RLT] ${formatChantierLabel(chantier)}`
      }));
      const chantiersExternes = getChantiersEtat1.value.map((chantier) => ({
        id: chantier.id,
        label: `[Externe] ${formatChantierLabel(chantier)}`
      }));
      return [...chantiersRLT, ...chantiersExternes];
    });
    const chantiersTerminesOptions = computed(() => {
      return getChantiersTermines.value.map((chantier) => ({
        id: chantier.id,
        label: formatChantierLabel(chantier)
      }));
    });
    const handlePasser = async () => {
      if (!selectedChantierPasser.value) return;
      setLoader(true);
      try {
        await passerChantier(selectedChantierPasser.value);
        selectedChantierPasser.value = null;
      } finally {
        setLoader(false);
      }
    };
    const handleTerminer = async () => {
      if (!selectedChantierTerminer.value) return;
      setLoader(true);
      try {
        await terminerChantier(selectedChantierTerminer.value);
        selectedChantierTerminer.value = null;
      } finally {
        setLoader(false);
      }
    };
    const handleSupprimer = async () => {
      if (!selectedChantierSupprimer.value) return;
      setLoader(true);
      try {
        await supprimerChantier(selectedChantierSupprimer.value);
        selectedChantierSupprimer.value = null;
      } finally {
        setLoader(false);
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppTitleMain = _sfc_main$7;
      const _component_Icon = __nuxt_component_1$1;
      const _component_AppSelect = _sfc_main$9;
      const _component_AppButtonValidated = _sfc_main$2$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex flex-col w-full h-full gap-6" }, _attrs))}>`);
      _push(ssrRenderComponent(_component_AppTitleMain, {
        title: "Paramètres Chantiers",
        description: "Gestion des chantiers"
      }, null, _parent));
      _push(`<div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700"><div class="flex items-center gap-2 mb-4">`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:arrow-right-circle",
        class: "w-5 h-5 text-primary-500"
      }, null, _parent));
      _push(`<h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Passer un chantier au RLT</h3></div><p class="text-sm text-gray-500 dark:text-gray-400 mb-4"> Sélectionnez un chantier en cours (Pré-op) pour le passer au statut RLT. </p><div class="flex flex-col sm:flex-row gap-3"><div class="flex-1">`);
      _push(ssrRenderComponent(_component_AppSelect, {
        modelValue: unref(selectedChantierPasser),
        "onUpdate:modelValue": ($event) => isRef(selectedChantierPasser) ? selectedChantierPasser.value = $event : null,
        options: unref(chantiersEnCoursOptions),
        placeholder: "Sélectionner un chantier en cours...",
        nullable: ""
      }, null, _parent));
      _push(`</div>`);
      _push(ssrRenderComponent(_component_AppButtonValidated, {
        validated: !!unref(selectedChantierPasser),
        theme: "primary",
        type: "button",
        onClick: handlePasser
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Passer au RLT`);
          } else {
            return [
              createTextVNode("Passer au RLT")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
      if (unref(chantiersEnCoursOptions).length === 0) {
        _push(`<p class="text-sm text-gray-400 dark:text-gray-500 mt-2 italic"> Aucun chantier en cours disponible. </p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700"><div class="flex items-center gap-2 mb-4">`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:check-circle",
        class: "w-5 h-5 text-green-500"
      }, null, _parent));
      _push(`<h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Terminer un chantier</h3></div><p class="text-sm text-gray-500 dark:text-gray-400 mb-4"> Sélectionnez un chantier RLT ou externe pour le marquer comme terminé. </p><div class="flex flex-col sm:flex-row gap-3"><div class="flex-1">`);
      _push(ssrRenderComponent(_component_AppSelect, {
        modelValue: unref(selectedChantierTerminer),
        "onUpdate:modelValue": ($event) => isRef(selectedChantierTerminer) ? selectedChantierTerminer.value = $event : null,
        options: unref(chantiersATerminerOptions),
        placeholder: "Sélectionner un chantier RLT ou externe...",
        nullable: ""
      }, null, _parent));
      _push(`</div>`);
      _push(ssrRenderComponent(_component_AppButtonValidated, {
        validated: !!unref(selectedChantierTerminer),
        theme: "secondary",
        type: "button",
        onClick: handleTerminer
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Terminer`);
          } else {
            return [
              createTextVNode("Terminer")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
      if (unref(chantiersATerminerOptions).length === 0) {
        _push(`<p class="text-sm text-gray-400 dark:text-gray-500 mt-2 italic"> Aucun chantier RLT ou externe disponible. </p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-red-200 dark:border-red-900/30"><div class="flex items-center gap-2 mb-4">`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "lucide:trash-2",
        class: "w-5 h-5 text-red-500"
      }, null, _parent));
      _push(`<h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Supprimer un chantier</h3></div><p class="text-sm text-gray-500 dark:text-gray-400 mb-4"> Sélectionnez un chantier terminé pour le supprimer définitivement. </p><div class="flex flex-col sm:flex-row gap-3"><div class="flex-1">`);
      _push(ssrRenderComponent(_component_AppSelect, {
        modelValue: unref(selectedChantierSupprimer),
        "onUpdate:modelValue": ($event) => isRef(selectedChantierSupprimer) ? selectedChantierSupprimer.value = $event : null,
        options: unref(chantiersTerminesOptions),
        placeholder: "Sélectionner un chantier terminé...",
        nullable: ""
      }, null, _parent));
      _push(`</div>`);
      _push(ssrRenderComponent(_component_AppButtonValidated, {
        validated: !!unref(selectedChantierSupprimer),
        theme: "delete",
        type: "button",
        onClick: handleSupprimer
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Supprimer`);
          } else {
            return [
              createTextVNode("Supprimer")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
      if (unref(chantiersTerminesOptions).length === 0) {
        _push(`<p class="text-sm text-gray-400 dark:text-gray-500 mt-2 italic"> Aucun chantier terminé disponible. </p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
    };
  }
};
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/parametres/chantiers.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const _sfc_main$1 = {
  __name: "ParametresUtilisateurs",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const { getAllUsers, updateUser, createUser, users } = useUsers();
    const { getAllProfilTache, profilTaches } = useProfilTache();
    const { setLoader } = useLoader();
    const { isSuperAdmin } = useLevelUser();
    const globalFilter = ref("");
    const open = ref(false);
    const openAdd = ref(false);
    const user = ref({});
    const newUser = ref({
      email: "",
      nom: "",
      prenom: "",
      profils: -1,
      role: 0,
      pre_op: false,
      ref_du_rdu: false
    });
    const roleOptions = computed(() => {
      const options = [
        { id: 0, label: "Aucun" },
        { id: 1, label: "Admin" }
      ];
      if (isSuperAdmin.value) {
        options.push({ id: 2, label: "SuperAdmin" });
      }
      return options;
    });
    const filteredUsers = computed(() => {
      if (!globalFilter.value) return users.value;
      const search = globalFilter.value.toLowerCase();
      return users.value.filter(
        (u) => u.nom?.toLowerCase().includes(search) || u.prenom?.toLowerCase().includes(search) || u.email?.toLowerCase().includes(search) || u.profil_name?.toLowerCase().includes(search)
      );
    });
    const getRoleLabel = (role) => {
      switch (role) {
        case 2:
          return "SuperAdmin";
        case 1:
          return "Admin";
        default:
          return "Aucun";
      }
    };
    const getRoleBadgeClass = (role) => {
      switch (role) {
        case 2:
          return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
        case 1:
          return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
        default:
          return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
      }
    };
    const validatedFields = computed(() => {
      return true;
    });
    const validatedNewUser = computed(() => {
      return newUser.value.email && newUser.value.email.includes("@");
    });
    const closeSlide = () => {
      open.value = false;
      user.value = {};
    };
    const modifierUser = async () => {
      setLoader(true);
      try {
        await updateUser(user.value);
        closeSlide();
      } finally {
        setLoader(false);
      }
    };
    const openAddSlide = () => {
      newUser.value = {
        email: "",
        nom: "",
        prenom: "",
        profils: -1,
        role: 0,
        pre_op: false,
        ref_du_rdu: false
      };
      openAdd.value = true;
    };
    const closeAddSlide = () => {
      openAdd.value = false;
      newUser.value = {
        email: "",
        nom: "",
        prenom: "",
        profils: -1,
        role: 0,
        pre_op: false,
        ref_du_rdu: false
      };
    };
    const ajouterUser = async () => {
      setLoader(true);
      try {
        const result = await createUser(newUser.value);
        if (result) {
          closeAddSlide();
        }
      } finally {
        setLoader(false);
      }
    };
    setLoader(true);
    try {
      [__temp, __restore] = withAsyncContext(() => Promise.all([
        getAllUsers(),
        getAllProfilTache()
      ])), await __temp, __restore();
    } finally {
      setLoader(false);
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppTitleMain = _sfc_main$7;
      const _component_AppInputSearch = __nuxt_component_1;
      const _component_AppButtonValidated = _sfc_main$2$1;
      const _component_Icon = __nuxt_component_1$1;
      const _component_AppSlideOver = _sfc_main$1$1;
      const _component_AppSlideOverContent = _sfc_main$8;
      const _component_AppInput = _sfc_main$1$2;
      const _component_AppSelect = _sfc_main$9;
      const _component_AppSwitch = _sfc_main$a;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex flex-col w-full h-full gap-4" }, _attrs))}>`);
      _push(ssrRenderComponent(_component_AppTitleMain, {
        title: "Paramètres Utilisateurs",
        description: "Gestion des utilisateurs et de leurs permissions"
      }, null, _parent));
      _push(`<div class="flex flex-col lg:flex-row gap-4 items-center w-full justify-between">`);
      _push(ssrRenderComponent(_component_AppInputSearch, {
        modelValue: unref(globalFilter),
        "onUpdate:modelValue": ($event) => isRef(globalFilter) ? globalFilter.value = $event : null,
        class: "w-full max-w-md",
        size: "lg",
        placeholder: "Rechercher un utilisateur ..."
      }, null, _parent));
      _push(ssrRenderComponent(_component_AppButtonValidated, {
        theme: "primary",
        onClick: openAddSlide
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<span class="flex items-center gap-2"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:user-plus",
              size: "18"
            }, null, _parent2, _scopeId));
            _push2(` Ajouter un utilisateur </span>`);
          } else {
            return [
              createVNode("span", { class: "flex items-center gap-2" }, [
                createVNode(_component_Icon, {
                  name: "lucide:user-plus",
                  size: "18"
                }),
                createTextVNode(" Ajouter un utilisateur ")
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="flex flex-col w-full h-full overflow-hidden rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"><div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"><tr><th class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Utilisateur</th><th class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Profil</th><th class="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-200">Rôle</th><th class="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-200">Pré-Op</th><th class="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-200">RDU</th></tr></thead><tbody class="divide-y divide-gray-100 dark:divide-gray-800"><!--[-->`);
      ssrRenderList(unref(filteredUsers), (u) => {
        _push(`<tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"><td class="px-4 py-3"><div class="flex flex-col"><span class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(u.nom || "—")} ${ssrInterpolate(u.prenom || "")}</span><span class="text-xs text-gray-500 dark:text-gray-400">${ssrInterpolate(u.email || "—")}</span></div></td><td class="px-4 py-3 text-gray-700 dark:text-gray-300">${ssrInterpolate(u.profil_name || "—")}</td><td class="px-4 py-3 text-center"><span class="${ssrRenderClass([getRoleBadgeClass(u.role), "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"])}">${ssrInterpolate(getRoleLabel(u.role))}</span></td><td class="px-4 py-3 text-center">`);
        _push(ssrRenderComponent(_component_Icon, {
          name: u.pre_op ? "lucide:check-circle" : "lucide:x-circle",
          class: u.pre_op ? "text-green-500" : "text-gray-300 dark:text-gray-600",
          size: "18"
        }, null, _parent));
        _push(`</td><td class="px-4 py-3 text-center">`);
        _push(ssrRenderComponent(_component_Icon, {
          name: u.ref_du_rdu ? "lucide:check-circle" : "lucide:x-circle",
          class: u.ref_du_rdu ? "text-green-500" : "text-gray-300 dark:text-gray-600",
          size: "18"
        }, null, _parent));
        _push(`</td></tr>`);
      });
      _push(`<!--]-->`);
      if (unref(filteredUsers).length === 0) {
        _push(`<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">`);
        _push(ssrRenderComponent(_component_Icon, {
          name: "lucide:users",
          class: "w-8 h-8 mx-auto mb-2 opacity-50"
        }, null, _parent));
        _push(`<p>Aucun utilisateur trouvé</p></td></tr>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</tbody></table></div></div>`);
      _push(ssrRenderComponent(_component_AppSlideOver, {
        sideModal: unref(open),
        closeSideModal: closeSlide
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (unref(open)) {
              _push2(ssrRenderComponent(_component_AppSlideOverContent, { closeSideModal: closeSlide }, {
                header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="text-center"${_scopeId2}><div class="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:user-cog",
                      size: "28",
                      class: "text-primary-500"
                    }, null, _parent3, _scopeId2));
                    _push3(`</div><h2 class="text-xl font-semibold text-gray-900 dark:text-white"${_scopeId2}>Modifier l&#39;utilisateur</h2><p class="text-sm text-gray-500 dark:text-gray-400 mt-1"${_scopeId2}>${ssrInterpolate(unref(user).email)}</p></div>`);
                  } else {
                    return [
                      createVNode("div", { class: "text-center" }, [
                        createVNode("div", { class: "w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center" }, [
                          createVNode(_component_Icon, {
                            name: "lucide:user-cog",
                            size: "28",
                            class: "text-primary-500"
                          })
                        ]),
                        createVNode("h2", { class: "text-xl font-semibold text-gray-900 dark:text-white" }, "Modifier l'utilisateur"),
                        createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400 mt-1" }, toDisplayString(unref(user).email), 1)
                      ])
                    ];
                  }
                }),
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<form class="flex flex-col gap-5 w-full"${_scopeId2}><div class="grid grid-cols-1 md:grid-cols-2 gap-4"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_AppInput, {
                      name: "nom",
                      title: "Nom",
                      placeholder: "Nom de l'utilisateur",
                      modelValue: unref(user).nom,
                      "onUpdate:modelValue": ($event) => unref(user).nom = $event
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppInput, {
                      name: "prenom",
                      title: "Prénom",
                      placeholder: "Prénom de l'utilisateur",
                      modelValue: unref(user).prenom,
                      "onUpdate:modelValue": ($event) => unref(user).prenom = $event
                    }, null, _parent3, _scopeId2));
                    _push3(`</div>`);
                    _push3(ssrRenderComponent(_component_AppSelect, {
                      name: "profil",
                      title: "Profil",
                      modelValue: unref(user).profils,
                      "onUpdate:modelValue": ($event) => unref(user).profils = $event,
                      options: unref(profilTaches),
                      placeholder: "Aucun profil"
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppSelect, {
                      name: "role",
                      title: "Rôle",
                      modelValue: unref(user).role,
                      "onUpdate:modelValue": ($event) => unref(user).role = $event,
                      options: unref(roleOptions)
                    }, null, _parent3, _scopeId2));
                    _push3(`<div class="flex flex-col gap-4 pt-2"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_AppSwitch, {
                      modelValue: unref(user).pre_op,
                      "onUpdate:modelValue": ($event) => unref(user).pre_op = $event,
                      name: "pre_op",
                      label: "Pré-Op"
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppSwitch, {
                      modelValue: unref(user).ref_du_rdu,
                      "onUpdate:modelValue": ($event) => unref(user).ref_du_rdu = $event,
                      name: "ref_du_rdu",
                      label: "Référent du RDU"
                    }, null, _parent3, _scopeId2));
                    _push3(`</div></form>`);
                  } else {
                    return [
                      createVNode("form", {
                        onSubmit: withModifiers(modifierUser, ["prevent"]),
                        class: "flex flex-col gap-5 w-full"
                      }, [
                        createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-4" }, [
                          createVNode(_component_AppInput, {
                            name: "nom",
                            title: "Nom",
                            placeholder: "Nom de l'utilisateur",
                            modelValue: unref(user).nom,
                            "onUpdate:modelValue": ($event) => unref(user).nom = $event
                          }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                          createVNode(_component_AppInput, {
                            name: "prenom",
                            title: "Prénom",
                            placeholder: "Prénom de l'utilisateur",
                            modelValue: unref(user).prenom,
                            "onUpdate:modelValue": ($event) => unref(user).prenom = $event
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ]),
                        createVNode(_component_AppSelect, {
                          name: "profil",
                          title: "Profil",
                          modelValue: unref(user).profils,
                          "onUpdate:modelValue": ($event) => unref(user).profils = $event,
                          options: unref(profilTaches),
                          placeholder: "Aucun profil"
                        }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                        createVNode(_component_AppSelect, {
                          name: "role",
                          title: "Rôle",
                          modelValue: unref(user).role,
                          "onUpdate:modelValue": ($event) => unref(user).role = $event,
                          options: unref(roleOptions)
                        }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                        createVNode("div", { class: "flex flex-col gap-4 pt-2" }, [
                          createVNode(_component_AppSwitch, {
                            modelValue: unref(user).pre_op,
                            "onUpdate:modelValue": ($event) => unref(user).pre_op = $event,
                            name: "pre_op",
                            label: "Pré-Op"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                          createVNode(_component_AppSwitch, {
                            modelValue: unref(user).ref_du_rdu,
                            "onUpdate:modelValue": ($event) => unref(user).ref_du_rdu = $event,
                            name: "ref_du_rdu",
                            label: "Référent du RDU"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ])
                      ], 32)
                    ];
                  }
                }),
                footer: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_AppButtonValidated, {
                      theme: "cancel",
                      type: "button",
                      onClick: closeSlide
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
                      validated: unref(validatedFields),
                      onClick: modifierUser
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
                      createVNode("div", { class: "flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700" }, [
                        createVNode(_component_AppButtonValidated, {
                          theme: "cancel",
                          type: "button",
                          onClick: closeSlide
                        }, {
                          default: withCtx(() => [
                            createTextVNode("Annuler")
                          ]),
                          _: 1
                        }),
                        createVNode(_component_AppButtonValidated, {
                          validated: unref(validatedFields),
                          onClick: modifierUser
                        }, {
                          default: withCtx(() => [
                            createTextVNode("Enregistrer")
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
              unref(open) ? (openBlock(), createBlock(_component_AppSlideOverContent, {
                key: 0,
                closeSideModal: closeSlide
              }, {
                header: withCtx(() => [
                  createVNode("div", { class: "text-center" }, [
                    createVNode("div", { class: "w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center" }, [
                      createVNode(_component_Icon, {
                        name: "lucide:user-cog",
                        size: "28",
                        class: "text-primary-500"
                      })
                    ]),
                    createVNode("h2", { class: "text-xl font-semibold text-gray-900 dark:text-white" }, "Modifier l'utilisateur"),
                    createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400 mt-1" }, toDisplayString(unref(user).email), 1)
                  ])
                ]),
                default: withCtx(() => [
                  createVNode("form", {
                    onSubmit: withModifiers(modifierUser, ["prevent"]),
                    class: "flex flex-col gap-5 w-full"
                  }, [
                    createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-4" }, [
                      createVNode(_component_AppInput, {
                        name: "nom",
                        title: "Nom",
                        placeholder: "Nom de l'utilisateur",
                        modelValue: unref(user).nom,
                        "onUpdate:modelValue": ($event) => unref(user).nom = $event
                      }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                      createVNode(_component_AppInput, {
                        name: "prenom",
                        title: "Prénom",
                        placeholder: "Prénom de l'utilisateur",
                        modelValue: unref(user).prenom,
                        "onUpdate:modelValue": ($event) => unref(user).prenom = $event
                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                    ]),
                    createVNode(_component_AppSelect, {
                      name: "profil",
                      title: "Profil",
                      modelValue: unref(user).profils,
                      "onUpdate:modelValue": ($event) => unref(user).profils = $event,
                      options: unref(profilTaches),
                      placeholder: "Aucun profil"
                    }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                    createVNode(_component_AppSelect, {
                      name: "role",
                      title: "Rôle",
                      modelValue: unref(user).role,
                      "onUpdate:modelValue": ($event) => unref(user).role = $event,
                      options: unref(roleOptions)
                    }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                    createVNode("div", { class: "flex flex-col gap-4 pt-2" }, [
                      createVNode(_component_AppSwitch, {
                        modelValue: unref(user).pre_op,
                        "onUpdate:modelValue": ($event) => unref(user).pre_op = $event,
                        name: "pre_op",
                        label: "Pré-Op"
                      }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                      createVNode(_component_AppSwitch, {
                        modelValue: unref(user).ref_du_rdu,
                        "onUpdate:modelValue": ($event) => unref(user).ref_du_rdu = $event,
                        name: "ref_du_rdu",
                        label: "Référent du RDU"
                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                    ])
                  ], 32)
                ]),
                footer: withCtx(() => [
                  createVNode("div", { class: "flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700" }, [
                    createVNode(_component_AppButtonValidated, {
                      theme: "cancel",
                      type: "button",
                      onClick: closeSlide
                    }, {
                      default: withCtx(() => [
                        createTextVNode("Annuler")
                      ]),
                      _: 1
                    }),
                    createVNode(_component_AppButtonValidated, {
                      validated: unref(validatedFields),
                      onClick: modifierUser
                    }, {
                      default: withCtx(() => [
                        createTextVNode("Enregistrer")
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
      _push(ssrRenderComponent(_component_AppSlideOver, {
        sideModal: unref(openAdd),
        closeSideModal: closeAddSlide
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (unref(openAdd)) {
              _push2(ssrRenderComponent(_component_AppSlideOverContent, { closeSideModal: closeAddSlide }, {
                header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="text-center"${_scopeId2}><div class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:user-plus",
                      size: "28",
                      class: "text-green-500"
                    }, null, _parent3, _scopeId2));
                    _push3(`</div><h2 class="text-xl font-semibold text-gray-900 dark:text-white"${_scopeId2}>Ajouter un utilisateur</h2><p class="text-sm text-gray-500 dark:text-gray-400 mt-1"${_scopeId2}>L&#39;utilisateur pourra se connecter avec son compte SNCF</p></div>`);
                  } else {
                    return [
                      createVNode("div", { class: "text-center" }, [
                        createVNode("div", { class: "w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center" }, [
                          createVNode(_component_Icon, {
                            name: "lucide:user-plus",
                            size: "28",
                            class: "text-green-500"
                          })
                        ]),
                        createVNode("h2", { class: "text-xl font-semibold text-gray-900 dark:text-white" }, "Ajouter un utilisateur"),
                        createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400 mt-1" }, "L'utilisateur pourra se connecter avec son compte SNCF")
                      ])
                    ];
                  }
                }),
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<form class="flex flex-col gap-5 w-full"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_AppInput, {
                      name: "email",
                      title: "Email SNCF",
                      placeholder: "prenom.nom@sncf.fr",
                      modelValue: unref(newUser).email,
                      "onUpdate:modelValue": ($event) => unref(newUser).email = $event,
                      required: ""
                    }, null, _parent3, _scopeId2));
                    _push3(`<div class="grid grid-cols-1 md:grid-cols-2 gap-4"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_AppInput, {
                      name: "nom",
                      title: "Nom",
                      placeholder: "Nom de l'utilisateur",
                      modelValue: unref(newUser).nom,
                      "onUpdate:modelValue": ($event) => unref(newUser).nom = $event
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppInput, {
                      name: "prenom",
                      title: "Prénom",
                      placeholder: "Prénom de l'utilisateur",
                      modelValue: unref(newUser).prenom,
                      "onUpdate:modelValue": ($event) => unref(newUser).prenom = $event
                    }, null, _parent3, _scopeId2));
                    _push3(`</div>`);
                    _push3(ssrRenderComponent(_component_AppSelect, {
                      name: "profil",
                      title: "Profil",
                      modelValue: unref(newUser).profils,
                      "onUpdate:modelValue": ($event) => unref(newUser).profils = $event,
                      options: unref(profilTaches),
                      placeholder: "Aucun profil"
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppSelect, {
                      name: "role",
                      title: "Rôle",
                      modelValue: unref(newUser).role,
                      "onUpdate:modelValue": ($event) => unref(newUser).role = $event,
                      options: unref(roleOptions)
                    }, null, _parent3, _scopeId2));
                    _push3(`<div class="flex flex-col gap-4 pt-2"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_AppSwitch, {
                      modelValue: unref(newUser).pre_op,
                      "onUpdate:modelValue": ($event) => unref(newUser).pre_op = $event,
                      name: "new_pre_op",
                      label: "Pré-Op"
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_AppSwitch, {
                      modelValue: unref(newUser).ref_du_rdu,
                      "onUpdate:modelValue": ($event) => unref(newUser).ref_du_rdu = $event,
                      name: "new_ref_du_rdu",
                      label: "Référent du RDU"
                    }, null, _parent3, _scopeId2));
                    _push3(`</div><div class="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"${_scopeId2}><div class="flex items-start gap-2"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:info",
                      size: "16",
                      class: "text-blue-500 mt-0.5"
                    }, null, _parent3, _scopeId2));
                    _push3(`<p class="text-xs text-blue-700 dark:text-blue-300"${_scopeId2}> L&#39;utilisateur sera automatiquement lié à son compte lors de sa première connexion via OIDC SNCF. </p></div></div></form>`);
                  } else {
                    return [
                      createVNode("form", {
                        onSubmit: withModifiers(ajouterUser, ["prevent"]),
                        class: "flex flex-col gap-5 w-full"
                      }, [
                        createVNode(_component_AppInput, {
                          name: "email",
                          title: "Email SNCF",
                          placeholder: "prenom.nom@sncf.fr",
                          modelValue: unref(newUser).email,
                          "onUpdate:modelValue": ($event) => unref(newUser).email = $event,
                          required: ""
                        }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                        createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-4" }, [
                          createVNode(_component_AppInput, {
                            name: "nom",
                            title: "Nom",
                            placeholder: "Nom de l'utilisateur",
                            modelValue: unref(newUser).nom,
                            "onUpdate:modelValue": ($event) => unref(newUser).nom = $event
                          }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                          createVNode(_component_AppInput, {
                            name: "prenom",
                            title: "Prénom",
                            placeholder: "Prénom de l'utilisateur",
                            modelValue: unref(newUser).prenom,
                            "onUpdate:modelValue": ($event) => unref(newUser).prenom = $event
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ]),
                        createVNode(_component_AppSelect, {
                          name: "profil",
                          title: "Profil",
                          modelValue: unref(newUser).profils,
                          "onUpdate:modelValue": ($event) => unref(newUser).profils = $event,
                          options: unref(profilTaches),
                          placeholder: "Aucun profil"
                        }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                        createVNode(_component_AppSelect, {
                          name: "role",
                          title: "Rôle",
                          modelValue: unref(newUser).role,
                          "onUpdate:modelValue": ($event) => unref(newUser).role = $event,
                          options: unref(roleOptions)
                        }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                        createVNode("div", { class: "flex flex-col gap-4 pt-2" }, [
                          createVNode(_component_AppSwitch, {
                            modelValue: unref(newUser).pre_op,
                            "onUpdate:modelValue": ($event) => unref(newUser).pre_op = $event,
                            name: "new_pre_op",
                            label: "Pré-Op"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                          createVNode(_component_AppSwitch, {
                            modelValue: unref(newUser).ref_du_rdu,
                            "onUpdate:modelValue": ($event) => unref(newUser).ref_du_rdu = $event,
                            name: "new_ref_du_rdu",
                            label: "Référent du RDU"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ]),
                        createVNode("div", { class: "p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800" }, [
                          createVNode("div", { class: "flex items-start gap-2" }, [
                            createVNode(_component_Icon, {
                              name: "lucide:info",
                              size: "16",
                              class: "text-blue-500 mt-0.5"
                            }),
                            createVNode("p", { class: "text-xs text-blue-700 dark:text-blue-300" }, " L'utilisateur sera automatiquement lié à son compte lors de sa première connexion via OIDC SNCF. ")
                          ])
                        ])
                      ], 32)
                    ];
                  }
                }),
                footer: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_AppButtonValidated, {
                      theme: "cancel",
                      type: "button",
                      onClick: closeAddSlide
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
                      validated: unref(validatedNewUser),
                      onClick: ajouterUser
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`Créer l&#39;utilisateur`);
                        } else {
                          return [
                            createTextVNode("Créer l'utilisateur")
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(`</div>`);
                  } else {
                    return [
                      createVNode("div", { class: "flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700" }, [
                        createVNode(_component_AppButtonValidated, {
                          theme: "cancel",
                          type: "button",
                          onClick: closeAddSlide
                        }, {
                          default: withCtx(() => [
                            createTextVNode("Annuler")
                          ]),
                          _: 1
                        }),
                        createVNode(_component_AppButtonValidated, {
                          validated: unref(validatedNewUser),
                          onClick: ajouterUser
                        }, {
                          default: withCtx(() => [
                            createTextVNode("Créer l'utilisateur")
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
              unref(openAdd) ? (openBlock(), createBlock(_component_AppSlideOverContent, {
                key: 0,
                closeSideModal: closeAddSlide
              }, {
                header: withCtx(() => [
                  createVNode("div", { class: "text-center" }, [
                    createVNode("div", { class: "w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center" }, [
                      createVNode(_component_Icon, {
                        name: "lucide:user-plus",
                        size: "28",
                        class: "text-green-500"
                      })
                    ]),
                    createVNode("h2", { class: "text-xl font-semibold text-gray-900 dark:text-white" }, "Ajouter un utilisateur"),
                    createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400 mt-1" }, "L'utilisateur pourra se connecter avec son compte SNCF")
                  ])
                ]),
                default: withCtx(() => [
                  createVNode("form", {
                    onSubmit: withModifiers(ajouterUser, ["prevent"]),
                    class: "flex flex-col gap-5 w-full"
                  }, [
                    createVNode(_component_AppInput, {
                      name: "email",
                      title: "Email SNCF",
                      placeholder: "prenom.nom@sncf.fr",
                      modelValue: unref(newUser).email,
                      "onUpdate:modelValue": ($event) => unref(newUser).email = $event,
                      required: ""
                    }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                    createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-4" }, [
                      createVNode(_component_AppInput, {
                        name: "nom",
                        title: "Nom",
                        placeholder: "Nom de l'utilisateur",
                        modelValue: unref(newUser).nom,
                        "onUpdate:modelValue": ($event) => unref(newUser).nom = $event
                      }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                      createVNode(_component_AppInput, {
                        name: "prenom",
                        title: "Prénom",
                        placeholder: "Prénom de l'utilisateur",
                        modelValue: unref(newUser).prenom,
                        "onUpdate:modelValue": ($event) => unref(newUser).prenom = $event
                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                    ]),
                    createVNode(_component_AppSelect, {
                      name: "profil",
                      title: "Profil",
                      modelValue: unref(newUser).profils,
                      "onUpdate:modelValue": ($event) => unref(newUser).profils = $event,
                      options: unref(profilTaches),
                      placeholder: "Aucun profil"
                    }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                    createVNode(_component_AppSelect, {
                      name: "role",
                      title: "Rôle",
                      modelValue: unref(newUser).role,
                      "onUpdate:modelValue": ($event) => unref(newUser).role = $event,
                      options: unref(roleOptions)
                    }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                    createVNode("div", { class: "flex flex-col gap-4 pt-2" }, [
                      createVNode(_component_AppSwitch, {
                        modelValue: unref(newUser).pre_op,
                        "onUpdate:modelValue": ($event) => unref(newUser).pre_op = $event,
                        name: "new_pre_op",
                        label: "Pré-Op"
                      }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                      createVNode(_component_AppSwitch, {
                        modelValue: unref(newUser).ref_du_rdu,
                        "onUpdate:modelValue": ($event) => unref(newUser).ref_du_rdu = $event,
                        name: "new_ref_du_rdu",
                        label: "Référent du RDU"
                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                    ]),
                    createVNode("div", { class: "p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800" }, [
                      createVNode("div", { class: "flex items-start gap-2" }, [
                        createVNode(_component_Icon, {
                          name: "lucide:info",
                          size: "16",
                          class: "text-blue-500 mt-0.5"
                        }),
                        createVNode("p", { class: "text-xs text-blue-700 dark:text-blue-300" }, " L'utilisateur sera automatiquement lié à son compte lors de sa première connexion via OIDC SNCF. ")
                      ])
                    ])
                  ], 32)
                ]),
                footer: withCtx(() => [
                  createVNode("div", { class: "flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700" }, [
                    createVNode(_component_AppButtonValidated, {
                      theme: "cancel",
                      type: "button",
                      onClick: closeAddSlide
                    }, {
                      default: withCtx(() => [
                        createTextVNode("Annuler")
                      ]),
                      _: 1
                    }),
                    createVNode(_component_AppButtonValidated, {
                      validated: unref(validatedNewUser),
                      onClick: ajouterUser
                    }, {
                      default: withCtx(() => [
                        createTextVNode("Créer l'utilisateur")
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
      _push(`</div>`);
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/parametres/utilisateurs.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = {
  __name: "parametres",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({
      title: "H00 - Paramètres",
      description: "Paramètres de l'application"
    });
    const { isSuperAdmin } = useLevelUser();
    const { users } = useUsers();
    const totalUsers = computed(() => {
      return users.value?.length || 0;
    });
    const selectedNav = ref(1);
    const items = computed(() => {
      const allItems = [
        {
          label: "Tâches",
          icon: "i-lucide-clipboard-list",
          value: 1,
          requiresSuperAdmin: true
        },
        {
          label: "Catégories",
          icon: "i-lucide-folder-tree",
          value: 2,
          requiresSuperAdmin: true
        },
        {
          label: "Chantiers",
          icon: "i-lucide-building-2",
          value: 3,
          requiresSuperAdmin: false
        },
        {
          label: "Utilisateurs",
          icon: "i-lucide-users",
          value: 4,
          badge: totalUsers.value > 0 ? totalUsers.value.toString() : void 0,
          requiresSuperAdmin: false
        }
      ];
      return allItems.filter((item) => {
        if (item.requiresSuperAdmin) {
          return isSuperAdmin.value;
        }
        return true;
      });
    });
    watch(items, (newItems) => {
      const availableValues = newItems.map((item) => item.value);
      if (!availableValues.includes(selectedNav.value)) {
        selectedNav.value = availableValues[0] || 1;
      }
    }, { immediate: true });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppPageLayout = __nuxt_component_0;
      const _component_AppLeftNavBar = _sfc_main$6;
      const _component_ParametresTaches = _sfc_main$4;
      const _component_ParametresCategories = _sfc_main$3;
      const _component_ParametresChantiers = _sfc_main$2;
      const _component_ParametresUtilisateurs = _sfc_main$1;
      _push(ssrRenderComponent(_component_AppPageLayout, _attrs, {
        sidebar: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_AppLeftNavBar, {
              modelValue: unref(selectedNav),
              "onUpdate:modelValue": ($event) => isRef(selectedNav) ? selectedNav.value = $event : null,
              items: unref(items),
              title: "Sommaire"
            }, null, _parent2, _scopeId));
          } else {
            return [
              createVNode(_component_AppLeftNavBar, {
                modelValue: unref(selectedNav),
                "onUpdate:modelValue": ($event) => isRef(selectedNav) ? selectedNav.value = $event : null,
                items: unref(items),
                title: "Sommaire"
              }, null, 8, ["modelValue", "onUpdate:modelValue", "items"])
            ];
          }
        }),
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (unref(selectedNav) === 1 && unref(isSuperAdmin)) {
              _push2(ssrRenderComponent(_component_ParametresTaches, null, null, _parent2, _scopeId));
            } else {
              _push2(`<!---->`);
            }
            if (unref(selectedNav) === 2 && unref(isSuperAdmin)) {
              _push2(ssrRenderComponent(_component_ParametresCategories, null, null, _parent2, _scopeId));
            } else {
              _push2(`<!---->`);
            }
            if (unref(selectedNav) === 3) {
              _push2(ssrRenderComponent(_component_ParametresChantiers, null, null, _parent2, _scopeId));
            } else {
              _push2(`<!---->`);
            }
            if (unref(selectedNav) === 4) {
              _push2(ssrRenderComponent(_component_ParametresUtilisateurs, null, null, _parent2, _scopeId));
            } else {
              _push2(`<!---->`);
            }
            if ((unref(selectedNav) === 1 || unref(selectedNav) === 2) && !unref(isSuperAdmin)) {
              _push2(`<div class="flex items-center justify-center min-h-[400px]"${_scopeId}><div class="text-center space-y-4"${_scopeId}><div class="text-4xl"${_scopeId}>🔒</div><h2 class="text-xl font-semibold"${_scopeId}>Accès restreint</h2><p class="text-muted"${_scopeId}>Vous devez être super administrateur pour accéder à cette section.</p></div></div>`);
            } else {
              _push2(`<!---->`);
            }
          } else {
            return [
              unref(selectedNav) === 1 && unref(isSuperAdmin) ? (openBlock(), createBlock(_component_ParametresTaches, { key: 0 })) : createCommentVNode("", true),
              unref(selectedNav) === 2 && unref(isSuperAdmin) ? (openBlock(), createBlock(_component_ParametresCategories, { key: 1 })) : createCommentVNode("", true),
              unref(selectedNav) === 3 ? (openBlock(), createBlock(_component_ParametresChantiers, { key: 2 })) : createCommentVNode("", true),
              unref(selectedNav) === 4 ? (openBlock(), createBlock(_component_ParametresUtilisateurs, { key: 3 })) : createCommentVNode("", true),
              (unref(selectedNav) === 1 || unref(selectedNav) === 2) && !unref(isSuperAdmin) ? (openBlock(), createBlock("div", {
                key: 4,
                class: "flex items-center justify-center min-h-[400px]"
              }, [
                createVNode("div", { class: "text-center space-y-4" }, [
                  createVNode("div", { class: "text-4xl" }, "🔒"),
                  createVNode("h2", { class: "text-xl font-semibold" }, "Accès restreint"),
                  createVNode("p", { class: "text-muted" }, "Vous devez être super administrateur pour accéder à cette section.")
                ])
              ])) : createCommentVNode("", true)
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/parametres.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=parametres-BhDIOEAq.mjs.map
