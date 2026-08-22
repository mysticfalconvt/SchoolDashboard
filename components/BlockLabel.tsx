import React from 'react';
import { BLOCK_COLOR_HEX } from '../lib/blockNames';

interface BlockLabelProps {
  name: string;
  color?: string | null;
  className?: string;
}

/** A block's colour name with its swatch, so the schedule reads at a glance. */
const BlockLabel: React.FC<BlockLabelProps> = ({
  name,
  color,
  className = '',
}) => {
  const hex = color ? BLOCK_COLOR_HEX[color] : undefined;
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {hex && (
        <span
          aria-hidden="true"
          className="inline-block w-2.5 h-2.5 rounded-full border border-black/20"
          style={{ backgroundColor: hex }}
        />
      )}
      {name}
    </span>
  );
};

export default BlockLabel;
