
import React from 'react';

const ApiKeyWarning: React.FC = () => {
  // FIX: This component runs on the client and cannot access server-side process.env.API_KEY.
  // The logic to check API readiness is now in App.tsx. This component just displays the warning.
  return (
    <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative my-4" role="alert">
      <strong className="font-bold">Connection Error: </strong>
      <span className="block sm:inline">Could not connect to the Gemini API. Please ensure the `API_KEY` environment variable is correctly set on the server.</span>
    </div>
  );
};

export default ApiKeyWarning;