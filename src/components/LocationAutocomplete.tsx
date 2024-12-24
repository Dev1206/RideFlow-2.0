import { useEffect } from 'react';
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import { FiMapPin, FiLoader } from 'react-icons/fi';

interface LocationAutocompleteProps {
  label: string;
  value: string;
  onChange: (value: string, coordinates?: { lat: number; lng: number }) => void;
  required?: boolean;
  placeholder?: string;
}

export default function LocationAutocomplete({
  label,
  value,
  onChange,
  required = false,
  placeholder
}: LocationAutocompleteProps) {
  const {
    ready,
    value: inputValue,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: 'CA' },
    },
    debounce: 300,
    defaultValue: value,
    initOnMount: !!window.google,
  });

  useEffect(() => {
    setValue(value, false);
  }, [value, setValue]);

  const handleSelect = async (address: string) => {
    setValue(address, false);
    onChange(address);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      onChange(address, { lat, lng });
    } catch (error) {
      console.error('Error getting coordinates:', error);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
          {!ready ? (
            <FiLoader className="w-5 h-5 text-[#8B5CF6] animate-spin" />
          ) : (
            <FiMapPin className="w-5 h-5 text-[#8B5CF6]" />
          )}
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setValue(e.target.value);
            onChange(e.target.value);
          }}
          disabled={!ready}
          required={required}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl 
                   text-gray-900 placeholder-gray-500
                   focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6]
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-200"
        />
        {status === "OK" && (
          <ul className="absolute z-10 w-full bg-white mt-2 rounded-xl shadow-lg 
                       border border-gray-100 max-h-60 overflow-auto
                       scrollbar-thin scrollbar-thumb-[#8B5CF6]/20 scrollbar-track-transparent">
            {data.map(({ place_id, description }) => (
              <li
                key={place_id}
                onClick={() => handleSelect(description)}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm text-gray-900
                         border-b border-gray-100 last:border-b-0
                         transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <FiMapPin className="w-4 h-4 text-[#8B5CF6] flex-shrink-0" />
                  <span className="line-clamp-2">{description}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 