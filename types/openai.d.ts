declare module "openai" {
  interface ChatMessage {
    role: string;
    content: string;
  }

  interface ChatCompletionRequest {
    model: string;
    messages: ChatMessage[];
    temperature?: number;
    max_tokens?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
  }

  interface ChatCompletionChoice {
    message?: { content?: string | null };
  }

  interface ChatCompletionUsage {
    total_tokens?: number;
  }

  interface ChatCompletionResponse {
    choices: ChatCompletionChoice[];
    usage?: ChatCompletionUsage;
  }

  export default class OpenAI {
    constructor(config: { apiKey?: string });
    chat: {
      completions: {
        create: (request: ChatCompletionRequest) => Promise<ChatCompletionResponse>;
      };
    };
  }
}
