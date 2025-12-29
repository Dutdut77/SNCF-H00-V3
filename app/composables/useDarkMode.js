// composables/useDarkMode.ts
export const useDarkMode = () => {
  const isDark = ref(false)

  const apply = () => {
    document.documentElement.classList.toggle('dark', isDark.value)
  }

  onMounted(() => {
    const saved = localStorage.getItem('dark-mode')
    isDark.value = saved ? saved === 'true' : window.matchMedia('(prefers-color-scheme: dark)').matches

    apply()
  })

  watch(isDark, () => {
    localStorage.setItem('dark-mode', String(isDark.value))
    apply()
  })

  return { isDark }
}
