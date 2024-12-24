import { ReactNode, memo } from 'react';
import { useLoadScript } from '@react-google-maps/api';

interface GoogleMapsWrapperProps {
  children: ReactNode;
}

const libraries: ("places" | "marker")[] = ["places", "marker"];

const GoogleMapsWrapper = memo(({ children }: GoogleMapsWrapperProps) => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  if (!isLoaded) {
    return (
      <div className="w-full">
        <div className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
});

GoogleMapsWrapper.displayName = 'GoogleMapsWrapper';

export default GoogleMapsWrapper; 