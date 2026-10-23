export function newestAwardsFirst<T extends { name: string }>(items: T[]): T[] {
  const year = (item: T) => Number(item.name.match(/(?:19|20)\d{2}/)?.[0] ?? 0);
  return [...items].sort((left, right) => year(right) - year(left));
}
