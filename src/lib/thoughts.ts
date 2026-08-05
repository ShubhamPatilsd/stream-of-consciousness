import { getCollection, type CollectionEntry } from 'astro:content';
import { sortThoughtsNewestFirst } from './thought-utils';

export {
	getPageCount,
	paginateThoughts,
	THOUGHTS_PER_PAGE,
} from './thought-utils';

export async function getSortedThoughts(): Promise<CollectionEntry<'thoughts'>[]> {
	return sortThoughtsNewestFirst(await getCollection('thoughts'));
}
