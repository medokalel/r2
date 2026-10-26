import type { ReactNode } from 'react'
import {
  englishDigitsClassName,
  englishDigitsLtrClassName,
  toEnglishDigits,
} from '@/lib/englishDigits'
import { cn } from '@/lib/utils'

interface WesternDigitsProps {
  children: ReactNode
  className?: string
  ltr?: boolean
}

export function WesternDigits({ children, className, ltr = false }: WesternDigitsProps) {
  if (typeof children !== 'string' && typeof children !== 'number') {
    return children
  }

  return (
    <span
      className={cn(ltr ? englishDigitsLtrClassName : englishDigitsClassName, className)}
      lang="en"
      dir={ltr ? 'ltr' : undefined}
    >
      {toEnglishDigits(String(children))}
    </span>
  )
}
