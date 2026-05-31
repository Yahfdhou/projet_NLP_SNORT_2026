<script setup lang="ts">
import DashboardStatCard from './DashboardStatCard.vue'
import { BarChart2, Layers, List, CheckCircle } from '@lucide/vue'

type StatDistributionItem = {
  label: string
  count: number
  ratio: number
}

defineProps<{
  overview: any
  distributions: {
    attack_types: StatDistributionItem[]
    attack_families: StatDistributionItem[]
    severity: StatDistributionItem[]
    protocol: StatDistributionItem[]
    source_type: StatDistributionItem[]
  }
  highlights: any
}>()

function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}
</script>

<template>
  <div class="space-y-6">
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <DashboardStatCard title="Lignes" :value="overview?.rows ?? '—'" note="Total rows" :icon="BarChart2" />
      <DashboardStatCard title="Types" :value="overview?.attack_types ?? '—'" note="Attack types" :icon="List" />
      <DashboardStatCard title="Families" :value="overview?.attack_families ?? '—'" note="Attack families" :icon="Layers" />
      <DashboardStatCard title="Benign ratio" :value="overview ? (overview.benign_ratio * 100).toFixed(1) + '%' : '—'" note="Benign share" :icon="CheckCircle" />
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
      <section class="rounded-2xl border border-slate-200 bg-white p-4">
        <h4 class="text-sm font-semibold text-slate-900">Top attack types</h4>
        <div class="mt-3 space-y-3">
          <div v-for="item in distributions.attack_types.slice(0,6)" :key="item.label" class="space-y-1">
            <div class="flex items-center justify-between text-sm">
              <span class="text-slate-700">{{ item.label }}</span>
              <span class="text-slate-500">{{ item.count }} · {{ percent(item.ratio) }}</span>
            </div>
            <div class="h-2 rounded-full bg-slate-100">
              <div class="h-2 rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-400" :style="{ width: `${Math.max(4, item.ratio * 100)}%` }"></div>
            </div>
          </div>
          <div v-if="!distributions.attack_types.length" class="text-sm text-slate-500">No data</div>
        </div>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white p-4">
        <h4 class="text-sm font-semibold text-slate-900">Protocols</h4>
        <div class="mt-3 space-y-3">
          <div v-for="item in distributions.protocol.slice(0,6)" :key="item.label" class="space-y-1">
            <div class="flex items-center justify-between text-sm">
              <span class="text-slate-700">{{ item.label }}</span>
              <span class="text-slate-500">{{ item.count }} · {{ percent(item.ratio) }}</span>
            </div>
            <div class="h-2 rounded-full bg-slate-100">
              <div class="h-2 rounded-full bg-gradient-to-r from-emerald-400 via-lime-400 to-amber-400" :style="{ width: `${Math.max(4, item.ratio * 100)}%` }"></div>
            </div>
          </div>
          <div v-if="!distributions.protocol.length" class="text-sm text-slate-500">No data</div>
        </div>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white p-4">
        <h4 class="text-sm font-semibold text-slate-900">Severity</h4>
        <div class="mt-3 space-y-3">
          <div v-for="item in distributions.severity.slice(0,6)" :key="item.label" class="space-y-1">
            <div class="flex items-center justify-between text-sm">
              <span class="text-slate-700">{{ item.label }}</span>
              <span class="text-slate-500">{{ item.count }} · {{ percent(item.ratio) }}</span>
            </div>
            <div class="h-2 rounded-full bg-slate-100">
              <div class="h-2 rounded-full bg-gradient-to-r from-red-400 via-rose-400 to-pink-400" :style="{ width: `${Math.max(4, item.ratio * 100)}%` }"></div>
            </div>
          </div>
          <div v-if="!distributions.severity.length" class="text-sm text-slate-500">No data</div>
        </div>
      </section>
    </div>
  </div>
</template>
