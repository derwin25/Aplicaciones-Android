import React, { useMemo } from 'react';
import katex from 'katex';

interface MathViewProps {
  content: string;
  className?: string;
  displayMode?: boolean;
}

export const MathView: React.FC<MathViewProps> = ({
  content,
  className = '',
  displayMode = false,
}) => {
  const renderedHtml = useMemo(() => {
    if (!content) return '';

    // If the whole content is intended as a pure math formula or displayMode is true
    if (displayMode) {
      try {
        const clean = content.replace(/^(\$\$|\$)|(\$\$|\$)$/g, '').trim();
        return katex.renderToString(clean, {
          displayMode: true,
          throwOnError: false,
        });
      } catch {
        return content;
      }
    }

    // Split content by $$block$$ and $inline$
    // Using regex to match block math first, then inline math
    const parts: string[] = [];
    const regex = /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
      // Text before formula
      if (match.index > lastIndex) {
        const plainText = content.substring(lastIndex, match.index);
        parts.push(escapeHtml(plainText).replace(/\n/g, '<br/>'));
      }

      const rawFormula = match[0];
      const isBlock = rawFormula.startsWith('$$') && rawFormula.endsWith('$$');
      const formulaInner = isBlock
        ? rawFormula.substring(2, rawFormula.length - 2).trim()
        : rawFormula.substring(1, rawFormula.length - 1).trim();

      try {
        const mathHtml = katex.renderToString(formulaInner, {
          displayMode: isBlock,
          throwOnError: false,
        });
        parts.push(mathHtml);
      } catch {
        parts.push(escapeHtml(rawFormula));
      }

      lastIndex = regex.lastIndex;
    }

    // Trailing text
    if (lastIndex < content.length) {
      const remaining = content.substring(lastIndex);
      parts.push(escapeHtml(remaining).replace(/\n/g, '<br/>'));
    }

    return parts.join('');
  }, [content, displayMode]);

  return (
    <span
      className={`inline-block leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default MathView;
