// Identité de l'installation (nom de l'infrapôle, logo) chargée avant le premier rendu : la page de
// connexion, la navbar et le pied de page l'affichent dès l'arrivée, rendu serveur compris.
export default defineNuxtPlugin(async () => {
  await useApplication().loadApplication()
})
