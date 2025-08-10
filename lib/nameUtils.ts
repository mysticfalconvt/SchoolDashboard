import type { User } from '../components/User';

// show whether user us parent, student, or teacher
export function UserTypeDisplay(user: User): string {
  let userDisplay = '';
  if (user.isStaff) {
    userDisplay = '👨‍🏫 ';
  }
  if (user.isParent) {
    userDisplay = `${userDisplay} 👨‍👧‍👦 `;
  }
  if (user.isStudent) {
    userDisplay = `${userDisplay} 🧑‍🎓 `;
  }
  if (userDisplay === '') {
    userDisplay = 'User';
  }
  return userDisplay;
}

// capitalize first letter of each word in string
export function capitalizeFirstLetter(
  string: string | undefined | null,
): string {
  return (
    string?.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
    ) ?? ''
  );
}

// Helper function to format parent names from "Last, First" to "First Last"
export function formatParentName(name: string): string {
  if (!name) return '';
  if (name.includes(',')) {
    const parts = name.split(',').map((part) => part.trim());
    const [last, ...firstParts] = parts;
    const first = firstParts.join(', ');
    return `${first} ${last}`;
  }
  return name;
}
