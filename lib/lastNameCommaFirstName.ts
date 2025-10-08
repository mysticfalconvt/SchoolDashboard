// take in a string of "first name last name" and return the last name, first name
export const lastNameCommaFirstName = (name: string) => {
  if (!name || typeof name !== 'string') {
    return '';
  }

  const nameParts = name.trim().split(/\s+/);

  if (nameParts.length === 0) {
    return '';
  }

  if (nameParts.length === 1) {
    // Only one name part, just capitalize and return it
    const capitalizeWord = (word: string) =>
      word && word.length > 0
        ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        : '';
    return capitalizeWord(nameParts[0]);
  }

  const capitalizeWord = (word: string) =>
    word && word.length > 0
      ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      : '';

  // Take first part as first name, last part as last name
  const firstName = nameParts[0];
  const lastName = nameParts[nameParts.length - 1];

  return `${capitalizeWord(lastName)}, ${capitalizeWord(firstName)}`;
};
