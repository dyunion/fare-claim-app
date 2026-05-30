// SmartFare Supabase Connection Configuration

export const SUPABASE_CONFIG = {
  URL: "https://jeglyodfwftpiodzyhfi.supabase.co",
  ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplZ2x5b2Rmd2Z0cGlvZHp5aGZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMjg2MzUsImV4cCI6MjA5NTYwNDYzNX0.gTgqnqEcl6qHagzxJx3JGLvYtFJiWumdYOjKsj96LQI"
};

export const EDGE_FUNCTIONS = {
  GEMINI_OCR_URL: `${SUPABASE_CONFIG.URL}/functions/v1/gemini-ocr`
};
