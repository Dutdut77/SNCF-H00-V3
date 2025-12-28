import { j as _export_sfc, k as __nuxt_component_0$1, d as __nuxt_component_1 } from './server.mjs';
import { ref, watch, computed, mergeProps, unref, withCtx, createVNode, createBlock, createCommentVNode, toDisplayString, openBlock, Fragment, renderList, isRef, createTextVNode, withDirectives, vModelText, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderTeleport, ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrIncludeBooleanAttr, ssrRenderClass, ssrRenderSlot, ssrRenderStyle } from 'vue/server-renderer';
import { a as _sfc_main$6, _ as _sfc_main$1$1 } from './modal-DW8NcVL0.mjs';
import { a as __nuxt_component_6$1, _ as __nuxt_component_3 } from './selectMultiple-BvatzygK.mjs';
import { _ as _sfc_main$5 } from './select-CBkAiapS.mjs';

const _sfc_main$4 = {
  __name: "AppDrawer",
  __ssrInlineRender: true,
  props: {
    drawerOpen: {
      type: Boolean,
      required: true
    },
    closeDrawer: {
      type: Function,
      required: true
    },
    fixedHeight: {
      type: String,
      default: null
    }
  },
  setup(__props) {
    const props = __props;
    return (_ctx, _push, _parent, _attrs) => {
      const _component_client_only = __nuxt_component_0$1;
      _push(`<section${ssrRenderAttrs(_attrs)}>`);
      ssrRenderTeleport(_push, (_push2) => {
        if (props.drawerOpen) {
          _push2(`<div class="absolute top-0 left-0 z-60 h-dvh w-full bg-slate-800/80 backdrop-blur-sm"></div>`);
        } else {
          _push2(`<!---->`);
        }
        _push2(ssrRenderComponent(_component_client_only, null, {}, _parent));
      }, "body", false, _parent);
      _push(`</section>`);
    };
  }
};
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/app/drawer.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const _sfc_main$3 = {
  __name: "AppDrawerContent",
  __ssrInlineRender: true,
  props: {
    drawerOpen: {
      type: Boolean,
      required: true
    },
    closeDrawer: {
      type: Function,
      required: true
    },
    swipeThreshold: {
      type: Number,
      default: 100
    },
    fixedHeight: {
      type: String,
      default: null
    },
    heightClass: {
      type: String,
      default: null
    }
  },
  setup(__props) {
    const props = __props;
    const drawerRef = ref(null);
    ref(null);
    const dragOffset = ref(0);
    ref(0);
    ref(false);
    watch(
      () => props.drawerOpen,
      (newVal) => {
        if (newVal) {
          dragOffset.value = 0;
        }
      }
    );
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        ref_key: "drawerRef",
        ref: drawerRef,
        class: ["w-full overflow-hidden rounded-t-2xl bg-white shadow-2xl", [props.heightClass ? props.heightClass : props.fixedHeight ? "h-full" : ""]],
        style: { transform: `translateY(${unref(dragOffset)}px)` }
      }, _attrs))} data-v-066b5809><div class="flex cursor-grab justify-center pt-3 active:cursor-grabbing" data-v-066b5809><div class="h-1.5 w-12 rounded-full bg-gray-300" data-v-066b5809></div></div><div class="${ssrRenderClass([[
        props.heightClass ? "h-[calc(100%-40px)]" : props.fixedHeight ? "h-[calc(100%-40px)]" : "max-h-[calc(90vh-40px)]"
      ], "overflow-y-auto p-4"])}" data-v-066b5809>`);
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`</div></div>`);
    };
  }
};
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/app/drawerContent.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const __nuxt_component_6 = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["__scopeId", "data-v-066b5809"]]);
const _sfc_main$2 = {
  __name: "AppStepBar",
  __ssrInlineRender: true,
  props: {
    steps: {
      type: Array,
      required: true
    },
    initialStep: {
      type: Number,
      default: 0
    },
    showButtons: {
      type: Boolean,
      default: true
    },
    validateStep: {
      type: Function,
      default: null
    }
  },
  emits: ["update:currentStep", "complete", "step-change"],
  setup(__props, { expose: __expose, emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const currentStep = ref(props.initialStep);
    const previousStepIndex = ref(props.initialStep);
    const visitedSteps = ref(/* @__PURE__ */ new Set([props.initialStep]));
    const canGoToNextStep = computed(() => {
      if (!props.validateStep) return true;
      return props.validateStep(currentStep.value);
    });
    computed(() => {
      return currentStep.value > previousStepIndex.value ? "slide-left" : "slide-right";
    });
    const getStepClasses = (index) => {
      if (index < currentStep.value) {
        return "border-primary-600 bg-primary-600 dark:border-primary-500 dark:bg-primary-500";
      } else if (index === currentStep.value) {
        return "border-primary-600 bg-white dark:border-primary-500 dark:bg-gray-800";
      } else {
        return "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800";
      }
    };
    const getStepTextClasses = (index) => {
      if (index === currentStep.value) {
        return "text-primary-600 dark:text-primary-500";
      } else {
        return "text-gray-500 dark:text-gray-400";
      }
    };
    const isStepClickable = (index) => {
      if (index === currentStep.value) {
        return true;
      }
      if (visitedSteps.value.has(index)) {
        return true;
      }
      if (index === currentStep.value + 1) {
        return canGoToNextStep.value;
      }
      return false;
    };
    const goToStep = (index) => {
      if (!isStepClickable(index)) {
        return;
      }
      previousStepIndex.value = currentStep.value;
      visitedSteps.value.add(index);
      emit("step-change", currentStep.value, index);
      currentStep.value = index;
      emit("update:currentStep", index);
    };
    const nextStep = (index) => {
      if (typeof index === "number") {
        goToStep(index);
        return;
      }
      if (currentStep.value < props.steps.length - 1) {
        const isValid = props.validateStep ? props.validateStep(currentStep.value) : true;
        if (isValid) {
          goToStep(currentStep.value + 1);
        }
      }
    };
    const previousStep = () => {
      if (currentStep.value > 0) {
        goToStep(currentStep.value - 1);
      }
    };
    __expose({
      currentStep,
      nextStep,
      previousStep,
      goToStep
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex w-full flex-col" }, _attrs))} data-v-1228e917><nav aria-label="Progress" data-v-1228e917><ol class="mx-auto flex items-center justify-between" data-v-1228e917><!--[-->`);
      ssrRenderList(props.steps, (step, index) => {
        _push(`<li class="${ssrRenderClass(["relative flex-1", index !== props.steps.length - 1 ? "pr-8 sm:pr-20" : ""])}" data-v-1228e917>`);
        if (index !== props.steps.length) {
          _push(`<div class="absolute top-5 right-0 left-0 -mr-8 w-full sm:-mr-20" aria-hidden="true" data-v-1228e917><div class="h-0.5 w-full bg-gray-200 dark:bg-gray-700" data-v-1228e917><div class="${ssrRenderClass([
            "h-0.5 transition-all duration-500 ease-out",
            index < currentStep.value ? "bg-primary-600 dark:bg-primary-500" : "bg-gray-200 dark:bg-gray-700"
          ])}" style="${ssrRenderStyle({ width: index < currentStep.value ? "100%" : "0%" })}" data-v-1228e917></div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<button type="button"${ssrIncludeBooleanAttr(!isStepClickable(index)) ? " disabled" : ""} class="${ssrRenderClass([[
          "group relative flex flex-col items-center transition-all duration-300",
          isStepClickable(index) ? "cursor-pointer" : "cursor-not-allowed"
        ], "w-full"])}" data-step-button="true" data-v-1228e917><div class="${ssrRenderClass([
          "flex h-10 w-10 transform items-center justify-center rounded-full border-2 transition-all duration-300",
          getStepClasses(index),
          currentStep.value === index && "scale-110 shadow-lg",
          isStepClickable(index) && "group-hover:scale-105"
        ])}" data-v-1228e917>`);
        if (index < currentStep.value) {
          _push(`<svg class="h-5 w-5 text-white transition-transform duration-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" data-v-1228e917><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" data-v-1228e917></path></svg>`);
        } else {
          _push(`<span class="${ssrRenderClass(["text-sm font-semibold transition-colors duration-300", getStepTextClasses(index)])}" data-v-1228e917>${ssrInterpolate(index + 1)}</span>`);
        }
        _push(`</div><span class="${ssrRenderClass([
          "mt-2 text-center text-xs font-medium transition-colors duration-300 sm:text-sm",
          currentStep.value === index ? "text-primary-600 dark:text-primary-500" : index < currentStep.value ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"
        ])}" data-v-1228e917>${ssrInterpolate(step.label)}</span>`);
        if (step.description) {
          _push(`<span class="mt-1 hidden text-center text-xs text-gray-500 sm:block dark:text-gray-400" data-v-1228e917>${ssrInterpolate(step.description)}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</button></li>`);
      });
      _push(`<!--]--></ol></nav><div class="pt-12" data-v-1228e917><div class="min-h-[200px]" data-v-1228e917>`);
      ssrRenderSlot(_ctx.$slots, `step-${currentStep.value}`, {
        step: __props.steps[currentStep.value],
        stepIndex: currentStep.value
      }, () => {
        _push(`<div class="flex text-center text-gray-500 dark:text-gray-400" data-v-1228e917> Contenu de l&#39;étape ${ssrInterpolate(__props.steps[currentStep.value]?.label)}</div>`);
      }, _push, _parent);
      _push(`</div></div>`);
      if (__props.showButtons) {
        _push(`<div class="mt-auto flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700" data-v-1228e917><button${ssrIncludeBooleanAttr(currentStep.value === 0) ? " disabled" : ""} class="${ssrRenderClass([
          "inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300",
          currentStep.value === 0 ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600" : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        ])}" data-v-1228e917><svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" data-v-1228e917><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" data-v-1228e917></path></svg> Précédent </button><div class="text-sm text-gray-600 dark:text-gray-400" data-v-1228e917>Étape ${ssrInterpolate(currentStep.value + 1)} sur ${ssrInterpolate(__props.steps.length)}</div>`);
        if (currentStep.value < __props.steps.length - 1) {
          _push(`<button${ssrIncludeBooleanAttr(!canGoToNextStep.value) ? " disabled" : ""} class="${ssrRenderClass([
            "text-shadow-xl relative inline-flex h-auto rounded-lg px-4 py-2 text-center text-sm font-medium duration-300",
            canGoToNextStep.value ? "hover:shadow-primary-500/30 from-primary-400 to-primary-600 cursor-pointer bg-linear-to-br text-white hover:shadow-lg" : "cursor-not-allowed bg-gray-200 text-gray-600"
          ])}" data-v-1228e917> Suivant <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" data-v-1228e917><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" data-v-1228e917></path></svg></button>`);
        } else {
          _push(`<button${ssrIncludeBooleanAttr(!canGoToNextStep.value) ? " disabled" : ""} class="${ssrRenderClass([
            "inline-flex transform items-center gap-2 rounded-lg px-6 py-2 text-sm font-medium text-white transition-all duration-300",
            canGoToNextStep.value ? "bg-green-600 hover:scale-105 hover:bg-green-700 hover:shadow-lg dark:bg-green-500 dark:hover:bg-green-600" : "cursor-not-allowed bg-gray-300 dark:bg-gray-600"
          ])}" data-v-1228e917><svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" data-v-1228e917><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" data-v-1228e917></path></svg> Terminer </button>`);
        }
        _push(`</div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/app/stepBar.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_0 = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["__scopeId", "data-v-1228e917"]]);
const _sfc_main$1 = {
  __name: "AppAvatar",
  __ssrInlineRender: true,
  props: {
    nom: { type: String, default: "" },
    prenom: { type: String, default: "" },
    color: { type: String, default: "bg-sky-500" },
    // <<< couleur passée par props
    size: { type: String, default: "md" },
    // sm | md | lg
    rounded: { type: Boolean, default: true }
  },
  setup(__props) {
    const props = __props;
    const SIZE_MAP = {
      xs: "h-6 w-6 text-xs",
      sm: "h-8 w-8 text-sm",
      md: "h-10 w-10 text-base",
      lg: "h-14 w-14 text-xl",
      xl: "h-16 w-16 text-2xl",
      xxl: "h-20 w-20 text-3xl"
    };
    function makeInitials(nom = "", prenom = "") {
      nom = nom.trim();
      prenom = prenom.trim();
      if (prenom && nom) return (prenom[0] + nom[0]).toUpperCase();
      const full = (prenom + " " + nom).trim();
      if (!full) return "?";
      return full.slice(0, 2).toUpperCase();
    }
    const initials = computed(() => makeInitials(props.nom, props.prenom));
    const sizeClass = computed(() => SIZE_MAP[props.size] || SIZE_MAP.md);
    const shapeClass = computed(() => props.rounded ? "rounded-full" : "rounded");
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: [
          props.color,
          // <<< couleur choisie
          sizeClass.value,
          shapeClass.value,
          "flex items-center justify-center font-medium shadow-sm select-none"
        ]
      }, _attrs))}>${ssrInterpolate(initials.value)}</div>`);
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/app/avatar.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = {
  __name: "ChantierForm",
  __ssrInlineRender: true,
  props: {
    // Données du chantier
    modelValue: {
      type: Object,
      required: true
    },
    // Mode édition ou création
    isEditMode: {
      type: Boolean,
      default: false
    },
    // Données pour les selects
    usersRltVoie: { type: Array, default: () => [] },
    usersRltSes: { type: Array, default: () => [] },
    usersRltCat: { type: Array, default: () => [] },
    usersLogistique: { type: Array, default: () => [] },
    usersKvVoie: { type: Array, default: () => [] },
    usersKvSes: { type: Array, default: () => [] },
    usersKvCat: { type: Array, default: () => [] },
    usersPreopVoie: { type: Array, default: () => [] },
    usersPreopSes: { type: Array, default: () => [] },
    usersRefRdu: { type: Array, default: () => [] },
    users: { type: Array, default: () => [] },
    taches: { type: Array, default: () => [] },
    // État de soumission
    isSubmitting: { type: Boolean, default: false }
  },
  emits: ["submit", "cancel"],
  setup(__props, { emit: __emit }) {
    const emit = __emit;
    const props = __props;
    const formData = ref({ ...props.modelValue });
    watch(
      () => props.modelValue,
      (newVal) => {
        formData.value = { ...newVal };
      },
      { deep: true }
    );
    const isRealisationAdd = ref(false);
    const isPreparationAdd = ref(false);
    const isWeekendAdd = ref(false);
    const newWeekend = ref({
      semaineDebut: null,
      anneeDebut: (/* @__PURE__ */ new Date()).getFullYear()
    });
    const steps = [
      { label: "Généralités", description: "Les informations générales" },
      { label: "Périodes", description: "Dates programmées du chantier" },
      { label: "Contacts", description: "Les contacts travaux du chantier" },
      { label: "Récapitulatif", description: "Récapitulatif des données du chantier" }
    ];
    const isStep1Valid = computed(() => {
      return formData.value.name?.trim() !== "" && formData.value.compte?.trim() !== "" && formData.value.entite?.trim() !== "";
    });
    const isStep2Valid = computed(() => {
      return formData.value.realisation?.length > 0;
    });
    const isStep3Valid = computed(() => true);
    const validateCurrentStep = (stepIndex) => {
      if (props.isEditMode) return true;
      switch (stepIndex) {
        case 0:
          return isStep1Valid.value;
        case 1:
          return isStep2Valid.value;
        case 2:
          return isStep3Valid.value;
        default:
          return true;
      }
    };
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
    const formatTimestampToDisplay = (timestamp) => {
      if (!timestamp) return "-";
      const date = new Date(timestamp);
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      });
    };
    const userOptions = (users) => {
      if (users?.length > 0) {
        return users.map((u) => ({
          id: u.id,
          label: u.prenom && u.nom ? `${u.prenom} ${u.nom}` : u.email
        }));
      }
      return [];
    };
    const getUserInfoById = (userId) => {
      if (!userId || !props.users) return null;
      const user = props.users.find((u) => u.id === userId);
      if (!user) return null;
      return {
        nom: user.nom || "",
        prenom: user.prenom || "",
        fullName: user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.email || "-"
      };
    };
    const handleAddRealisationFromPicker = (range) => {
      formData.value.realisation.push({
        date_start: range.date_start,
        date_end: range.date_end
      });
      isRealisationAdd.value = false;
    };
    const handleDeleteRealisation = (index) => {
      formData.value.realisation.splice(index, 1);
    };
    const handleAddPreparationFromPicker = (range) => {
      formData.value.preparation.push({
        date_start: range.date_start,
        date_end: range.date_end
      });
      isPreparationAdd.value = false;
    };
    const handleDeletePreparation = (index) => {
      formData.value.preparation.splice(index, 1);
    };
    const handleAddWeekend = () => {
      if (!newWeekend.value.semaineDebut) return;
      const { semaine: semaineFin, annee: anneeFin } = getNextWeek(
        newWeekend.value.semaineDebut,
        newWeekend.value.anneeDebut
      );
      formData.value.weekends.push({
        debutSemaine: newWeekend.value.semaineDebut,
        debutAnnee: newWeekend.value.anneeDebut,
        finSemaine: semaineFin,
        finAnnee: anneeFin
      });
      isWeekendAdd.value = false;
      newWeekend.value = { semaineDebut: null, anneeDebut: (/* @__PURE__ */ new Date()).getFullYear() };
    };
    const handleDeleteWeekend = (index) => {
      formData.value.weekends.splice(index, 1);
    };
    const handleComplete = () => {
      emit("submit", formData.value);
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppStepBar = __nuxt_component_0;
      const _component_Icon = __nuxt_component_1;
      const _component_AppInput = _sfc_main$1$1;
      const _component_AppDatePickerRange = __nuxt_component_3;
      const _component_AppModal = _sfc_main$6;
      const _component_AppSelect = _sfc_main$5;
      const _component_AppSelectMultiple = __nuxt_component_6$1;
      const _component_AppAvatar = _sfc_main$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex h-full flex-col space-y-4" }, _attrs))}><div>`);
      if (__props.isEditMode) {
        _push(`<p class="font-[Traverse] text-2xl font-semibold text-gray-800">${ssrInterpolate(unref(formData).compte)} - ${ssrInterpolate(unref(formData).name)}</p>`);
      } else {
        _push(`<p class="font-[Traverse] text-2xl font-semibold text-gray-800">Ajouter un chantier</p>`);
      }
      if (__props.isEditMode) {
        _push(`<p class="text-muted text-sm text-gray-700 italic">Modifier les informations du chantier</p>`);
      } else {
        _push(`<p class="text-muted text-sm text-gray-700 italic">Ajoutez un nouveau chantier au plan de charge</p>`);
      }
      _push(`</div><div class="flex h-full flex-1 lg:px-8">`);
      _push(ssrRenderComponent(_component_AppStepBar, {
        steps,
        "show-buttons": true,
        "validate-step": validateCurrentStep,
        "initial-step": 0,
        onComplete: handleComplete
      }, {
        "step-0": withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="grid w-full grid-cols-1 gap-4 lg:grid-cols-3"${_scopeId}><div class="flex flex-col"${_scopeId}><div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:tag",
              size: "16",
              class: "text-primary-500"
            }, null, _parent2, _scopeId));
            _push2(`<h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId}>Entité</h3></div><div class="flex flex-1 flex-col justify-center space-y-4 pt-4"${_scopeId}><div class="grid h-full grid-cols-2 gap-3"${_scopeId}><button type="button" class="${ssrRenderClass([
              unref(formData).entite === "uo_travaux" ? "border-primary-500 dark:bg-primary-900/20 bg-blue-50" : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600",
              "relative rounded-xl border-2 p-2 transition-all duration-200"
            ])}"${_scopeId}><div class="flex items-center gap-2"${_scopeId}><div class="${ssrRenderClass([
              unref(formData).entite === "uo_travaux" ? "bg-primary-500 text-white" : "bg-gray-200 text-gray-500 dark:bg-gray-700",
              "flex h-8 w-8 items-center justify-center rounded-full"
            ])}"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:home",
              size: "20"
            }, null, _parent2, _scopeId));
            _push2(`</div><span class="${ssrRenderClass([
              unref(formData).entite === "uo_travaux" ? "text-primary-700 dark:text-primary-400" : "text-gray-600 dark:text-gray-400",
              "text-sm font-medium"
            ])}"${_scopeId}> UO Travaux </span></div>`);
            if (unref(formData).entite === "uo_travaux") {
              _push2(`<div class="bg-primary-500 absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full"${_scopeId}>`);
              _push2(ssrRenderComponent(_component_Icon, {
                name: "lucide:check",
                size: "12",
                class: "text-white"
              }, null, _parent2, _scopeId));
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</button><button type="button" class="${ssrRenderClass([
              unref(formData).entite === "autre" ? "border-red-500 bg-red-50 dark:bg-red-900/20" : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600",
              "relative h-full rounded-xl border-2 p-2 transition-all duration-200"
            ])}"${_scopeId}><div class="flex items-center gap-2"${_scopeId}><div class="${ssrRenderClass([
              unref(formData).entite === "autre" ? "bg-red-500 text-white" : "bg-gray-200 text-gray-500 dark:bg-gray-700",
              "flex h-8 w-8 items-center justify-center rounded-full"
            ])}"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:external-link",
              size: "20"
            }, null, _parent2, _scopeId));
            _push2(`</div><span class="${ssrRenderClass([
              unref(formData).entite === "autre" ? "text-red-700 dark:text-red-400" : "text-gray-600 dark:text-gray-400",
              "text-sm font-medium"
            ])}"${_scopeId}> Autre </span></div>`);
            if (unref(formData).entite === "autre") {
              _push2(`<div class="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500"${_scopeId}>`);
              _push2(ssrRenderComponent(_component_Icon, {
                name: "lucide:check",
                size: "12",
                class: "text-white"
              }, null, _parent2, _scopeId));
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</button></div>`);
            if (unref(formData).entite === "autre") {
              _push2(`<div class="flex items-center gap-2 text-sm text-red-500 italic"${_scopeId}>`);
              _push2(ssrRenderComponent(_component_Icon, {
                name: "lucide:triangle-alert",
                size: "16",
                class: "text-red-600"
              }, null, _parent2, _scopeId));
              _push2(` Attention, aucune tache H00 ne sera ajoutée pour ce chantier. </div>`);
            } else {
              _push2(`<div class="flex items-center gap-2 text-sm text-gray-500 italic"${_scopeId}>`);
              _push2(ssrRenderComponent(_component_Icon, {
                name: "lucide:info",
                size: "16",
                class: "text-gray-600"
              }, null, _parent2, _scopeId));
              _push2(` Toutes les taches H00 seront ajoutées pour ce chantier. </div>`);
            }
            _push2(`</div></div><div class="flex flex-col"${_scopeId}><div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:building-2",
              size: "16",
              class: "text-primary-500"
            }, null, _parent2, _scopeId));
            _push2(`<h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId}> Identification </h3></div><div class="flex flex-1 flex-col justify-center space-y-4 pt-4"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_AppInput, {
              modelValue: unref(formData).compte,
              "onUpdate:modelValue": ($event) => unref(formData).compte = $event,
              name: "compte",
              title: "Compte",
              required: "",
              placeholder: "Numéro de compte"
            }, null, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_AppInput, {
              modelValue: unref(formData).name,
              "onUpdate:modelValue": ($event) => unref(formData).name = $event,
              name: "name",
              title: "Intitulé du chantier",
              required: "",
              placeholder: "Nom du chantier"
            }, null, _parent2, _scopeId));
            _push2(`</div></div><div class="flex flex-col"${_scopeId}><div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:file-text",
              size: "16",
              class: "text-primary-500"
            }, null, _parent2, _scopeId));
            _push2(`<h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId}>Autre</h3></div><div class="flex flex-1 flex-col pt-4"${_scopeId}><label for="autre" class="mb-0.5 block text-sm"${_scopeId}>Informations complémentaires</label><textarea id="autre" name="autre" class="focus:border-primary-500 focus:ring-primary-500 min-h-[100px] w-full flex-1 resize-none appearance-none rounded-md border border-gray-300 px-3 py-2 text-sm leading-tight text-gray-700 focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200" placeholder="Notes, remarques, informations diverses..."${_scopeId}>${ssrInterpolate(unref(formData).autre)}</textarea></div></div></div>`);
          } else {
            return [
              createVNode("div", { class: "grid w-full grid-cols-1 gap-4 lg:grid-cols-3" }, [
                createVNode("div", { class: "flex flex-col" }, [
                  createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                    createVNode(_component_Icon, {
                      name: "lucide:tag",
                      size: "16",
                      class: "text-primary-500"
                    }),
                    createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, "Entité")
                  ]),
                  createVNode("div", { class: "flex flex-1 flex-col justify-center space-y-4 pt-4" }, [
                    createVNode("div", { class: "grid h-full grid-cols-2 gap-3" }, [
                      createVNode("button", {
                        type: "button",
                        onClick: ($event) => unref(formData).entite = "uo_travaux",
                        class: [
                          "relative rounded-xl border-2 p-2 transition-all duration-200",
                          unref(formData).entite === "uo_travaux" ? "border-primary-500 dark:bg-primary-900/20 bg-blue-50" : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                        ]
                      }, [
                        createVNode("div", { class: "flex items-center gap-2" }, [
                          createVNode("div", {
                            class: [
                              "flex h-8 w-8 items-center justify-center rounded-full",
                              unref(formData).entite === "uo_travaux" ? "bg-primary-500 text-white" : "bg-gray-200 text-gray-500 dark:bg-gray-700"
                            ]
                          }, [
                            createVNode(_component_Icon, {
                              name: "lucide:home",
                              size: "20"
                            })
                          ], 2),
                          createVNode("span", {
                            class: [
                              "text-sm font-medium",
                              unref(formData).entite === "uo_travaux" ? "text-primary-700 dark:text-primary-400" : "text-gray-600 dark:text-gray-400"
                            ]
                          }, " UO Travaux ", 2)
                        ]),
                        unref(formData).entite === "uo_travaux" ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "bg-primary-500 absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full"
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
                        onClick: ($event) => unref(formData).entite = "autre",
                        class: [
                          "relative h-full rounded-xl border-2 p-2 transition-all duration-200",
                          unref(formData).entite === "autre" ? "border-red-500 bg-red-50 dark:bg-red-900/20" : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                        ]
                      }, [
                        createVNode("div", { class: "flex items-center gap-2" }, [
                          createVNode("div", {
                            class: [
                              "flex h-8 w-8 items-center justify-center rounded-full",
                              unref(formData).entite === "autre" ? "bg-red-500 text-white" : "bg-gray-200 text-gray-500 dark:bg-gray-700"
                            ]
                          }, [
                            createVNode(_component_Icon, {
                              name: "lucide:external-link",
                              size: "20"
                            })
                          ], 2),
                          createVNode("span", {
                            class: [
                              "text-sm font-medium",
                              unref(formData).entite === "autre" ? "text-red-700 dark:text-red-400" : "text-gray-600 dark:text-gray-400"
                            ]
                          }, " Autre ", 2)
                        ]),
                        unref(formData).entite === "autre" ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500"
                        }, [
                          createVNode(_component_Icon, {
                            name: "lucide:check",
                            size: "12",
                            class: "text-white"
                          })
                        ])) : createCommentVNode("", true)
                      ], 10, ["onClick"])
                    ]),
                    unref(formData).entite === "autre" ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "flex items-center gap-2 text-sm text-red-500 italic"
                    }, [
                      createVNode(_component_Icon, {
                        name: "lucide:triangle-alert",
                        size: "16",
                        class: "text-red-600"
                      }),
                      createTextVNode(" Attention, aucune tache H00 ne sera ajoutée pour ce chantier. ")
                    ])) : (openBlock(), createBlock("div", {
                      key: 1,
                      class: "flex items-center gap-2 text-sm text-gray-500 italic"
                    }, [
                      createVNode(_component_Icon, {
                        name: "lucide:info",
                        size: "16",
                        class: "text-gray-600"
                      }),
                      createTextVNode(" Toutes les taches H00 seront ajoutées pour ce chantier. ")
                    ]))
                  ])
                ]),
                createVNode("div", { class: "flex flex-col" }, [
                  createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                    createVNode(_component_Icon, {
                      name: "lucide:building-2",
                      size: "16",
                      class: "text-primary-500"
                    }),
                    createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " Identification ")
                  ]),
                  createVNode("div", { class: "flex flex-1 flex-col justify-center space-y-4 pt-4" }, [
                    createVNode(_component_AppInput, {
                      modelValue: unref(formData).compte,
                      "onUpdate:modelValue": ($event) => unref(formData).compte = $event,
                      name: "compte",
                      title: "Compte",
                      required: "",
                      placeholder: "Numéro de compte"
                    }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                    createVNode(_component_AppInput, {
                      modelValue: unref(formData).name,
                      "onUpdate:modelValue": ($event) => unref(formData).name = $event,
                      name: "name",
                      title: "Intitulé du chantier",
                      required: "",
                      placeholder: "Nom du chantier"
                    }, null, 8, ["modelValue", "onUpdate:modelValue"])
                  ])
                ]),
                createVNode("div", { class: "flex flex-col" }, [
                  createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                    createVNode(_component_Icon, {
                      name: "lucide:file-text",
                      size: "16",
                      class: "text-primary-500"
                    }),
                    createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, "Autre")
                  ]),
                  createVNode("div", { class: "flex flex-1 flex-col pt-4" }, [
                    createVNode("label", {
                      for: "autre",
                      class: "mb-0.5 block text-sm"
                    }, "Informations complémentaires"),
                    withDirectives(createVNode("textarea", {
                      "onUpdate:modelValue": ($event) => unref(formData).autre = $event,
                      id: "autre",
                      name: "autre",
                      class: "focus:border-primary-500 focus:ring-primary-500 min-h-[100px] w-full flex-1 resize-none appearance-none rounded-md border border-gray-300 px-3 py-2 text-sm leading-tight text-gray-700 focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200",
                      placeholder: "Notes, remarques, informations diverses..."
                    }, null, 8, ["onUpdate:modelValue"]), [
                      [vModelText, unref(formData).autre]
                    ])
                  ])
                ])
              ])
            ];
          }
        }),
        "step-1": withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex flex-col space-y-6 divide-gray-200 lg:flex-row"${_scopeId}><div class="w-full px-4"${_scopeId}><div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:calendar-clock",
              size: "16",
              class: "text-amber-500"
            }, null, _parent2, _scopeId));
            _push2(`<h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId}> Préparation </h3><div class="ml-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-amber-200 text-amber-600 transition-colors duration-300 hover:bg-amber-400 hover:text-white"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:plus",
              size: "16"
            }, null, _parent2, _scopeId));
            _push2(`</div></div>`);
            if (unref(formData).preparation?.length > 0) {
              _push2(`<div class="space-y-2 pt-2"${_scopeId}><!--[-->`);
              ssrRenderList(unref(formData).preparation, (preparation, index) => {
                _push2(`<div class="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-900/20"${_scopeId}><div class="flex items-center gap-2"${_scopeId}><div class="h-4 w-1 rounded-full bg-amber-500"${_scopeId}></div><span class="text-sm font-medium text-gray-700 dark:text-gray-300"${_scopeId}>${ssrInterpolate(formatTimestampToDisplay(preparation.date_start))}</span>`);
                _push2(ssrRenderComponent(_component_Icon, {
                  name: "lucide:arrow-right",
                  size: "14",
                  class: "text-gray-400"
                }, null, _parent2, _scopeId));
                _push2(`<span class="text-sm font-medium text-gray-700 dark:text-gray-300"${_scopeId}>${ssrInterpolate(formatTimestampToDisplay(preparation.date_end))}</span></div><button type="button" class="cursor-pointer p-1 text-gray-500 transition-colors hover:text-gray-800"${_scopeId}>`);
                _push2(ssrRenderComponent(_component_Icon, {
                  name: "lucide:x",
                  size: "16"
                }, null, _parent2, _scopeId));
                _push2(`</button></div>`);
              });
              _push2(`<!--]--></div>`);
            } else {
              _push2(`<p class="pt-2 text-sm text-gray-400 italic"${_scopeId}>Aucune préparation programmée</p>`);
            }
            _push2(`</div><div class="w-full px-4"${_scopeId}><div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:calendar-check",
              size: "16",
              class: "text-emerald-500"
            }, null, _parent2, _scopeId));
            _push2(`<h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId}> Réalisation </h3><div class="ml-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-emerald-200 text-emerald-600 transition-colors duration-300 hover:bg-emerald-400 hover:text-white"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:plus",
              size: "16"
            }, null, _parent2, _scopeId));
            _push2(`</div></div>`);
            if (unref(formData).realisation?.length > 0) {
              _push2(`<div class="space-y-2 pt-2"${_scopeId}><!--[-->`);
              ssrRenderList(unref(formData).realisation, (realisation, index) => {
                _push2(`<div class="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 dark:bg-emerald-900/20"${_scopeId}><div class="flex items-center gap-2"${_scopeId}><div class="h-4 w-1 rounded-full bg-emerald-500"${_scopeId}></div><span class="text-sm font-medium text-gray-700 dark:text-gray-300"${_scopeId}>${ssrInterpolate(formatTimestampToDisplay(realisation.date_start))}</span>`);
                _push2(ssrRenderComponent(_component_Icon, {
                  name: "lucide:arrow-right",
                  size: "14",
                  class: "text-gray-400"
                }, null, _parent2, _scopeId));
                _push2(`<span class="text-sm font-medium text-gray-700 dark:text-gray-300"${_scopeId}>${ssrInterpolate(formatTimestampToDisplay(realisation.date_end))}</span></div><button type="button" class="cursor-pointer p-1 text-gray-500 transition-colors hover:text-gray-800"${_scopeId}>`);
                _push2(ssrRenderComponent(_component_Icon, {
                  name: "lucide:x",
                  size: "16"
                }, null, _parent2, _scopeId));
                _push2(`</button></div>`);
              });
              _push2(`<!--]--></div>`);
            } else {
              _push2(`<p class="pt-2 text-sm text-gray-400 italic"${_scopeId}>Aucune réalisation programmée</p>`);
            }
            _push2(`</div><div class="w-full px-4"${_scopeId}><div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:calendar-days",
              size: "16",
              class: "text-orange-500"
            }, null, _parent2, _scopeId));
            _push2(`<h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId}> Week-ends </h3><div class="ml-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-orange-200 text-orange-600 transition-colors duration-300 hover:bg-orange-400 hover:text-white"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:plus",
              size: "16"
            }, null, _parent2, _scopeId));
            _push2(`</div></div>`);
            if (unref(formData).weekends?.length > 0) {
              _push2(`<div class="space-y-2 pt-2"${_scopeId}><!--[-->`);
              ssrRenderList(unref(formData).weekends, (weekend, index) => {
                _push2(`<div class="flex items-center justify-between rounded-lg bg-orange-50 px-3 py-2 dark:bg-orange-900/20"${_scopeId}><div class="flex items-center gap-2"${_scopeId}><div class="h-4 w-1 rounded-full bg-orange-500"${_scopeId}></div><span class="text-sm font-medium text-gray-700 dark:text-gray-300"${_scopeId}> S${ssrInterpolate(weekend.debutSemaine)}/${ssrInterpolate(weekend.debutAnnee)}</span>`);
                _push2(ssrRenderComponent(_component_Icon, {
                  name: "lucide:arrow-right",
                  size: "14",
                  class: "text-gray-400"
                }, null, _parent2, _scopeId));
                _push2(`<span class="text-sm font-medium text-gray-700 dark:text-gray-300"${_scopeId}> S${ssrInterpolate(weekend.finSemaine)}/${ssrInterpolate(weekend.finAnnee)}</span></div><button type="button" class="cursor-pointer p-1 text-gray-500 transition-colors hover:text-gray-800"${_scopeId}>`);
                _push2(ssrRenderComponent(_component_Icon, {
                  name: "lucide:x",
                  size: "16"
                }, null, _parent2, _scopeId));
                _push2(`</button></div>`);
              });
              _push2(`<!--]--></div>`);
            } else {
              _push2(`<p class="pt-2 text-sm text-gray-400 italic"${_scopeId}>Aucun week-end programmé</p>`);
            }
            _push2(`</div></div>`);
            _push2(ssrRenderComponent(_component_AppDatePickerRange, {
              "is-open": unref(isPreparationAdd),
              title: "Période de préparation",
              onSelect: handleAddPreparationFromPicker,
              onClose: ($event) => isPreparationAdd.value = false
            }, null, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_AppDatePickerRange, {
              "is-open": unref(isRealisationAdd),
              title: "Période de réalisation",
              onSelect: handleAddRealisationFromPicker,
              onClose: ($event) => isRealisationAdd.value = false
            }, null, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_AppModal, {
              modelValue: unref(isWeekendAdd),
              "onUpdate:modelValue": ($event) => isRef(isWeekendAdd) ? isWeekendAdd.value = $event : null,
              size: "sm",
              "show-close-button": false
            }, {
              header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<div class="flex items-center gap-3"${_scopeId2}><div class="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30"${_scopeId2}>`);
                  _push3(ssrRenderComponent(_component_Icon, {
                    name: "lucide:calendar-days",
                    size: "20",
                    class: "text-orange-600 dark:text-orange-400"
                  }, null, _parent3, _scopeId2));
                  _push3(`</div><div${_scopeId2}><p class="text-xs font-medium tracking-wider text-orange-600 uppercase dark:text-orange-400"${_scopeId2}> Week-end </p><p class="text-lg font-semibold text-gray-900 dark:text-white"${_scopeId2}>Sélectionner une semaine</p></div></div>`);
                } else {
                  return [
                    createVNode("div", { class: "flex items-center gap-3" }, [
                      createVNode("div", { class: "flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30" }, [
                        createVNode(_component_Icon, {
                          name: "lucide:calendar-days",
                          size: "20",
                          class: "text-orange-600 dark:text-orange-400"
                        })
                      ]),
                      createVNode("div", null, [
                        createVNode("p", { class: "text-xs font-medium tracking-wider text-orange-600 uppercase dark:text-orange-400" }, " Week-end "),
                        createVNode("p", { class: "text-lg font-semibold text-gray-900 dark:text-white" }, "Sélectionner une semaine")
                      ])
                    ])
                  ];
                }
              }),
              footer: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<div class="flex items-center justify-end gap-3"${_scopeId2}><button type="button" class="px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"${_scopeId2}> Annuler </button><button type="button"${ssrIncludeBooleanAttr(!unref(newWeekend).semaineDebut) ? " disabled" : ""} class="rounded-lg bg-orange-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-orange-300 dark:disabled:bg-orange-800"${_scopeId2}> Valider </button></div>`);
                } else {
                  return [
                    createVNode("div", { class: "flex items-center justify-end gap-3" }, [
                      createVNode("button", {
                        onClick: ($event) => isWeekendAdd.value = false,
                        type: "button",
                        class: "px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                      }, " Annuler ", 8, ["onClick"]),
                      createVNode("button", {
                        onClick: handleAddWeekend,
                        type: "button",
                        disabled: !unref(newWeekend).semaineDebut,
                        class: "rounded-lg bg-orange-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-orange-300 dark:disabled:bg-orange-800"
                      }, " Valider ", 8, ["disabled"])
                    ])
                  ];
                }
              }),
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<div class="space-y-4"${_scopeId2}><div class="grid grid-cols-2 gap-3"${_scopeId2}><div${_scopeId2}><label class="mb-1 block text-xs text-gray-500"${_scopeId2}>Semaine</label>`);
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
                  _push3(`</div></div>`);
                  if (unref(newWeekend).semaineDebut) {
                    _push3(`<div class="flex items-center justify-center gap-2 rounded-lg bg-orange-50 px-3 py-3 text-sm dark:bg-orange-900/20"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:calendar-range",
                      size: "16",
                      class: "text-orange-500"
                    }, null, _parent3, _scopeId2));
                    _push3(`<span class="font-medium text-gray-700 dark:text-gray-300"${_scopeId2}> S${ssrInterpolate(unref(newWeekend).semaineDebut)}/${ssrInterpolate(unref(newWeekend).anneeDebut)}</span>`);
                    _push3(ssrRenderComponent(_component_Icon, {
                      name: "lucide:arrow-right",
                      size: "14",
                      class: "text-gray-400"
                    }, null, _parent3, _scopeId2));
                    _push3(`<span class="font-medium text-gray-700 dark:text-gray-300"${_scopeId2}> S${ssrInterpolate(getNextWeek(unref(newWeekend).semaineDebut, unref(newWeekend).anneeDebut).semaine)}/${ssrInterpolate(getNextWeek(unref(newWeekend).semaineDebut, unref(newWeekend).anneeDebut).annee)}</span></div>`);
                  } else {
                    _push3(`<!---->`);
                  }
                  _push3(`</div>`);
                } else {
                  return [
                    createVNode("div", { class: "space-y-4" }, [
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
                      unref(newWeekend).semaineDebut ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "flex items-center justify-center gap-2 rounded-lg bg-orange-50 px-3 py-3 text-sm dark:bg-orange-900/20"
                      }, [
                        createVNode(_component_Icon, {
                          name: "lucide:calendar-range",
                          size: "16",
                          class: "text-orange-500"
                        }),
                        createVNode("span", { class: "font-medium text-gray-700 dark:text-gray-300" }, " S" + toDisplayString(unref(newWeekend).semaineDebut) + "/" + toDisplayString(unref(newWeekend).anneeDebut), 1),
                        createVNode(_component_Icon, {
                          name: "lucide:arrow-right",
                          size: "14",
                          class: "text-gray-400"
                        }),
                        createVNode("span", { class: "font-medium text-gray-700 dark:text-gray-300" }, " S" + toDisplayString(getNextWeek(unref(newWeekend).semaineDebut, unref(newWeekend).anneeDebut).semaine) + "/" + toDisplayString(getNextWeek(unref(newWeekend).semaineDebut, unref(newWeekend).anneeDebut).annee), 1)
                      ])) : createCommentVNode("", true)
                    ])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
          } else {
            return [
              createVNode("div", { class: "flex flex-col space-y-6 divide-gray-200 lg:flex-row" }, [
                createVNode("div", { class: "w-full px-4" }, [
                  createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                    createVNode(_component_Icon, {
                      name: "lucide:calendar-clock",
                      size: "16",
                      class: "text-amber-500"
                    }),
                    createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " Préparation "),
                    createVNode("div", {
                      class: "ml-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-amber-200 text-amber-600 transition-colors duration-300 hover:bg-amber-400 hover:text-white",
                      onClick: ($event) => isPreparationAdd.value = true
                    }, [
                      createVNode(_component_Icon, {
                        name: "lucide:plus",
                        size: "16"
                      })
                    ], 8, ["onClick"])
                  ]),
                  unref(formData).preparation?.length > 0 ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "space-y-2 pt-2"
                  }, [
                    (openBlock(true), createBlock(Fragment, null, renderList(unref(formData).preparation, (preparation, index) => {
                      return openBlock(), createBlock("div", {
                        key: index,
                        class: "flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-900/20"
                      }, [
                        createVNode("div", { class: "flex items-center gap-2" }, [
                          createVNode("div", { class: "h-4 w-1 rounded-full bg-amber-500" }),
                          createVNode("span", { class: "text-sm font-medium text-gray-700 dark:text-gray-300" }, toDisplayString(formatTimestampToDisplay(preparation.date_start)), 1),
                          createVNode(_component_Icon, {
                            name: "lucide:arrow-right",
                            size: "14",
                            class: "text-gray-400"
                          }),
                          createVNode("span", { class: "text-sm font-medium text-gray-700 dark:text-gray-300" }, toDisplayString(formatTimestampToDisplay(preparation.date_end)), 1)
                        ]),
                        createVNode("button", {
                          type: "button",
                          onClick: ($event) => handleDeletePreparation(index),
                          class: "cursor-pointer p-1 text-gray-500 transition-colors hover:text-gray-800"
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
                    class: "pt-2 text-sm text-gray-400 italic"
                  }, "Aucune préparation programmée"))
                ]),
                createVNode("div", { class: "w-full px-4" }, [
                  createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                    createVNode(_component_Icon, {
                      name: "lucide:calendar-check",
                      size: "16",
                      class: "text-emerald-500"
                    }),
                    createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " Réalisation "),
                    createVNode("div", {
                      class: "ml-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-emerald-200 text-emerald-600 transition-colors duration-300 hover:bg-emerald-400 hover:text-white",
                      onClick: ($event) => isRealisationAdd.value = true
                    }, [
                      createVNode(_component_Icon, {
                        name: "lucide:plus",
                        size: "16"
                      })
                    ], 8, ["onClick"])
                  ]),
                  unref(formData).realisation?.length > 0 ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "space-y-2 pt-2"
                  }, [
                    (openBlock(true), createBlock(Fragment, null, renderList(unref(formData).realisation, (realisation, index) => {
                      return openBlock(), createBlock("div", {
                        key: index,
                        class: "flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 dark:bg-emerald-900/20"
                      }, [
                        createVNode("div", { class: "flex items-center gap-2" }, [
                          createVNode("div", { class: "h-4 w-1 rounded-full bg-emerald-500" }),
                          createVNode("span", { class: "text-sm font-medium text-gray-700 dark:text-gray-300" }, toDisplayString(formatTimestampToDisplay(realisation.date_start)), 1),
                          createVNode(_component_Icon, {
                            name: "lucide:arrow-right",
                            size: "14",
                            class: "text-gray-400"
                          }),
                          createVNode("span", { class: "text-sm font-medium text-gray-700 dark:text-gray-300" }, toDisplayString(formatTimestampToDisplay(realisation.date_end)), 1)
                        ]),
                        createVNode("button", {
                          type: "button",
                          onClick: ($event) => handleDeleteRealisation(index),
                          class: "cursor-pointer p-1 text-gray-500 transition-colors hover:text-gray-800"
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
                    class: "pt-2 text-sm text-gray-400 italic"
                  }, "Aucune réalisation programmée"))
                ]),
                createVNode("div", { class: "w-full px-4" }, [
                  createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                    createVNode(_component_Icon, {
                      name: "lucide:calendar-days",
                      size: "16",
                      class: "text-orange-500"
                    }),
                    createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " Week-ends "),
                    createVNode("div", {
                      class: "ml-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-orange-200 text-orange-600 transition-colors duration-300 hover:bg-orange-400 hover:text-white",
                      onClick: ($event) => isWeekendAdd.value = true
                    }, [
                      createVNode(_component_Icon, {
                        name: "lucide:plus",
                        size: "16"
                      })
                    ], 8, ["onClick"])
                  ]),
                  unref(formData).weekends?.length > 0 ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "space-y-2 pt-2"
                  }, [
                    (openBlock(true), createBlock(Fragment, null, renderList(unref(formData).weekends, (weekend, index) => {
                      return openBlock(), createBlock("div", {
                        key: index,
                        class: "flex items-center justify-between rounded-lg bg-orange-50 px-3 py-2 dark:bg-orange-900/20"
                      }, [
                        createVNode("div", { class: "flex items-center gap-2" }, [
                          createVNode("div", { class: "h-4 w-1 rounded-full bg-orange-500" }),
                          createVNode("span", { class: "text-sm font-medium text-gray-700 dark:text-gray-300" }, " S" + toDisplayString(weekend.debutSemaine) + "/" + toDisplayString(weekend.debutAnnee), 1),
                          createVNode(_component_Icon, {
                            name: "lucide:arrow-right",
                            size: "14",
                            class: "text-gray-400"
                          }),
                          createVNode("span", { class: "text-sm font-medium text-gray-700 dark:text-gray-300" }, " S" + toDisplayString(weekend.finSemaine) + "/" + toDisplayString(weekend.finAnnee), 1)
                        ]),
                        createVNode("button", {
                          type: "button",
                          onClick: ($event) => handleDeleteWeekend(index),
                          class: "cursor-pointer p-1 text-gray-500 transition-colors hover:text-gray-800"
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
                    class: "pt-2 text-sm text-gray-400 italic"
                  }, "Aucun week-end programmé"))
                ])
              ]),
              createVNode(_component_AppDatePickerRange, {
                "is-open": unref(isPreparationAdd),
                title: "Période de préparation",
                onSelect: handleAddPreparationFromPicker,
                onClose: ($event) => isPreparationAdd.value = false
              }, null, 8, ["is-open", "onClose"]),
              createVNode(_component_AppDatePickerRange, {
                "is-open": unref(isRealisationAdd),
                title: "Période de réalisation",
                onSelect: handleAddRealisationFromPicker,
                onClose: ($event) => isRealisationAdd.value = false
              }, null, 8, ["is-open", "onClose"]),
              createVNode(_component_AppModal, {
                modelValue: unref(isWeekendAdd),
                "onUpdate:modelValue": ($event) => isRef(isWeekendAdd) ? isWeekendAdd.value = $event : null,
                size: "sm",
                "show-close-button": false
              }, {
                header: withCtx(() => [
                  createVNode("div", { class: "flex items-center gap-3" }, [
                    createVNode("div", { class: "flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30" }, [
                      createVNode(_component_Icon, {
                        name: "lucide:calendar-days",
                        size: "20",
                        class: "text-orange-600 dark:text-orange-400"
                      })
                    ]),
                    createVNode("div", null, [
                      createVNode("p", { class: "text-xs font-medium tracking-wider text-orange-600 uppercase dark:text-orange-400" }, " Week-end "),
                      createVNode("p", { class: "text-lg font-semibold text-gray-900 dark:text-white" }, "Sélectionner une semaine")
                    ])
                  ])
                ]),
                footer: withCtx(() => [
                  createVNode("div", { class: "flex items-center justify-end gap-3" }, [
                    createVNode("button", {
                      onClick: ($event) => isWeekendAdd.value = false,
                      type: "button",
                      class: "px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    }, " Annuler ", 8, ["onClick"]),
                    createVNode("button", {
                      onClick: handleAddWeekend,
                      type: "button",
                      disabled: !unref(newWeekend).semaineDebut,
                      class: "rounded-lg bg-orange-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-orange-300 dark:disabled:bg-orange-800"
                    }, " Valider ", 8, ["disabled"])
                  ])
                ]),
                default: withCtx(() => [
                  createVNode("div", { class: "space-y-4" }, [
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
                    unref(newWeekend).semaineDebut ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "flex items-center justify-center gap-2 rounded-lg bg-orange-50 px-3 py-3 text-sm dark:bg-orange-900/20"
                    }, [
                      createVNode(_component_Icon, {
                        name: "lucide:calendar-range",
                        size: "16",
                        class: "text-orange-500"
                      }),
                      createVNode("span", { class: "font-medium text-gray-700 dark:text-gray-300" }, " S" + toDisplayString(unref(newWeekend).semaineDebut) + "/" + toDisplayString(unref(newWeekend).anneeDebut), 1),
                      createVNode(_component_Icon, {
                        name: "lucide:arrow-right",
                        size: "14",
                        class: "text-gray-400"
                      }),
                      createVNode("span", { class: "font-medium text-gray-700 dark:text-gray-300" }, " S" + toDisplayString(getNextWeek(unref(newWeekend).semaineDebut, unref(newWeekend).anneeDebut).semaine) + "/" + toDisplayString(getNextWeek(unref(newWeekend).semaineDebut, unref(newWeekend).anneeDebut).annee), 1)
                    ])) : createCommentVNode("", true)
                  ])
                ]),
                _: 1
              }, 8, ["modelValue", "onUpdate:modelValue"])
            ];
          }
        }),
        "step-2": withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="grid grid-cols-1 gap-4 space-y-4 md:grid-cols-2 lg:grid-cols-3"${_scopeId}><div class="w-full space-y-4"${_scopeId}><div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:train-track",
              size: "16",
              class: "text-blue-500"
            }, null, _parent2, _scopeId));
            _push2(`<h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId}> RLT Voie </h3></div>`);
            _push2(ssrRenderComponent(_component_AppSelect, {
              modelValue: unref(formData).rlt_voie_principale,
              "onUpdate:modelValue": ($event) => unref(formData).rlt_voie_principale = $event,
              options: userOptions(__props.usersRltVoie),
              title: "Principal",
              placeholder: "Sélectionner...",
              nullable: ""
            }, null, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_AppSelectMultiple, {
              modelValue: unref(formData).rlt_voie_secondaire,
              "onUpdate:modelValue": ($event) => unref(formData).rlt_voie_secondaire = $event,
              options: userOptions(__props.usersRltVoie),
              title: "Secondaire(s)",
              placeholder: "Sélectionner un profil Voie"
            }, null, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_AppSelectMultiple, {
              modelValue: unref(formData).kv_voie,
              "onUpdate:modelValue": ($event) => unref(formData).kv_voie = $event,
              options: userOptions(__props.usersKvVoie),
              title: "Contrôleur(s)",
              placeholder: "Sélectionner un profil Voie"
            }, null, _parent2, _scopeId));
            _push2(`</div><div class="w-full space-y-4"${_scopeId}><div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:zap",
              size: "16",
              class: "text-yellow-500"
            }, null, _parent2, _scopeId));
            _push2(`<h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId}>RLT SES</h3></div>`);
            _push2(ssrRenderComponent(_component_AppSelect, {
              modelValue: unref(formData).rlt_ses_principale,
              "onUpdate:modelValue": ($event) => unref(formData).rlt_ses_principale = $event,
              options: userOptions(__props.usersRltSes),
              title: "Principal",
              placeholder: "Sélectionner...",
              nullable: ""
            }, null, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_AppSelectMultiple, {
              modelValue: unref(formData).rlt_ses_secondaire,
              "onUpdate:modelValue": ($event) => unref(formData).rlt_ses_secondaire = $event,
              options: userOptions(__props.usersRltSes),
              title: "Secondaire(s)",
              placeholder: "Sélectionner un profil SES"
            }, null, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_AppSelectMultiple, {
              modelValue: unref(formData).kv_ses,
              "onUpdate:modelValue": ($event) => unref(formData).kv_ses = $event,
              options: userOptions(__props.usersKvSes),
              title: "Contrôleur(s)",
              placeholder: "Sélectionner un profil SES"
            }, null, _parent2, _scopeId));
            _push2(`</div><div class="w-full space-y-4"${_scopeId}><div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:cable",
              size: "16",
              class: "text-rose-500"
            }, null, _parent2, _scopeId));
            _push2(`<h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId}>RLT CAT</h3></div>`);
            _push2(ssrRenderComponent(_component_AppSelect, {
              modelValue: unref(formData).rlt_cat_principale,
              "onUpdate:modelValue": ($event) => unref(formData).rlt_cat_principale = $event,
              options: userOptions(__props.usersRltCat),
              title: "Principal",
              placeholder: "Sélectionner...",
              nullable: ""
            }, null, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_AppSelectMultiple, {
              modelValue: unref(formData).rlt_cat_secondaire,
              "onUpdate:modelValue": ($event) => unref(formData).rlt_cat_secondaire = $event,
              options: userOptions(__props.usersRltCat),
              title: "Secondaire(s)",
              placeholder: "Sélectionner un profil caténaire"
            }, null, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_AppSelectMultiple, {
              modelValue: unref(formData).kv_cat,
              "onUpdate:modelValue": ($event) => unref(formData).kv_cat = $event,
              options: userOptions(__props.usersKvCat),
              title: "Contrôleur(s)",
              placeholder: "Sélectionner un profil CAT"
            }, null, _parent2, _scopeId));
            _push2(`</div><div class="w-full space-y-4"${_scopeId}><div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:clipboard-check",
              size: "16",
              class: "text-indigo-500"
            }, null, _parent2, _scopeId));
            _push2(`<h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId}>Pré-op</h3></div>`);
            _push2(ssrRenderComponent(_component_AppSelect, {
              modelValue: unref(formData).preop_voie,
              "onUpdate:modelValue": ($event) => unref(formData).preop_voie = $event,
              options: userOptions(__props.usersPreopVoie),
              title: "Voie",
              placeholder: "Sélectionner...",
              nullable: ""
            }, null, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_AppSelect, {
              modelValue: unref(formData).preop_ses,
              "onUpdate:modelValue": ($event) => unref(formData).preop_ses = $event,
              options: userOptions(__props.usersPreopSes),
              title: "SES",
              placeholder: "Sélectionner...",
              nullable: ""
            }, null, _parent2, _scopeId));
            _push2(`</div><div class="w-full space-y-4"${_scopeId}><div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:truck",
              size: "16",
              class: "text-teal-500"
            }, null, _parent2, _scopeId));
            _push2(`<h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId}> Logistique </h3></div>`);
            _push2(ssrRenderComponent(_component_AppSelect, {
              modelValue: unref(formData).logistique,
              "onUpdate:modelValue": ($event) => unref(formData).logistique = $event,
              options: userOptions(__props.usersLogistique),
              title: "Responsable logistique",
              placeholder: "Sélectionner...",
              nullable: ""
            }, null, _parent2, _scopeId));
            _push2(`</div><div class="w-full space-y-4"${_scopeId}><div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:eye",
              size: "16",
              class: "text-purple-500"
            }, null, _parent2, _scopeId));
            _push2(`<h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId}> Superviseurs </h3></div>`);
            _push2(ssrRenderComponent(_component_AppSelectMultiple, {
              modelValue: unref(formData).supervisor,
              "onUpdate:modelValue": ($event) => unref(formData).supervisor = $event,
              options: userOptions(__props.usersRefRdu),
              title: "Superviseur(s)",
              placeholder: "Sélectionner un profil Superviseur"
            }, null, _parent2, _scopeId));
            _push2(`</div></div>`);
          } else {
            return [
              createVNode("div", { class: "grid grid-cols-1 gap-4 space-y-4 md:grid-cols-2 lg:grid-cols-3" }, [
                createVNode("div", { class: "w-full space-y-4" }, [
                  createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                    createVNode(_component_Icon, {
                      name: "lucide:train-track",
                      size: "16",
                      class: "text-blue-500"
                    }),
                    createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " RLT Voie ")
                  ]),
                  createVNode(_component_AppSelect, {
                    modelValue: unref(formData).rlt_voie_principale,
                    "onUpdate:modelValue": ($event) => unref(formData).rlt_voie_principale = $event,
                    options: userOptions(__props.usersRltVoie),
                    title: "Principal",
                    placeholder: "Sélectionner...",
                    nullable: ""
                  }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                  createVNode(_component_AppSelectMultiple, {
                    modelValue: unref(formData).rlt_voie_secondaire,
                    "onUpdate:modelValue": ($event) => unref(formData).rlt_voie_secondaire = $event,
                    options: userOptions(__props.usersRltVoie),
                    title: "Secondaire(s)",
                    placeholder: "Sélectionner un profil Voie"
                  }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                  createVNode(_component_AppSelectMultiple, {
                    modelValue: unref(formData).kv_voie,
                    "onUpdate:modelValue": ($event) => unref(formData).kv_voie = $event,
                    options: userOptions(__props.usersKvVoie),
                    title: "Contrôleur(s)",
                    placeholder: "Sélectionner un profil Voie"
                  }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                ]),
                createVNode("div", { class: "w-full space-y-4" }, [
                  createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                    createVNode(_component_Icon, {
                      name: "lucide:zap",
                      size: "16",
                      class: "text-yellow-500"
                    }),
                    createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, "RLT SES")
                  ]),
                  createVNode(_component_AppSelect, {
                    modelValue: unref(formData).rlt_ses_principale,
                    "onUpdate:modelValue": ($event) => unref(formData).rlt_ses_principale = $event,
                    options: userOptions(__props.usersRltSes),
                    title: "Principal",
                    placeholder: "Sélectionner...",
                    nullable: ""
                  }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                  createVNode(_component_AppSelectMultiple, {
                    modelValue: unref(formData).rlt_ses_secondaire,
                    "onUpdate:modelValue": ($event) => unref(formData).rlt_ses_secondaire = $event,
                    options: userOptions(__props.usersRltSes),
                    title: "Secondaire(s)",
                    placeholder: "Sélectionner un profil SES"
                  }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                  createVNode(_component_AppSelectMultiple, {
                    modelValue: unref(formData).kv_ses,
                    "onUpdate:modelValue": ($event) => unref(formData).kv_ses = $event,
                    options: userOptions(__props.usersKvSes),
                    title: "Contrôleur(s)",
                    placeholder: "Sélectionner un profil SES"
                  }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                ]),
                createVNode("div", { class: "w-full space-y-4" }, [
                  createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                    createVNode(_component_Icon, {
                      name: "lucide:cable",
                      size: "16",
                      class: "text-rose-500"
                    }),
                    createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, "RLT CAT")
                  ]),
                  createVNode(_component_AppSelect, {
                    modelValue: unref(formData).rlt_cat_principale,
                    "onUpdate:modelValue": ($event) => unref(formData).rlt_cat_principale = $event,
                    options: userOptions(__props.usersRltCat),
                    title: "Principal",
                    placeholder: "Sélectionner...",
                    nullable: ""
                  }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                  createVNode(_component_AppSelectMultiple, {
                    modelValue: unref(formData).rlt_cat_secondaire,
                    "onUpdate:modelValue": ($event) => unref(formData).rlt_cat_secondaire = $event,
                    options: userOptions(__props.usersRltCat),
                    title: "Secondaire(s)",
                    placeholder: "Sélectionner un profil caténaire"
                  }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                  createVNode(_component_AppSelectMultiple, {
                    modelValue: unref(formData).kv_cat,
                    "onUpdate:modelValue": ($event) => unref(formData).kv_cat = $event,
                    options: userOptions(__props.usersKvCat),
                    title: "Contrôleur(s)",
                    placeholder: "Sélectionner un profil CAT"
                  }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                ]),
                createVNode("div", { class: "w-full space-y-4" }, [
                  createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                    createVNode(_component_Icon, {
                      name: "lucide:clipboard-check",
                      size: "16",
                      class: "text-indigo-500"
                    }),
                    createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, "Pré-op")
                  ]),
                  createVNode(_component_AppSelect, {
                    modelValue: unref(formData).preop_voie,
                    "onUpdate:modelValue": ($event) => unref(formData).preop_voie = $event,
                    options: userOptions(__props.usersPreopVoie),
                    title: "Voie",
                    placeholder: "Sélectionner...",
                    nullable: ""
                  }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                  createVNode(_component_AppSelect, {
                    modelValue: unref(formData).preop_ses,
                    "onUpdate:modelValue": ($event) => unref(formData).preop_ses = $event,
                    options: userOptions(__props.usersPreopSes),
                    title: "SES",
                    placeholder: "Sélectionner...",
                    nullable: ""
                  }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                ]),
                createVNode("div", { class: "w-full space-y-4" }, [
                  createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                    createVNode(_component_Icon, {
                      name: "lucide:truck",
                      size: "16",
                      class: "text-teal-500"
                    }),
                    createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " Logistique ")
                  ]),
                  createVNode(_component_AppSelect, {
                    modelValue: unref(formData).logistique,
                    "onUpdate:modelValue": ($event) => unref(formData).logistique = $event,
                    options: userOptions(__props.usersLogistique),
                    title: "Responsable logistique",
                    placeholder: "Sélectionner...",
                    nullable: ""
                  }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                ]),
                createVNode("div", { class: "w-full space-y-4" }, [
                  createVNode("div", { class: "flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" }, [
                    createVNode(_component_Icon, {
                      name: "lucide:eye",
                      size: "16",
                      class: "text-purple-500"
                    }),
                    createVNode("h3", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " Superviseurs ")
                  ]),
                  createVNode(_component_AppSelectMultiple, {
                    modelValue: unref(formData).supervisor,
                    "onUpdate:modelValue": ($event) => unref(formData).supervisor = $event,
                    options: userOptions(__props.usersRefRdu),
                    title: "Superviseur(s)",
                    placeholder: "Sélectionner un profil Superviseur"
                  }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                ])
              ])
            ];
          }
        }),
        "step-3": withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="space-y-6"${_scopeId}><div${_scopeId}><div class="mb-2 flex items-center gap-2"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:building-2",
              size: "16",
              class: "text-primary-500"
            }, null, _parent2, _scopeId));
            _push2(`<p class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId}> Généralités </p></div><div class="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"${_scopeId}><span class="rounded-md bg-gray-200 px-2 py-1 font-mono text-sm font-bold text-gray-700 dark:bg-gray-700 dark:text-gray-300"${_scopeId}>${ssrInterpolate(unref(formData).compte || "-")}</span><span class="text-sm font-medium text-gray-700 dark:text-gray-300"${_scopeId}>${ssrInterpolate(unref(formData).name || "Sans intitulé")}</span>`);
            if (unref(formData).entite === "uo_travaux") {
              _push2(`<span class="ml-auto rounded-full bg-lime-100 px-2.5 py-0.5 text-xs font-medium text-lime-700 dark:bg-lime-900/30 dark:text-lime-400"${_scopeId}> UO Travaux </span>`);
            } else {
              _push2(`<span class="ml-auto rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400"${_scopeId}> Externe </span>`);
            }
            _push2(`</div></div><div class="grid grid-cols-1 gap-4 lg:grid-cols-3"${_scopeId}><div class="w-full"${_scopeId}><div class="mb-2 flex items-center gap-2"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:calendar-clock",
              size: "16",
              class: "text-amber-500"
            }, null, _parent2, _scopeId));
            _push2(`<p class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId}> Préparations </p><span class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"${_scopeId}>${ssrInterpolate(unref(formData).preparation?.length || 0)}</span></div>`);
            if (unref(formData).preparation?.length > 0) {
              _push2(`<div class="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"${_scopeId}><!--[-->`);
              ssrRenderList(unref(formData).preparation, (preparation, index) => {
                _push2(`<div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"${_scopeId}>`);
                _push2(ssrRenderComponent(_component_Icon, {
                  name: "lucide:calendar-range",
                  size: "14",
                  class: "shrink-0 text-amber-500"
                }, null, _parent2, _scopeId));
                _push2(`<span${_scopeId}>${ssrInterpolate(formatTimestampToDisplay(preparation.date_start))}</span>`);
                _push2(ssrRenderComponent(_component_Icon, {
                  name: "lucide:arrow-right",
                  size: "12",
                  class: "text-gray-400"
                }, null, _parent2, _scopeId));
                _push2(`<span${_scopeId}>${ssrInterpolate(formatTimestampToDisplay(preparation.date_end))}</span></div>`);
              });
              _push2(`<!--]--></div>`);
            } else {
              _push2(`<div class="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-400 italic dark:border-gray-600 dark:bg-gray-800"${_scopeId}> Aucune préparation </div>`);
            }
            _push2(`</div><div class="w-full"${_scopeId}><div class="mb-2 flex items-center gap-2"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:calendar-check",
              size: "16",
              class: "text-emerald-500"
            }, null, _parent2, _scopeId));
            _push2(`<p class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId}> Réalisations </p><span class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"${_scopeId}>${ssrInterpolate(unref(formData).realisation?.length || 0)}</span></div>`);
            if (unref(formData).realisation?.length > 0) {
              _push2(`<div class="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"${_scopeId}><!--[-->`);
              ssrRenderList(unref(formData).realisation, (realisation, index) => {
                _push2(`<div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"${_scopeId}>`);
                _push2(ssrRenderComponent(_component_Icon, {
                  name: "lucide:calendar-range",
                  size: "14",
                  class: "shrink-0 text-emerald-500"
                }, null, _parent2, _scopeId));
                _push2(`<span${_scopeId}>${ssrInterpolate(formatTimestampToDisplay(realisation.date_start))}</span>`);
                _push2(ssrRenderComponent(_component_Icon, {
                  name: "lucide:arrow-right",
                  size: "12",
                  class: "text-gray-400"
                }, null, _parent2, _scopeId));
                _push2(`<span${_scopeId}>${ssrInterpolate(formatTimestampToDisplay(realisation.date_end))}</span></div>`);
              });
              _push2(`<!--]--></div>`);
            } else {
              _push2(`<div class="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-400 italic dark:border-gray-600 dark:bg-gray-800"${_scopeId}> Aucune réalisation </div>`);
            }
            _push2(`</div><div class="w-full"${_scopeId}><div class="mb-2 flex items-center gap-2"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:calendar-days",
              size: "16",
              class: "text-orange-500"
            }, null, _parent2, _scopeId));
            _push2(`<p class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId}> Week-ends </p><span class="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"${_scopeId}>${ssrInterpolate(unref(formData).weekends?.length || 0)}</span></div>`);
            if (unref(formData).weekends?.length > 0) {
              _push2(`<div class="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"${_scopeId}><!--[-->`);
              ssrRenderList(unref(formData).weekends, (weekend, index) => {
                _push2(`<div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"${_scopeId}>`);
                _push2(ssrRenderComponent(_component_Icon, {
                  name: "lucide:calendar",
                  size: "14",
                  class: "shrink-0 text-orange-500"
                }, null, _parent2, _scopeId));
                _push2(`<span${_scopeId}>S${ssrInterpolate(weekend.debutSemaine)}/${ssrInterpolate(weekend.debutAnnee)}</span>`);
                _push2(ssrRenderComponent(_component_Icon, {
                  name: "lucide:arrow-right",
                  size: "12",
                  class: "text-gray-400"
                }, null, _parent2, _scopeId));
                _push2(`<span${_scopeId}>S${ssrInterpolate(weekend.finSemaine)}/${ssrInterpolate(weekend.finAnnee)}</span></div>`);
              });
              _push2(`<!--]--></div>`);
            } else {
              _push2(`<div class="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-400 italic dark:border-gray-600 dark:bg-gray-800"${_scopeId}> Aucun week-end </div>`);
            }
            _push2(`</div></div><div${_scopeId}><div class="mb-2 flex items-center gap-2"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "lucide:users",
              size: "16",
              class: "text-primary-500"
            }, null, _parent2, _scopeId));
            _push2(`<p class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300"${_scopeId}> Contacts travaux </p></div><div class="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 lg:grid-cols-4 dark:border-gray-700 dark:bg-gray-800"${_scopeId}><div class="space-y-1"${_scopeId}><p class="text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"${_scopeId}>RLT Voie</p>`);
            if (unref(formData).rlt_voie_principale) {
              _push2(`<div class="flex items-center gap-2"${_scopeId}>`);
              _push2(ssrRenderComponent(_component_AppAvatar, {
                nom: getUserInfoById(unref(formData).rlt_voie_principale)?.nom,
                prenom: getUserInfoById(unref(formData).rlt_voie_principale)?.prenom,
                size: "xs",
                color: "bg-purple-200 text-purple-600"
              }, null, _parent2, _scopeId));
              _push2(`<span class="text-sm text-gray-700 dark:text-gray-300"${_scopeId}>${ssrInterpolate(getUserInfoById(unref(formData).rlt_voie_principale)?.fullName || "-")}</span></div>`);
            } else {
              _push2(`<span class="text-sm text-gray-400"${_scopeId}>Non assigné</span>`);
            }
            _push2(`</div><div class="space-y-1"${_scopeId}><p class="text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"${_scopeId}>RLT SES</p>`);
            if (unref(formData).rlt_ses_principale) {
              _push2(`<div class="flex items-center gap-2"${_scopeId}>`);
              _push2(ssrRenderComponent(_component_AppAvatar, {
                nom: getUserInfoById(unref(formData).rlt_ses_principale)?.nom,
                prenom: getUserInfoById(unref(formData).rlt_ses_principale)?.prenom,
                size: "xs",
                color: "bg-primary-200 text-primary-600"
              }, null, _parent2, _scopeId));
              _push2(`<span class="text-sm text-gray-700 dark:text-gray-300"${_scopeId}>${ssrInterpolate(getUserInfoById(unref(formData).rlt_ses_principale)?.fullName || "-")}</span></div>`);
            } else {
              _push2(`<span class="text-sm text-gray-400"${_scopeId}>Non assigné</span>`);
            }
            _push2(`</div><div class="space-y-1"${_scopeId}><p class="text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"${_scopeId}>RLT CAT</p>`);
            if (unref(formData).rlt_cat_principale) {
              _push2(`<div class="flex items-center gap-2"${_scopeId}>`);
              _push2(ssrRenderComponent(_component_AppAvatar, {
                nom: getUserInfoById(unref(formData).rlt_cat_principale)?.nom,
                prenom: getUserInfoById(unref(formData).rlt_cat_principale)?.prenom,
                size: "xs",
                color: "bg-blue-200 text-blue-600"
              }, null, _parent2, _scopeId));
              _push2(`<span class="text-sm text-gray-700 dark:text-gray-300"${_scopeId}>${ssrInterpolate(getUserInfoById(unref(formData).rlt_cat_principale)?.fullName || "-")}</span></div>`);
            } else {
              _push2(`<span class="text-sm text-gray-400"${_scopeId}>Non assigné</span>`);
            }
            _push2(`</div><div class="space-y-1"${_scopeId}><p class="text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"${_scopeId}>Pré-op</p><div class="flex flex-col gap-1"${_scopeId}>`);
            if (unref(formData).preop_voie) {
              _push2(`<div class="flex items-center gap-2"${_scopeId}>`);
              _push2(ssrRenderComponent(_component_AppAvatar, {
                nom: getUserInfoById(unref(formData).preop_voie)?.nom,
                prenom: getUserInfoById(unref(formData).preop_voie)?.prenom,
                size: "xs",
                color: "bg-emerald-200 text-emerald-600"
              }, null, _parent2, _scopeId));
              _push2(`<span class="text-xs text-gray-600 dark:text-gray-400"${_scopeId}>Voie</span></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (unref(formData).preop_ses) {
              _push2(`<div class="flex items-center gap-2"${_scopeId}>`);
              _push2(ssrRenderComponent(_component_AppAvatar, {
                nom: getUserInfoById(unref(formData).preop_ses)?.nom,
                prenom: getUserInfoById(unref(formData).preop_ses)?.prenom,
                size: "xs",
                color: "bg-emerald-200 text-emerald-600"
              }, null, _parent2, _scopeId));
              _push2(`<span class="text-xs text-gray-600 dark:text-gray-400"${_scopeId}>SES</span></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (!unref(formData).preop_voie && !unref(formData).preop_ses) {
              _push2(`<span class="text-sm text-gray-400"${_scopeId}> Non assigné </span>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div></div></div>`);
            if (unref(formData).entite === "uo_travaux" && !__props.isEditMode) {
              _push2(`<div class="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20"${_scopeId}>`);
              _push2(ssrRenderComponent(_component_Icon, {
                name: "lucide:info",
                size: "20",
                class: "mt-0.5 shrink-0 text-blue-500"
              }, null, _parent2, _scopeId));
              _push2(`<div${_scopeId}><p class="text-sm font-medium text-blue-700 dark:text-blue-400"${_scopeId}>Tâches H00 automatiques</p><p class="mt-1 text-sm text-blue-600 dark:text-blue-300"${_scopeId}>${ssrInterpolate(__props.taches.length)} tâches seront créées automatiquement avec des dates de prévision calculées à partir de la première date de réalisation. </p></div></div>`);
            } else if (unref(formData).entite !== "uo_travaux") {
              _push2(`<div class="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-900/20"${_scopeId}>`);
              _push2(ssrRenderComponent(_component_Icon, {
                name: "lucide:triangle-alert",
                size: "20",
                class: "mt-0.5 shrink-0 text-amber-500"
              }, null, _parent2, _scopeId));
              _push2(`<div${_scopeId}><p class="text-sm font-medium text-amber-700 dark:text-amber-400"${_scopeId}>Chantier externe</p><p class="mt-1 text-sm text-amber-600 dark:text-amber-300"${_scopeId}> Aucune tâche H00 ne sera créée pour ce chantier externe. </p></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (__props.isEditMode) {
              _push2(`<div class="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"${_scopeId}>`);
              _push2(ssrRenderComponent(_component_Icon, {
                name: "lucide:save",
                size: "20",
                class: "mt-0.5 shrink-0 text-gray-500"
              }, null, _parent2, _scopeId));
              _push2(`<div${_scopeId}><p class="text-sm font-medium text-gray-700 dark:text-gray-300"${_scopeId}>Mode modification</p><p class="mt-1 text-sm text-gray-600 dark:text-gray-400"${_scopeId}> Les modifications seront enregistrées. Si les dates de réalisation ont changé, les prévisions des tâches H00 seront recalculées. </p></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", { class: "space-y-6" }, [
                createVNode("div", null, [
                  createVNode("div", { class: "mb-2 flex items-center gap-2" }, [
                    createVNode(_component_Icon, {
                      name: "lucide:building-2",
                      size: "16",
                      class: "text-primary-500"
                    }),
                    createVNode("p", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " Généralités ")
                  ]),
                  createVNode("div", { class: "flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800" }, [
                    createVNode("span", { class: "rounded-md bg-gray-200 px-2 py-1 font-mono text-sm font-bold text-gray-700 dark:bg-gray-700 dark:text-gray-300" }, toDisplayString(unref(formData).compte || "-"), 1),
                    createVNode("span", { class: "text-sm font-medium text-gray-700 dark:text-gray-300" }, toDisplayString(unref(formData).name || "Sans intitulé"), 1),
                    unref(formData).entite === "uo_travaux" ? (openBlock(), createBlock("span", {
                      key: 0,
                      class: "ml-auto rounded-full bg-lime-100 px-2.5 py-0.5 text-xs font-medium text-lime-700 dark:bg-lime-900/30 dark:text-lime-400"
                    }, " UO Travaux ")) : (openBlock(), createBlock("span", {
                      key: 1,
                      class: "ml-auto rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }, " Externe "))
                  ])
                ]),
                createVNode("div", { class: "grid grid-cols-1 gap-4 lg:grid-cols-3" }, [
                  createVNode("div", { class: "w-full" }, [
                    createVNode("div", { class: "mb-2 flex items-center gap-2" }, [
                      createVNode(_component_Icon, {
                        name: "lucide:calendar-clock",
                        size: "16",
                        class: "text-amber-500"
                      }),
                      createVNode("p", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " Préparations "),
                      createVNode("span", { class: "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" }, toDisplayString(unref(formData).preparation?.length || 0), 1)
                    ]),
                    unref(formData).preparation?.length > 0 ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
                    }, [
                      (openBlock(true), createBlock(Fragment, null, renderList(unref(formData).preparation, (preparation, index) => {
                        return openBlock(), createBlock("div", {
                          key: index,
                          class: "flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                        }, [
                          createVNode(_component_Icon, {
                            name: "lucide:calendar-range",
                            size: "14",
                            class: "shrink-0 text-amber-500"
                          }),
                          createVNode("span", null, toDisplayString(formatTimestampToDisplay(preparation.date_start)), 1),
                          createVNode(_component_Icon, {
                            name: "lucide:arrow-right",
                            size: "12",
                            class: "text-gray-400"
                          }),
                          createVNode("span", null, toDisplayString(formatTimestampToDisplay(preparation.date_end)), 1)
                        ]);
                      }), 128))
                    ])) : (openBlock(), createBlock("div", {
                      key: 1,
                      class: "rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-400 italic dark:border-gray-600 dark:bg-gray-800"
                    }, " Aucune préparation "))
                  ]),
                  createVNode("div", { class: "w-full" }, [
                    createVNode("div", { class: "mb-2 flex items-center gap-2" }, [
                      createVNode(_component_Icon, {
                        name: "lucide:calendar-check",
                        size: "16",
                        class: "text-emerald-500"
                      }),
                      createVNode("p", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " Réalisations "),
                      createVNode("span", { class: "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" }, toDisplayString(unref(formData).realisation?.length || 0), 1)
                    ]),
                    unref(formData).realisation?.length > 0 ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
                    }, [
                      (openBlock(true), createBlock(Fragment, null, renderList(unref(formData).realisation, (realisation, index) => {
                        return openBlock(), createBlock("div", {
                          key: index,
                          class: "flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                        }, [
                          createVNode(_component_Icon, {
                            name: "lucide:calendar-range",
                            size: "14",
                            class: "shrink-0 text-emerald-500"
                          }),
                          createVNode("span", null, toDisplayString(formatTimestampToDisplay(realisation.date_start)), 1),
                          createVNode(_component_Icon, {
                            name: "lucide:arrow-right",
                            size: "12",
                            class: "text-gray-400"
                          }),
                          createVNode("span", null, toDisplayString(formatTimestampToDisplay(realisation.date_end)), 1)
                        ]);
                      }), 128))
                    ])) : (openBlock(), createBlock("div", {
                      key: 1,
                      class: "rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-400 italic dark:border-gray-600 dark:bg-gray-800"
                    }, " Aucune réalisation "))
                  ]),
                  createVNode("div", { class: "w-full" }, [
                    createVNode("div", { class: "mb-2 flex items-center gap-2" }, [
                      createVNode(_component_Icon, {
                        name: "lucide:calendar-days",
                        size: "16",
                        class: "text-orange-500"
                      }),
                      createVNode("p", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " Week-ends "),
                      createVNode("span", { class: "rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" }, toDisplayString(unref(formData).weekends?.length || 0), 1)
                    ]),
                    unref(formData).weekends?.length > 0 ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
                    }, [
                      (openBlock(true), createBlock(Fragment, null, renderList(unref(formData).weekends, (weekend, index) => {
                        return openBlock(), createBlock("div", {
                          key: index,
                          class: "flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                        }, [
                          createVNode(_component_Icon, {
                            name: "lucide:calendar",
                            size: "14",
                            class: "shrink-0 text-orange-500"
                          }),
                          createVNode("span", null, "S" + toDisplayString(weekend.debutSemaine) + "/" + toDisplayString(weekend.debutAnnee), 1),
                          createVNode(_component_Icon, {
                            name: "lucide:arrow-right",
                            size: "12",
                            class: "text-gray-400"
                          }),
                          createVNode("span", null, "S" + toDisplayString(weekend.finSemaine) + "/" + toDisplayString(weekend.finAnnee), 1)
                        ]);
                      }), 128))
                    ])) : (openBlock(), createBlock("div", {
                      key: 1,
                      class: "rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-400 italic dark:border-gray-600 dark:bg-gray-800"
                    }, " Aucun week-end "))
                  ])
                ]),
                createVNode("div", null, [
                  createVNode("div", { class: "mb-2 flex items-center gap-2" }, [
                    createVNode(_component_Icon, {
                      name: "lucide:users",
                      size: "16",
                      class: "text-primary-500"
                    }),
                    createVNode("p", { class: "text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300" }, " Contacts travaux ")
                  ]),
                  createVNode("div", { class: "grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 lg:grid-cols-4 dark:border-gray-700 dark:bg-gray-800" }, [
                    createVNode("div", { class: "space-y-1" }, [
                      createVNode("p", { class: "text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400" }, "RLT Voie"),
                      unref(formData).rlt_voie_principale ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "flex items-center gap-2"
                      }, [
                        createVNode(_component_AppAvatar, {
                          nom: getUserInfoById(unref(formData).rlt_voie_principale)?.nom,
                          prenom: getUserInfoById(unref(formData).rlt_voie_principale)?.prenom,
                          size: "xs",
                          color: "bg-purple-200 text-purple-600"
                        }, null, 8, ["nom", "prenom"]),
                        createVNode("span", { class: "text-sm text-gray-700 dark:text-gray-300" }, toDisplayString(getUserInfoById(unref(formData).rlt_voie_principale)?.fullName || "-"), 1)
                      ])) : (openBlock(), createBlock("span", {
                        key: 1,
                        class: "text-sm text-gray-400"
                      }, "Non assigné"))
                    ]),
                    createVNode("div", { class: "space-y-1" }, [
                      createVNode("p", { class: "text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400" }, "RLT SES"),
                      unref(formData).rlt_ses_principale ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "flex items-center gap-2"
                      }, [
                        createVNode(_component_AppAvatar, {
                          nom: getUserInfoById(unref(formData).rlt_ses_principale)?.nom,
                          prenom: getUserInfoById(unref(formData).rlt_ses_principale)?.prenom,
                          size: "xs",
                          color: "bg-primary-200 text-primary-600"
                        }, null, 8, ["nom", "prenom"]),
                        createVNode("span", { class: "text-sm text-gray-700 dark:text-gray-300" }, toDisplayString(getUserInfoById(unref(formData).rlt_ses_principale)?.fullName || "-"), 1)
                      ])) : (openBlock(), createBlock("span", {
                        key: 1,
                        class: "text-sm text-gray-400"
                      }, "Non assigné"))
                    ]),
                    createVNode("div", { class: "space-y-1" }, [
                      createVNode("p", { class: "text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400" }, "RLT CAT"),
                      unref(formData).rlt_cat_principale ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "flex items-center gap-2"
                      }, [
                        createVNode(_component_AppAvatar, {
                          nom: getUserInfoById(unref(formData).rlt_cat_principale)?.nom,
                          prenom: getUserInfoById(unref(formData).rlt_cat_principale)?.prenom,
                          size: "xs",
                          color: "bg-blue-200 text-blue-600"
                        }, null, 8, ["nom", "prenom"]),
                        createVNode("span", { class: "text-sm text-gray-700 dark:text-gray-300" }, toDisplayString(getUserInfoById(unref(formData).rlt_cat_principale)?.fullName || "-"), 1)
                      ])) : (openBlock(), createBlock("span", {
                        key: 1,
                        class: "text-sm text-gray-400"
                      }, "Non assigné"))
                    ]),
                    createVNode("div", { class: "space-y-1" }, [
                      createVNode("p", { class: "text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400" }, "Pré-op"),
                      createVNode("div", { class: "flex flex-col gap-1" }, [
                        unref(formData).preop_voie ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "flex items-center gap-2"
                        }, [
                          createVNode(_component_AppAvatar, {
                            nom: getUserInfoById(unref(formData).preop_voie)?.nom,
                            prenom: getUserInfoById(unref(formData).preop_voie)?.prenom,
                            size: "xs",
                            color: "bg-emerald-200 text-emerald-600"
                          }, null, 8, ["nom", "prenom"]),
                          createVNode("span", { class: "text-xs text-gray-600 dark:text-gray-400" }, "Voie")
                        ])) : createCommentVNode("", true),
                        unref(formData).preop_ses ? (openBlock(), createBlock("div", {
                          key: 1,
                          class: "flex items-center gap-2"
                        }, [
                          createVNode(_component_AppAvatar, {
                            nom: getUserInfoById(unref(formData).preop_ses)?.nom,
                            prenom: getUserInfoById(unref(formData).preop_ses)?.prenom,
                            size: "xs",
                            color: "bg-emerald-200 text-emerald-600"
                          }, null, 8, ["nom", "prenom"]),
                          createVNode("span", { class: "text-xs text-gray-600 dark:text-gray-400" }, "SES")
                        ])) : createCommentVNode("", true),
                        !unref(formData).preop_voie && !unref(formData).preop_ses ? (openBlock(), createBlock("span", {
                          key: 2,
                          class: "text-sm text-gray-400"
                        }, " Non assigné ")) : createCommentVNode("", true)
                      ])
                    ])
                  ])
                ]),
                unref(formData).entite === "uo_travaux" && !__props.isEditMode ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20"
                }, [
                  createVNode(_component_Icon, {
                    name: "lucide:info",
                    size: "20",
                    class: "mt-0.5 shrink-0 text-blue-500"
                  }),
                  createVNode("div", null, [
                    createVNode("p", { class: "text-sm font-medium text-blue-700 dark:text-blue-400" }, "Tâches H00 automatiques"),
                    createVNode("p", { class: "mt-1 text-sm text-blue-600 dark:text-blue-300" }, toDisplayString(__props.taches.length) + " tâches seront créées automatiquement avec des dates de prévision calculées à partir de la première date de réalisation. ", 1)
                  ])
                ])) : unref(formData).entite !== "uo_travaux" ? (openBlock(), createBlock("div", {
                  key: 1,
                  class: "flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-900/20"
                }, [
                  createVNode(_component_Icon, {
                    name: "lucide:triangle-alert",
                    size: "20",
                    class: "mt-0.5 shrink-0 text-amber-500"
                  }),
                  createVNode("div", null, [
                    createVNode("p", { class: "text-sm font-medium text-amber-700 dark:text-amber-400" }, "Chantier externe"),
                    createVNode("p", { class: "mt-1 text-sm text-amber-600 dark:text-amber-300" }, " Aucune tâche H00 ne sera créée pour ce chantier externe. ")
                  ])
                ])) : createCommentVNode("", true),
                __props.isEditMode ? (openBlock(), createBlock("div", {
                  key: 2,
                  class: "flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
                }, [
                  createVNode(_component_Icon, {
                    name: "lucide:save",
                    size: "20",
                    class: "mt-0.5 shrink-0 text-gray-500"
                  }),
                  createVNode("div", null, [
                    createVNode("p", { class: "text-sm font-medium text-gray-700 dark:text-gray-300" }, "Mode modification"),
                    createVNode("p", { class: "mt-1 text-sm text-gray-600 dark:text-gray-400" }, " Les modifications seront enregistrées. Si les dates de réalisation ont changé, les prévisions des tâches H00 seront recalculées. ")
                  ])
                ])) : createCommentVNode("", true)
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/chantier/form.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main$4 as _, __nuxt_component_6 as a, _sfc_main as b, _sfc_main$1 as c };
//# sourceMappingURL=form-Dpzxh_Wd.mjs.map
