const STORAGE_KEY = "mytradebook_24h_clock";

export function get24hClock(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export function set24hClock(value: boolean) {
  localStorage.setItem(STORAGE_KEY, value ? "true" : "false");
}
