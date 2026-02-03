'use client'

interface ScrollButtonProps {
  targetSelector: string
  children: React.ReactNode
  className?: string
}

export default function ScrollButton({ targetSelector, children, className }: ScrollButtonProps) {
  const handleClick = () => {
    const element = document.querySelector(targetSelector)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  )
}
