import { User } from '../components/User';

type Permission = keyof User | string;

export default function isAllowed(
  me: User | undefined,
  permission: Permission,
): boolean {
  if (!me) return false;
  const allowed = (me as any)[permission];
  return !!allowed;
}
