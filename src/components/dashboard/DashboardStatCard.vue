<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  title: string
  value: string | number
  note: string
  icon: Component
  tone?: 'cyan' | 'violet' | 'emerald' | 'amber'
}>()
</script>

<template>
  <article
    class="rounded-[1.75rem] border p-5 shadow-sm"
    :class="{
      'border-cyan-100 bg-gradient-to-br from-cyan-50 via-sky-50/60 to-white': tone === 'cyan' || !tone,
      'border-violet-100 bg-gradient-to-br from-violet-50 via-fuchsia-50/50 to-white': tone === 'violet',
      'border-emerald-100 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white': tone === 'emerald',
      'border-amber-100 bg-gradient-to-br from-amber-50 via-orange-50/50 to-white': tone === 'amber',
    }"
  >
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="text-sm font-medium text-slate-500">{{ title }}</p>
        <p class="mt-2 text-3xl font-semibold tracking-tight text-slate-800">{{ value }}</p>
        <p class="mt-2 text-sm leading-6 text-slate-500">{{ note }}</p>
      </div>
      <div class="rounded-2xl bg-white/80 p-3 text-cyan-700 ring-1 ring-white/70">
        <component :is="icon" class="h-5 w-5" />
      </div>
    </div>
  </article>
</template>