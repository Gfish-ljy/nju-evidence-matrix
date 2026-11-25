import type {
  Claim,
  Condition,
  DemoData,
  Evidence,
  KnowledgeEvent,
  KnowledgeStatus,
  Opportunity,
  Paper,
  Problem,
  Relation,
  RelationType,
  Topic,
} from './types'

const c = (
  dataset: string,
  model: string,
  task: string,
  metrics: string[],
  scale?: string,
): Condition => ({ dataset, model, task, metrics, scale })

export const TOPICS: Topic[] = [
  {
    id: 'T1',
    name: 'Retrieval',
    description: 'How agents select relevant memory at inference time.',
    color: '#0A84FF',
    center: [24, 34],
  },
  {
    id: 'T2',
    name: 'Consolidation',
    description: 'Turning episodic traces into reusable semantic memory.',
    color: '#3E8E5A',
    center: [47, 20],
  },
  {
    id: 'T3',
    name: 'Editing & Forgetting',
    description: 'Removing, revising, and decaying stored memories.',
    color: '#B7791F',
    center: [71, 41],
  },
  {
    id: 'T4',
    name: 'Evaluation',
    description: 'Benchmarks, metrics, and temporal reasoning over memory.',
    color: '#7C5CD6',
    center: [43, 65],
  },
  {
    id: 'T5',
    name: 'Shared Memory',
    description: 'Memory pools and consensus across multiple agents.',
    color: '#138F8A',
    center: [17, 66],
  },
  {
    id: 'T6',
    name: 'Safety & Privacy',
    description: 'Leakage, encrypted stores, and machine unlearning.',
    color: '#C4544E',
    center: [79, 68],
  },
]

export const PROBLEMS: Problem[] = [
  {
    id: 'P1',
    topicId: 'T1',
    question: 'How should an agent retrieve the right memory at the right time?',
    description:
      'Retrieval policies, index structures, and reranking strategies for long-horizon agents.',
  },
  {
    id: 'P2',
    topicId: 'T2',
    question: 'Does reflection-based consolidation improve long-horizon performance?',
    description:
      'Whether reflective summarization and episodic-to-semantic consolidation produce durable gains.',
  },
  {
    id: 'P3',
    topicId: 'T3',
    question: 'Can outdated memories be edited without collateral forgetting?',
    description:
      'Direct edits, decay schedules, audit trails, and the side effects of changing stored facts.',
  },
  {
    id: 'P4',
    topicId: 'T4',
    question: 'How should long-term memory be evaluated?',
    description:
      'Benchmark design, metric separation, update fidelity, and the gap between scores and task success.',
  },
  {
    id: 'P5',
    topicId: 'T5',
    question: 'How should multiple agents share memory?',
    description:
      'Shared pools, conflict-aware writes, consensus protocols, and error propagation.',
  },
  {
    id: 'P6',
    topicId: 'T1',
    question: 'How does retrieval cost scale with memory size?',
    description:
      'Latency, index size, sharding, and the trade-offs of approximate retrieval.',
  },
  {
    id: 'P7',
    topicId: 'T4',
    question: 'Can memory systems support temporal reasoning?',
    description:
      'Whether retrieval and memory representations preserve ordering, timestamps, and validity intervals.',
  },
  {
    id: 'P8',
    topicId: 'T6',
    question: 'How can sensitive memories be deleted on request?',
    description:
      'Encrypted memory, leakage through retrieval, and machine unlearning for agent memory.',
  },
]

const paperSeeds: Array<
  [string, string, string, number, string, string, string, string, string, number]
> = [
  [
    'P01',
    'Memory Retrieval for LLM Agents: A Survey',
    'A. Chen, M. Rivera',
    2021,
    'arXiv',
    'T1',
    '2021-03-12',
    '2021-06-01',
    'Surveys retrieval, consolidation, and editing approaches for LLM agent memory.',
    210,
  ],
  [
    'P02',
    'Vector Memory Retrieval for Long-Horizon Agents',
    'J. Park, L. Nguyen',
    2022,
    'ACL',
    'T1',
    '2022-02-08',
    '2022-05-20',
    'Evaluates vector retrieval against full-context prompting on long-horizon QA.',
    140,
  ],
  [
    'P03',
    'Reflection and Memory Consolidation in LLM Agents',
    'R. Okafor, T. Sato',
    2022,
    'NeurIPS',
    'T2',
    '2022-07-19',
    '2022-11-02',
    'Introduces a reflection loop that consolidates episodic traces into semantic memory.',
    118,
  ],
  [
    'P04',
    'LongMemBench: Evaluating Long-Term Memory',
    'S. Iyer, K. Brandt',
    2023,
    'ICLR',
    'T4',
    '2023-01-25',
    '2023-05-14',
    'Audits existing long-term memory benchmarks and proposes an evaluation suite.',
    96,
  ],
  [
    'P05',
    'Direct Memory Editing for LLM Agents',
    'H. Wu, D. Klein',
    2023,
    'EMNLP',
    'T3',
    '2023-04-11',
    '2023-08-03',
    'Edits stored facts directly and measures success and collateral forgetting.',
    88,
  ],
  [
    'P06',
    'Scaling Memory Retrieval: Cost and Latency',
    'N. Abadi, P. Singh',
    2023,
    'arXiv',
    'T1',
    '2023-09-06',
    '2024-01-18',
    'Models retrieval latency as memory stores grow from 10k to 1M entries.',
    71,
  ],
  [
    'P07',
    'Episodic-to-Semantic Memory Consolidation',
    'F. Moreau, E. Larsen',
    2023,
    'ACL',
    'T2',
    '2023-11-21',
    '2024-03-09',
    'Studies consolidation as a token-efficiency mechanism for long episodes.',
    64,
  ],
  [
    'P08',
    'Forgetting Curves for Agent Memory',
    'Y. Zhou, A. Petrova',
    2024,
    'ICML',
    'T3',
    '2024-02-14',
    '2024-06-20',
    'Applies decay schedules to agent memory and tests out-of-distribution generalization.',
    59,
  ],
  [
    'P09',
    'Hybrid Sparse-Dense Memory Retrieval',
    'B. Kim, C. Duarte',
    2024,
    'SIGIR',
    'T1',
    '2024-05-03',
    '2024-09-12',
    'Combines sparse and dense retrieval for agent memory recall.',
    52,
  ],
  [
    'P10',
    'Shared Memory Pools for Multi-Agent Systems',
    'M. Haddad, Q. Lin',
    2024,
    'AAMAS',
    'T5',
    '2024-08-08',
    '2024-12-01',
    'Introduces a shared memory pool for teams of language-model agents.',
    47,
  ],
  [
    'P11',
    'Temporal Reasoning over Agent Memory',
    'V. Rao, J. Fischer',
    2024,
    'EMNLP',
    'T4',
    '2024-10-17',
    '2025-02-06',
    'Tests whether retrieval-augmented agents preserve temporal ordering.',
    41,
  ],
  [
    'P12',
    'Beyond Recall: Evaluating Memory Updates',
    'E. Novak, S. Ali',
    2024,
    'NeurIPS',
    'T4',
    '2024-12-05',
    '2025-04-10',
    'Shows that recall-only metrics hide update failures in agent memory.',
    38,
  ],
  [
    'P13',
    'Privacy-Preserving Memory for LLM Agents',
    'T. Yamamoto, R. Mehta',
    2024,
    'USENIX Security',
    'T6',
    '2024-06-21',
    '2024-10-15',
    'Measures leakage and overhead of encrypted agent memory stores.',
    33,
  ],
  [
    'P14',
    'Reflection Replication: When Does Consolidation Help?',
    'L. Ortega, K. Hughes',
    2025,
    'ICLR',
    'T2',
    '2025-02-18',
    '2025-06-12',
    'Attempts to replicate reflection gains and isolates retrieval as a moderator.',
    29,
  ],
  [
    'P15',
    'Conflict-Aware Shared Memory',
    'D. Mensah, H. Ito',
    2025,
    'AAMAS',
    'T5',
    '2025-04-09',
    '2025-08-21',
    'Adds conflict detection and resolution to shared memory writes.',
    26,
  ],
  [
    'P16',
    'Audited Memory Editing',
    'P. Rossi, C. Bennett',
    2025,
    'ACL',
    'T3',
    '2025-06-14',
    '2025-10-03',
    'Introduces versioned audit logs into memory editing protocols.',
    22,
  ],
  [
    'P17',
    'Retrieval Cost Models for Agent Memory',
    'A. Sokolov, Y. Tan',
    2025,
    'SIGMOD',
    'T1',
    '2025-08-30',
    '2025-12-08',
    'Compares sharded and monolithic indexes at 100k–2M entries.',
    18,
  ],
  [
    'P18',
    'LongMemBench v2',
    'S. Iyer, R. Novak',
    2025,
    'ICLR',
    'T4',
    '2025-10-22',
    '2026-02-15',
    'Separates recall, update, and temporal tracks in long-term memory evaluation.',
    14,
  ],
  [
    'P19',
    'Memory Consensus in Agent Teams',
    'G. Alvarez, N. Bose',
    2025,
    'AAMAS',
    'T5',
    '2025-12-03',
    '2026-04-10',
    'Studies whether consensus protocols entrench early memory errors.',
    9,
  ],
  [
    'P20',
    'Machine Unlearning for Agent Memory',
    'I. Kovacs, W. Lin',
    2026,
    'USENIX Security',
    'T6',
    '2026-03-06',
    '2026-07-12',
    'Tests deletion requests and residual traces in memory embeddings.',
    4,
  ],
]

export const PAPERS: Paper[] = paperSeeds.map(
  ([id, title, authors, year, venue, topicId, publishedAt, ingestedAt, abstract, citations]) => ({
    id,
    title,
    authors,
    year,
    venue,
    abstract,
    topicId,
    publishedAt,
    ingestedAt,
    citations,
  }),
)

interface ClaimSeed {
  id: string
  paperId: string
  problemId: string
  statement: string
  method: string
  condition: Condition
  status: KnowledgeStatus
  initialStatus?: KnowledgeStatus
  limitation: string
}

const claimSeeds: ClaimSeed[] = [
  // P01
  {
    id: 'C01',
    paperId: 'P01',
    problemId: 'P1',
    statement:
      'Memory mechanisms fall into retrieval, consolidation, and editing families.',
    method: 'Literature synthesis',
    condition: c('60 systems', 'various', 'literature analysis', ['coverage'], '2020–2023'),
    status: 'Supported',
    limitation: 'Survey scope excludes non-English systems.',
  },
  {
    id: 'C02',
    paperId: 'P01',
    problemId: 'P1',
    statement: 'Retrieval is the most widely adopted memory mechanism.',
    method: 'Adoption coding',
    condition: c('60 systems', 'various', 'adoption coding', ['adoption_rate']),
    status: 'WeaklySupported',
    limitation: 'Adoption is inferred from abstracts.',
  },
  // P02
  {
    id: 'C03',
    paperId: 'P02',
    problemId: 'P1',
    statement:
      'Vector retrieval outperforms full-context prompting beyond 8k tokens.',
    method: 'Controlled comparison',
    condition: c('MemoryQA', 'GPT-4o', 'long-horizon QA', ['accuracy'], '8k–64k tokens'),
    status: 'Supported',
    limitation: 'Single memory store and model family.',
  },
  {
    id: 'C04',
    paperId: 'P02',
    problemId: 'P6',
    statement:
      'Retrieval latency grows linearly with memory size above 100k entries.',
    method: 'Cost analysis',
    condition: c('synthetic store', 'n/a', 'retrieval', ['latency_ms'], '10k–1M entries'),
    status: 'Qualified',
    limitation: 'Measured on one index implementation.',
  },
  // P03
  {
    id: 'C05',
    paperId: 'P03',
    problemId: 'P2',
    statement:
      'Reflection consolidates episodic traces into semantic memory.',
    method: 'Reflection loop',
    condition: c('ALFWorld', 'GPT-4', 'embodied QA', ['consolidation_rate']),
    status: 'Supported',
    limitation: 'Consolidation quality is judged by an LLM.',
  },
  {
    id: 'C06',
    paperId: 'P03',
    problemId: 'P2',
    statement: 'Reflection improves ALFWorld success by 9 points.',
    method: 'Reflection agent',
    condition: c('ALFWorld', 'GPT-4', 'embodied QA', ['success_rate']),
    status: 'Contested',
    initialStatus: 'Supported',
    limitation: 'Small evaluation set; no replication.',
  },
  // P04
  {
    id: 'C07',
    paperId: 'P04',
    problemId: 'P4',
    statement:
      'Existing benchmarks overestimate long-term memory ability.',
    method: 'Benchmark audit',
    condition: c('5 benchmarks', 'various', 'evaluation audit', ['validity']),
    status: 'Contested',
    initialStatus: 'Supported',
    limitation: 'Audit covers five benchmarks only.',
  },
  {
    id: 'C08',
    paperId: 'P04',
    problemId: 'P4',
    statement: 'Only two of five benchmarks include update events.',
    method: 'Benchmark audit',
    condition: c('5 benchmarks', 'n/a', 'benchmark audit', ['coverage']),
    status: 'Supported',
    limitation: 'Update events may be implicit in other tasks.',
  },
  // P05
  {
    id: 'C09',
    paperId: 'P05',
    problemId: 'P3',
    statement: 'Direct editing removes outdated facts in 87% of cases.',
    method: 'Direct memory editing',
    condition: c('EditBench', 'GPT-4o', 'fact editing', ['edit_success']),
    status: 'Supported',
    limitation: 'EditBench uses synthetic facts.',
  },
  {
    id: 'C10',
    paperId: 'P05',
    problemId: 'P3',
    statement: 'Editing causes collateral forgetting of related facts.',
    method: 'Controlled edit suite',
    condition: c('EditBench', 'GPT-4o', 'fact editing', ['collateral_forgetting']),
    status: 'Contested',
    initialStatus: 'Supported',
    limitation: 'Relatedness is defined by embedding similarity.',
  },
  // P06
  {
    id: 'C11',
    paperId: 'P06',
    problemId: 'P6',
    statement: 'Retrieval cost is dominated by index size, not query count.',
    method: 'Index benchmark',
    condition: c('synthetic store', 'n/a', 'retrieval', ['latency_ms'], 'up to 1M'),
    status: 'Superseded',
    initialStatus: 'Supported',
    limitation: 'Monolithic index only.',
  },
  {
    id: 'C12',
    paperId: 'P06',
    problemId: 'P6',
    statement:
      'Approximate indexes trade 3% recall for 40% lower latency.',
    method: 'Approximate index study',
    condition: c('MemoryQA', 'n/a', 'retrieval', ['recall@10', 'latency_ms']),
    status: 'Qualified',
    limitation: 'Trade-off varies with query distribution.',
  },
  // P07
  {
    id: 'C13',
    paperId: 'P07',
    problemId: 'P2',
    statement: 'Consolidation reduces tokens per episode by 18%.',
    method: 'Token accounting',
    condition: c('ALFWorld', 'GPT-4', 'embodied QA', ['tokens_per_episode']),
    status: 'Supported',
    limitation: 'Excludes retrieval overhead.',
  },
  {
    id: 'C14',
    paperId: 'P07',
    problemId: 'P2',
    statement: 'Reflection without retrieval degrades performance.',
    method: 'Ablation',
    condition: c('ALFWorld', 'GPT-4', 'embodied QA', ['success_rate']),
    status: 'Qualified',
    limitation: 'Only one ablation setting.',
  },
  // P08
  {
    id: 'C15',
    paperId: 'P08',
    problemId: 'P3',
    statement:
      'Decay-based forgetting improves out-of-distribution accuracy.',
    method: 'Decay schedules',
    condition: c('MemoryQA-OOD', 'GPT-4o', 'OOD QA', ['accuracy']),
    status: 'WeaklySupported',
    limitation: 'Gain is within one standard deviation.',
  },
  {
    id: 'C16',
    paperId: 'P08',
    problemId: 'P3',
    statement: 'Fixed decay schedules fail under distribution shift.',
    method: 'Distribution shift test',
    condition: c('MemoryQA-OOD', 'GPT-4o', 'OOD QA', ['accuracy']),
    status: 'Contested',
    limitation: 'Shift magnitude is not controlled.',
  },
  // P09
  {
    id: 'C17',
    paperId: 'P09',
    problemId: 'P1',
    statement:
      'Hybrid sparse-dense retrieval improves recall@10 by 6 points.',
    method: 'Hybrid retrieval',
    condition: c('MemoryQA', 'GPT-4o', 'long-horizon QA', ['recall@10']),
    status: 'Supported',
    limitation: 'Two retriever combination only.',
  },
  {
    id: 'C18',
    paperId: 'P09',
    problemId: 'P1',
    statement:
      'Retrieval quality, not memory size, dominates performance.',
    method: 'Ablation',
    condition: c('MemoryQA', 'GPT-4o', 'long-horizon QA', ['accuracy', 'recall']),
    status: 'Contested',
    limitation: 'Noisy-memory condition not fully swept.',
  },
  // P10
  {
    id: 'C19',
    paperId: 'P10',
    problemId: 'P5',
    statement:
      'Shared memory improves cross-agent task success by 12%.',
    method: 'Shared memory pool',
    condition: c('MultiAgentBench', 'GPT-4o', 'multi-agent QA', ['success_rate']),
    status: 'WeaklySupported',
    limitation: 'Team size limited to three agents.',
  },
  {
    id: 'C20',
    paperId: 'P10',
    problemId: 'P5',
    statement: 'Shared memory propagates errors across agents.',
    method: 'Error injection',
    condition: c('MultiAgentBench', 'GPT-4o', 'multi-agent QA', ['error_propagation']),
    status: 'Contested',
    limitation: 'Errors are synthetic.',
  },
  // P11
  {
    id: 'C21',
    paperId: 'P11',
    problemId: 'P7',
    statement:
      'Retrieval-augmented agents fail on temporal ordering questions.',
    method: 'Controlled benchmark',
    condition: c('TemporalQA', 'GPT-4o', 'temporal reasoning', ['accuracy']),
    status: 'Supported',
    limitation: 'TemporalQA is small and synthetic.',
  },
  {
    id: 'C22',
    paperId: 'P11',
    problemId: 'P7',
    statement:
      'Timestamp-aware retrieval improves temporal accuracy by 15 points.',
    method: 'Timestamp-aware retrieval',
    condition: c('TemporalQA', 'GPT-4o', 'temporal reasoning', ['accuracy']),
    status: 'Qualified',
    limitation: 'Timestamps are clean in the benchmark.',
  },
  // P12
  {
    id: 'C23',
    paperId: 'P12',
    problemId: 'P4',
    statement:
      'Evaluation should separate recall, precision, and update fidelity.',
    method: 'Metric design',
    condition: c('MemoryQA', 'n/a', 'evaluation', ['recall', 'precision', 'update_fidelity']),
    status: 'Supported',
    limitation: 'Metric suite not validated across domains.',
  },
  {
    id: 'C24',
    paperId: 'P12',
    problemId: 'P4',
    statement: 'Recall-only metrics hide update failures.',
    method: 'Metric ablation',
    condition: c('MemoryQA', 'n/a', 'evaluation', ['recall', 'update_fidelity']),
    status: 'Supported',
    limitation: 'Update failures are manually labeled.',
  },
  // P13
  {
    id: 'C25',
    paperId: 'P13',
    problemId: 'P8',
    statement:
      'Encrypted memory stores preserve utility with 8% overhead.',
    method: 'Encrypted store',
    condition: c('PrivateMemory', 'GPT-4o', 'private QA', ['accuracy', 'latency_ms']),
    status: 'Qualified',
    limitation: 'Threat model excludes side channels.',
  },
  {
    id: 'C26',
    paperId: 'P13',
    problemId: 'P8',
    statement: 'Agents can leak sensitive memories through retrieval.',
    method: 'Privacy audit',
    condition: c('PrivateMemory', 'GPT-4o', 'privacy audit', ['leak_rate']),
    status: 'Contested',
    limitation: 'Leakage prompts are hand-crafted.',
  },
  // P14
  {
    id: 'C27',
    paperId: 'P14',
    problemId: 'P2',
    statement: 'Reflection gains do not replicate on ALFWorld.',
    method: 'Replication study',
    condition: c('ALFWorld', 'GPT-4o', 'embodied QA', ['success_rate']),
    status: 'Contested',
    limitation: 'Prompt differences may explain the gap.',
  },
  {
    id: 'C28',
    paperId: 'P14',
    problemId: 'P2',
    statement:
      'Consolidation helps only when retrieval is available.',
    method: 'Moderator analysis',
    condition: c('ALFWorld', 'GPT-4o', 'embodied QA', ['success_rate']),
    status: 'Qualified',
    limitation: 'Retrieval availability is manipulated coarsely.',
  },
  // P15
  {
    id: 'C29',
    paperId: 'P15',
    problemId: 'P5',
    statement:
      'Conflict-aware shared memory reduces error propagation by 31%.',
    method: 'Conflict-aware writes',
    condition: c('MultiAgentBench', 'GPT-4o', 'multi-agent QA', ['error_propagation']),
    status: 'Supported',
    initialStatus: 'WeaklySupported',
    limitation: 'Conflict labels are model-generated.',
  },
  {
    id: 'C30',
    paperId: 'P15',
    problemId: 'P5',
    statement: 'Consensus protocols slow memory writes by 2.4x.',
    method: 'Latency benchmark',
    condition: c('MultiAgentBench', 'GPT-4o', 'multi-agent QA', ['write_latency']),
    status: 'Qualified',
    limitation: 'Local network only.',
  },
  // P16
  {
    id: 'C31',
    paperId: 'P16',
    problemId: 'P3',
    statement:
      'Audited editing reduces collateral forgetting to 6%.',
    method: 'Versioned edits',
    condition: c('EditBench', 'GPT-4o', 'fact editing', ['collateral_forgetting']),
    status: 'Supported',
    initialStatus: 'Unresolved',
    limitation: 'Audit overhead is not reported.',
  },
  {
    id: 'C32',
    paperId: 'P16',
    problemId: 'P3',
    statement: 'Edit protocols require versioned audit logs.',
    method: 'Protocol design',
    condition: c('EditBench', 'n/a', 'audit', ['audit_coverage']),
    status: 'Supported',
    limitation: 'No cross-system interoperability test.',
  },
  // P17
  {
    id: 'C33',
    paperId: 'P17',
    problemId: 'P6',
    statement:
      'Latency plateaus beyond 500k entries with sharded indexes.',
    method: 'Sharded index benchmark',
    condition: c('synthetic store', 'n/a', 'retrieval', ['latency_ms'], '100k–2M entries'),
    status: 'Unresolved',
    limitation: 'Plateau depends on shard count.',
  },
  {
    id: 'C34',
    paperId: 'P17',
    problemId: 'P6',
    statement: 'Sharding introduces cross-shard retrieval errors.',
    method: 'Error analysis',
    condition: c('MemoryQA', 'GPT-4o', 'retrieval', ['recall@10']),
    status: 'WeaklySupported',
    limitation: 'Error analysis is post hoc.',
  },
  // P18
  {
    id: 'C35',
    paperId: 'P18',
    problemId: 'P4',
    statement:
      'LongMemBench v2 separates recall, update, and temporal tracks.',
    method: 'Benchmark design',
    condition: c('LongMemBench v2', 'various', 'evaluation', ['coverage']),
    status: 'Supported',
    limitation: 'Temporal track is still small.',
  },
  {
    id: 'C36',
    paperId: 'P18',
    problemId: 'P4',
    statement:
      'Benchmark scores correlate only weakly with task success.',
    method: 'Correlation analysis',
    condition: c('LongMemBench v2', 'various', 'evaluation', ['correlation']),
    status: 'Contested',
    initialStatus: 'Supported',
    limitation: 'Task set is narrow.',
  },
  // P19
  {
    id: 'C37',
    paperId: 'P19',
    problemId: 'P5',
    statement: 'Agent teams converge on shared memory within three rounds.',
    method: 'Consensus protocol',
    condition: c('MultiAgentBench', 'GPT-4o', 'multi-agent QA', ['rounds_to_converge']),
    status: 'WeaklySupported',
    limitation: 'Convergence is measured by string similarity.',
  },
  {
    id: 'C38',
    paperId: 'P19',
    problemId: 'P5',
    statement: 'Memory consensus entrenches early errors.',
    method: 'Error persistence study',
    condition: c('MultiAgentBench', 'GPT-4o', 'multi-agent QA', ['error_persistence']),
    status: 'Contested',
    initialStatus: 'WeaklySupported',
    limitation: 'Initial errors are injected.',
  },
  // P20
  {
    id: 'C39',
    paperId: 'P20',
    problemId: 'P8',
    statement: 'Unlearning removes target memories with 94% success.',
    method: 'Machine unlearning',
    condition: c('UnlearnBench', 'GPT-4o', 'machine unlearning', ['forget_success']),
    status: 'Supported',
    initialStatus: 'Unresolved',
    limitation: 'Success is judged by retrieval probes.',
  },
  {
    id: 'C40',
    paperId: 'P20',
    problemId: 'P8',
    statement: 'Unlearning leaves recoverable traces in embeddings.',
    method: 'Embedding probing',
    condition: c('UnlearnBench', 'GPT-4o', 'machine unlearning', ['trace_recovery']),
    status: 'Contested',
    initialStatus: 'Supported',
    limitation: 'Probing requires white-box access.',
  },
]

// deterministic spatial layout per topic
const topicClaimIndex: Record<string, number> = {}
const topicCounts: Record<string, number> = {}
for (const s of claimSeeds) {
  const topic = PROBLEMS.find((p) => p.id === s.problemId)!.topicId
  topicCounts[topic] = (topicCounts[topic] ?? 0) + 1
}

export const CLAIMS: Claim[] = claimSeeds.map((s) => {
  const paper = PAPERS.find((p) => p.id === s.paperId)!
  const topic = PROBLEMS.find((p) => p.id === s.problemId)!.topicId
  const topicDef = TOPICS.find((t) => t.id === topic)!
  const idx = (topicClaimIndex[topic] = (topicClaimIndex[topic] ?? 0) + 1) - 1
  const golden = 2.399963229728653
  const angle = idx * golden
  const radius = 4.5 + Math.sqrt(idx + 1) * 4.6
  const x = Math.max(4, Math.min(96, topicDef.center[0] + Math.cos(angle) * radius))
  const y = Math.max(4, Math.min(96, topicDef.center[1] + Math.sin(angle) * radius * 0.78))
  return {
    id: s.id,
    paperId: s.paperId,
    problemId: s.problemId,
    statement: s.statement,
    finding: s.statement,
    method: s.method,
    condition: s.condition,
    limitation: s.limitation,
    initialStatus: s.initialStatus ?? s.status,
    status: s.status,
    position: [x, y],
    createdAt: paper.ingestedAt,
  }
})

export const EVIDENCE: Evidence[] = CLAIMS.flatMap((claim, i) => {
  const base = 3 + (i % 7)
  return [
    {
      id: `E${String(i * 2 + 1).padStart(2, '0')}`,
      claimId: claim.id,
      paperId: claim.paperId,
      section: ['Results', 'Analysis', 'Discussion', 'Method'][i % 4],
      page: base,
      quote: claim.statement,
      stance: 'Support' as const,
    },
    {
      id: `E${String(i * 2 + 2).padStart(2, '0')}`,
      claimId: claim.id,
      paperId: claim.paperId,
      section: 'Limitations',
      page: base + 1,
      quote: claim.limitation,
      stance: 'Contrast' as const,
    },
  ]
})

const evidenceFor = (claimId: string) =>
  EVIDENCE.filter((e) => e.claimId === claimId).map((e) => e.id)

const relationSeeds: Array<
  [string, RelationType, number, Relation['comparability'], string]
> = [
  ['C03', 'C02', 'Supports', 0.86, 'Comparable', 'Retrieval performance supports the adoption trend.'],
  ['C17', 'C03', 'Supports', 0.79, 'Comparable', 'Hybrid recall gains reinforce dense retrieval results.'],
  ['C18', 'C03', 'Qualifies', 0.72, 'Partial', 'Quality gains depend on memory noise.'],
  ['C04', 'C18', 'Extends', 0.68, 'Partial', 'Cost constraints extend the quality analysis.'],
  ['C11', 'C04', 'Qualifies', 0.74, 'Partial', 'Index composition changes the scaling slope.'],
  ['C12', 'C04', 'Qualifies', 0.70, 'Comparable', 'Approximation changes the latency trade-off.'],
  ['C33', 'C04', 'Supersedes', 0.81, 'Partial', 'Sharded indexes revise the linear scaling claim.'],
  ['C34', 'C33', 'Qualifies', 0.66, 'Partial', 'Cross-shard errors limit the plateau claim.'],
  ['C27', 'C06', 'Contradicts', 0.88, 'Partial', 'Replication does not reproduce the gain.'],
  ['C28', 'C05', 'Qualifies', 0.77, 'Comparable', 'Consolidation requires retrieval support.'],
  ['C14', 'C05', 'Qualifies', 0.73, 'Comparable', 'Without retrieval, consolidation degrades.'],
  ['C13', 'C05', 'Extends', 0.69, 'Comparable', 'Token savings extend the consolidation case.'],
  ['C10', 'C09', 'Contradicts', 0.84, 'Comparable', 'Edit success comes with collateral forgetting.'],
  ['C15', 'C10', 'Extends', 0.63, 'Partial', 'Decay introduces another side effect.'],
  ['C16', 'C15', 'Contradicts', 0.71, 'Partial', 'Fixed schedules fail under shift.'],
  ['C31', 'C09', 'Supersedes', 0.82, 'Comparable', 'Audited editing replaces direct editing.'],
  ['C32', 'C31', 'Refines', 0.80, 'Comparable', 'Audit logs refine the protocol.'],
  ['C08', 'C07', 'Supports', 0.75, 'Comparable', 'Missing update events support the benchmark critique.'],
  ['C35', 'C07', 'Extends', 0.78, 'Partial', 'A new benchmark extends the audit.'],
  ['C36', 'C35', 'Qualifies', 0.67, 'Partial', 'Score-success correlation is weak.'],
  ['C24', 'C23', 'Refines', 0.83, 'Comparable', 'Metric ablation refines the evaluation proposal.'],
  ['C20', 'C19', 'Contradicts', 0.86, 'Comparable', 'Error propagation undercuts the shared-memory gain.'],
  ['C29', 'C20', 'Extends', 0.74, 'Partial', 'Conflict-aware writes address propagation.'],
  ['C30', 'C29', 'Qualifies', 0.69, 'Comparable', 'Consensus costs latency.'],
  ['C38', 'C37', 'Contradicts', 0.72, 'Partial', 'Consensus can entrench errors.'],
  ['C19', 'C37', 'Supports', 0.70, 'Partial', 'Shared memory success supports convergence.'],
  ['C22', 'C21', 'Extends', 0.76, 'Comparable', 'Timestamp-aware retrieval extends temporal results.'],
  ['C40', 'C39', 'Contradicts', 0.87, 'Comparable', 'Residual traces challenge unlearning success.'],
  ['C26', 'C25', 'Contradicts', 0.80, 'Partial', 'Leakage undercuts encrypted-store utility.'],
  ['C25', 'C39', 'Qualifies', 0.64, 'Partial', 'Encryption constrains unlearning verification.'],
  ['C21', 'C07', 'Supports', 0.68, 'Comparable', 'Temporal failures support benchmark skepticism.'],
]

const addDays = (iso: string, days: number) => {
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export const RELATIONS: Relation[] = relationSeeds.map(
  ([sourceId, targetId, type, confidence, comparability, rationale], i) => {
    const source = CLAIMS.find((c) => c.id === sourceId)!
    const target = CLAIMS.find((c) => c.id === targetId)!
    const later = source.createdAt > target.createdAt ? source.createdAt : target.createdAt
    return {
      id: `R${String(i + 1).padStart(2, '0')}`,
      sourceId,
      targetId,
      type,
      confidence,
      comparability,
      rationale,
      evidenceIds: [...evidenceFor(sourceId), ...evidenceFor(targetId)],
      createdAt: addDays(later, 30),
    }
  },
)

export const EVENTS: KnowledgeEvent[] = [
  {
    id: 'K01',
    claimId: 'C07',
    time: '2025-05-10',
    from: 'Supported',
    to: 'Contested',
    triggerPaperId: 'P12',
    evidenceIds: [...evidenceFor('C07'), ...evidenceFor('C24')],
    reason:
      'Recall-only evaluation hides update failures; the benchmark critique no longer holds as stated.',
    operator: 'system',
    verified: true,
  },
  {
    id: 'K02',
    claimId: 'C10',
    time: '2024-06-20',
    from: 'Supported',
    to: 'Contested',
    triggerPaperId: 'P08',
    evidenceIds: [...evidenceFor('C10'), ...evidenceFor('C15')],
    reason: 'Decay schedules show collateral forgetting persists after edits.',
    operator: 'system',
    verified: true,
  },
  {
    id: 'K03',
    claimId: 'C06',
    time: '2025-06-15',
    from: 'Supported',
    to: 'Contested',
    triggerPaperId: 'P14',
    evidenceIds: [...evidenceFor('C06'), ...evidenceFor('C27')],
    reason: 'Independent replication does not reproduce the reported gain.',
    operator: 'system',
    verified: true,
  },
  {
    id: 'K04',
    claimId: 'C31',
    time: '2025-10-05',
    from: 'Unresolved',
    to: 'Supported',
    triggerPaperId: 'P16',
    evidenceIds: evidenceFor('C31'),
    reason: 'Audited editing reduces collateral forgetting in a controlled suite.',
    operator: 'system',
    verified: true,
  },
  {
    id: 'K05',
    claimId: 'C36',
    time: '2026-02-20',
    from: 'Supported',
    to: 'Contested',
    triggerPaperId: 'P18',
    evidenceIds: [...evidenceFor('C36'), ...evidenceFor('C35')],
    reason: 'Correlation between benchmark scores and task success is weak.',
    operator: 'system',
    verified: false,
  },
  {
    id: 'K06',
    claimId: 'C40',
    time: '2026-07-15',
    from: 'Supported',
    to: 'Contested',
    triggerPaperId: 'P20',
    evidenceIds: [...evidenceFor('C40'), ...evidenceFor('C39')],
    reason: 'Embedding probes recover traces after unlearning.',
    operator: 'system',
    verified: false,
  },
  {
    id: 'K07',
    claimId: 'C38',
    time: '2026-04-12',
    from: 'WeaklySupported',
    to: 'Contested',
    triggerPaperId: 'P19',
    evidenceIds: [...evidenceFor('C38'), ...evidenceFor('C37')],
    reason: 'Consensus entrenches early errors in team memory.',
    operator: 'system',
    verified: false,
  },
  {
    id: 'K08',
    claimId: 'C29',
    time: '2025-08-22',
    from: 'WeaklySupported',
    to: 'Supported',
    triggerPaperId: 'P15',
    evidenceIds: evidenceFor('C29'),
    reason: 'Conflict-aware writes reduce error propagation by 31%.',
    operator: 'system',
    verified: true,
  },
  {
    id: 'K09',
    claimId: 'C39',
    time: '2026-08-03',
    from: 'Unresolved',
    to: 'Supported',
    triggerPaperId: 'P20',
    evidenceIds: evidenceFor('C39'),
    reason: 'Unlearning reaches 94% deletion success on UnlearnBench.',
    operator: 'system',
    verified: true,
  },
  {
    id: 'K10',
    claimId: 'C11',
    time: '2025-12-10',
    from: 'Supported',
    to: 'Superseded',
    triggerPaperId: 'P17',
    evidenceIds: [...evidenceFor('C11'), ...evidenceFor('C33')],
    reason: 'Sharded indexes show latency plateaus rather than linear growth.',
    operator: 'system',
    verified: true,
  },
]

export const OPPORTUNITIES: Opportunity[] = [
  {
    id: 'O1',
    type: 'conflict',
    question:
      'Do reflection-based consolidation gains generalize beyond ALFWorld?',
    basis:
      'Two papers report opposite effects of reflection, but their retrieval setups and prompt protocols differ.',
    problemId: 'P2',
    supportClaimIds: ['C27', 'C28'],
    counterClaimIds: ['C06'],
    paperIds: ['P03', 'P14'],
    boundary:
      'ALFWorld, GPT-4/GPT-4o, reflection with and without retrieval. No cross-benchmark evaluation yet.',
    suggestedValidation:
      'Replicate on three long-horizon benchmarks with a shared prompt protocol; sweep retrieval availability.',
    validation: [
      { label: 'Reverse literature search', done: true, note: '12 related papers checked' },
      { label: 'Counterexample check', done: true, note: 'C06 is the main counterexample' },
      { label: 'Boundary defined', done: true },
      { label: 'Expert review', done: false },
    ],
    status: 'Validating',
    discoveredAt: '2025-06-20',
  },
  {
    id: 'O2',
    type: 'condition-gap',
    question:
      'Does retrieval quality still dominate when memory noise is high?',
    basis:
      'C18 claims retrieval quality dominates, but noisy-memory conditions were not fully swept.',
    problemId: 'P1',
    supportClaimIds: ['C18', 'C17'],
    counterClaimIds: ['C03'],
    paperIds: ['P02', 'P09'],
    boundary: 'MemoryQA only; noise levels 0–30%; dense and hybrid retrieval.',
    suggestedValidation:
      'Sweep noise from 0% to 60% and measure accuracy, recall, and answer faithfulness.',
    validation: [
      { label: 'Reverse literature search', done: true },
      { label: 'Counterexample check', done: false },
      { label: 'Boundary defined', done: true },
      { label: 'Expert review', done: false },
    ],
    status: 'Pending',
    discoveredAt: '2025-10-01',
  },
  {
    id: 'O3',
    type: 'limitation',
    question:
      'Why does audited editing still leave collateral forgetting?',
    basis:
      'C31 reduces collateral forgetting to 6%, but C10 shows related-fact degradation persists.',
    problemId: 'P3',
    supportClaimIds: ['C10', 'C31'],
    counterClaimIds: ['C32'],
    paperIds: ['P05', 'P08', 'P16'],
    boundary: 'Synthetic facts in EditBench; audit logs do not model semantic relatedness.',
    suggestedValidation:
      'Instrument edit traces and measure related-fact retrieval before and after versioned edits.',
    validation: [
      { label: 'Reverse literature search', done: true },
      { label: 'Counterexample check', done: true },
      { label: 'Boundary defined', done: false },
      { label: 'Expert review', done: false },
    ],
    status: 'Needs Validation',
    discoveredAt: '2025-11-12',
  },
  {
    id: 'O4',
    type: 'conflict',
    question:
      'Can shared memory improve team success without propagating errors?',
    basis:
      'C19 reports a 12% gain, while C20 and C38 show error propagation and entrenchment.',
    problemId: 'P5',
    supportClaimIds: ['C20', 'C38'],
    counterClaimIds: ['C19', 'C29'],
    paperIds: ['P10', 'P15', 'P19'],
    boundary: 'Three-agent teams on MultiAgentBench; synthetic error injection.',
    suggestedValidation:
      'Run error-injection studies across team sizes and conflict-resolution policies.',
    validation: [
      { label: 'Reverse literature search', done: true },
      { label: 'Counterexample check', done: true },
      { label: 'Boundary defined', done: true },
      { label: 'Expert review', done: false },
    ],
    status: 'Pending',
    discoveredAt: '2026-04-15',
  },
  {
    id: 'O5',
    type: 'condition-gap',
    question:
      'Which memory representations preserve temporal validity intervals?',
    basis:
      'C21 shows temporal ordering failures; C22 improves accuracy only with clean timestamps.',
    problemId: 'P7',
    supportClaimIds: ['C21', 'C22'],
    counterClaimIds: ['C07'],
    paperIds: ['P11', 'P12'],
    boundary: 'TemporalQA only; synthetic timestamps; no validity intervals.',
    suggestedValidation:
      'Build a benchmark with overlapping validity intervals and stale-fact traps.',
    validation: [
      { label: 'Reverse literature search', done: true },
      { label: 'Counterexample check', done: true },
      { label: 'Boundary defined', done: true },
      { label: 'Expert review', done: true },
    ],
    status: 'Validated',
    discoveredAt: '2025-03-18',
  },
  {
    id: 'O6',
    type: 'limitation',
    question: 'Are deleted memories truly unrecoverable after unlearning?',
    basis:
      'C39 reports 94% deletion success, but C40 recovers traces from embeddings.',
    problemId: 'P8',
    supportClaimIds: ['C40'],
    counterClaimIds: ['C39'],
    paperIds: ['P20'],
    boundary: 'UnlearnBench; white-box probing; single model family.',
    suggestedValidation:
      'Evaluate black-box and white-box recovery attacks across model families.',
    validation: [
      { label: 'Reverse literature search', done: true },
      { label: 'Counterexample check', done: true },
      { label: 'Boundary defined', done: true },
      { label: 'Expert review', done: true, note: 'Rejected after counter-evidence review' },
    ],
    status: 'Rejected',
    discoveredAt: '2026-08-10',
  },
]

export const DEMO: DemoData = {
  topics: TOPICS,
  problems: PROBLEMS,
  papers: PAPERS,
  claims: CLAIMS,
  evidence: EVIDENCE,
  relations: RELATIONS,
  events: EVENTS,
  opportunities: OPPORTUNITIES,
}
