import React, { useState, useEffect } from 'react';
// FIX: API key is handled server-side. The apiKey parameter is removed from service functions.
import { editImageWithNanoBanana, generateImageWithImagen } from '../geminiService';
import { fileToBase64, dataUrlToFile } from '../utils/fileUtils';
import { EditedImagePart } from '../types';

interface ImageStudioProps {
  // FIX: Prop changed to `isApiReady` to reflect server-side key management.
  isApiReady: boolean;
}

interface ImageEditResult {
  originalPreview: string;
  originalName: string;
  editedParts: EditedImagePart[];
}

type StudioMode = 'GENERATE' | 'EDIT';

const ImageStudio: React.FC<ImageStudioProps> = ({ isApiReady }) => {
  const [mode, setMode] = useState<StudioMode>('GENERATE');
  const [prompt, setPrompt] = useState<string>('A photorealistic image of a cat wearing a tiny wizard hat');
  
  // Edit mode state
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [editResults, setEditResults] = useState<ImageEditResult[]>([]);
  
  // Generate mode state
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  
  // Common state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
        imagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const handleModeChange = (newMode: StudioMode) => {
    setMode(newMode);
    setError(null);
    // Clear results when switching modes to avoid confusion
    setEditResults([]);
    setGeneratedImages([]);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setImageFiles(prev => [...prev, ...fileArray]);
      
      const newPreviews = fileArray.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
      setEditResults([]);
      event.target.value = ''; 
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    URL.revokeObjectURL(imagePreviews[indexToRemove]);
    setImageFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    setImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const clearAllImages = () => {
    imagePreviews.forEach(url => URL.revokeObjectURL(url));
    setImageFiles([]);
    setImagePreviews([]);
    setEditResults([]);
  }

  const handleEditGeneratedImage = async (imageUrl: string) => {
    const file = await dataUrlToFile(imageUrl, 'generated-image.png');
    const previewUrl = URL.createObjectURL(file);
    
    setImageFiles([file]);
    setImagePreviews([previewUrl]);
    setGeneratedImages([]); // Clear generated results
    setMode('EDIT');
    // Scroll to top may be useful here
    window.scrollTo(0, 0);
  };
  
  const handleGenerateSubmit = async () => {
      if (!prompt) {
          setError('Please provide a prompt.');
          return;
      }
      setIsLoading(true);
      setError(null);
      setGeneratedImages([]);
      setProcessingStatus('Generating image...');

      try {
          // FIX: Removed apiKey from the service function call.
          const response = await generateImageWithImagen(prompt);
          setGeneratedImages(response);
      } catch (err: any) {
          setError(err.message || 'An unknown error occurred during image generation.');
      } finally {
          setIsLoading(false);
          setProcessingStatus(null);
      }
  };

  const handleEditSubmit = async () => {
      if (!prompt || imageFiles.length === 0) {
        setError('Please provide a prompt and at least one image.');
        return;
      }
      setIsLoading(true);
      setError(null);
      setEditResults([]);

      try {
        const newResults: ImageEditResult[] = [];
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          setProcessingStatus(`Editing image ${i + 1} of ${imageFiles.length}: ${file.name}`);
          const base64Image = await fileToBase64(file);
          // FIX: Removed apiKey from the service function call.
          const response = await editImageWithNanoBanana(base64Image, file.type, prompt);
          newResults.push({
              originalPreview: imagePreviews[i],
              originalName: file.name,
              editedParts: response,
          });
          setEditResults([...newResults]);
        }
      } catch (err: any) {
        setError(err.message || 'An unknown error occurred during image editing.');
      } finally {
        setIsLoading(false);
        setProcessingStatus(null);
      }
  };

  const handleSubmit = (event: React.FormEvent) => {
      event.preventDefault();
      if (mode === 'GENERATE') {
          handleGenerateSubmit();
      } else {
          handleEditSubmit();
      }
  };

  const handleDownload = (imageUrl: string, originalName: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    const nameParts = originalName.split('.');
    const extension = nameParts.pop() || 'png';
    const name = nameParts.join('.');
    link.download = `${name}-${mode.toLowerCase()}d.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isSubmitDisabled = () => {
      // FIX: Use isApiReady instead of isKeyValid to determine if button is disabled.
      if (isLoading || !prompt || !isApiReady) return true;
      if (mode === 'EDIT' && imageFiles.length === 0) return true;
      return false;
  };

  const renderContent = () => {
      if (mode === 'EDIT') {
          return imagePreviews.length > 0 ? (
            <div className="w-full space-y-4">
               <div className="flex justify-between items-center">
                  <h4 className="text-lg font-medium text-gray-300">Selected Images ({imagePreviews.length})</h4>
                  <button type="button" onClick={clearAllImages} className="text-sm text-red-400 hover:text-red-300">Remove all</button>
               </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group aspect-square">
                    <img src={preview} alt={`Preview ${index}`} className="rounded-lg object-cover w-full h-full" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-lg"
                      aria-label="Remove image"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
              <FileInput isMulti={true} />
            </div>
          ) : <FileInput />;
      }
      // GENERATE mode has no file input
      return (
        <div className="text-center bg-gray-800/50 p-6 rounded-lg border-2 border-dashed border-gray-600">
            <h4 className="text-lg font-medium text-gray-300">Ready to Generate</h4>
            <p className="text-gray-400 mt-2">Write a prompt on the right and click "Generate Image" to create a new image from your text description.</p>
        </div>
      );
  };
  
  const FileInput = ({isMulti=false}) => (
    <div className="w-full">
      <label htmlFor="file-upload" className={`block text-sm font-medium text-gray-300 ${isMulti ? 'sr-only' : 'mb-2'}`}>
        {isMulti ? 'Add More Images' : 'Upload Image(s)'}
      </label>
      <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md hover:border-purple-400 transition-colors ${isMulti ? 'py-4' : ''}`}>
        <div className="space-y-1 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="flex text-sm text-gray-400">
            <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-purple-400 hover:text-purple-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 focus-within:ring-purple-500 px-1">
              <span>Upload file(s)</span>
              <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" multiple />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6">
       <div className="flex justify-center mb-6">
        <div className="relative inline-flex bg-gray-800 rounded-lg p-1 space-x-1">
            <button onClick={() => handleModeChange('GENERATE')} className={`relative w-32 text-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${mode === 'GENERATE' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Generate</button>
            <button onClick={() => handleModeChange('EDIT')} className={`relative w-32 text-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${mode === 'EDIT' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Edit</button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
             {renderContent()}
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-300">{mode === 'GENERATE' ? 'Generation Prompt' : 'Editing Prompt'}</label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-white placeholder-gray-400 p-2"
                placeholder={mode === 'GENERATE' ? 'e.g., A photo of a raccoon in a business suit' : 'e.g., Add a futuristic city background'}
              />
               <p className="text-xs text-gray-500 mt-2">{mode === 'EDIT' ? 'This prompt will be applied to all uploaded images.' : 'Describe the image you want to create.'}</p>
            </div>
            <button
              type="submit"
              disabled={isSubmitDisabled()}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {processingStatus || 'Processing...'}
                </>
              ) : mode === 'GENERATE' ? 'Generate Image' : `Edit ${imageFiles.length > 0 ? imageFiles.length : ''} Image(s)`}
            </button>
            {isLoading && processingStatus && (
                <p className="text-sm text-center text-gray-400">{processingStatus}</p>
            )}
          </div>
        </div>
      </form>

      {error && <div className="mt-6 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-md">{error}</div>}

      {/* RENDER RESULTS */}
      <div className="mt-8">
        {generatedImages.length > 0 && (
             <div>
                <h3 className="text-xl font-semibold text-gray-100 mb-4">Generated Image</h3>
                <div className="grid grid-cols-1 gap-4">
                    {generatedImages.map((imageUrl, index) => (
                        <div key={index} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                             <img src={imageUrl} alt={`Generated result ${index}`} className="rounded-lg object-contain w-full h-auto" />
                             <div className="flex space-x-2 mt-4">
                                <button
                                    onClick={() => handleDownload(imageUrl, `generated-${index}`)}
                                    className="w-full inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500"
                                >
                                    Download
                                </button>
                                <button
                                    onClick={() => handleEditGeneratedImage(imageUrl)}
                                    className="w-full inline-flex justify-center items-center px-3 py-2 border border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-200 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500"
                                >
                                    Edit this Image
                                </button>
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {editResults.length > 0 && (
            <div>
                <h3 className="text-xl font-semibold text-gray-100 mb-4">Edit Results</h3>
                <div className="space-y-8">
                    {editResults.map((result, resultIndex) => (
                         <div key={resultIndex} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                            <h4 className="text-lg font-medium text-gray-300 mb-2 truncate" title={result.originalName}>
                                {result.originalName}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                <div>
                                    <h5 className="text-md font-medium text-gray-400 mb-2">Original</h5>
                                    <img src={result.originalPreview} alt="Original" className="rounded-lg object-contain w-full h-auto" />
                                </div>
                                <div className="space-y-4">
                                    {result.editedParts.filter(p => p.type === 'image').map((part, partIndex) => (
                                        <div key={partIndex}>
                                            <div className="flex justify-between items-center mb-2">
                                                <h5 className="text-md font-medium text-gray-400">Edited Image</h5>
                                                <button
                                                    onClick={() => handleDownload(part.content, result.originalName)}
                                                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500"
                                                >
                                                    <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                                    Download
                                                </button>
                                            </div>
                                            <img src={part.content} alt={`Edited result ${partIndex}`} className="rounded-lg object-contain w-full h-auto" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {result.editedParts.filter(p => p.type === 'text').map((part, partIndex) => (
                                <div key={partIndex} className="mt-4">
                                    <h5 className="text-md font-medium text-gray-400 mb-2">Model's Note</h5>
                                    <p className="text-gray-300 bg-gray-800 p-4 rounded-md">{part.content}</p>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default ImageStudio;
