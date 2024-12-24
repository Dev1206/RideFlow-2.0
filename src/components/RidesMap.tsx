import { useEffect, useRef, useMemo, useState } from 'react';
import { GoogleMap, useLoadScript } from '@react-google-maps/api';
import type { Ride } from '../types/ride';
import type { Libraries } from '@react-google-maps/api';
import { FiMapPin, FiLoader } from 'react-icons/fi';

interface RidesMapProps {
  rides: Ride[];
  selectedRide: Ride | null;
  onRideSelect: (ride: Ride) => void;
  setMapBounds: (bounds: google.maps.LatLngBounds | null) => void;
}

const libraries: Libraries = ['places', 'marker'];

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.75rem',
};

const defaultCenter = {
  lat: 42.3149,
  lng: -83.0364,
};

const PIN_COLORS = {
  pending: '#FF4444',
  confirmed: '#4CAF50'
};

declare global {
  namespace google.maps {
    class AdvancedMarkerElement extends google.maps.MVCObject {
      constructor(options?: google.maps.marker.AdvancedMarkerElementOptions);
      position: google.maps.LatLng | google.maps.LatLngLiteral;
      map: google.maps.Map | null;
      content: HTMLElement;
    }
  }
}

export default function RidesMap({ rides, onRideSelect, setMapBounds }: RidesMapProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

  const [markers, setMarkers] = useState<Array<{
    id: string;
    position: google.maps.LatLngLiteral;
    status: 'pending' | 'confirmed';
    details: {
      name: string;
      date: string;
      time: string;
      address: string;
    };
  }>>([]);

  const mapOptions = useMemo(() => ({
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    mapId: import.meta.env.VITE_GOOGLE_MAPS_ID || '',
  }), []);

  const createMarkerElement = (marker: typeof markers[0], isSelected: boolean) => {
    const markerElement = document.createElement('div');
    markerElement.className = 'marker-container';
    markerElement.innerHTML = `
      <div style="
        position: relative;
        cursor: pointer;
      ">
        <div style="
          background-color: ${PIN_COLORS[marker.status]};
          width: 40px;
          height: 40px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          border: 2px solid white;
          transition: all 0.3s ease;
          ${isSelected ? `transform: rotate(-45deg) scale(1.1); background-color: ${marker.status === 'pending' ? '#FF6B6B' : '#66BB6A'};` : ''}
        ">
          <div style="
            transform: rotate(45deg);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="10" r="3"/>
              <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z"/>
            </svg>
          </div>
        </div>
        ${isSelected ? `
          <div style="
            position: absolute;
            bottom: calc(100% + 10px);
            left: 50%;
            transform: translateX(-50%);
            background: white;
            padding: 16px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            width: max-content;
            min-width: 250px;
            z-index: 1000;
            border: 1px solid rgba(0,0,0,0.1);
            animation: fadeIn 0.3s ease;
          ">
            <div style="
              position: absolute;
              bottom: -8px;
              left: 50%;
              transform: translateX(-50%) rotate(45deg);
              width: 16px;
              height: 16px;
              background: white;
              border-right: 1px solid rgba(0,0,0,0.1);
              border-bottom: 1px solid rgba(0,0,0,0.1);
            "></div>
            
            <div style="
              font-weight: 600;
              color: #1F2937;
              margin-bottom: 12px;
              padding-bottom: 12px;
              border-bottom: 1px solid #E5E7EB;
              display: flex;
              align-items: center;
              gap: 8px;
            ">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              ${marker.details.name}
              <span style="
                margin-left: auto;
                font-size: 0.75rem;
                padding: 2px 8px;
                border-radius: 9999px;
                background-color: ${marker.status === 'pending' ? '#FEF3F2' : '#ECFDF5'};
                color: ${marker.status === 'pending' ? '#DC2626' : '#059669'};
              ">
                ${marker.status.charAt(0).toUpperCase() + marker.status.slice(1)}
              </span>
            </div>

            <div style="
              color: #4B5563;
              font-size: 0.875rem;
              margin-bottom: 8px;
              display: flex;
              align-items: center;
              gap: 8px;
              background: #F3F4F6;
              padding: 8px;
              border-radius: 6px;
            ">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <div>
                <div class="font-medium">${marker.details.date}</div>
                <div class="text-gray-500">${marker.details.time}</div>
              </div>
            </div>

            <div style="
              color: #4B5563;
              font-size: 0.875rem;
              display: flex;
              align-items: flex-start;
              gap: 8px;
              background: #F3F4F6;
              padding: 8px;
              border-radius: 6px;
              line-height: 1.4;
            ">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-top: 2px;">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              ${marker.details.address}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
    `;
    document.head.appendChild(style);

    return markerElement;
  };

  const addMarkers = () => {
    if (!mapRef.current) return;

    markersRef.current.forEach(marker => {
      marker.map = null;
    });
    markersRef.current = [];

    markers.forEach(marker => {
      const advancedMarker = new google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current,
        position: marker.position,
        content: createMarkerElement(marker, selectedMarker === marker.id),
      });

      advancedMarker.addListener('click', () => {
        setSelectedMarker(selectedMarker === marker.id ? null : marker.id);
        const ride = rides.find(r => r._id === marker.id);
        if (ride) onRideSelect(ride);
      });

      markersRef.current.push(advancedMarker);
    });
  };

  useEffect(() => {
    if (rides.length > 0) {
      const filteredRides = rides.filter(ride => {
        const hasCoordinates = ride.pickupCoordinates?.lat && ride.pickupCoordinates?.lng;
        const validStatus = ride.status === 'pending' || ride.status === 'confirmed';
        return hasCoordinates && validStatus;
      });

      const newMarkers = filteredRides.map(ride => ({
        id: ride._id,
        position: {
          lat: ride.pickupCoordinates!.lat,
          lng: ride.pickupCoordinates!.lng,
        },
        status: ride.status as 'pending' | 'confirmed',
        details: {
          name: ride.name,
          date: formatDate(ride.date),
          time: ride.time,
          address: ride.pickupLocation,
        }
      }));

      setMarkers(newMarkers);
    }
  }, [rides]);

  useEffect(() => {
    if (isLoaded && mapRef.current) {
      addMarkers();
    }
  }, [isLoaded, markers, selectedMarker]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleBoundsChanged = () => {
    if (mapRef.current) {
      const bounds = mapRef.current.getBounds();
      setMapBounds(bounds || null);
    }
  };

  if (loadError) {
    return (
      <div className="w-full h-[400px] bg-red-50 rounded-xl flex items-center justify-center text-red-600">
        Error loading map: {loadError.message}
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-[400px] bg-gray-50 rounded-xl flex items-center justify-center">
        <FiLoader className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="shadow-md rounded-xl overflow-hidden relative">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={12}
        center={defaultCenter}
        options={mapOptions}
        onLoad={map => {
          console.log('Map loaded successfully');
          mapRef.current = map;
          addMarkers();
          handleBoundsChanged();
        }}
        onBoundsChanged={handleBoundsChanged}
        onClick={() => setSelectedMarker(null)}
      />
      {markers.length === 0 && (
        <div className="absolute top-4 left-4 bg-white px-4 py-2 rounded-lg shadow-md text-sm text-gray-600 flex items-center gap-2">
          <FiMapPin className="text-indigo-500" />
          No ride locations to display
        </div>
      )}
    </div>
  );
} 