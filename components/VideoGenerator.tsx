import React, { useState, useCallback, useEffect } from 'react';
// FIX: API key is handled server-side. The apiKey parameter is removed from service functions.
import { generateVideoWithVeo } from '../geminiService';
import { fileToBase64 } from '../utils/fileUtils';

interface VideoGeneratorProps {
  // FIX: Prop changed to `isApiReady` to reflect server-side key management.
  isApiReady: boolean;
}

const loadingMessages = [
  "Warming up the video synthesizer...",
  "Gathering creative inspiration...",
  "Directing the digital actors...",
  "Compositing virtual scenes...",
  "Rendering frame by frame...",
  "Applying special effects...",
  "Encoding final video stream...",
  "This can take a few minutes, please be patient...",
];

const VEO_MODELS: { [key: string]: string } = {
    'veo2': 'veo-2.0-generate-001',
    // 'veo3': 'veo-3.0-generate-001', // Commenting out non-public models
    // 'veo3 fast': 'veo-3.0-fast-generate-001',
};

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ isApiReady }) => {
  const [prompt, setPrompt] = useState<string>('A majestic cinematic shot of a futuristic city at sunset');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('veo2');
  const [resolution, setResolution] = useState<string>('1080p');
  const [frameRate, setFrameRate] = useState<number>(24);
  const [duration, setDuration] = useState<number>(5);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>(loadingMessages[0]);
  const [error, setError] = useState<string | null>(null);
  const [resultUri, setResultUri] = useState<string | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isLoading) {
      let messageIndex = 0;
      interval = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[messageIndex]);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setResultUri(null);
    }
  };

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!prompt) {
      setError('Please provide a prompt.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResultUri(null);
    setLoadingMessage(loadingMessages[0]);

    try {
      let base64Image: string | undefined = undefined;
      if (imageFile) {
        base64Image = await fileToBase64(imageFile);
      }
      const modelId = VEO_MODELS[selectedModel];
      // FIX: Removed apiKey from the service function call.
      const uri = await generateVideoWithVeo(prompt, modelId, base64Image, imageFile?.type);
      setResultUri(uri);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  // FIX: Removed apiKey from dependencies.
  }, [prompt, imageFile, selectedModel]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6">
      <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="prompt-video" className="block text-sm font-medium text-gray-300">Video Prompt</label>
            <textarea
              id="prompt-video"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-white p-2"
              placeholder="e.g., An astronaut riding a horse on Mars"
            />
          </div>

          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="resolution" className="block text-sm font-medium text-gray-300">Resolution</label>
                <select
                  id="resolution"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  disabled
                  className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-white p-2 disabled:opacity-50"
                >
                  <option value="1080p">1080p (HD)</option>
                  <option value="720p">720p</option>
                  <option value="480p">480p (SD)</option>
                </select>
              </div>
              <div>
                <label htmlFor="frame-rate" className="block text-sm font-medium text-gray-300">Frame Rate</label>
                <select
                  id="frame-rate"
                  value={frameRate}
                   onChange={(e) => setFrameRate(Number(e.target.value))}
                   disabled
                   className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-white p-2 disabled:opacity-50"
                >
                  <option value={24}>24 fps</option>
                  <option value={30}>30 fps</option>
                  <option value={60}>60 fps</option>
                </select>
              </div>
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-300">Duration</label>
                <select
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  disabled
                  className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-white p-2 disabled:opacity-50"
                >
                  <option value={5}>5 seconds</option>
                  <option value={10}>10 seconds</option>
                  <option value={15}>15 seconds</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Note: Advanced video settings are for UI demonstration and not yet supported by the API.</p>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-300">Video Model</label>
             <fieldset className="mt-2">
                <div className="flex items-center space-x-4">
                  {Object.keys(VEO_MODELS).map((model) => (
                    <div key={model} className="flex items-center">
                      <input
                        id={model}
                        name="video-model"
                        type="radio"
                        checked={selectedModel === model}
                        onChange={() => setSelectedModel(model)}
                        className="h-4 w-4 text-purple-600 bg-gray-700 border-gray-500 focus:ring-purple-500"
                      />
                      <label htmlFor={model} className="ml-2 block text-sm font-medium text-gray-300 capitalize">{model}</label>
                    </div>
                  ))}
                </div>
             </fieldset>
          </div>

          <div>
            <label htmlFor="file-upload-video" className="block text-sm font-medium text-gray-300">Seed Image (Optional)</label>
            {imagePreview ? (
              <div className="mt-2">
                <img src={imagePreview} alt="Preview" className="rounded-lg object-contain w-full h-auto max-h-48" />
                <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="mt-2 text-sm text-red-400 hover:text-red-300">Remove image</button>
              </div>
            ) : (
            <div className="mt-2 flex items-center justify-center w-full">
                <label htmlFor="file-upload-video" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-700 hover:border-purple-400 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-2 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/></svg>
                        <p className="text-sm text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    </div>
                    <input id="file-upload-video" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                </label>
            </div>
            )}
          </div>
          
          <button
            type="submit"
            // FIX: Use isApiReady instead of isKeyValid to determine if button is disabled.
            disabled={isLoading || !prompt || !isApiReady}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-200"
          >
            Generate Video
          </button>
        </form>
      </div>

      {isLoading && (
        <div className="mt-6 p-6 bg-gray-800/50 rounded-lg text-center border border-gray-700">
          <svg className="animate-spin mx-auto h-10 w-10 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-lg font-semibold">Generating Video...</p>
          <p className="text-gray-400 mt-2">{loadingMessage}</p>
        </div>
      )}

      {error && <div className="mt-6 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-md">{error}</div>}

      {resultUri && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-gray-100 mb-4">Generated Video</h3>
          <video controls autoPlay loop className="w-full rounded-lg shadow-lg">
            <source src={resultUri} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}
    </div>
  );
};

export default VideoGenerator;
