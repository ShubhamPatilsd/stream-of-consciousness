export const MAX_THOUGHT_LENGTH = 10_000;

export type ThoughtSource = 'text' | 'voice';

export interface PublishThoughtInput {
	text: string;
	source: ThoughtSource;
}

export class InvalidPublishRequestError extends Error {}

export function parsePublishRequest(value: unknown): PublishThoughtInput {
	if (!value || typeof value !== 'object') {
		throw new InvalidPublishRequestError('Request body must be a JSON object.');
	}

	const { text, source } = value as Record<string, unknown>;

	if (typeof text !== 'string' || !text.trim()) {
		throw new InvalidPublishRequestError('Thought text is required.');
	}

	if (text.length > MAX_THOUGHT_LENGTH) {
		throw new InvalidPublishRequestError(
			`Thoughts must be ${MAX_THOUGHT_LENGTH.toLocaleString('en-US')} characters or fewer.`,
		);
	}

	if (source !== 'text' && source !== 'voice') {
		throw new InvalidPublishRequestError('Source must be "text" or "voice".');
	}

	return {
		text: text.replace(/\r\n?/g, '\n'),
		source,
	};
}
