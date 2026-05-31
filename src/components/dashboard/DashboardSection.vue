<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <section class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-6">
    <div v-if="title || description" class="mb-5 space-y-1">
      <h3 class="text-lg font-semibold text-slate-900">{{ title }}</h3>
      <p v-if="description" class="text-sm leading-6 text-slate-500">{{ description }}</p>
    </div>
    <slot />
  </section>
</template>