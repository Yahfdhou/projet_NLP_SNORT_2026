<script setup lang="ts">
import { Shield, ShieldCheck } from '@lucide/vue'

defineProps<{
  connectionState: string
}>()
</script>

<template>
  <header :style="{ height: 'var(--header-height)' }" class="relative w-full overflow-hidden border-b border-white/10 bg-[linear-gradient(135deg,_#1a235f_0%,_#26348a_38%,_#5b46b8_72%,_#8a63d8_100%)] px-6 shadow-[0_18px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl sm:px-8 lg:px-10">
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(255,255,255,0.16),transparent_22%),radial-gradient(circle_at_80%_18%,rgba(125,211,252,0.18),transparent_18%),radial-gradient(circle_at_92%_70%,rgba(255,255,255,0.08),transparent_22%)]"></div>
    <div class="flex h-full items-center gap-8 lg:flex-row lg:justify-between">
      <div class="space-y-5">
        <div class="inline-flex items-center rounded-full border border-white/12 bg-white/12 px-5 py-2 text-xs font-semibold tracking-[0.18em] text-white/80 shadow-sm backdrop-blur-md">
          <span>RAG Security Studio</span>
        </div>
        <div class="space-y-4">
          <h1 class="flex flex-wrap items-center gap-4 bg-gradient-to-r from-white via-cyan-100 to-sky-100 bg-clip-text text-5xl font-semibold tracking-tight text-transparent sm:text-6xl">
            <span class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/14 text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] ring-1 ring-white/12 sm:h-16 sm:w-16">
              <ShieldCheck class="h-7 w-7 sm:h-8 sm:w-8" />
            </span>
            Tableau de bord Snort moderne
          </h1>
          <p class="max-w-4xl text-base leading-7 text-white/74 sm:text-lg">
            Interface claire, lumineuse et évolutive pour afficher generate, classify, retrieve, stats et l’import de fichiers PDF.
          </p>
        </div>
      </div>

      <div class="inline-flex items-center gap-3 rounded-full border border-white/14 bg-white/10 px-6 py-3 text-sm text-white/82 shadow-sm backdrop-blur-md">
        <span class="grid h-8 w-8 place-items-center rounded-full bg-white/12 text-white ring-1 ring-white/12">
          <Shield class="h-4 w-4" />
        </span>
        <span class="font-medium text-white/72">État:</span>
        <span class="font-semibold text-white">{{ connectionState }}</span>
      </div>
    </div>
  </header>
</template>