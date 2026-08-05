export function serializeThought(text: string, publishedAt: Date): string {
	const safeText = text
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;');

	return `---
publishedAt: ${publishedAt.toISOString()}
---

${safeText}
`;
}

export function createThoughtPath(
	publishedAt: Date,
	id = crypto.randomUUID().slice(0, 8),
): string {
	const timestamp = publishedAt
		.toISOString()
		.replace(/[-:]/g, '')
		.replace(/\.\d{3}Z$/, 'Z');

	return `src/content/thoughts/${timestamp}-${id}.md`;
}
