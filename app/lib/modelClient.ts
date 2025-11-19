import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ChatOptions {
  model?: string;
  messages: any;
  temperature?: number;
  max_completion_tokens?: number;
  response_format?: any;
  [key: string]: any;
}

/**
 * Centralized chat completion wrapper.
 * Chooses a default model via `OPENAI_MODEL` or falls back to `gpt-5`.
 */
export async function createChatCompletion(opts: ChatOptions) {
  try {
    const model = opts.model || process.env.OPENAI_MODEL || 'gpt-5';

    // Build request payload; copy allowed fields to avoid passing undefined
    const payload: any = {
      model,
      messages: opts.messages,
    };

    if (typeof opts.temperature !== 'undefined') payload.temperature = opts.temperature;
    if (typeof opts.max_completion_tokens !== 'undefined') payload.max_completion_tokens = opts.max_completion_tokens;
    if (typeof opts.response_format !== 'undefined') payload.response_format = opts.response_format;

    // include any other fields the caller passed
    for (const k of Object.keys(opts)) {
      if (!['model', 'messages', 'temperature', 'max_completion_tokens', 'response_format'].includes(k)) {
        payload[k] = opts[k];
      }
    }

    return await client.chat.completions.create(payload);
  } catch (error) {
    console.error('Error in modelClient.createChatCompletion:', error);
    throw error;
  }
}

