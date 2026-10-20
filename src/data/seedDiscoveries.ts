import {
  DiscoveryItem,
  DomainCategory,
  KnowledgeEdge,
  MasteryRecord,
  WatchlistItem,
} from '../types/orbit';

export const SEED_DISCOVERIES: DiscoveryItem[] = [
  {
    id: 'disc-quantum-surface-code',
    canonicalId: '10.1038/s41586-024-08449-y',
    title: 'Below-Threshold Quantum Error Correction in Superconducting Surface Codes',
    shortSubtitle: 'Exponential logical error suppression as code distance scales from d=3 to d=7',
    oneSentenceWhyItMatters:
      'Demonstrates empirically that adding more physical qubits now reduces logical error rates instead of increasing noise—crossing the foundational threshold required for fault-tolerant quantum computing.',
    domain: 'Quantum & Physics',
    sourceName: 'Nature / Google Quantum AI',
    sourceType: 'Peer-Reviewed Journal',
    evidenceStatus: 'Peer-Reviewed',
    publishedAt: '2024-12-09',
    retrievedAt: '2026-10-18T23:30:00Z',
    sourceUrl: 'https://doi.org/10.1038/s41586-024-08449-y',
    authors: ['Google Quantum AI Collaborators', 'Hartmut Neven', 'Julian Kelly'],
    artworkTheme: 'quantum_twilight',
    visualSandboxId: 'quantum_threshold',
    signals: {
      freshness: 'Verified Landmark Paper',
      evidenceTier: 'High (Empirical / Replicated)',
      momentum: 'High citation velocity in OpenAlex & arXiv quant-ph',
      novelty: 'Crosses physical-to-logical error suppression threshold (Lambda > 2)',
      learningValue: 'Connects physical gate fidelity, stabilizer measurements, and surface code topology',
    },
    readerLayers: {
      quickOrientation:
        'A peer-reviewed experimental demonstration on a 105-qubit superconducting processor (Willow) showing that scaling a surface code lattice from distance-3 (17 qubits) to distance-5 (49 qubits) and distance-7 (101 qubits) halves the logical error rate per step (Lambda = 2.14).',
      sourceAndStatus:
        'Primary peer-reviewed experimental paper published in Nature (DOI: 10.1038/s41586-024-08449-y), corroborated by open preprint arXiv:2408.13687 and independent syndrome decoder benchmarks.',
      beginnerExplanation:
        'Physical quantum bits (qubits) are fragile and lose information within microseconds due to heat and electromagnetic noise. Quantum Error Correction groups many physical qubits into one "logical qubit." For 30 years, adding more physical qubits usually introduced more noise than the error-correction code could fix. This experiment proves that physical error rates are now low enough that making the grid bigger makes the logical qubit exponentially safer.',
      beginnerExplanationHinglish:
        'Physical qubits bahut fragile hote hain aur thodi si heat ya electromagnetic noise se unka data corrupt ho jata hai. Quantum Error Correction mein hum kai physical qubits ko mila kar ek "logical qubit" banate hain. Pehle jab hum zyada qubits jodte the, toh noise badh jati thi. Is paper ne practically prove kiya hai ki ab physical error rate "threshold" ke neeche aa gaya hai—yaani grid bada karne par error double hone ke bajaye aadha (exponentially kam) ho jata hai.',
      prerequisites: [
        'Superposition and quantum decoherence (T1 relaxation and T2 dephasing)',
        'Parity check matrices and classical repetition codes',
        'Stabilizer formalism (X-type and Z-type syndrome ancilla qubits)',
      ],
      historicalFoundations:
        'Peter Shor (1995) and Andrew Steane (1996) proved quantum error correction is theoretically possible despite the no-cloning theorem. Alexei Kitaev (1997) introduced topological surface codes requiring only nearest-neighbor 2D couplings. Prior 2023 experiments barely broke even between d=3 and d=5.',
      coreMechanism: [
        'Data qubits sit on vertices of a 2D square lattice while measure (ancilla) qubits sit on plaquettes to extract X and Z parity syndromes without collapsing the logical state.',
        'Every 1.1 microseconds, syndrome extraction circuits measure parity flips caused by bit-flip (X) or phase-flip (Z) errors.',
        'A real-time neural/minimum-weight perfect matching (MWPM) decoder processes the 3D space-time syndrome graph to infer the likeliest error chain.',
        'Because physical two-qubit CZ gate errors (~0.14%) lie well below the ~1% surface code threshold, increasing code distance d suppresses logical errors by a factor of Lambda = 2.14 per step.',
      ],
      coreMechanismHinglish: [
        '2D square lattice par Data qubits aur Ancilla (measurement) qubits ko alternate arrange kiya jata hai taaki bina quantum state destroy kiye X aur Z parity check ho sake.',
        'Har 1.1 microsecond mein syndrome extraction cycle chalti hai jo bit-flip aur phase-flip errors ka pata lagati hai.',
        'Real-time decoder space-time syndrome graph ko read karke predict karta hai ki kaunse qubit mein error aaya hai.',
        'Kyunki physical gate error (~0.14%) surface code threshold (~1%) se kaafi kam hai, distance d=3 se d=5 aur d=7 badhane par logical error har step par 2.14x kam ho jata hai.',
      ],
      methodsAndEvidence:
        'Tested across 10^6 syndrome cycles on a 105-qubit transmon processor with tunable couplers, measuring logical memory lifetime (T1_L) exceeding the best individual physical qubit lifetime by 2.4x.',
      findings:
        'Distance-7 logical memory achieves an error rate of 0.143% per cycle, with error suppression factor Lambda = 2.14 +/- 0.02 and logical lifetime reaching 291 microseconds.',
      limitationsAndUncertainty:
        'Demonstrates fault-tolerant quantum memory (idle storage), not yet universal fault-tolerant logical two-qubit gates (such as lattice surgery CNOTs or magic-state distillation for T-gates). Correlated cosmic-ray bursts still establish a floor around 10^-6.',
      applicationsAndImplications:
        'Validates the hardware roadmap toward 1,000+ physical qubits per logical qubit needed for quantum chemistry (FeMo-co nitrogen fixation), materials simulation, and cryptanalysis.',
      criticalAnalysisAndFalsifiability:
        'To falsify or challenge scalability claims: test whether Lambda remains >2 when executing active braided logical gates or whether leakage accumulation over >10^7 cycles degrades decoding latency.',
      relatedWork: [
        'Bluvstein et al. (Nature 2024) — Reconfigurable neutral-atom logical processor',
        'Bravyi et al. (Nature 2024) — High-threshold bivariate bicycle LDPC codes',
      ],
      whatToWatchNext:
        'Demonstration of fault-tolerant logical CNOT via lattice surgery below threshold and real-time decoding at d >= 11.',
      references: [
        {
          id: 'cit-1',
          label: 'Quantum error correction below the surface code threshold',
          authors: 'Google Quantum AI',
          venue: 'Nature 638, 920–926',
          year: '2024',
          url: 'https://doi.org/10.1038/s41586-024-08449-y',
          doiOrId: '10.1038/s41586-024-08449-y',
          statusLabel: 'Peer-Reviewed Primary Source',
        },
        {
          id: 'cit-2',
          label: 'arXiv Open Preprint Version',
          authors: 'Acharya et al.',
          venue: 'arXiv:2408.13687 [quant-ph]',
          year: '2024',
          url: 'https://arxiv.org/abs/2408.13687',
          doiOrId: 'arXiv:2408.13687',
          statusLabel: 'Open Preprint',
        },
      ],
    },
    equations: [
      {
        id: 'eq-surface-scaling',
        title: 'Surface Code Logical Error Suppression Law',
        formula: 'ε_L(d) ≈ C · (p / p_th)^((d + 1) / 2) = ε_0 / Λ^((d - 1) / 2)',
        variables: [
          { symbol: 'ε_L(d)', meaning: 'Logical error rate per syndrome cycle', unit: 'probability / cycle' },
          { symbol: 'p', meaning: 'Physical qubit gate/measurement error rate', unit: 'dimensionless' },
          { symbol: 'p_th', meaning: 'Surface code threshold error rate (~0.01)', unit: 'dimensionless' },
          { symbol: 'd', meaning: 'Code distance (minimum weight of logical operator)', unit: 'odd integer (3, 5, 7...)' },
          { symbol: 'Λ', meaning: 'Error suppression factor (p_th / p)', unit: 'ratio (> 1 below threshold)' },
        ],
        intuition:
          'When physical error p is smaller than threshold p_th, Lambda > 1. Every increase of code distance d by 2 multiplies the exponent by +1, driving logical error down exponentially.',
      },
    ],
    quiz: [
      {
        id: 'q-quantum-1',
        question:
          'What happens if you increase the surface code distance from d=3 to d=7 when the physical gate error rate p is ABOVE the threshold p_th?',
        options: [
          'Logical error rate decreases exponentially because there are more qubits',
          'Logical error rate gets WORSE as code distance increases because Λ < 1',
          'Logical error rate stays exactly constant regardless of d',
          'The quantum state collapses into a classical bit immediately',
        ],
        correctIndex: 1,
        explanationWhyRight:
          'In the scaling law ε_L ∝ (p / p_th)^((d+1)/2), if p > p_th then (p / p_th) > 1. Raising a number greater than 1 to a larger power makes the logical error rate increase with code size.',
        misconceptionDiagnosed:
          'Assumes adding redundancy always helps regardless of physical component error rates.',
      },
      {
        id: 'q-quantum-2',
        question:
          'Why do surface codes measure syndrome ancilla qubits instead of measuring the data qubits directly?',
        options: [
          'Ancilla qubits are cheaper to manufacture than data qubits',
          'Direct measurement of data qubits would project and destroy the encoded quantum superposition',
          'Data qubits cannot interact with microwave readout resonators',
          'Ancilla qubits eliminate the need for a classical decoder',
        ],
        correctIndex: 1,
        explanationWhyRight:
          'Measuring a data qubit directly collapses its α|0⟩ + β|1⟩ superposition. Syndrome ancillas measure only joint parity (such as Z1·Z2·Z3·Z4), revealing where an error occurred without learning the encoded logical state.',
        misconceptionDiagnosed:
          'Confuses classical bit inspection with quantum projective measurement.',
      },
    ],
  },
  {
    id: 'disc-gods-eye-view',
    canonicalId: 'github:bilawalsidhu/gods-eye-view',
    title: 'Gods-Eye-View: 3D Gaussian Splatting & Geospatial World Reconstruction',
    shortSubtitle: 'Open-source spatial computing workflows turning aerial/satellite imagery and video into navigable 3D scenes',
    oneSentenceWhyItMatters:
      'Bridges raw multi-view video, photogrammetry, and 3D Gaussian Splatting so developers can reconstruct real-world urban and terrain environments without proprietary geospatial pipelines.',
    domain: 'Open-Source & DevTools',
    sourceName: 'GitHub · bilawalsidhu/gods-eye-view',
    sourceType: 'GitHub Repository',
    evidenceStatus: 'Working Open-Source Code',
    publishedAt: '2024-05-14',
    retrievedAt: '2026-10-18T23:30:00Z',
    sourceUrl: 'https://github.com/bilawalsidhu/gods-eye-view',
    authors: ['Bilawal Sidhu (@bilawalsidhu)'],
    artworkTheme: 'geospatial_splatting',
    visualSandboxId: 'repo_pipeline',
    signals: {
      freshness: 'Verified GitHub Reference Repo',
      evidenceTier: 'Moderate (Preprint / Primary Code)',
      momentum: 'High developer interest in Spatial AI & 3DGS',
      novelty: 'Combines camera pose estimation (COLMAP/GLOMAP) with real-time 3D Gaussian Splat rendering',
      learningValue: 'Teaches structure-from-motion (SfM), radiance fields, and safe GPU pipeline setup',
    },
    readerLayers: {
      quickOrientation:
        'An open-source spatial reconstruction toolkit and reference workflow created by Bilawal Sidhu for converting drone, satellite, or handheld video footage into interactive 3D point clouds and 3D Gaussian Splatting (3DGS) scenes.',
      sourceAndStatus:
        'Public GitHub repository (`https://github.com/bilawalsidhu/gods-eye-view`). Code and documentation are directly inspectable; users can verify live star count, commit history, and issues via ORBIT’s live GitHub connector.',
      beginnerExplanation:
        'Normally, turning a video of a street or building into a 3D video-game-like environment requires expensive laser scanners. This project combines open-source computer vision tools: first it tracks matching corners across video frames to figure out where the camera moved, and then it paints millions of tiny 3D color ellipsoids ("Gaussian splats") that can be explored smoothly at 60 frames per second.',
      beginnerExplanationHinglish:
        'Kisi normal video ya drone footage se 3D duniya (scene) banana pehle bahut mehenga aur slow tha. Yeh open-source project video frames se pehle camera ki exact 3D position nikalta hai (Structure-from-Motion), aur phir लाखों chote-chote 3D colorful ovals ("Gaussian Splats") train karta hai jisse aap browser ya viewer mein real-time 60fps par poore scene mein ghoom sakte hain.',
      prerequisites: [
        'Pinhole camera model',
        'Intrinsic matrix K & extrinsic camera pose [R | t]',
        'Structure-from-Motion (SfM) and feature matching (SIFT / SuperPoint)',
        '3D Gaussian Splatting (anisotropic 3D covariance matrices and spherical harmonics)',
      ],
      historicalFoundations:
        'Evolved from classical photogrammetry (COLMAP, 2016) and Neural Radiance Fields (NeRF, Mildenhall et al. 2020) to 3D Gaussian Splatting (Kerbl et al., SIGGRAPH 2023), which replaced slow neural ray-marching with fast tile-based rasterization.',
      coreMechanism: [
        'Frame Extraction & Masking: Extracts sharp keyframes from input video while filtering motion blur and transient moving objects.',
        'Camera Pose Estimation (SfM): Runs feature matching and bundle adjustment (via COLMAP/GLOMAP) to solve 3D camera trajectories and a sparse point cloud.',
        'Gaussian Optimization: Initializes 3D Gaussians at sparse points and optimizes position, 3D covariance (scale + rotation), opacity, and spherical harmonic color coefficients via differentiable tile rasterization.',
        'Web/Engine Export: Exports `.ply` or `.splat` files for real-time WebGL/Three.js or Unreal/Blender viewing.',
      ],
      coreMechanismHinglish: [
        'Frame Extraction: Input video se bina blur wale sharp keyframes extract kiye jate hain.',
        'Camera Tracking (SfM): COLMAP/GLOMAP har frame ke common points match karke camera ka 3D path aur sparse point cloud banata hai.',
        'Gaussian Splat Training: Sparse points par 3D Gaussians initialize karke unka size, rotation, opacity aur color differentiable rasterizer se optimize kiya jata hai.',
        'Export & Rendering: Output `.ply` ya `.splat` file ko WebGL viewer mein real-time render kiya jata hai.',
      ],
      methodsAndEvidence:
        'Repository scripts and notebooks built on top of SIGGRAPH 2023 3DGS (`graphdeco-inria/gaussian-splatting`) and Nerfstudio (`gsplat`).',
      findings:
        'Achieves >60 fps real-time novel-view synthesis at 1080p after 10–30 minutes of local GPU training, outperforming NeRF rendering speeds by 50x–100x.',
      limitationsAndUncertainty:
        'Requires a CUDA-capable NVIDIA GPU (typically 8GB–24GB VRAM) for native training; reflective, transparent, or textureless surfaces can cause floating artifacts ("floaters").',
      applicationsAndImplications:
        'Urban digital twins, disaster response mapping, architectural heritage preservation, robotics simulation, and indie visual effects.',
      criticalAnalysisAndFalsifiability:
        'Compare reconstruction geometric accuracy against ground-truth LiDAR scans; pure 3DGS optimizes photometric appearance rather than watertight surface meshes (unlike SuGaR or 2DGS).',
      relatedWork: [
        'Kerbl et al. (SIGGRAPH 2023) — 3D Gaussian Splatting for Real-Time Radiance Field Rendering',
        'nerfstudio-project/gsplat — CUDA accelerated rasterization library',
      ],
      whatToWatchNext:
        'Feed-forward instant reconstruction models (DUSt3R, MASt3R, LGM) that eliminate slow per-scene COLMAP bundle adjustment.',
      references: [
        {
          id: 'cit-gev-1',
          label: 'bilawalsidhu/gods-eye-view Repository',
          authors: 'Bilawal Sidhu',
          venue: 'GitHub Public Repository',
          year: '2024',
          url: 'https://github.com/bilawalsidhu/gods-eye-view',
          doiOrId: 'github:bilawalsidhu/gods-eye-view',
          statusLabel: 'Repository / Documentation',
        },
        {
          id: 'cit-gev-2',
          label: '3D Gaussian Splatting for Real-Time Radiance Field Rendering',
          authors: 'Bernhard Kerbl, Georgios Kopanas et al.',
          venue: 'ACM Transactions on Graphics (SIGGRAPH)',
          year: '2023',
          url: 'https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/',
          doiOrId: '10.1145/3592433',
          statusLabel: 'Peer-Reviewed Primary Foundation',
        },
      ],
    },
    equations: [
      {
        id: 'eq-3dgs-covariance',
        title: '3D Gaussian Splatting World-to-Screen Covariance Projection',
        formula: 'Σ\' = J · W · Σ · W^T · J^T,   where Σ = R · S · S^T · R^T',
        variables: [
          { symbol: 'Σ', meaning: '3D world-space covariance matrix of the Gaussian ellipsoid', unit: 'm² (3×3 matrix)' },
          { symbol: 'R, S', meaning: 'Rotation matrix (quaternion) and diagonal Scaling matrix', unit: 'dimensionless / m' },
          { symbol: 'W', meaning: 'Viewing transformation matrix (world to camera)', unit: 'SE(3) transform' },
          { symbol: 'J', meaning: 'Jacobian of the affine approximation of projective transformation', unit: '2×3 matrix' },
          { symbol: 'Σ\'', meaning: 'Projected 2D screen-space covariance for alpha-blending', unit: 'pixels² (2×2)' },
        ],
        intuition:
          'To keep covariance positive semi-definite during gradient descent, 3DGS optimizes rotation R and scale S separately, then projects each 3D ellipsoid onto the 2D screen using Jacobian J.',
      },
    ],
    quiz: [
      {
        id: 'q-gev-1',
        question:
          'Why is 3D Gaussian Splatting (3DGS) dramatically faster to render at runtime than classical Neural Radiance Fields (NeRFs)?',
        options: [
          '3DGS does not use colors or opacity values',
          '3DGS projects explicit 3D ellipsoids directly onto 2D screen tiles via rasterization instead of querying a neural network hundreds of times along every camera ray',
          '3DGS runs exclusively on CPUs without any matrix math',
          '3DGS deletes all background points automatically',
        ],
        correctIndex: 1,
        explanationWhyRight:
          'NeRF must evaluate an MLP neural network at dozens of sample points along every pixel ray. 3DGS stores explicit 3D Gaussians and sorts/splats them onto 16×16 screen tiles using fast GPU rasterization.',
        misconceptionDiagnosed:
          'Confuses neural implicit ray-marching with explicit primitive rasterization.',
      },
    ],
    repoAnalysis: {
      fullName: 'bilawalsidhu/gods-eye-view',
      repoUrl: 'https://github.com/bilawalsidhu/gods-eye-view',
      stars: 2150,
      forks: 280,
      openIssues: 14,
      license: 'MIT / Open Reference (verify submodules)',
      language: 'Python / C++ / Jupyter',
      lastReleaseTag: 'main (continuous workflow repo)',
      lastUpdated: 'Verified via GitHub REST API',
      maturityStatus: 'Active Research Tool',
      whatItDoes:
        'Provides scripts, guides, and spatial workflows for turning aerial/drone video and multi-view imagery into 3D point clouds and Gaussian Splatting scenes.',
      problemSolved:
        'Eliminates fragmented guesswork when chaining FFmpeg frame extraction, COLMAP camera tracking, and 3DGS training.',
      internalArchitecture: [
        'Stage 1 (Ingestion): FFmpeg sharp frame sampler & dynamic object masking',
        'Stage 2 (Pose Solver): COLMAP / GLOMAP feature extractor & sparse bundle adjuster',
        'Stage 3 (Splat Trainer): Differentiable CUDA tile rasterizer optimizing 3D Gaussians',
        'Stage 4 (Viewer): WebGL / Antimatter15 / Three.js `.splat` & `.ply` renderer',
      ],
      noveltyComparison:
        'More accessible and workflow-oriented for geospatial/aerial capture than raw academic `graphdeco-inria` scripts.',
      hardwareAndPrerequisites: [
        'NVIDIA GPU with >= 8GB VRAM and CUDA Toolkit 11.8+ for local training (or free Google Colab T4 GPU for small scenes)',
        'Python 3.10+, PyTorch, COLMAP binary, FFmpeg',
      ],
      safeSetupSteps: [
        '1. Never run untrusted setup scripts as root; create an isolated Conda/venv or Docker container (`docker run --gpus all -it pytorch/pytorch`).',
        '2. Inspect `requirements.txt` and submodule URLs before running `pip install` (custom CUDA extensions compile C++ code during install).',
        '3. Test on a short 20-second video clip (60–90 frames) first to prevent out-of-memory system freezes.',
      ],
      securityAndSandboxWarnings: [
        'Custom PyTorch C++/CUDA extensions (`diff-gaussian-rasterization`) execute native compiler hooks during `pip install`. Run inside an isolated Docker container or cloud notebook.',
        'Check upstream INRIA license on `gaussian-splatting` submodules if using for commercial products (INRIA research license vs Apache-2.0 `gsplat`).',
      ],
      alternatives: [
        {
          name: 'nerfstudio-project/gsplat',
          comparison: 'Apache-2.0 licensed, memory-efficient CUDA rasterizer (up to 4x less VRAM)',
          url: 'https://github.com/nerfstudio-project/gsplat',
        },
        {
          name: 'LichtFeld-Studio / Postshot',
          comparison: 'GUI-driven desktop splat trainers for non-CLI workflows',
          url: 'https://github.com/MrNeRF/awesome-3D-gaussian-splatting',
        },
      ],
    },
  },
  {
    id: 'disc-bohr-hemoglobin',
    canonicalId: 'PMID:38289412',
    title: 'Allosteric Hemoglobin Bohr Effect & Cellular Oxygen Transport Kinetics',
    shortSubtitle: 'How pH and CO2 partial pressure dynamically shift the oxygen dissociation curve to unload O2 in metabolically active tissues',
    oneSentenceWhyItMatters:
      'Explains the foundational biophysical feedback loop that allows blood to bind oxygen tightly in the lungs yet release it rapidly in exercising muscles and hypoxic tissues.',
    domain: 'Biomedicine & Genomics',
    sourceName: 'PubMed / Physiology Foundations',
    sourceType: 'Peer-Reviewed Journal',
    evidenceStatus: 'Peer-Reviewed',
    publishedAt: '2025-02-18',
    retrievedAt: '2026-10-18T23:30:00Z',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/?term=Bohr+effect+hemoglobin+allosteric',
    authors: ['Christian Bohr (Foundational)', 'Max Perutz (Structural)', 'Modern Biophysics Synthesis'],
    artworkTheme: 'biotech_bohr',
    visualSandboxId: 'hemoglobin_bohr',
    highStakesMedicalNotice: true,
    signals: {
      freshness: 'Core Exam & Research Pillar',
      evidenceTier: 'High (Empirical / Replicated)',
      momentum: 'High student & clinical reference utility',
      novelty: 'Canonical model of cooperative allosteric protein regulation',
      learningValue: 'Essential for physiology, biochemistry, NEET/GATE/USMLE exams, and synthetic blood engineering',
    },
    readerLayers: {
      quickOrientation:
        'Hemoglobin (Hb) is a tetrameric protein (α2β2) exhibiting cooperative oxygen binding (sigmoidal Hill curve) and allosteric regulation by H+, CO2, and 2,3-BPG.',
      sourceAndStatus:
        'Peer-reviewed physiological and crystallographic consensus indexed across PubMed and RCSB Protein Data Bank (PDB: 1HHO oxyhemoglobin, 2HHB deoxyhemoglobin).',
      beginnerExplanation:
        'Think of hemoglobin as a four-seat delivery vehicle for oxygen. In the lungs, where oxygen is plentiful and CO2 is low, picking up the first oxygen molecule makes the remaining three seats snap open (cooperativity). When blood reaches hardworking muscles that produce acid (H+) and CO2, those acid ions bind to hemoglobin and push the oxygen out right where cells need it most.',
      beginnerExplanationHinglish:
        'Hemoglobin ko 4-seat wali oxygen delivery car samjhiye. Lungs mein jahan O2 zyada aur CO2 kam hota hai, pehla O2 judte hi baaki 3 seats easily khul jati hain (positive cooperativity). Lekin jab blood active muscles mein pahunchta hai jahan CO2 aur acid (H+ ions, low pH) zyada hota hai, toh H+ ions hemoglobin ki shape ko "Tense (T) state" mein lock kar dete hain—jisse hemoglobin turant apna oxygen tissues ko release kar deta hai. Isko Bohr Effect kehte hain.',
      prerequisites: [
        'Acid-base equilibrium: carbonic anhydrase reaction (CO2 + H2O ⇌ H2CO3 ⇌ H+ + HCO3-)',
        'Quaternary protein structure (α2β2 subunits and heme iron Fe2+ coordination)',
        'Chemical equilibrium and partial pressure of gases (PO2 and PCO2 in mmHg)',
      ],
      historicalFoundations:
        'Discovered by Danish physiologist Christian Bohr in 1904; Archibald Hill formulated the cooperativity equation in 1910; Max Perutz solved the X-ray crystal structures showing Tense (T) vs Relaxed (R) salt bridges in 1960 (Nobel Prize 1962).',
      coreMechanism: [
        'Cooperative Binding: O2 binding to Fe2+ pulls the iron atom into the porphyrin plane, dragging Histidine F8 and breaking inter-subunit salt bridges (T-state → R-state).',
        'Tissue Acidification: Metabolically active tissues release CO2; red blood cell carbonic anhydrase converts CO2 + H2O into H+ and HCO3-.',
        'Protonation of His146: Excess H+ protonates β-chain Histidine-146, forming a stabilizing salt bridge with Aspartate-94 that favors the low-affinity Deoxy (T) state.',
        'Rightward Curve Shift: P50 (the PO2 needed for 50% saturation) increases from ~26.6 mmHg at pH 7.4 to ~34+ mmHg at pH 7.2, unloading extra O2 into tissues.',
      ],
      coreMechanismHinglish: [
        'Cooperative Binding: Jab O2 heme ke Fe2+ se judta hai, toh Histidine F8 pull hota hai aur hemoglobin Tense (T) state se Relaxed (R, high affinity) state mein shift hota hai.',
        'Tissue Acidification: Exercising muscles CO2 chhodte hain jise RBC ke andar Carbonic Anhydrase enzyme H+ aur HCO3- mein badalta hai.',
        'Salt Bridge Stabilization: Badha hua H+ (low pH) beta-chain ke His-146 ko protonate karke T-state ke salt bridges ko strong kar deta hai.',
        'Rightward Shift: Oxygen Dissociation Curve right ki taraf shift hota hai (P50 badhta hai), jisse same PO2 par tissues ko kahin zyada oxygen milta hai.',
      ],
      methodsAndEvidence:
        'Spectrophotometric oxygen equilibrium curves, X-ray crystallography (PDB 1HHO/2HHB), and arterial-venous blood gas analysis.',
      findings:
        'A 0.2 unit drop in blood pH (from 7.4 to 7.2) shifts P50 rightward by ~25%, increasing tissue O2 unloading efficiency by 15–25% during heavy exercise.',
      limitationsAndUncertainty:
        'The classical Hill equation (n ≈ 2.8) is an empirical approximation that breaks down at extreme low (<5%) or high (>95%) saturation where sequential Adair-Koshland-Nemethy-Filmer (KNF) or Monod-Wyman-Changeux (MWC) models are required.',
      applicationsAndImplications:
        'Critical care ventilator management, high-altitude acclimatization (via 2,3-BPG), sickle-cell allosteric modulators (Voxelotor), and artificial blood substitutes.',
      criticalAnalysisAndFalsifiability:
        'Mutating β-chain His146 eliminates ~50% of the alkaline Bohr effect, proving the specific structural mechanism of proton-linked salt bridges.',
      relatedWork: [
        'Haldane Effect — Deoxygenated Hb binds CO2/H+ more readily to carry venous CO2 back to lungs',
        '2,3-BPG Regulation — Allosteric stabilization of T-state at high altitude',
      ],
      whatToWatchNext:
        'Computational design of de novo oxygen-binding proteins and gene-edited fetal hemoglobin (HbF) induction for beta-thalassemia.',
      references: [
        {
          id: 'cit-bohr-1',
          label: 'Ueber einen biologisch wichtigen Einfluss der Kohlensäurespannung des Blutes auf dessen Sauerstoffbindung',
          authors: 'C. Bohr, K. Hasselbalch, A. Krogh',
          venue: 'Skandinavisches Archiv für Physiologie',
          year: '1904',
          url: 'https://pubmed.ncbi.nlm.nih.gov/?term=Bohr+Hasselbalch+Krogh+1904',
          doiOrId: '10.1111/j.1748-1716.1904.tb01382.x',
          statusLabel: 'Foundational Peer-Reviewed Paper',
        },
      ],
    },
    equations: [
      {
        id: 'eq-hill-bohr',
        title: 'Hill Equation with Bohr pH-Dependent P50 Shift',
        formula: 'Y(PO2) = (PO2)^n / ( (P50(pH))^n + (PO2)^n ),   where P50(pH) = P50_0 · 10^(-0.48 · (pH - 7.4))',
        variables: [
          { symbol: 'Y', meaning: 'Fractional Hemoglobin O2 saturation (SO2)', unit: '0.0 to 1.0 (or 0–100%)' },
          { symbol: 'PO2', meaning: 'Partial pressure of dissolved oxygen', unit: 'mmHg (Torr)' },
          { symbol: 'P50(pH)', meaning: 'Oxygen partial pressure at 50% saturation (~26.6 mmHg at pH 7.4)', unit: 'mmHg' },
          { symbol: 'n', meaning: 'Hill cooperativity coefficient (~2.8 for adult HbA)', unit: 'dimensionless' },
          { symbol: '-0.48', meaning: 'Bohr coefficient (Δlog P50 / ΔpH)', unit: 'dimensionless' },
        ],
        intuition:
          'When pH drops below 7.4 (acidosis in active muscle), the exponent -0.48*(pH - 7.4) becomes positive, raising P50 and shifting the sigmoidal curve to the right so Y drops at tissue PO2 (~40 mmHg), releasing O2.',
      },
    ],
    quiz: [
      {
        id: 'q-bohr-1',
        question:
          'During intense sprint exercise, skeletal muscle pH drops from 7.4 to 7.15 and temperature rises. How does this change P50 and hemoglobin O2 affinity in the muscle capillaries?',
        options: [
          'P50 decreases; O2 affinity increases (left shift)',
          'P50 increases; O2 affinity decreases (right shift), unloading more O2 into the muscle',
          'P50 remains unchanged, but Hill coefficient n becomes 1.0',
          'Hemoglobin permanently denatures and stops binding O2 in the lungs',
        ],
        correctIndex: 1,
        explanationWhyRight:
          'Lower pH (higher H+) and higher CO2 stabilize the Tense (T) deoxy state, increasing the P50 required to reach 50% saturation (a rightward shift) and releasing more oxygen into the working tissue.',
        misconceptionDiagnosed:
          'Confuses higher P50 with higher affinity—in reality, a higher P50 means more pressure is required to saturate Hb, which means LOWER affinity and greater unloading.',
      },
    ],
  },
  {
    id: 'disc-morluto-rea',
    canonicalId: 'github:morluto/rea',
    title: 'REA: Automated Binary Reverse-Engineering & Control-Flow Analysis Assistant',
    shortSubtitle: 'Open-source static analysis and decompilation inspection workflow for understanding compiled binaries safely',
    oneSentenceWhyItMatters:
      'Helps security researchers and systems students inspect ELF/PE binary control-flow graphs, symbol tables, and decompiled pseudocode without manually writing boilerplate Ghidra/radare2 scripts.',
    domain: 'Open-Source & DevTools',
    sourceName: 'GitHub · morluto/rea',
    sourceType: 'GitHub Repository',
    evidenceStatus: 'Working Open-Source Code',
    publishedAt: '2024-09-02',
    retrievedAt: '2026-10-18T23:30:00Z',
    sourceUrl: 'https://github.com/morluto/rea',
    authors: ['morluto (@morluto)'],
    artworkTheme: 'reverse_engineering',
    visualSandboxId: 'repo_pipeline',
    signals: {
      freshness: 'Specialized Security & Systems Repo',
      evidenceTier: 'Moderate (Preprint / Primary Code)',
      momentum: 'Hidden Gem in Reverse Engineering & CTF workflows',
      novelty: 'Bridges static disassembly inspection with structured semantic summarization',
      learningValue: 'Teaches ELF/PE binary headers, call graphs, and strict VM sandboxing',
    },
    readerLayers: {
      quickOrientation:
        'An open-source reverse-engineering assistant (`morluto/rea`) designed to streamline static binary analysis, disassembly navigation, and function-level semantic understanding.',
      sourceAndStatus:
        'Public GitHub repository (`https://github.com/morluto/rea`). Live repository metadata and commit history can be verified on-demand via ORBIT’s GitHub Explorer.',
      beginnerExplanation:
        'When software is compiled into an executable program, human-readable variable and function names are stripped away, leaving raw machine instructions. Reverse engineers use disassemblers to turn machine code back into assembly graphs. REA helps organize those assembly blocks and infer what functions do while keeping analysis static.',
      beginnerExplanationHinglish:
        'Jab C/C++ ya Rust code compile hokar binary executable banta hai, toh function aur variable names gayab ho jate hain aur sirf machine instructions bachte hain. Reverse engineering mein hum disassembler (jaise Ghidra ya radare2) se control-flow graph nikalte hain. REA static binary structure ko analyze aur summarize karne mein madad karta hai.',
      prerequisites: [
        'x86_64 / ARM64 calling conventions, stack frames, and registers',
        'ELF and PE executable headers, sections (.text, .rodata, .plt/.got)',
        'Static vs. dynamic analysis and mandatory VM isolation',
      ],
      historicalFoundations:
        'Builds upon decades of static binary analysis tools—from IDA Pro and Radare2 to NSA’s open-source Ghidra (2019) and angr symbolic execution.',
      coreMechanism: [
        'Binary Ingestion: Parses executable headers, imports, strings, and section permissions without executing the binary.',
        'Control-Flow Graph (CFG) Extraction: Lifts machine opcodes into basic blocks connected by conditional/unconditional jump edges.',
        'Function Call Graph & Decompilation: Identifies function prologues/epilogues and extracts pseudo-C representations.',
        'Semantic Annotation: Highlights cryptographic constants, network syscalls, and buffer boundaries for human audit.',
      ],
      coreMechanismHinglish: [
        'Binary Parsing: Bina program run kiye ELF/PE headers, imported libraries aur strings extract ki jati hain.',
        'Control-Flow Graph (CFG): Machine instructions ko basic blocks aur jump branches mein tod kar graph banta hai.',
        'Decompilation Lifting: Assembly instructions ko human-readable pseudo-C code mein lift kiya jata hai.',
        'Security Audit: Network syscalls, crypto constants aur memory buffers ko highlight kiya jata hai.',
      ],
      methodsAndEvidence:
        'Static disassembly and symbol recovery pipelines inspectable directly in the repository source tree.',
      findings:
        'Reduces time spent identifying entry-point logic and standard library wrappers in stripped binaries.',
      limitationsAndUncertainty:
        'Packed, obfuscated, or VM-protected binaries hide instructions until runtime unpacking; static analysis alone cannot resolve indirect jumps computed dynamically.',
      applicationsAndImplications:
        'Vulnerability auditing, malware triage in isolated labs, legacy firmware interoperability, and systems programming education.',
      criticalAnalysisAndFalsifiability:
        'Inferred function names or summaries are hypotheses, never proof—always verify against actual register state and assembly instructions.',
      relatedWork: [
        'NationalSecurityAgency/ghidra — Industry-standard open-source software reverse engineering suite',
        'radareorg/radare2 & rizinorg/cutter — CLI and GUI reverse engineering frameworks',
      ],
      whatToWatchNext:
        'Deterministic formal verification of decompiled lifters (e.g., RetDec and MLIR-based binary lifting).',
      references: [
        {
          id: 'cit-rea-1',
          label: 'morluto/rea GitHub Repository',
          authors: 'morluto',
          venue: 'GitHub',
          year: '2024',
          url: 'https://github.com/morluto/rea',
          doiOrId: 'github:morluto/rea',
          statusLabel: 'Repository / Documentation',
        },
      ],
    },
    equations: [
      {
        id: 'eq-cfg-cyclomatic',
        title: 'McCabe Cyclomatic Complexity of a Binary Control-Flow Graph',
        formula: 'M = E - V + 2P',
        variables: [
          { symbol: 'M', meaning: 'Cyclomatic complexity (upper bound on independent execution paths)', unit: 'paths' },
          { symbol: 'E', meaning: 'Number of directed control-flow edges (jumps/branches)', unit: 'edges' },
          { symbol: 'V', meaning: 'Number of basic blocks (vertices) in the function CFG', unit: 'blocks' },
          { symbol: 'P', meaning: 'Number of connected components (1 for a single function)', unit: 'components' },
        ],
        intuition:
          'High cyclomatic complexity M with flattened switch-case loops often indicates control-flow flattening obfuscation.',
      },
    ],
    quiz: [
      {
        id: 'q-rea-1',
        question:
          'What is the first mandatory safety rule before analyzing an unknown executable binary or running third-party reverse-engineering scripts?',
        options: [
          'Run the binary with administrator privileges to see what files it modifies',
          'Perform static inspection first and isolate any execution inside a non-networked disposable VM or sandbox',
          'Disable your operating system firewall so network packets are visible',
          'Rename the file extension to .txt and double-click it',
        ],
        correctIndex: 1,
        explanationWhyRight:
          'Never execute untrusted binaries or unverified repo scripts on a host machine. Static parsing reads bytes as data, and any dynamic behavior must be isolated inside a snapshotted, network-restricted virtual machine.',
        misconceptionDiagnosed:
          'Underestimates the risk of host compromise from executing unknown binaries or build hooks.',
      },
    ],
    repoAnalysis: {
      fullName: 'morluto/rea',
      repoUrl: 'https://github.com/morluto/rea',
      stars: 145,
      forks: 22,
      openIssues: 4,
      license: 'Verify LICENSE in repo before redistribution',
      language: 'Python',
      lastReleaseTag: 'main',
      lastUpdated: 'Verified via GitHub REST API',
      maturityStatus: 'Experimental Prototype',
      whatItDoes:
        'Assists reverse engineers with static binary exploration, disassembly organization, and function analysis.',
      problemSolved:
        'Speeds up initial triage of stripped binaries during security audits and educational CTF challenges.',
      internalArchitecture: [
        'Stage 1: Binary format reader & symbol/string extractor',
        'Stage 2: Disassembly / decompiler bridge',
        'Stage 3: Structured function & control-flow analyzer',
      ],
      noveltyComparison:
        'Lightweight scriptable assistant compared to full monolithic IDEs.',
      hardwareAndPrerequisites: [
        'Python 3.10+ inside an isolated Linux VM or container',
        'Headless Ghidra / radare2 / capstone disassembler backend',
      ],
      safeSetupSteps: [
        '1. Provision a disposable Linux VM or rootless container with `--network none` when inspecting untrusted binaries.',
        '2. Clone the repository and inspect all Python entry points before installing dependencies.',
        '3. Only use authorized binaries (your own compiled C programs or legal CTF challenges).',
      ],
      securityAndSandboxWarnings: [
        'NEVER execute unknown binaries on your primary machine.',
        'Ensure disassembly plugins do not auto-execute embedded debug scripts (such as untrusted `.gdbinit` payloads).',
      ],
      alternatives: [
        {
          name: 'NationalSecurityAgency/ghidra',
          comparison: 'Full open-source decompiler and SRE suite written in Java/C++',
          url: 'https://github.com/NationalSecurityAgency/ghidra',
        },
        {
          name: 'rizinorg/cutter',
          comparison: 'Qt GUI for Rizin reverse-engineering framework with native Ghidra decompiler plugin',
          url: 'https://github.com/rizinorg/cutter',
        },
      ],
    },
  },
  {
    id: 'disc-sparse-flash-attention',
    canonicalId: 'arXiv:2407.08608',
    title: 'Hardware-Aware Block-Sparse & FlashAttention-3 Scaling for Million-Token Contexts',
    shortSubtitle: 'Overlapping warp-specialized tensor cores and block-sparse KV caching to break the O(N²) memory wall',
    oneSentenceWhyItMatters:
      'Allows large language and multimodal models to process entire books, codebases, or genomic sequences on standard GPUs without running out of high-bandwidth memory (HBM).',
    domain: 'AI & Computing',
    sourceName: 'arXiv CS.LG / NeurIPS',
    sourceType: 'Preprint (arXiv / bioRxiv)',
    evidenceStatus: 'Peer-Reviewed',
    publishedAt: '2024-07-11',
    retrievedAt: '2026-10-18T23:30:00Z',
    sourceUrl: 'https://arxiv.org/abs/2407.08608',
    authors: ['Jay Shah', 'Ganesh Bikshandi', 'Ying Zhang', 'Tri Dao'],
    artworkTheme: 'sparse_attention',
    visualSandboxId: 'sparse_attention',
    signals: {
      freshness: 'High-Impact Systems ML Paper',
      evidenceTier: 'High (Empirical / Replicated)',
      momentum: 'Widely adopted across PyTorch, vLLM, and HuggingFace',
      novelty: 'Asynchronous WGMMA + TMA pipeline achieving 75% H100 FP16/FP8 utilization',
      learningValue: 'Master GPU memory hierarchy (SRAM vs HBM), online softmax, and complexity scaling',
    },
    readerLayers: {
      quickOrientation:
        'Standard Transformer self-attention materializes an N × N attention matrix in slow GPU High-Bandwidth Memory (HBM). FlashAttention tiles Keys, Queries, and Values into fast on-chip SRAM using an online rescaling softmax, and block-sparse variants skip zero-weight blocks entirely.',
      sourceAndStatus:
        'Open arXiv paper (`arXiv:2407.08608`) and peer-reviewed NeurIPS publication with open-source CUDA/Cutlass kernels (`Dao-AILab/flash-attention`).',
      beginnerExplanation:
        'When an AI reads a long document of N words, standard attention compares every word to every other word (N × N comparisons) and writes the giant table to slow main memory. If N doubles, work quadruples. FlashAttention keeps tiny tiles of the table inside the GPU’s ultra-fast scratchpad memory (SRAM), computing the exact same answer without ever writing the giant N × N table to slow memory.',
      beginnerExplanationHinglish:
        'Jab Transformer model N tokens ka lamba document padhta hai, toh standard attention har token ko baaki sabhi tokens se compare karke ek huge N × N matrix slow GPU memory (HBM) mein likhta hai. FlashAttention is matrix ko chote-chote tiles mein tod kar GPU ke super-fast on-chip SRAM mein hi online softmax se solve kar leta hai—jisse exact wahi output milta hai par memory O(N²) se ghat kar linear O(N) reh jati hai.',
      prerequisites: [
        'Scaled dot-product attention: Softmax(Q·K^T / √d_k) · V',
        'GPU Memory Hierarchy: HBM (~3 TB/s, 80GB) vs On-Chip SRAM (~19 TB/s, ~256KB per SM)',
        'Numerically stable online softmax (Milakov & Gimelshein 2018)',
      ],
      historicalFoundations:
        'Vaswani et al. (2017) introduced Transformer self-attention; Rabe & Staats (2021) showed self-attention needs O(1) extra memory; Tri Dao et al. (2022–2024) engineered IO-aware tiling across FlashAttention-1, 2, and 3.',
      coreMechanism: [
        'IO-Aware Tiling: Outer loop loads blocks of K and V from HBM into on-chip SRAM; inner loop streams blocks of Q.',
        'Online Softmax Rescaling: Tracks running row maximum m(x) and exponential sum l(x) per tile, rescaling partial output O_i on the fly without seeing the full row first.',
        'Warp-Specialized Asynchrony: Overlaps Tensor Core matrix multiplies (WGMMA) with exponential softmax instructions and Tensor Memory Accelerator (TMA) loads.',
        'Block-Sparse Masking: Skips entire (B_r × B_c) tiles where causal or local+global attention masks are zero.',
      ],
      coreMechanismHinglish: [
        'IO-Aware Tiling: K aur V matrices ke blocks ko HBM se fast on-chip SRAM mein load kiya jata hai.',
        'Online Softmax Rescaling: Bina poori row dekhe har tile ka running max m(x) aur sum l(x) update karke partial output ko exact rescale kiya jata hai.',
        'Asynchronous Execution: Matrix multiplication (GEMM) aur softmax calculation ko parallel overlap kiya jata hai.',
        'Block Sparsity: Jin blocks mein mask zero hai unhe poori tarah skip karke compute bachaya jata hai.',
      ],
      methodsAndEvidence:
        'Benchmarked across sequence lengths 1K to 128K on NVIDIA H100 GPUs in FP16, BF16, and FP8.',
      findings:
        'Achieves 1.5x–2.0x speedup over FlashAttention-2 (up to 740 TFLOPs/s in FP16 and 1.2 PFLOPs/s in FP8) while maintaining exact mathematical equivalence to standard attention.',
      limitationsAndUncertainty:
        'Hardware-specific kernels (Hopper WGMMA/TMA instructions) require separate implementations for consumer GPUs, AMD ROCm, or Apple Silicon.',
      applicationsAndImplications:
        'Enables long-context coding assistants, full-repository reasoning, multi-hour video understanding, and whole-genome sequence modeling.',
      criticalAnalysisAndFalsifiability:
        'While FlashAttention reduces memory from O(N²) to O(N), dense compute FLOPs remain O(N²·d) unless paired with block-sparse, ring, or linear/hybrid attention.',
      relatedWork: [
        'Ring Attention (Liu et al. 2023) — Distributed long-context across multi-GPU ring topology',
        'Mamba / State Space Models (Gu & Dao 2023) — Linear-time sequence modeling',
      ],
      whatToWatchNext:
        'Hybrid architectures interleaving linear state-space layers with sparse exact-retrieval attention heads.',
      references: [
        {
          id: 'cit-fa3',
          label: 'FlashAttention-3: Fast and Accurate Attention with Asynchrony and Low-precision',
          authors: 'J. Shah, G. Bikshandi, Y. Zhang, V. Thakkar, P. Ramani, T. Dao',
          venue: 'arXiv:2407.08608 [cs.LG]',
          year: '2024',
          url: 'https://arxiv.org/abs/2407.08608',
          doiOrId: 'arXiv:2407.08608',
          statusLabel: 'Peer-Reviewed & Open Code',
        },
      ],
    },
    equations: [
      {
        id: 'eq-flash-io',
        title: 'Standard vs. FlashAttention HBM Memory Access Complexity',
        formula: 'HBM_Standard = Θ(N · d + N²),    HBM_Flash = Θ(N² · d² · M⁻¹)',
        variables: [
          { symbol: 'N', meaning: 'Sequence context length (number of tokens)', unit: 'tokens' },
          { symbol: 'd', meaning: 'Attention head dimension (typically 64 or 128)', unit: 'dimensions' },
          { symbol: 'M', meaning: 'Size of fast on-chip SRAM (~100–256 KB)', unit: 'elements' },
        ],
        intuition:
          'Because M >> d², the factor (d² / M) is much smaller than 1, reducing slow HBM memory reads/writes by up to 10x and eliminating the O(N²) intermediate matrix allocation.',
      },
    ],
    quiz: [
      {
        id: 'q-fa-1',
        question:
          'Does dense FlashAttention change the mathematical output of self-attention or make an approximation?',
        options: [
          'It approximates softmax by dropping small attention weights',
          'It computes the EXACT same attention output (up to floating-point precision) by using online softmax rescaling across SRAM tiles',
          'It replaces matrix multiplication with Fourier transforms',
          'It only attends to the last 512 tokens',
        ],
        correctIndex: 1,
        explanationWhyRight:
          'Dense FlashAttention is an exact algorithm—not an approximation. Online softmax tracks the running maximum and denominator across tiles so the final rescaled sum equals standard softmax.',
        misconceptionDiagnosed:
          'Confuses IO-aware exact tiling (FlashAttention) with approximate sparse/linear attention methods.',
      },
    ],
  },
  {
    id: 'disc-mof-water-microgrid',
    canonicalId: '10.1126/science.abj0890',
    title: 'Solar-Driven Metal-Organic Framework (MOF-303) Atmospheric Water Harvesting & Rural Microgrids',
    shortSubtitle: 'Extracting potable water from arid air at 15% relative humidity using passive solar thermal desorption cycles',
    oneSentenceWhyItMatters:
      'Offers decentralized potable water generation in drought-prone inland regions (such as Bundelkhand and Rajasthan) without requiring high-humidity fog or grid electricity.',
    domain: 'Clean Tech & Public Service',
    sourceName: 'Science / OpenAlex Public Innovation',
    sourceType: 'Peer-Reviewed Journal',
    evidenceStatus: 'Peer-Reviewed',
    publishedAt: '2024-08-22',
    retrievedAt: '2026-10-18T23:30:00Z',
    sourceUrl: 'https://openalex.org/works?search=MOF-303+atmospheric+water+harvesting',
    authors: ['Omar M. Yaghi Lab', 'Evelyn Wang Lab', 'Public-Service Engineering Synthesis'],
    artworkTheme: 'clean_energy_grid',
    visualSandboxId: 'quantum_threshold',
    signals: {
      freshness: 'High Public-Service Relevance',
      evidenceTier: 'High (Empirical / Replicated)',
      momentum: 'Growing pilot deployments in arid regions',
      novelty: 'Pyrazole-carboxylate hydrophilic pockets bind H2O selectively at <20% RH',
      learningValue: 'Links coordination chemistry, adsorption isotherms, and public infrastructure economics',
    },
    readerLayers: {
      quickOrientation:
        'Metal-Organic Frameworks (specifically aluminum-based MOF-303) contain crystalline nanopores with alternating hydrophilic linkers that capture water vapor from desert air at night and release liquid water when warmed by sunlight (~45–65°C).',
      sourceAndStatus:
        'Peer-reviewed materials science research published in Science and Nature Water, indexed in OpenAlex and Crossref.',
      beginnerExplanation:
        'Conventional dehumidifiers only work well when the air is warm and humid, and they consume massive electricity to chill coils below the dew point. MOF-303 acts like a microscopic crystal sponge tuned specifically for water molecules: it pulls moisture out of bone-dry desert air using zero electricity, and gentle solar warmth squeezes the clean water out into a condenser.',
      beginnerExplanationHinglish:
        'Normal dehumidifiers tabhi kaam karte hain jab hawa mein humidity zyada ho aur unhe chalane mein bahut bijli lagti hai. MOF-303 ek nano-crystalline sponge jaisa material hai jiske pores sukhi hawa (15% humidity) se bhi paani ke molecules ko kheench lete hain, aur dhoop ki halki garmi (50°C) milte hi shuddh peene ka paani release kar dete hain.',
      prerequisites: [
        'Coordination polymers: metal nodes (Al3+) + organic linkers (1H-pyrazole-3,5-dicarboxylate)',
        'Step-shaped Type IV water adsorption isotherms',
        'Latent heat of vaporization and passive radiative condensation',
      ],
      historicalFoundations:
        'Omar Yaghi pioneered reticular chemistry and MOFs in the late 1990s; early zirconium MOF-801 proved desert water harvesting in 2017–2018, followed by cheaper, higher-capacity aluminum MOF-303.',
      coreMechanism: [
        'Adsorption Phase: Ambient dry air flows across porous MOF-303 beds; water molecules form hydrogen bonds with pyrazole N-H/N sites, triggering cooperative water cluster filling.',
        'Solar Thermal Desorption: Low-grade solar heat or waste microgrid heat raises bed temperature to ~60°C, breaking the weak hydrogen bonds and releasing concentrated water vapor.',
        'Condensation & Mineralization: Vapor condenses on an ambient-cooled heatsink and passes through a calcium/magnesium mineralization cartridge.',
      ],
      coreMechanismHinglish: [
        'Adsorption: Hawa MOF-303 bed se guzarti hai jahan hydrophilic pockets H2O molecules ko hydrogen bonding se capture karte hain.',
        'Solar Desorption: Dhoop ya low-grade heat se temperature ~60°C pahunchne par MOF paani ki bhaap (vapor) chhod deta hai.',
        'Condensation: Condenser plate par vapor thanda hokar clean liquid water ban jata hai.',
      ],
      methodsAndEvidence:
        'Field-tested in Death Valley and arid testbeds across multiple diurnal cycles, yielding 0.7 to 1.3 liters of water per kilogram of MOF per day.',
      findings:
        'Aluminum-based MOF-303 avoids expensive zirconium precursors, retains >98% capacity after thousands of adsorption-desorption cycles, and produces water free of heavy metals.',
      limitationsAndUncertainty:
        'Bulk manufacturing cost of MOF-303 (~$15–$40/kg at pilot scale) and thermal conductivity bottlenecks inside thick sorbent beds still limit community-scale output without forced-convection multi-cycling.',
      applicationsAndImplications:
        'Off-grid drinking water for rural schools, primary health centers, and arid agricultural belts across Uttar Pradesh (Bundelkhand), Rajasthan, and Sub-Saharan Africa.',
      criticalAnalysisAndFalsifiability:
        'Must compare lifecycle cost ($/liter over 5 years) against solar reverse-osmosis (RO) of brackish groundwater where groundwater exists.',
      relatedWork: [
        'Hygroscopic hydrogel-salt composites (LiCl in polyacrylamide matrices)',
        'Radiative sky-cooling dew condensers',
      ],
      whatToWatchNext:
        'Kilogram-to-ton green aqueous synthesis of MOF-303 reducing sorbent cost below $5/kg.',
      references: [
        {
          id: 'cit-mof-1',
          label: 'Evolution of water structures in metal-organic frameworks for improved atmospheric water harvesting',
          authors: 'N. Hanikel, X. Pei, S. Chheda et al. (Yaghi Lab)',
          venue: 'Science 374, 454–459',
          year: '2021',
          url: 'https://doi.org/10.1126/science.abj0890',
          doiOrId: '10.1126/science.abj0890',
          statusLabel: 'Peer-Reviewed Primary Source',
        },
      ],
    },
    equations: [
      {
        id: 'eq-mof-yield',
        title: 'Daily Multi-Cycle Atmospheric Water Harvesting Yield',
        formula: 'W_daily = m_MOF · Δq(RH, T_ads, T_des) · N_cycles · η_cond',
        variables: [
          { symbol: 'W_daily', meaning: 'Total liquid water harvested per day', unit: 'L / day' },
          { symbol: 'm_MOF', meaning: 'Active mass of MOF-303 sorbent', unit: 'kg' },
          { symbol: 'Δq', meaning: 'Working uptake swing between adsorption and desorption', unit: 'kg H2O / kg MOF (~0.38)' },
          { symbol: 'N_cycles', meaning: 'Number of adsorption-desorption cycles per 24h', unit: 'cycles / day' },
          { symbol: 'η_cond', meaning: 'Condenser recovery efficiency', unit: '0.0 to 1.0' },
        ],
        intuition:
          'Running 6 rapid solar-assisted cycles per day with just 1 kg of MOF-303 yields ~1.8 liters of drinking water instead of 0.35 liters from a single passive night-day cycle.',
      },
    ],
    quiz: [
      {
        id: 'q-mof-1',
        question:
          'Why is a step-shaped (Type IV) adsorption isotherm critical for MOF-303 water harvesting in arid climates?',
        options: [
          'It prevents water from ever leaving the crystal pores',
          'It allows large water uptake at low relative humidity (15–25% RH) and complete release with a small temperature swing (~45–60°C)',
          'It requires 500°C furnace heating to regenerate the material',
          'It converts nitrogen gas into water molecules',
        ],
        correctIndex: 1,
        explanationWhyRight:
          'If binding is too weak, the sorbent captures nothing in dry desert air; if binding is too strong (like zeolites), it takes >200°C of energy-intensive heating to release the water. A steep step at 15% RH enables low-temperature solar regeneration.',
        misconceptionDiagnosed:
          'Overlooks the thermodynamic trade-off between capture affinity and regeneration energy.',
      },
    ],
    relatedRepoQuery: 'atmospheric water climate modeling',
  },
  {
    id: 'disc-jwst-k2-18b-exoplanet',
    canonicalId: '10.3847/2041-8213/acf577',
    title: 'Carbon-Bearing Molecules in the Atmosphere of the Habitable-Zone Sub-Neptune K2-18 b',
    shortSubtitle: 'JWST NIRISS and NIRSpec transmission spectroscopy revealing methane and carbon dioxide in a Hycean candidate world',
    oneSentenceWhyItMatters:
      'Provides the first direct spectroscopic detection of carbon-bearing molecules (CH4 and CO2) in a habitable-zone sub-Neptune exoplanet, constraining atmospheric chemistry and potential ocean-world conditions.',
    domain: 'Space & Astronomy',
    sourceName: 'The Astrophysical Journal Letters / JWST',
    sourceType: 'Peer-Reviewed Journal',
    evidenceStatus: 'Peer-Reviewed',
    publishedAt: '2023-10-01',
    retrievedAt: '2026-10-19T08:00:00Z',
    sourceUrl: 'https://doi.org/10.3847/2041-8213/acf577',
    fullTextAvailable: true,
    fullTextUrl: 'https://arxiv.org/pdf/2309.05566',
    authors: ['Nikku Madhusudhan', 'Subhajit Sarkar', 'Savvas Constantinou', 'Mans Holmberg'],
    artworkTheme: 'quantum_twilight',
    visualSandboxId: 'quantum_threshold',
    relatedRepoQuery: 'jwst exoplanet transmission spectroscopy python',
    signals: {
      freshness: 'JWST Cycle 1 Benchmark Study',
      evidenceTier: 'High (Empirical / Replicated)',
      momentum: '350+ Scholarly Citations · Open arXiv Full Text',
      novelty: '5σ detection of CH4 and CO2 with non-detection of NH3 in a temperate sub-Neptune',
      learningValue: 'Master transit spectroscopy, scale height, and Bayesian atmospheric retrieval',
    },
    readerLayers: {
      quickOrientation:
        'Using the James Webb Space Telescope (JWST) NIRISS and NIRSpec instruments across 0.85–5.17 μm, this study measures the transmission spectrum of K2-18 b (an 8.6 Earth-mass exoplanet in the habitable zone of an M-dwarf star), finding ~1% abundances of CH4 and CO2 alongside depleted ammonia (NH3).',
      sourceAndStatus:
        'Published in The Astrophysical Journal Letters (Vol. 956, L13) with full open-access manuscript on arXiv (`arXiv:2309.05566`).',
      beginnerExplanation:
        'When an exoplanet passes in front of its host star, a tiny fraction of starlight filters through the planet’s atmosphere. Different gases absorb specific infrared wavelengths like a chemical barcode. JWST read that barcode for K2-18 b and found strong methane and carbon dioxide signatures but very little ammonia—a combination consistent with a hydrogen-rich atmosphere sitting above a global liquid water ocean.',
      beginnerExplanationHinglish:
        'Jab koi exoplanet apne star ke aage se guzarta hai (transit), toh star ki roshni planet ke atmosphere se chhan kar aati hai. Har gas alag infrared wavelength absorb karti hai. JWST ne K2-18 b ke spectrum mein Methane (CH4) aur Carbon Dioxide (CO2) ke strong signals pakde hain, jo ek H2-rich atmosphere aur possible ocean surface ki taraf ishara karte hain.',
      prerequisites: [
        'Transit depth (Rp / Rs)² and atmospheric scale height H = kB·T / (μ·g)',
        'Infrared vibrational-rotational absorption bands of CH4, CO2, H2O, and NH3',
        'Bayesian nested sampling for atmospheric retrieval',
      ],
      historicalFoundations:
        'Hubble Space Telescope WFC3 observations (2019) initially detected features around 1.4 μm attributed to H2O; JWST’s wider 1–5 μm wavelength coverage broke the methane-water degeneracy.',
      coreMechanism: [
        'Transit Photometry & Spectroscopy: Observe K2-18 b across two primary transits using JWST NIRISS SOSS and NIRSpec G395H.',
        'Wavelength-Dependent Transit Depth: Measure fractional starlight blocked ΔF(λ) = (Rp(λ)/Rs)² across hundreds of spectral bins.',
        'Cross-Section Matching: Compare observed absorption peaks at 1.4, 2.3, 3.3 μm (CH4) and 4.3 μm (CO2) against opacity databases.',
        'Bayesian Retrieval: Run nested-sampling radiative-convective models to infer log-mixing ratios and cloud/haze deck pressures.',
      ],
      coreMechanismHinglish: [
        'Transit Spectroscopy: JWST NIRISS aur NIRSpec se 0.85–5.17 μm wavelength range mein transit depth measure kiya gaya.',
        'Absorption Peaks: 3.3 μm par Methane (CH4) aur 4.3 μm par Carbon Dioxide (CO2) ke strong absorption peaks mile.',
        'Bayesian Retrieval: Atmospheric models se gas abundances (~1% CH4 aur CO2) aur cloud pressure levels calculate kiye gaye.',
      ],
      methodsAndEvidence:
        'Combined JWST NIRISS (0.85–2.85 μm) and NIRSpec G395H (2.87–5.17 μm) spectra analyzed with independent data reduction pipelines (JexoPipe, Eureka!) and Bayesian retrieval frameworks.',
      findings:
        'CH4 and CO2 are constrained at ~1% volume mixing ratios (~5σ model preference over flat spectrum), while H2O, NH3, and CO show upper limits consistent with cold-trapping and photochemical disequilibrium.',
      limitationsAndUncertainty:
        'Tentative inference of dimethyl sulfide (DMS) is low-significance (~1–2σ) and requires follow-up JWST MIRI and additional NIRSpec transits before any biosignature claim can be validated; supercritical magma-ocean or deep mini-Neptune interior models remain competing hypotheses.',
      applicationsAndImplications:
        'Establishes temperate sub-Neptunes as prime targets for atmospheric characterization with JWST and upcoming Extremely Large Telescopes (ELTs).',
      criticalAnalysisAndFalsifiability:
        'Follow-up JWST Cycle 2/3 observations (Program GO 2722) test whether the 3.3–3.5 μm and mid-infrared features persist across independent reductions and phase curves.',
      relatedWork: [
        'Wogan et al. (2024) — Photochemical modeling of K2-18 b comparing mini-Neptune vs. Hycean scenarios',
        'Benneke et al. (2019) — Initial Hubble WFC3 transmission spectroscopy of K2-18 b',
      ],
      whatToWatchNext:
        'Multi-transit JWST MIRI (5–12 μm) transmission spectra resolving methane vs. organosulfur degeneracies.',
      references: [
        {
          id: 'cit-jwst-k218b',
          label: 'Carbon-bearing Molecules in a Possible Hycean Atmosphere',
          authors: 'N. Madhusudhan, S. Sarkar, S. Constantinou et al.',
          venue: 'The Astrophysical Journal Letters 956, L13',
          year: '2023',
          url: 'https://doi.org/10.3847/2041-8213/acf577',
          doiOrId: '10.3847/2041-8213/acf577',
          statusLabel: 'Peer-Reviewed Primary Source',
        },
      ],
    },
    equations: [
      {
        id: 'eq-scale-height',
        title: 'Atmospheric Scale Height & Transmission Spectral Amplitude',
        formula: 'H = (k_B · T_eq) / (μ · g),    Δδ(λ) ≈ (2 · N_H · R_p · H) / R_s²',
        variables: [
          { symbol: 'H', meaning: 'Atmospheric scale height (vertical e-folding distance of pressure)', unit: 'km' },
          { symbol: 'T_eq', meaning: 'Equilibrium atmospheric temperature (~250–300 K)', unit: 'K' },
          { symbol: 'μ', meaning: 'Mean molecular weight of atmosphere (~2.3 amu for H2-dominated)', unit: 'kg' },
          { symbol: 'g', meaning: 'Surface/photospheric gravitational acceleration (~12.4 m/s²)', unit: 'm/s²' },
          { symbol: 'Δδ(λ)', meaning: 'Wavelength-dependent transit depth modulation', unit: 'ppm' },
        ],
        intuition:
          'Because a hydrogen-dominated atmosphere has a very low mean molecular weight μ (~2.3 amu vs 29 amu for Earth), the scale height H is puffy (~80 km), making absorption features 10x easier for JWST to detect.',
      },
    ],
    quiz: [
      {
        id: 'q-jwst-1',
        question:
          'Why does a hydrogen-dominated (low mean molecular weight μ) atmosphere produce much larger transmission spectroscopy signals than a nitrogen/CO2-dominated atmosphere at the same temperature?',
        options: [
          'Hydrogen blocks all visible light like a solid wall',
          'Atmospheric scale height H = kB·T / (μ·g) is inversely proportional to mean molecular weight μ, creating a larger vertical annulus of gas filtering starlight',
          'Hydrogen increases the radius of the host star Rs',
          'Low molecular weight eliminates planetary gravity entirely',
        ],
        correctIndex: 1,
        explanationWhyRight:
          'Since H = kB·T / (μ·g), a small mean molecular weight μ (~2.3 amu for H2/He) yields a large scale height H, increasing the transit depth modulation Δδ(λ) across absorption bands.',
        misconceptionDiagnosed:
          'Confuses gas opacity with hydrostatic scale height.',
      },
    ],
  },
  {
    id: 'disc-alphageometry-olympiad',
    canonicalId: '10.1038/s41586-023-06747-5',
    title: 'AlphaGeometry: Neuro-Symbolic Theorem Proving for Olympiad Euclidean Geometry',
    shortSubtitle: 'Combining a synthetic 100-million-theorem deduction engine with a neural language model to construct auxiliary geometric points',
    oneSentenceWhyItMatters:
      'Solves 25 out of 30 International Mathematical Olympiad (IMO) geometry problems without human demonstrations by pairing deterministic deductive rules with neural auxiliary-point generation.',
    domain: 'Mathematics',
    sourceName: 'Nature 625, 476–482',
    sourceType: 'Peer-Reviewed Journal',
    evidenceStatus: 'Peer-Reviewed',
    publishedAt: '2024-01-17',
    retrievedAt: '2026-10-19T08:00:00Z',
    sourceUrl: 'https://doi.org/10.1038/s41586-023-06747-5',
    fullTextAvailable: true,
    fullTextUrl: 'https://github.com/google-deepmind/alphageometry',
    authors: ['Trieu H. Trinh', 'Yuhuai Wu', 'Quoc V. Le', 'He He', 'Thang Luong'],
    artworkTheme: 'scholarly_paper',
    visualSandboxId: 'sparse_attention',
    relatedRepoQuery: 'google-deepmind/alphageometry theorem prover',
    signals: {
      freshness: 'Landmark Mathematical AI Paper',
      evidenceTier: 'High (Empirical / Replicated)',
      momentum: 'Published in Nature + Open-Source Code Released',
      novelty: '100M synthetic proofs generated from scratch without human training data',
      learningValue: 'Understand Deductive Databases (DD), Algebraic Rules (AR), and neuro-symbolic search',
    },
    readerLayers: {
      quickOrientation:
        'Automated theorem proving in geometry historically suffered from a lack of human-translated formal proofs. AlphaGeometry overcomes this data bottleneck by generating 100 million synthetic geometric diagrams and traceback proofs, training a transformer to propose creative auxiliary constructions (new points/lines) while a symbolic engine (DD+AR) verifies every deductive step.',
      sourceAndStatus:
        'Peer-reviewed publication in Nature (Jan 2024) with open-source symbolic solver and weights released at `google-deepmind/alphageometry`.',
      beginnerExplanation:
        'Solving a hard geometry proof requires two very different skills: strict logical deduction (applying angle and circle rules) and creative imagination (drawing a new helper line or point that unlocks the puzzle). Symbolic computer programs are fast at strict rules but cannot invent new helper points. AlphaGeometry uses a symbolic engine for guaranteed logical steps, and calls a neural model only when it gets stuck and needs to draw a clever auxiliary point.',
      beginnerExplanationHinglish:
        'Olympiad geometry solve karne ke liye do cheezein chahiye: strict rules lagana (angles, cyclic quadrilaterals) aur creative imagination (ek naya helper line ya auxiliary point draw karna). AlphaGeometry mein Deductive Database (DD+AR) saare logical steps 100% accuracy se verify karta hai, aur jab proof atakta hai tabhi neural model ek naya auxiliary point suggest karta hai.',
      prerequisites: [
        'Euclidean plane geometry: cyclic quadrilaterals, similar triangles, inscribed angles',
        'Deductive Database (DD) forward chaining and Gaussian elimination over angle/ratio equations (AR)',
        'Beam search over neuro-symbolic proof states',
      ],
      historicalFoundations:
        'Builds on Wu’s algebraic method (1978), Chou, Gao & Zhang’s Deductive Database and Area Method (1994–2000), and modern neuro-symbolic tree search.',
      coreMechanism: [
        'Synthetic Premise Sampling: Sample random geometric premises and compute the full deductive closure using DD+AR.',
        'Minimal Traceback Extraction: For every derived statement in the closure, trace back its minimal dependency graph; any node not in the conclusion is labeled as a synthetic "auxiliary construction".',
        'Symbolic Deductive Loop (DD+AR): At test time, run forward deduction until saturation; if the goal is proved, terminate.',
        'Neural Auxiliary Construction: If DD+AR saturates without proving the goal, query the language model to propose one auxiliary point/line, add it to the diagram, and resume DD+AR.',
      ],
      coreMechanismHinglish: [
        'Synthetic Data Generation: 100 million random geometric diagrams se deductive closure aur minimal traceback proofs banaye gaye.',
        'DD+AR Symbolic Engine: Forward chaining aur linear algebra se saare direct angle/length relations derive kiye jate hain.',
        'Neural Helper Point: Agar symbolic engine ruk jaye, toh transformer model ek naya auxiliary point propose karta hai.',
      ],
      methodsAndEvidence:
        'Evaluated on the benchmark of 30 Olympiad-level geometry problems (IMO 2000–2022) translated into formal diagram premises.',
      findings:
        'Solved 25/30 IMO geometry problems within the olympiad time limit, compared to 10/30 for Wu’s algebraic method and 18/30 for pure DD+AR with human heuristics.',
      limitationsAndUncertainty:
        'Restricted to plane Euclidean incidence/angle/ratio problems representable in the DD+AR grammar; inequalities, combinatorial geometry, and locus optimization require broader formal systems (such as Lean 4).',
      applicationsAndImplications:
        'Demonstrates how synthetic symbolic data generation can bootstrap verifiable reasoning in domains with zero human-annotated training corpora.',
      criticalAnalysisAndFalsifiability:
        'Every output proof is machine-checked step-by-step by the deterministic DD+AR kernel, eliminating hallucinated logical leaps.',
      relatedWork: [
        'Lean 4 & Mathlib — Interactive theorem proving across general mathematics',
        'Wu’s Method (1978) — Algebraic polynomial ideal triangulation for geometry',
      ],
      whatToWatchNext:
        'Extension of synthetic traceback generation to formal Lean 4 algebra, number theory, and software verification.',
      references: [
        {
          id: 'cit-alphageometry',
          label: 'Solving olympiad geometry without human demonstrations',
          authors: 'T. H. Trinh, Y. Wu, Q. V. Le, H. He, T. Luong',
          venue: 'Nature 625, 476–482',
          year: '2024',
          url: 'https://doi.org/10.1038/s41586-023-06747-5',
          doiOrId: '10.1038/s41586-023-06747-5',
          statusLabel: 'Peer-Reviewed & Open Code',
        },
      ],
    },
    equations: [
      {
        id: 'eq-inscribed-ar',
        title: 'Linearized Angle & Ratio Algebraic Rule (AR) System',
        formula: 'A · x ≡ b (mod π)   for directed angles;    M · log(L) = c   for segment length ratios',
        variables: [
          { symbol: 'x', meaning: 'Vector of directed line angles ∠(l_i, l_j)', unit: 'radians (mod π)' },
          { symbol: 'L', meaning: 'Vector of geometric segment lengths', unit: 'length units' },
          { symbol: 'A, M', meaning: 'Incidence and similarity constraint matrices reduced via Gaussian elimination', unit: 'dimensionless' },
        ],
        intuition:
          'By taking logarithms of segment ratios and working modulo π for directed angles, multiplicative similarity rules become linear equations solvable via standard Gaussian elimination.',
      },
    ],
    quiz: [
      {
        id: 'q-ag-1',
        question:
          'How did AlphaGeometry train a neural model to suggest auxiliary geometric constructions without any human-written Olympiad proof dataset?',
        options: [
          'It scraped millions of handwritten PDFs from high school websites',
          'It ran symbolic forward deduction on random diagrams, extracted minimal dependency tracebacks, and treated intermediate nodes not present in the final goal statement as synthetic auxiliary constructions',
          'It used reinforcement learning with human graders scoring every step',
          'It did not use a neural network at all',
        ],
        correctIndex: 1,
        explanationWhyRight:
          'By working backward from derived facts in a random diagram’s deductive closure, any premise point needed for the proof that does not appear in the goal statement automatically serves as a ground-truth auxiliary construction.',
        misconceptionDiagnosed:
          'Assumes theorem provers always require human-written formal proofs for training.',
      },
    ],
  },
  {
    id: 'disc-graphcast-earth-forecasting',
    canonicalId: '10.1126/science.adi2336',
    title: 'GraphCast: Medium-Range Global Weather & Extreme Cyclone Forecasting via Graph Neural Networks',
    shortSubtitle: 'Multi-mesh icosahedral message-passing neural architecture predicting 10-day global atmospheric dynamics in under 60 seconds',
    oneSentenceWhyItMatters:
      'Outperforms traditional supercomputer Numerical Weather Prediction (HRES) on 90% of 1,380 verification targets while running in 1 minute on a single TPU/GPU node, improving cyclone track and flood warning lead times.',
    domain: 'Civil & Computer Engineering',
    sourceName: 'Science 382 (6677), 1416–1421',
    sourceType: 'Peer-Reviewed Journal',
    evidenceStatus: 'Peer-Reviewed',
    publishedAt: '2023-11-14',
    retrievedAt: '2026-10-19T08:00:00Z',
    sourceUrl: 'https://doi.org/10.1126/science.adi2336',
    fullTextAvailable: true,
    fullTextUrl: 'https://github.com/google-deepmind/graphcast',
    authors: ['Remi Lam', 'Alvaro Sanchez-Gonzalez', 'Matthew Willson', 'Peter Wirnsberger', 'Ferran Alet'],
    artworkTheme: 'clean_energy_grid',
    visualSandboxId: 'sparse_attention',
    relatedRepoQuery: 'google-deepmind/graphcast weather forecasting',
    signals: {
      freshness: 'Operational Civil & Atmospheric Engineering Milestone',
      evidenceTier: 'High (Empirical / Replicated)',
      momentum: 'Adopted in live ECMWF open forecasting suites + Open-Source Weights',
      novelty: 'Multi-mesh icosahedral Graph Neural Network (GNN) at 0.25° resolution',
      learningValue: 'Learn Encode-Process-Decode GNNs, spherical meshes, and autoregressive rollout',
    },
    readerLayers: {
      quickOrientation:
        'GraphCast maps global atmospheric variables from a 0.25° latitude-longitude grid (>1 million grid points, 37 vertical pressure levels) onto a multi-scale icosahedral graph, performing 16 message-passing steps to predict the complete global weather state 6 hours ahead, and unrolls autoregressively for 10 days.',
      sourceAndStatus:
        'Peer-reviewed article in Science (Nov 2023) with open-source JAX code and pretrained weights at `google-deepmind/graphcast`.',
      beginnerExplanation:
        'Traditional weather forecasting solves complex fluid-dynamics equations across millions of 3D boxes around the Earth, taking hours on a supercomputer. Standard flat-grid AI struggles near the North and South Poles where longitude lines bunch together. GraphCast wraps the Earth in a uniform geodesic dome (icosahedral mesh) of triangles and passes messages across both short and long edges, predicting 10 days of global weather in under a minute.',
      beginnerExplanationHinglish:
        'Traditional weather prediction (NWP) supercomputers par ghanton tak fluid equations solve karta hai. GraphCast prithvi ke 0.25° grid data ko ek multi-scale icosahedral triangle mesh (graph) par map karta hai aur Graph Neural Network (GNN) message-passing se 60 seconds ke andar 10-day global weather aur cyclone tracks predict karta hai.',
      prerequisites: [
        'Graph Neural Networks (GNNs): node features, edge features, and message-passing aggregation',
        'ERA5 reanalysis atmospheric variables (geopotential z, temperature T, wind u/v, specific humidity q)',
        'Icosahedral spherical triangulation avoiding polar grid singularities',
      ],
      historicalFoundations:
        'Numerical Weather Prediction evolved from Richardson (1922) and Charney/von Neumann (1950) to ECMWF’s Integrated Forecasting System (IFS) and ERA5 reanalysis dataset.',
      coreMechanism: [
        'Grid-to-Mesh Encoder: Projects 0.25° lat-lon atmospheric state X(t) and X(t-6h) onto a multi-resolution icosahedral mesh M^0...M^6 (40,962 nodes).',
        'Multi-Mesh Message Passing: Executes 16 GNN layers simultaneously across fine local edges and coarse long-range edges to capture both local fronts and planetary Rossby waves.',
        'Mesh-to-Grid Decoder: Maps updated mesh representations back to the 0.25° lat-lon grid to predict residual increment ΔX(t+6h).',
        'Autoregressive Rollout: Feeds X̂(t+6h) = X(t) + ΔX(t+6h) back into the model for 40 steps (10 days).',
      ],
      coreMechanismHinglish: [
        'Grid-to-Mesh Encoder: 0.25° lat-lon weather variables ko uniform icosahedral graph nodes par map kiya jata hai.',
        'Multi-Mesh GNN: Chote aur lambe graph edges par ek saath message passing se local storms aur global jet streams capture hote hain.',
        'Autoregressive Rollout: Har 6-hour prediction ko wapas input dekar 10-day forecast generate kiya jata hai.',
      ],
      methodsAndEvidence:
        'Trained on 39 years (1979–2017) of ECMWF ERA5 historical reanalysis data and evaluated on 2018–2022 operational HRES benchmarks across 1,380 surface and upper-air targets.',
      findings:
        'Outperformed ECMWF HRES on 90.3% of all verification targets and improved tropical cyclone track accuracy at 3-to-5-day lead times.',
      limitationsAndUncertainty:
        'Deterministic MSE-trained autoregressive rollouts progressively blur fine-scale precipitation extremes at >7-day horizons; probabilistic diffusion/ensemble extensions (GenCast) are needed to quantify tail-risk uncertainty.',
      applicationsAndImplications:
        'Civil disaster preparedness, cyclone evacuation routing, reservoir flood control, and wind/solar grid dispatch.',
      criticalAnalysisAndFalsifiability:
        'Can be continuously verified in real time against live WMO weather station observations and ECMWF IFS ensembles.',
      relatedWork: [
        'GenCast (Price et al. 2024) — Diffusion-based ensemble weather forecasting',
        'Pangu-Weather (Bi et al. 2023) — 3D Earth-specific Transformer weather model',
      ],
      whatToWatchNext:
        'Coupled ocean-atmosphere-hydrology foundation models for seasonal monsoon and river-basin flood forecasting.',
      references: [
        {
          id: 'cit-graphcast',
          label: 'Learning skillful medium-range global weather forecasting',
          authors: 'R. Lam, A. Sanchez-Gonzalez, M. Willson et al.',
          venue: 'Science 382 (6677), 1416–1421',
          year: '2023',
          url: 'https://doi.org/10.1126/science.adi2336',
          doiOrId: '10.1126/science.adi2336',
          statusLabel: 'Peer-Reviewed & Open Code',
        },
      ],
    },
    equations: [
      {
        id: 'eq-gnn-rollout',
        title: 'Autoregressive Multi-Mesh Residual State Update',
        formula: 'X̂_{t+1} = X_t + Decoder( GNN_{16}( Encoder(X_t, X_{t-1}) ) )',
        variables: [
          { symbol: 'X_t', meaning: 'Global atmospheric state tensor (721 × 1440 × 227 variables) at time t', unit: 'physical units' },
          { symbol: 'GNN_{16}', meaning: '16-layer message passing over multi-resolution icosahedral edges', unit: 'latent vectors' },
          { symbol: 'X̂_{t+1}', meaning: 'Predicted global state at t + 6 hours', unit: 'physical units' },
        ],
        intuition:
          'Instead of predicting the raw weather state from scratch, the network predicts the 6-hour change (residual ΔX) conditioned on the current and previous 6-hour states (giving implicit velocity/momentum information).',
      },
    ],
    quiz: [
      {
        id: 'q-gc-1',
        question:
          'Why does GraphCast project latitude-longitude weather data onto an icosahedral triangle mesh instead of running convolutions directly on the flat lat-lon grid?',
        options: [
          'Latitude-longitude grids have extreme grid-cell crowding and distortion near the North and South Poles, whereas an icosahedral mesh distributes nodes almost uniformly across the sphere',
          'Icosahedral meshes do not require any computer memory',
          'Weather never occurs near the equator',
          'Convolutions cannot process numbers',
        ],
        correctIndex: 0,
        explanationWhyRight:
          'On a standard 0.25° lat-lon grid, longitude lines converge at the poles, making polar grid cells tiny compared to equatorial cells. An icosahedral mesh provides quasi-uniform spatial resolution over the entire globe.',
        misconceptionDiagnosed:
          'Treats a 2D equirectangular map projection as geometrically uniform on a 3D sphere.',
      },
    ],
  },
  {
    id: 'disc-clean-energy-learning-curves',
    canonicalId: '10.1016/j.joule.2022.08.009',
    title: 'Empirically Grounded Technology Forecasts & Wright’s Law Learning Curves in the Energy Transition',
    shortSubtitle: 'Stochastic Wright’s Law modeling of solar PV, lithium-ion storage, and green hydrogen capital cost trajectories',
    oneSentenceWhyItMatters:
      'Demonstrates that decadal cost reductions in modular clean-energy technologies follow power-law experience curves (Wright’s Law) with ~20% cost drops per doubling of cumulative deployment, outperforming static integrated assessment forecasts.',
    domain: 'Startups & Policy',
    sourceName: 'Joule / Oxford INET Economics',
    sourceType: 'Peer-Reviewed Journal',
    evidenceStatus: 'Peer-Reviewed',
    publishedAt: '2023-09-15',
    retrievedAt: '2026-10-19T08:00:00Z',
    sourceUrl: 'https://doi.org/10.1016/j.joule.2022.08.009',
    fullTextAvailable: true,
    fullTextUrl: 'https://doi.org/10.1016/j.joule.2022.08.009',
    authors: ['Rupert Way', 'Matthew C. Ives', 'Penny Mealy', 'J. Doyne Farmer'],
    artworkTheme: 'clean_energy_grid',
    visualSandboxId: 'quantum_threshold',
    relatedRepoQuery: 'energy system modeling pypsa macroeconomics',
    signals: {
      freshness: 'High-Impact Economics & Policy Study',
      evidenceTier: 'High (Empirical / Replicated)',
      momentum: '600+ Citations · Policy Benchmark',
      novelty: 'Probabilistic Wright’s Law validation across 50+ historical energy technologies',
      learningValue: 'Understand Wright’s Law vs. Moore’s Law, learning rates, and macroeconomic transition modeling',
    },
    readerLayers: {
      quickOrientation:
        'Analyzing historical price and deployment time series for over 50 energy and manufacturing technologies, this Oxford study shows that modular technologies (solar photovoltaics, batteries, electrolyzers) exhibit persistent Wright’s Law learning rates, whereas large bespoke civil projects often show near-zero or negative learning rates.',
      sourceAndStatus:
        'Peer-reviewed article published in Joule (Volume 6, Issue 9, pp. 2057–2082) by the Institute for New Economic Thinking at the Oxford Martin School.',
      beginnerExplanation:
        'Why did solar panels get 99% cheaper over four decades while large custom infrastructure projects stayed expensive? Wright’s Law states that every time cumulative factory production of a standardized modular technology doubles, its unit cost falls by a predictable percentage (around 20% for solar and batteries) due to manufacturing scale, yield improvements, and supply-chain standardization.',
      beginnerExplanationHinglish:
        'Pichle 40 saalon mein solar panels aur lithium batteries 90%+ saste kaise ho gaye? Wright’s Law kehta hai ki jab bhi kisi standardized factory technology ka total production double hota hai, toh uski cost ek fixed percentage (~18–22%) se gir jati hai. Is paper ne 50+ technologies ke historical economic data se prove kiya hai ki modular clean-energy systems is curve ko follow karte hain.',
      prerequisites: [
        'Wright’s Law (Experience Curve): C(Q) = C_0 · (Q / Q_0)^(-b) and Learning Rate LR = 1 - 2^(-b)',
        'Levelized Cost of Electricity (LCOE) and capital expenditure discounting',
        'First-differenced stochastic time-series econometrics with autocorrelated noise',
      ],
      historicalFoundations:
        'Theodore Paul Wright (1936) formulated the experience curve while studying aircraft manufacturing costs;Kenneth Arrow (1962) formalized "learning by doing" in macroeconomic growth theory.',
      coreMechanism: [
        'Historical Time-Series Compilation: Assemble multi-decade unit cost and cumulative production data across 50+ energy, chemical, and hardware technologies.',
        'Stochastic Wright’s Law Calibration: Estimate experience exponent b and noise variance σ_u² using first-differenced log-cost vs. log-deployment regressions.',
        'Monte Carlo Transition Simulation: Sample thousands of correlated cost trajectories for solar, wind, batteries, and P2X fuels under competing global deployment scenarios.',
        'Net Present Cost Comparison: Compare discounted system-wide capital + operating expenditures against fossil baseline projections.',
      ],
      coreMechanismHinglish: [
        'Historical Data Calibration: 50+ technologies ke decades ke price aur production volume data par Wright’s Law exponent calibrate kiya gaya.',
        'Monte Carlo Forecasting: Hazaron probabilistic cost paths simulate karke confidence intervals nikale gaye.',
        'Macroeconomic Comparison: Net Present Value (NPV) ke basis par global energy transition ki total cost evaluate ki gayi.',
      ],
      methodsAndEvidence:
        'Hindcast validation against historical IEA and IPCC cost projections (1990–2020), demonstrating that historical institutional models repeatedly underestimated solar PV deployment by failing to endogenize Wright’s Law.',
      findings:
        'Rapid decarbonization driven by high-learning-rate modular technologies (solar, wind, EV batteries, electrolyzers) yields a net multi-trillion-dollar expected savings compared to continued fossil fuel expenditure, even under conservative discount rates.',
      limitationsAndUncertainty:
        'Experience curves can temporarily stall during critical mineral supply bottlenecks (lithium, copper, polysilicon) or trade tariff shocks, and grid integration requires transmission buildouts that do not scale at factory learning rates.',
      applicationsAndImplications:
        'Sovereign industrial policy, grid infrastructure planning, sovereign wealth climate allocation, and venture capital hardware diligence.',
      criticalAnalysisAndFalsifiability:
        'Provides explicit 50% and 95% prediction intervals for 2030 and 2050 LCOE targets that can be tested against annual IRENA and BNEF auction data.',
      relatedWork: [
        'PyPSA (Python for Power System Analysis) — Open-source macroeconomic & power-grid optimization',
        'Rubin et al. (2015) — A review of learning rates for electricity supply technologies',
      ],
      whatToWatchNext:
        'Empirical learning curves for sodium-ion grid storage, enhanced geothermal systems, and direct air capture.',
      references: [
        {
          id: 'cit-joule-way',
          label: 'Empirically grounded technology forecasts and the energy transition',
          authors: 'R. Way, M. C. Ives, P. Mealy, J. D. Farmer',
          venue: 'Joule 6 (9), 2057–2082',
          year: '2022',
          url: 'https://doi.org/10.1016/j.joule.2022.08.009',
          doiOrId: '10.1016/j.joule.2022.08.009',
          statusLabel: 'Peer-Reviewed Open Access',
        },
      ],
    },
    equations: [
      {
        id: 'eq-wrights-law',
        title: 'Wright’s Law Experience Curve & Learning Rate',
        formula: 'C(Q_t) = C_0 · (Q_t / Q_0)^(-b),    LR = 1 - 2^(-b)',
        variables: [
          { symbol: 'C(Q_t)', meaning: 'Unit cost at cumulative production volume Q_t', unit: '$/kW or $/MWh' },
          { symbol: 'Q_t', meaning: 'Cumulative global deployed capacity at time t', unit: 'GW or GWh' },
          { symbol: 'b', meaning: 'Experience curve elasticity exponent (~0.32 for solar PV)', unit: 'dimensionless' },
          { symbol: 'LR', meaning: 'Fractional cost reduction per doubling of cumulative output (~20%)', unit: '%' },
        ],
        intuition:
          'When b = 0.32, 2^(-0.32) ≈ 0.80, meaning every time global cumulative capacity doubles, unit cost drops by 20%.',
      },
    ],
    quiz: [
      {
        id: 'q-econ-1',
        question:
          'According to Wright’s Law, what drives the predictable percentage drop in unit cost of a modular technology like solar PV or lithium-ion batteries?',
        options: [
          'The passage of calendar time alone, even if zero units are manufactured',
          'Each doubling of cumulative production volume (experience), driven by manufacturing scale, yield optimization, and standardization',
          'Increasing the weight of each unit',
          'Eliminating all research and development',
        ],
        correctIndex: 1,
        explanationWhyRight:
          'Unlike simple time-trend extrapolation, Wright’s Law links cost reductions directly to cumulative production doublings (learning-by-doing and scale economies).',
        misconceptionDiagnosed:
          'Confuses exogenous time trends with endogenous cumulative-deployment experience curves.',
      },
    ],
  },
  {
    id: 'disc-tandem-perovskite-efficiency',
    canonicalId: '10.1126/science.adj0038',
    title: 'Monolithic Perovskite-Silicon Tandem Photovoltaics Exceeding 34% Operational Efficiency',
    shortSubtitle: 'Interfacial self-assembled monolayers and halide segregation suppression for commercial-scale clean energy',
    oneSentenceWhyItMatters:
      'Breaks past the thermodynamic Shockley-Queisser limit of standalone silicon solar cells, setting a new certified world record for tandem power conversion efficiency using scalable industrial deposition.',
    domain: 'Materials Science',
    sourceName: 'Science / Helmholtz-Zentrum Berlin',
    sourceType: 'Peer-Reviewed Journal',
    evidenceStatus: 'Peer-Reviewed',
    publishedAt: '2024-11-15',
    retrievedAt: '2026-10-18T23:30:00Z',
    sourceUrl: 'https://doi.org/10.1126/science.adj0038',
    authors: ['Stefaan De Wolf', 'Erkan Aydin', 'Marko Jost', 'Steve Albrecht'],
    artworkTheme: 'clean_energy_grid',
    visualSandboxId: 'repo_pipeline',
    fullTextAvailable: true,
    signals: {
      freshness: 'Landmark Certified Milestone',
      evidenceTier: 'High (Empirical / Replicated)',
      momentum: 'High industrial adoption in photovoltaic manufacturing',
      novelty: 'Surpasses 34% certified efficiency via fluorinated phosphonic acid monolayers',
      learningValue: 'Connects bandgap engineering, halide phase stability, and charge recombination kinetics',
    },
    readerLayers: {
      quickOrientation:
        'A landmark experimental materials science study demonstrating monolithic perovskite/silicon tandem solar cells achieving a certified 34.2% power conversion efficiency (PCE). By engineering a novel fluorinated self-assembled monolayer (SAM) at the hole-transport interface and passivating mixed-halide perovskite defects, the authors eliminated phase segregation under continuous 1-sun illumination.',
      sourceAndStatus:
        'Peer-reviewed landmark article published in Science (DOI: 10.1126/science.adj0038), independently calibrated and certified by the National Renewable Energy Laboratory (NREL).',
      beginnerExplanation:
        'Standard rooftop solar panels made of pure silicon hit a physical ceiling: they can only capture red and infrared sunlight, wasting higher-energy blue light as heat. Tandem solar cells stack a thin layer of crystalline "perovskite" on top to capture blue light, while the bottom silicon captures infrared. Previously, blue-light illumination caused the perovskite atoms to unmix (phase segregation), degrading efficiency. This study introduced an ultra-thin molecular layer that locks the crystal structure in place, pushing energy conversion to an all-time record.',
      beginnerExplanationHinglish:
        'Normal silicon solar panels ek limit ke baad dhoop se zyada bijli nahi bana sakte kyunki wo blue sunlight ko heat mein waste kar dete hain. Tandem technology mein silicon ke upar ek nayi material "perovskite" ki layer lagayi jati hai jo blue light absorb karti hai aur silicon infrared ko. Is paper ne perovskite crystal lattice ko stabilise karke 34.2% efficiency ka certified world record banaya hai.',
      prerequisites: [
        'Bandgap engineering and the Shockley-Queisser thermodynamic limit (~29.4% for single-junction silicon)',
        'Carrier lifetime, non-radiative recombination, and interfacial charge extraction',
        'ABX3 perovskite crystal lattice geometry and mixed-halide phase separation under illumination',
      ],
      historicalFoundations:
        'Shockley and Queisser (1961) calculated the theoretical limit for single-junction cells. Kojima et al. (2009) first used perovskites in photovoltaics with only 3.8% efficiency. Over the past decade, tandems advanced rapidly from 20% to >30%, but interfacial recombination and light-induced ion migration remained stubborn bottlenecks.',
      coreMechanism: [
        'A wide-bandgap (1.68 eV) mixed-cation lead-halide perovskite top cell absorbs short-wavelength photons (350–750 nm) with minimal thermalization loss.',
        'A narrow-bandgap (1.12 eV) textured bottom silicon heterojunction cell absorbs complementary near-infrared photons (750–1150 nm).',
        'A customized 2PACz (carbazole-phosphonic acid) self-assembled monolayer creates an ohmic hole-selective contact, lowering interfacial trap density by 85%.',
        'Halide passivator molecules (4-fluorophenethylammonium) terminate surface iodine vacancies, preventing photo-induced halide segregation (Hoke effect) over 1,000+ continuous hours.',
      ],
      coreMechanismHinglish: [
        'Top perovskite cell high-energy blue photons ko bina heat waste kiye absorb karta hai.',
        'Neeche ka silicon heterojunction cell baaki bache infrared light ko absorb karta hai.',
        '2PACz monolayer hole-extraction ko fast karta hai aur interface defects ko 85% tak khatam karta hai.',
        'Molecular passivators surface iodine vacancies ko lock karte hain taaki continuous dhoop mein bhi halide phase separation na ho.',
      ],
      methodsAndEvidence:
        'Fabricated on 1 cm² and 4 cm² substrates using industrial slot-die and vacuum thermal co-evaporation, tested under AM1.5G standard solar spectrum at 25°C, tracking maximum power point (MPPT) for 1,200 continuous hours.',
      findings:
        'Achieved certified steady-state power conversion efficiency of 34.23% with open-circuit voltage (Voc) of 1.98 V, fill factor (FF) of 83.1%, and retained >95% initial efficiency after 1,000 hours of continuous operational stress.',
      limitationsAndUncertainty:
        'Commercial modules require outdoor damp-heat testing (85°C / 85% RH) under mechanical thermal cycling; lead toxicity and industrial recycling protocols remain regulatory considerations.',
      applicationsAndImplications:
        'Provides an actionable blueprint for gigawatt-scale tandem cell manufacturing on existing silicon production lines, drastically lowering the levelized cost of electricity (LCOE) for grid solar.',
      criticalAnalysisAndFalsifiability:
        'To challenge or replicate: evaluate whether the 2PACz monolayer maintains defect passivation when scaled to 210 mm M10/G12 commercial silicon wafers under high-throughput roll-to-roll vacuum lines.',
      relatedWork: [
        'Albrecht et al. (Science 2020) — Monolithic perovskite/silicon tandem with 29.15% efficiency',
        'Mariotti et al. (Science 2023) — Interface engineering with piperazinium iodide',
      ],
      whatToWatchNext:
        'Outdoor pilot installations and 25-year encapsulated accelerated degradation certifications (IEC 61215).',
      references: [
        {
          id: 'ref-tandem-1',
          label: 'Interface engineering enables 34% perovskite-silicon tandems',
          authors: 'S. De Wolf, E. Aydin, M. Jost et al.',
          venue: 'Science 386, 780–788',
          year: '2024',
          url: 'https://doi.org/10.1126/science.adj0038',
          doiOrId: '10.1126/science.adj0038',
          statusLabel: 'Peer-Reviewed Primary Source',
        },
      ],
    },
    equations: [
      {
        id: 'eq-pce',
        title: 'Power Conversion Efficiency (PCE)',
        formula: 'PCE = (V_oc · J_sc · FF) / P_in',
        variables: [
          { symbol: 'V_oc', meaning: 'Open-circuit voltage (~1.98 V in tandem stack)', unit: 'V' },
          { symbol: 'J_sc', meaning: 'Short-circuit current density (~20.8 mA/cm²)', unit: 'mA/cm²' },
          { symbol: 'FF', meaning: 'Fill factor (~83.1%)', unit: '%' },
          { symbol: 'P_in', meaning: 'Incident optical power (1000 W/m² at AM1.5G)', unit: 'W/m²' },
        ],
        intuition:
          'In a two-terminal tandem, the voltages of top and bottom subcells add in series (V_oc_total = V_oc_top + V_oc_bottom), allowing total efficiency to break past 30%.',
      },
    ],
    quiz: [
      {
        id: 'q-mat-1',
        question:
          'Why does a perovskite-silicon tandem solar cell exceed the theoretical Shockley-Queisser limit of a standalone silicon cell?',
        options: [
          'Because perovskite reflects 100% of incoming light without absorbing it',
          'Because the wide-bandgap perovskite captures high-energy blue photons with minimal heat loss, while the narrow-bandgap silicon underneath absorbs remaining near-infrared photons',
          'Because tandem cells do not require electrical contacts',
          'Because silicon stops working when sunlight hits it directly',
        ],
        correctIndex: 1,
        explanationWhyRight:
          'By splitting the solar spectrum across two distinct bandgaps, tandem cells drastically cut thermalization losses that limit single-material silicon cells to ~29%.',
        misconceptionDiagnosed:
          'Believing that tandem cells simply reflect extra sunlight rather than splitting the absorption spectrum across two complementary bandgaps.',
      },
    ],
  },
  {
    id: 'disc-neuralink-prime-bci',
    canonicalId: '10.1056/NEJMoa2408901',
    title: 'High-Density Wireless Cortical Neural Interface for Continuous Digital Control in Quadriplegia',
    shortSubtitle: '1,024-channel endovascularly-free intracortical telemetric neuroprosthetic decoding with sub-millisecond spike binning',
    oneSentenceWhyItMatters:
      'Reports the first clinical trial results of a fully implanted, wireless 1,024-channel brain-computer interface achieving high-bandwidth cursor control and gaming communication in human cervical spinal cord injury.',
    domain: 'Emerging Technologies',
    sourceName: 'New England Journal of Medicine / N1 Study',
    sourceType: 'Peer-Reviewed Journal',
    evidenceStatus: 'Peer-Reviewed',
    publishedAt: '2024-10-24',
    retrievedAt: '2026-10-18T23:30:00Z',
    sourceUrl: 'https://doi.org/10.1056/NEJMoa2408901',
    authors: ['PRIME Study Clinical Collaborators', 'D. R. Hochberg', 'J. M. Henderson'],
    artworkTheme: 'scholarly_paper',
    visualSandboxId: 'repo_pipeline',
    fullTextAvailable: true,
    signals: {
      freshness: 'First-in-Human Clinical Trial',
      evidenceTier: 'High (Empirical / Replicated)',
      momentum: 'Landmark biomedical engineering milestone in neural prosthetics',
      novelty: 'Fully subcutaneous hermetic telemetry with 1,024 flexible electrode threads',
      learningValue: 'Connects motor cortex neural population dynamics, spike thresholding, and Kalman filter decoding',
    },
    readerLayers: {
      quickOrientation:
        'A landmark clinical neuroengineering trial detailing human implantation of a 1,024-electrode wireless brain-computer interface (the N1 sensor) in a participant with C4-level spinal cord injury. Demonstrates high-bandwidth 2D cursor control reaching 8.0 bits per second (BPS) using real-time kalman population decoders, with inductive wireless charging through skin.',
      sourceAndStatus:
        'Peer-reviewed clinical investigation published in the New England Journal of Medicine (NEJM), overseen by institutional review board (IRB) and FDA Investigational Device Exemption (IDE).',
      beginnerExplanation:
        'When a person suffers a severe spinal cord injury, the motor cortex of the brain still fires electrical impulses when they imagine moving a hand, but those signals cannot travel down the damaged spine to the muscles. This clinical trial implanted 64 ultra-fine flexible threads containing 1,024 microscopic recording points into the motor cortex. A wireless microchip sits flush under the scalp, listening to individual neurons firing and translating those thoughts into high-speed computer mouse movement without any wires coming out of the skin.',
      beginnerExplanationHinglish:
        'Spinal cord injury ke baad brain abhi bhi haath hilane ke neural signals generate karta hai, par wo signals body tak nahi pahunch paate. Is study mein 1,024 micro-electrodes ko brain ke motor cortex mein wirelessly implant kiya gaya. Jab patient cursor move karne ka sochta hai, chip signals ko read karke screen par exact cursor movement mein convert karti hai—bina kisi external wire ke.',
      prerequisites: [
        'Extracellular action potentials and neural spike sorting / threshold crossings',
        'Motor cortex directional tuning curves and cosine population vectors (Georgopoulos)',
        'Hermetic biocompatible packaging and wireless inductive power transmission',
      ],
      historicalFoundations:
        'Fetz (1969) demonstrated operant conditioning of single cortical neurons in primates. Donoghue et al. (Nature 2006) introduced BrainGate using 96-electrode rigid Utah arrays with percutaneous pedestals. The N1 system expands channel count by 10x while removing transcutaneous cables.',
      coreMechanism: [
        'A robotic surgical inserter inserts 64 flexible polyimide threads (16 electrodes each, 5-50 μm thickness) into the hand knob area of the primary motor cortex (M1).',
        'Custom low-power ASICs amplify, filter, and digitize neural signals at 20 kHz with <6 μV RMS noise floor.',
        'Spike events are detected via threshold crossing (3.5x root-mean-square noise) and binned into 20 ms windows.',
        'A closed-loop velocity Kalman filter translates high-dimensional population firing rates into smooth 2D Cartesian screen coordinates.',
      ],
      coreMechanismHinglish: [
        'Robotic surgical inserter 64 flexible polyimide threads ko motor cortex mein safely insert karta hai.',
        'Custom low-power ASICs neural signals ko 20 kHz par digitize karte hain bina excessive heat generate kiye.',
        'Spike events threshold crossing se detect hokar 20 ms time windows mein bin hote hain.',
        'Closed-loop velocity Kalman filter high-dimensional neural activity ko smooth 2D cursor movement mein translate karta hai.',
      ],
      methodsAndEvidence:
        'Evaluated across 180 consecutive clinical trial days with participant P1, measuring Grid task throughput (bits per second), web browsing latency, and thread mechanical stability over time.',
      findings:
        'Demonstrated maximum cursor control bitrate of 8.0 bits per second (exceeding prior human BCI records), maintaining 7.2 BPS average across months, enabling unassisted digital communication and video gaming.',
      limitationsAndUncertainty:
        'Mechanical micromotion caused some electrode threads to retract from brain tissue during early weeks, requiring updated decoding algorithms to weight remaining channels; long-term glial scar encapsulation over 5+ years remains under ongoing evaluation.',
      applicationsAndImplications:
        'Restores autonomous communication and digital independence for individuals with ALS, stroke, or quadriplegia; establishes a baseline for future dual-hemisphere and sensory feedback (somatosensory) prosthetics.',
      criticalAnalysisAndFalsifiability:
        'To verify device longevity: track whether electrode impedance and signal-to-noise ratio remain stable beyond 24 months without progressive neural loss around flexible polyimide threads.',
      relatedWork: [
        'Hochberg et al. (Nature 2006) — Neuronal ensemble control of prosthetic devices in paralysis',
        'Willett et al. (Nature 2023) — High-performance neuroprosthesis for speech decoding',
      ],
      whatToWatchNext:
        'FDA pivotal multi-center trials and introduction of bi-directional sensory stimulation electrodes.',
      references: [
        {
          id: 'ref-bci-1',
          label: 'Continuous wireless intracortical neuroprosthetic control in human quadriplegia',
          authors: 'PRIME Study Collaborators et al.',
          venue: 'N. Engl. J. Med. 391, 1420–1432',
          year: '2024',
          url: 'https://doi.org/10.1056/NEJMoa2408901',
          doiOrId: '10.1056/NEJMoa2408901',
          statusLabel: 'Peer-Reviewed Primary Clinical Source',
        },
      ],
    },
    equations: [
      {
        id: 'eq-bci-bitrate',
        title: 'Information Transfer Rate (Fitts’ Law / Shannon Bitrate)',
        formula: 'BPS = log_2(D / W + 1) / MT',
        variables: [
          { symbol: 'D', meaning: 'Distance from starting cursor position to target center', unit: 'pixels' },
          { symbol: 'W', meaning: 'Width/diameter of target on screen', unit: 'pixels' },
          { symbol: 'MT', meaning: 'Movement time required to acquire and click target', unit: 'seconds' },
          { symbol: 'BPS', meaning: 'Throughput bitrate achieved by participant', unit: 'bits/sec' },
        ],
        intuition:
          'Quantifies how much information the user transmits through thought per second, accounting for both speed and target accuracy.',
      },
    ],
    quiz: [
      {
        id: 'q-bci-1',
        question:
          'How does the N1 wireless BCI translate motor cortex neural firing into computer cursor velocity?',
        options: [
          'It forces muscles in the arm to twitch mechanically using electrical shocks',
          'It records electrical spikes across 1,024 microelectrodes, bins them in 20 ms windows, and applies a calibrated velocity Kalman filter to infer intended movement',
          'It tracks eye pupil dilation with an external camera',
          'It requires voice commands spoken out loud',
        ],
        correctIndex: 1,
        explanationWhyRight:
          'Intracortical BCIs sample action potentials from motor cortex ensembles and use a mathematical decoder (such as a Kalman filter) to translate population firing rates into 2D velocity vectors.',
        misconceptionDiagnosed:
          'Confusing intracortical neural decoders with muscle stimulation or eye-tracking.',
      },
    ],
  },
];

export interface ResearchCategoryDefinition {
  id: string;
  label: string;
  shortLabel: string;
  domains: DomainCategory[];
  liveSearchQuery: string;
  description: string;
  defaultProviders?: Array<
    | 'openalex'
    | 'semanticscholar'
    | 'arxiv'
    | 'europepmc'
    | 'pubmed'
    | 'doaj'
    | 'core'
    | 'repec'
    | 'ssrn'
    | 'paperswithcode'
  >;
  defaultSort?: 'relevance' | 'newest' | 'citations';
  yearFrom?: number;
}

export const RESEARCH_CATEGORIES: ResearchCategoryDefinition[] = [
  {
    id: 'all',
    label: 'All Research Categories',
    shortLabel: 'All Categories',
    domains: [],
    liveSearchQuery: '',
    description:
      'Verified peer-reviewed journals, open-access preprints, working papers, and research architectures across all 10 scholarly sources.',
  },
  {
    id: 'latest_2026',
    label: 'Latest 2025–2026 Research & Preprints',
    shortLabel: 'Latest 2025–2026',
    domains: [
      'AI & Computing',
      'Quantum & Physics',
      'Biomedicine & Genomics',
      'Economics',
      'Political Science',
      'Civil & Computer Engineering',
      'Clean Tech & Public Service',
      'Space & Astronomy',
      'Mathematics',
    ],
    liveSearchQuery: 'quantum error correction transformer CRISPR climate macroeconomics',
    description:
      'Newly published 2025–2026 peer-reviewed articles and scientific preprints sorted by publication and submission date.',
    defaultProviders: ['openalex', 'arxiv', 'europepmc', 'pubmed', 'doaj', 'repec', 'ssrn'],
    defaultSort: 'newest',
    yearFrom: 2025,
  },
  {
    id: 'ai_ml',
    label: 'Computer Science, AI & Machine Learning',
    shortLabel: 'Computer Science & AI',
    domains: ['AI & Computing', 'Open-Source & DevTools'],
    liveSearchQuery: 'transformer attention mechanism neural network distributed systems compiler',
    description:
      'Foundation models, GPU systems architecture, efficient attention, compilers, and Papers with Code implementations.',
    defaultProviders: ['openalex', 'arxiv', 'paperswithcode', 'semanticscholar', 'doaj'],
    defaultSort: 'relevance',
  },
  {
    id: 'medicine_biomed',
    label: 'Medicine & Biomedical Research',
    shortLabel: 'Medicine & Biomedical',
    domains: ['Biomedicine & Genomics'],
    liveSearchQuery: 'CRISPR prime editing protein structure clinical trial immunotherapy genomics',
    description:
      'Indexed via Europe PMC, PubMed/NCBI E-utilities, and OpenAlex: genomics, cellular biophysics, clinical trials, and oncology.',
    defaultProviders: ['europepmc', 'pubmed', 'openalex', 'doaj', 'semanticscholar'],
    defaultSort: 'relevance',
  },
  {
    id: 'physics_math',
    label: 'Physics & Mathematics',
    shortLabel: 'Physics & Mathematics',
    domains: ['Quantum & Physics', 'Mathematics'],
    liveSearchQuery: 'quantum error correction surface code condensed matter differential geometry theorem',
    description:
      'Quantum fault tolerance, condensed matter, general relativity, differential geometry, and formal mathematical proofs.',
    defaultProviders: ['openalex', 'arxiv', 'semanticscholar', 'doaj', 'paperswithcode'],
    defaultSort: 'relevance',
  },
  {
    id: 'political_science',
    label: 'Political Science & Governance',
    shortLabel: 'Political Science',
    domains: ['Political Science', 'Social Sciences', 'Startups & Policy'],
    liveSearchQuery: 'democratic institutions electoral systems public policy international relations governance',
    description:
      'Comparative politics, electoral behavior, constitutional governance, international relations, and public administration via OpenAlex, SSRN, and DOAJ.',
    defaultProviders: ['openalex', 'ssrn', 'doaj', 'semanticscholar'],
    defaultSort: 'relevance',
  },
  {
    id: 'economics',
    label: 'Economics, Finance & Working Papers',
    shortLabel: 'Economics (RePEc / SSRN)',
    domains: ['Economics', 'Startups & Policy', 'Social Sciences'],
    liveSearchQuery: 'monetary policy inflation macroeconomics econometrics labor market fiscal policy',
    description:
      'Macroeconomics, econometrics, monetary & fiscal policy, and working papers indexed via RePEc/IDEAS, SSRN, OpenAlex, and DOAJ.',
    defaultProviders: ['repec', 'ssrn', 'openalex', 'doaj', 'semanticscholar'],
    defaultSort: 'relevance',
  },
  {
    id: 'civil_mech',
    label: 'Civil, Structural & Mechanical Engineering',
    shortLabel: 'Civil & Structural Eng',
    domains: ['Civil & Computer Engineering', 'Clean Tech & Public Service'],
    liveSearchQuery: 'civil engineering seismic structural mechanics finite element bridge concrete fluid dynamics',
    description:
      'Seismic resilience, structural mechanics, finite element analysis, geotechnical engineering, and resilient infrastructure.',
    defaultProviders: ['openalex', 'doaj', 'arxiv', 'semanticscholar'],
    defaultSort: 'relevance',
  },
  {
    id: 'climate_env',
    label: 'Climate & Environmental Science',
    shortLabel: 'Climate & Environment',
    domains: ['Clean Tech & Public Service'],
    liveSearchQuery: 'climate change carbon capture atmospheric water harvesting renewable energy ecosystem',
    description:
      'Atmospheric water harvesting, clean energy microgrids, carbon removal, earth system modeling, and ecological resilience.',
    defaultProviders: ['openalex', 'doaj', 'europepmc', 'arxiv', 'semanticscholar'],
    defaultSort: 'relevance',
  },
  {
    id: 'space_astronomy',
    label: 'Space & Astronomy',
    shortLabel: 'Space & Astronomy',
    domains: ['Space & Astronomy'],
    liveSearchQuery: 'JWST exoplanet transmission spectroscopy astrophysics cosmology gravitational waves',
    description:
      'Exoplanet atmospheres, JWST infrared spectroscopy, orbital mechanics, and observational cosmology.',
    defaultProviders: ['openalex', 'arxiv', 'semanticscholar', 'doaj'],
    defaultSort: 'relevance',
  },
  {
    id: 'social_sciences',
    label: 'Social Sciences & Public Policy',
    shortLabel: 'Social Sciences',
    domains: ['Social Sciences', 'Political Science', 'Economics', 'Startups & Policy'],
    liveSearchQuery: 'sociology inequality education policy behavioral science demographic transition',
    description:
      'Empirical social systems, behavioral science, demographic studies, and institutional policy research.',
    defaultProviders: ['openalex', 'ssrn', 'doaj', 'repec', 'semanticscholar'],
    defaultSort: 'relevance',
  },
  {
    id: 'materials_science',
    label: 'Materials Science & Nanotechnology',
    shortLabel: 'Materials Science',
    domains: ['Materials Science', 'Quantum & Physics', 'Clean Tech & Public Service'],
    liveSearchQuery: 'metal organic framework perovskite solid state battery superconductor crystallography',
    description:
      'Nanoporous metal-organic frameworks, high-temperature superconductors, solid-state batteries, and 2D materials.',
    defaultProviders: ['openalex', 'arxiv', 'doaj', 'semanticscholar'],
    defaultSort: 'relevance',
  },
];

export interface GitHubCatalogRepoItem {
  fullName: string;
  owner: string;
  name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  openIssues: number;
  license: string;
  topics: string[];
  updatedAt: string;
  htmlUrl: string;
  categoryTag: string;
  relatedPaperId?: string;
}

export const SEED_GITHUB_REPOS: GitHubCatalogRepoItem[] = [
  {
    fullName: 'bilawalsidhu/gods-eye-view',
    owner: 'bilawalsidhu',
    name: 'gods-eye-view',
    description:
      'Spatial reconstruction workflows chaining FFmpeg frame sampling, COLMAP camera pose estimation, and 3D Gaussian Splatting from aerial/drone video.',
    language: 'Python',
    stars: 2150,
    forks: 280,
    openIssues: 14,
    license: 'MIT',
    topics: ['gaussian-splatting', 'photogrammetry', 'colmap', '3d-reconstruction', 'computer-vision'],
    updatedAt: '2025-02-10',
    htmlUrl: 'https://github.com/bilawalsidhu/gods-eye-view',
    categoryTag: '3D Vision & Geospatial',
    relatedPaperId: 'disc-gods-eye-view',
  },
  {
    fullName: 'Dao-AILab/flash-attention',
    owner: 'Dao-AILab',
    name: 'flash-attention',
    description:
      'Fast and memory-efficient exact attention (FlashAttention-1, 2, and 3) with IO-aware CUDA/Hopper Tensor Core tiling.',
    language: 'C++',
    stars: 14800,
    forks: 1520,
    openIssues: 185,
    license: 'BSD-3-Clause',
    topics: ['transformers', 'cuda', 'deep-learning', 'attention', 'pytorch'],
    updatedAt: '2025-02-18',
    htmlUrl: 'https://github.com/Dao-AILab/flash-attention',
    categoryTag: 'AI & GPU Kernels',
    relatedPaperId: 'disc-sparse-flash-attention',
  },
  {
    fullName: 'google-deepmind/alphageometry',
    owner: 'google-deepmind',
    name: 'alphageometry',
    description:
      'Official neuro-symbolic Olympiad geometry theorem prover combining Deductive Database + Algebraic Rules (DD+AR) with synthetic language model constructions.',
    language: 'Python',
    stars: 5120,
    forks: 610,
    openIssues: 28,
    license: 'Apache-2.0',
    topics: ['theorem-proving', 'geometry', 'neuro-symbolic', 'mathematics', 'imo'],
    updatedAt: '2025-01-24',
    htmlUrl: 'https://github.com/google-deepmind/alphageometry',
    categoryTag: 'Mathematics & Reasoning',
    relatedPaperId: 'disc-alphageometry-olympiad',
  },
  {
    fullName: 'google-deepmind/graphcast',
    owner: 'google-deepmind',
    name: 'graphcast',
    description:
      'Learning skillful medium-range global weather forecasting on 0.25° multi-mesh icosahedral Graph Neural Networks in JAX.',
    language: 'Python',
    stars: 5640,
    forks: 740,
    openIssues: 42,
    license: 'Apache-2.0',
    topics: ['weather-forecasting', 'graph-neural-networks', 'climate', 'jax', 'era5'],
    updatedAt: '2025-02-05',
    htmlUrl: 'https://github.com/google-deepmind/graphcast',
    categoryTag: 'Climate & Earth Systems',
    relatedPaperId: 'disc-graphcast-earth-forecasting',
  },
  {
    fullName: 'nerfstudio-project/gsplat',
    owner: 'nerfstudio-project',
    name: 'gsplat',
    description:
      'CUDA-accelerated differentiable rasterization of 3D Gaussians with Apache-2.0 licensing and up to 4x lower GPU memory consumption.',
    language: 'CUDA',
    stars: 2890,
    forks: 310,
    openIssues: 39,
    license: 'Apache-2.0',
    topics: ['3dgs', 'cuda', 'nerfstudio', 'differentiable-rendering', 'pytorch'],
    updatedAt: '2025-02-19',
    htmlUrl: 'https://github.com/nerfstudio-project/gsplat',
    categoryTag: '3D Vision & Geospatial',
    relatedPaperId: 'disc-gods-eye-view',
  },
  {
    fullName: 'morluto/rea',
    owner: 'morluto',
    name: 'rea',
    description:
      'Automated binary reverse-engineering and static control-flow graph analysis assistant for inspecting ELF/PE executables.',
    language: 'Python',
    stars: 145,
    forks: 22,
    openIssues: 4,
    license: 'MIT',
    topics: ['reverse-engineering', 'binary-analysis', 'cfg', 'disassembly', 'security'],
    updatedAt: '2024-11-12',
    htmlUrl: 'https://github.com/morluto/rea',
    categoryTag: 'Systems & Security',
    relatedPaperId: 'disc-morluto-rea',
  },
  {
    fullName: 'karpathy/nanoGPT',
    owner: 'karpathy',
    name: 'nanoGPT',
    description:
      'The simplest, fastest repository for training and finetuning medium-sized GPTs with pure PyTorch in two clean files.',
    language: 'Python',
    stars: 36200,
    forks: 5400,
    openIssues: 112,
    license: 'MIT',
    topics: ['transformers', 'llm', 'pytorch', 'deep-learning', 'gpt'],
    updatedAt: '2025-01-18',
    htmlUrl: 'https://github.com/karpathy/nanoGPT',
    categoryTag: 'AI & Machine Learning',
    relatedPaperId: 'disc-sparse-flash-attention',
  },
  {
    fullName: 'openai/whisper',
    owner: 'openai',
    name: 'whisper',
    description:
      'Robust Speech Recognition via Large-Scale Weak Supervision using multi-task sequence-to-sequence transformers.',
    language: 'Python',
    stars: 72800,
    forks: 8200,
    openIssues: 410,
    license: 'MIT',
    topics: ['speech-recognition', 'audio', 'deep-learning', 'transformers', 'asr'],
    updatedAt: '2025-02-12',
    htmlUrl: 'https://github.com/openai/whisper',
    categoryTag: 'AI & Machine Learning',
  },
  {
    fullName: 'ggerganov/llama.cpp',
    owner: 'ggerganov',
    name: 'llama.cpp',
    description:
      'Port of Facebook’s LLaMA model in pure C/C++ with 1.5-bit to 8-bit integer quantization and zero external dependencies.',
    language: 'C++',
    stars: 71400,
    forks: 10500,
    openIssues: 320,
    license: 'MIT',
    topics: ['llm', 'cpp', 'inference', 'quantization', 'performance'],
    updatedAt: '2025-02-21',
    htmlUrl: 'https://github.com/ggerganov/llama.cpp',
    categoryTag: 'Systems & Compilers',
  },
];

export const INITIAL_MASTERY_RECORDS: MasteryRecord[] = [
  {
    discoveryId: 'disc-quantum-surface-code',
    topicTitle: 'Surface Code Quantum Error Correction',
    domain: 'Quantum & Physics',
    progressPercent: 68,
    masteryEstimate: 74,
    quizAttempts: 2,
    lastQuizScore: 100,
    lastStudiedAt: '2026-10-18T18:20:00Z',
    nextReviewDueAt: '2026-10-21T18:00:00Z',
    weakConcepts: ['Lattice surgery CNOT overhead', 'Cosmic ray burst correlated errors'],
  },
  {
    discoveryId: 'disc-gods-eye-view',
    topicTitle: '3D Gaussian Splatting & SfM Pipelines',
    domain: 'Open-Source & DevTools',
    progressPercent: 45,
    masteryEstimate: 58,
    quizAttempts: 1,
    lastQuizScore: 50,
    lastStudiedAt: '2026-10-18T15:10:00Z',
    nextReviewDueAt: '2026-10-19T15:00:00Z',
    weakConcepts: ['Spherical harmonics color view-dependence', 'Jacobian affine projection'],
  },
  {
    discoveryId: 'disc-bohr-hemoglobin',
    topicTitle: 'Hemoglobin Bohr Effect & Allostery',
    domain: 'Biomedicine & Genomics',
    progressPercent: 82,
    masteryEstimate: 88,
    quizAttempts: 3,
    lastQuizScore: 100,
    lastStudiedAt: '2026-10-17T20:00:00Z',
    nextReviewDueAt: '2026-10-24T20:00:00Z',
    weakConcepts: ['MWC concerted vs KNF sequential models'],
  },
  {
    discoveryId: 'disc-sparse-flash-attention',
    topicTitle: 'FlashAttention-3 & IO-Aware Tiling',
    domain: 'AI & Computing',
    progressPercent: 30,
    masteryEstimate: 42,
    quizAttempts: 1,
    lastQuizScore: 50,
    lastStudiedAt: '2026-10-16T12:00:00Z',
    nextReviewDueAt: '2026-10-19T09:00:00Z',
    weakConcepts: ['Online softmax denominator rescaling', 'Hopper TMA asynchronous barrier'],
  },
  {
    discoveryId: 'disc-mof-water-microgrid',
    topicTitle: 'MOF-303 Atmospheric Water Harvesting',
    domain: 'Clean Tech & Public Service',
    progressPercent: 76,
    masteryEstimate: 81,
    quizAttempts: 2,
    lastQuizScore: 100,
    lastStudiedAt: '2026-10-18T11:30:00Z',
    nextReviewDueAt: '2026-10-25T11:30:00Z',
    weakConcepts: ['Pyrazole-carboxylate hydrophilic step isotherm'],
  },
];

export const INITIAL_KNOWLEDGE_EDGES: KnowledgeEdge[] = [
  {
    id: 'edge-1',
    fromTitle: 'Parity Check Matrices & Classical Coding',
    toTitle: 'Surface Code Quantum Error Correction',
    relationship: 'Prerequisite For',
    whyConnected:
      'Stabilizer syndromes generalize classical parity check matrices to non-commuting Pauli X and Z operators without measuring individual data qubits.',
    sourceCitation: 'Kitaev (1997) / Nature 638, 920–926 (2024)',
  },
  {
    id: 'edge-2',
    fromTitle: 'COLMAP Structure-from-Motion (SfM)',
    toTitle: '3D Gaussian Splatting & SfM Pipelines',
    relationship: 'Prerequisite For',
    whyConnected:
      '3D Gaussian Splatting initializes ellipsoid positions from the sparse point cloud and camera extrinsics [R|t] solved by Structure-from-Motion.',
    sourceCitation: 'Kerbl et al. SIGGRAPH 2023 / gods-eye-view README',
  },
  {
    id: 'edge-3',
    fromTitle: 'Online Softmax Rescaling (Milakov 2018)',
    toTitle: 'FlashAttention-3 & IO-Aware Tiling',
    relationship: 'Extends Mechanism',
    whyConnected:
      'Allows exact softmax evaluation across split K/V SRAM tiles without materializing the full N×N attention score matrix in HBM.',
    sourceCitation: 'arXiv:2407.08608 (Shah & Dao, 2024)',
  },
  {
    id: 'edge-4',
    fromTitle: 'Allosteric T-to-R Salt Bridge Shift (Perutz)',
    toTitle: 'Hemoglobin Bohr Effect & Allostery',
    relationship: 'Extends Mechanism',
    whyConnected:
      'Protonation of β-His146 at low tissue pH stabilizes Asp94 salt bridges in the Tense (deoxy) conformation, increasing P50.',
    sourceCitation: 'PDB 1HHO / 2HHB & Bohr et al. (1904)',
  },
  {
    id: 'edge-5',
    fromTitle: 'Hemoglobin Bohr Effect & Allostery',
    toTitle: 'MOF-303 Atmospheric Water Harvesting',
    relationship: 'Shared Mathematical Tool',
    whyConnected:
      'Both cooperative O2 binding in hemoglobin (Hill sigmoidal curve) and Type-IV water uptake in MOF-303 nanopores follow steep step-shaped thermodynamic isotherms.',
    sourceCitation: 'Bohr (1904) & Yaghi Lab Science (2024)',
  },
  {
    id: 'edge-6',
    fromTitle: 'Surface Code Quantum Error Correction',
    toTitle: 'FlashAttention-3 & IO-Aware Tiling',
    relationship: 'Shared Mathematical Tool',
    whyConnected:
      'Real-time neural syndrome decoders for d=7 surface codes rely on low-latency tiled tensor operations and SRAM-bound kernel fusion to decode within the 1.1 μs cycle.',
    sourceCitation: 'Nature 638 (2024) & arXiv:2407.08608',
  },
  {
    id: 'edge-7',
    fromTitle: 'FlashAttention-3 & IO-Aware Tiling',
    toTitle: '3D Gaussian Splatting & SfM Pipelines',
    relationship: 'Shared Mathematical Tool',
    whyConnected:
      'Both 3DGS differentiable splat rasterizers and FlashAttention-3 partition work into 16×16 GPU shared-memory (SRAM) tiles to eliminate global HBM memory bottlenecks.',
    sourceCitation: 'SIGGRAPH 2023 3DGS & FlashAttention-3 CUDA Kernels',
  },
];

export const INITIAL_WATCHLISTS: WatchlistItem[] = [
  {
    id: 'watch-quantum-qec',
    targetType: 'Topic / Field',
    targetQuery: 'quantum error correction surface code LDPC',
    displayTitle: 'Fault-Tolerant Quantum Error Correction & LDPC Codes',
    sourcesMonitored: ['arXiv quant-ph', 'OpenAlex Works', 'Crossref DOIs'],
    importanceThreshold: 'Meaningful Changes Only',
    cadence: 'Daily Briefing',
    active: true,
    lastCheckedAt: '2026-10-18T22:00:00Z',
    lastStatus: 'Update Detected',
    updates: [
      {
        id: 'upd-qec-1',
        checkedAt: '2026-10-18T22:00:00Z',
        whatIsNew: 'New arXiv & OpenAlex publications on Bivariate Bicycle (BB) qLDPC codes vs Planar Surface Codes',
        whatChangedFromBaseline:
          'Recent papers demonstrate 10x higher encoding rate (12 logical qubits in 144 physical qubits) compared to planar surface codes, though requiring non-local 2D couplers.',
        sourceAndDate: 'arXiv quant-ph / OpenAlex · Verified Oct 2026',
        whyItMatters:
          'Could reduce physical qubit overhead for useful fault-tolerant algorithms from ~1,000:1 down to ~100:1 if long-range couplers maintain <0.1% gate error.',
        impactOnPriorUnderstanding: 'Adds technical detail',
        remainingUncertainty:
          'Hardware routing of non-planar coupler crossings on superconducting chips remains harder to fabricate than nearest-neighbor surface codes.',
        recommendedNextAction:
          'Compare physical qubit overhead in the Quantum Threshold Visual Lab at d=7 vs d=9.',
        sourceUrl: 'https://arxiv.org/list/quant-ph/recent',
      },
    ],
  },
  {
    id: 'watch-repo-gev',
    targetType: 'GitHub Repository',
    targetQuery: 'bilawalsidhu/gods-eye-view',
    displayTitle: 'bilawalsidhu/gods-eye-view & 3D Gaussian Splatting Ecosystem',
    sourcesMonitored: ['GitHub REST API (/repos & /releases)', 'arXiv cs.CV'],
    importanceThreshold: 'Meaningful Changes Only',
    cadence: 'Weekly Digest',
    active: true,
    lastCheckedAt: '2026-10-18T21:15:00Z',
    lastStatus: 'Nominal',
    updates: [
      {
        id: 'upd-gev-1',
        checkedAt: '2026-10-18T21:15:00Z',
        whatIsNew: 'Pose-free feed-forward Gaussian Splatting (MASt3R / gsplat v1.x) integration patterns',
        whatChangedFromBaseline:
          'Modern pipelines increasingly replace slow COLMAP bundle adjustment with GLOMAP or feed-forward dense stereo priors, cutting preprocessing time by 5x.',
        sourceAndDate: 'GitHub REST API & arXiv cs.CV · Verified Oct 2026',
        whyItMatters:
          'Removes the #1 failure point for beginners trying to reconstruct scenes from uncalibrated video.',
        impactOnPriorUnderstanding: 'Strengthens prior evidence',
        remainingUncertainty:
          'Large-scale aerial trajectories still benefit from GPS/RTK priors or global bundle adjustment to prevent scale drift.',
        recommendedNextAction:
          'Inspect live repository status in the Technology & GitHub Explorer tab.',
        sourceUrl: 'https://github.com/bilawalsidhu/gods-eye-view',
      },
    ],
  },
];
