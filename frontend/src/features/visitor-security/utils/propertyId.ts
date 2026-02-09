/**
 * Shared property ID resolution for Visitor Security module.
 * Single source of truth for deriving current property from auth user.
 */

export type UserWithProperty = {
  property_id?: string;
  assigned_property_ids?: string[];
  roles?: string[];
};

const DEFAULT_PROPERTY_ID = 'default-property-id';

/**
 * Get the property ID the current user is scoped to.
 * Prefers property_id, then first assigned_property_ids, then first role.
 */
export function getPropertyIdFromUser(user: UserWithProperty | undefined | null): string {
  if (!user) return DEFAULT_PROPERTY_ID;
  return user.property_id ?? user.assigned_property_ids?.[0] ?? user.roles?.[0] ?? DEFAULT_PROPERTY_ID;
}
