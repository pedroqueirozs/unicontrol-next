export function isAdminLevel(role: string | undefined): boolean {
  return role === "admin" || role === "administrativo"
}
