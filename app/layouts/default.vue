<script setup></script>
<template>
  <div
    class="flex h-dvh w-full flex-col overflow-hidden bg-radial-[at_50%_50%] from-slate-800/10 via-slate-800/5 to-white text-gray-700 print:overflow-visible">
    <!-- <ViewUpdate /> -->

    <!-- START : NAVBAR -->
    <Navbar class="w-full" />
    <!-- END : NAVBAR -->
    <!-- START : PAGE -->
    <div class="maxh-full w-full flex-1 overflow-auto pt-16 print:pt-0">
      <slot />
    </div>
    <!-- END : PAGE -->
    <!-- START : FOOTER -->
    <div class="z-40 block h-8 w-full print:hidden">
      <Footer class="" />
    </div>
    <!-- END : FOOTER -->
  </div>
</template>
