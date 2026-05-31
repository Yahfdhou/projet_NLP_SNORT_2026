<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  Activity,
  Bot,
  CheckCircle2,
  FileText,
  LayoutGrid,
  Radar,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from '@lucide/vue'
import { toast, Toaster } from 'vue-sonner'
import DashboardFooter from './components/dashboard/DashboardFooter.vue'
import DashboardHeader from './components/dashboard/DashboardHeader.vue'
import DashboardSection from './components/dashboard/DashboardSection.vue'
import DashboardSidebar from './components/dashboard/DashboardSidebar.vue'
import DashboardStatCard from './components/dashboard/DashboardStatCard.vue'
import StatsGraphs from './components/dashboard/StatsGraphs.vue'
import {
  classifyQuery,
  fetchDemoCases,
  fetchStats,
  generateRule,
  retrieveDocuments,
  type Architecture,
  type ApiGeneratedResponse,
  type ClassificationResponse,
  type DemoCase,
  type RetrievalItem,
  type StatsResponse,
  uploadPdf,
} from './composables/useSnortApi'

const architectures: Architecture[] = [
  'baseline',
  'rag_classic',
  'rag_rerank',
  'rag_hybrid',
  'multi_hop',
  'graph_rag',
  'agentic_rag',
]

const query = ref('Détecter une injection SQL avec UNION SELECT dans une URI HTTP')
const architecture = ref<Architecture>('agentic_rag')
const k = ref(5)
const selectedDemo = ref<number | null>(null)
const selectedFile = ref<File | null>(null)

const apiReady = ref(false)
const busy = ref(false)
const uploadingPdf = ref(false)
const connectionState = ref('Vérification du backend...')
const activeSection = ref('overview')

const classification = ref<ClassificationResponse | null>(null)
const generated = ref<ApiGeneratedResponse | null>(null)
const retrieved = ref<RetrievalItem[]>([])
const stats = ref<StatsResponse | null>(null)
const demoCases = ref<DemoCase[]>([])
const uploadMessage = ref('Aucun fichier envoyé pour le moment')
const uploadedChunks = ref<number | null>(null)
const tsneRevision = ref(0)

const apiBase = (import.meta.env.VITE_SNORT_API_BASE_URL as string) || 'http://127.0.0.1:8000'

const tsneImageUrl = computed(() => `${apiBase}/api/v1/visualization/tsne?v=${tsneRevision.value}`)
// include n_clusters param (defaults to 6) and cache-busting `v`
const clusteringImageUrl = computed(() => `${apiBase}/api/v1/visualization/clustering?n_clusters=6&v=${tsneRevision.value}`)

const rows = computed(() => stats.value?.overview?.rows ?? 0)

const attackCountEntries = computed((): [string, number][] => {
  const items = stats.value?.distributions?.attack_types ?? []
  return items.map((it) => [it.label, it.count]) as [string, number][]
})

const validRuleLabel = computed(() => {
  if (!generated.value) return 'En attente'
  if (generated.value.generated_rule === 'NO_RULE_RECOMMENDED') return 'Aucune règle recommandée'
  return generated.value.valid_rule ? 'Valide' : 'À vérifier'
})

const falsePositiveBadge = computed(() => generated.value?.false_positive_risk ?? '—')

const isBenignResult = computed(() => classification.value?.is_benign || generated.value?.generated_rule === 'NO_RULE_RECOMMENDED')

const syntaxValidationLabel = computed(() => {
  const valid = generated.value?.syntax_validation?.valid
  if (valid === true) return 'Syntaxe valide'
  if (valid === false) return 'Syntaxe invalide'
  return '—'
})

const retrievalIdsLabel = computed(() => generated.value?.retrieved_ids?.join(', ') || '—')
const retrievalAttackTypesLabel = computed(() => generated.value?.retrieved_attack_types?.join(', ') || '—')
const retrievalScoresLabel = computed(() => generated.value?.retrieval_scores?.map((value) => value.toFixed(3)).join(', ') || '—')
const validationErrorsLabel = computed(() => generated.value?.validation_errors?.join(' · ') || '—')
const detectedOptionsLabel = computed(() => generated.value?.detected_options?.join(', ') || '—')
const missingOptionsLabel = computed(() => generated.value?.missing_options?.join(', ') || '—')
const sourceDocIdsLabel = computed(() => generated.value?.source_doc_ids?.join(', ') || '—')
const improvementSuggestionsLabel = computed(() => generated.value?.improvement_suggestions?.join(' · ') || '—')
const falsePositiveScoreLabel = computed(() => {
  const score = generated.value?.false_positive_score
  return typeof score === 'number' ? score.toFixed(3) : '—'
})

async function refreshStats() {
  try {
    const result = await fetchStats()
    stats.value = result
    apiReady.value = true
  } catch (error) {
    connectionState.value = 'Backend indisponible'
    toast.error('Impossible de se connecter à l’API', {
      description: error instanceof Error ? error.message : 'Erreur inconnue',
    })
  }
}

async function loadDemoCases() {
  try {
    demoCases.value = await fetchDemoCases()
  } catch (error) {
    toast.error('Impossible de charger les cas de démonstration', {
      description: error instanceof Error ? error.message : 'Erreur inconnue',
    })
  }
}

async function refreshAndLoadDemoCase(caseIndex: number) {
  const currentDemoCase = demoCases.value[caseIndex]
  if (!currentDemoCase) return

  await loadDemoCases()

  const refreshedIndex = demoCases.value.findIndex((item) => {
    if (item.query !== currentDemoCase.query) return false
    if ((item.architecture ?? '') !== (currentDemoCase.architecture ?? '')) return false
    return true
  })

  const targetIndex = refreshedIndex >= 0 ? refreshedIndex : caseIndex
  const demoCase = demoCases.value[targetIndex]
  if (!demoCase) return

  selectedDemo.value = targetIndex
  query.value = demoCase.query
  architecture.value = demoCase.architecture ?? architecture.value

  if (typeof demoCase.generated_rule === 'string') {
    generated.value = {
      query: demoCase.query,
      attack_type: demoCase.attack_type,
      attack_family: demoCase.attack_family,
      generated_rule: demoCase.generated_rule,
      valid_rule: demoCase.valid_rule,
      false_positive_risk: demoCase.false_positive_risk,
      source_doc_ids: demoCase.source_doc_ids,
    }
  }
}

async function runClassification() {
  busy.value = true
  try {
    classification.value = await classifyQuery(query.value)
    toast.success('Classification réussie')
  } catch (error) {
    toast.error('Échec de la classification', {
      description: error instanceof Error ? error.message : 'Erreur inconnue',
    })
  } finally {
    busy.value = false
  }
}

async function runGeneration() {
  busy.value = true
  try {
    generated.value = await generateRule(query.value, architecture.value, k.value)
    classification.value = {
      attack_type: generated.value.attack_type,
      attack_family: generated.value.attack_family,
      is_benign: generated.value.generated_rule === 'NO_RULE_RECOMMENDED',
    }
    toast.success('Règle générée')
  } catch (error) {
    toast.error('Échec de la génération de la règle', {
      description: error instanceof Error ? error.message : 'Erreur inconnue',
    })
  } finally {
    busy.value = false
  }
}

async function runRetrieval() {
  busy.value = true
  try {
    retrieved.value = await retrieveDocuments(query.value, k.value)
    toast.success('Résultats récupérés')
  } catch (error) {
    toast.error('Échec de la récupération', {
      description: error instanceof Error ? error.message : 'Erreur inconnue',
    })
  } finally {
    busy.value = false
  }
}

async function handleUpload() {
  if (!selectedFile.value) {
    toast.error('Choisissez d’abord un fichier PDF')
    return
  }

  uploadingPdf.value = true
  uploadMessage.value = 'Importing PDF...'
  uploadedChunks.value = null
  try {
    const result = await uploadPdf(selectedFile.value)
    uploadMessage.value = result.message
    uploadedChunks.value = result.added_chunks
    tsneRevision.value += 1
    await Promise.all([refreshStats(), loadDemoCases()])
    toast.success('Fichier importé', { description: `${result.added_chunks} segments ajoutés` })
  } catch (error) {
    uploadMessage.value = error instanceof Error ? error.message : 'Import échoué'
    uploadedChunks.value = null
    toast.error('Échec de l’import du fichier', {
      description: error instanceof Error ? error.message : 'Erreur inconnue',
    })
  } finally {
    uploadingPdf.value = false
  }
}

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  selectedFile.value = target.files?.[0] ?? null
}

function scrollToSection(sectionId: string) {
  activeSection.value = sectionId
  document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

onMounted(async () => {
  connectionState.value = 'Connexion en cours...'
  await Promise.all([refreshStats(), loadDemoCases()])
  connectionState.value = apiReady.value ? 'En ligne et prête' : 'Connexion partielle'
})
</script>

<template>
  <Toaster richColors theme="light" position="top-right" />

  <div class="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(196,181,253,0.16),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(125,211,252,0.2),_transparent_30%),linear-gradient(180deg,_#f7fbff_0%,_#edf5ff_100%)] text-slate-900">

    <!-- Fixed header -->
    <div class="fixed inset-x-0 top-0 z-50 flex justify-center bg-transparent">
      <div class="w-full px-0">
        <DashboardHeader :connection-state="connectionState" />
      </div>
    </div>

    <!-- Page content (body scrolls) -->
    <div class="flex w-full gap-0" style="padding-top:var(--header-height)">

      <!-- Fixed sidebar on xl+ screens; falls back to static on small screens -->
      <div class="hidden xl:block xl:fixed xl:bottom-0 xl:left-0 xl:w-[250px]" style="top:calc(var(--header-height) + var(--sidebar-top-offset, 0px))">
        <div class="h-full overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <DashboardSidebar :active-section="activeSection" @select="scrollToSection" />
        </div>
      </div>

      <!-- Main area; add left margin on xl to account for fixed sidebar -->
      <main class="w-full space-y-6 px-4 pb-8 sm:px-6 xl:ml-[250px] xl:px-8">
          <DashboardSection id="overview" :style="{ scrollMarginTop: 'calc(var(--header-height) + 1.5rem)' }" title="Barre de contrôle" description="Saisissez la requête, choisissez l’architecture, puis lancez generate / classify / retrieve au même endroit.">
            <div class="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_320px]">
              <div class="space-y-4">
                <label class="block space-y-2">
                  <span class="text-sm font-medium text-slate-700">Requête</span>
                  <textarea
                    v-model="query"
                    rows="4"
                    class="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                    placeholder="Écrivez ici la requête de sécurité"
                  ></textarea>
                </label>

                <div class="grid gap-4 md:grid-cols-3">
                  <label class="block space-y-2">
                    <span class="text-sm font-medium text-slate-700">Architecture</span>
                    <select
                      v-model="architecture"
                      class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                    >
                      <option v-for="item in architectures" :key="item" :value="item">
                        {{ item }}
                      </option>
                    </select>
                  </label>

                  <label class="block space-y-2">
                    <span class="text-sm font-medium text-slate-700">Top K</span>
                    <input
                      v-model.number="k"
                      type="number"
                      min="1"
                      max="20"
                      class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                    />
                  </label>

                  <div class="flex items-end">
                    <button
                      type="button"
                      class="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
                      :disabled="busy"
                      @click="runGeneration"
                    >
                      <Sparkles class="h-4 w-4" />
                      Générer
                    </button>
                  </div>
                </div>

                <div class="flex flex-wrap gap-3">
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
                    :disabled="busy"
                    @click="runClassification"
                  >
                    <Bot class="h-4 w-4" />
                    Classifier
                  </button>
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
                    :disabled="busy"
                    @click="runRetrieval"
                  >
                    <Radar class="h-4 w-4" />
                    Récupérer
                  </button>
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
                    :disabled="busy"
                    @click="refreshStats"
                  >
                    <Activity class="h-4 w-4" />
                    Actualiser les stats
                  </button>
                </div>
              </div>

              <div class="space-y-4 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                <div class="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <ShieldCheck class="h-4 w-4 text-emerald-600" />
                  État de l’exécution
                </div>
                <p class="text-sm leading-6 text-slate-600">
                  {{ busy ? 'Le tableau de bord traite votre requête.' : 'Prêt pour une interaction API en direct.' }}
                </p>

                <div class="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                  <p class="text-xs uppercase tracking-[0.24em] text-slate-400">Démo sélectionnée</p>
                  <p class="mt-2 text-sm font-medium text-slate-900">
                    {{ selectedDemo === null ? 'Aucune' : demoCases[selectedDemo]?.query ?? 'Aucune' }}
                  </p>
                </div>

                <div class="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                  <p class="text-xs uppercase tracking-[0.24em] text-slate-400">État de l’import</p>
                  <p class="mt-2 text-sm font-medium text-slate-900">{{ uploadMessage }}</p>
                </div>
              </div>
            </div>
          </DashboardSection>

          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DashboardStatCard
              title="Lignes du corpus"
              :value="rows.toLocaleString()"
              note="Nombre total de lignes actuellement chargées par le backend."
              :icon="LayoutGrid"
              tone="cyan"
            />
            <DashboardStatCard
              title="Familles d’attaque"
              :value="attackCountEntries.length"
              note="Nombre de catégories attack_type distinctes dans le corpus."
              :icon="ShieldAlert"
              tone="violet"
            />
            <DashboardStatCard
              title="État de la règle"
              :value="validRuleLabel"
              note="État de validation de la dernière règle générée."
              :icon="CheckCircle2"
              tone="emerald"
            />
            <DashboardStatCard
              title="Risque FP"
              :value="falsePositiveBadge"
              note="Dernière évaluation du risque de faux positif."
              :icon="FileText"
              tone="amber"
            />
          </div>

          <div class="grid gap-6 xl:grid-cols-[1.3fr_0.95fr]">
            <DashboardSection id="generate" :style="{ scrollMarginTop: 'calc(var(--header-height) + 1.5rem)' }" title="Résultat de génération" description="Résultat principal de l’endpoint /generate avec les champs importants.">
              <div v-if="generated" class="space-y-5">
                <div id="inspect" :style="{ scrollMarginTop: 'calc(var(--header-height) + 1.5rem)' }" class="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div class="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                    <span class="rounded-full bg-cyan-50 px-3 py-1 font-medium text-cyan-700">{{ generated.attack_type ?? 'inconnu' }}</span>
                    <span class="rounded-full bg-violet-50 px-3 py-1 font-medium text-violet-700">{{ generated.attack_family ?? 'inconnue' }}</span>
                    <span class="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">{{ validRuleLabel }}</span>
                  </div>

                  <div class="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                    <p class="text-xs uppercase tracking-[0.24em] text-slate-400">Règle générée</p>
                    <p class="mt-3 whitespace-pre-wrap break-words font-mono text-sm leading-7 text-slate-800">
                      {{ generated.generated_rule || 'Aucune règle disponible' }}
                    </p>
                  </div>

                  <p class="mt-4 text-sm leading-6 text-slate-600">
                    {{ generated.explanation ?? 'Aucune explication renvoyée par le backend.' }}
                  </p>
                </div>

                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="rounded-2xl bg-slate-50 p-4">
                    <p class="text-xs uppercase tracking-[0.24em] text-slate-400">Options détectées</p>
                    <p class="mt-2 text-sm text-slate-700">{{ detectedOptionsLabel }}</p>
                  </div>
                  <div class="rounded-2xl bg-slate-50 p-4">
                    <p class="text-xs uppercase tracking-[0.24em] text-slate-400">Options manquantes</p>
                    <p class="mt-2 text-sm text-slate-700">{{ missingOptionsLabel }}</p>
                  </div>
                  <div class="rounded-2xl bg-slate-50 p-4">
                    <p class="text-xs uppercase tracking-[0.24em] text-slate-400">Documents sources</p>
                    <p class="mt-2 text-sm text-slate-700">{{ sourceDocIdsLabel }}</p>
                  </div>
                  <div class="rounded-2xl bg-slate-50 p-4">
                    <p class="text-xs uppercase tracking-[0.24em] text-slate-400">Facteurs FP</p>
                    <p class="mt-2 text-sm text-slate-700">{{ generated.risk_factors?.join(', ') || '—' }}</p>
                  </div>
                </div>

                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="rounded-2xl bg-slate-50 p-4">
                    <p class="text-xs uppercase tracking-[0.24em] text-slate-400">Validation syntaxique</p>
                    <p class="mt-2 text-sm font-medium text-slate-700">{{ syntaxValidationLabel }}</p>
                  </div>
                  <div class="rounded-2xl bg-slate-50 p-4">
                    <p class="text-xs uppercase tracking-[0.24em] text-slate-400">Erreurs de validation</p>
                    <p class="mt-2 text-sm text-slate-700">{{ validationErrorsLabel }}</p>
                  </div>
                  <div class="rounded-2xl bg-slate-50 p-4">
                    <p class="text-xs uppercase tracking-[0.24em] text-slate-400">Score faux positifs</p>
                    <p class="mt-2 text-sm text-slate-700">{{ falsePositiveScoreLabel }}</p>
                  </div>
                  <div class="rounded-2xl bg-slate-50 p-4">
                    <p class="text-xs uppercase tracking-[0.24em] text-slate-400">Améliorations</p>
                    <p class="mt-2 text-sm text-slate-700">{{ improvementSuggestionsLabel }}</p>
                  </div>
                </div>

                <div v-if="generated.generated_rule === 'NO_RULE_RECOMMENDED'" class="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  La requête est considérée bénigne. Le backend retourne <span class="font-mono font-semibold">NO_RULE_RECOMMENDED</span> et aucune règle Snort n’est proposée.
                </div>
              </div>

              <div v-else class="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-sm text-slate-500">
                Aucun résultat pour le moment. Lancez Générer pour afficher une règle prête à l’emploi.
              </div>
            </DashboardSection>

            <DashboardSection title="Classification + Récupération" description="Listes légères pour lire rapidement les résultats de /classify et /retrieve.">
              <div class="space-y-5">
                <div id="retrieve" :style="{ scrollMarginTop: 'calc(var(--header-height) + 1.5rem)' }" class="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div class="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <ShieldCheck class="h-4 w-4 text-emerald-600" />
                    Classification
                  </div>
                  <dl class="mt-4 grid gap-3 text-sm">
                    <div class="flex items-center justify-between rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                      <dt class="text-slate-500">Type d’attaque</dt>
                      <dd class="font-semibold text-slate-900">{{ classification?.attack_type ?? '—' }}</dd>
                    </div>
                    <div class="flex items-center justify-between rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                      <dt class="text-slate-500">Famille d’attaque</dt>
                      <dd class="font-semibold text-slate-900">{{ classification?.attack_family ?? '—' }}</dd>
                    </div>
                    <div class="flex items-center justify-between rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                      <dt class="text-slate-500">Bénin</dt>
                      <dd class="font-semibold text-slate-900">{{ classification?.is_benign ? 'Oui' : 'Non' }}</dd>
                    </div>
                  </dl>

                  <div v-if="isBenignResult" class="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Requête bénigne détectée. Aucune règle ne doit être affichée comme une vraie règle Snort.
                  </div>
                </div>

                <div class="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div class="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Radar class="h-4 w-4 text-cyan-600" />
                    Documents récupérés
                  </div>

                  <div v-if="retrieved.length" class="mt-4 space-y-3">
                    <article
                      v-for="item in retrieved"
                      :key="item.id"
                      class="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200"
                    >
                      <div class="flex items-start justify-between gap-4">
                        <div>
                          <p class="text-sm font-semibold text-slate-900">#{{ item.rank }} {{ item.id }}</p>
                          <p class="mt-1 text-xs text-slate-500">{{ item.attack_type ?? 'inconnu' }} · {{ item.source_name ?? 'source' }}</p>
                        </div>
                        <p class="text-sm font-semibold text-cyan-700">{{ item.score.toFixed(3) }}</p>
                      </div>
                      <p class="mt-3 text-sm leading-6 text-slate-600 line-clamp-3">{{ item.rule }}</p>
                    </article>
                  </div>

                  <div v-else class="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
                    Aucun document récupéré pour le moment.
                  </div>

                  <div class="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                    <div class="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                      <p class="text-xs uppercase tracking-[0.24em] text-slate-400">retrieved_ids</p>
                      <p class="mt-2 text-slate-700">{{ retrievalIdsLabel }}</p>
                    </div>
                    <div class="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                      <p class="text-xs uppercase tracking-[0.24em] text-slate-400">retrieved_attack_types</p>
                      <p class="mt-2 text-slate-700">{{ retrievalAttackTypesLabel }}</p>
                    </div>
                    <div class="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                      <p class="text-xs uppercase tracking-[0.24em] text-slate-400">retrieval_scores</p>
                      <p class="mt-2 text-slate-700">{{ retrievalScoresLabel }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </DashboardSection>
          </div>

          <div class="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <DashboardSection id="stats" :style="{ scrollMarginTop: 'calc(var(--header-height) + 1.5rem)' }" title="Statistiques du corpus" description="Répartition des attack_type depuis /stats, présentée avec des couleurs douces et organisées.">
              <StatsGraphs :overview="stats?.overview" :distributions="stats?.distributions || { attack_types: [], attack_families: [], severity: [], protocol: [], source_type: [] }" :highlights="stats?.highlights" />
            </DashboardSection>

            <DashboardSection id="import" :style="{ scrollMarginTop: 'calc(var(--header-height) + 1.5rem)' }" title="Import PDF + Visualisation" description="Importez un PDF et affichez directement le graphique t-SNE depuis le backend.">
              <div class="space-y-5">
                <div class="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <label class="block space-y-2">
                    <span class="text-sm font-medium text-slate-700">Fichier PDF</span>
                    <input
                      type="file"
                      accept="application/pdf"
                      class="block w-full cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-white hover:border-cyan-300"
                      @change="onFileChange"
                    />
                  </label>

                  <button
                    type="button"
                    class="mt-4 inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="uploadingPdf"
                    @click="handleUpload"
                  >
                    <UploadCloud class="h-4 w-4" />
                    {{ uploadingPdf ? 'Importing PDF...' : 'Ajouter le PDF' }}
                  </button>

                  <p class="mt-3 text-sm leading-6 text-slate-600">
                    <span class="font-medium text-slate-900">Message:</span> {{ uploadMessage }}
                    <span v-if="uploadedChunks !== null" class="ml-2 font-medium text-emerald-700">({{ uploadedChunks }} chunks ajoutés)</span>
                  </p>
                </div>

                <div class="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white via-sky-50 to-orange-50 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                  <div class="border-b border-slate-200/80 px-5 py-4 text-sm font-semibold text-slate-900">
                    Visualisation t-SNE
                  </div>
                  <div class="flex min-h-[420px] items-start justify-center gap-4 p-4 sm:min-h-[520px]">
                    <div class="w-1/2 flex flex-col items-center gap-3">
                      <p class="text-sm text-slate-500">t-SNE visualization</p>
                      <img
                        :src="tsneImageUrl"
                        alt="t-SNE visualization"
                        class="max-h-[420px] w-full rounded-2xl border border-white/70 bg-white object-contain shadow-[0_10px_30px_rgba(15,23,42,0.08)] sm:max-h-[520px]"
                      />
                    </div>
                    <div class="w-1/2 flex flex-col items-center gap-3">
                      <p class="text-sm text-slate-500">Clustering plot</p>
                      <img
                        :src="clusteringImageUrl"
                        alt="Clustering plot"
                        class="max-h-[420px] w-full rounded-2xl border border-white/70 bg-white object-contain shadow-[0_10px_30px_rgba(15,23,42,0.08)] sm:max-h-[520px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </DashboardSection>
          </div>

          <DashboardSection id="demo" :style="{ scrollMarginTop: 'calc(var(--header-height) + 1.5rem)' }" title="Cas de démonstration" description="Exemples prêts à l’emploi depuis /demo_cases pour faciliter l’exploration et les comparaisons.">
            <div v-if="demoCases.length" class="grid gap-4 lg:grid-cols-2">
              <article
                v-for="(item, index) in demoCases"
                :key="`${item.query}-${index}`"
                class="group rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(15,23,42,0.08)]"
              >
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <p class="text-xs uppercase tracking-[0.24em] text-slate-400">{{ item.architecture ?? 'inconnue' }}</p>
                    <h4 class="mt-2 text-base font-semibold text-slate-900">{{ item.query }}</h4>
                  </div>
                  <button
                    type="button"
                    class="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:ring-cyan-300"
                    @click="refreshAndLoadDemoCase(index)"
                  >
                    Charger
                  </button>
                </div>

                <div class="mt-4 flex flex-wrap gap-2 text-xs">
                  <span class="rounded-full bg-cyan-50 px-3 py-1 font-medium text-cyan-700">{{ item.attack_type ?? 'inconnu' }}</span>
                  <span class="rounded-full bg-violet-50 px-3 py-1 font-medium text-violet-700">{{ item.attack_family ?? 'inconnue' }}</span>
                  <span class="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">{{ item.valid_rule ? 'valide' : 'à vérifier' }}</span>
                  <span class="rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-700">{{ item.false_positive_risk ?? '—' }}</span>
                </div>

                <p class="mt-4 text-sm leading-6 text-slate-600">
                  {{ item.generated_rule }}
                </p>

                <p class="mt-3 text-xs text-slate-500">
                  documents sources : {{ item.source_doc_ids?.join(', ') || '—' }}
                </p>
              </article>
            </div>
            <div v-else class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
              Aucun cas de démonstration n’a encore été chargé.
            </div>
          </DashboardSection>

        </main>
    </div>

    <div class="mt-0 w-full px-0">
      <DashboardFooter />
    </div>
  </div>
</template>
