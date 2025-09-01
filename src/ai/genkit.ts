import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      models: {
        'ollama/llama3': {
          type: 'ollama',
          model: 'llama3',
          serverAddress: 'http://127.0.0.1:11434',
        },
      },
    }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
