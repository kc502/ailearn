import React, { useState, useEffect, useCallback } from 'react';
import { Tool } from './types';
import ImageStudio from './components/ImageStudio';
import VideoGenerator from './components/VideoGenerator';
// FIX: ApiKeyInput is no longer used as the API key is handled on the server.
// import ApiKeyInput from './components/ApiKeyInput';
import { checkApiReadiness } from './geminiService';
import ApiKeyWarning from './components/ApiKeyWarning';

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<Tool>(Tool.IMAGE_STUDIO);
  // FIX: Removed client-side API key state management in favor of a server-side proxy.
  const [isApiReady, setIsApiReady] = useState<boolean | null>(null);

  // FIX: This function now checks if the server is ready to accept API calls.
  const checkServerReadiness = useCallback(async () => {
    setIsApiReady(null);
    const isReady = await checkApiReadiness();
    setIsApiReady(isReady);
  }, []);
  
  // FIX: Validate server readiness on initial load.
  useEffect(() => {
    checkServerReadiness();
  }, [checkServerReadiness]);

  const renderTool = () => {
    switch (activeTool) {
      // FIX: Pass `isApiReady` prop instead of API key details.
      case Tool.IMAGE_STUDIO:
        return <ImageStudio isApiReady={isApiReady === true} />;
      case Tool.VIDEO_GENERATOR:
        return <VideoGenerator isApiReady={isApiReady === true} />;
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
          {/* FIX: Removed ApiKeyInput component. The API key is managed on the server. */}
          
          {/* FIX: Show a loading state while checking server readiness. */}
          {isApiReady === null && (
            <div className="text-center text-gray-400 my-8">
              <p>Connecting to Gemini API...</p>
            </div>
          )}

          {/* FIX: Show a warning if the server-side API key is not configured correctly. */}
          {isApiReady === false && <ApiKeyWarning />}

          {/* FIX: Only show the main UI if the API is ready. */}
          {isApiReady === true && (
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
