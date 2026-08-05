export const THOUGHTS_PER_PAGE = 50;

type DatedEntry = {
	publishedAt: Date;
};

export function sortThoughtsNewestFirst<T extends DatedEntry>(thoughts: T[]): T[] {
	return [...thoughts].sort(
		(a, b) => b.publishedAt.getTime() - a.publishedAt.getTime(),
	);
}

export function paginateThoughts<T>(
	thoughts: T[],
	page: number,
	perPage = THOUGHTS_PER_PAGE,
): T[] {
	const start = (page - 1) * perPage;
	return thoughts.slice(start, start + perPage);
}

export function getPageCount(total: number, perPage = THOUGHTS_PER_PAGE): number {
	return Math.max(1, Math.ceil(total / perPage));
}
