
import React from 'react';

const ApiKeyWarning: React.FC = () => {
  if (process.env.API_KEY) {
    return null;
  }

  return (
    <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-300 px-4 py-3 rounded-lg relative my-4" role="alert">
      <strong className="font-bold">Warning: </strong>
      <span className="block sm:inline">The `API_KEY` environment variable is not set. The application will not be able to connect to the Gemini API.</span>
    </div>
  );
};

export default ApiKeyWarning;