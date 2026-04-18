import React from 'react';
import clsx from 'clsx'; // Utility for constructing className strings conditionally

const Button = ({ children, variant = 'primary', className, ...props }) => {
  return (
    <button 
      className={clsx('btn', `btn-${variant}`, className)} 
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
