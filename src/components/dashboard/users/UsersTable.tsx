import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AddCircleIcon, AppIcon, EditIcon, SearchIcon, TrashIcon } from '@/components/icons'
import { Toggle } from '@/components/ui/Toggle'
import type { AppUser, AppUserStatus } from '@/lib/api/usersApi'
import { matchesSearch } from '@/lib/tableTools'
import { cn } from '@/lib/utils'
import { notSet } from '@/lib/emptyValue'
import { buttonVariants } from '@/components/ui/buttonVariants'

interface UsersTableProps {
  users: AppUser[]
  loading: boolean
  /** UserOrganization id of the currently logged-in account — hides the
   * Delete action on that row so an owner can't accidentally delete
   * themself (and take their organization's data down with them). */
  currentUserId?: string | null
  onAddUser?: () => void
  onEditUser?: (user: AppUser) => void
  onDeleteUser?: (user: AppUser) => void
  onStatusChange?: (user: AppUser, status: AppUserStatus) => void
}

export function UsersTable({
  users,
  loading,
  currentUserId,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onStatusChange,
}: UsersTableProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')

  const filteredUsers = users.filter((user) =>
    matchesSearch(
      [user.fullName, user.email, user.phoneNumber ?? '', user.role],
      appliedQuery
    )
  )

  const handleSearch = () => setAppliedQuery(query)

  return (
    <div className="flex flex-col gap-5">
      {/* Search bar — its own card, outside the Users table */}
      <div className="rounded-lg border border-neutral-100 bg-white p-3">
        <div className="relative flex items-center">
          <AppIcon
            icon={SearchIcon}
            size={18}
            className="pointer-events-none absolute start-3 text-neutral-500"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={t('users.searchPlaceholder')}
            className="w-full rounded-md border-0 bg-transparent py-2.5 ps-10 pe-14 text-body-sm outline-none"
          />
          <button
            type="button"
            onClick={handleSearch}
            aria-label={t('users.search')}
            className="absolute end-0 flex size-13 shrink-0 items-center justify-center rounded-md bg-primary text-white transition-colors hover:bg-primary/90"
          >
            <AppIcon icon={SearchIcon} size={18} />
          </button>
        </div>
      </div>

      {/* Users table card */}
      <div className="flex flex-col rounded-lg border border-neutral-100 bg-white py-5">
        <div className="mb-4 flex items-center justify-between gap-3 px-5">
          <h2 className="text-body-lg font-bold text-neutral-900">{t('users.pageTitle')}</h2>
          <button
            type="button"
            onClick={onAddUser}
            className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
          >
            <AppIcon icon={AddCircleIcon} size={18} />
            {t('users.addUser')}
          </button>
        </div>

        {/* Desktop: table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px] border-collapse text-center">
            <thead className="bg-primary text-white">
              <tr className="bg-primary text-white">
                <th className="px-4 py-4 text-center text-body-sm font-medium">
                  {t('users.table.index')}
                </th>
                <th className="px-4 py-4 text-center text-body-sm font-medium">
                  {t('users.table.name')}
                </th>
                <th className="px-4 py-4 text-center text-body-sm font-medium">
                  {t('users.table.role')}
                </th>
                <th className="px-4 py-4 text-center text-body-sm font-medium">
                  {t('users.table.email')}
                </th>
                <th className="px-4 py-4 text-center text-body-sm font-medium">
                  {t('users.table.phone')}
                </th>
                <th className="px-4 py-4 text-center text-body-sm font-medium">
                  {t('users.table.status')}
                </th>
                <th className="px-4 py-4 text-center text-body-sm font-medium">
                  {t('users.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-neutral-600">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-neutral-600">
                    {notSet()}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr key={user.id} className={cn(index % 2 === 1 && 'bg-neutral-25')}>
                    <td className="px-4 py-4 text-body text-neutral-800">{index + 1}</td>
                    <td className="px-4 py-4 text-body font-medium text-neutral-900">
                      {user.fullName || notSet()}
                    </td>
                    <td className="px-4 py-4 text-body text-neutral-800">{user.role || notSet()}</td>
                    <td className="px-4 py-4 text-body text-neutral-800">{user.email}</td>
                    <td className="px-4 py-4 text-body text-neutral-800" dir="ltr">
                      {user.phoneCountryCode && user.phoneNumber
                        ? `${user.phoneCountryCode} ${user.phoneNumber}`
                        : notSet()}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center">
                        <Toggle
                          checked={user.status === 'ACTIVE'}
                          label={t(`users.status.${user.status.toLowerCase()}`)}
                          onChange={(checked) =>
                            onStatusChange?.(user, checked ? 'ACTIVE' : 'INACTIVE')
                          }
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-3">
                        {user.id === currentUserId ? (
                          <span className="size-[18px]" aria-hidden />
                        ) : (
                          <button
                            type="button"
                            onClick={() => onDeleteUser?.(user)}
                            aria-label={t('users.table.delete')}
                            className="text-error-500 transition-colors hover:text-error-700"
                          >
                            <AppIcon icon={TrashIcon} size={18} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onEditUser?.(user)}
                          aria-label={t('users.table.edit')}
                          className="text-neutral-600 transition-colors hover:text-primary"
                        >
                          <AppIcon icon={EditIcon} size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Mobile: cards */}
        <div className="mx-5 rounded-lg border border-neutral-100 bg-neutral-25 p-3 md:hidden">
          {loading ? (
            <p className="py-6 text-center text-neutral-600">{t('common.loading')}</p>
          ) : filteredUsers.length === 0 ? (
            <p className="py-6 text-center text-neutral-600">{notSet()}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredUsers.map((user) => (
                <div key={user.id} className="rounded-lg border border-neutral-100 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-body font-semibold text-neutral-900">{user.fullName || notSet()}</p>
                      <p className="text-body-sm text-neutral-600">{user.role || notSet()}</p>
                    </div>
                    <Toggle
                      checked={user.status === 'ACTIVE'}
                      size="sm"
                      aria-label={t(`users.status.${user.status.toLowerCase()}`)}
                      onChange={(checked) => onStatusChange?.(user, checked ? 'ACTIVE' : 'INACTIVE')}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-body-sm text-neutral-800">{user.email}</p>
                      <p className="text-body-sm text-neutral-800" dir="ltr">
                        {user.phoneCountryCode && user.phoneNumber
                          ? `${user.phoneCountryCode} ${user.phoneNumber}`
                          : notSet()}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {user.id !== currentUserId && (
                        <button
                          type="button"
                          onClick={() => onDeleteUser?.(user)}
                          aria-label={t('users.table.delete')}
                          className="text-error-500 transition-colors hover:text-error-700"
                        >
                          <AppIcon icon={TrashIcon} size={18} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onEditUser?.(user)}
                        aria-label={t('users.table.edit')}
                        className="text-neutral-600 transition-colors hover:text-primary"
                      >
                        <AppIcon icon={EditIcon} size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}