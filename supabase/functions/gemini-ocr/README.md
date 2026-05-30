# gemini-ocr Edge Function

This function keeps the Gemini API key out of the public GitHub Pages app.

## Supabase setup

1. Open Supabase Dashboard.
2. Go to Edge Functions.
3. Create or deploy a function named `gemini-ocr`.
4. Add a Function Secret named `GEMINI_API_KEY`.
5. Paste the Gemini API key as the secret value.
6. Optionally add `GEMINI_MODEL`. The default is `gemini-2.5-flash`.
7. Deploy the function code from `index.ts`.

The web app calls:

```text
https://jeglyodfwftpiodzyhfi.supabase.co/functions/v1/gemini-ocr
```
