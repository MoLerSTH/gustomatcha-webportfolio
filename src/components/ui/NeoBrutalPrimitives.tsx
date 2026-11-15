import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { AccentColor } from '@/data/portfolioData';

export type NeoAccentVariant = AccentColor | 'white' | 'dark';

export interface AccentToken {
  hex: string;
  inkHex: string;
  surfaceClass: string;
  headerBgClass: string;
  dotColor: string;
}

/**
 * Friendly Neo-Brutalist color tokens.
 * Every foreground/background pair maintains >= 4.5:1 WCAG AA text contrast.
 */
export const ACCENT_STYLES: Record<NeoAccentVariant, AccentToken> = {
  yellow: {
    hex: '#FFE600',
    inkHex: '#0A0A0A',
    surfaceClass: 'bg-[#FFE600] text-[#0A0A0A]',
    headerBgClass: 'bg-[#FFE600] text-[#0A0A0A]',
    dotColor: '#FFE600',
  },
  mint: {
    hex: '#00F5D4',
    inkHex: '#0A0A0A',
    surfaceClass: 'bg-[#00F5D4] text-[#0A0A0A]',
    headerBgClass: 'bg-[#00F5D4] text-[#0A0A0A]',
    dotColor: '#00F5D4',
  },
  coral: {
    hex: '#FF5D8F',
    inkHex: '#0A0A0A',
    surfaceClass: 'bg-[#FF5D8F] text-[#0A0A0A]',
    headerBgClass: 'bg-[#FF5D8F] text-[#0A0A0A]',
    dotColor: '#FF5D8F',
  },
  cobalt: {
    hex: '#3A86FF',
    inkHex: '#0A0A0A',
    surfaceClass: 'bg-[#3A86FF] text-[#0A0A0A]',
    headerBgClass: 'bg-[#3A86FF] text-[#0A0A0A]',
    dotColor: '#3A86FF',
  },
  white: {
    hex: '#FFFFFF',
    inkHex: '#0A0A0A',
    surfaceClass: 'bg-[var(--bg-canvas)] text-[var(--ink)]',
    headerBgClass: 'bg-[var(--bg-surface)] text-[var(--ink)]',
    dotColor: '#FFFFFF',
  },
  dark: {
    hex: '#0A0A0A',
    inkHex: '#FFFFFF',
    surfaceClass: 'bg-[#0A0A0A] text-[#FFFFFF]',
    headerBgClass: 'bg-[#0A0A0A] text-[#FFFFFF]',
    dotColor: '#0A0A0A',
  },
};

const BUTTON_SIZES = {
  sm: 'px-3.5 py-2 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
} as const;

type ButtonBaseProps = {
  variant?: NeoAccentVariant;
  size?: keyof typeof BUTTON_SIZES;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
  children: ReactNode;
};

export type NeoButtonProps =
  | (ButtonBaseProps &
      Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> & {
        href?: undefined;
      })
  | (ButtonBaseProps &
      Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonBaseProps> & {
        href: string;
        external?: boolean;
      });

function isLinkButton(
  props: NeoButtonProps
): props is Extract<NeoButtonProps, { href: string }> {
  return typeof props.href === 'string';
}

function getNeoButtonClassName(
  variant: NeoAccentVariant = 'yellow',
  size: keyof typeof BUTTON_SIZES = 'md',
  className?: string
): string {
  return cn(
    'neo-btn-tactile inline-flex items-center justify-center gap-2 font-mono font-bold uppercase tracking-wider cursor-pointer no-underline',
    ACCENT_STYLES[variant].surfaceClass,
    BUTTON_SIZES[size],
    className
  );
}

function renderButtonInner(
  leftIcon: ReactNode | undefined,
  children: ReactNode,
  rightIcon: ReactNode | undefined
) {
  return (
    <>
      {leftIcon ? <span aria-hidden="true">{leftIcon}</span> : null}
      <span>{children}</span>
      {rightIcon ? <span aria-hidden="true">{rightIcon}</span> : null}
    </>
  );
}

/**
 * Tactile Neo-Brutalist action control.
 * Renders native <button> for in-page actions and <a> strictly for navigation.
 */
export function NeoButton(props: NeoButtonProps) {
  if (isLinkButton(props)) {
    const {
      href,
      external,
      variant,
      size,
      leftIcon,
      rightIcon,
      className,
      children,
      ...anchorRest
    } = props;

    return (
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        className={getNeoButtonClassName(variant, size, className)}
        {...anchorRest}
      >
        {renderButtonInner(leftIcon, children, rightIcon)}
      </a>
    );
  }

  const {
    type = 'button',
    variant,
    size,
    leftIcon,
    rightIcon,
    className,
    children,
    ...rest
  } = props;

  if ('href' in rest) {
    delete (rest as { href?: unknown }).href;
  }

  return (
    <button
      type={type}
      className={getNeoButtonClassName(variant, size, className)}
      {...rest}
    >
      {renderButtonInner(leftIcon, children, rightIcon)}
    </button>
  );
}

export interface NeoBadgeProps {
  variant?: NeoAccentVariant;
  pulseDot?: boolean;
  dotVariant?: Exclude<NeoAccentVariant, 'white' | 'dark'>;
  className?: string;
  children: ReactNode;
}

/**
 * Crisp monospace technical pill badge.
 * Never communicates status by color alone; always pairs indicator with label text.
 */
export function NeoBadge({
  variant = 'white',
  pulseDot = false,
  dotVariant = 'mint',
  className,
  children,
}: NeoBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 border-2 border-[var(--ui-border-color)] neo-shadow-sm px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider',
        ACCENT_STYLES[variant].surfaceClass,
        className
      )}
    >
      {pulseDot ? (
        <span
          aria-hidden="true"
          className={cn('neo-live-dot', ACCENT_STYLES[dotVariant].surfaceClass)}
        />
      ) : null}
      <span>{children}</span>
    </span>
  );
}

export interface NeoCardProps {
  variant?: NeoAccentVariant;
  headerVariant?: NeoAccentVariant;
  windowTitle?: string;
  windowTag?: string;
  interactive?: boolean;
  as?: 'div' | 'article' | 'section';
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

/**
 * Modular Friendly Neo-Brutalist surface card with thick borders,
 * hard offset shadow, and optional GUSTO_OS window chrome.
 */
export function NeoCard({
  variant = 'white',
  headerVariant = 'yellow',
  windowTitle,
  windowTag,
  interactive = false,
  as: Component = 'div',
  className,
  bodyClassName,
  children,
}: NeoCardProps) {
  return (
    <Component
      className={cn(
        'neo-border neo-shadow overflow-hidden',
        ACCENT_STYLES[variant].surfaceClass,
        interactive && 'neo-card-interactive',
        className
      )}
    >
      {windowTitle || windowTag ? (
        <div
          className={cn(
            'neo-border-b flex items-center justify-between gap-3 px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider',
            ACCENT_STYLES[headerVariant].headerBgClass
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span aria-hidden="true" className="inline-flex items-center gap-1.5 shrink-0">
              <span className="inline-block size-2.5 border-2 border-[#0A0A0A] bg-[#FF5D8F]" />
              <span className="inline-block size-2.5 border-2 border-[#0A0A0A] bg-[#FFE600]" />
              <span className="inline-block size-2.5 border-2 border-[#0A0A0A] bg-[#00F5D4]" />
            </span>
            {windowTitle ? <span className="truncate">{windowTitle}</span> : null}
          </div>
          {windowTag ? <span className="shrink-0 opacity-90">{windowTag}</span> : null}
        </div>
      ) : null}
      <div className={cn('p-5 sm:p-6', bodyClassName)}>{children}</div>
    </Component>
  );
}

export interface NeoSectionHeaderProps {
  indexCode: string;
  title: string;
  subtitle?: string;
  accent?: AccentColor;
  headingLevel?: 'h2' | 'h3';
  headingId?: string;
  className?: string;
}

/**
 * Architectural section header keeping sequential heading levels (h2 -> h3).
 */
export function NeoSectionHeader({
  indexCode,
  title,
  subtitle,
  accent = 'yellow',
  headingLevel = 'h2',
  headingId,
  className,
}: NeoSectionHeaderProps) {
  const HeadingTag = headingLevel;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div>
        <NeoBadge variant={accent} pulseDot dotVariant="mint">
          {indexCode}
        </NeoBadge>
      </div>
      <HeadingTag
        id={headingId}
        className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.08]"
      >
        {title}
      </HeadingTag>
      {subtitle ? (
        <p className="max-w-2xl text-base sm:text-lg text-[var(--ink-muted)] font-normal">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
