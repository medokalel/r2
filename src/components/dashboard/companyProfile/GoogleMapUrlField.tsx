import { FormField, TextField } from '@/components/ui'
import { GoogleMapIcon } from './Primitives'

interface GoogleMapUrlFieldProps {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  error?: string
  onBlur?: () => void
}

export function GoogleMapUrlField({
  label,
  placeholder,
  value,
  onChange,
  required,
  error,
  onBlur,
}: GoogleMapUrlFieldProps) {
  return (
    <FormField label={label} required={required}>
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute start-3">
          <GoogleMapIcon />
        </span>
        <TextField
          type="url"
          dir="ltr"
          placeholder={placeholder}
          className="ps-10"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          error={error}
        />
      </div>
    </FormField>
  )
}
