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
  PaperFigureItem,
  PaperStructuredSection,
  PaperTableItem,
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

// Extract ONLY genuine LaTeX formulas present in the paper's actual text/abstract (never fabricate unrelated equations)
export function extractEquationsFromText(
  title: string,
  abstractText: string,
  _domain?: DomainCategory
): EquationSpec[] {
  const equations: EquationSpec[] = [];
  if (!abstractText) return equations;

  const latexPatterns = [
    /\$\$([^$]{4,220})\$\$/g,
    /\\\[([\s\S]{4,220}?)\\\]/g,
    /\\begin\{equation\*?\}([\s\S]{4,240}?)\\end\{equation\*?\}/g,
    /\$([^$\n]{4,110})\$/g,
  ];

  const seenFormulas = new Set<string>();
  for (const regex of latexPatterns) {
    const matches = Array.from(abstractText.matchAll(regex));
    for (const m of matches) {
      const rawLatex = (m[1] || '').trim();
      if (
        rawLatex &&
        /[=<>\\^_{}+-]/.test(rawLatex) &&
        !seenFormulas.has(rawLatex) &&
        equations.length < 4
      ) {
        seenFormulas.add(rawLatex);
        equations.push({
          id: `eq-extracted-${equations.length + 1}`,
          title: `Manuscript Mathematical Expression (${equations.length + 1})`,
          formula: rawLatex,
          variables: [
            {
              symbol: 'Notation',
              meaning: 'Extracted directly from author manuscript / abstract LaTeX notation',
              unit: 'manuscript notation',
            },
          ],
          intuition: `Formal mathematical expression stated directly by the authors in "${title.slice(0, 80)}".`,
        });
      }
    }
  }

  return equations;
}

// Extract genuine technical concepts/terms from a paper's title and abstract for prerequisites & keywords
export function extractPaperSpecificConcepts(
  title: string,
  abstractText: string,
  domain: DomainCategory
): string[] {
  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'from', 'that', 'this', 'are', 'was', 'were', 'have', 'has',
    'had', 'not', 'but', 'can', 'will', 'into', 'between', 'through', 'using', 'based', 'approach',
    'method', 'methods', 'study', 'paper', 'results', 'show', 'demonstrate', 'propose', 'present',
    'analysis', 'model', 'models', 'system', 'systems', 'novel', 'new', 'high', 'low', 'toward',
    'towards', 'across', 'under', 'over', 'within', 'via', 'their', 'our', 'which', 'where', 'when',
  ]);

  const combined = `${title}. ${abstractText}`;
  const phrases: string[] = [];

  // Look for capitalized technical phrases or hyphenated scientific terms
  const technicalMatches = combined.match(
    /\b([A-Z][a-zA-Z0-9-]+(?:\s+[A-Z][a-zA-Z0-9-]+){0,2}|[a-zA-Z0-9]+-[a-zA-Z0-9-]+)\b/g
  ) || [];

  for (const raw of technicalMatches) {
    const clean = raw.trim().replace(/[.,;:()[\]]+$/, '');
    if (
      clean.length >= 4 &&
      clean.length <= 42 &&
      !stopWords.has(clean.toLowerCase()) &&
      !/^(However|Furthermore|Moreover|Therefore|Additionally|Specifically|Finally|In|On|At|By|To|We|The|This|These|Our)$/.test(clean)
    ) {
      if (!phrases.some((p) => p.toLowerCase() === clean.toLowerCase())) {
        phrases.push(clean);
      }
    }
    if (phrases.length >= 5) break;
  }

  if (phrases.length < 3) {
    const titleWords = title
      .split(/[:—–,-]/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 5 && s.length <= 48);
    for (const tw of titleWords) {
      if (!phrases.some((p) => p.toLowerCase() === tw.toLowerCase())) {
        phrases.push(tw);
      }
      if (phrases.length >= 4) break;
    }
  }

  if (phrases.length === 0) {
    phrases.push(`${domain} Research Methodology`, 'Empirical & Bibliographic Verification');
  }

  return phrases.slice(0, 5);
}

// Split an abstract into non-repetitive background, methodology, and findings segments
export function decomposeAbstractSegments(abstractText: string): {
  backgroundSegment: string;
  methodologySteps: string[];
  findingsSegment: string;
} {
  const clean = abstractText.replace(/\s+/g, ' ').trim();
  const sentences =
    clean
      .match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g)
      ?.map((s) => s.trim())
      .filter((s) => s.length > 12) || [];

  if (sentences.length === 0) {
    return {
      backgroundSegment: '',
      methodologySteps: [],
      findingsSegment: '',
    };
  }

  if (sentences.length === 1) {
    return {
      backgroundSegment: sentences[0],
      methodologySteps: [sentences[0]],
      findingsSegment: sentences[0],
    };
  }

  if (sentences.length === 2) {
    return {
      backgroundSegment: sentences[0],
      methodologySteps: [sentences[0], sentences[1]],
      findingsSegment: sentences[1],
    };
  }

  const bgCount = Math.max(1, Math.floor(sentences.length * 0.3));
  const findStart = Math.max(bgCount + 1, Math.floor(sentences.length * 0.7));

  const backgroundSegment = sentences.slice(0, bgCount).join(' ');
  const middleSentences = sentences.slice(bgCount, findStart);
  const findingsSentences = sentences.slice(findStart);

  return {
    backgroundSegment,
    methodologySteps:
      middleSentences.length > 0 ? middleSentences : sentences.slice(0, Math.min(3, sentences.length)),
    findingsSegment:
      findingsSentences.length > 0
        ? findingsSentences.join(' ')
        : sentences[sentences.length - 1],
  };
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
  const concepts = extractPaperSpecificConcepts(c.title, c.abstractText, c.domain);
  const { backgroundSegment, methodologySteps, findingsSegment } = decomposeAbstractSegments(
    c.abstractText
  );

  const summaryDisplay = c.hasRealAbstract
    ? c.abstractText
    : `Bibliographic metadata record retrieved from ${contributingSources.join(', ')} (${
        c.venue || c.sourceName
      }, ${
        c.publishedAt
      }). An open-text abstract was not deposited by the publisher in this index; click "Enrich / Load Full Record" or open the original source link to inspect the manuscript.`;

  const shortWhy = c.hasRealAbstract
    ? (findingsSegment || c.abstractText).slice(0, 260) +
      ((findingsSegment || c.abstractText).length > 260 ? '...' : '')
    : `${c.evidenceStatus} work published in ${c.venue || c.sourceName} (${c.publishedAt})${
        c.citationCount > 0 ? ` · Cited ${c.citationCount.toLocaleString()} times` : ''
      }.`;

  const refs: CitationItem[] = providerLinks.map((pl, idx) => ({
    id: `ref-${c.id}-${idx}`,
    label: `${c.title} (${pl.providerName} Primary Record)`,
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

  const accessStatus: DiscoveryItem['accessStatus'] = c.pdfUrl
    ? 'open_access_pdf'
    : c.isOpenAccess
    ? 'open_access_full_text'
    : c.hasRealAbstract
    ? 'abstract_and_metadata'
    : 'metadata_only';

  const retrievalStatus: DiscoveryItem['retrievalStatus'] = c.hasRealAbstract
    ? 'abstract_and_metadata_retrieved'
    : 'metadata_only_retrieved';

  const structuredSections: PaperStructuredSection[] = c.hasRealAbstract
    ? [
        {
          id: 'sec-parsed-context',
          heading: 'Research Context & Problem Statement',
          content: backgroundSegment || c.abstractText,
          sourceBasis: 'abstract_synthesis',
        },
        {
          id: 'sec-parsed-methodology',
          heading: 'Methodology & Analytical Approach',
          content: methodologySteps.join(' '),
          sourceBasis: 'abstract_synthesis',
        },
        {
          id: 'sec-parsed-findings',
          heading: 'Reported Findings & Conclusions',
          content: findingsSegment || c.abstractText,
          sourceBasis: 'abstract_synthesis',
        },
      ]
    : [];

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
    pdfUrl: c.pdfUrl,
    isOpenAccess: c.isOpenAccess,
    accessStatus,
    retrievalStatus,
    hasRealAbstract: c.hasRealAbstract,
    abstractText: c.hasRealAbstract ? c.abstractText : undefined,
    keywords: concepts,
    subjectCategories: [c.domain, c.venue].filter(Boolean),
    structuredSections,
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
          : c.hasRealAbstract
          ? 'Verified Author Abstract & Metadata'
          : 'Bibliographic Metadata Record',
    },
    readerLayers: {
      quickOrientation: summaryDisplay,
      sourceAndStatus: `Retrieved from ${contributingSources.join(', ')}. Canonical ID: ${
        c.canonicalId
      }. Venue: ${c.venue || c.sourceName}. Evidence status: ${c.evidenceStatus}. ${
        c.isOpenAccess || c.pdfUrl
          ? `Open-access full text / PDF link available (${c.pdfUrl || c.sourceUrl}).`
          : 'Full manuscript text is hosted on the publisher page.'
      }`,
      beginnerExplanation: c.hasRealAbstract
        ? `In "${c.title}" (${c.venue || c.sourceName}, ${c.publishedAt}), ${
            c.authors.slice(0, 3).join(', ') || 'the authors'
          } investigate: ${backgroundSegment || c.abstractText}`
        : `This ${c.evidenceStatus.toLowerCase()} record ("${c.title}") was published in ${
            c.venue || c.sourceName
          } (${c.publishedAt}). Open the source link to read the full manuscript.`,
      beginnerExplanationHinglish: c.hasRealAbstract
        ? `Yeh research ("${c.title}", ${c.publishedAt}) ${
            c.venue || c.sourceName
          } mein publish hua hai: ${backgroundSegment || c.abstractText.slice(0, 420)}`
        : `Yeh paper ("${c.title}") ${c.venue || c.sourceName} (${
            c.publishedAt
          }) mein published hai. Full manuscript padhne ke liye primary source link dekhein.`,
      prerequisites: concepts,
      historicalFoundations: `${
        backgroundSegment ? `${backgroundSegment}\n\n` : ''
      }Bibliographic Context: Published in ${c.venue || c.sourceName} (${
        c.publishedAt
      }) by ${c.authors.slice(0, 6).join(', ') || 'listed authors'}.${
        c.citationCount > 0
          ? ` Cited by ${c.citationCount.toLocaleString()} scholarly works.`
          : ''
      }${
        c.referenceCount > 0
          ? ` References ${c.referenceCount.toLocaleString()} prior works.`
          : ''
      }`,
      coreMechanism: c.hasRealAbstract
        ? [
            ...methodologySteps,
            `Bibliographic & Identifier Verification: Indexed across ${contributingSources.join(
              ', '
            )} with canonical identifier ${c.canonicalId}${
              c.doi ? ` (DOI: ${c.doi})` : ''
            }${c.arxivId ? ` (arXiv:${c.arxivId})` : ''}${
              c.pmid ? ` (PMID:${c.pmid})` : ''
            }.`,
          ]
        : [
            `Primary bibliographic record verified via ${contributingSources.join(', ')} (${
              c.canonicalId
            }).`,
            'Detailed experimental protocols and mathematical derivations are hosted on the primary publisher record (open-text abstract not deposited in index).',
          ],
      coreMechanismHinglish: c.hasRealAbstract
        ? methodologySteps
        : ['Full methodology publisher ke original page par upalabdh hai.'],
      methodsAndEvidence: `Publication Venue: ${c.venue || c.sourceName} (${
        c.publishedAt
      }) · Evidence Tier: ${c.evidenceStatus} · Citation Count: ${c.citationCount.toLocaleString()} · References Recorded: ${c.referenceCount.toLocaleString()} · Indexed Sources: ${contributingSources.join(
        ', '
      )}.`,
      findings: c.hasRealAbstract
        ? findingsSegment || c.abstractText
        : 'Open the original DOI/source record or click "Load Deep Record" to inspect full experimental findings, tables, and figures.',
      limitationsAndUncertainty:
        c.evidenceStatus === 'Preprint / Not Yet Peer-Reviewed'
          ? `Preprint Notice: "${c.title}" is a scientific preprint (${c.venue || c.sourceName}) and has not yet completed formal journal peer review. Evaluate sample sizes, baseline comparisons, and replication status before generalizing.`
          : c.isOpenAccess || c.pdfUrl
          ? `Open-Access Manuscript: While the abstract summarizes core outcomes for "${c.title}", always inspect the full PDF (${
              c.pdfUrl || c.sourceUrl
            }) for complete boundary assumptions, statistical power, and ablations.`
          : `Access Scope Notice: Only bibliographic metadata ${
              c.hasRealAbstract ? 'and the author abstract ' : ''
            }are openly deposited in public APIs for "${c.title}". Full methodological controls and appendices require accessing the publisher page (${
              c.sourceUrl
            }).`,
      applicationsAndImplications: `Advances ${c.domain} research (${concepts
        .slice(0, 3)
        .join(', ')}) as documented in ${c.venue || c.sourceName} (${c.publishedAt}).`,
      criticalAnalysisAndFalsifiability:
        'Use the interactive Citation Network Graph below to inspect independent citing studies, foundational references, and companion code repositories that test or extend these findings.',
      relatedWork: providerLinks.map((p) => `${p.providerName}: ${p.url}`),
      whatToWatchNext: `Monitor incoming citations (${c.citationCount.toLocaleString()} to date) and replication benchmarks for "${c.title.slice(
        0,
        70
      )}".`,
      references: refs,
    },
    equations,
    quiz: [
      {
        id: `quiz-${c.id}`,
        question: `What is the verified publication status and source provenance of "${c.title.slice(
          0,
          75
        )}"?`,
        options: [
          'Unverified social media post without bibliographic identifiers',
          `${c.evidenceStatus} published in ${c.venue || c.sourceName} (${
            c.publishedAt
          }), verified via ${contributingSources.join(', ')}`,
          'Synthetic placeholder article with fabricated metadata',
          'Informal blog post without academic authorship',
        ],
        correctIndex: 1,
        explanationWhyRight: `"${c.title}" was retrieved from ${contributingSources.join(
          ', '
        )} with status "${c.evidenceStatus}", venue "${
          c.venue || c.sourceName
        }", and publication date ${c.publishedAt}.`,
        misconceptionDiagnosed:
          'Always verify publication venue, peer-review status, and canonical identifiers (DOI / arXiv / PMID).',
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

// ============================================================================
// UNIVERSAL PAPER RECORD RESOLVER & DEEP MULTI-SOURCE ENRICHMENT ENGINE
// ============================================================================

function cleanText(raw?: string | null): string {
  if (!raw) return '';
  return String(raw)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractXmlTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

function normalizeTitleForDedupe(raw?: string | null): string {
  return String(raw || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export async function fetchAndEnrichPaperRecord(opts: {
  paperId?: string;
  canonicalId?: string;
  doi?: string;
  arxivId?: string;
  pmid?: string;
  pmcid?: string;
  title?: string;
  existingItem?: DiscoveryItem;
}): Promise<{
  item: DiscoveryItem | null;
  sourcesChecked: string[];
  enrichedFields: string[];
  retrievedAt: string;
}> {
  const retrievedAt = new Date().toISOString();
  const sourcesChecked: string[] = [];
  const enrichedFields: string[] = [];

  let baseItem: DiscoveryItem | null = opts.existingItem ? { ...opts.existingItem } : null;

  const rawId = (opts.paperId || opts.canonicalId || '').trim();
  let cleanDoi = normalizeDoi(opts.doi || baseItem?.doi || (rawId.startsWith('doi:') ? rawId.slice(4) : undefined));
  let cleanArxiv = (
    opts.arxivId ||
    baseItem?.arxivId ||
    (rawId.startsWith('arxiv:') ? rawId.slice(6) : undefined) ||
    (rawId.startsWith('live-arxiv-') ? rawId.replace(/^live-arxiv-/i, '') : undefined) ||
    ''
  )
    .replace(/^arxiv:/i, '')
    .trim();
  let cleanPmid = (
    opts.pmid ||
    baseItem?.pmid ||
    (rawId.startsWith('pmid:') ? rawId.slice(5) : undefined) ||
    (rawId.startsWith('live-pubmed-') ? rawId.replace(/^live-pubmed-/i, '') : undefined) ||
    ''
  ).trim();
  let cleanPmcid = (
    opts.pmcid ||
    baseItem?.pmcid ||
    (rawId.startsWith('pmc:') ? rawId.slice(4) : undefined) ||
    ''
  ).trim();
  let openalexShortId =
    baseItem?.openalexId ||
    (rawId.startsWith('live-openalex-')
      ? rawId.replace(/^live-openalex-/i, '').toUpperCase()
      : rawId.startsWith('openalex:')
      ? rawId.slice(9).toUpperCase()
      : '');

  // Step 1: If we don't have a baseItem yet (e.g., direct URL load with ?paper=...), resolve it from OpenAlex, arXiv, Europe PMC, or Semantic Scholar
  if (!baseItem) {
    try {
      let oaWork: any = null;
      if (openalexShortId && /^W\d+$/i.test(openalexShortId)) {
        sourcesChecked.push('OpenAlex Direct ID');
        const res = await fetchProviderUrl(
          `https://api.openalex.org/works/${openalexShortId}?mailto=${encodeURIComponent(POLITE_EMAIL)}`
        );
        if (res.ok) oaWork = await res.json();
      } else if (cleanDoi) {
        sourcesChecked.push('OpenAlex DOI Resolver');
        const res = await fetchProviderUrl(
          `https://api.openalex.org/works/https://doi.org/${encodeURIComponent(cleanDoi)}?mailto=${encodeURIComponent(POLITE_EMAIL)}`
        );
        if (res.ok) oaWork = await res.json();
      } else if (cleanPmid) {
        sourcesChecked.push('OpenAlex PMID Resolver');
        const res = await fetchProviderUrl(
          `https://api.openalex.org/works/pmid:${encodeURIComponent(cleanPmid)}?mailto=${encodeURIComponent(POLITE_EMAIL)}`
        );
        if (res.ok) oaWork = await res.json();
      } else if (opts.title || rawId) {
        const searchQ = opts.title || rawId.replace(/^live-[a-z0-9_]+-/i, '').replace(/[-_]/g, ' ');
        if (searchQ.length > 3) {
          sourcesChecked.push('OpenAlex Search');
          const res = await queryOpenAlex({ query: searchQ, perProviderLimit: 1 });
          if (res.candidates.length > 0) {
            baseItem = buildDiscoveryItemFromCandidate(
              res.candidates[0],
              [res.candidates[0].providerDisplayName],
              [
                {
                  providerId: res.candidates[0].primaryProvider,
                  providerName: res.candidates[0].providerDisplayName,
                  url: res.candidates[0].sourceUrl,
                },
              ],
              retrievedAt,
              searchQ
            );
          }
        }
      }

      if (oaWork && oaWork.title) {
        const oaRes = await queryOpenAlex({ query: oaWork.title, perProviderLimit: 1 });
        if (oaRes.candidates.length > 0) {
          const cand = oaRes.candidates[0];
          baseItem = buildDiscoveryItemFromCandidate(
            cand,
            ['OpenAlex'],
            [{ providerId: 'openalex', providerName: 'OpenAlex', url: cand.sourceUrl }],
            retrievedAt,
            oaWork.title
          );
          if (opts.paperId) baseItem.id = opts.paperId;
        }
      }
    } catch {
      // continue to fallback resolvers
    }
  }

  // If still no baseItem and we have an arXiv ID, resolve via arXiv API directly
  if (!baseItem && cleanArxiv) {
    try {
      sourcesChecked.push('arXiv Atom API');
      const axRes = await queryArxiv({ query: cleanArxiv, perProviderLimit: 1 });
      if (axRes.candidates.length > 0) {
        const cand = axRes.candidates[0];
        baseItem = buildDiscoveryItemFromCandidate(
          cand,
          ['arXiv'],
          [{ providerId: 'arxiv', providerName: 'arXiv', url: cand.sourceUrl }],
          retrievedAt,
          cleanArxiv
        );
        if (opts.paperId) baseItem.id = opts.paperId;
      }
    } catch {
      // ignore
    }
  }

  if (!baseItem) {
    return { item: null, sourcesChecked, enrichedFields, retrievedAt };
  }

  // Sync identifiers from baseItem
  cleanDoi = cleanDoi || normalizeDoi(baseItem.doi);
  cleanArxiv = cleanArxiv || (baseItem.arxivId || '').replace(/^arxiv:/i, '').trim();
  cleanPmid = cleanPmid || (baseItem.pmid || '').trim();
  cleanPmcid = cleanPmcid || (baseItem.pmcid || '').trim();

  let bestAbstract =
    baseItem.abstractText ||
    (baseItem.hasRealAbstract ? baseItem.readerLayers.quickOrientation : '') ||
    '';
  let tldrSummary = baseItem.tldrSummary;
  const structuredSections: PaperStructuredSection[] = [...(baseItem.structuredSections || [])];
  const figures: PaperFigureItem[] = [...(baseItem.figures || [])];
  const tables: PaperTableItem[] = [...(baseItem.tables || [])];
  const equations: EquationSpec[] = [...(baseItem.equations || [])];
  const references: CitationItem[] = [...(baseItem.readerLayers?.references || [])];
  const associatedRepos: AssociatedCodeRepo[] = [...(baseItem.associatedRepos || [])];
  const contributingSources = new Set<string>(baseItem.contributingSources || [baseItem.sourceName]);

  // Step 2: Semantic Scholar Graph API enrichment (abstract, SciTLDR, externalIds, openAccessPdf, citations & references)
  try {
    let s2LookupId = '';
    if (cleanDoi) s2LookupId = `DOI:${cleanDoi}`;
    else if (cleanArxiv) s2LookupId = `ARXIV:${cleanArxiv.replace(/v\d+$/i, '')}`;
    else if (cleanPmid) s2LookupId = `PMID:${cleanPmid}`;
    else if (baseItem.semanticScholarId) s2LookupId = baseItem.semanticScholarId;

    const s2Fields =
      'title,abstract,tldr,year,publicationDate,venue,publicationVenue,citationCount,referenceCount,isOpenAccess,openAccessPdf,authors,externalIds,fieldsOfStudy,citations.title,citations.year,citations.authors,citations.venue,citations.externalIds,references.title,references.year,references.authors,references.venue,references.externalIds';

    let s2Data: any = null;
    if (s2LookupId) {
      sourcesChecked.push('Semantic Scholar Graph API');
      const s2Res = await fetchProviderUrl(
        `https://api.semanticscholar.org/graph/v1/paper/${encodeURIComponent(s2LookupId)}?fields=${s2Fields}`,
        {},
        6500
      );
      if (s2Res.ok) {
        s2Data = await s2Res.json();
      }
    } else if (baseItem.title) {
      sourcesChecked.push('Semantic Scholar Title Match');
      const s2Search = await fetchProviderUrl(
        `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(
          baseItem.title.slice(0, 120)
        )}&limit=1&fields=${s2Fields}`,
        {},
        6500
      );
      if (s2Search.ok) {
        const searchJson = await s2Search.json();
        const topHit = searchJson?.data?.[0];
        if (
          topHit &&
          normalizeTitleForDedupe(topHit.title || '') === normalizeTitleForDedupe(baseItem.title)
        ) {
          s2Data = topHit;
        }
      }
    }

    if (s2Data && s2Data.title) {
      contributingSources.add('Semantic Scholar');
      if (s2Data.paperId) baseItem.semanticScholarId = s2Data.paperId;

      if (s2Data.externalIds) {
        if (!cleanDoi && s2Data.externalIds.DOI) {
          cleanDoi = normalizeDoi(s2Data.externalIds.DOI);
          baseItem.doi = cleanDoi;
          enrichedFields.push('doi');
        }
        if (!cleanArxiv && s2Data.externalIds.ArXiv) {
          cleanArxiv = String(s2Data.externalIds.ArXiv).trim();
          baseItem.arxivId = cleanArxiv;
          enrichedFields.push('arxivId');
        }
        if (!cleanPmid && s2Data.externalIds.PubMed) {
          cleanPmid = String(s2Data.externalIds.PubMed).trim();
          baseItem.pmid = cleanPmid;
          enrichedFields.push('pmid');
        }
        if (!cleanPmcid && s2Data.externalIds.PubMedCentral) {
          cleanPmcid = String(s2Data.externalIds.PubMedCentral).trim();
          if (!cleanPmcid.toUpperCase().startsWith('PMC')) cleanPmcid = `PMC${cleanPmcid}`;
          baseItem.pmcid = cleanPmcid;
          enrichedFields.push('pmcid');
        }
      }

      if (s2Data.abstract && String(s2Data.abstract).trim().length > bestAbstract.length) {
        bestAbstract = cleanText(s2Data.abstract);
        enrichedFields.push('abstract');
      }

      if (s2Data.tldr?.text) {
        tldrSummary = cleanText(s2Data.tldr.text);
        enrichedFields.push('tldrSummary');
      }

      if (s2Data.openAccessPdf?.url && !baseItem.pdfUrl) {
        baseItem.pdfUrl = s2Data.openAccessPdf.url;
        baseItem.fullTextUrl = s2Data.openAccessPdf.url;
        baseItem.fullTextAvailable = true;
        baseItem.isOpenAccess = true;
        enrichedFields.push('pdfUrl');
      }

      if (
        typeof s2Data.citationCount === 'number' &&
        s2Data.citationCount > (baseItem.citationCount || 0)
      ) {
        baseItem.citationCount = s2Data.citationCount;
      }
      if (
        typeof s2Data.referenceCount === 'number' &&
        s2Data.referenceCount > (baseItem.referenceCount || 0)
      ) {
        baseItem.referenceCount = s2Data.referenceCount;
      }

      // Add real reference & citation records to references
      const refItems = Array.isArray(s2Data.references) ? s2Data.references.slice(0, 8) : [];
      for (const ref of refItems) {
        if (!ref?.title) continue;
        const refDoi = normalizeDoi(ref.externalIds?.DOI);
        const refUrl = refDoi
          ? `https://doi.org/${refDoi}`
          : ref.externalIds?.ArXiv
          ? `https://arxiv.org/abs/${ref.externalIds.ArXiv}`
          : 'https://www.semanticscholar.org';
        const refId = `ref-s2-${normalizeTitleForDedupe(ref.title).slice(0, 24)}`;
        if (
          !references.some(
            (c) => normalizeTitleForDedupe(c.label) === normalizeTitleForDedupe(ref.title)
          )
        ) {
          references.push({
            id: refId,
            label: ref.title,
            authors: Array.isArray(ref.authors)
              ? ref.authors
                  .slice(0, 3)
                  .map((a: any) => a.name)
                  .filter(Boolean)
                  .join(', ') || 'Listed Authors'
              : 'Listed Authors',
            venue: ref.venue || 'Referenced Scholarly Work',
            year: String(ref.year || ''),
            url: refUrl,
            doiOrId: refDoi || ref.externalIds?.ArXiv || undefined,
            statusLabel: 'Foundational / Referenced in Manuscript',
          });
        }
      }

      const citItems = Array.isArray(s2Data.citations) ? s2Data.citations.slice(0, 6) : [];
      for (const cit of citItems) {
        if (!cit?.title) continue;
        const citDoi = normalizeDoi(cit.externalIds?.DOI);
        const citUrl = citDoi
          ? `https://doi.org/${citDoi}`
          : cit.externalIds?.ArXiv
          ? `https://arxiv.org/abs/${cit.externalIds.ArXiv}`
          : 'https://www.semanticscholar.org';
        const citId = `cit-s2-${normalizeTitleForDedupe(cit.title).slice(0, 24)}`;
        if (
          !references.some(
            (c) => normalizeTitleForDedupe(c.label) === normalizeTitleForDedupe(cit.title)
          )
        ) {
          references.push({
            id: citId,
            label: cit.title,
            authors: Array.isArray(cit.authors)
              ? cit.authors
                  .slice(0, 3)
                  .map((a: any) => a.name)
                  .filter(Boolean)
                  .join(', ') || 'Listed Authors'
              : 'Listed Authors',
            venue: cit.venue || 'Subsequent Citing Work',
            year: String(cit.year || ''),
            url: citUrl,
            doiOrId: citDoi || cit.externalIds?.ArXiv || undefined,
            statusLabel: 'Cites This Paper',
          });
        }
      }
    }
  } catch {
    // continue
  }

  // Step 3: If arXiv ID is present, fetch official arXiv Atom entry for raw LaTeX abstract & direct PDF link
  if (cleanArxiv) {
    try {
      sourcesChecked.push('arXiv Official Atom API');
      const axIdClean = cleanArxiv.replace(/^arxiv:/i, '').replace(/v\d+$/i, '');
      const axRes = await fetchProviderUrl(
        `https://export.arxiv.org/api/query?id_list=${encodeURIComponent(axIdClean)}`,
        {},
        6000
      );
      if (axRes.ok) {
        const xml = await axRes.text();
        const entryMatch = xml.match(/<entry>([\s\S]*?)<\/entry>/i);
        if (entryMatch) {
          contributingSources.add('arXiv');
          const entryXml = entryMatch[1];
          const rawSummary = extractXmlTag(entryXml, 'summary');
          if (rawSummary && rawSummary.length > 40) {
            if (
              rawSummary.length >= bestAbstract.length ||
              rawSummary.includes('$') ||
              rawSummary.includes('\\')
            ) {
              bestAbstract = rawSummary;
              enrichedFields.push('arxivLatexAbstract');
            }
            const axEqs = extractEquationsFromText(baseItem.title, rawSummary, baseItem.domain);
            for (const eq of axEqs) {
              if (!equations.some((e) => e.formula === eq.formula)) {
                equations.push(eq);
              }
            }
          }
          const pdfUrl = `https://arxiv.org/pdf/${axIdClean}.pdf`;
          if (!baseItem.pdfUrl) {
            baseItem.pdfUrl = pdfUrl;
            baseItem.fullTextUrl = pdfUrl;
            baseItem.fullTextAvailable = true;
            baseItem.isOpenAccess = true;
            enrichedFields.push('arxivPdfUrl');
          }
        }
      }
    } catch {
      // continue
    }
  }

  // Step 4: Europe PMC Full-Text JATS XML & Bio-Literature Enrichment (extracts real manuscript sections, figures, tables, and <tex-math> equations!)
  try {
    if (!cleanPmcid && (cleanDoi || cleanPmid)) {
      const epmcQuery = cleanPmid ? `EXT_ID:${cleanPmid}` : `DOI:"${cleanDoi}"`;
      const epmcSearch = await fetchProviderUrl(
        `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(
          epmcQuery
        )}&resultType=core&format=json&pageSize=1`,
        {},
        6000
      );
      if (epmcSearch.ok) {
        const epmcJson = await epmcSearch.json();
        const rec = epmcJson?.resultList?.result?.[0];
        if (rec) {
          contributingSources.add('Europe PMC');
          if (rec.pmcid) {
            cleanPmcid = String(rec.pmcid).trim();
            baseItem.pmcid = cleanPmcid;
          }
          if (rec.pmid && !cleanPmid) {
            cleanPmid = String(rec.pmid).trim();
            baseItem.pmid = cleanPmid;
          }
          if (rec.abstractText && String(rec.abstractText).length > bestAbstract.length) {
            bestAbstract = cleanText(rec.abstractText);
            enrichedFields.push('europePmcAbstract');
          }
          if (rec.isOpenAccess === 'Y' && rec.pmcid && !baseItem.pdfUrl) {
            baseItem.pdfUrl = `https://europepmc.org/backend/ptpmcrender.fcgi?accid=${rec.pmcid}&blobtype=pdf`;
            baseItem.fullTextUrl = `https://europepmc.org/article/PMC/${rec.pmcid}`;
            baseItem.fullTextAvailable = true;
            baseItem.isOpenAccess = true;
          }
        }
      }
    }

    if (cleanPmcid && /^PMC\d+$/i.test(cleanPmcid)) {
      sourcesChecked.push(`Europe PMC Full-Text XML (${cleanPmcid})`);
      const xmlRes = await fetchProviderUrl(
        `https://www.ebi.ac.uk/europepmc/webservices/rest/${encodeURIComponent(
          cleanPmcid
        )}/fullTextXML`,
        {},
        7500
      );
      if (xmlRes.ok) {
        const jatsXml = await xmlRes.text();
        if (jatsXml && jatsXml.includes('<body')) {
          contributingSources.add('Europe PMC Open-Access Full Text');
          enrichedFields.push('fullTextXmlSections');

          // Extract top-level <sec> sections inside <body>
          const bodyMatch = jatsXml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
          if (bodyMatch) {
            const bodyXml = bodyMatch[1];
            const secMatches = bodyXml.match(/<sec[^>]*>[\s\S]*?<\/sec>/gi) || [];
            const extractedRealSections: PaperStructuredSection[] = [];
            for (const secXml of secMatches.slice(0, 10)) {
              const titleMatch = secXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
              const heading = titleMatch ? cleanText(titleMatch[1]) : '';
              if (!heading || heading.length > 100) continue;
              const paragraphs = (secXml.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [])
                .map((p) => cleanText(p))
                .filter((p) => p.length > 40);
              if (paragraphs.length > 0) {
                const content = paragraphs.slice(0, 3).join('\n\n').slice(0, 1800);
                if (
                  !extractedRealSections.some(
                    (s) => s.heading.toLowerCase() === heading.toLowerCase()
                  )
                ) {
                  extractedRealSections.push({
                    id: `jats-sec-${extractedRealSections.length + 1}`,
                    heading,
                    content,
                    sourceBasis: 'full_text',
                  });
                }
              }
            }
            if (extractedRealSections.length > 0) {
              structuredSections.splice(0, structuredSections.length, ...extractedRealSections);
            }
          }

          // Extract <fig> captions from JATS XML
          const figMatches = jatsXml.match(/<fig[^>]*>([\s\S]*?)<\/fig>/gi) || [];
          for (const figXml of figMatches.slice(0, 6)) {
            const label = cleanText(
              extractXmlTag(figXml, 'label') || `Figure ${figures.length + 1}`
            );
            const caption = cleanText(extractXmlTag(figXml, 'caption'));
            if (caption && caption.length > 15) {
              figures.push({
                id: `fig-${figures.length + 1}`,
                label,
                caption: caption.slice(0, 500),
                sourceNote: `Europe PMC Full Text (${cleanPmcid})`,
              });
            }
          }

          // Extract <table-wrap> captions and headers from JATS XML
          const tableMatches = jatsXml.match(/<table-wrap[^>]*>([\s\S]*?)<\/table-wrap>/gi) || [];
          for (const tblXml of tableMatches.slice(0, 4)) {
            const label = cleanText(extractXmlTag(tblXml, 'label') || `Table ${tables.length + 1}`);
            const caption = cleanText(
              extractXmlTag(tblXml, 'caption') || 'Manuscript Data Table'
            );
            const trMatches = tblXml.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
            if (trMatches.length >= 2) {
              const parseRow = (tr: string) =>
                (tr.match(/<(?:th|td)[^>]*>([\s\S]*?)<\/(?:th|td)>/gi) || [])
                  .map((cell) => cleanText(cell).slice(0, 80))
                  .slice(0, 6);
              const headers = parseRow(trMatches[0] || '');
              const rows = trMatches
                .slice(1, 6)
                .map(parseRow)
                .filter((r) => r.length > 0);
              if (headers.length > 0 && rows.length > 0) {
                tables.push({
                  id: `tbl-${tables.length + 1}`,
                  caption: `${label}: ${caption.slice(0, 280)}`,
                  headers,
                  rows,
                });
              }
            }
          }

          // Extract <tex-math> equations from JATS XML
          const texMatches = jatsXml.match(/<tex-math[^>]*>([\s\S]*?)<\/tex-math>/gi) || [];
          for (const tm of texMatches.slice(0, 5)) {
            let rawTex = tm.replace(/<\/?tex-math[^>]*>/gi, '').trim();
            const docMatch = rawTex.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/i);
            if (docMatch) rawTex = docMatch[1].trim();
            rawTex = rawTex.replace(/^\$\$?|\$\$?$/g, '').trim();
            if (
              rawTex.length >= 4 &&
              rawTex.length <= 280 &&
              !equations.some((e) => e.formula === rawTex)
            ) {
              equations.push({
                id: `jats-eq-${equations.length + 1}`,
                title: `Manuscript Equation (${equations.length + 1})`,
                formula: rawTex,
                intuition: `Mathematical expression extracted directly from the full-text XML of "${baseItem.title.slice(
                  0,
                  65
                )}".`,
                variables: [
                  {
                    symbol: 'Source',
                    meaning: `Europe PMC Full-Text XML (${cleanPmcid})`,
                    unit: 'manuscript notation',
                  },
                ],
              });
            }
          }
        }
      }
    }
  } catch {
    // continue
  }

  // Step 5: Query Hugging Face Papers / Papers with Code for verified companion GitHub repositories
  try {
    const pwcQuery = cleanArxiv || baseItem.title.slice(0, 75);
    const pwcRes = await fetchProviderUrl(
      `https://huggingface.co/api/papers/search?q=${encodeURIComponent(pwcQuery)}`,
      {},
      5000
    );
    if (pwcRes.ok) {
      sourcesChecked.push('Papers with Code / Hugging Face Papers');
      const pwcData = await pwcRes.json();
      if (Array.isArray(pwcData)) {
        for (const entry of pwcData.slice(0, 4)) {
          const p = entry?.paper || entry;
          if (p?.githubRepo) {
            const ghUrl = String(p.githubRepo).trim();
            const fullName = ghUrl.replace(/^https?:\/\/github\.com\//i, '').replace(/\/+$/, '');
            if (
              fullName.includes('/') &&
              !associatedRepos.some((r) => r.fullName.toLowerCase() === fullName.toLowerCase())
            ) {
              const isExactMatch =
                (cleanArxiv && p.id === cleanArxiv.replace(/v\d+$/i, '')) ||
                normalizeTitleForDedupe(String(p.title || '')) ===
                  normalizeTitleForDedupe(baseItem.title);
              associatedRepos.push({
                fullName,
                url: ghUrl,
                stars: typeof p.githubStars === 'number' ? p.githubStars : undefined,
                description: isExactMatch
                  ? `Verified official code repository linked to "${baseItem.title.slice(0, 60)}"`
                  : `Related research implementation (${p.title})`,
                provenance: isExactMatch ? 'Papers with Code / HF Verified' : 'Topic Recommendation',
                matchConfidence: isExactMatch ? 'high_verified' : 'topic_related',
                evidenceNote: isExactMatch
                  ? `Exact paper match via Hugging Face Papers / Papers with Code (${
                      p.id || 'Title Match'
                    })`
                  : `Topic match via Hugging Face Papers search`,
              });
              enrichedFields.push('associatedRepos');
            }
          }
        }
      }
    }
  } catch {
    // ignore
  }

  // Step 6: Recompute structured reader layers & equations if we enriched the abstract or full text
  const hasRealAbstract =
    bestAbstract.trim().length > 25 &&
    !bestAbstract.startsWith('Metadata record retrieved from') &&
    !bestAbstract.startsWith('Bibliographic metadata record retrieved from');
  if (hasRealAbstract) {
    baseItem.hasRealAbstract = true;
    baseItem.abstractText = bestAbstract;
    const extractedEqs = extractEquationsFromText(baseItem.title, bestAbstract, baseItem.domain);
    for (const eq of extractedEqs) {
      if (!equations.some((e) => e.formula === eq.formula)) {
        equations.push(eq);
      }
    }

    const { backgroundSegment, methodologySteps, findingsSegment } =
      decomposeAbstractSegments(bestAbstract);

    baseItem.readerLayers = {
      ...baseItem.readerLayers,
      quickOrientation: bestAbstract,
      beginnerExplanation: tldrSummary
        ? `${tldrSummary}\n\nContext from "${baseItem.title}" (${
            baseItem.venue || baseItem.sourceName
          }, ${baseItem.publishedAt}): ${backgroundSegment}`
        : `In "${baseItem.title}" (${baseItem.venue || baseItem.sourceName}, ${
            baseItem.publishedAt
          }), ${
            baseItem.authors.slice(0, 3).join(', ') || 'the authors'
          } investigate: ${backgroundSegment || bestAbstract}`,
      coreMechanism: [
        ...methodologySteps,
        `Bibliographic & Identifier Verification: Indexed across ${Array.from(
          contributingSources
        ).join(', ')} with canonical identifier ${baseItem.canonicalId}${
          cleanDoi ? ` (DOI: ${cleanDoi})` : ''
        }${cleanArxiv ? ` (arXiv:${cleanArxiv})` : ''}${
          cleanPmid ? ` (PMID:${cleanPmid})` : ''
        }.`,
      ],
      findings: findingsSegment || bestAbstract,
      references,
    };

    if (
      structuredSections.length === 0 ||
      structuredSections.every((s) => s.sourceBasis === 'abstract_synthesis')
    ) {
      structuredSections.splice(
        0,
        structuredSections.length,
        {
          id: 'sec-abstract-overview',
          heading: 'Abstract & Problem Context',
          content: backgroundSegment || bestAbstract,
          sourceBasis: 'abstract_synthesis',
        },
        {
          id: 'sec-parsed-methodology',
          heading: 'Methodology & Analytical Approach',
          content: methodologySteps.join(' '),
          sourceBasis: 'abstract_synthesis',
        },
        {
          id: 'sec-parsed-findings',
          heading: 'Reported Findings & Conclusions',
          content: findingsSegment || bestAbstract,
          sourceBasis: 'abstract_synthesis',
        }
      );
    }
  } else {
    baseItem.readerLayers = {
      ...baseItem.readerLayers,
      references,
    };
  }

  baseItem.tldrSummary = tldrSummary;
  baseItem.structuredSections = structuredSections;
  baseItem.figures = figures;
  baseItem.tables = tables;
  baseItem.equations = equations;
  baseItem.associatedRepos = associatedRepos;
  baseItem.contributingSources = Array.from(contributingSources);
  baseItem.retrievalStatus =
    structuredSections.some((s) => s.sourceBasis === 'full_text') || baseItem.pdfUrl
      ? 'full_text_retrieved'
      : baseItem.hasRealAbstract
      ? 'abstract_and_metadata_retrieved'
      : 'metadata_only_retrieved';
  baseItem.accessStatus = baseItem.pdfUrl
    ? 'open_access_pdf'
    : baseItem.isOpenAccess
    ? 'open_access_full_text'
    : baseItem.hasRealAbstract
    ? 'abstract_and_metadata'
    : 'metadata_only';

  return {
    item: baseItem,
    sourcesChecked,
    enrichedFields,
    retrievedAt,
  };
}


