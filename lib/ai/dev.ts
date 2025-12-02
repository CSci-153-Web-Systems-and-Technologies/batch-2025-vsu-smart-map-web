import { genkit } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/googleai';

// Simple dev server setup
// This file is intended to be run with `genkit start` or similar, 
// but since we want to use our config, we might need to export the config.

// Actually, the Genkit CLI usually looks for a `genkit.config.ts` or similar.
// But the guide says "Create lib/ai/dev.ts and add ai:dev script".
// And "npm run ai:dev opens Genkit UI".

// So we probably want to use the `startGenkit` function if available, or just configure it here.

const ai = genkit({
  plugins: [googleAI()],
  model: gemini15Flash,
});

// We need to keep the process alive
console.log('Genkit dev server configured. Run `npx genkit start` to launch UI.');

// If we want to start it programmatically:
// import { startGenkit } from 'genkit';
// startGenkit(ai); 
// But startGenkit might not be exported or might be internal.

// Let's just make this a config file that genkit CLI can use.
export default ai;
