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
    // FIX: API key must be read from environment variables on the server, not passed from the client.
    const { endpoint, payload } = await req.json();
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key is not configured on the server.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }


    if (!endpoint || !payload) {
      return new Response(JSON.stringify({ error: 'Missing required parameters: endpoint, payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    let response;

    switch (endpoint) {
      case 'validate':
        // This is now a health check for the server-side API key.
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
        const operationName = payload.operationName;
        if (!operationName) {
            return new Response(JSON.stringify({ error: 'payload missing operationName' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        // FIX: The SDK's getVideosOperation expects a full GenerateVideosOperation object,
        // which causes a type error if we only provide the name from the client.
        // Casting to `any` bypasses the strict type check. At runtime, only the name is required by the underlying API.
        response = await ai.operations.getVideosOperation({ operation: { name: operationName } as any });
        
        // FIX: Append API key to download URI for client-side access, as client no longer has the key.
        if (response.done && response.response?.generatedVideos?.[0]?.video?.uri) {
            const downloadLink = response.response.generatedVideos[0].video.uri;
            response.response.generatedVideos[0].video.uri = `${downloadLink}&key=${apiKey}`;
        }
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
