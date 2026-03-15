import Image from 'next/image'

const SIZE_CLASSES = {
  xs: 'w-7 h-7',    // 28px — tiny badges
  sm: 'w-9 h-9',    // 36px — sidebar header
  md: 'w-12 h-12',  // 48px — nav / small headers
  lg: 'w-16 h-16',  // 64px — dashboard empty state
  xl: 'w-24 h-24',  // 96px — sign-in page hero (larger than before)
} as const

type LogoSize = keyof typeof SIZE_CLASSES

interface LogoMarkProps {
  size?: LogoSize
  className?: string
}

/**
 * LogoMark — Danu brand logo.
 *
 * Uses mix-blend-multiply so the PNG's white background merges with the
 * amber-50 container, leaving only the gold illustration visible on any
 * surface — both light and dark mode.
 *
 * scale-[1.35] zooms into the illustration, removing the PNG's built-in
 * whitespace padding so the logo fills the visible area.
 */
export function LogoMark({ size = 'sm', className = '' }: LogoMarkProps) {
  return (
    <div
      className={`
        relative shrink-0 rounded-xl overflow-hidden
        bg-amber-50
        ring-1 ring-amber-200/60 dark:ring-amber-300/15
        shadow-sm dark:shadow-[0_0_14px_rgba(212,175,55,0.10)]
        ${SIZE_CLASSES[size]}
        ${className}
      `}
    >
      <Image
        src="/images/logo.png"
        alt="Danu"
        fill
        className="object-contain mix-blend-multiply scale-[1.35]"
        sizes="96px"
        priority
      />
    </div>
  )
}
