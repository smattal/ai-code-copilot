import { ModelRouter } from './model/modelRouter';

// Default configuration for model routing
const defaultConfig = {
  maxInputLength: 100000,
  maxLatency: 5000,    // 5 seconds
  maxCost: 10         // 10 cents per request
};

// Create singleton instance
export const modelRouter = new ModelRouter(defaultConfig);