import { NextRequest } from 'next/server';
import {
	streamText,
	type CoreMessage,
	type ProviderMetadata,
	type Tool,
	type ToolSet
} from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import {
	getGlobalKPIs,
	getTopCountriesByKilos,
	getTopExportersByKilos,
	getTimeSeriesByCountry,
	getAvailableProducts,
	getProductReference
} from '@/lib/ai-tools';
import { buildGoogleProviderOptions, buildGoogleToolingConfig } from '@/lib/ai-config';

type IncomingMessage = {
	role?: CoreMessage['role'];
	content?: unknown;
	providerOptions?: Record<string, unknown>;
	metadata?: {
		customSystemInstruction?: string;
	};
};

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!apiKey) {
	throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not configured.');
}

const google = createGoogleGenerativeAI({
	apiKey
});

const SYSTEM_MESSAGE =
	'You are Me-Vi, an expert analyst in Chilean agricultural exports. ' +
	'CRITICAL RULES: ' +
	'1. ALWAYS use the provided tools to get data. NEVER use your training knowledge or translate product names before calling tools. ' +
	'2. When a user asks about a product (e.g., "uvas", "grapes", "avocados", "paltas", "arándanos", "blueberries"), FIRST call getProductReference to get the exact dataset names, translations, and synonyms. Then use the dataset_matches values when querying data. ' +
	'3. If the user does NOT specify a year, do NOT filter by year. Use all available data unless the user explicitly asks for a specific year. ' +
	'4. Detect the language of the user\'s message (Spanish or English) and respond in the SAME language. If the user writes in Spanish, respond in Spanish. If the user writes in English, respond in English. ' +
	'5. When presenting rankings or KPIs, always mention both boxes and kilograms (both values) if the data includes them. ' +
	'6. If the user asks "who" or mentions "exporter", use getTopExportersByKilos. If they ask about a specific product, FIRST use getProductReference to verify the product name, then use the dataset_matches in your query. ' +
	'7. If getProductReference returns suggestions, use those to help the user find the correct product. If no data is found, explain clearly in the user\'s language. ' +
	'8. Always cite which tool you used and what parameters you passed. ' +
	'9. The getProductReference tool provides dataset_matches which are the EXACT names to use in dataset queries. Always use these exact names.';

const MAX_TOOL_STEPS = 6;
const continueUntilComplete = ({ steps }: { steps: Array<{ finishReason?: string }> }) => {
	if (steps.length === 0) {
		return false;
	}

	if (steps.length >= MAX_TOOL_STEPS) {
		return true;
	}

	const lastStep = steps[steps.length - 1];
	return lastStep?.finishReason !== 'tool-calls';
};

function normalizeMessage(raw: IncomingMessage): CoreMessage | null {
	if (!raw || !raw.role) {
		return null;
	}

	// Validate role is a valid CoreMessage role
	const validRoles: Array<CoreMessage['role']> = ['system', 'user', 'assistant', 'tool'];
	if (!validRoles.includes(raw.role as CoreMessage['role'])) {
		return null;
	}

	const normalized = {
		role: raw.role as CoreMessage['role'],
		content: ''
	} as CoreMessage;

	const content = raw.content;
	if (Array.isArray(content)) {
		normalized.content = content as CoreMessage['content'];
	} else if (typeof content === 'string') {
		normalized.content = content;
	} else if (content === undefined || content === null) {
		normalized.content = '';
	} else if (typeof content === 'object' && 'type' in (content as Record<string, unknown>)) {
		normalized.content = [content] as CoreMessage['content'];
	} else {
		normalized.content = JSON.stringify(content);
	}

	if (raw.providerOptions) {
		normalized.providerOptions = raw.providerOptions as Record<string, unknown> as typeof normalized.providerOptions;
	}

	return normalized;
}

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
		console.log('[CHAT] Request entrante a /api/chat');
    const body = await req.json();
		const messagesPayload = Array.isArray(body) ? body : body?.messages;

		if (!Array.isArray(messagesPayload)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: messages must be an array' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

		const sanitizedMessages = messagesPayload.filter(
			(message: IncomingMessage) => message && message.role !== 'system'
		);

		const customInstructions = sanitizedMessages
			.map(message => message?.metadata?.customSystemInstruction?.trim())
			.filter((instruction): instruction is string => Boolean(instruction));

		const normalizedMessages = sanitizedMessages
			.map(message => normalizeMessage(message))
			.filter((message): message is CoreMessage => Boolean(message));

		const finalMessages: CoreMessage[] = [
			{
				role: 'system' as const,
				content: SYSTEM_MESSAGE
			},
			...customInstructions.map(text => ({
				role: 'system' as const,
				content: text
			})),
			...normalizedMessages
		];

		const googleTooling = buildGoogleToolingConfig();

		const customTools: ToolSet = {
			getProductReference: {
				description: 'Gets complete reference for a product or variety, including ES/EN translations and exact dataset names. Use this BEFORE querying data to ensure you use the correct product names from the dataset. Returns dataset_matches which are the exact names to use in queries.',
				inputSchema: z.object({
					product: z.string().min(1).optional().describe('Product name as written by the user (e.g., "uvas", "grapes", "arándanos", "blueberries"). Pass exactly as user wrote it.'),
					variety: z.string().min(1).optional().describe('Optional: Variety name if user asks about a specific variety.')
				}),
				execute: async ({ product, variety }: { product?: string; variety?: string }) => {
					return await getProductReference({ product, variety });
				}
			},
			getAvailableProducts: {
				description: 'Lists all available product names in the dataset. Use this to verify product names before querying exporters or other data.',
				inputSchema: z.object({}),
				execute: async () => {
					return await getAvailableProducts();
				}
			},
			getGlobalKPIs: {
				description: 'Gets global KPIs (boxes, kilograms, unique exporters and countries).',
				inputSchema: z.object({}),
				execute: async () => {
					return await getGlobalKPIs();
				}
			},
			getTopCountriesByKilos: {
				description: 'Gets top N countries by exported kilograms, optionally filtered by year.',
				inputSchema: z.object({
					year: z.number().int().optional(),
					limit: z
						.number()
						.int()
						.min(1)
						.max(50)
						.optional()
						.default(10)
          }),
				execute: async ({ year, limit }: { year?: number; limit?: number }) => {
					return await getTopCountriesByKilos({ year, limit });
				}
			},
			getTimeSeriesByCountry: {
				description:
					'Returns an annual series of boxes and kilograms for a specific country across the entire dataset.',
				inputSchema: z.object({
					country: z.string().min(1, 'country is required')
				}),
				execute: async ({ country }: { country: string }) => {
					return await getTimeSeriesByCountry({ country });
          }
        },
			getTopExportersByKilos: {
				description:
					'Returns the ranking of exporters (companies) by kilograms exported. IMPORTANT: Pass the product name EXACTLY as the user wrote it (e.g., "uvas", "grapes", "avocados", "paltas"). Do NOT translate or modify the product name. The tool handles normalization internally. If the user does not specify a year, omit the year parameter to get data from all years.',
				inputSchema: z.object({
					year: z.number().int().optional().describe('Optional: Filter by specific year. Omit to get all years.'),
					product: z.string().min(1).optional().describe('Optional: Product name as written by the user (e.g., "uvas", "grapes", "avocados"). Pass exactly as user wrote it.'),
					limit: z
						.number()
						.int()
						.min(1)
						.max(50)
						.optional()
						.default(10)
						.describe('Number of top exporters to return (default: 10, max: 50)')
          }),
				execute: async ({
					year,
					product,
					limit
				}: {
					year?: number;
					product?: string;
					limit?: number;
				}) => {
					return await getTopExportersByKilos({ year, product, limit });
				}
			}
		};

		const providerTools: ToolSet = {};

		const providerToolFactories =
			(google as unknown as {
				tools?: Record<string, (...args: unknown[]) => Tool<unknown, unknown>>;
			}).tools ?? {};

		if (googleTooling.useSearch && providerToolFactories.googleSearch) {
			providerTools.google_search = providerToolFactories.googleSearch({});
          }

		if (googleTooling.useSearchRetrieval && providerToolFactories.googleSearchRetrieval) {
			providerTools.google_search_retrieval = providerToolFactories.googleSearchRetrieval({});
		}

		if (googleTooling.useUrlContext && providerToolFactories.urlContext) {
			providerTools.url_context = providerToolFactories.urlContext({});
		}

		if (googleTooling.useCodeExecution && providerToolFactories.codeExecution) {
			providerTools.code_execution = providerToolFactories.codeExecution({});
		}

		if (googleTooling.fileSearch && providerToolFactories.fileSearch) {
			providerTools.file_search = providerToolFactories.fileSearch({
				fileSearchStoreNames: googleTooling.fileSearch.fileSearchStoreNames,
				topK: googleTooling.fileSearch.topK,
				metadataFilter: googleTooling.fileSearch.metadataFilter
			});
		}

		const tools: ToolSet = {
			...customTools,
			...providerTools
		};

		let lastStepMetadata: ProviderMetadata | undefined;

		const result = await streamText({
			model: google('gemini-2.5-flash'),
			stopWhen: continueUntilComplete,
			messages: finalMessages,
			toolChoice: 'auto',
			providerOptions: buildGoogleProviderOptions(),
			onStepFinish: async step => {
				lastStepMetadata = step.providerMetadata;
				console.log(
					'[CHAT][STEP]',
					JSON.stringify({
						finishReason: step.finishReason,
						usage: step.usage
					})
				);
			},
			onError: async chunkError => {
				console.error('[CHAT] streamText error:', chunkError);
			},
			tools
		});

		return result.toUIMessageStreamResponse({
			messageMetadata: ({ part }) => {
				if (part.type === 'finish') {
            return {
						finishReason: part.finishReason,
						usage: part.totalUsage,
						providerMetadata: lastStepMetadata
					};
				}
				return undefined;
			},
			sendReasoning: false,
			sendSources: true
		});
  } catch (error) {
		console.error('[CHAT] Error in /api/chat:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Error processing chat request', details: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
