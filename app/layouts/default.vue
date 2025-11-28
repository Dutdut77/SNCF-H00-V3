<script setup></script>
<template>
  <div class="w-full print:overflow-visible flex flex-col h-dvh overflow-hidden bg-indigo-50/50 ">
    <!-- <ViewUpdate /> -->


    <!-- START : NAVBAR -->
    <Navbar class="w-full" />
    <!-- END : NAVBAR -->
    <!-- START : PAGE -->
    <div class="w-full maxh-full flex-1 print:pt-0 pt-16 overflow-auto ">
      <slot />
    </div>
    <!-- END : PAGE -->
    <!-- START : FOOTER -->
    <div class=" w-full h-8 print:hidden block z-40 ">
 <Footer class="" />
    </div>
    <!-- END : FOOTER -->
  </div>
</template>
