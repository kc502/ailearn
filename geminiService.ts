
import { GoogleGenAI, Modality } from "@google/genai";
import { EditedImagePart } from '../types';

const handleApiError = (error: any, context: string): never => {
    console.error(`Error in ${context}:`, error);
    if (error instanceof Error && (error.message.includes('API key') || error.message.includes('permission'))) {
        throw new Error('The provided API Key is invalid or lacks permissions. Please check your key and try again.');
    }
    if (error instanceof Error) {
        throw new Error(`Failed to ${context.toLowerCase()} with Gemini API: ${error.message}`);
    }
    throw new Error(`Failed to ${context.toLowerCase()} with Gemini API. Check console for details.`);
}

export const validateApiKey = async (apiKey: string): Promise<boolean> => {
    if (!apiKey) return false;
    try {
        const ai = new GoogleGenAI({ apiKey });
        // A very simple, low-cost request to check for authentication errors.
        await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'h',
            config: { thinkingConfig: { thinkingBudget: 0 } }
        });
        return true;
    } catch (error) {
        console.error("API Key validation failed:", error);
        return false;
    }
};

export const generateImageWithImagen = async (apiKey: string, prompt: string): Promise<string[]> => {
  try {
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
    
    return response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
  } catch (error: any) {
    handleApiError(error, "generate image");
  }
};


export const editImageWithNanoBanana = async (
  apiKey: string,
  base64ImageData: string,
  mimeType: string,
  prompt: string
): Promise<EditedImagePart[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
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
  } catch (error: any) {
    handleApiError(error, "edit image");
  }
};


export const generateVideoWithVeo = async (
  apiKey: string,
  prompt: string,
  model: string,
  base64ImageData?: string,
  mimeType?: string
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const generateParams: any = {
        model,
        prompt,
        config: {
            numberOfVideos: 1
        }
    };
    
    if (base64ImageData && mimeType) {
        generateParams.image = {
            imageBytes: base64ImageData,
            mimeType: mimeType,
        };
    }

    let operation = await ai.models.generateVideos(generateParams);
    
    while (!operation.done) {
      // Poll every 10 seconds
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation completed, but no download link was found.");
    }

    return `${downloadLink}&key=${apiKey}`;
  } catch (error: any) {
    handleApiError(error, "generate video");
  }
};
