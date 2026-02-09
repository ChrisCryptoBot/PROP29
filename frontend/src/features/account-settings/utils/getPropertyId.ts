/** Resolve current property ID from auth user. */
export type UserWithProperty = {
  property_id?: string;
  assigned_property_ids?: string[];
  roles?: string[];
};

const DEFAULT = 'default-property-id';

export function getPropertyIdFromUser(user: UserWithProperty | undefined | null): string {
  if (!user) return DEFAULT;
  return user.property_id ?? user.assigned_property_ids?.[0] ?? user.roles?.[0] ?? DEFAULT;
}
