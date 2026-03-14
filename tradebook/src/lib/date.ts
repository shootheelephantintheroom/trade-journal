export function todayLocal(): string {
  return new Date().toLocaleDateString('en-CA'); // returns YYYY-MM-DD in local time
}
