import type { GoogleGenerativeAIProviderOptions } from '@ai-sdk/google';

const DEFAULT_SAFETY_SETTINGS: NonNullable<
	GoogleGenerativeAIProviderOptions['safetySettings']
> = [
	{
		category: 'HARM_CATEGORY_HATE_SPEECH',
		threshold: 'BLOCK_MEDIUM_AND_ABOVE'
	},
	{
		category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
		threshold: 'BLOCK_MEDIUM_AND_ABOVE'
	},
	{
		category: 'HARM_CATEGORY_HARASSMENT',
		threshold: 'BLOCK_MEDIUM_AND_ABOVE'
	},
	{
		category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
		threshold: 'BLOCK_MEDIUM_AND_ABOVE'
	},
	{
		category: 'HARM_CATEGORY_CIVIC_INTEGRITY',
		threshold: 'BLOCK_MEDIUM_AND_ABOVE'
	}
];

function parseJSONEnv<T>(value: string | undefined, label: string): T | undefined {
	if (!value) return undefined;

	try {
		return JSON.parse(value) as T;
	} catch (error) {
		console.warn(`[AI-CONFIG] Invalid JSON in ${label}:`, error);
		return undefined;
	}
}

function parseBooleanEnv(value: string | undefined): boolean | undefined {
	if (value === undefined) return undefined;
	return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function parseNumberEnv(value: string | undefined): number | undefined {
	if (!value) return undefined;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : undefined;
}

export function buildGoogleProviderOptions(): { google: GoogleGenerativeAIProviderOptions } {
	const envSafetySettings = parseJSONEnv<
		GoogleGenerativeAIProviderOptions['safetySettings']
	>(process.env.GOOGLE_SAFETY_SETTINGS, 'GOOGLE_SAFETY_SETTINGS');

	const structuredOutputs =
		parseBooleanEnv(process.env.GOOGLE_STRUCTURED_OUTPUTS) ?? true;

	const thinkingBudget = parseNumberEnv(process.env.GOOGLE_THINKING_BUDGET);
	const thinkingIncludeThoughts = parseBooleanEnv(
		process.env.GOOGLE_THINKING_INCLUDE_THOUGHTS
	);
	const thinkingLevel = process.env.GOOGLE_THINKING_LEVEL as
		| 'low'
		| 'medium'
		| 'high'
		| undefined;

	const responseModalities =
		process.env.GOOGLE_RESPONSE_MODALITIES?.split(',')
			.map(token => token.trim().toUpperCase())
			.filter(Boolean) as GoogleGenerativeAIProviderOptions['responseModalities'];

	const cachedContent = process.env.GOOGLE_CACHED_CONTENT?.trim();

	const providerOptions: GoogleGenerativeAIProviderOptions = {
		safetySettings: envSafetySettings ?? DEFAULT_SAFETY_SETTINGS,
		structuredOutputs,
		responseModalities: responseModalities && responseModalities.length > 0 ? responseModalities : undefined,
		cachedContent
	};

	if (thinkingBudget || thinkingIncludeThoughts || thinkingLevel) {
		providerOptions.thinkingConfig = {
			thinkingBudget: thinkingBudget ?? undefined,
			includeThoughts: thinkingIncludeThoughts,
			thinkingLevel
		};
	}

	return { google: providerOptions };
}

export interface GoogleToolingConfig {
	useSearch: boolean;
	useSearchRetrieval: boolean;
	useUrlContext: boolean;
	useCodeExecution: boolean;
	fileSearch?: {
		fileSearchStoreNames: string[];
		topK?: number;
		metadataFilter?: string;
	};
}

export function buildGoogleToolingConfig(): GoogleToolingConfig {
	const useSearch = parseBooleanEnv(process.env.GOOGLE_SEARCH_ENABLED) ?? false;
	const useSearchRetrieval =
		parseBooleanEnv(process.env.GOOGLE_SEARCH_RETRIEVAL_ENABLED) ?? false;
	const useUrlContext =
		parseBooleanEnv(process.env.GOOGLE_URL_CONTEXT_ENABLED) ?? false;
	const useCodeExecution =
		parseBooleanEnv(process.env.GOOGLE_CODE_EXECUTION_ENABLED) ?? false;

	const rawStoreNames = process.env.GOOGLE_FILE_SEARCH_STORES;
	const fileSearchStoreNames = rawStoreNames
		?.split(',')
		.map(entry => entry.trim())
		.filter(Boolean);

	const fileSearch =
		fileSearchStoreNames && fileSearchStoreNames.length > 0
			? {
					fileSearchStoreNames,
					topK: parseNumberEnv(process.env.GOOGLE_FILE_SEARCH_TOP_K),
					metadataFilter: process.env.GOOGLE_FILE_SEARCH_METADATA_FILTER
			  }
			: undefined;

	return {
		useSearch,
		useSearchRetrieval,
		useUrlContext,
		useCodeExecution,
		fileSearch
	};
}

