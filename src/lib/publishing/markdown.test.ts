import { describe, expect, it } from 'vitest';
import { createThoughtPath, serializeThought } from './markdown';

const publishedAt = new Date('2026-08-05T06:15:30.123Z');

describe('thought Markdown generation', () => {
	it('places user text safely after fixed frontmatter', () => {
		expect(
			serializeThought(
				'---\nStill <script>alert("no")</script> & body text.',
				publishedAt,
			),
		).toBe(
			`---
publishedAt: 2026-08-05T06:15:30.123Z
---

---
Still &lt;script&gt;alert("no")&lt;/script&gt; &amp; body text.
`,
		);
	});

	it('creates predictable, collision-resistant content paths', () => {
		expect(createThoughtPath(publishedAt, 'first-id')).toBe(
			'src/content/thoughts/20260805T061530Z-first-id.md',
		);
		expect(createThoughtPath(publishedAt, 'second-id')).not.toBe(
			createThoughtPath(publishedAt, 'first-id'),
		);
	});
});
