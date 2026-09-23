import React from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

const Alert = ({ type = 'info', message }) => {
  if (!message) return null;

  let className = 'alert alert-info';
  let Icon = Info;

  if (type === 'error') {
    className = 'alert alert-error';
    Icon = AlertCircle;
  } else if (type === 'success') {
    className = 'alert alert-success';
    Icon = CheckCircle;
  }

  return (
    <div className={className}>
      <Icon size={20} className="mt-1" />
      <div>{message}</div>
    </div>
  );
};

export default Alert;
