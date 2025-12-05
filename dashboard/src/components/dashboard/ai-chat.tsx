'use client';

import { Send, Bot, User, ShieldAlert, Settings2 } from 'lucide-react';
import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { type TextPart } from 'ai';

export function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
	const [input, setInput] = useState('');
	const [showAdvanced, setShowAdvanced] = useState(false);
	const [customInstruction, setCustomInstruction] = useState('');

	type UsageSummary = {
		inputTokens?: number;
		outputTokens?: number;
		totalTokens?: number;
	};

	type AssistantMetadata = {
		usage?: UsageSummary;
		providerMetadata?: {
			google?: {
				safetyRatings?: Array<{ category?: string; probability?: string; blocked?: boolean }>;
			};
			[key: string]: unknown;
		};
	};

	const { messages, sendMessage, status, error } = useChat({
		onError: err => {
			console.error('Error in chat:', err);
    }
  });

	const isLoading = useMemo(() => status === 'submitted' || status === 'streaming', [status]);

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		setInput(event.target.value);
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const trimmed = input.trim();
		if (!trimmed) return;
		try {
			await sendMessage({
				role: 'user',
				parts: [{ type: 'text', text: trimmed }],
				...(customInstruction
					? { metadata: { customSystemInstruction: customInstruction } }
					: {})
			});
			setInput('');
		} catch (err) {
			console.error('Could not send message:', err);
		}
	};

  return (
    <>
      {/* Botón flotante para abrir/cerrar chat */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
          aria-label="Open AI chat"
        >
          <Bot className="w-6 h-6" />
        </button>
      )}

      {/* Panel de chat */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <h3 className="font-semibold">Me-Vi Assistant</h3>
            </div>
						<div className="flex items-center gap-2">
							<button
								onClick={() => setShowAdvanced(prev => !prev)}
								className="text-white hover:text-gray-200 transition-colors"
								aria-label="Advanced options"
								type="button"
							>
								<Settings2 className="h-4 w-4" />
							</button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors"
								aria-label="Close chat"
            >
              ✕
            </button>
          </div>
          </div>

					{showAdvanced && (
						<div className="border-b border-gray-200 p-4 space-y-2 bg-blue-50/50">
							<label className="text-sm font-medium text-blue-900" htmlFor="custom-instructions">
								System instructions
							</label>
							<textarea
								id="custom-instructions"
								value={customInstruction}
								onChange={event => setCustomInstruction(event.target.value)}
								placeholder="Define the tone, format or specific objective for this conversation."
								className="w-full rounded-md border border-blue-200 bg-white p-2 text-sm text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
								rows={3}
							/>
							<p className="text-xs text-blue-800/80">
								These instructions are sent along with the prompt and are not visible to the end user.
							</p>
						</div>
					)}

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <Bot className="w-12 h-12 mx-auto mb-2 text-gray-400" />
								<p>
									Hello, I&apos;m Me-Vi. I can retrieve global KPIs, country rankings and historical series from the dataset. What would you like to analyze?
								</p>
              </div>
            )}
            {messages.map((message, index) => {
							const metadata = (message as { metadata?: AssistantMetadata }).metadata;
							const usage: UsageSummary | undefined = metadata?.usage;
							const safetyRatings = metadata?.providerMetadata?.google?.safetyRatings;
							const textParts = message.parts?.filter(
								(part): part is TextPart => part.type === 'text'
							) ?? [];
							const toolCalls = (message.parts?.filter(
								(part) => typeof part.type === 'string' && part.type.startsWith('tool-')
							) ?? []) as Array<{ toolCallId: string; toolName: string; input: unknown }>;
							const dataParts =
								message.parts?.filter(
									(part): part is { type: `data-${string}`; id?: string; data: unknown } => {
										return typeof part.type === 'string' && part.type.startsWith('data-') && 'data' in part;
									}
								) ?? [];

							const displayContent = textParts.length > 0 ? textParts.map(p => p.text).join('') : '';
							const showFallbackText = (!textParts || textParts.length === 0) && displayContent;

              return (
                <div
                  key={message.id || index}
									className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="bg-blue-100 rounded-full p-2">
                      <Bot className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
										<div className="space-y-2 whitespace-pre-wrap break-words">
											{textParts && textParts.length > 0 && (
												<div>
													{textParts.map((part, partIndex) => (
														<span key={`${message.id ?? index}-text-${partIndex}`}>{part.text}</span>
													))}
												</div>
											)}
											{showFallbackText && <span>{displayContent}</span>}
											{toolCalls && toolCalls.length > 0 && (
												<div className="rounded-md bg-white/80 p-2 text-xs text-gray-700">
													<p className="font-semibold">⚙️ Calling tool:</p>
													{toolCalls.map((toolCall, tcIndex) => (
														<div key={toolCall.toolCallId || `tool-${tcIndex}`} className="mt-1 rounded bg-gray-100 p-1 font-mono text-[11px]">
															{toolCall.toolName}({JSON.stringify(toolCall.input ?? {})})
														</div>
													))}
												</div>
											)}
											{dataParts.length > 0 && (
												<div className="rounded-md bg-white/70 p-2 text-xs text-gray-700">
													<p className="font-semibold">📊 Data returned:</p>
													{dataParts.map((part, partIndex) => (
														<pre
															key={`${message.id ?? index}-data-${part.id ?? partIndex}`}
															className="mt-1 max-h-48 overflow-auto rounded bg-gray-900/80 p-2 font-mono text-[11px] text-emerald-100"
														>
															{JSON.stringify(part.data ?? {}, null, 2)}
														</pre>
													))}
												</div>
											)}
										</div>
										{message.role === 'assistant' && (usage || (safetyRatings && safetyRatings.length > 0)) && (
											<div className="mt-2 space-y-1 text-xs">
											{usage && (
												<div className="text-blue-900/70">
													Tokens · input {usage.inputTokens ?? '—'} · output {usage.outputTokens ?? '—'} · total{' '}
													{usage.totalTokens ?? '—'}
												</div>
											)}
											{safetyRatings && safetyRatings.length > 0 && (
												<div className="flex items-center gap-1 text-amber-600">
													<ShieldAlert className="h-3 w-3" />
													<span>
														Safety review: {safetyRatings.map(r => r.category ?? 'general').join(', ')}
													</span>
												</div>
											)}
											</div>
										)}
                  </div>
                  {message.role === 'user' && (
                    <div className="bg-gray-200 rounded-full p-2">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                  )}
                </div>
              );
            })}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="bg-blue-100 rounded-full p-2">
                  <Bot className="w-4 h-4 text-blue-600" />
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
								value={input}
                onChange={handleChange}
								placeholder="Ask about the data..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            {error && (
              <div className="mt-2 text-xs text-red-600">
                Error: {error.message || 'Error processing message'}
              </div>
            )}
          </form>
        </div>
      )}
    </>
  );
}
