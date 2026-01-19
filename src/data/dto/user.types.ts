/**
 * Public user DTO - only includes safe fields
 * Never includes tokens, secrets, or internal IDs
 */
export interface UserDTO {
  id: string
  name: string | null
  email: string
  image: string | null
}

/**
 * User with role information for collaborators
 */
export interface CollaboratorDTO extends UserDTO {
  canEdit: boolean
}
