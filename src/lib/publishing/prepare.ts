import { cleanVoiceTranscript, type CleanupResult } from './cleanup';
import type { PublishThoughtInput } from './validation';

interface PrepareThoughtOptions {
	apiKey: string;
	model?: string;
	fetch?: typeof globalThis.fetch;
}

export function prepareThought(
	input: PublishThoughtInput,
	options: PrepareThoughtOptions,
): Promise<CleanupResult> {
	if (input.source === 'text') {
		return Promise.resolve({ text: input.text, cleaned: false });
	}

	return cleanVoiceTranscript(input.text, options);
}
