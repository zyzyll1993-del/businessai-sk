# BusinessAI.SK secure AI backend

This folder contains the server-side AI proxy for BusinessAI.SK. The API key must never be added to browser JavaScript or committed to GitHub.

## Cloudflare Worker

1. Create a Cloudflare Worker and paste `cloudflare-worker.js` into it.
2. Add the secret `OPENAI_API_KEY` in Worker Settings → Variables and Secrets.
3. Add `ALLOWED_ORIGIN` with the exact public site origin, for example `https://zyzyll1993-del.github.io`.
4. Optional: add `OPENAI_MODEL`. Default is `gpt-5.6-luna`.
5. Deploy the Worker and copy its HTTPS URL.
6. Connect the frontend by defining `window.BUSINESSAI_AI_ENDPOINT` before `ai-assistant.js` loads, or during testing save the Worker URL to localStorage key `businessai-ai-endpoint`.

The frontend only sends the user's question, selected module, language, and saved BusinessAI workspace. The Worker limits the question length and calls the OpenAI Responses API server-side.
