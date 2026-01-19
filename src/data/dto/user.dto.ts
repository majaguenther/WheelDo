import 'server-only'
import type { User } from '@/generated/prisma/client'

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
 * Convert User to public DTO
 */
export function toUserDTO(user: Pick<User, 'id' | 'name' | 'email' | 'image'>): UserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
  }
}

/**
 * User with role information for collaborators
 */
export interface CollaboratorDTO extends UserDTO {
  canEdit: boolean
}
