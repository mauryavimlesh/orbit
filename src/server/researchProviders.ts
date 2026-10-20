import {
  AssociatedCodeRepo,
  ArtworkTheme,
  CitationItem,
  CitationNetworkEdge,
  CitationNetworkNode,
  CitationNetworkPayload,
  DiscoveryItem,
  DomainCategory,
  EquationSpec,
  EvidenceStatus,
  ProviderRecordLink,
  ProviderStatusReport,
  ResearchProviderId,
  SourceType,
  VisualSandboxId,
} from '../types/orbit';

const POLITE_EMAIL = process.env.USER_EMAIL || 'vim74590@gmail.com';

export interface UnifiedSearchParams {
  query: string;
  category?: string;
  domain?: string;
  providers?: ResearchProviderId[];
  yearFrom?: number;
  yearTo?: number;
  sortBy?: 'relevance' | 'newest' | 'citations';
  openAccessOnly?: boolean;
  publicationType?: 'all' | 'peer_reviewed' | 'preprint';
  page?: number;
  perProviderLimit?: number;
}

export interface UnifiedSearchResponse {
  query: string;
  items: DiscoveryItem[];
  totalBeforeDedupe: number;
  totalAfterDedupe: number;
  duplicatesMerged: number;
  sourcesChecked: string[];
  providerReports: ProviderStatusReport[];
  retrievedAt: string;
}

// Timeout-aware fetch with polite User-Agent and exponential backoff on 5xx
async function fetchProviderUrl(
  url: string,
  options: RequestInit = {},
  timeoutMs = 7500,
  retries = 1
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'User-Agent': `ORBIT-Research-Engine/2.0 (mailto:${POLITE_EMAIL})`,
          ...(options.headers || {}),
        },
      });
      clearTimeout(timer);
      if (res.ok) return res;
      if (res.status >= 500 && attempt < retries) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        continue;
      }
      return res;
    } catch (err) {
      clearTimeout(timer);
      if (attempt >= retries) throw err;
      await new Promise((r) => setTimeout(r, 350));
    }
  }
  throw new Error(`Request timed out for ${url}`);
}

export function reconstructOpenAlexAbstract(
  invertedIndex: Record<string, number[]> | undefined
): string {
  if (!invertedIndex || typeof invertedIndex !== 'object') return '';
  const wordsWithPos: Array<{ pos: number; word: string }> = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    if (Array.isArray(positions)) {
      for (const pos of positions) {
        wordsWithPos.push({ pos, word });
      }
    }
  }
  wordsWithPos.sort((a, b) => a.pos - b.pos);
  return wordsWithPos.map((w) => w.word).join(' ');
}

export function normalizeDoi(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const cleaned = String(raw)
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '')
    .trim()
    .toLowerCase();
  return cleaned.startsWith('10.') ? cleaned : undefined;
}

export function normalizeArxivId(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const str = String(raw).trim();
  const match =
    str.match(/arxiv\.org\/(?:abs|pdf)\/([0-9]{4}\.[0-9]{4,5}(?:v\d+)?)/i) ||
    str.match(/^arxiv:([0-9]{4}\.[0-9]{4,5}(?:v\d+)?)/i) ||
    str.match(/^([0-9]{4}\.[0-9]{4,5})(?:v\d+)?$/);
  if (match) {
    return match[1].replace(/v\d+$/i, '');
  }
  return undefined;
}

export function inferDomainFromText(
  rawText: string,
  explicitDomain?: string
): DomainCategory {
  if (
    explicitDomain &&
    explicitDomain !== 'All' &&
    [
      'Quantum & Physics',
      'AI & Computing',
      'Biomedicine & Genomics',
      'Open-Source & DevTools',
      'Clean Tech & Public Service',
      'Startups & Policy',
      'Space & Astronomy',
      'Mathematics',
      'Social Sciences',
      'Political Science',
      'Economics',
      'Civil & Computer Engineering',
      'Materials Science',
      'Emerging Technologies',
    ].includes(explicitDomain)
  ) {
    return explicitDomain as DomainCategory;
  }

  const t = rawText.toLowerCase();
  if (
    /(political|democracy|electoral|governance|geopolit|public administration|parliament|voting|regime|constitutional|international relations)/.test(
      t
    )
  ) {
    return 'Political Science';
  }
  if (
    /(macroeconom|microeconom|monetary policy|inflation|econometric|fiscal|gdp|central bank|labor market|wage|repec|interest rate|trade policy)/.test(
      t
    )
  ) {
    return 'Economics';
  }
  if (
    /(exoplanet|jwst|astrophys|cosmolog|galaxy|telescope|stellar|orbital|black hole|supernova)/.test(
      t
    )
  ) {
    return 'Space & Astronomy';
  }
  if (
    /(theorem|geometry|topolog|algebra|differential equation|combinator|number theory|manifold|hilbert|banach)/.test(
      t
    )
  ) {
    return 'Mathematics';
  }
  if (
    /(crispr|genom|protein|biomed|clinical|cell|hemoglobin|disease|medical|physiology|oncology|immunolog|rna|dna|pubmed|patient|therapy)/.test(
      t
    )
  ) {
    return 'Biomedicine & Genomics';
  }
  if (
    /(water|climate|solar|mof-|microgrid|battery|carbon|environmental|atmospheric|emissions|ecological|renewable)/.test(
      t
    )
  ) {
    return 'Clean Tech & Public Service';
  }
  if (
    /(seismic|civil engineering|structural|bridge|concrete|geotechnical|finite element|fluid dynamics|hydraulics|transportation|earthquake)/.test(
      t
    )
  ) {
    return 'Civil & Computer Engineering';
  }
  if (
    /(crystallograph|perovskite|superconduct|nanoporous|alloy|polymer|catalys|materials science|graphene)/.test(
      t
    )
  ) {
    return 'Materials Science';
  }
  if (
    /(quantum|qubit|surface code|photon|condensed matter|relativity|particle physics|thermodynamic)/.test(
      t
    )
  ) {
    return 'Quantum & Physics';
  }
  if (/(sociolog|psycholog|anthropolog|education|demographic|inequality|behavioral)/.test(t)) {
    return 'Social Sciences';
  }
  return 'AI & Computing';
}

function selectArtworkAndSandbox(domain: DomainCategory): {
  artworkTheme: ArtworkTheme;
  visualSandboxId: VisualSandboxId;
} {
  switch (domain) {
    case 'Quantum & Physics':
    case 'Space & Astronomy':
    case 'Mathematics':
      return { artworkTheme: 'quantum_twilight', visualSandboxId: 'quantum_threshold' };
    case 'Biomedicine & Genomics':
      return { artworkTheme: 'biotech_bohr', visualSandboxId: 'hemoglobin_bohr' };
    case 'Clean Tech & Public Service':
    case 'Materials Science':
      return { artworkTheme: 'clean_energy_grid', visualSandboxId: 'hemoglobin_bohr' };
    case 'Civil & Computer Engineering':
    case 'Open-Source & DevTools':
      return { artworkTheme: 'geospatial_splatting', visualSandboxId: 'repo_pipeline' };
    case 'Political Science':
    case 'Economics':
    case 'Social Sciences':
    case 'Startups & Policy':
      return { artworkTheme: 'scholarly_paper', visualSandboxId: 'sparse_attention' };
    default:
      return { artworkTheme: 'sparse_attention', visualSandboxId: 'sparse_attention' };
  }
}

// Extract real LaTeX formulas from abstract/text or provide domain-grounded canonical equation
export function extractEquationsFromText(
  title: string,
  abstractText: string,
  domain: DomainCategory
): EquationSpec[] {
  const equations: EquationSpec[] = [];
  const combined = `${title} ${abstractText}`;

  // 1. Check if the paper abstract contains explicit inline or display LaTeX ($...$ or $$...$$)
  const latexMatches = Array.from(
    abstractText.matchAll(/\$\$([^$]{4,140})\$\$|\$([^$]{4,95})\$/g)
  );
  for (let i = 0; i < Math.min(2, latexMatches.length); i++) {
    const rawLatex = (latexMatches[i][1] || latexMatches[i][2] || '').trim();
    if (rawLatex && /[=<>\\^_{}+-]/.test(rawLatex)) {
      equations.push({
        id: `eq-extracted-${i}`,
        title: `Mathematical Expression from Manuscript (${i + 1})`,
        formula: rawLatex,
        variables: [
          {
            symbol: 'Expression',
            meaning: 'Extracted directly from author abstract LaTeX notation',
            unit: 'manuscript notation',
          },
        ],
        intuition: `Formal mathematical relationship stated in the abstract of "${title.slice(0, 70)}".`,
      });
    }
  }

  if (equations.length > 0) return equations;

  // 2. Domain-specific quantitative reference relationships when relevant keywords appear
  const lower = combined.toLowerCase();
  if (/(quantum|surface code|qubit|error correction|stabilizer)/.test(lower)) {
    equations.push({
      id: 'eq-qec-scaling',
      title: 'Topological Surface Code Error Suppression Law',
      formula: '\\varepsilon_L(d) \\approx C \\left(\\frac{p}{p_{\\text{th}}}\\right)^{\\frac{d+1}{2}} = \\frac{\\varepsilon_0}{\\Lambda^{(d-1)/2}}',
      variables: [
        { symbol: '\\varepsilon_L(d)', meaning: 'Logical error rate at code distance d', unit: 'per cycle' },
        { symbol: 'p, p_{\\text{th}}', meaning: 'Physical gate error rate & threshold (~1%)', unit: 'probability' },
        { symbol: '\\Lambda', meaning: 'Below-threshold error suppression ratio', unit: 'dimensionless' },
      ],
      intuition:
        'When physical gate error p < p_th, increasing lattice distance d exponentially suppresses logical errors.',
    });
  } else if (/(attention|transformer|softmax|llm|neural network|deep learning)/.test(lower)) {
    equations.push({
      id: 'eq-scaled-attention',
      title: 'Scaled Dot-Product & IO-Tiled Softmax Attention',
      formula: '\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}} + M\\right)V',
      variables: [
        { symbol: 'Q, K, V', meaning: 'Query, Key, and Value projection matrices', unit: '\\mathbb{R}^{N \\times d_k}' },
        { symbol: '\\sqrt{d_k}', meaning: 'Variance-stabilizing head dimension scaling factor', unit: 'scalar' },
        { symbol: 'M', meaning: 'Causal or sparse attention mask matrix', unit: '\\{0, -\\infty\\}' },
      ],
      intuition:
        'Normalizing inner products by sqrt(d_k) prevents softmax saturation into vanishing-gradient regions at large embedding dimensions.',
    });
  } else if (/(gaussian splatting|radiance field|nerf|photogrammetry|3d reconstruction)/.test(lower)) {
    equations.push({
      id: 'eq-3dgs-blending',
      title: 'Anisotropic 3D Gaussian Alpha-Compositing',
      formula: 'C(\\mathbf{p}) = \\sum_{i \\in N} c_i \\alpha_i \\prod_{j=1}^{i-1} (1 - \\alpha_j), \\quad \\Sigma\' = J W \\Sigma W^T J^T',
      variables: [
        { symbol: '\\Sigma', meaning: '3D covariance matrix R S S^T R^T', unit: '\\mathbb{R}^{3 \\times 3}' },
        { symbol: 'J, W', meaning: 'Perspective projection Jacobian & viewing transform', unit: 'matrix' },
        { symbol: '\\alpha_i', meaning: '2D projected Gaussian opacity contribution', unit: '[0, 1]' },
      ],
      intuition:
        'Projects 3D anisotropic Gaussians into 2D screen space via an affine Jacobian approximation for real-time differentiable rasterization.',
    });
  } else if (/(econom|inflation|monetary|fiscal|gdp|regression|policy|political|voting|welfare)/.test(lower)) {
    equations.push({
      id: 'eq-panel-did',
      title: 'Two-Way Fixed Effects & Causal Panel Specification',
      formula: 'Y_{it} = \\alpha_i + \\gamma_t + \\beta \\, D_{it} + \\mathbf{X}_{it}^\\top \\boldsymbol{\\theta} + \\varepsilon_{it}',
      variables: [
        { symbol: 'Y_{it}', meaning: 'Observed outcome for unit i at period t', unit: 'dependent variable' },
        { symbol: '\\alpha_i, \\gamma_t', meaning: 'Unit-level and time-period fixed effects', unit: 'intercepts' },
        { symbol: '\\beta', meaning: 'Average treatment / policy effect parameter', unit: 'causal elasticity' },
      ],
      intuition:
        'Isolates the policy or treatment effect beta from time-invariant unit heterogeneity and common macroeconomic shocks.',
    });
  } else if (/(structural|civil|seismic|finite element|fluid|stress|strain|mechanics)/.test(lower)) {
    equations.push({
      id: 'eq-structural-dynamics',
      title: 'Coupled Structural Dynamics & Damped Equilibrium',
      formula: '\\mathbf{M}\\ddot{\\mathbf{u}}(t) + \\mathbf{C}\\dot{\\mathbf{u}}(t) + \\mathbf{K}\\mathbf{u}(t) = \\mathbf{F}_{\\text{ext}}(t)',
      variables: [
        { symbol: '\\mathbf{M}, \\mathbf{C}, \\mathbf{K}', meaning: 'Mass, damping, and stiffness matrices', unit: 'SI structural matrices' },
        { symbol: '\\mathbf{u}(t)', meaning: 'Nodal displacement vector over time', unit: 'meters (m)' },
        { symbol: '\\mathbf{F}_{\\text{ext}}(t)', meaning: 'External seismic or mechanical load excitation', unit: 'Newtons (N)' },
      ],
      intuition:
        'Balances inertial, viscous damping, and elastic restoring forces across discretized finite elements under dynamic loading.',
    });
  } else if (/(crispr|protein|hemoglobin|binding|enzyme|kinetics|clinical|gene|biomed)/.test(lower)) {
    equations.push({
      id: 'eq-hill-binding',
      title: 'Cooperative Ligand Binding & Fractional Saturation (Hill Equation)',
      formula: '\\theta = \\frac{[L]^{n_H}}{K_d + [L]^{n_H}} = \\frac{(p\\text{O}_2)^{n_H}}{(P_{50})^{n_H} + (p\\text{O}_2)^{n_H}}',
      variables: [
        { symbol: '\\theta', meaning: 'Fraction of macromolecular binding sites occupied', unit: 'ratio [0, 1]' },
        { symbol: 'K_d, P_{50}', meaning: 'Apparent dissociation constant / half-saturation pressure', unit: 'concentration / mmHg' },
        { symbol: 'n_H', meaning: 'Hill coefficient measuring allosteric cooperativity', unit: 'dimensionless' },
      ],
      intuition:
        'Quantifies how cooperative subunit interactions create a steep sigmoidal switch in biological binding affinity.',
    });
  }

  return equations;
}

interface NormalizedCandidate {
  id: string;
  canonicalId: string;
  title: string;
  abstractText: string;
  hasRealAbstract: boolean;
  authors: string[];
  publishedAt: string;
  publicationYear: number;
  venue: string;
  sourceName: string;
  sourceType: SourceType;
  evidenceStatus: EvidenceStatus;
  sourceUrl: string;
  pdfUrl?: string;
  isOpenAccess: boolean;
  doi?: string;
  pmid?: string;
  pmcid?: string;
  arxivId?: string;
  citationCount: number;
  referenceCount: number;
  primaryProvider: ResearchProviderId;
  providerDisplayName: string;
  domain: DomainCategory;
  associatedRepos: AssociatedCodeRepo[];
}

function buildDiscoveryItemFromCandidate(
  c: NormalizedCandidate,
  contributingSources: string[],
  providerLinks: ProviderRecordLink[],
  query: string,
  retrievedAt: string
): DiscoveryItem {
  const { artworkTheme, visualSandboxId } = selectArtworkAndSandbox(c.domain);
  const equations = extractEquationsFromText(c.title, c.abstractText, c.domain);

  const summaryDisplay = c.hasRealAbstract
    ? c.abstractText
    : `Metadata record retrieved from ${contributingSources.join(', ')} (${c.venue || c.sourceName}, ${c.publishedAt}). The publisher did not deposit an open-text abstract in this metadata feed; use the source link to view the original record.`;

  const shortWhy = c.hasRealAbstract
    ? c.abstractText.slice(0, 240) + (c.abstractText.length > 240 ? '...' : '')
    : `${c.evidenceStatus} work published in ${c.venue || c.sourceName} (${c.publishedAt})${
        c.citationCount > 0 ? ` · Cited ${c.citationCount} times` : ''
      }.`;

  const refs: CitationItem[] = providerLinks.map((pl, idx) => ({
    id: `ref-${c.id}-${idx}`,
    label: `${c.title} (${pl.providerName} Record)`,
    authors: c.authors.slice(0, 4).join(', ') || 'Listed on source record',
    venue: c.venue || pl.providerName,
    year: String(c.publicationYear || c.publishedAt.slice(0, 4)),
    url: pl.url,
    doiOrId: pl.externalId || c.canonicalId,
    statusLabel:
      c.evidenceStatus === 'Preprint / Not Yet Peer-Reviewed'
        ? 'Preprint Record'
        : c.isOpenAccess
        ? 'Open Access Full Text'
        : 'Verified Bibliographic Record',
  }));

  return {
    id: c.id,
    canonicalId: c.canonicalId,
    title: c.title,
    shortSubtitle: `${c.venue || c.sourceName} · ${c.publishedAt}${
      c.citationCount > 0 ? ` · ${c.citationCount.toLocaleString()} citations` : ''
    }`,
    oneSentenceWhyItMatters: shortWhy,
    domain: c.domain,
    sourceName: c.venue || c.sourceName,
    sourceType: c.sourceType,
    evidenceStatus: c.evidenceStatus,
    publishedAt: c.publishedAt,
    retrievedAt,
    sourceUrl: c.sourceUrl,
    authors: c.authors.length > 0 ? c.authors : ['Authors listed on primary source record'],
    artworkTheme,
    visualSandboxId,
    isLiveFetched: true,
    fullTextAvailable: c.isOpenAccess || Boolean(c.pdfUrl),
    fullTextUrl: c.pdfUrl || c.sourceUrl,
    highStakesMedicalNotice: c.domain === 'Biomedicine & Genomics',
    relatedRepoQuery: c.associatedRepos[0]?.fullName || query || c.title.slice(0, 50),
    primaryProvider: c.primaryProvider,
    contributingSources,
    providerLinks,
    doi: c.doi,
    pmid: c.pmid,
    pmcid: c.pmcid,
    arxivId: c.arxivId,
    citationCount: c.citationCount,
    referenceCount: c.referenceCount,
    venue: c.venue,
    publicationYear: c.publicationYear,
    associatedRepos: c.associatedRepos,
    signals: {
      freshness: `Published ${c.publishedAt}`,
      evidenceTier:
        c.evidenceStatus === 'Peer-Reviewed'
          ? 'High (Empirical / Replicated)'
          : 'Moderate (Preprint / Primary Code)',
      momentum:
        c.citationCount > 0
          ? `${c.citationCount.toLocaleString()} Citations · ${contributingSources.join(' + ')}`
          : `Indexed in ${contributingSources.join(' + ')}`,
      novelty: `Verified via ${contributingSources.join(', ')}`,
      learningValue:
        c.isOpenAccess || c.pdfUrl
          ? 'Open-Access PDF / Full Text Available'
          : 'Verified Abstract & Source Metadata',
    },
    readerLayers: {
      quickOrientation: summaryDisplay,
      sourceAndStatus: `Retrieved from ${contributingSources.join(', ')}. Canonical ID: ${
        c.canonicalId
      }. Venue: ${c.venue || c.sourceName}. Evidence status: ${c.evidenceStatus}. ${
        c.isOpenAccess || c.pdfUrl
          ? `Open-access full text / PDF link available (${c.pdfUrl || c.sourceUrl}).`
          : 'Only metadata and abstract are openly deposited; full article access is hosted on the original publisher page.'
      }`,
      beginnerExplanation: c.hasRealAbstract
        ? `Core research summary (${c.venue || c.sourceName}, ${c.publishedAt}): ${c.abstractText}`
        : `This ${c.evidenceStatus.toLowerCase()} record ("${c.title}") was published in ${
            c.venue || c.sourceName
          } (${c.publishedAt}). Open the source link to read the full manuscript.`,
      beginnerExplanationHinglish: c.hasRealAbstract
        ? `Yeh research ("${c.title}", ${c.publishedAt}) ${
            c.venue || c.sourceName
          } se retrieve kiya gaya hai: ${c.abstractText.slice(0, 420)}`
        : `Yeh paper ("${c.title}") ${c.venue || c.sourceName} (${
            c.publishedAt
          }) mein published hai. Full manuscript padhne ke liye primary source link dekhein.`,
      prerequisites: [
        `Foundational concepts in ${c.domain}`,
        'Empirical research design & citation verification',
      ],
      historicalFoundations: `Published in ${c.venue || c.sourceName} (${c.publishedAt}). ${
        c.citationCount > 0
          ? `Cited by ${c.citationCount.toLocaleString()} subsequent scholarly works.`
          : 'Indexed in multi-source scholarly discovery.'
      }`,
      coreMechanism: c.hasRealAbstract
        ? [
            c.abstractText,
            `Source provenance: ${contributingSources.join(' · ')} (${c.canonicalId}).`,
          ]
        : [
            'Full methodological details are hosted on the publisher page (open abstract not deposited in metadata feed).',
          ],
      coreMechanismHinglish: [
        c.hasRealAbstract
          ? c.abstractText
          : 'Full methodology publisher ke original page par upalabdh hai.',
      ],
      methodsAndEvidence: `Venue: ${c.venue || c.sourceName} (${c.publishedAt}). Evidence status: ${
        c.evidenceStatus
      }. Citations recorded: ${c.citationCount}.`,
      findings: c.hasRealAbstract
        ? c.abstractText
        : 'Open the original DOI/source record to inspect full experimental findings, tables, and figures.',
      limitationsAndUncertainty:
        c.evidenceStatus === 'Preprint / Not Yet Peer-Reviewed'
          ? 'Preprint Notice: This manuscript is a scientific preprint and has not yet completed formal journal peer review. Verify claims against independent replications.'
          : c.isOpenAccess
          ? 'Open-access article. Always inspect sample sizes, statistical controls, and boundary conditions in the full text.'
          : 'Metadata-only record in open indices; inspect the full publisher text for complete methodological controls.',
      applicationsAndImplications: `Contributes to ${c.domain} literature and connected citation graphs.`,
      criticalAnalysisAndFalsifiability:
        'Examine citing literature and replication studies in the Citation Network Graph below to evaluate external validity.',
      relatedWork: providerLinks.map((p) => `${p.providerName}: ${p.url}`),
      whatToWatchNext: 'Track incoming citations and related code implementations.',
      references: refs,
    },
    equations,
    quiz: [
      {
        id: `quiz-${c.id}`,
        question: `What is the verification status and provenance of "${c.title.slice(0, 60)}..."?`,
        options: [
          'Unverified social media post without bibliographic identifiers',
          `${c.evidenceStatus} indexed via ${contributingSources.join(', ')} (${c.publishedAt})`,
          'Synthetic mockup record with no external link',
          'Guaranteed universal law requiring no methodological inspection',
        ],
        correctIndex: 1,
        explanationWhyRight: `This record was retrieved from ${contributingSources.join(
          ', '
        )} with status "${c.evidenceStatus}" and publication date ${c.publishedAt}.`,
        misconceptionDiagnosed: 'Always distinguish preprints, peer-reviewed articles, and metadata-only records.',
      },
    ],
  };
}

// ============================================================================
// 10 OFFICIAL RESEARCH PROVIDER ADAPTERS
// ============================================================================

// A. OpenAlex Adapter (https://api.openalex.org/works)
async function queryOpenAlex(
  params: UnifiedSearchParams
): Promise<{ candidates: NormalizedCandidate[]; report: ProviderStatusReport }> {
  const start = Date.now();
  const limit = params.perProviderLimit || 6;
  const page = params.page || 1;
  const filters: string[] = [];

  if (params.yearFrom) {
    filters.push(`from_publication_date:${params.yearFrom}-01-01`);
  }
  if (params.yearTo) {
    filters.push(`to_publication_date:${params.yearTo}-12-31`);
  }
  if (params.openAccessOnly) {
    filters.push('open_access.is_oa:true');
  }
  if (params.publicationType === 'preprint') {
    filters.push('type:preprint');
  } else if (params.publicationType === 'peer_reviewed') {
    filters.push('type:article');
  }

  const sortParam =
    params.sortBy === 'newest'
      ? '&sort=publication_date:desc'
      : params.sortBy === 'citations'
      ? '&sort=cited_by_count:desc'
      : '';

  const filterParam = filters.length > 0 ? `&filter=${filters.join(',')}` : '';
  const apiKeyParam = process.env.OPENALEX_API_KEY
    ? `&api_key=${encodeURIComponent(process.env.OPENALEX_API_KEY)}`
    : '';

  const endpoint = `https://api.openalex.org/works?search=${encodeURIComponent(
    params.query
  )}${filterParam}${sortParam}&page=${page}&per-page=${limit}&mailto=${encodeURIComponent(
    POLITE_EMAIL
  )}${apiKeyParam}`;

  try {
    const res = await fetchProviderUrl(endpoint);
    if (!res.ok) {
      return {
        candidates: [],
        report: {
          providerId: 'openalex',
          providerName: 'OpenAlex',
          status: res.status === 429 ? 'rate_limited' : 'error',
          count: 0,
          latencyMs: Date.now() - start,
          endpointUsed: 'https://api.openalex.org/works',
          message: `HTTP ${res.status}`,
          keyConfigured: Boolean(process.env.OPENALEX_API_KEY),
        },
      };
    }

    const data = await res.json();
    const candidates: NormalizedCandidate[] = [];

    for (let i = 0; i < (data.results || []).length; i++) {
      const w = data.results[i];
      if (!w?.title) continue;
      const doi = normalizeDoi(w.doi || w.ids?.doi);
      const pmid = w.ids?.pmid
        ? String(w.ids.pmid).replace(/^https?:\/\/pubmed\.ncbi\.nlm\.nih\.gov\//i, '').replace(/\/$/, '')
        : undefined;
      const pmcid = w.ids?.pmcid || undefined;
      const oaId = String(w.id || '').replace(/^https?:\/\/openalex\.org\//i, '');
      const abstractText = reconstructOpenAlexAbstract(w.abstract_inverted_index).trim();
      const hasRealAbstract = abstractText.length > 25;
      const isPreprint =
        w.type === 'preprint' ||
        w.primary_location?.source?.type === 'repository' ||
        /arxiv|biorxiv|medrxiv|ssrn|repec/i.test(w.primary_location?.source?.display_name || '');

      const pubDate = w.publication_date || `${w.publication_year || 2025}-01-01`;
      const pubYear = Number(w.publication_year || pubDate.slice(0, 4)) || 2025;
      const isOa = Boolean(w.open_access?.is_oa);
      const pdfUrl =
        w.open_access?.oa_url ||
        w.primary_location?.pdf_url ||
        w.best_oa_location?.pdf_url ||
        undefined;
      const venue =
        w.primary_location?.source?.display_name ||
        (isPreprint ? 'Open Repository / Preprint' : 'Scholarly Publication');
      const authors = (w.authorships || [])
        .slice(0, 6)
        .map((a: any) => a.author?.display_name)
        .filter(Boolean);

      const canonicalId = doi ? `doi:${doi}` : `openalex:${oaId || i}`;
      const slug = (doi || oaId || `${i}`).replace(/[^a-zA-Z0-9_-]/g, '-');

      candidates.push({
        id: `oa-${slug}`,
        canonicalId,
        title: String(w.title).trim(),
        abstractText,
        hasRealAbstract,
        authors,
        publishedAt: pubDate,
        publicationYear: pubYear,
        venue,
        sourceName: `OpenAlex · ${venue}`,
        sourceType: isPreprint ? 'Preprint (arXiv / bioRxiv)' : 'Peer-Reviewed Journal',
        evidenceStatus: isPreprint ? 'Preprint / Not Yet Peer-Reviewed' : 'Peer-Reviewed',
        sourceUrl: w.doi || w.primary_location?.landing_page_url || w.id || 'https://openalex.org',
        pdfUrl,
        isOpenAccess: isOa,
        doi,
        pmid,
        pmcid,
        citationCount: Number(w.cited_by_count || 0),
        referenceCount: Array.isArray(w.referenced_works) ? w.referenced_works.length : 0,
        primaryProvider: 'openalex',
        providerDisplayName: 'OpenAlex',
        domain: inferDomainFromText(
          `${params.query} ${w.title} ${w.primary_topic?.display_name || ''} ${venue}`,
          params.domain
        ),
        associatedRepos: [],
      });
    }

    return {
      candidates,
      report: {
        providerId: 'openalex',
        providerName: 'OpenAlex',
        status: 'ok',
        count: candidates.length,
        latencyMs: Date.now() - start,
        endpointUsed: 'https://api.openalex.org/works',
        keyConfigured: Boolean(process.env.OPENALEX_API_KEY),
      },
    };
  } catch (err: any) {
    return {
      candidates: [],
      report: {
        providerId: 'openalex',
        providerName: 'OpenAlex',
        status: 'error',
        count: 0,
        latencyMs: Date.now() - start,
        endpointUsed: 'https://api.openalex.org/works',
        message: err.message || 'OpenAlex fetch failed',
      },
    };
  }
}

// B. Semantic Scholar Adapter (https://api.semanticscholar.org/graph/v1/paper/search)
async function querySemanticScholar(
  params: UnifiedSearchParams
): Promise<{ candidates: NormalizedCandidate[]; report: ProviderStatusReport }> {
  const start = Date.now();
  const limit = Math.min(10, params.perProviderLimit || 5);
  const offset = ((params.page || 1) - 1) * limit;
  const yearFilter =
    params.yearFrom && params.yearTo
      ? `&year=${params.yearFrom}-${params.yearTo}`
      : params.yearFrom
      ? `&year=${params.yearFrom}-`
      : params.yearTo
      ? `&year=-${params.yearTo}`
      : '';
  const oaParam = params.openAccessOnly ? '&openAccessPdf' : '';

  const endpoint = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(
    params.query
  )}&limit=${limit}&offset=${offset}${yearFilter}${oaParam}&fields=paperId,externalIds,url,title,abstract,venue,publicationVenue,year,publicationDate,citationCount,referenceCount,isOpenAccess,openAccessPdf,authors,publicationTypes`;

  const headers: Record<string, string> = {};
  if (process.env.SEMANTIC_SCHOLAR_API_KEY) {
    headers['x-api-key'] = process.env.SEMANTIC_SCHOLAR_API_KEY;
  }

  try {
    const res = await fetchProviderUrl(endpoint, { headers }, 6500, 0);
    if (res.status === 429) {
      return {
        candidates: [],
        report: {
          providerId: 'semanticscholar',
          providerName: 'Semantic Scholar',
          status: 'rate_limited',
          count: 0,
          latencyMs: Date.now() - start,
          endpointUsed: 'https://api.semanticscholar.org/graph/v1/paper/search',
          message:
            'Shared public IP rate limit reached (HTTP 429). Configure SEMANTIC_SCHOLAR_API_KEY in Settings > Secrets for dedicated throughput.',
          requiresKey: false,
          keyConfigured: Boolean(process.env.SEMANTIC_SCHOLAR_API_KEY),
        },
      };
    }

    if (!res.ok) {
      return {
        candidates: [],
        report: {
          providerId: 'semanticscholar',
          providerName: 'Semantic Scholar',
          status: 'error',
          count: 0,
          latencyMs: Date.now() - start,
          endpointUsed: 'https://api.semanticscholar.org/graph/v1/paper/search',
          message: `HTTP ${res.status}`,
          keyConfigured: Boolean(process.env.SEMANTIC_SCHOLAR_API_KEY),
        },
      };
    }

    const data = await res.json();
    const candidates: NormalizedCandidate[] = [];

    for (let i = 0; i < (data.data || []).length; i++) {
      const p = data.data[i];
      if (!p?.title) continue;
      const doi = normalizeDoi(p.externalIds?.DOI);
      const arxivId = normalizeArxivId(p.externalIds?.ArXiv);
      const pmid = p.externalIds?.PubMed ? String(p.externalIds.PubMed) : undefined;
      const abstractText = String(p.abstract || '').trim();
      const hasRealAbstract = abstractText.length > 25;
      const pubDate = p.publicationDate || `${p.year || 2025}-01-01`;
      const pubYear = Number(p.year || pubDate.slice(0, 4)) || 2025;
      const venue = p.publicationVenue?.name || p.venue || 'Semantic Scholar';
      const isPreprint =
        Boolean(arxivId && !doi) ||
        /arxiv|biorxiv|medrxiv|preprint/i.test(venue);

      const pdfUrl = p.openAccessPdf?.url || undefined;
      const isOa = Boolean(p.isOpenAccess || pdfUrl);
      const canonicalId = doi
        ? `doi:${doi}`
        : arxivId
        ? `arxiv:${arxivId}`
        : `s2:${p.paperId || i}`;
      const slug = (p.paperId || doi || `${i}`).replace(/[^a-zA-Z0-9_-]/g, '-');

      candidates.push({
        id: `s2-${slug}`,
        canonicalId,
        title: String(p.title).trim(),
        abstractText,
        hasRealAbstract,
        authors: (p.authors || []).slice(0, 6).map((a: any) => a.name).filter(Boolean),
        publishedAt: pubDate,
        publicationYear: pubYear,
        venue,
        sourceName: `Semantic Scholar · ${venue}`,
        sourceType: isPreprint ? 'Preprint (arXiv / bioRxiv)' : 'Peer-Reviewed Journal',
        evidenceStatus: isPreprint ? 'Preprint / Not Yet Peer-Reviewed' : 'Peer-Reviewed',
        sourceUrl: p.url || (doi ? `https://doi.org/${doi}` : 'https://www.semanticscholar.org'),
        pdfUrl,
        isOpenAccess: isOa,
        doi,
        pmid,
        arxivId,
        citationCount: Number(p.citationCount || 0),
        referenceCount: Number(p.referenceCount || 0),
        primaryProvider: 'semanticscholar',
        providerDisplayName: 'Semantic Scholar',
        domain: inferDomainFromText(`${params.query} ${p.title} ${venue}`, params.domain),
        associatedRepos: [],
      });
    }

    return {
      candidates,
      report: {
        providerId: 'semanticscholar',
        providerName: 'Semantic Scholar',
        status: 'ok',
        count: candidates.length,
        latencyMs: Date.now() - start,
        endpointUsed: 'https://api.semanticscholar.org/graph/v1/paper/search',
        keyConfigured: Boolean(process.env.SEMANTIC_SCHOLAR_API_KEY),
      },
    };
  } catch (err: any) {
    return {
      candidates: [],
      report: {
        providerId: 'semanticscholar',
        providerName: 'Semantic Scholar',
        status: 'error',
        count: 0,
        latencyMs: Date.now() - start,
        endpointUsed: 'https://api.semanticscholar.org/graph/v1/paper/search',
        message: err.message || 'Semantic Scholar request failed',
      },
    };
  }
}

// C. arXiv Adapter (https://export.arxiv.org/api/query)
async function queryArxiv(
  params: UnifiedSearchParams
): Promise<{ candidates: NormalizedCandidate[]; report: ProviderStatusReport }> {
  const start = Date.now();
  if (params.publicationType === 'peer_reviewed') {
    return {
      candidates: [],
      report: {
        providerId: 'arxiv',
        providerName: 'arXiv',
        status: 'skipped',
        count: 0,
        latencyMs: 0,
        endpointUsed: 'https://export.arxiv.org/api/query',
        message: 'Skipped because Peer-Reviewed Journals Only filter is active.',
      },
    };
  }

  const limit = Math.min(10, params.perProviderLimit || 5);
  const startOffset = ((params.page || 1) - 1) * limit;
  const sortBy = params.sortBy === 'newest' ? 'submittedDate' : 'relevance';

  const endpoint = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(
    params.query
  )}&start=${startOffset}&max_results=${limit}&sortBy=${sortBy}&sortOrder=descending`;

  try {
    const res = await fetchProviderUrl(endpoint);
    if (!res.ok) {
      return {
        candidates: [],
        report: {
          providerId: 'arxiv',
          providerName: 'arXiv',
          status: 'error',
          count: 0,
          latencyMs: Date.now() - start,
          endpointUsed: 'https://export.arxiv.org/api/query',
          message: `HTTP ${res.status}`,
        },
      };
    }

    const xml = await res.text();
    const entries = xml.split('<entry>').slice(1);
    const candidates: NormalizedCandidate[] = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const rawId = entry.match(/<id>([\s\S]*?)<\/id>/)?.[1]?.trim() || '';
      const title =
        entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/\s+/g, ' ').trim() || '';
      const summary =
        entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]?.replace(/\s+/g, ' ').trim() || '';
      const published =
        entry.match(/<published>([\s\S]*?)<\/published>/)?.[1]?.trim().slice(0, 10) || '';
      const arxivDoi = normalizeDoi(
        entry.match(/<arxiv:doi[^>]*>([\s\S]*?)<\/arxiv:doi>/)?.[1]?.trim()
      );
      const journalRef =
        entry.match(/<arxiv:journal_ref[^>]*>([\s\S]*?)<\/arxiv:journal_ref>/)?.[1]?.trim() || '';
      const primaryCat =
        entry.match(/<arxiv:primary_category[^>]*term="([^"]+)"/)?.[1] || 'arXiv';

      const pubYear = Number(published.slice(0, 4)) || 2025;
      if (params.yearFrom && pubYear < params.yearFrom) continue;
      if (params.yearTo && pubYear > params.yearTo) continue;

      const authors = Array.from(entry.matchAll(/<author>\s*<name>([\s\S]*?)<\/name>/g))
        .map((m) => m[1].trim())
        .filter(Boolean);

      const arxivId = normalizeArxivId(rawId);
      const pdfUrl = rawId.includes('/abs/') ? rawId.replace('/abs/', '/pdf/') : rawId;
      const hasIndependentJournalConfirmation = Boolean(arxivDoi && journalRef);

      if (!title || !rawId) continue;
      const slug = (arxivId || `${i}`).replace(/[^a-zA-Z0-9_-]/g, '-');

      candidates.push({
        id: `arxiv-${slug}`,
        canonicalId: arxivDoi ? `doi:${arxivDoi}` : `arxiv:${arxivId || rawId}`,
        title,
        abstractText: summary,
        hasRealAbstract: summary.length > 20,
        authors,
        publishedAt: published,
        publicationYear: pubYear,
        venue: journalRef ? `arXiv (${ primaryCat }) · Published in ${journalRef}` : `arXiv Preprint [${primaryCat}]`,
        sourceName: `arXiv.org (${primaryCat})`,
        sourceType: 'Preprint (arXiv / bioRxiv)',
        evidenceStatus: hasIndependentJournalConfirmation
          ? 'Peer-Reviewed'
          : 'Preprint / Not Yet Peer-Reviewed',
        sourceUrl: rawId,
        pdfUrl,
        isOpenAccess: true,
        doi: arxivDoi,
        arxivId,
        citationCount: 0,
        referenceCount: 0,
        primaryProvider: 'arxiv',
        providerDisplayName: 'arXiv',
        domain: inferDomainFromText(`${params.query} ${title} ${summary} ${primaryCat}`, params.domain),
        associatedRepos: [],
      });
    }

    return {
      candidates,
      report: {
        providerId: 'arxiv',
        providerName: 'arXiv',
        status: 'ok',
        count: candidates.length,
        latencyMs: Date.now() - start,
        endpointUsed: 'https://export.arxiv.org/api/query',
      },
    };
  } catch (err: any) {
    return {
      candidates: [],
      report: {
        providerId: 'arxiv',
        providerName: 'arXiv',
        status: 'error',
        count: 0,
        latencyMs: Date.now() - start,
        endpointUsed: 'https://export.arxiv.org/api/query',
        message: err.message || 'arXiv request failed',
      },
    };
  }
}

// D. Europe PMC Adapter (https://www.ebi.ac.uk/europepmc/webservices/rest/search)
async function queryEuropePmc(
  params: UnifiedSearchParams
): Promise<{ candidates: NormalizedCandidate[]; report: ProviderStatusReport }> {
  const start = Date.now();
  const pageSize = Math.min(10, params.perProviderLimit || 5);
  const page = params.page || 1;

  const queryParts: string[] = [`(${params.query})`];
  if (params.yearFrom || params.yearTo) {
    const yFrom = params.yearFrom || 1900;
    const yTo = params.yearTo || 2030;
    queryParts.push(`PUB_YEAR:[${yFrom} TO ${yTo}]`);
  }
  if (params.openAccessOnly) {
    queryParts.push('OPEN_ACCESS:Y');
  }
  if (params.publicationType === 'preprint') {
    queryParts.push('SRC:PPR');
  }

  const sortClause = params.sortBy === 'newest' ? '&sort=P_PDATE_D%20desc' : '';
  const endpoint = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(
    queryParts.join(' AND ')
  )}&resultType=core&format=json&pageSize=${pageSize}&page=${page}${sortClause}`;

  try {
    const res = await fetchProviderUrl(endpoint);
    if (!res.ok) {
      return {
        candidates: [],
        report: {
          providerId: 'europepmc',
          providerName: 'Europe PMC',
          status: 'error',
          count: 0,
          latencyMs: Date.now() - start,
          endpointUsed: 'https://www.ebi.ac.uk/europepmc/webservices/rest/search',
          message: `HTTP ${res.status}`,
        },
      };
    }

    const data = await res.json();
    const list = data.resultList?.result || [];
    const candidates: NormalizedCandidate[] = [];

    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      if (!item?.title) continue;
      const cleanTitle = String(item.title).replace(/<\/?[^>]+(>|$)/g, '').trim();
      const abstractText = String(item.abstractText || '')
        .replace(/<\/?[^>]+(>|$)/g, '')
        .trim();
      const doi = normalizeDoi(item.doi);
      const pmid = item.pmid ? String(item.pmid) : undefined;
      const pmcid = item.pmcid ? String(item.pmcid) : undefined;
      const isPreprint = item.source === 'PPR' || /preprint|biorxiv|medrxiv/i.test(item.pubType || '');
      const isOa = item.isOpenAccess === 'Y' || Boolean(pmcid);

      const fullTextUrls: any[] = item.fullTextUrlList?.fullTextUrl || [];
      const pdfEntry = fullTextUrls.find((u) => /pdf/i.test(u.documentStyle || ''));
      const htmlEntry = fullTextUrls[0];
      const pdfUrl =
        pdfEntry?.url ||
        (pmcid ? `https://europepmc.org/articles/${pmcid}?pdf=render` : undefined);
      const sourceUrl =
        htmlEntry?.url ||
        (pmid
          ? `https://europepmc.org/article/MED/${pmid}`
          : doi
          ? `https://doi.org/${doi}`
          : 'https://europepmc.org');

      const pubDate = item.firstPublicationDate || `${item.pubYear || 2025}-01-01`;
      const pubYear = Number(item.pubYear || pubDate.slice(0, 4)) || 2025;
      const venue = item.journalTitle || item.bookOrReportDetails?.publisher || 'Europe PMC';
      const authors = item.authorString
        ? String(item.authorString)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 6)
        : [];

      const canonicalId = doi
        ? `doi:${doi}`
        : pmid
        ? `pmid:${pmid}`
        : `epmc:${item.id || i}`;
      const slug = (pmid || pmcid || doi || `${item.id || i}`).replace(/[^a-zA-Z0-9_-]/g, '-');

      candidates.push({
        id: `epmc-${slug}`,
        canonicalId,
        title: cleanTitle,
        abstractText,
        hasRealAbstract: abstractText.length > 25,
        authors,
        publishedAt: pubDate,
        publicationYear: pubYear,
        venue,
        sourceName: `Europe PMC · ${venue}`,
        sourceType: isPreprint ? 'Preprint (arXiv / bioRxiv)' : 'Peer-Reviewed Journal',
        evidenceStatus: isPreprint ? 'Preprint / Not Yet Peer-Reviewed' : 'Peer-Reviewed',
        sourceUrl,
        pdfUrl,
        isOpenAccess: isOa,
        doi,
        pmid,
        pmcid,
        citationCount: Number(item.citedByCount || 0),
        referenceCount: 0,
        primaryProvider: 'europepmc',
        providerDisplayName: 'Europe PMC',
        domain: inferDomainFromText(`${params.query} ${cleanTitle} ${venue}`, params.domain),
        associatedRepos: [],
      });
    }

    return {
      candidates,
      report: {
        providerId: 'europepmc',
        providerName: 'Europe PMC',
        status: 'ok',
        count: candidates.length,
        latencyMs: Date.now() - start,
        endpointUsed: 'https://www.ebi.ac.uk/europepmc/webservices/rest/search',
      },
    };
  } catch (err: any) {
    return {
      candidates: [],
      report: {
        providerId: 'europepmc',
        providerName: 'Europe PMC',
        status: 'error',
        count: 0,
        latencyMs: Date.now() - start,
        endpointUsed: 'https://www.ebi.ac.uk/europepmc/webservices/rest/search',
        message: err.message || 'Europe PMC request failed',
      },
    };
  }
}

// E. PubMed / NCBI E-utilities Adapter (esearch + esummary + efetch XML for abstracts)
async function queryPubMed(
  params: UnifiedSearchParams
): Promise<{ candidates: NormalizedCandidate[]; report: ProviderStatusReport }> {
  const start = Date.now();
  const retmax = Math.min(8, params.perProviderLimit || 4);
  const retstart = ((params.page || 1) - 1) * retmax;
  const sort = params.sortBy === 'newest' ? 'pub_date' : 'relevance';
  const apiKeyParam = process.env.NCBI_API_KEY
    ? `&api_key=${encodeURIComponent(process.env.NCBI_API_KEY)}`
    : '';
  const dateFilter =
    params.yearFrom || params.yearTo
      ? `&datetype=pdat&mindate=${params.yearFrom || 1900}&maxdate=${params.yearTo || 2030}`
      : '';

  const esearchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(
    params.query
  )}&retmode=json&retstart=${retstart}&retmax=${retmax}&sort=${sort}${dateFilter}&tool=ORBITResearch&email=${encodeURIComponent(
    POLITE_EMAIL
  )}${apiKeyParam}`;

  try {
    const searchRes = await fetchProviderUrl(esearchUrl);
    if (!searchRes.ok) {
      return {
        candidates: [],
        report: {
          providerId: 'pubmed',
          providerName: 'PubMed / NCBI',
          status: searchRes.status === 429 ? 'rate_limited' : 'error',
          count: 0,
          latencyMs: Date.now() - start,
          endpointUsed: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi',
          message: `HTTP ${searchRes.status}`,
          keyConfigured: Boolean(process.env.NCBI_API_KEY),
        },
      };
    }

    const searchData = await searchRes.json();
    const idList: string[] = searchData.esearchresult?.idlist || [];
    if (idList.length === 0) {
      return {
        candidates: [],
        report: {
          providerId: 'pubmed',
          providerName: 'PubMed / NCBI',
          status: 'ok',
          count: 0,
          latencyMs: Date.now() - start,
          endpointUsed: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi',
          keyConfigured: Boolean(process.env.NCBI_API_KEY),
        },
      };
    }

    const idsJoined = idList.join(',');
    const esummaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${idsJoined}&retmode=json&tool=ORBITResearch&email=${encodeURIComponent(
      POLITE_EMAIL
    )}${apiKeyParam}`;
    const efetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${idsJoined}&retmode=xml&tool=ORBITResearch&email=${encodeURIComponent(
      POLITE_EMAIL
    )}${apiKeyParam}`;

    const [summaryRes, xmlRes] = await Promise.all([
      fetchProviderUrl(esummaryUrl),
      fetchProviderUrl(efetchUrl).catch(() => null),
    ]);

    const summaryData = summaryRes.ok ? await summaryRes.json() : {};
    const xmlText = xmlRes && xmlRes.ok ? await xmlRes.text() : '';

    // Parse abstracts by PMID from EFetch XML
    const abstractByPmid: Record<string, string> = {};
    if (xmlText) {
      const articles = xmlText.split('<PubmedArticle>').slice(1);
      for (const art of articles) {
        const pmidMatch = art.match(/<PMID[^>]*>(\d+)<\/PMID>/)?.[1];
        if (pmidMatch) {
          const absParts = Array.from(
            art.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g)
          ).map((m) => m[1].replace(/<\/?[^>]+(>|$)/g, '').trim());
          if (absParts.length > 0) {
            abstractByPmid[pmidMatch] = absParts.join(' ');
          }
        }
      }
    }

    const candidates: NormalizedCandidate[] = [];
    for (const pmid of idList) {
      const doc = summaryData.result?.[pmid];
      if (!doc || !doc.title) continue;
      const cleanTitle = String(doc.title).replace(/<\/?[^>]+(>|$)/g, '').trim();
      const articleIds: Array<{ idtype: string; value: string }> = doc.articleids || [];
      const doi = normalizeDoi(articleIds.find((a) => a.idtype === 'doi')?.value);
      const pmc = articleIds.find((a) => a.idtype === 'pmc')?.value;
      const rawPubDate = String(doc.sortpubdate || doc.pubdate || '2025-01-01').slice(0, 10).replace(/\//g, '-');
      const pubYear = Number(rawPubDate.slice(0, 4)) || 2025;
      const abstractText = abstractByPmid[pmid] || '';
      const venue = doc.fulljournalname || doc.source || 'PubMed Indexed Journal';
      const isOa = Boolean(pmc);
      if (params.openAccessOnly && !isOa) continue;

      candidates.push({
        id: `pubmed-${pmid}`,
        canonicalId: doi ? `doi:${doi}` : `pmid:${pmid}`,
        title: cleanTitle,
        abstractText,
        hasRealAbstract: abstractText.length > 25,
        authors: (doc.authors || []).slice(0, 6).map((a: any) => a.name).filter(Boolean),
        publishedAt: rawPubDate,
        publicationYear: pubYear,
        venue,
        sourceName: `PubMed · ${venue}`,
        sourceType: 'Peer-Reviewed Journal',
        evidenceStatus: 'Peer-Reviewed',
        sourceUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        pdfUrl: pmc ? `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmc}/pdf/` : undefined,
        isOpenAccess: isOa,
        doi,
        pmid,
        pmcid: pmc,
        citationCount: 0,
        referenceCount: 0,
        primaryProvider: 'pubmed',
        providerDisplayName: 'PubMed / NCBI',
        domain: inferDomainFromText(`${params.query} ${cleanTitle} ${venue}`, params.domain),
        associatedRepos: [],
      });
    }

    return {
      candidates,
      report: {
        providerId: 'pubmed',
        providerName: 'PubMed / NCBI',
        status: 'ok',
        count: candidates.length,
        latencyMs: Date.now() - start,
        endpointUsed: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi',
        keyConfigured: Boolean(process.env.NCBI_API_KEY),
      },
    };
  } catch (err: any) {
    return {
      candidates: [],
      report: {
        providerId: 'pubmed',
        providerName: 'PubMed / NCBI',
        status: 'error',
        count: 0,
        latencyMs: Date.now() - start,
        endpointUsed: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi',
        message: err.message || 'PubMed request failed',
      },
    };
  }
}

// F. DOAJ — Directory of Open Access Journals Adapter (https://doaj.org/api/search/articles/)
async function queryDoaj(
  params: UnifiedSearchParams
): Promise<{ candidates: NormalizedCandidate[]; report: ProviderStatusReport }> {
  const start = Date.now();
  if (params.publicationType === 'preprint') {
    return {
      candidates: [],
      report: {
        providerId: 'doaj',
        providerName: 'DOAJ',
        status: 'skipped',
        count: 0,
        latencyMs: 0,
        endpointUsed: 'https://doaj.org/api/search/articles/',
        message: 'Skipped because Preprints Only filter is active.',
      },
    };
  }

  const pageSize = Math.min(8, params.perProviderLimit || 4);
  const page = params.page || 1;
  const sortParam = params.sortBy === 'newest' ? '&sort=created_date:desc' : '';
  const endpoint = `https://doaj.org/api/search/articles/${encodeURIComponent(
    params.query
  )}?page=${page}&pageSize=${pageSize}${sortParam}`;

  try {
    const res = await fetchProviderUrl(endpoint);
    if (!res.ok) {
      return {
        candidates: [],
        report: {
          providerId: 'doaj',
          providerName: 'DOAJ',
          status: 'error',
          count: 0,
          latencyMs: Date.now() - start,
          endpointUsed: 'https://doaj.org/api/search/articles/',
          message: `HTTP ${res.status}`,
        },
      };
    }

    const data = await res.json();
    const candidates: NormalizedCandidate[] = [];

    for (let i = 0; i < (data.results || []).length; i++) {
      const r = data.results[i];
      const bib = r?.bibjson;
      if (!bib?.title) continue;

      const pubYear = Number(bib.year) || 2025;
      if (params.yearFrom && pubYear < params.yearFrom) continue;
      if (params.yearTo && pubYear > params.yearTo) continue;

      const month = String(bib.month || '01').padStart(2, '0');
      const pubDate = `${pubYear}-${/^\d{2}$/.test(month) ? month : '01'}-01`;
      const identifiers: Array<{ type: string; id: string }> = bib.identifier || [];
      const doi = normalizeDoi(identifiers.find((id) => id.type?.toLowerCase() === 'doi')?.id);
      const links: Array<{ type: string; url: string }> = bib.link || [];
      const fulltextLink = links.find((l) => l.type === 'fulltext')?.url || links[0]?.url;
      const sourceUrl = fulltextLink || (doi ? `https://doi.org/${doi}` : `https://doaj.org/article/${r.id}`);
      const abstractText = String(bib.abstract || '').trim();
      const venue = bib.journal?.title || 'DOAJ Open-Access Journal';
      const authors = (bib.author || []).slice(0, 6).map((a: any) => a.name).filter(Boolean);

      candidates.push({
        id: `doaj-${r.id || i}`,
        canonicalId: doi ? `doi:${doi}` : `doaj:${r.id || i}`,
        title: String(bib.title).trim(),
        abstractText,
        hasRealAbstract: abstractText.length > 25,
        authors,
        publishedAt: pubDate,
        publicationYear: pubYear,
        venue,
        sourceName: `DOAJ · ${venue}`,
        sourceType: 'Peer-Reviewed Journal',
        evidenceStatus: 'Peer-Reviewed',
        sourceUrl,
        pdfUrl: fulltextLink,
        isOpenAccess: true,
        doi,
        citationCount: 0,
        referenceCount: 0,
        primaryProvider: 'doaj',
        providerDisplayName: 'DOAJ',
        domain: inferDomainFromText(`${params.query} ${bib.title} ${venue}`, params.domain),
        associatedRepos: [],
      });
    }

    return {
      candidates,
      report: {
        providerId: 'doaj',
        providerName: 'DOAJ',
        status: 'ok',
        count: candidates.length,
        latencyMs: Date.now() - start,
        endpointUsed: 'https://doaj.org/api/search/articles/',
      },
    };
  } catch (err: any) {
    return {
      candidates: [],
      report: {
        providerId: 'doaj',
        providerName: 'DOAJ',
        status: 'error',
        count: 0,
        latencyMs: Date.now() - start,
        endpointUsed: 'https://doaj.org/api/search/articles/',
        message: err.message || 'DOAJ request failed',
      },
    };
  }
}

// G. CORE Adapter (https://api.core.ac.uk/v3/search/works)
async function queryCore(
  params: UnifiedSearchParams
): Promise<{ candidates: NormalizedCandidate[]; report: ProviderStatusReport }> {
  const start = Date.now();
  const limit = Math.min(6, params.perProviderLimit || 4);
  const offset = ((params.page || 1) - 1) * limit;
  const endpoint = `https://api.core.ac.uk/v3/search/works?q=${encodeURIComponent(
    params.query
  )}&limit=${limit}&offset=${offset}`;

  const headers: Record<string, string> = {};
  if (process.env.CORE_API_KEY) {
    headers.Authorization = `Bearer ${process.env.CORE_API_KEY}`;
  }

  try {
    const res = await fetchProviderUrl(endpoint, { headers }, 6000, 0);
    if (res.status === 429 || res.status === 401 || res.status === 403) {
      return {
        candidates: [],
        report: {
          providerId: 'core',
          providerName: 'CORE',
          status: process.env.CORE_API_KEY ? 'rate_limited' : 'requires_key',
          count: 0,
          latencyMs: Date.now() - start,
          endpointUsed: 'https://api.core.ac.uk/v3/search/works',
          message: process.env.CORE_API_KEY
            ? `CORE API rate limit reached (HTTP ${res.status}).`
            : 'CORE API v3 throttled unauthenticated query (HTTP 429). Configure CORE_API_KEY in Settings > Secrets for dedicated CORE repository access.',
          requiresKey: true,
          keyConfigured: Boolean(process.env.CORE_API_KEY),
        },
      };
    }

    if (!res.ok) {
      return {
        candidates: [],
        report: {
          providerId: 'core',
          providerName: 'CORE',
          status: 'error',
          count: 0,
          latencyMs: Date.now() - start,
          endpointUsed: 'https://api.core.ac.uk/v3/search/works',
          message: `HTTP ${res.status}`,
          requiresKey: true,
          keyConfigured: Boolean(process.env.CORE_API_KEY),
        },
      };
    }

    const data = await res.json();
    const candidates: NormalizedCandidate[] = [];

    for (let i = 0; i < (data.results || []).length; i++) {
      const w = data.results[i];
      if (!w?.title) continue;
      const pubYear = Number(w.yearPublished) || 2025;
      if (params.yearFrom && pubYear < params.yearFrom) continue;
      if (params.yearTo && pubYear > params.yearTo) continue;

      const doi = normalizeDoi(w.doi);
      const abstractText = String(w.abstract || '').trim();
      const downloadUrl = w.downloadUrl || w.sourceFulltextUrls?.[0] || undefined;
      const sourceUrl =
        downloadUrl ||
        w.links?.find((l: any) => l.type === 'display')?.url ||
        (doi ? `https://doi.org/${doi}` : `https://core.ac.uk/works/${w.id}`);

      candidates.push({
        id: `core-${w.id || i}`,
        canonicalId: doi ? `doi:${doi}` : `core:${w.id || i}`,
        title: String(w.title).trim(),
        abstractText,
        hasRealAbstract: abstractText.length > 25,
        authors: (w.authors || []).slice(0, 6).map((a: any) => a.name || a).filter(Boolean),
        publishedAt: String(w.publishedDate || `${pubYear}-01-01`).slice(0, 10),
        publicationYear: pubYear,
        venue: w.publisher || w.journals?.[0]?.title || 'CORE Open Repository',
        sourceName: `CORE · ${w.publisher || 'Open Repository'}`,
        sourceType: 'Peer-Reviewed Journal',
        evidenceStatus: 'Peer-Reviewed',
        sourceUrl,
        pdfUrl: downloadUrl,
        isOpenAccess: true,
        doi,
        citationCount: Number(w.citationCount || 0),
        referenceCount: 0,
        primaryProvider: 'core',
        providerDisplayName: 'CORE',
        domain: inferDomainFromText(`${params.query} ${w.title}`, params.domain),
        associatedRepos: [],
      });
    }

    return {
      candidates,
      report: {
        providerId: 'core',
        providerName: 'CORE',
        status: 'ok',
        count: candidates.length,
        latencyMs: Date.now() - start,
        endpointUsed: 'https://api.core.ac.uk/v3/search/works',
        keyConfigured: Boolean(process.env.CORE_API_KEY),
      },
    };
  } catch (err: any) {
    return {
      candidates: [],
      report: {
        providerId: 'core',
        providerName: 'CORE',
        status: 'error',
        count: 0,
        latencyMs: Date.now() - start,
        endpointUsed: 'https://api.core.ac.uk/v3/search/works',
        message: err.message || 'CORE request failed',
        keyConfigured: Boolean(process.env.CORE_API_KEY),
      },
    };
  }
}

// H. RePEc / IDEAS Economics Adapter (RePEc Source S4306401271 via OpenAlex + EconPapers / IDEAS links)
async function queryRepecIdeas(
  params: UnifiedSearchParams
): Promise<{ candidates: NormalizedCandidate[]; report: ProviderStatusReport }> {
  const start = Date.now();
  const limit = Math.min(8, params.perProviderLimit || 4);
  const page = params.page || 1;
  const filters: string[] = ['primary_location.source.id:S4306401271'];

  if (params.yearFrom) filters.push(`from_publication_date:${params.yearFrom}-01-01`);
  if (params.yearTo) filters.push(`to_publication_date:${params.yearTo}-12-31`);
  if (params.openAccessOnly) filters.push('open_access.is_oa:true');

  const sortParam =
    params.sortBy === 'newest'
      ? '&sort=publication_date:desc'
      : params.sortBy === 'citations'
      ? '&sort=cited_by_count:desc'
      : '';

  const endpoint = `https://api.openalex.org/works?search=${encodeURIComponent(
    params.query
  )}&filter=${filters.join(',')}${sortParam}&page=${page}&per-page=${limit}&mailto=${encodeURIComponent(
    POLITE_EMAIL
  )}`;

  try {
    const res = await fetchProviderUrl(endpoint);
    if (!res.ok) {
      return {
        candidates: [],
        report: {
          providerId: 'repec',
          providerName: 'RePEc / IDEAS',
          status: 'error',
          count: 0,
          latencyMs: Date.now() - start,
          endpointUsed: 'https://api.openalex.org/works?filter=primary_location.source.id:S4306401271',
          message: `HTTP ${res.status}`,
        },
      };
    }

    const data = await res.json();
    const candidates: NormalizedCandidate[] = [];

    for (let i = 0; i < (data.results || []).length; i++) {
      const w = data.results[i];
      if (!w?.title) continue;
      const doi = normalizeDoi(w.doi);
      const abstractText = reconstructOpenAlexAbstract(w.abstract_inverted_index).trim();
      const landingUrl =
        w.primary_location?.landing_page_url ||
        w.doi ||
        `https://ideas.repec.org/cgi-bin/htsearch?q=${encodeURIComponent(w.title)}`;
      const pdfUrl = w.primary_location?.pdf_url || w.open_access?.oa_url || undefined;
      const pubDate = w.publication_date || `${w.publication_year || 2025}-01-01`;
      const pubYear = Number(w.publication_year || pubDate.slice(0, 4)) || 2025;
      const oaId = String(w.id || '').replace(/^https?:\/\/openalex\.org\//i, '');

      candidates.push({
        id: `repec-${oaId || i}`,
        canonicalId: doi ? `doi:${doi}` : `repec:${oaId || i}`,
        title: String(w.title).trim(),
        abstractText,
        hasRealAbstract: abstractText.length > 25,
        authors: (w.authorships || [])
          .slice(0, 6)
          .map((a: any) => a.author?.display_name)
          .filter(Boolean),
        publishedAt: pubDate,
        publicationYear: pubYear,
        venue: 'RePEc / IDEAS Research Papers in Economics',
        sourceName: 'RePEc / IDEAS',
        sourceType: 'Preprint (arXiv / bioRxiv)',
        evidenceStatus: 'Preprint / Not Yet Peer-Reviewed',
        sourceUrl: landingUrl,
        pdfUrl,
        isOpenAccess: Boolean(w.open_access?.is_oa || pdfUrl),
        doi,
        citationCount: Number(w.cited_by_count || 0),
        referenceCount: Array.isArray(w.referenced_works) ? w.referenced_works.length : 0,
        primaryProvider: 'repec',
        providerDisplayName: 'RePEc / IDEAS',
        domain: inferDomainFromText(`${params.query} ${w.title} economics`, params.domain || 'Economics'),
        associatedRepos: [],
      });
    }

    return {
      candidates,
      report: {
        providerId: 'repec',
        providerName: 'RePEc / IDEAS',
        status: 'ok',
        count: candidates.length,
        latencyMs: Date.now() - start,
        endpointUsed: 'https://api.openalex.org/works (RePEc Source S4306401271)',
      },
    };
  } catch (err: any) {
    return {
      candidates: [],
      report: {
        providerId: 'repec',
        providerName: 'RePEc / IDEAS',
        status: 'error',
        count: 0,
        latencyMs: Date.now() - start,
        endpointUsed: 'https://api.openalex.org/works (RePEc Source S4306401271)',
        message: err.message || 'RePEc query failed',
      },
    };
  }
}

// I. SSRN Adapter (Official Crossref SSRN DOI Prefix 10.2139 Registry)
async function querySsrn(
  params: UnifiedSearchParams
): Promise<{ candidates: NormalizedCandidate[]; report: ProviderStatusReport }> {
  const start = Date.now();
  const rows = Math.min(8, params.perProviderLimit || 4);
  const offset = ((params.page || 1) - 1) * rows;

  const filters: string[] = ['prefix:10.2139'];
  if (params.yearFrom) filters.push(`from-pub-date:${params.yearFrom}-01-01`);
  if (params.yearTo) filters.push(`until-pub-date:${params.yearTo}-12-31`);

  const sortParam = params.sortBy === 'newest' ? '&sort=published&order=desc' : '';
  const endpoint = `https://api.crossref.org/works?filter=${filters.join(
    ','
  )}&query=${encodeURIComponent(params.query)}&rows=${rows}&offset=${offset}${sortParam}&mailto=${encodeURIComponent(
    POLITE_EMAIL
  )}`;

  try {
    const res = await fetchProviderUrl(endpoint);
    if (!res.ok) {
      return {
        candidates: [],
        report: {
          providerId: 'ssrn',
          providerName: 'SSRN',
          status: 'error',
          count: 0,
          latencyMs: Date.now() - start,
          endpointUsed: 'https://api.crossref.org/works?filter=prefix:10.2139',
          message: `HTTP ${res.status}`,
        },
      };
    }

    const data = await res.json();
    const items = data.message?.items || [];
    const candidates: NormalizedCandidate[] = [];

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const title = Array.isArray(it.title) ? it.title[0] : it.title;
      if (!title) continue;
      const doi = normalizeDoi(it.DOI);
      const ssrnIdMatch = doi?.match(/ssrn\.(\d+)/i);
      const ssrnUrl = ssrnIdMatch
        ? `https://papers.ssrn.com/sol3/papers.cfm?abstract_id=${ssrnIdMatch[1]}`
        : it.URL || (doi ? `https://doi.org/${doi}` : 'https://www.ssrn.com');

      const dateParts =
        it.published?.['date-parts']?.[0] ||
        it['published-online']?.['date-parts']?.[0] ||
        it.created?.['date-parts']?.[0] || [2025, 1, 1];
      const pubYear = Number(dateParts[0]) || 2025;
      const pubMonth = String(dateParts[1] || 1).padStart(2, '0');
      const pubDay = String(dateParts[2] || 1).padStart(2, '0');
      const pubDate = `${pubYear}-${pubMonth}-${pubDay}`;

      const abstractText = String(it.abstract || '')
        .replace(/<\/?[^>]+(>|$)/g, '')
        .trim();
      const authors = (it.author || [])
        .slice(0, 6)
        .map((a: any) => [a.given, a.family].filter(Boolean).join(' '))
        .filter(Boolean);

      const slug = (ssrnIdMatch?.[1] || doi || `${i}`).replace(/[^a-zA-Z0-9_-]/g, '-');

      candidates.push({
        id: `ssrn-${slug}`,
        canonicalId: doi ? `doi:${doi}` : `ssrn:${slug}`,
        title: String(title).trim(),
        abstractText,
        hasRealAbstract: abstractText.length > 25,
        authors,
        publishedAt: pubDate,
        publicationYear: pubYear,
        venue: 'SSRN Electronic Journal (Social Science Research Network)',
        sourceName: 'SSRN (via Crossref 10.2139)',
        sourceType: 'Preprint (arXiv / bioRxiv)',
        evidenceStatus: 'Preprint / Not Yet Peer-Reviewed',
        sourceUrl: ssrnUrl,
        pdfUrl: undefined,
        isOpenAccess: false,
        doi,
        citationCount: Number(it['is-referenced-by-count'] || 0),
        referenceCount: Number(it['references-count'] || 0),
        primaryProvider: 'ssrn',
        providerDisplayName: 'SSRN',
        domain: inferDomainFromText(
          `${params.query} ${title} social science policy economics`,
          params.domain
        ),
        associatedRepos: [],
      });
    }

    return {
      candidates,
      report: {
        providerId: 'ssrn',
        providerName: 'SSRN',
        status: 'ok',
        count: candidates.length,
        latencyMs: Date.now() - start,
        endpointUsed: 'https://api.crossref.org/works?filter=prefix:10.2139',
      },
    };
  } catch (err: any) {
    return {
      candidates: [],
      report: {
        providerId: 'ssrn',
        providerName: 'SSRN',
        status: 'error',
        count: 0,
        latencyMs: Date.now() - start,
        endpointUsed: 'https://api.crossref.org/works?filter=prefix:10.2139',
        message: err.message || 'SSRN query failed',
      },
    };
  }
}

// J. Papers with Code / Hugging Face Papers Adapter (https://huggingface.co/api/papers/search)
async function queryPapersWithCode(
  params: UnifiedSearchParams
): Promise<{ candidates: NormalizedCandidate[]; report: ProviderStatusReport }> {
  const start = Date.now();
  const limit = Math.min(8, params.perProviderLimit || 4);
  const endpoint = `https://huggingface.co/api/papers/search?q=${encodeURIComponent(params.query)}`;

  try {
    const res = await fetchProviderUrl(endpoint);
    if (!res.ok) {
      return {
        candidates: [],
        report: {
          providerId: 'paperswithcode',
          providerName: 'Papers with Code',
          status: 'error',
          count: 0,
          latencyMs: Date.now() - start,
          endpointUsed: 'https://huggingface.co/api/papers/search',
          message: `HTTP ${res.status}`,
        },
      };
    }

    const data = await res.json();
    const list = Array.isArray(data) ? data : [];
    const offset = ((params.page || 1) - 1) * limit;
    const sliced = list.slice(offset, offset + limit);
    const candidates: NormalizedCandidate[] = [];

    for (let i = 0; i < sliced.length; i++) {
      const entry = sliced[i];
      const p = entry?.paper || entry;
      const title = String(p?.title || entry?.title || '').trim();
      const arxivId = normalizeArxivId(p?.id);
      if (!title || !arxivId) continue;

      const publishedAt = String(p?.publishedAt || entry?.publishedAt || '2025-01-01').slice(0, 10);
      const pubYear = Number(publishedAt.slice(0, 4)) || 2025;
      if (params.yearFrom && pubYear < params.yearFrom) continue;
      if (params.yearTo && pubYear > params.yearTo) continue;

      const summary = String(p?.summary || entry?.summary || p?.ai_summary || '').trim();
      const authors = (p?.authors || [])
        .slice(0, 6)
        .map((a: any) => a.name || a.user?.fullname)
        .filter(Boolean);

      const associatedRepos: AssociatedCodeRepo[] = [];
      if (p?.githubRepo) {
        const ghUrl = String(p.githubRepo).trim();
        const fullName = ghUrl.replace(/^https?:\/\/github\.com\//i, '').replace(/\/+$/, '');
        if (fullName.includes('/')) {
          associatedRepos.push({
            fullName,
            url: ghUrl,
            stars: typeof p.githubStars === 'number' ? p.githubStars : undefined,
            description: `Official code repository linked in Papers with Code / HF Papers for "${title}"`,
            provenance: 'Papers with Code / HF Verified',
          });
        }
      }

      const slug = arxivId.replace(/[^a-zA-Z0-9_-]/g, '-');
      candidates.push({
        id: `pwc-${slug}`,
        canonicalId: `arxiv:${arxivId}`,
        title,
        abstractText: summary,
        hasRealAbstract: summary.length > 25,
        authors,
        publishedAt,
        publicationYear: pubYear,
        venue: associatedRepos.length > 0
          ? `Papers with Code · Verified Repo (${associatedRepos[0].fullName})`
          : 'Papers with Code / arXiv',
        sourceName: 'Papers with Code',
        sourceType: 'Preprint (arXiv / bioRxiv)',
        evidenceStatus: associatedRepos.length > 0 ? 'Working Open-Source Code' : 'Preprint / Not Yet Peer-Reviewed',
        sourceUrl: `https://arxiv.org/abs/${arxivId}`,
        pdfUrl: `https://arxiv.org/pdf/${arxivId}`,
        isOpenAccess: true,
        arxivId,
        citationCount: Number(p?.upvotes || 0),
        referenceCount: 0,
        primaryProvider: 'paperswithcode',
        providerDisplayName: 'Papers with Code',
        domain: inferDomainFromText(`${params.query} ${title} ${summary}`, params.domain),
        associatedRepos,
      });
    }

    return {
      candidates,
      report: {
        providerId: 'paperswithcode',
        providerName: 'Papers with Code',
        status: 'ok',
        count: candidates.length,
        latencyMs: Date.now() - start,
        endpointUsed: 'https://huggingface.co/api/papers/search (Papers with Code Index)',
      },
    };
  } catch (err: any) {
    return {
      candidates: [],
      report: {
        providerId: 'paperswithcode',
        providerName: 'Papers with Code',
        status: 'error',
        count: 0,
        latencyMs: Date.now() - start,
        endpointUsed: 'https://huggingface.co/api/papers/search',
        message: err.message || 'Papers with Code query failed',
      },
    };
  }
}

// ============================================================================
// DEDUPLICATION & MULTI-SOURCE PROVENANCE AGGREGATION
// ============================================================================

function normalizeTitleForMatching(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export function deduplicateAndMergeCandidates(
  candidates: NormalizedCandidate[],
  query: string,
  retrievedAt: string
): { items: DiscoveryItem[]; duplicatesMerged: number } {
  const groups: Array<{
    primary: NormalizedCandidate;
    sources: Set<string>;
    links: ProviderRecordLink[];
  }> = [];

  const doiIndex = new Map<string, number>();
  const pmidIndex = new Map<string, number>();
  const arxivIndex = new Map<string, number>();
  const titleAuthorYearIndex = new Map<string, number>();

  let duplicatesMerged = 0;

  for (const c of candidates) {
    const normTitle = normalizeTitleForMatching(c.title);
    if (normTitle.length < 8) continue;

    const firstAuthorLast = (c.authors[0] || '')
      .toLowerCase()
      .split(/\s+/)
      .pop()
      ?.replace(/[^a-z]/g, '') || 'anon';
    const titleKey = `${normTitle.slice(0, 85)}::${firstAuthorLast}::${c.publicationYear}`;

    let matchIdx: number | undefined;
    if (c.doi && doiIndex.has(c.doi)) {
      matchIdx = doiIndex.get(c.doi);
    } else if (c.pmid && pmidIndex.has(c.pmid)) {
      matchIdx = pmidIndex.get(c.pmid);
    } else if (c.arxivId && arxivIndex.has(c.arxivId)) {
      matchIdx = arxivIndex.get(c.arxivId);
    } else if (normTitle.length >= 24 && titleAuthorYearIndex.has(titleKey)) {
      matchIdx = titleAuthorYearIndex.get(titleKey);
    }

    const recordLink: ProviderRecordLink = {
      providerId: c.primaryProvider,
      providerName: c.providerDisplayName,
      url: c.sourceUrl,
      externalId: c.doi || c.arxivId || c.pmid || c.canonicalId,
    };

    if (matchIdx !== undefined) {
      duplicatesMerged++;
      const existingGroup = groups[matchIdx];
      existingGroup.sources.add(c.providerDisplayName);
      if (!existingGroup.links.some((l) => l.providerId === c.primaryProvider && l.url === c.sourceUrl)) {
        existingGroup.links.push(recordLink);
      }

      const p = existingGroup.primary;
      // Enrich missing identifiers and metadata without losing provenance
      if (!p.doi && c.doi) p.doi = c.doi;
      if (!p.pmid && c.pmid) p.pmid = c.pmid;
      if (!p.pmcid && c.pmcid) p.pmcid = c.pmcid;
      if (!p.arxivId && c.arxivId) p.arxivId = c.arxivId;
      if (!p.pdfUrl && c.pdfUrl) p.pdfUrl = c.pdfUrl;
      if (c.isOpenAccess) p.isOpenAccess = true;
      if (c.citationCount > p.citationCount) p.citationCount = c.citationCount;
      if (c.referenceCount > p.referenceCount) p.referenceCount = c.referenceCount;
      if ((!p.hasRealAbstract || c.abstractText.length > p.abstractText.length) && c.hasRealAbstract) {
        p.abstractText = c.abstractText;
        p.hasRealAbstract = true;
      }
      if (p.evidenceStatus !== 'Peer-Reviewed' && c.evidenceStatus === 'Peer-Reviewed') {
        p.evidenceStatus = 'Peer-Reviewed';
        p.sourceType = 'Peer-Reviewed Journal';
      }
      for (const repo of c.associatedRepos) {
        if (!p.associatedRepos.some((r) => r.fullName.toLowerCase() === repo.fullName.toLowerCase())) {
          p.associatedRepos.push(repo);
        }
      }
    } else {
      const newIdx = groups.length;
      groups.push({
        primary: { ...c, associatedRepos: [...c.associatedRepos] },
        sources: new Set([c.providerDisplayName]),
        links: [recordLink],
      });
      if (c.doi) doiIndex.set(c.doi, newIdx);
      if (c.pmid) pmidIndex.set(c.pmid, newIdx);
      if (c.arxivId) arxivIndex.set(c.arxivId, newIdx);
      if (normTitle.length >= 24) titleAuthorYearIndex.set(titleKey, newIdx);
    }
  }

  const items = groups.map((g) =>
    buildDiscoveryItemFromCandidate(
      g.primary,
      Array.from(g.sources),
      g.links,
      query,
      retrievedAt
    )
  );

  return { items, duplicatesMerged };
}

// ============================================================================
// UNIFIED MULTI-PROVIDER SEARCH DISPATCHER
// ============================================================================

export const ALL_PROVIDER_IDS: ResearchProviderId[] = [
  'openalex',
  'semanticscholar',
  'arxiv',
  'europepmc',
  'pubmed',
  'doaj',
  'core',
  'repec',
  'ssrn',
  'paperswithcode',
];

export function selectDefaultProvidersForCategory(
  category?: string,
  domain?: string
): ResearchProviderId[] {
  const combined = `${category || ''} ${domain || ''}`.toLowerCase();
  if (/(econom|repec|fiscal|monetary|finance)/.test(combined)) {
    return ['openalex', 'repec', 'ssrn', 'semanticscholar', 'doaj', 'arxiv'];
  }
  if (/(political|policy|social|governance|law)/.test(combined)) {
    return ['openalex', 'ssrn', 'doaj', 'semanticscholar', 'repec'];
  }
  if (/(biomed|medicin|genom|clinical|crispr|protein)/.test(combined)) {
    return ['europepmc', 'pubmed', 'openalex', 'semanticscholar', 'doaj', 'arxiv'];
  }
  if (/(civil|mechanical|structural|climate|environment|materials)/.test(combined)) {
    return ['openalex', 'doaj', 'semanticscholar', 'arxiv', 'europepmc'];
  }
  if (/(ai|machine learning|computer|software|emerging|open-source)/.test(combined)) {
    return ['openalex', 'arxiv', 'paperswithcode', 'semanticscholar', 'doaj'];
  }
  if (/(physics|math|quantum|space|astronomy)/.test(combined)) {
    return ['openalex', 'arxiv', 'semanticscholar', 'doaj', 'paperswithcode'];
  }
  // Comprehensive multidisciplinary default across all 10 providers
  return [
    'openalex',
    'arxiv',
    'europepmc',
    'pubmed',
    'doaj',
    'repec',
    'ssrn',
    'paperswithcode',
    'semanticscholar',
    'core',
  ];
}

export async function executeUnifiedMultiSourceSearch(
  params: UnifiedSearchParams
): Promise<UnifiedSearchResponse> {
  const retrievedAt = new Date().toISOString();
  const activeProviders =
    params.providers && params.providers.length > 0
      ? params.providers
      : selectDefaultProvidersForCategory(params.category, params.domain);

  const adapterMap: Record<
    ResearchProviderId,
    (p: UnifiedSearchParams) => Promise<{ candidates: NormalizedCandidate[]; report: ProviderStatusReport }>
  > = {
    openalex: queryOpenAlex,
    semanticscholar: querySemanticScholar,
    arxiv: queryArxiv,
    europepmc: queryEuropePmc,
    pubmed: queryPubMed,
    doaj: queryDoaj,
    core: queryCore,
    repec: queryRepecIdeas,
    ssrn: querySsrn,
    paperswithcode: queryPapersWithCode,
  };

  const settled = await Promise.all(
    activeProviders.map(async (pid) => {
      const fn = adapterMap[pid];
      if (!fn) return null;
      return fn(params);
    })
  );

  const allCandidates: NormalizedCandidate[] = [];
  const providerReports: ProviderStatusReport[] = [];
  const sourcesChecked: string[] = [];

  for (const res of settled) {
    if (!res) continue;
    providerReports.push(res.report);
    if (res.report.status === 'ok' && res.candidates.length > 0) {
      sourcesChecked.push(res.report.providerName);
      allCandidates.push(...res.candidates);
    }
  }

  const { items, duplicatesMerged } = deduplicateAndMergeCandidates(
    allCandidates,
    params.query,
    retrievedAt
  );

  // Apply final sort across aggregated multi-source items
  let sortedItems = items;
  if (params.sortBy === 'newest') {
    sortedItems = [...items].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  } else if (params.sortBy === 'citations') {
    sortedItems = [...items].sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0));
  }

  return {
    query: params.query,
    items: sortedItems,
    totalBeforeDedupe: allCandidates.length,
    totalAfterDedupe: sortedItems.length,
    duplicatesMerged,
    sourcesChecked,
    providerReports,
    retrievedAt,
  };
}

// ============================================================================
// CITATION NETWORK & RELATED RESEARCH / PAPER-TO-CODE DISCOVERY
// ============================================================================

export async function fetchCitationNetworkAndRelated(opts: {
  paperId: string;
  canonicalId: string;
  title: string;
  doi?: string;
  arxivId?: string;
  pmid?: string;
  authors?: string[];
  domain?: string;
}): Promise<CitationNetworkPayload> {
  const retrievedAt = new Date().toISOString();
  const nodes: CitationNetworkNode[] = [];
  const edges: CitationNetworkEdge[] = [];
  const associatedRepos: AssociatedCodeRepo[] = [];
  const sourcesChecked: string[] = [];

  const cleanDoi = normalizeDoi(opts.doi || opts.canonicalId);
  const cleanArxiv = normalizeArxivId(opts.arxivId || opts.canonicalId);

  // Center node: Current Paper
  const centerNodeId = opts.paperId || 'current-paper';
  nodes.push({
    id: centerNodeId,
    canonicalId: opts.canonicalId,
    title: opts.title,
    authors: opts.authors || [],
    year: 'Current',
    publishedAt: new Date().toISOString().slice(0, 10),
    venue: 'Active Paper in Reader',
    sourceName: 'ORBIT Reader',
    sourceUrl: cleanDoi ? `https://doi.org/${cleanDoi}` : 'https://openalex.org',
    citationCount: 0,
    isOpenAccess: true,
    evidenceStatus: 'Peer-Reviewed',
    relationType: 'current',
    isVerifiedCitation: true,
    providerName: 'Current Paper',
  });

  // 1. Resolve OpenAlex Work for Verified References (Cited By Current) & Incoming Citations (Cites Current)
  try {
    let oaWork: any = null;
    if (cleanDoi) {
      const r = await fetchProviderUrl(
        `https://api.openalex.org/works/https://doi.org/${encodeURIComponent(cleanDoi)}?mailto=${encodeURIComponent(POLITE_EMAIL)}`
      );
      if (r.ok) oaWork = await r.json();
    }
    if (!oaWork && opts.title) {
      const r = await fetchProviderUrl(
        `https://api.openalex.org/works?search=${encodeURIComponent(opts.title)}&per-page=1&mailto=${encodeURIComponent(POLITE_EMAIL)}`
      );
      if (r.ok) {
        const d = await r.json();
        oaWork = d.results?.[0];
      }
    }

    if (oaWork && oaWork.id) {
      sourcesChecked.push('OpenAlex Citation Graph');
      const oaShortId = String(oaWork.id).replace(/^https?:\/\/openalex\.org\//i, '');
      nodes[0].citationCount = Number(oaWork.cited_by_count || 0);
      nodes[0].year = String(oaWork.publication_year || '');

      // A. Fetch Citing Works (Papers that cite this work)
      const citingUrl = `https://api.openalex.org/works?filter=cites:${oaShortId}&sort=cited_by_count:desc&per-page=6&mailto=${encodeURIComponent(
        POLITE_EMAIL
      )}`;
      // B. Fetch Referenced Works (Papers cited by this work)
      const refIds: string[] = (oaWork.referenced_works || [])
        .slice(0, 6)
        .map((u: string) => u.replace(/^https?:\/\/openalex\.org\//i, ''))
        .filter(Boolean);
      const refsUrl =
        refIds.length > 0
          ? `https://api.openalex.org/works?filter=openalex_id:${refIds.join('|')}&per-page=6&mailto=${encodeURIComponent(
              POLITE_EMAIL
            )}`
          : null;

      // C. Fetch Same-Author or Topic-Related Works
      const firstAuthorId = oaWork.authorships?.[0]?.author?.id?.replace(
        /^https?:\/\/openalex\.org\//i,
        ''
      );
      const sameAuthorUrl = firstAuthorId
        ? `https://api.openalex.org/works?filter=author.id:${firstAuthorId}&sort=publication_date:desc&per-page=4&mailto=${encodeURIComponent(
            POLITE_EMAIL
          )}`
        : null;

      const [citingRes, refsRes, authorRes] = await Promise.all([
        fetchProviderUrl(citingUrl).catch(() => null),
        refsUrl ? fetchProviderUrl(refsUrl).catch(() => null) : Promise.resolve(null),
        sameAuthorUrl ? fetchProviderUrl(sameAuthorUrl).catch(() => null) : Promise.resolve(null),
      ]);

      const addOaWorkNode = (
        w: any,
        relationType: CitationNetworkNode['relationType'],
        isVerifiedCitation: boolean
      ) => {
        if (!w?.title || w.title.toLowerCase() === opts.title.toLowerCase()) return;
        const wShortId = String(w.id || '').replace(/^https?:\/\/openalex\.org\//i, '');
        const nodeId = `cit-oa-${wShortId}`;
        if (nodes.some((n) => n.id === nodeId)) return;

        const wDoi = normalizeDoi(w.doi);
        const abs = reconstructOpenAlexAbstract(w.abstract_inverted_index);
        const venue = w.primary_location?.source?.display_name || 'OpenAlex Scholarly Record';
        const isOa = Boolean(w.open_access?.is_oa);

        nodes.push({
          id: nodeId,
          canonicalId: wDoi ? `doi:${wDoi}` : `openalex:${wShortId}`,
          title: w.title,
          authors: (w.authorships || [])
            .slice(0, 5)
            .map((a: any) => a.author?.display_name)
            .filter(Boolean),
          year: String(w.publication_year || '2025'),
          publishedAt: w.publication_date || `${w.publication_year || 2025}-01-01`,
          venue,
          sourceName: `OpenAlex · ${venue}`,
          sourceUrl: w.doi || w.primary_location?.landing_page_url || w.id || 'https://openalex.org',
          pdfUrl: w.open_access?.oa_url || undefined,
          abstractText: abs,
          citationCount: Number(w.cited_by_count || 0),
          isOpenAccess: isOa,
          evidenceStatus: w.type === 'preprint' ? 'Preprint / Not Yet Peer-Reviewed' : 'Peer-Reviewed',
          relationType,
          isVerifiedCitation,
          providerName: 'OpenAlex',
        });

        edges.push({
          id: `edge-${nodeId}`,
          source: relationType === 'referenced_by_current' ? nodeId : centerNodeId,
          target: relationType === 'referenced_by_current' ? centerNodeId : nodeId,
          relationshipLabel:
            relationType === 'referenced_by_current'
              ? 'Cited By'
              : relationType === 'cites_current'
              ? 'Cites'
              : relationType === 'same_author'
              ? 'Same Author'
              : 'Related Topic',
          isVerifiedCitation,
        });
      };

      if (citingRes && citingRes.ok) {
        const citingData = await citingRes.json();
        for (const w of citingData.results || []) {
          addOaWorkNode(w, 'cites_current', true);
        }
      }
      if (refsRes && refsRes.ok) {
        const refsData = await refsRes.json();
        for (const w of refsData.results || []) {
          addOaWorkNode(w, 'referenced_by_current', true);
        }
      }
      if (authorRes && authorRes.ok) {
        const authorData = await authorRes.json();
        for (const w of authorData.results || []) {
          addOaWorkNode(w, 'same_author', false);
        }
      }
    }
  } catch {
    // continue to other sources
  }

  // 2. Query Papers with Code / Hugging Face Papers for grounded paper-to-code relationships
  try {
    const pwcQuery = cleanArxiv || opts.title.slice(0, 75);
    const pwcRes = await fetchProviderUrl(
      `https://huggingface.co/api/papers/search?q=${encodeURIComponent(pwcQuery)}`
    );
    if (pwcRes.ok) {
      sourcesChecked.push('Papers with Code / HF Papers');
      const pwcData = await pwcRes.json();
      if (Array.isArray(pwcData)) {
        for (const entry of pwcData.slice(0, 5)) {
          const p = entry?.paper || entry;
          if (p?.githubRepo) {
            const ghUrl = String(p.githubRepo).trim();
            const fullName = ghUrl.replace(/^https?:\/\/github\.com\//i, '').replace(/\/+$/, '');
            if (
              fullName.includes('/') &&
              !associatedRepos.some((r) => r.fullName.toLowerCase() === fullName.toLowerCase())
            ) {
              const isExactMatch =
                (cleanArxiv && p.id === cleanArxiv) ||
                String(p.title || '').toLowerCase() === opts.title.toLowerCase();
              associatedRepos.push({
                fullName,
                url: ghUrl,
                stars: typeof p.githubStars === 'number' ? p.githubStars : undefined,
                description: `${isExactMatch ? 'Official companion code repository' : `Related implementation (${p.title})`}`,
                provenance: isExactMatch ? 'Papers with Code / HF Verified' : 'Topic Recommendation',
              });
            }
          }
        }
      }
    }
  } catch {
    // ignore
  }

  // 3. If very few nodes were found (e.g. brand-new preprint), fetch topic-related papers from Europe PMC / arXiv
  if (nodes.length < 4) {
    try {
      const topicRes = await queryOpenAlex({
        query: opts.title.split(/\s+/).slice(0, 6).join(' '),
        perProviderLimit: 5,
      });
      for (const c of topicRes.candidates) {
        if (c.title.toLowerCase() === opts.title.toLowerCase()) continue;
        const nodeId = `rel-${c.id}`;
        if (nodes.some((n) => n.id === nodeId)) continue;
        nodes.push({
          id: nodeId,
          canonicalId: c.canonicalId,
          title: c.title,
          authors: c.authors,
          year: String(c.publicationYear),
          publishedAt: c.publishedAt,
          venue: c.venue,
          sourceName: c.sourceName,
          sourceUrl: c.sourceUrl,
          pdfUrl: c.pdfUrl,
          abstractText: c.abstractText,
          citationCount: c.citationCount,
          isOpenAccess: c.isOpenAccess,
          evidenceStatus: c.evidenceStatus,
          relationType: 'related_topic',
          isVerifiedCitation: false,
          providerName: c.providerDisplayName,
        });
        edges.push({
          id: `edge-${nodeId}`,
          source: centerNodeId,
          target: nodeId,
          relationshipLabel: 'Related Topic',
          isVerifiedCitation: false,
        });
      }
    } catch {
      // ignore
    }
  }

  return {
    paperId: opts.paperId,
    canonicalId: opts.canonicalId,
    title: opts.title,
    nodes,
    edges,
    associatedRepos,
    sourcesChecked,
    retrievedAt,
  };
}
