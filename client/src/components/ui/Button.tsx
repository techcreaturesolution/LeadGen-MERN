import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'danger';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', children, ...props }, ref) => {
    let baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none';

    let variantStyles = '';
    if (variant === 'default') {
      variantStyles = 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20';
    } else if (variant === 'outline') {
      variantStyles = 'border border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-100';
    } else if (variant === 'secondary') {
      variantStyles = 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700';
    } else if (variant === 'ghost') {
      variantStyles = 'hover:bg-zinc-800 text-zinc-300 hover:text-white';
    }

    let sizeStyles = 'px-4 py-2 text-sm rounded-lg';
    if (size === 'sm') sizeStyles = 'px-3 py-1.5 text-xs rounded-md';
    if (size === 'lg') sizeStyles = 'px-8 py-3.5 text-base rounded-full';
    if (size === 'icon') sizeStyles = 'h-9 w-9 rounded-lg p-0';

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
