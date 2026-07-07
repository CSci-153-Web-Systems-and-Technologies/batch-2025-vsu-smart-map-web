import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model(process.env.GEMINI_MODEL || 'gemini-flash-latest'),
});

console.log('Genkit dev server configured. Run `npx genkit start` to launch UI.');

export default ai;
