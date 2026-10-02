/** The library's earliest sermons are from 2015. */
const FIRST_SERMON_YEAR = 2015;

/** Year filter options, newest first, from the current year back to the first sermon year. */
export function getYearOptions(): { id: string; label: string }[] {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: currentYear - FIRST_SERMON_YEAR + 1 }, (_, i) => {
    const year = (currentYear - i).toString();
    return { id: year, label: year };
  });
}
