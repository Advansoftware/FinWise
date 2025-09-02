import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {openAI} from 'genkitx-openai/openai';

// AI plugins are configured dynamically within each flow based on settings from Firestore.
// The initial configuration here can be minimal.
export const ai = genkit({
  plugins: [
    googleAI(),
    openAI(),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
