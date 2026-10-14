import Link from 'next/link';
import type { ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'outline';

const variantClasses: Record<Variant, string> = {
  primary: 'bg-water-500 text-white hover:bg-water-600',
  secondary: 'bg-navy-900 text-white hover:bg-navy-800',
  outline: 'border border-navy-900 text-navy-900 hover:bg-navy-950 hover:text-white',
};

const baseClasses =
  'inline-flex min-h-11 items-center justify-center rounded-md px-6 py-2.5 text-sm font-semibold transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-water-500';

interface ButtonProps {
  variant?: Variant;
  className?: string;
  children: ReactNode;
  /** 传入 href 时渲染为 <Link>，否则渲染为 <button> */
  href?: string;
  target?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  onClick?: () => void;
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  href,
  target,
  type = 'button',
  disabled,
  onClick,
}: ButtonProps) {
  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} target={target} className={classes} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} disabled={disabled} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
