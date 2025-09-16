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
  const [isKeyChecking, setIsKeyChecking] = useState<boolean>(false);

  // On initial load, try to get API key from localStorage and validate it.
  useEffect(() => {
    const storedApiKey = localStorage.getItem('gemini-api-key');
    if (storedApiKey) {
      handleApiKeySubmit(storedApiKey);
    }
  }, []);

  const handleApiKeySubmit = useCallback(async (key: string) => {
    if (!key) {
      setApiKey('');
      setIsKeyValid(false);
      localStorage.removeItem('gemini-api-key');
      return;
    }

    setIsKeyChecking(true);
    setIsKeyValid(null);
    setApiKey(key);
    
    const isValid = await validateApiKey(key);
    
    setIsKeyValid(isValid);
    setIsKeyChecking(false);
    
    if (isValid) {
      localStorage.setItem('gemini-api-key', key);
    } else {
      localStorage.removeItem('gemini-api-key');
    }
  }, []);

  const renderTool = () => {
    // The apiKey is passed to the components.
    // The components' UI elements will be disabled if the key is missing or invalid.
    switch (activeTool) {
      case Tool.IMAGE_STUDIO:
        return <ImageStudio apiKey={apiKey} />;
      case Tool.VIDEO_GENERATOR:
        return <VideoGenerator apiKey={apiKey} />;
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
          <p className="mt-3 max-w-2xl mx-auto text-lg text-gray-400">
            Create and edit images and videos with the power of Google's Gemini models.
          </p>
        </header>

        <main>
          <ApiKeyInput 
            apiKey={apiKey} 
            isKeyValid={isKeyValid} 
            isKeyChecking={isKeyChecking}
            onApiKeySubmit={handleApiKeySubmit} 
          />

          {isKeyValid ? (
            <div>
              <nav className="flex justify-center mb-8 border-b border-gray-700">
                <button
                  onClick={() => setActiveTool(Tool.IMAGE_STUDIO)}
                  className={`px-4 py-3 text-sm font-medium transition-colors duration-200 ease-in-out
                    ${activeTool === Tool.IMAGE_STUDIO
                      ? 'border-b-2 border-purple-500 text-white'
                      : 'text-gray-400 hover:text-white'
                    }`}
                >
                  Image Studio
                </button>
                <button
                  onClick={() => setActiveTool(Tool.VIDEO_GENERATOR)}
                  className={`px-4 py-3 text-sm font-medium transition-colors duration-200 ease-in-out
                    ${activeTool === Tool.VIDEO_GENERATOR
                      ? 'border-b-2 border-purple-500 text-white'
                      : 'text-gray-400 hover:text-white'
                    }`}
                >
                  Video Generator
                </button>
              </nav>
              {renderTool()}
            </div>
          ) : (
            // Show a welcome message if the key has been checked and is invalid, or on initial load.
            isKeyValid === false && (
                <div className="text-center p-8 bg-gray-800/50 rounded-lg border border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-200">Welcome to the Studio</h2>
                    <p className="mt-2 text-gray-400">Please enter a valid Google Gemini API Key above to get started.</p>
                </div>
            )
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
