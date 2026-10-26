import { useEffect, useState } from 'react'
import { AccreditationHeader } from '@/components/dashboard/AccreditationHeader'
import { AppLayout } from '@/components/layout/AppLayout'
import { AddUserModal } from '@/components/dashboard/users/AddUserModal'
import { EditUserModal } from '@/components/dashboard/users/EditUserModal'
import { UsersStatCards } from '@/components/dashboard/users/UsersStatCards'
import { UsersTable } from '@/components/dashboard/users/UsersTable'
import { DashboardTourStep } from '@/components/dashboard/DashboardTourStep'
import { useUsersTourSteps } from '@/config/auditeeTourSteps'
import { TourProvider } from '@/context/tour/TourProvider'
import {
  deleteUser,
  getUsersStats,
  listUsers,
  setUserStatus,
  type AppUser,
  type AppUserStatus,
  type UsersStats,
} from '@/lib/api/usersApi'
import {
  UsersStatsSkeleton,
  UsersTableSkeleton,
} from '@/components/dashboard/users/UsersLoadingSkeleton'
import { getAuthSession } from '@/lib/authStorage'

export function UsersPage() {
  const tourSteps = useUsersTourSteps()
  const [stats, setStats] = useState<UsersStats | null>(null)
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddUser, setShowAddUser] = useState(false)
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)
  // The Users list's "id" is the UserOrganization (membership) id, so we
  // compare against the logged-in session's membershipId — not user.id —
  // to know which row is "me or is onwer".
  const currentUserId = getAuthSession()?.organization?.membershipId ?? null

  // Requests stats and users; state is only set once the requests settle.
  const requestUsers = () =>
    Promise.all([getUsersStats(), listUsers()])
      .then(([statsResult, usersResult]) => {
        setStats(statsResult)
        setUsers(usersResult)
      })
      .finally(() => setLoading(false))

  const load = () => {
    setLoading(true)
    return requestUsers()
  }

  // Initial load on mount (`loading` already starts as true).
  useEffect(() => {
    requestUsers()
  }, [])

  const handleStatusChange = (user: AppUser, status: AppUserStatus) => {
    // Optimistic update, then sync — mirrors the eventual real API call
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status } : u)))
    setUserStatus(user.id, status).then(load)
  }

  const handleDeleteUser = (user: AppUser) => {
    setUsers((prev) => prev.filter((u) => u.id !== user.id))
    deleteUser(user.id).then(load)
  }

  return (
    <TourProvider tourId="auditee-users" steps={tourSteps}>
      <AppLayout>
        <DashboardTourStep steps={tourSteps} stepId="users-header">
          <AccreditationHeader titleKey="users.pageTitle" />
        </DashboardTourStep>

        <div className="flex flex-col gap-5 overflow-auto p-5">
          <DashboardTourStep steps={tourSteps} stepId="users-stats">
            {loading ? <UsersStatsSkeleton /> : <UsersStatCards stats={stats} loading={loading} />}
          </DashboardTourStep>

          <DashboardTourStep steps={tourSteps} stepId="users-table">
            {loading ? (
              <UsersTableSkeleton />
            ) : (
              <UsersTable
                users={users}
                loading={loading}
                currentUserId={currentUserId}
                onStatusChange={handleStatusChange}
                onDeleteUser={handleDeleteUser}
                onAddUser={() => setShowAddUser(true)}
                onEditUser={(user) => setEditingUser(user)}
              />
            )}
          </DashboardTourStep>
        </div>

        <AddUserModal
          open={showAddUser}
          onClose={() => setShowAddUser(false)}
          onCreated={load}
        />

        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={load}
        />
      </AppLayout>
    </TourProvider>
  )
}