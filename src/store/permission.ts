import { $http } from '@/utils/http'
import { redirect } from 'react-router-dom'
import { create } from 'zustand'
import { useAuth } from '@/store/auth.ts'

export interface IPermission {
  id: number
  name: string
}

export type TGroup = Record<string, IPermission[]>

export interface State {
  permissions: TGroup | null
}

export interface Actions {
  getServerPermissions: () => Promise<void>
  clearPermissions: () => void
  setPermission: (permissionsData: TGroup) => void
  getPermissionsByGroup: (groupName: string) => IPermission[] | undefined
  getSpecificPermission: (groupName?: string, permissionName?: string) => boolean
  protectRoute: (groupName?: string, permissionName?: string) => Promise<boolean | Response>
}

export const usePermissionsStore = create<State & Actions>((set, get) => ({
  permissions: null,
  setPermission(permissionsData) {
    set((state) => ({
      ...state,
      permissions: permissionsData,
    }))
  },
  clearPermissions() {
    set((state) => ({
      ...state,
      permissions: null,
    }))
  },
  getPermissionsByGroup(groupName) {
    return get().permissions?.[groupName!] ? get().permissions?.[groupName!] : undefined
  },
  getSpecificPermission(groupName, permissionName) {
    return true
    if (!groupName || !permissionName) return true

    const selectedGroupData = get().permissions?.[groupName as any]

    if (!selectedGroupData) return false

    for (const item of selectedGroupData!) {
      if (item.name === permissionName) return true
    }

    return false
  },
  async getServerPermissions() {
    try {
      const res: any = await $http.get({ url: 'user-permissions' })
      set((state) => ({
        ...state,
        permissions: res.data.data,
      }))
    } catch (e) {
      console.log(e)
    }
  },
  async protectRoute(groupName, permissionName) {
    const { permissions, getServerPermissions, getSpecificPermission } = get()

    // Check if user logged
    const token = useAuth.getState().token
    if (!token) return redirect('/login')

    // Check if permission loaded
    if (!permissions) {
      await getServerPermissions()
    }

    // Check if user authority from his permission object
    const isVerified = getSpecificPermission(groupName, permissionName)
    if (isVerified) {
      return true
    } else {
      return redirect('/un-authorized')
    }
  },
}))
