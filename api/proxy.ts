import { GoogleGenAI } from "@google/genai";

// This config specifies that this is a Vercel Edge Function.
export const config = {
  runtime: 'edge',
};

// The main handler for the proxy.
export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { apiKey, endpoint, payload } = await req.json();

    if (!apiKey || !endpoint || !payload) {
      return new Response(JSON.stringify({ error: 'Missing required parameters: apiKey, endpoint, payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    let response;

    switch (endpoint) {
      case 'validate':
        // A simple, low-cost call to validate the key
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Hi',
            config: { thinkingConfig: { thinkingBudget: 0 } }
        });
        response = { success: true, text: result.text };
        break;

      case 'generateImages':
        response = await ai.models.generateImages(payload);
        break;
      
      case 'generateContent':
        response = await ai.models.generateContent(payload);
        break;

      case 'generateVideos':
        response = await ai.models.generateVideos(payload);
        break;

      case 'getVideosOperation':
        response = await ai.operations.getVideosOperation(payload);
        break;

      default:
        return new Response(JSON.stringify({ error: `Unknown endpoint: ${endpoint}` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error(`Error in proxy handler:`, error);
    // The original error message from the Gemini API is more useful for debugging.
    const errorMessage = error.message || 'An internal server error occurred while contacting the Gemini API via the proxy.';
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
