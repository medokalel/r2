import { useTranslation } from 'react-i18next'
import { NationalAddressLookup } from '@/components/dashboard/companyProfile/NationalAddressSection'
import { AppIcon, ReceiptIcon } from '@/components/icons'
import { TextField } from '@/components/ui'
import type { CabTaxField, CabTaxProfile } from '@/lib/api/cabTaxProfileApi'
import type { NationalAddress } from '@/lib/api/nationalAddressApi'

interface Props {
  value: CabTaxProfile
  onChange: (next: CabTaxProfile) => void
  errors: Partial<Record<CabTaxField, string>>
  /** The CAB is in Saudi Arabia: the VAT number is needed to issue invoices. */
  required: boolean
}

/**
 * "Tax invoice details (ZATCA)" on the CAB company profile: VAT registration number and the
 * seller national address printed on every tax invoice. The short-address lookup (Saudi Post)
 * fills the address fields.
 */
export function CabTaxIdentitySection({ value, onChange, errors, required }: Props) {
  const { t } = useTranslation()
  const set = (field: CabTaxField, next: string) => onChange({ ...value, [field]: next })
  const digits = (field: CabTaxField, max: number) => (e: React.ChangeEvent<HTMLInputElement>) => set(field, e.target.value.replace(/\D/g, '').slice(0, max))

  const fillFromLookup = (address: NationalAddress) =>
    onChange({
      ...value,
      addressStreet: address.street || value.addressStreet,
      addressBuildingNumber: address.buildingNumber || value.addressBuildingNumber,
      addressAdditionalNumber: address.additionalNumber || value.addressAdditionalNumber,
      addressDistrict: address.district || value.addressDistrict,
      addressPostalCode: address.postalCode || value.addressPostalCode,
    })

  return (
    <section className="rounded-lg border border-border-default bg-white p-4 sm:p-6" aria-labelledby="cab-tax-title">
      <header className="mb-6 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-bg-brand-subtle text-icon-brand">
          <AppIcon icon={ReceiptIcon} size={20} />
        </span>
        <div>
          <h3 id="cab-tax-title" className="text-body-1-semibold text-text-primary">
            {t('cab.companyProfile.tax.title', 'Tax invoice details (ZATCA)')}
          </h3>
          <p className="mt-1 text-body-sm text-text-secondary">
            {required
              ? t('cab.companyProfile.tax.hintRequired', 'Printed on every tax invoice. The VAT number is required before you can issue invoices in Saudi Arabia.')
              : t('cab.companyProfile.tax.hint', 'Printed on your tax invoices. Needed for ZATCA e-invoicing when the CAB is registered in Saudi Arabia.')}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TextField
          id="cab-tax-vat"
          label={t('cab.companyProfile.tax.vatNumber', 'VAT registration number')}
          dir="ltr"
          inputMode="numeric"
          placeholder="3XXXXXXXXXXXXX3"
          value={value.vatNumber}
          onChange={digits('vatNumber', 15)}
          error={errors.vatNumber}
        />
      </div>

      <div className="mt-6">
        <NationalAddressLookup onFound={fillFromLookup} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <TextField
          id="cab-tax-street"
          label={t('cab.companyProfile.tax.street', 'Street')}
          value={value.addressStreet}
          maxLength={200}
          onChange={(e) => set('addressStreet', e.target.value)}
          error={errors.addressStreet}
        />
        <TextField
          id="cab-tax-building"
          label={t('cab.companyProfile.tax.buildingNumber', 'Building number')}
          dir="ltr"
          inputMode="numeric"
          placeholder="2322"
          value={value.addressBuildingNumber}
          onChange={digits('addressBuildingNumber', 4)}
          error={errors.addressBuildingNumber}
        />
        <TextField
          id="cab-tax-additional"
          label={t('cab.companyProfile.tax.additionalNumber', 'Additional number')}
          dir="ltr"
          inputMode="numeric"
          placeholder="8040"
          value={value.addressAdditionalNumber}
          onChange={digits('addressAdditionalNumber', 4)}
          error={errors.addressAdditionalNumber}
        />
        <TextField
          id="cab-tax-district"
          label={t('cab.companyProfile.tax.district', 'District')}
          value={value.addressDistrict}
          maxLength={120}
          onChange={(e) => set('addressDistrict', e.target.value)}
          error={errors.addressDistrict}
        />
        <TextField
          id="cab-tax-postal"
          label={t('cab.companyProfile.tax.postalCode', 'Postal code')}
          dir="ltr"
          inputMode="numeric"
          placeholder="23425"
          value={value.addressPostalCode}
          onChange={digits('addressPostalCode', 5)}
          error={errors.addressPostalCode}
        />
      </div>
      <p className="mt-3 text-caption text-text-secondary">
        {t('cab.companyProfile.tax.cityNote', 'City and country come from the main office on the Locations page.')}
      </p>
    </section>
  )
}
