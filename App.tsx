
import React, { useState, useEffect } from 'react';
import { Tool } from './types';
import ImageStudio from './components/ImageStudio';
import VideoGenerator from './components/VideoGenerator';
import ApiKeyInput from './components/ApiKeyInput';
import { validateApiKey } from './services/geminiService';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>(localStorage.getItem('gemini-api-key') || '');
  const [isKeyValid, setIsKeyValid] = useState<boolean | null>(null);
  const [isKeyChecking, setIsKeyChecking] = useState<boolean>(true);
  const [activeTool, setActiveTool] = useState<Tool>(Tool.IMAGE_STUDIO);

  const handleApiKeySubmit = async (key: string, isInitialLoad: boolean = false) => {
    // Don't show loading spinner on initial silent check
    if (!isInitialLoad) {
        setIsKeyChecking(true);
    }
    
    const trimmedKey = key.trim();
    if (!trimmedKey) {
        setIsKeyValid(false);
        setApiKey('');
        localStorage.removeItem('gemini-api-key');
        setIsKeyChecking(false);
        return;
    }

    const isValid = await validateApiKey(trimmedKey);
    setIsKeyValid(isValid);
    if (isValid) {
        setApiKey(trimmedKey);
        localStorage.setItem('gemini-api-key', trimmedKey);
    } else {
        // Clear invalid key from state and storage
        setApiKey('');
        localStorage.removeItem('gemini-api-key');
    }
    setIsKeyChecking(false);
  };
  
  useEffect(() => {
    if (apiKey) {
      handleApiKeySubmit(apiKey, true);
    } else {
      setIsKeyChecking(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on initial mount

  const renderTool = () => {
    switch (activeTool) {
      case Tool.IMAGE_STUDIO:
        return <ImageStudio apiKey={apiKey} isKeyValid={isKeyValid} />;
      case Tool.VIDEO_GENERATOR:
        return <VideoGenerator apiKey={apiKey} isKeyValid={isKeyValid} />;
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
            onApiKeySubmit={(key) => handleApiKeySubmit(key, false)}
          />
          
          {isKeyValid ? (
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
          ) : (
             !isKeyChecking && (
                 <div className="text-center text-gray-400 bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                    <p>Please enter a valid Google Gemini API Key above to use the tools.</p>
                </div>
             )
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
