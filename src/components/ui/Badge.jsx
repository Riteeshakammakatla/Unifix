import React from 'react';

const Badge = ({ status }) => {
  const statusMap = {
    open: 'badge-open',
    assigned: 'badge-assigned',
    inprogress: 'badge-inprogress',
    resolved: 'badge-resolved',
    escalated: 'badge-escalated',
  };

  const badgeClass = statusMap[status.toLowerCase().replace(' ', '')] || 'badge-open';

  return (
    <span className={`badge ${badgeClass}`}>
      {status}
    </span>
  );
};

export default Badge;
