'use client'

const MOBILE_BREAKPOINT = 768

interface ScrollButtonProps {
  targetSelector: string
  children: React.ReactNode
  className?: string
  /** 'start' | 'center' | 'end' — para que el botón "Agendar ahora" quede visible usar center */
  scrollBlock?: ScrollLogicalPosition
  /** En móvil usar este target (ej. .process-section) para que se vea el paso 1 */
  mobileTargetSelector?: string
  mobileScrollBlock?: ScrollLogicalPosition
}

export default function ScrollButton({
  targetSelector,
  children,
  className,
  scrollBlock = 'start',
  mobileTargetSelector,
  mobileScrollBlock = 'start',
}: ScrollButtonProps) {
  const handleClick = () => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT
    const selector = isMobile && mobileTargetSelector ? mobileTargetSelector : targetSelector
    const block = isMobile && mobileTargetSelector ? mobileScrollBlock : scrollBlock
    const element = document.querySelector(selector)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block })
    }
  }

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  )
}
