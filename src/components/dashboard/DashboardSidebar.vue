<script setup lang="ts">
import { BookOpen, FileUp, LayoutGrid, Radar, Search, Shapes, SlidersHorizontal } from '@lucide/vue'
import type { Component } from 'vue'
import iconApp from '../../assets/icon.png'

type NavItem = {
  id: string
  label: string
  hint: string
  icon: Component
}

const sections: NavItem[] = [
  { id: 'overview', label: 'Vue d’ensemble', hint: 'État général', icon: LayoutGrid },
  { id: 'generate', label: 'Générer', hint: 'Créer des règles', icon: Radar },
  { id: 'inspect', label: 'Inspecter', hint: 'Vérification et analyse', icon: Search },
  { id: 'retrieve', label: 'Récupération', hint: 'Recherche contextuelle', icon: BookOpen },
  { id: 'import', label: 'Importer', hint: 'Ajouter un PDF', icon: FileUp },
  { id: 'stats', label: 'Statistiques', hint: 'Indicateurs', icon: SlidersHorizontal },
  { id: 'demo', label: 'Démo', hint: 'Cas de démonstration', icon: Shapes },
]

defineProps<{
  activeSection: string
}>()

const emit = defineEmits<{
  (event: 'select', sectionId: string): void
}>()
</script>

<template>
  <aside class="relative h-full overflow-hidden rounded-none border-0 bg-[linear-gradient(180deg,_#1a235f_0%,_#26348a_38%,_#5b46b8_72%,_#8a63d8_100%)] p-5 shadow-[12px_0_40px_rgba(15,23,42,0.20)] ring-1 ring-white/10 backdrop-blur-xl">
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.14),transparent_20%),radial-gradient(circle_at_82%_10%,rgba(125,211,252,0.18),transparent_18%),radial-gradient(circle_at_50%_86%,rgba(255,255,255,0.08),transparent_24%)]"></div>

    <div class="relative mb-6 flex justify-center">
      <div class="grid h-24 w-24 place-items-center rounded-full bg-white/12 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.18)] ring-1 ring-white/12 backdrop-blur-md">
        <img :src="iconApp" alt="RAG Security Studio icon" class="h-full w-full object-contain drop-shadow-[0_0_18px_rgba(255,255,255,0.24)]" />
      </div>
    </div>

    <nav class="relative space-y-2 overflow-y-auto pr-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <button
        v-for="item in sections"
        :key="item.label"
        type="button"
        class="group flex w-full items-center gap-3 rounded-[1.15rem] px-3 py-3 text-left transition duration-200 hover:-translate-y-0.5 hover:bg-white/14 hover:shadow-[0_12px_28px_rgba(15,23,42,0.16)]"
        :class="activeSection === item.id ? 'bg-white/16 ring-1 ring-white/18 shadow-[0_14px_30px_rgba(15,23,42,0.16)]' : 'ring-1 ring-transparent'"
        @click="emit('select', item.id)"
      >
          <span class="grid h-10 w-10 place-items-center rounded-2xl bg-white/12 text-white ring-1 ring-white/10 transition group-hover:scale-105">
          <component :is="item.icon" class="h-4 w-4" />
        </span>
        <span>
          <span class="block text-sm font-semibold text-white">{{ item.label }}</span>
          <span class="block text-xs text-white/68">{{ item.hint }}</span>
        </span>
      </button>
    </nav>
  </aside>
</template>