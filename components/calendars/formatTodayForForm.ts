export function todaysDateForForm(): string {
  const date = new Date();
  const today = date.toISOString().split('T')[0];
  return today;
}
