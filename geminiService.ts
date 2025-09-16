import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { EditedImagePart } from '../types';

/**
 * Validates a Google Gemini API key by making a lightweight, non-streaming call.
 * @param apiKey The API key to validate.
 * @returns A promise that resolves to true if the key is valid, and false otherwise.
 */
export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  if (!apiKey) return false;
  try {
    const ai = new GoogleGenAI({ apiKey });
    // Make a lightweight, non-streaming call to check credentials.
    await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Hi',
        config: { thinkingConfig: { thinkingBudget: 0 } }
    });
    return true;
  } catch (error) {
    console.error("API Key validation failed:", error);
    return false;
  }
};

/**
 * Generates an image using the Imagen model.
 * @param apiKey The user's Google Gemini API key.
 * @param prompt The text prompt for image generation.
 * @returns A promise that resolves to an array of base64-encoded image data URLs.
 */
export const generateImageWithImagen = async (apiKey: string, prompt: string): Promise<string[]> => {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/png',
        },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
      throw new Error("The model did not return any images. Please try a different prompt.");
    }
    
    return response.generatedImages.map((img: any) => `data:image/png;base64,${img.image.imageBytes}`);
};

/**
 * Edits an image using the 'Nano Banana' model.
 * @param apiKey The user's Google Gemini API key.
 * @param base64ImageData The base64-encoded string of the image to edit.
 * @param mimeType The MIME type of the image.
 * @param prompt The text prompt describing the desired edits.
 * @returns A promise that resolves to an array of edited image parts (text or image).
 */
export const editImageWithNanoBanana = async (
  apiKey: string,
  base64ImageData: string,
  mimeType: string,
  prompt: string,
): Promise<EditedImagePart[]> => {
    const ai = new GoogleGenAI({ apiKey });
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
            parts: [
                { inlineData: { data: base64ImageData, mimeType: mimeType } },
                { text: prompt },
            ],
        },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    
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

/**
 * Generates a video using the VEO model family.
 * @param apiKey The user's Google Gemini API key.
 * @param prompt The text prompt for video generation.
 * @param model The specific VEO model to use.
 * @param base64ImageData Optional base64-encoded seed image.
 * @param mimeType Optional MIME type for the seed image.
 * @returns A promise that resolves to the downloadable video URI.
 */
export const generateVideoWithVeo = async (
  apiKey: string,
  prompt: string,
  model: string,
  base64ImageData?: string,
  mimeType?: string
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey });
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

    let operation = await ai.models.generateVideos(generateParams);
    
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation completed, but no download link was found.");
    }

    // The VEO API requires the API key to be appended to the download URI for access.
    return `${downloadLink}&key=${apiKey}`;
};
