import type { User } from '../components/User';

export default function getDisplayName(user: User | undefined): string {
  if (!user) return '';
  const displayName = user.preferredName
    ? `${user.name} - (${user.preferredName})`
    : user.name;
  return displayName;
}
