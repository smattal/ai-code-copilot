export interface ModelResponse {
  suggestion: string;
  confidence: number;
  model: string;
  reasoning: string;
}

export interface ModelConfig {
  maxLatency?: number;
  maxCost?: number;
}

export interface Fix {
  pattern: RegExp;
  fix: (match: string) => string;
  reasoning: string;
}