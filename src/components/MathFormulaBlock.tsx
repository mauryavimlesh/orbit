import React, { useMemo } from 'react';
import katex from 'katex';

interface MathFormulaBlockProps {
  formula: string;
  className?: string;
  title?: string;
}

export const MathFormulaBlock: React.FC<MathFormulaBlockProps> = ({
  formula,
  className = '',
  title,
}) => {
  const renderedHtml = useMemo(() => {
    try {
      // Clean up common math notations for KaTeX
      let cleanFormula = formula
        .replace(/Θ/g, '\\Theta')
        .replace(/Λ/g, '\\Lambda')
        .replace(/λ/g, '\\lambda')
        .replace(/μ/g, '\\mu')
        .replace(/Δ/g, '\\Delta')
        .replace(/δ/g, '\\delta')
        .replace(/σ/g, '\\sigma')
        .replace(/π/g, '\\pi')
        .replace(/·/g, '\\cdot ')
        .replace(/×/g, '\\times ')
        .replace(/±/g, '\\pm ')
        .replace(/≤/g, '\\le ')
        .replace(/≥/g, '\\ge ')
        .replace(/≈/g, '\\approx ')
        .replace(/≠/g, '\\ne ')
        .replace(/²/g, '^2')
        .replace(/³/g, '^3')
        .replace(/⁻¹/g, '^{-1}')
        .replace(/½/g, '\\frac{1}{2}');

      return katex.renderToString(cleanFormula, {
        displayMode: true,
        throwOnError: false,
        strict: false,
        output: 'html',
      });
    } catch {
      return null;
    }
  }, [formula]);

  return (
    <div
      className={`w-full max-w-full overflow-x-auto py-3 px-4 sm:px-6 rounded-xl bg-black/60 border border-white/10 text-emerald-300 font-mono text-sm sm:text-base select-all text-center sm:text-left ${className}`}
      title={title || formula}
    >
      {renderedHtml ? (
        <div
          className="katex-container inline-block min-w-min"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      ) : (
        <span className="font-mono tracking-wide">{formula}</span>
      )}
    </div>
  );
};
