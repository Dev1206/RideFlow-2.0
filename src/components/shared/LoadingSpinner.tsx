import { FiLoader } from 'react-icons/fi';

export const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center p-8">
    <div className="relative">
      {/* Outer ring */}
      <div className="w-12 h-12 rounded-full border-2 border-indigo-400/20 animate-pulse" />
      {/* Inner spinner */}
      <FiLoader className="w-6 h-6 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
    </div>
    <p className="mt-4 text-sm text-gray-400">Loading...</p>
  </div>
);
