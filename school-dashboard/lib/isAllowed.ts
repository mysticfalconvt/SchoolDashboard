import { useUser } from '../components/User';

type Permission = keyof ReturnType<typeof useUser>;

export default function isAllowed(
  me: ReturnType<typeof useUser>,
  permission: Permission,
): boolean {
  if (!me) return false;
  const allowed = me[permission];
  return !!allowed;
}
