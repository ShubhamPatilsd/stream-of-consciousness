import { describe, expect, it, vi } from 'vitest';
import { cleanVoiceTranscript } from './cleanup';
import { prepareThought } from './prepare';

describe('voice cleanup', () => {
	it('returns a conservative cleaned transcript', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
			Response.json({
				output: [
					{
						content: [
							{
								type: 'output_text',
								text: 'I think this could work. Actually, it definitely could.',
							},
						],
					},
				],
			}),
		);

		const result = await cleanVoiceTranscript(
			'Um I think this could work actually it definitely could',
			{ apiKey: 'openai-key', fetch },
		);

		expect(result).toEqual({
			text: 'I think this could work. Actually, it definitely could.',
			cleaned: true,
		});
		expect(fetch).toHaveBeenCalledOnce();
	});

	it('falls back to the raw transcript on provider failure', async () => {
		const fetch = vi
			.fn<typeof globalThis.fetch>()
			.mockResolvedValue(new Response('unavailable', { status: 503 }));

		await expect(
			cleanVoiceTranscript('um a thought', {
				apiKey: 'openai-key',
				fetch,
			}),
		).resolves.toEqual({
			text: 'um a thought',
			cleaned: false,
		});
	});

	it('rejects an unexpectedly expansive rewrite', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
			Response.json({
				output_text:
					'This response invents a very long explanation that the speaker never provided. '.repeat(
						5,
					),
			}),
		);

		await expect(
			cleanVoiceTranscript('short thought', {
				apiKey: 'openai-key',
				fetch,
			}),
		).resolves.toEqual({
			text: 'short thought',
			cleaned: false,
		});
	});
});

describe('source-specific preparation', () => {
	it('never sends typed thoughts through AI cleanup', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>();

		await expect(
			prepareThought(
				{ text: 'Keep  this exactly.', source: 'text' },
				{ apiKey: 'openai-key', fetch },
			),
		).resolves.toEqual({
			text: 'Keep  this exactly.',
			cleaned: false,
		});
		expect(fetch).not.toHaveBeenCalled();
	});
});
