import React, { useState } from 'react';
import { HelpCircleIcon } from './Icons';

export default function Tooltip({ content, position = 'top' }) {
  const [visible, setVisible] = useState(false);

  return (
    <span 
      className="tooltip-container"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      tabIndex={0}
      role="tooltip"
      aria-label={content}
    >
      <HelpCircleIcon className="tooltip-icon" />
      {visible && (
        <span className={`tooltip-bubble tooltip-${position}`}>
          {content}
        </span>
      )}
    </span>
  );
}
