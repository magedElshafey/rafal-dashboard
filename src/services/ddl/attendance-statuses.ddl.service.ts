import { $authHttp } from '@/utils/auth-http'

export type AttendanceStatusDdlItem = IDDl
export type AttendanceStatusesDdlResponse = ApiResponse<AttendanceStatusDdlItem[]>

export const ATTENDANCE_STATUSES_DDL_ENDPOINT = '/v1/ddl/attendance-statuses'

export async function getAttendanceStatusesDdl(): Promise<AttendanceStatusDdlItem[]> {
  const response = await $authHttp.get<AttendanceStatusesDdlResponse>({
    url: ATTENDANCE_STATUSES_DDL_ENDPOINT,
  })

  return response.data.data
}
