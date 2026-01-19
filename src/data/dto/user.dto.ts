import 'server-only'
import type { User } from '@/generated/prisma/client'

// Re-export types from the client-safe types file
export type { UserDTO, CollaboratorDTO } from './user.types'
import type { UserDTO } from './user.types'

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
