import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  DiscoveryItem,
  KnowledgeEdge,
  MasteryRecord,
} from '../types/orbit';
import { INITIAL_KNOWLEDGE_EDGES } from '../data/seedDiscoveries';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  BookOpen,
  Award,
  ArrowRight,
  GitCommit,
  CheckCircle2,
  Filter,
  Layers,
  Plus,
} from 'lucide-react';

interface LearningPathGraphProps {
  knowledgeEdges: KnowledgeEdge[];
  masteryRecords: MasteryRecord[];
  discoveries: DiscoveryItem[];
  onOpenDiscovery: (
    item: DiscoveryItem,
    tab?: 'reader' | 'professor' | 'visual' | 'notes' | 'quiz'
  ) => void;
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  mastery: number;
  progress: number;
  domain: string;
  status: 'mastered' | 'in_progress' | 'prerequisite';
  tier: number; // 0 = foundational prerequisite, 1 = active learning, 2 = mastered
  discovery?: DiscoveryItem;
  weakConcepts: string[];
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  relationship: KnowledgeEdge['relationship'];
  whyConnected: string;
  sourceCitation: string;
}

export const LearningPathGraph: React.FC<LearningPathGraphProps> = ({
  knowledgeEdges,
  masteryRecords,
  discoveries,
  onOpenDiscovery,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'mastered_focus'>('all');
  const [layoutMode, setLayoutMode] = useState<'tiered_path' | 'force_network'>('force_network');
  const [localMasteryOverrides, setLocalMasteryOverrides] = useState<Record<string, number>>({});
  const [customEdges, setCustomEdges] = useState<KnowledgeEdge[]>([]);
  const [showAddEdgeForm, setShowAddEdgeForm] = useState(false);
  const [newEdgeFrom, setNewEdgeFrom] = useState('');
  const [newEdgeTo, setNewEdgeTo] = useState('');
  const [newEdgeRel, setNewEdgeRel] = useState<KnowledgeEdge['relationship']>('Prerequisite For');
  const [newEdgeWhy, setNewEdgeWhy] = useState('');

  // Merge INITIAL_KNOWLEDGE_EDGES + passed knowledgeEdges + user customEdges without duplicates
  const unifiedEdges = useMemo(() => {
    const map = new Map<string, KnowledgeEdge>();
    INITIAL_KNOWLEDGE_EDGES.forEach((edge) => map.set(edge.id, edge));
    knowledgeEdges.forEach((edge) => {
      // Keep canonical INITIAL_KNOWLEDGE_EDGES if id matches so updated titles stay synced
      if (!map.has(edge.id)) {
        map.set(edge.id, edge);
      }
    });
    customEdges.forEach((edge) => map.set(edge.id, edge));
    return Array.from(map.values());
  }, [knowledgeEdges, customEdges]);

  // Build unified nodes & links from unifiedEdges + masteryRecords + discoveries
  const { nodes, links, masteredCount, totalConnectionsCount } = useMemo(() => {
    const nodeMap = new Map<string, GraphNode>();

    const findMatchingDiscovery = (title: string): DiscoveryItem | undefined => {
      const lower = title.toLowerCase();
      return discoveries.find(
        (d) =>
          d.title.toLowerCase().includes(lower) ||
          lower.includes(d.title.toLowerCase().slice(0, 18)) ||
          (lower.includes('gods-eye-view') && d.id === 'disc-gods-eye-view') ||
          (lower.includes('gaussian splatting') && d.id === 'disc-gods-eye-view') ||
          (lower.includes('surface code') && d.id === 'disc-quantum-surface-code') ||
          (lower.includes('bohr') && d.id === 'disc-bohr-hemoglobin') ||
          (lower.includes('flashattention') && d.id === 'disc-sparse-flash-attention') ||
          (lower.includes('mof-303') && d.id === 'disc-mof-water-microgrid')
      );
    };

    const findMatchingMastery = (
      title: string,
      disc?: DiscoveryItem
    ): MasteryRecord | undefined => {
      const lower = title.toLowerCase();
      return masteryRecords.find(
        (m) =>
          (disc && m.discoveryId === disc.id) ||
          m.topicTitle.toLowerCase() === lower ||
          lower.includes(m.topicTitle.toLowerCase().slice(0, 14)) ||
          m.topicTitle.toLowerCase().includes(lower.slice(0, 14))
      );
    };

    const ensureNode = (title: string): GraphNode => {
      const normalizedTitle =
        title === 'bilawalsidhu/gods-eye-view (3DGS)'
          ? '3D Gaussian Splatting & SfM Pipelines'
          : title;

      if (nodeMap.has(normalizedTitle)) return nodeMap.get(normalizedTitle)!;
      const disc = findMatchingDiscovery(normalizedTitle);
      const mast = findMatchingMastery(normalizedTitle, disc);

      const overrideScore = localMasteryOverrides[normalizedTitle];
      const masteryScore =
        overrideScore !== undefined
          ? overrideScore
          : mast
          ? mast.masteryEstimate
          : disc
          ? 72
          : 100;

      const status: GraphNode['status'] =
        overrideScore !== undefined
          ? overrideScore >= 70
            ? 'mastered'
            : 'in_progress'
          : mast
          ? mast.masteryEstimate >= 70
            ? 'mastered'
            : 'in_progress'
          : disc
          ? 'mastered'
          : 'prerequisite';

      const tier = status === 'prerequisite' ? 0 : status === 'in_progress' ? 1 : 2;

      const node: GraphNode = {
        id: normalizedTitle,
        label: normalizedTitle,
        mastery: masteryScore,
        progress: mast ? mast.progressPercent : status === 'prerequisite' ? 100 : 65,
        domain: mast?.domain || disc?.domain || 'Foundational Prerequisite',
        status,
        tier,
        discovery: disc,
        weakConcepts: mast?.weakConcepts || [],
      };
      nodeMap.set(normalizedTitle, node);
      return node;
    };

    // Add all edges from unifiedEdges
    const allLinks: GraphLink[] = unifiedEdges.map((edge) => {
      const sourceNode = ensureNode(edge.fromTitle);
      const targetNode = ensureNode(edge.toTitle);
      return {
        id: edge.id,
        source: sourceNode.id,
        target: targetNode.id,
        relationship: edge.relationship,
        whyConnected: edge.whyConnected,
        sourceCitation: edge.sourceCitation,
      };
    });

    // Ensure all masteryRecords are represented in the learning path
    masteryRecords.forEach((rec) => {
      const existing = Array.from(nodeMap.values()).find(
        (n) =>
          (n.discovery && n.discovery.id === rec.discoveryId) ||
          n.label.toLowerCase() === rec.topicTitle.toLowerCase()
      );
      if (!existing) {
        ensureNode(rec.topicTitle);
      }
    });

    const allNodes = Array.from(nodeMap.values());
    const masteredTotal = allNodes.filter((n) => n.status === 'mastered').length;

    if (filterMode === 'mastered_focus') {
      const masteredIds = new Set(
        allNodes.filter((n) => n.status === 'mastered').map((n) => n.id)
      );
      // Include mastered nodes and any node directly connected to a mastered node
      const connectedIds = new Set<string>(masteredIds);
      const filteredLinks = allLinks.filter((l) => {
        const s = typeof l.source === 'object' ? l.source.id : l.source;
        const t = typeof l.target === 'object' ? l.target.id : l.target;
        if (masteredIds.has(s) || masteredIds.has(t)) {
          connectedIds.add(s);
          connectedIds.add(t);
          return true;
        }
        return false;
      });
      const filteredNodes = allNodes.filter((n) => connectedIds.has(n.id));
      return {
        nodes: filteredNodes,
        links: filteredLinks,
        masteredCount: masteredTotal,
        totalConnectionsCount: allLinks.length,
      };
    }

    return {
      nodes: allNodes,
      links: allLinks,
      masteredCount: masteredTotal,
      totalConnectionsCount: allLinks.length,
    };
  }, [unifiedEdges, masteryRecords, discoveries, filterMode, localMasteryOverrides]);

  const selectedNode = useMemo(
    () =>
      nodes.find((n) => n.id === selectedNodeId) ||
      nodes.find((n) => n.status === 'mastered') ||
      nodes[0] ||
      null,
    [nodes, selectedNodeId]
  );

  const selectedEdge = useMemo(
    () => links.find((l) => l.id === selectedEdgeId) || null,
    [links, selectedEdgeId]
  );

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const width = 820;
    const height = 490;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Clone nodes & links for D3 simulation mutation
    const simNodes: GraphNode[] = nodes.map((n) => ({ ...n }));
    const simLinks: GraphLink[] = links.map((l) => ({ ...l }));

    // Define SVG defs for directional arrows and radial glow
    const defs = svg.append('defs');

    defs
      .append('marker')
      .attr('id', 'orbit-arrow-emerald')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 36)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#10B981');

    defs
      .append('marker')
      .attr('id', 'orbit-arrow-muted')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 36)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', 'rgba(244, 243, 239, 0.45)');

    const gRoot = svg.append('g').attr('class', 'learning-path-canvas');

    // Subtle tier column guides when in tiered_path mode
    if (layoutMode === 'tiered_path') {
      const tiers = [
        { x: 165, label: '01 · FOUNDATIONAL PREREQUISITES', color: '#38BDF8' },
        { x: 410, label: '02 · ACTIVE STUDY TOPICS', color: '#F59E0B' },
        { x: 655, label: '03 · MASTERED RESEARCH TOPICS', color: '#10B981' },
      ];
      const tierGroup = gRoot.append('g').attr('class', 'tier-guides');
      tiers.forEach((t) => {
        tierGroup
          .append('line')
          .attr('x1', t.x)
          .attr('y1', 28)
          .attr('x2', t.x)
          .attr('y2', height - 45)
          .attr('stroke', 'rgba(255, 255, 255, 0.06)')
          .attr('stroke-dasharray', '4,6');

        tierGroup
          .append('text')
          .attr('x', t.x)
          .attr('y', 22)
          .attr('text-anchor', 'middle')
          .attr('fill', t.color)
          .attr('font-size', '9.5px')
          .attr('font-weight', '600')
          .attr('font-family', 'JetBrains Mono, monospace')
          .attr('opacity', 0.85)
          .text(t.label);
      });
    }

    // Configure D3 Zoom (suppress wheel zoom to keep page scrolling smooth)
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.55, 2.2])
      .filter((event) => event.type !== 'wheel')
      .on('zoom', (event) => {
        gRoot.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    const targetXForTier = (d: GraphNode) => {
      if (layoutMode === 'force_network') return width / 2;
      if (d.tier === 0) return 165;
      if (d.tier === 1) return 410;
      return 655;
    };

    // Force Simulation
    const simulation = d3
      .forceSimulation<GraphNode>(simNodes)
      .force(
        'link',
        d3
          .forceLink<GraphNode, GraphLink>(simLinks)
          .id((d) => d.id)
          .distance(layoutMode === 'tiered_path' ? 190 : 170)
          .strength(layoutMode === 'tiered_path' ? 0.55 : 0.75)
      )
      .force(
        'charge',
        d3.forceManyBody().strength(layoutMode === 'tiered_path' ? -440 : -560)
      )
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(62))
      .force(
        'x',
        d3
          .forceX<GraphNode>((d) => targetXForTier(d))
          .strength(layoutMode === 'tiered_path' ? 0.42 : 0.07)
      )
      .force('y', d3.forceY(height / 2).strength(0.12));

    // Determine connected neighbors of active/hovered node
    const activeFocusId = hoveredNodeId || selectedNode?.id || null;
    const isLinkHighlighted = (d: GraphLink) => {
      if (d.id === selectedEdgeId) return true;
      if (!activeFocusId) return false;
      const s = typeof d.source === 'object' ? d.source.id : d.source;
      const t = typeof d.target === 'object' ? d.target.id : d.target;
      return s === activeFocusId || t === activeFocusId;
    };

    // Render Links
    const linkGroup = gRoot
      .append('g')
      .attr('class', 'links')
      .selectAll('g')
      .data(simLinks)
      .join('g')
      .style('cursor', 'pointer')
      .on('click', (_event, d) => {
        setSelectedEdgeId(d.id);
      });

    const linkPaths = linkGroup
      .append('path')
      .attr('fill', 'none')
      .attr('stroke', (d) =>
        isLinkHighlighted(d) ? '#10B981' : 'rgba(255, 255, 255, 0.22)'
      )
      .attr('stroke-width', (d) => (isLinkHighlighted(d) ? 2.8 : 1.8))
      .attr('stroke-dasharray', (d) =>
        d.relationship === 'Prerequisite For' ? 'none' : '5,4'
      )
      .attr('marker-end', (d) =>
        isLinkHighlighted(d) ? 'url(#orbit-arrow-emerald)' : 'url(#orbit-arrow-muted)'
      );

    const linkLabels = linkGroup
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', -8)
      .attr('fill', (d) =>
        isLinkHighlighted(d) ? '#6EE7B7' : 'rgba(244, 243, 239, 0.6)'
      )
      .attr('font-size', '9.5px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .text((d) => d.relationship);

    // Render Nodes
    const nodeGroup = gRoot
      .append('g')
      .attr('class', 'nodes')
      .selectAll<SVGGElement, GraphNode>('g')
      .data(simNodes)
      .join('g')
      .style('cursor', 'pointer')
      .on('click', (_event, d) => {
        setSelectedNodeId(d.id);
        setSelectedEdgeId(null);
      })
      .on('mouseenter', (_event, d) => {
        setHoveredNodeId(d.id);
      })
      .on('mouseleave', () => {
        setHoveredNodeId(null);
      })
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Outer Selection Halo for Selected / Mastered Nodes
    nodeGroup
      .append('circle')
      .attr('r', 31)
      .attr('fill', 'none')
      .attr('stroke', (d) => {
        if (d.id === selectedNode?.id) return '#10B981';
        if (d.status === 'mastered') return 'rgba(16, 185, 129, 0.35)';
        return 'transparent';
      })
      .attr('stroke-width', (d) => (d.id === selectedNode?.id ? 2 : 1.2))
      .attr('stroke-dasharray', (d) => (d.id === selectedNode?.id ? 'none' : '3,3'));

    // Base Track Circle
    nodeGroup
      .append('circle')
      .attr('r', 25)
      .attr('fill', '#13111C')
      .attr('stroke', 'rgba(255, 255, 255, 0.12)')
      .attr('stroke-width', 3.5);

    // D3 Radial Mastery Arc around each node
    const arcGenerator = d3
      .arc<GraphNode>()
      .innerRadius(23)
      .outerRadius(27)
      .startAngle(0)
      .endAngle((d) => (Math.max(10, d.mastery) / 100) * 2 * Math.PI)
      .cornerRadius(2);

    nodeGroup
      .append('path')
      .attr('d', (d) => arcGenerator(d) || '')
      .attr('fill', (d) => {
        if (d.status === 'mastered') return '#10B981';
        if (d.status === 'in_progress') return '#F59E0B';
        return '#38BDF8';
      });

    // Inner Core Circle
    nodeGroup
      .append('circle')
      .attr('r', 19)
      .attr('fill', (d) => {
        if (d.status === 'mastered') return 'rgba(16, 185, 129, 0.20)';
        if (d.status === 'in_progress') return 'rgba(245, 158, 11, 0.18)';
        return 'rgba(56, 189, 248, 0.16)';
      });

    // Node Percentage / Badge Text inside circle
    nodeGroup
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#FFFFFF')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .attr('font-family', 'JetBrains Mono, monospace')
      .text((d) => (d.status === 'prerequisite' ? 'PRE' : `${d.mastery}%`));

    // Node Title Label below circle
    nodeGroup
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 43)
      .attr('fill', '#F4F3EF')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('font-family', 'Plus Jakarta Sans, sans-serif')
      .text((d) =>
        d.label.length > 28 ? d.label.slice(0, 26) + '...' : d.label
      );

    simulation.on('tick', () => {
      nodeGroup.attr('transform', (d) => {
        const clampedX = Math.max(75, Math.min(width - 75, d.x || width / 2));
        const clampedY = Math.max(58, Math.min(height - 62, d.y || height / 2));
        d.x = clampedX;
        d.y = clampedY;
        return `translate(${clampedX},${clampedY})`;
      });

      linkPaths.attr('d', (d) => {
        const sx = (d.source as GraphNode).x || 0;
        const sy = (d.source as GraphNode).y || 0;
        const tx = (d.target as GraphNode).x || 0;
        const ty = (d.target as GraphNode).y || 0;
        const dx = tx - sx;
        const dy = ty - sy;
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.6;
        return `M${sx},${sy}A${dr},${dr} 0 0,1 ${tx},${ty}`;
      });

      linkLabels
        .attr(
          'x',
          (d) => (((d.source as GraphNode).x || 0) + ((d.target as GraphNode).x || 0)) / 2
        )
        .attr(
          'y',
          (d) =>
            (((d.source as GraphNode).y || 0) + ((d.target as GraphNode).y || 0)) / 2 - 6
        );
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, links, selectedNode?.id, selectedEdgeId, hoveredNodeId, layoutMode]);

  const handleZoom = (factor: number) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(220)
      .call(zoomBehaviorRef.current.scaleBy, factor);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(250)
      .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  };

  const handleToggleMastery = (node: GraphNode) => {
    setLocalMasteryOverrides((prev) => {
      const nextScore = node.status === 'mastered' ? 55 : 90;
      return { ...prev, [node.id]: nextScore };
    });
  };

  const handleAddCustomEdge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEdgeFrom.trim() || !newEdgeTo.trim() || newEdgeFrom === newEdgeTo) return;
    const created: KnowledgeEdge = {
      id: `edge-custom-${Date.now()}`,
      fromTitle: newEdgeFrom,
      toTitle: newEdgeTo,
      relationship: newEdgeRel,
      whyConnected:
        newEdgeWhy.trim() ||
        'User-mapped conceptual bridge connecting prerequisite mechanisms across papers.',
      sourceCitation: 'ORBIT Personal Learning Path Synthesis',
    };
    setCustomEdges((prev) => [...prev, created]);
    setSelectedEdgeId(created.id);
    setShowAddEdgeForm(false);
    setNewEdgeWhy('');
  };

  return (
    <div className="space-y-4">
      {/* Top Summary Metrics & Controls Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT 8 COLS: Interactive D3.js Learning Path Node-Graph */}
        <div className="lg:col-span-8 orbit-glass-panel rounded-[26px] p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-300">
                <GitCommit className="w-3.5 h-3.5" />
                <span>
                  D3.js Learning Path · {masteredCount} Mastered Topics · {totalConnectionsCount}{' '}
                  Knowledge Connections
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                Mastered Topics &amp; Prerequisite Knowledge Graph
              </h3>
            </div>

            {/* Filter, Layout & Zoom Controls */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() =>
                  setFilterMode((prev) =>
                    prev === 'all' ? 'mastered_focus' : 'all'
                  )
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
                  filterMode === 'mastered_focus'
                    ? 'bg-emerald-400 text-[#0B0A0E] font-bold'
                    : 'orbit-glass-pill text-white/80 hover:text-white'
                }`}
                title="Filter graph to focus on Mastered topics and their direct connections"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>
                  {filterMode === 'mastered_focus' ? 'Mastered Path' : 'All Topics'}
                </span>
              </button>

              <button
                onClick={() =>
                  setLayoutMode((prev) =>
                    prev === 'tiered_path' ? 'force_network' : 'tiered_path'
                  )
                }
                className="px-3 py-1.5 rounded-xl orbit-glass-pill text-xs text-white/80 hover:text-white transition-colors inline-flex items-center gap-1.5"
                title="Switch between Tiered Learning Path and Force-Directed Network"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-300" />
                <span>
                  {layoutMode === 'tiered_path' ? 'Tiered Path' : 'Force Graph'}
                </span>
              </button>

              <button
                onClick={() => setShowAddEdgeForm((prev) => !prev)}
                className="px-2.5 py-1.5 rounded-xl orbit-glass-pill text-xs text-emerald-300 hover:text-white transition-colors inline-flex items-center gap-1"
                title="Add a custom connection between two topics"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Connect</span>
              </button>

              <button
                onClick={() => handleZoom(1.25)}
                title="Zoom In"
                className="p-2 rounded-xl orbit-glass-pill text-white/80 hover:text-white hover:bg-white/20 transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleZoom(0.8)}
                title="Zoom Out"
                className="p-2 rounded-xl orbit-glass-pill text-white/80 hover:text-white hover:bg-white/20 transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetZoom}
                title="Reset Graph View"
                className="px-2.5 py-1.5 rounded-xl orbit-glass-pill text-xs text-white/80 hover:text-white hover:bg-white/20 transition-colors inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Optional Inline Add Connection Form */}
          {showAddEdgeForm && (
            <form
              onSubmit={handleAddCustomEdge}
              className="mb-3 p-3.5 rounded-2xl bg-white/[0.04] border border-emerald-500/30 grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs"
            >
              <select
                value={newEdgeFrom}
                onChange={(e) => setNewEdgeFrom(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#12111A] border border-white/15 text-white"
                required
              >
                <option value="">From Topic...</option>
                {nodes.map((n) => (
                  <option key={`from-${n.id}`} value={n.id}>
                    {n.label}
                  </option>
                ))}
              </select>

              <select
                value={newEdgeTo}
                onChange={(e) => setNewEdgeTo(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#12111A] border border-white/15 text-white"
                required
              >
                <option value="">To Topic...</option>
                {nodes.map((n) => (
                  <option key={`to-${n.id}`} value={n.id}>
                    {n.label}
                  </option>
                ))}
              </select>

              <select
                value={newEdgeRel}
                onChange={(e) =>
                  setNewEdgeRel(e.target.value as KnowledgeEdge['relationship'])
                }
                className="px-3 py-2 rounded-xl bg-[#12111A] border border-white/15 text-white"
              >
                <option value="Prerequisite For">Prerequisite For</option>
                <option value="Extends Mechanism">Extends Mechanism</option>
                <option value="Shared Mathematical Tool">Shared Mathematical Tool</option>
                <option value="Empirical Validation">Empirical Validation</option>
              </select>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newEdgeWhy}
                  onChange={(e) => setNewEdgeWhy(e.target.value)}
                  placeholder="Why connected..."
                  className="flex-1 px-3 py-2 rounded-xl bg-[#12111A] border border-white/15 text-white placeholder:text-white/40"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-xl bg-emerald-400 text-[#0B0A0E] font-bold hover:bg-emerald-300 transition-colors shrink-0"
                >
                  Add
                </button>
              </div>
            </form>
          )}

          {/* SVG Force Graph Stage */}
          <div className="rounded-2xl bg-[#09080E]/90 border border-white/10 overflow-hidden relative flex-1 min-h-[400px]">
            <svg
              ref={svgRef}
              viewBox="0 0 820 490"
              className="w-full h-full min-h-[400px] select-none"
              aria-label="D3 Learning Path Node Graph of Mastered Topics and Connections"
            />

            {/* Legend Overlay at Bottom-Left */}
            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-black/65 backdrop-blur-md border border-white/10 text-[11px] font-mono">
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-emerald-300">● Mastered Topic (≥70% Est.)</span>
                <span className="text-amber-300">▲ Active Study (&lt;70%)</span>
                <span className="text-sky-300">◆ Prerequisite Concept</span>
              </div>
              <span className="text-white/50">
                Drag nodes · Click any topic or edge to inspect connections
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT 4 COLS: Synchronized Node & Connection Inspector */}
        <div className="lg:col-span-4 orbit-glass-panel rounded-[26px] p-5 flex flex-col justify-between space-y-4">
          {selectedEdge ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-emerald-300 block">
                  Knowledge Edge Inspector · {selectedEdge.relationship}
                </span>
                <button
                  onClick={() => setSelectedEdgeId(null)}
                  className="text-[11px] font-mono text-white/60 hover:text-white"
                >
                  Back to Node →
                </button>
              </div>

              <h4 className="text-base font-bold text-white mt-1 leading-snug">
                {typeof selectedEdge.source === 'object'
                  ? selectedEdge.source.label
                  : selectedEdge.source}{' '}
                <ArrowRight className="inline w-4 h-4 text-emerald-400 mx-1" />{' '}
                {typeof selectedEdge.target === 'object'
                  ? selectedEdge.target.label
                  : selectedEdge.target}
              </h4>

              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2 text-xs">
                <span className="font-mono text-white/50 block">
                  Why These Topics Connect
                </span>
                <p className="text-white/90 leading-relaxed">
                  {selectedEdge.whyConnected}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/35 border border-white/10 text-xs font-mono">
                <span className="text-white/50 block">
                  Authoritative Provenance / Citation
                </span>
                <span className="text-emerald-300 mt-1 block">
                  {selectedEdge.sourceCitation}
                </span>
              </div>
            </div>
          ) : selectedNode ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span
                    className={`text-xs font-mono block ${
                      selectedNode.status === 'mastered'
                        ? 'text-emerald-300'
                        : selectedNode.status === 'in_progress'
                        ? 'text-amber-300'
                        : 'text-sky-300'
                    }`}
                  >
                    {selectedNode.status === 'mastered'
                      ? '● Mastered Topic Node'
                      : selectedNode.status === 'in_progress'
                      ? '▲ Active Learning Node'
                      : '◆ Foundational Prerequisite Node'}{' '}
                    · {selectedNode.domain}
                  </span>
                  <h4 className="text-lg font-bold text-white mt-1 leading-snug">
                    {selectedNode.label}
                  </h4>
                </div>

                {selectedNode.status !== 'prerequisite' && (
                  <button
                    onClick={() => handleToggleMastery(selectedNode)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-mono inline-flex items-center gap-1 border transition-colors shrink-0 ${
                      selectedNode.status === 'mastered'
                        ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40'
                        : 'bg-white/5 text-white/75 border-white/15 hover:text-white'
                    }`}
                    title="Toggle Mastered state to preview your Learning Path progression"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                    <span>
                      {selectedNode.status === 'mastered' ? 'Mastered' : 'Mark Mastered'}
                    </span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
                  <span className="text-[11px] text-white/50 block">Est. Mastery</span>
                  <span className="text-xl font-mono font-bold text-emerald-300">
                    {selectedNode.mastery}%
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
                  <span className="text-[11px] text-white/50 block">Reading Progress</span>
                  <span className="text-xl font-mono font-bold text-white">
                    {selectedNode.progress}%
                  </span>
                </div>
              </div>

              {selectedNode.weakConcepts.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs space-y-1.5">
                  <span className="font-mono text-amber-300 block">
                    Recommended Next Sub-Concepts to Review
                  </span>
                  <ul className="space-y-1 text-white/85">
                    {selectedNode.weakConcepts.map((wc, idx) => (
                      <li key={idx}>· {wc}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Connected Edges for this Node */}
              <div className="space-y-2">
                <span className="text-xs font-mono text-white/55 block">
                  Connected Learning Path Edges
                </span>
                {links
                  .filter((l) => {
                    const s = typeof l.source === 'object' ? l.source.id : l.source;
                    const t = typeof l.target === 'object' ? l.target.id : l.target;
                    return s === selectedNode.id || t === selectedNode.id;
                  })
                  .map((l) => {
                    const s = typeof l.source === 'object' ? l.source.id : l.source;
                    const t = typeof l.target === 'object' ? l.target.id : l.target;
                    return (
                      <button
                        key={l.id}
                        onClick={() => setSelectedEdgeId(l.id)}
                        className="w-full text-left p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 transition-colors text-xs space-y-1"
                      >
                        <div className="font-mono text-emerald-300 text-[11px]">
                          {l.relationship} · {l.sourceCitation}
                        </div>
                        <div className="text-white/90 font-medium">
                          {s} → {t}
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          ) : null}

          {/* Cross-Page Action Button to Jump Directly into Research & Professor Workspace */}
          <div className="pt-4 border-t border-white/10 space-y-2">
            {selectedNode?.discovery ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onOpenDiscovery(selectedNode.discovery!, 'professor')}
                  className="px-4 py-2.5 rounded-full bg-white text-[#0B0A0E] text-xs font-bold hover:bg-white/90 transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Open Lesson</span>
                </button>
                <button
                  onClick={() => onOpenDiscovery(selectedNode.discovery!, 'quiz')}
                  className="px-4 py-2.5 rounded-full orbit-glass-pill text-white text-xs font-medium hover:bg-white/20 transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Take Quiz</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  const matchLink = links.find((l) => {
                    const s = typeof l.source === 'object' ? l.source.id : l.source;
                    return s === selectedNode?.id;
                  });
                  const targetTitle =
                    matchLink &&
                    (typeof matchLink.target === 'object'
                      ? matchLink.target.id
                      : matchLink.target);
                  const targetNode = nodes.find((n) => n.id === targetTitle);
                  if (targetNode?.discovery) {
                    onOpenDiscovery(targetNode.discovery, 'reader');
                  } else if (discoveries[0]) {
                    onOpenDiscovery(discoveries[0], 'reader');
                  }
                }}
                className="w-full px-4 py-2.5 rounded-full bg-white text-[#0B0A0E] text-xs font-bold hover:bg-white/90 transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Open Linked Research Workspace</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
