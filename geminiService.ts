import { EditedImagePart } from '../types';

const PROXY_URL = '/api/proxy';

const handleProxyError = async (response: Response, context: string): Promise<never> => {
    let errorJson;
    try {
        errorJson = await response.json();
    } catch (e) {
        throw new Error(`Failed to ${context.toLowerCase()} with status ${response.status}. Could not parse error response.`);
    }
    console.error(`Error in ${context}:`, errorJson);
    throw new Error(errorJson.error || `An unknown error occurred while ${context.toLowerCase()}`);
}

const callProxy = async (apiKey: string, endpoint: string, payload: any) => {
    const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, endpoint, payload })
    });
    if (!response.ok) {
        await handleProxyError(response, `calling endpoint ${endpoint}`);
    }
    return response.json();
}

export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  if (!apiKey) return false;
  try {
    await callProxy(apiKey, 'validate', {});
    return true;
  } catch (error) {
    console.error('API Key validation failed:', error);
    return false;
  }
};

export const generateImageWithImagen = async (apiKey: string, prompt: string): Promise<string[]> => {
    const payload = {
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/png',
        },
    };
    const response = await callProxy(apiKey, 'generateImages', payload);

    if (!response.generatedImages || response.generatedImages.length === 0) {
      throw new Error("The model did not return any images. Please try a different prompt.");
    }
    
    return response.generatedImages.map((img: any) => `data:image/png;base64,${img.image.imageBytes}`);
};

export const editImageWithNanoBanana = async (
  apiKey: string,
  base64ImageData: string,
  mimeType: string,
  prompt: string
): Promise<EditedImagePart[]> => {
    const payload = {
        model: 'gemini-2.5-flash-image-preview',
        contents: {
            parts: [
                { inlineData: { data: base64ImageData, mimeType: mimeType } },
                { text: prompt },
            ],
        },
        config: { responseModalities: ['IMAGE', 'TEXT'] },
    };
    const response = await callProxy(apiKey, 'generateContent', payload);
    
    const results: EditedImagePart[] = [];
    if (response.candidates && response.candidates.length > 0) {
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          results.push({ type: 'text', content: part.text });
        } else if (part.inlineData) {
          const base64ImageBytes: string = part.inlineData.data;
          const imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
          results.push({ type: 'image', content: imageUrl });
        }
      }
    }
    if (results.length === 0) {
        throw new Error("The model did not return any content. Please try a different prompt or image.");
    }
    return results;
};

export const generateVideoWithVeo = async (
  apiKey: string,
  prompt: string,
  model: string,
  base64ImageData?: string,
  mimeType?: string
): Promise<string> => {
    const generateParams: any = {
        model,
        prompt,
        config: { numberOfVideos: 1 }
    };
    
    if (base64ImageData && mimeType) {
        generateParams.image = {
            imageBytes: base64ImageData,
            mimeType: mimeType,
        };
    }

    let operation = await callProxy(apiKey, 'generateVideos', generateParams);
    
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await callProxy(apiKey, 'getVideosOperation', { operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation completed, but no download link was found.");
    }

    return `${downloadLink}&key=${apiKey}`;
};
