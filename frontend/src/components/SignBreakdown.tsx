import React from 'react';

interface SignBreakdownProps {
  fswToken: string;
}

function parseSymbolDescriptions(fsw: string): { id: string; description: string }[] {
  const symbols: { id: string; description: string }[] = [];
  const pattern = /S([0-9a-fA-F]{5})/gi;
  let match;

  while ((match = pattern.exec(fsw)) !== null) {
    const hex = match[1];
    const symId = parseInt(hex.slice(0, 3), 16);
    let desc = 'Unknown symbol';

    if (symId >= 0x100 && symId <= 0x204) desc = 'Hand shape';
    else if (symId >= 0x205 && symId <= 0x214) desc = 'Straight movement';
    else if (symId >= 0x215 && symId <= 0x21D) desc = 'Curved movement';
    else if (symId >= 0x21E && symId <= 0x22F) desc = 'Diagonal movement';
    else if (symId >= 0x230 && symId <= 0x245) desc = 'Floor plane movement';
    else if (symId >= 0x246 && symId <= 0x260) desc = 'Rotation';
    else if (symId >= 0x261 && symId <= 0x27F) desc = 'Finger/wrist movement';
    else if (symId >= 0x300 && symId <= 0x36D) desc = 'Contact/touch';
    else if (symId >= 0x370 && symId <= 0x37E) desc = 'Head/face';
    else if (symId >= 0x380 && symId <= 0x3FF) desc = 'Body';

    symbols.push({ id: `S${hex}`, description: desc });
  }

  return symbols;
}

const SignBreakdown: React.FC<SignBreakdownProps> = ({ fswToken }) => {
  const symbols = parseSymbolDescriptions(fswToken);

  if (symbols.length === 0) {
    return <p className="text-sm text-theme-muted">No symbols found in this token.</p>;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-theme-primary">Symbol Breakdown</h4>
      <div className="space-y-1">
        {symbols.map((sym, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-theme-secondary">
            <code className="text-xs font-mono text-teal-600">{sym.id}</code>
            <span className="text-sm text-theme-secondary">{sym.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SignBreakdown;
