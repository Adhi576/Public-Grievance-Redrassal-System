import React from 'react';

const Badge = ({ text, color = 'gray' }) => {
  let colorClass = `badge-${color}`;
  
  // Helper to map status to colors automatically if color is not explicitly provided
  if (!color) {
    switch (text) {
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        colorClass = 'badge-blue';
        break;
      case 'ASSIGNED':
      case 'IN_PROGRESS':
        colorClass = 'badge-yellow';
        break;
      case 'RESOLVED':
      case 'CLOSED':
        colorClass = 'badge-green';
        break;
      case 'ESCALATED':
      case 'REOPENED':
        colorClass = 'badge-red';
        break;
      case 'PENDING_CITIZEN_VERIFICATION':
      case 'PENDING_CLOSURE_APPROVAL':
        colorClass = 'badge-orange';
        break;
      default:
        colorClass = 'badge-gray';
    }
  }

  return (
    <span className={`badge ${colorClass}`}>
      {text ? text.replace(/_/g, ' ') : ''}
    </span>
  );
};

export default Badge;
