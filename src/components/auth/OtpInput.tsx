import { useRef, type KeyboardEvent, type ClipboardEvent } from 'react'
import { englishDigitsLtrClassName, toEnglishDigits } from '@/lib/englishDigits'
import { cn } from '@/lib/utils'

const OTP_LENGTH = 6

interface OtpInputProps {
  value: string[]
  onChange: (digits: string[]) => void
  className?: string
  disabled?: boolean
}

export function OtpInput({ value, onChange, className, disabled }: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  const updateDigit = (index: number, digit: string) => {
    const next = [...value]
    next[index] = toEnglishDigits(digit)
    onChange(next)
    if (digit && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = toEnglishDigits(e.clipboardData.getData('text'))
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH)
    if (!pasted) return
    const next = Array.from({ length: OTP_LENGTH }, (_, i) => pasted[i] ?? '')
    onChange(next)
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1)
    inputsRef.current[focusIndex]?.focus()
  }

  return (
    <div className={cn('flex gap-3 justify-center', englishDigitsLtrClassName, className)} lang="en" dir="ltr">
      {Array.from({ length: OTP_LENGTH }, (_, i) => {
        const filled = Boolean(value[i])
        return (
          <input
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[i] ?? ''}
            onChange={(e) =>
              updateDigit(i, toEnglishDigits(e.target.value).replace(/\D/g, ''))
            }
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={cn(
              'h-12 w-[91px] rounded-md border border-primary-200 text-center text-body-2-medium',
              'focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary',
              'disabled:cursor-not-allowed disabled:opacity-50',
              filled
                ? 'bg-primary-subtle text-primary'
                : 'bg-white text-neutral-600'
            )}
            aria-label={`Digit ${i + 1}`}
          />
        )
      })}
    </div>
  )
}
