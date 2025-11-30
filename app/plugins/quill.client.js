import { defineNuxtPlugin } from '#app'
import Quill from 'quill'
import 'quill/dist/quill.snow.css' // ou 'quill.bubble.css'

export default defineNuxtPlugin((nuxtApp) => {
  return {
    provide: {
      quill: Quill
    }
  }
})
