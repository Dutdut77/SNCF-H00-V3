# 🎯 TEMPLATE PROMPT — NUXT 3 + NUXT UI + SUPABASE
# Utilise cette structure pour toutes tes demandes dans Cursor.

---

# 1. CONTEXTE GÉNÉRAL DU PROJET

Projet basé sur :
- **Nuxt 4**
- **Nuxt UI 4.2**
- **TailwindCSS 4**
- **Supabase (via @nuxtjs/supabase)**
- **JavaScript (pas TypeScript)**


MCP activé :
- Cursor peut lire/écrire les fichiers dans le repo.
- Cursor peut modifier plusieurs fichiers si la demande le requiert.

Architecture générale (à connaître) :
- `/components/...`
- `/composables/...`
- `/pages/...`
- `/server/api/...`
- `/plugins/...`

Règles générales du projet :
- utiliser systématiquement `defineModel()` pour tous les composants qui doivent exposer des données au parent.
- préférer les **composables** pour toute logique transversale.
- utiliser `useSupabaseClient()` pour toutes les requêtes DB.
- coder avec une approche propre, lisible, minimaliste.

---

# 2. OBJECTIF DE LA DEMANDE
(👉 À compléter lorsque tu utilises ce prompt)

Décrire ici le résultat **final** attendu.  
Exemples :
- créer un composant Nuxt UI compliant avec `defineModel()`
- corriger un bug dans un composable Supabase
- générer une page Nuxt complète
- optimiser une requête

---

# 3. TÂCHE À EFFECTUER
(👉 Décrire précisément ce que tu veux que Cursor fasse)

Inclure :
- fichiers à créer ou modifier
- logique attendue
- comportement final

---

# 4. CONTRAINTES TECHNIQUES
Toujours respecter les contraintes suivantes :

- ❗ **Ne jamais ajouter de dépendances externes** sauf demande explicite.
- ❗ **Toujours utiliser `defineModel()` pour les valeurs venant du parent.**
- ❗ **Toujours générer du code compatible SSR.**
- ❗ **Composants Nuxt UI : structure propre, slots, props typées.**
- ❗ **Supabase : utiliser le client natif → `const supabase = useSupabaseClient()`.**
- ❗ **Pas de code inutile.**
- ❗ **Utiliser au maximun les composants Nuxt UI.**
- ❗ **Toujours proposer un fichier complet si tu modifies/ajoutes un fichier.**

---

# 5. FICHIERS IMPORTANTS À LIRE
(👉 Lister les fichiers utiles)

Exemples :
- `components/MyComponent.vue`
- `composables/useUser.ts`
- `server/api/...`

---

# 6. EXEMPLES À SUIVRE
(👉 Ajouter un snippet d’exemple si nécessaire)

---

# 7. FORMAT DE RÉPONSE ATTENDU

Réponds avec :
- une courte explication
- les fichiers complets à créer/modifier
- les éventuelles instructions post-création

Ne pas répondre avec des extraits incomplets.
