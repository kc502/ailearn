import { GenerateContentResponse, Modality } from "@google/genai";
import { EditedImagePart } from '../types';

// FIX: A helper function to call our own server-side proxy API.
// This encapsulates the logic for communicating with the proxy, which securely handles the API key.
const callProxy = async (endpoint: string, payload: any) => {
  const response = await fetch('/api/proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ endpoint, payload }),
  });

  const data = await response.json();
  if (!response.ok) {
    // The proxy is designed to forward the Gemini API's error message, which is more informative.
    throw new Error(data.error || 'An unexpected error occurred via the proxy.');
  }
  return data;
};


// FIX: This function is now a health check for the server-side API key configuration.
// It replaces the client-side key validation.
export const checkApiReadiness = async (): Promise<boolean> => {
  try {
    await callProxy('validate', {});
    return true;
  } catch (error) {
    console.error('API readiness check failed:', error);
    return false;
  }
};

// FIX: Removed apiKey parameter. The API key is now handled by the server-side proxy.
export const generateImageWithImagen = async (prompt: string): Promise<string[]> => {
    const payload = {
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/png',
        },
    };
    const response = await callProxy('generateImages', payload);

    if (!response.generatedImages || response.generatedImages.length === 0) {
      throw new Error("The model did not return any images. Please try a different prompt.");
    }
    
    return response.generatedImages.map((img: any) => `data:image/png;base64,${img.image.imageBytes}`);
};

// FIX: Removed apiKey parameter. The API key is now handled by the server-side proxy.
// This change fixes the "Expected 4 arguments, but got 3" error in ImageEditor.tsx.
export const editImageWithNanoBanana = async (
  base64ImageData: string,
  mimeType: string,
  prompt: string,
): Promise<EditedImagePart[]> => {
    const payload = {
        model: 'gemini-2.5-flash-image-preview',
        contents: {
            parts: [
                { inlineData: { data: base64ImageData, mimeType: mimeType } },
                { text: prompt },
            ],
        },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    };
    const response: GenerateContentResponse = await callProxy('generateContent', payload);
    
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

// FIX: Removed apiKey parameter. The API key and video URI signing are now handled by the server-side proxy.
export const generateVideoWithVeo = async (
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

    let operation = await callProxy('generateVideos', generateParams);
    
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      // FIX: Call the proxy for polling, passing only the operation name as required.
      operation = await callProxy('getVideosOperation', { operationName: operation.name });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation completed, but no download link was found.");
    }

    // FIX: The proxy now appends the API key, so the link can be used directly.
    return downloadLink;
};
