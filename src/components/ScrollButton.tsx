'use client'

interface ScrollButtonProps {
  targetSelector: string
  children: React.ReactNode
  className?: string
  /** 'start' | 'center' | 'end' — para que el botón "Agendar ahora" quede visible usar center */
  scrollBlock?: ScrollLogicalPosition
}

export default function ScrollButton({ targetSelector, children, className, scrollBlock = 'start' }: ScrollButtonProps) {
  const handleClick = () => {
    const element = document.querySelector(targetSelector)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: scrollBlock })
    }
  }

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  )
}
