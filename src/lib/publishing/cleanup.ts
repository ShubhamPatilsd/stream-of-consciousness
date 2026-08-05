const CLEANUP_INSTRUCTIONS = `You are a conservative transcription editor.

Clean the dictated thought only enough to make it read like the speaker typed it:
- remove filler sounds and clearly abandoned repetitions
- resolve explicit self-corrections such as "actually" or "scratch that"
- add punctuation, capitalization, and paragraph breaks when clearly implied
- preserve the speaker's wording, tone, uncertainty, slang, names, and meaning

Do not summarize, embellish, add facts, make the prose more formal, add a title, or explain your work.
Return only the cleaned thought.`;

interface CleanupOptions {
	apiKey: string;
	model?: string;
	fetch?: typeof globalThis.fetch;
}

interface OpenAIResponse {
	output_text?: string;
	output?: Array<{
		content?: Array<{
			type?: string;
			text?: string;
		}>;
	}>;
}

export interface CleanupResult {
	text: string;
	cleaned: boolean;
}

function getOutputText(response: OpenAIResponse): string | undefined {
	if (typeof response.output_text === 'string') {
		return response.output_text;
	}

	for (const output of response.output ?? []) {
		for (const content of output.content ?? []) {
			if (content.type === 'output_text' && typeof content.text === 'string') {
				return content.text;
			}
		}
	}

	return undefined;
}

function isConservativeResult(original: string, cleaned: string): boolean {
	const originalLength = original.trim().length;
	const maximumLength = Math.max(originalLength + 80, Math.ceil(originalLength * 1.5));

	return cleaned.length > 0 && cleaned.length <= maximumLength;
}

export async function cleanVoiceTranscript(
	original: string,
	{
		apiKey,
		model = 'gpt-5.4-nano',
		fetch: fetchImpl = globalThis.fetch,
	}: CleanupOptions,
): Promise<CleanupResult> {
	if (!apiKey) {
		return { text: original, cleaned: false };
	}

	try {
		const response = await fetchImpl('https://api.openai.com/v1/responses', {
			method: 'POST',
			signal: AbortSignal.timeout(10_000),
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model,
				instructions: CLEANUP_INSTRUCTIONS,
				input: original,
			}),
		});

		if (!response.ok) {
			return { text: original, cleaned: false };
		}

		const output = getOutputText((await response.json()) as OpenAIResponse)?.trim();

		if (!output || !isConservativeResult(original, output)) {
			return { text: original, cleaned: false };
		}

		return {
			text: output,
			cleaned: output !== original,
		};
	} catch {
		return { text: original, cleaned: false };
	}
}
