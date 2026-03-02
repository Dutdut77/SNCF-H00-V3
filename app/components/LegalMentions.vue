<template>
  <div class="space-y-8 text-sm text-slate-600 dark:text-slate-400">

    <!-- Section 1 -->
    <section>
      <h2 class="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        1 — Édition du site
      </h2>
      <p class="mb-4 leading-relaxed text-slate-600 dark:text-slate-400">
        Conformément aux dispositions des articles 6-III et 19 de la loi n° 2004-575 du 21 juin 2004 pour la confiance
        dans l'économie numérique, il est précisé aux utilisateurs du site internet
        <span class="font-medium text-slate-700 dark:text-slate-300">https://h00.infpe.fr</span>
        l'identité des différents intervenants dans le cadre de sa réalisation et de son suivi :
      </p>
      <div class="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
        <div v-for="row in edition" :key="row.label" class="flex items-start gap-4 px-4 py-3 odd:bg-slate-50 dark:odd:bg-slate-800/50">
          <span class="w-52 shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">{{ row.label }}</span>
          <span class="text-slate-700 dark:text-slate-300">{{ row.value }}</span>
        </div>
      </div>
    </section>

    <!-- Section 2 -->
    <section>
      <h2 class="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        2 — Propriété intellectuelle et contrefaçons
      </h2>
      <p class="leading-relaxed">
        GRANDMAIRE Nicolas - Applissimo EI est propriétaire des droits de propriété intellectuelle et détient les droits
        d'usage sur tous les éléments accessibles sur le site internet, notamment les textes, images, graphismes, logos,
        vidéos, architecture, icônes et sons. Toute reproduction, représentation, modification, publication, adaptation
        de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf
        autorisation écrite préalable de GRANDMAIRE Nicolas - Applissimo EI. Toute exploitation non autorisée du site ou
        de l'un quelconque des éléments qu'il contient sera considérée comme constitutive d'une contrefaçon et poursuivie
        conformément aux dispositions des articles L.335-2 et suivants du Code de Propriété Intellectuelle.
      </p>
    </section>

    <!-- Section 3 -->
    <section>
      <h2 class="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        3 — Limitations de responsabilité
      </h2>
      <p class="leading-relaxed">
        GRANDMAIRE Nicolas - Applissimo EI ne pourra être tenu pour responsable des dommages directs et indirects causés
        au matériel de l'utilisateur, lors de l'accès au site https://h00.infpe.fr. GRANDMAIRE Nicolas - Applissimo EI
        décline toute responsabilité quant à l'utilisation qui pourrait être faite des informations et contenus présents
        sur https://h00.infpe.fr. GRANDMAIRE Nicolas - Applissimo EI s'engage à sécuriser au mieux le site
        https://h00.infpe.fr, cependant sa responsabilité ne pourra être mise en cause si des données indésirables sont
        importées et installées sur son site à son insu. Des espaces interactifs sont à la disposition des utilisateurs.
        GRANDMAIRE Nicolas - Applissimo EI se réserve le droit de supprimer, sans mise en demeure préalable, tout
        contenu déposé dans cet espace qui contreviendrait à la législation applicable en France, en particulier aux
        dispositions relatives à la protection des données.
      </p>
    </section>

    <!-- Section 4 -->
    <section>
      <h2 class="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        4 — CNIL et gestion des données personnelles
      </h2>
      <p class="leading-relaxed">
        Conformément aux dispositions de la loi 78-17 du 6 janvier 1978 modifiée, l'utilisateur du site
        https://h00.infpe.fr dispose d'un droit d'accès, de modification et de suppression des informations collectées.
        Pour exercer ce droit, envoyez un message à notre Délégué à la Protection des Données :
        <span class="font-medium text-slate-700 dark:text-slate-300">GRANDMAIRE Nicolas — ng.siteweb@gmail.com</span>.
        GRANDMAIRE Nicolas - Applissimo EI s'interdit de traiter ou transférer les informations collectées sur ses
        utilisateurs vers un pays situé en dehors de l'Union européenne ou reconnu comme « non adéquat » par la
        Commission européenne sans en informer préalablement l'utilisateur.
      </p>
    </section>

    <!-- Section 5 -->
    <section>
      <h2 class="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        5 — Liens hypertextes et cookies
      </h2>
      <p class="leading-relaxed">
        Le site https://h00.infpe.fr contient des liens hypertextes vers d'autres sites et dégage toute responsabilité
        à propos de ces liens externes. La navigation sur le site est susceptible de provoquer l'installation de
        cookie(s) sur l'ordinateur de l'utilisateur. Les cookies utilisés sont exclusivement destinés à
        l'authentification, permettant d'assurer la sécurité du mécanisme d'authentification. Pour plus d'informations,
        contacter <span class="font-medium text-slate-700 dark:text-slate-300">GRANDMAIRE Nicolas — ng.siteweb@gmail.com</span>.
      </p>
    </section>

  </div>
</template>

<script setup>
const edition = [
  { label: 'Propriétaire du site', value: 'GRANDMAIRE Nicolas - Applissimo EI' },
  { label: 'Contact', value: 'ng.siteweb@gmail.com — 06 84 59 37 45' },
  { label: 'Adresse', value: '48 rue de Bouleurs, 77580 Crécy-la-Chapelle' },
  { label: 'Directeur de la publication', value: 'GRANDMAIRE Nicolas — ng.siteweb@gmail.com' },
  { label: 'Hébergeur site web', value: 'Vercel inc. — 440 N Barranca Ave #4133, Covina, CA 91723' },
  { label: 'Hébergeur base de données', value: 'Supabase — 970 Toa Payoh North #07-04, Singapore 318992' },
  { label: 'Délégué protection des données', value: 'GRANDMAIRE Nicolas — ng.siteweb@gmail.com' },
]
</script>
