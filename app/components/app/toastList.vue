<script setup>
const { removeToast, items } = useToast()

const remove = (index) => {
  removeToast(index)
}
</script>

<template>
  <Teleport to="body">
    <transition-group
      tag="div"
      enter-from-class="translate-x-full opacity-0"
      enter-active-class="duration-500"
      leave-active-class="duration-500"
      leave-to-class="translate-x-full opacity-0 "
      class="fixed top-4 right-4 z-100 w-full max-w-xs space-y-4 print:hidden">
      <AppToastListItem
        v-for="(item, index) in items"
        :key="item.key"
        :message="item.message"
        :title="item.title"
        :type="item.type"
        :duration="item.duration"
        @remove="remove(index)" />
    </transition-group>
  </Teleport>
</template>

<style></style>
