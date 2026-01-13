<script setup lang="ts">
import { onMounted, ref, watch, onBeforeUnmount } from 'vue'
import { useNuxtApp } from '#app'

interface Props {
  modelValue: string
}
const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const editor = ref<HTMLDivElement | null>(null)
let quillInstance: any = null

onMounted(() => {
  const { $quill } = useNuxtApp()
  if (editor.value) {
    quillInstance = new $quill(editor.value, {
      theme: 'snow',
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline', 'strike', 'blockquote'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ size: ['small', false, 'large', 'huge'] }],

          [{ color: [] }, { background: [] }], // dropdown with defaults from theme
          [{ font: [] }],
          [{ align: [] }]
        ]
      },
      placeholder: 'Écrivez votre texte ici...'
    })

    // Initialiser avec la valeur du parent
    if (props.modelValue) {
      quillInstance.root.innerHTML = props.modelValue
    }

    // Écouter les changements
    quillInstance.on('text-change', () => {
      emit('update:modelValue', quillInstance.root.innerHTML)
    })
  }
})

// Synchroniser quand `modelValue` change depuis le parent
watch(
  () => props.modelValue,
  (newVal) => {
    if (quillInstance && newVal !== quillInstance.root.innerHTML) {
      quillInstance.root.innerHTML = newVal || ''
    }
  }
)

onBeforeUnmount(() => {
  quillInstance = null
})
</script>

<template>
  <div ref="editor" class="flex h-full min-h-[240px] flex-col border-0">
    <!-- L'éditeur Quill sera rendu ici -->
  </div>
</template>

<style scoped>
:deep(.ql-container) {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 0 !important;
}

:deep(.ql-editor) {
  flex: 1;
  overflow-y: auto;
  border: 0 !important;
}
</style>
