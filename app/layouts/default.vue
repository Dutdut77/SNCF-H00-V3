<script setup></script>
<template>
  <div
    class="bg-primary-50 text-primary-700 flex h-dvh w-full flex-col overflow-hidden dark:bg-black print:overflow-visible print:bg-white">
    <!-- <ViewUpdate /> -->
    <ViewUpdate />
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
