import React, { useState, useEffect, useRef } from 'react';

interface ApiKeyInputProps {
  apiKey: string;
  isKeyValid: boolean | null;
  isKeyChecking: boolean;
  onApiKeySubmit: (key: string, isInitialLoad?: boolean) => Promise<void>;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ apiKey, isKeyValid, isKeyChecking, onApiKeySubmit }) => {
  const [inputValue, setInputValue] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Do not run validation on the initial render, which might be from localStorage.
    // The parent component handles initial validation.
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const handler = setTimeout(() => {
      if (inputValue !== apiKey) {
        onApiKeySubmit(inputValue);
      }
    }, 750); // Debounce API calls by 750ms

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue, apiKey, onApiKeySubmit]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApiKeySubmit(inputValue);
  };
  
  const getStatusMessage = () => {
    if (isKeyChecking) {
      return <div className="text-yellow-400 flex items-center"><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Validating...</div>;
    }
    if (isKeyValid === true) {
      return <div className="text-green-400 flex items-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>API Key is valid.</div>;
    }
    // Show invalid message only if input is not empty
    if (isKeyValid === false && inputValue) {
      return <div className="text-red-400">Invalid or incorrect API Key.</div>;
    }
    return <div className="text-gray-400">Enter your Google Gemini API Key.</div>;
  };

  return (
    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 my-6">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <label htmlFor="api-key" className="sr-only">Gemini API Key</label>
            <div className="relative w-full">
                <input
                    id="api-key"
                    type={showKey ? 'text' : 'password'}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="block w-full bg-gray-900 border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-white placeholder-gray-400 p-2 pr-10"
                    placeholder="Enter your Gemini API Key"
                    aria-describedby="api-key-status"
                />
                <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                    aria-label={showKey ? "Hide key" : "Show key"}
                >
                    {showKey ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C3.732 4.943 7.523 3 10 3s6.268 1.943 9.542 7c-3.274 5.057-7.03 7-9.542 7S3.732 15.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 8.057 16.76 6.742 15.035 5.765L13.707 4.44A1 1 0 0013.707 2.293L3.707 2.293zM10 12a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /><path d="M2 4.293l1.293 1.293A10.01 10.01 0 00.458 10C3.732 15.057 7.523 17 10 17a9.97 9.97 0 005.035-.765L16.707 17.707a1 1 0 001.414-1.414L2 4.293z" /></svg>
                    )}
                </button>
            </div>
            <button
                type="submit"
                disabled={isKeyChecking || !inputValue}
                className="w-full sm:w-auto flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-200"
            >
                {isKeyChecking ? 'Validating...' : 'Save & Validate'}
            </button>
        </form>
        <p id="api-key-status" className="text-sm mt-2 h-5">{getStatusMessage()}</p>
    </div>
  );
};

export default ApiKeyInput;
