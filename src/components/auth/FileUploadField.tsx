import { useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { fieldLabelClassName, RequiredMark } from '@/components/ui'
import { FileUploadIcon } from '@/components/auth/FileUploadIcon'
import {
  isValidFileSize,
  MAX_UPLOAD_FILE_SIZE_BYTES,
  MAX_UPLOAD_FILE_SIZE_MB,
} from '@/lib/fileValidation'
import { englishDigitsClassName } from '@/lib/englishDigits'
import { cn } from '@/lib/utils'

interface FileUploadFieldProps {
  label: string
  required?: boolean
  accept?: string
  file: File | null
  savedFileName?: string
  onChange: (file: File | null) => void
  hint?: string
  maxSizeBytes?: number
  className?: string
}

export function FileUploadField({
  label,
  required,
  accept = '.pdf',
  file,
  savedFileName,
  onChange,
  hint,
  maxSizeBytes = MAX_UPLOAD_FILE_SIZE_BYTES,
  className,
}: FileUploadFieldProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | undefined>()

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) {
      setError(undefined)
      onChange(null)
      return
    }

    if (!isValidFileSize(selectedFile, maxSizeBytes)) {
      setError(
        t('validation.fileTooLarge', { size: MAX_UPLOAD_FILE_SIZE_MB })
      )
      onChange(null)
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    setError(undefined)
    onChange(selectedFile)
  }

  return (
    <div className={cn('space-y-2 w-full', className)}>
      <div
        className={cn(
          'flex flex-col items-center gap-4 rounded-lg border border-dashed bg-white px-8 py-4',
          error ? 'border-error-400' : 'border-primary-300'
        )}
      >
        <FileUploadIcon className="size-10 shrink-0" />
        <div className="w-full space-y-2 text-center">
          <p className={fieldLabelClassName}>
            {label}
            {required && <RequiredMark />}
          </p>
          <p className="text-body-2 text-neutral-700">
            {hint ?? (
              <Trans
                i18nKey="register.fileUploadHint"
                components={{
                  size: <span lang="en" className={englishDigitsClassName} />,
                }}
              />
            )}
          </p>
          {file ? (
            <p className="truncate text-body-3 text-primary max-w-full">{file.name}</p>
          ) : (
            savedFileName && (
              <p className="truncate text-body-3 text-neutral-600 max-w-full">
                {savedFileName} · {t('register.reselectFile')}
              </p>
            )
          )}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            'inline-flex h-[33px] min-w-[114px] items-center justify-center rounded-md',
            'border border-neutral-300 bg-white px-6 font-sans text-body font-medium leading-[1.6] text-primary',
            'transition-colors hover:bg-neutral-50'
          )}
        >
          {t('register.selectFile')}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />
      </div>
      {error && <p className="text-caption text-error-700">{error}</p>}
    </div>
  )
}
