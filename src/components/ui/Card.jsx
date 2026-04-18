import React from 'react';
import clsx from 'clsx';

const Card = ({ children, className, title, action }) => {
  return (
    <div className={clsx('card', className)}>
      {(title || action) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          {title && <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: '600' }}>{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};

export default Card;
