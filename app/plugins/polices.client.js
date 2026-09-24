// Charge les polices des impressions dès l'ouverture de l'application, quand le navigateur est libre :
// une impression lancée par Ctrl+P (sans passer par lancerImpression) les trouve ainsi déjà prêtes.
export default defineNuxtPlugin(() => {
  const charger = () => chargerPolicesImpression().catch(() => {})
  if ('requestIdleCallback' in window) window.requestIdleCallback(charger, { timeout: 3000 })
  else setTimeout(charger, 1500)
})
