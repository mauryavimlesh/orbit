import React, { useMemo, useState } from 'react';
import katex from 'katex';
import { Check, Code2, Copy, Eye } from 'lucide-react';

export function normalizeLatexFormula(rawFormula: string): string {
  if (!rawFormula) return '';
  let clean = rawFormula.trim();

  // Strip outer display/inline delimiters if wrapped
  if (clean.startsWith('$$') && clean.endsWith('$$') && clean.length > 4) {
    clean = clean.slice(2, -2).trim();
  } else if (clean.startsWith('\\[') && clean.endsWith('\\]') && clean.length > 4) {
    clean = clean.slice(2, -2).trim();
  } else if (clean.startsWith('\\(') && clean.endsWith('\\)') && clean.length > 4) {
    clean = clean.slice(2, -2).trim();
  } else if (clean.startsWith('$') && clean.endsWith('$') && clean.length > 2 && !clean.slice(1, -1).includes('$')) {
    clean = clean.slice(1, -1).trim();
  }

  // Normalize common Unicode math characters into proper LaTeX macros
  return clean
    .replace(/Θ/g, '\\Theta ')
    .replace(/Λ/g, '\\Lambda ')
    .replace(/λ/g, '\\lambda ')
    .replace(/μ/g, '\\mu ')
    .replace(/Δ/g, '\\Delta ')
    .replace(/δ/g, '\\delta ')
    .replace(/σ/g, '\\sigma ')
    .replace(/Σ/g, '\\Sigma ')
    .replace(/π/g, '\\pi ')
    .replace(/Π/g, '\\Pi ')
    .replace(/α/g, '\\alpha ')
    .replace(/β/g, '\\beta ')
    .replace(/γ/g, '\\gamma ')
    .replace(/Γ/g, '\\Gamma ')
    .replace(/ε/g, '\\varepsilon ')
    .replace(/ϵ/g, '\\epsilon ')
    .replace(/θ/g, '\\theta ')
    .replace(/ω/g, '\\omega ')
    .replace(/Ω/g, '\\Omega ')
    .replace(/φ/g, '\\phi ')
    .replace(/Φ/g, '\\Phi ')
    .replace(/ψ/g, '\\psi ')
    .replace(/Ψ/g, '\\Psi ')
    .replace(/ρ/g, '\\rho ')
    .replace(/τ/g, '\\tau ')
    .replace(/η/g, '\\eta ')
    .replace(/∇/g, '\\nabla ')
    .replace(/∂/g, '\\partial ')
    .replace(/∫/g, '\\int ')
    .replace(/∑/g, '\\sum ')
    .replace(/∏/g, '\\prod ')
    .replace(/∞/g, '\\infty ')
    .replace(/√/g, '\\sqrt ')
    .replace(/·/g, '\\cdot ')
    .replace(/×/g, '\\times ')
    .replace(/±/g, '\\pm ')
    .replace(/≤/g, '\\le ')
    .replace(/≥/g, '\\ge ')
    .replace(/≈/g, '\\approx ')
    .replace(/≠/g, '\\ne ')
    .replace(/≡/g, '\\equiv ')
    .replace(/∝/g, '\\propto ')
    .replace(/∈/g, '\\in ')
    .replace(/∉/g, '\\notin ')
    .replace(/⊂/g, '\\subset ')
    .replace(/⊆/g, '\\subseteq ')
    .replace(/∪/g, '\\cup ')
    .replace(/∩/g, '\\cap ')
    .replace(/→/g, '\\rightarrow ')
    .replace(/←/g, '\\leftarrow ')
    .replace(/↔/g, '\\leftrightarrow ')
    .replace(/⇒/g, '\\Rightarrow ')
    .replace(/⇔/g, '\\Leftrightarrow ')
    .replace(/ℝ/g, '\\mathbb{R}')
    .replace(/ℂ/g, '\\mathbb{C}')
    .replace(/ℕ/g, '\\mathbb{N}')
    .replace(/ℤ/g, '\\mathbb{Z}')
    .replace(/𝔼/g, '\\mathbb{E}')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/⁻¹/g, '^{-1}')
    .replace(/½/g, '\\frac{1}{2}');
}

interface MathFormulaBlockProps {
  formula: string;
  className?: string;
  title?: string;
  inline?: boolean;
  showControls?: boolean;
}

export const MathFormulaBlock: React.FC<MathFormulaBlockProps> = ({
  formula,
  className = '',
  title,
  inline = false,
  showControls = true,
}) => {
  const [showRawTex, setShowRawTex] = useState(false);
  const [copied, setCopied] = useState(false);

  const normalized = useMemo(() => normalizeLatexFormula(formula), [formula]);

  const renderedHtml = useMemo(() => {
    if (!normalized) return null;
    try {
      return katex.renderToString(normalized, {
        displayMode: !inline,
        throwOnError: false,
        strict: false,
        trust: true,
        output: 'html',
      });
    } catch {
      return null;
    }
  }, [normalized, inline]);

  const handleCopyTex = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(normalized || formula);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (inline) {
    return renderedHtml ? (
      <span
        className={`inline-block align-middle px-1 text-emerald-200 ${className}`}
        title={title || formula}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    ) : (
      <code className={`px-1.5 py-0.5 rounded bg-white/10 text-emerald-300 font-mono text-xs ${className}`}>
        {formula}
      </code>
    );
  }

  return (
    <div
      className={`group relative w-full max-w-full overflow-x-auto py-3.5 px-4 sm:px-6 rounded-xl bg-[#07090E]/90 border border-emerald-500/20 text-emerald-200 shadow-inner ${className}`}
      title={title || formula}
    >
      {showControls && (
        <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-white/[0.06] text-[10px] text-white/40 font-mono">
          <span className="uppercase tracking-wider text-emerald-300/75 truncate">
            {title || 'LaTeX Typographic Equation'}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowRawTex((prev) => !prev);
              }}
              className="px-2 py-0.5 rounded bg-white/[0.05] hover:bg-white/[0.12] text-white/60 hover:text-white transition-colors inline-flex items-center gap-1 cursor-pointer"
              title={showRawTex ? 'Show rendered KaTeX typography' : 'Inspect raw LaTeX source'}
            >
              {showRawTex ? <Eye className="w-3 h-3" /> : <Code2 className="w-3 h-3" />}
              {showRawTex ? 'Rendered' : 'TeX'}
            </button>
            <button
              type="button"
              onClick={handleCopyTex}
              className="px-2 py-0.5 rounded bg-white/[0.05] hover:bg-white/[0.12] text-white/60 hover:text-white transition-colors inline-flex items-center gap-1 cursor-pointer"
              title="Copy LaTeX source"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {showRawTex ? (
        <pre className="font-mono text-xs sm:text-sm text-amber-200/90 whitespace-pre-wrap break-all select-all py-1">
          {normalized || formula}
        </pre>
      ) : renderedHtml ? (
        <div
          className="katex-container overflow-x-auto py-1 text-base sm:text-lg text-center sm:text-left select-all"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      ) : (
        <span className="font-mono tracking-wide text-sm sm:text-base">{formula}</span>
      )}
    </div>
  );
};

/**
 * Renders text that may contain embedded LaTeX expressions:
 * - Display math: $$...$$ or \[...\]
 * - Inline math: $...$ or \(...\)
 */
export const LatexTextRenderer: React.FC<{
  text: string;
  className?: string;
}> = ({ text, className = '' }) => {
  const segments = useMemo(() => {
    if (!text) return [];
    // Match $$...$$, \[...\], \(...\), or inline $...$ (avoiding currency like $100)
    const tokenRegex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$(?!\s)[^$\n]+?(?<!\s)\$)/g;
    const parts: Array<{ type: 'text' | 'display' | 'inline'; content: string }> = [];
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push({ type: 'text', content: text.slice(lastIdx, match.index) });
      }
      const token = match[0];
      if (token.startsWith('$$') || token.startsWith('\\[')) {
        parts.push({ type: 'display', content: token });
      } else {
        // Verify inline $...$ isn't two plain numbers
        const inner = token.startsWith('\\(') ? token.slice(2, -2) : token.slice(1, -1);
        if (/^\d+([.,]\d+)?$/.test(inner.trim())) {
          parts.push({ type: 'text', content: token });
        } else {
          parts.push({ type: 'inline', content: inner });
        }
      }
      lastIdx = match.index + token.length;
    }

    if (lastIdx < text.length) {
      parts.push({ type: 'text', content: text.slice(lastIdx) });
    }
    return parts;
  }, [text]);

  if (!segments.some((s) => s.type !== 'text')) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {segments.map((seg, idx) => {
        if (seg.type === 'display') {
          return (
            <div key={idx} className="my-3">
              <MathFormulaBlock formula={seg.content} showControls={false} />
            </div>
          );
        }
        if (seg.type === 'inline') {
          return <MathFormulaBlock key={idx} formula={seg.content} inline showControls={false} />;
        }
        return <React.Fragment key={idx}>{seg.content}</React.Fragment>;
      })}
    </span>
  );
};
