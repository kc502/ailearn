import React, { useState, useEffect, useCallback } from 'react';
import { Tool } from './types';
import ImageStudio from './components/ImageStudio';
import VideoGenerator from './components/VideoGenerator';
import ApiKeyInput from './components/ApiKeyInput';
import { validateApiKey } from './geminiService';

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<Tool>(Tool.IMAGE_STUDIO);
  const [apiKey, setApiKey] = useState<string>('');
  const [isKeyValid, setIsKeyValid] = useState<boolean | null>(null);
  const [isKeyChecking, setIsKeyChecking] = useState<boolean>(true);

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini-api-key');
    if (storedKey) {
      handleApiKeySubmit(storedKey, true);
    } else {
      setIsKeyChecking(false); // No key stored, stop checking
    }
  }, []);

  const handleApiKeySubmit = useCallback(async (key: string, isInitialLoad = false) => {
    if (!key) {
        setApiKey('');
        setIsKeyValid(false);
        setIsKeyChecking(false);
        localStorage.removeItem('gemini-api-key');
        return;
    }
    
    setIsKeyChecking(true);
    setApiKey(key);

    const isValid = await validateApiKey(key);
    
    setIsKeyValid(isValid);
    setIsKeyChecking(false);

    if (isValid) {
      localStorage.setItem('gemini-api-key', key);
    } else if (!isInitialLoad) {
      localStorage.removeItem('gemini-api-key');
    }
  }, []);


  const renderTool = () => {
    switch (activeTool) {
      case Tool.IMAGE_STUDIO:
        return <ImageStudio apiKey={apiKey} isKeyValid={isKeyValid === true} />;
      case Tool.VIDEO_GENERATOR:
        return <VideoGenerator apiKey={apiKey} isKeyValid={isKeyValid === true} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            Gemini Multimedia Studio
          </h1>
          <p className="mt-3 text-lg text-gray-400">
            Edit and generate images and videos with the power of Google's Gemini models.
          </p>
        </header>

        <main>
          <ApiKeyInput
            apiKey={apiKey}
            isKeyValid={isKeyValid}
            isKeyChecking={isKeyChecking}
            onApiKeySubmit={handleApiKeySubmit}
          />
          
          {isKeyValid && (
            <>
              <div className="flex justify-center my-8">
                <div className="relative inline-flex bg-gray-800 rounded-lg p-1 space-x-1">
                  <button
                    onClick={() => setActiveTool(Tool.IMAGE_STUDIO)}
                    className={`relative w-40 text-center py-2 px-4 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900
                      ${activeTool === Tool.IMAGE_STUDIO ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                  >
                    Image Studio
                  </button>
                  <button
                    onClick={() => setActiveTool(Tool.VIDEO_GENERATOR)}
                    className={`relative w-40 text-center py-2 px-4 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900
                      ${activeTool === Tool.VIDEO_GENERATOR ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                  >
                    Video Generator
                  </button>
                </div>
              </div>

              <div className="mt-4">
                {renderTool()}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
