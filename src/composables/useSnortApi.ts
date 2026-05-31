export type Architecture =
  | 'baseline'
  | 'rag_classic'
  | 'rag_rerank'
  | 'rag_hybrid'
  | 'multi_hop'
  | 'graph_rag'
  | 'agentic_rag'

export type ApiGeneratedResponse = {
  query: string
  attack_type?: string
  attack_family?: string
  generated_rule?: string
  valid_rule?: boolean
  syntax_validation?: { valid?: boolean; errors?: string[] }
  validation_errors?: string[]
  detected_options?: string[]
  missing_options?: string[]
  false_positive_risk?: string
  false_positive_score?: number
  risk_factors?: string[]
  improvement_suggestions?: string[]
  source_doc_ids?: string[]
  retrieved_ids?: string[]
  retrieved_attack_types?: string[]
  retrieval_scores?: number[]
  explanation?: string
  retrieved_context_used?: boolean
  hallucination_risk?: number
  prompt?: string
}

export type ClassificationResponse = {
  attack_type?: string
  attack_family?: string
  is_benign?: boolean
}

export type RetrievalItem = {
  rank: number
  id: string
  score: number
  attack_type?: string
  rule?: string
  source_name?: string
  source_url?: string
  text?: string
  log_example?: string
}

export type StatDistributionItem = {
  label: string
  count: number
  ratio: number
}

export type StatsOverview = {
  rows: number
  attack_types: number
  attack_families: number
  benign_rows: number
  malicious_rows: number
  benign_ratio: number
  reference_rule_coverage: number
}

export type StatsHighlights = {
  top_attack_types: Array<{ label: string; count: number }>
  top_attack_families: Array<{ label: string; count: number }>
  top_protocols: Array<{ label: string; count: number }>
  top_severities: Array<{ label: string; count: number }>
  top_source_types: Array<{ label: string; count: number }>
  top_src_ports: Array<{ label: string; count: number }>
  top_dst_ports: Array<{ label: string; count: number }>
}

export type StatsNotes = {
  benign_attack_types: string[]
  families: string[]
  attack_types_list: string[]
}

export type StatsResponse = {
  overview: StatsOverview
  distributions: {
    attack_types: StatDistributionItem[]
    attack_families: StatDistributionItem[]
    severity: StatDistributionItem[]
    protocol: StatDistributionItem[]
    source_type: StatDistributionItem[]
  }
  highlights: StatsHighlights
  notes: StatsNotes
}

export type DemoCase = {
  query: string
  architecture?: Architecture
  attack_type?: string
  attack_family?: string
  generated_rule?: string
  valid_rule?: boolean
  false_positive_risk?: string
  source_doc_ids?: string[]
}

const baseUrl = import.meta.env.VITE_SNORT_API_BASE_URL ?? 'http://127.0.0.1:8000'

function extractErrorMessage(text: string, status: number) {
  try {
    const parsed = JSON.parse(text) as { detail?: string }
    return parsed.detail || text || `Request failed with status ${status}`
  } catch {
    return text || `Request failed with status ${status}`
  }
}

async function requestJson<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, init)

  if (!response.ok) {
    const text = await response.text()
    throw new Error(extractErrorMessage(text, response.status))
  }

  return response.json() as Promise<T>
}

export async function classifyQuery(query: string) {
  return requestJson<ClassificationResponse>('/api/v1/classify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
}

export async function generateRule(query: string, architecture: Architecture, k: number) {
  return requestJson<ApiGeneratedResponse>('/api/v1/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, architecture, k }),
  })
}

export async function retrieveDocuments(query: string, k: number) {
  return requestJson<RetrievalItem[]>('/api/v1/retrieve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, k }),
  })
}

export async function fetchStats() {
  return requestJson<StatsResponse>('/api/v1/stats', { method: 'GET' })
}

export async function fetchStatsOverview() {
  return requestJson<StatsOverview>('/api/v1/stats/overview', { method: 'GET' })
}

export async function fetchStatsDistributions() {
  return requestJson<StatsResponse['distributions']>('/api/v1/stats/distributions', { method: 'GET' })
}

export async function fetchStatsBrief() {
  return requestJson<{ text: string }>('/api/v1/stats/brief', { method: 'GET' })
}

export async function fetchDemoCases() {
  return requestJson<DemoCase[]>('/api/v1/demo_cases', { method: 'GET' })
}

export async function uploadPdf(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${baseUrl}/api/v1/add_pdf`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(extractErrorMessage(text, response.status))
  }

  return response.json() as Promise<{ added_chunks: number; message: string }>
}