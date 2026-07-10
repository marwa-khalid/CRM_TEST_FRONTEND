import React, { useEffect, useRef, useState } from "react";
import {
  GoogleMap,
  Autocomplete,
  Marker,
  useJsApiLoader,
  TrafficLayer, // <--- Add this
} from "@react-google-maps/api";

interface GoogleMapAutocompleteProps {
  showMap?: boolean;
  apiKey: string;
  address: string;
  defaultCenter?: { lat: number; lng: number };
  onPlaceSelected?: (place: {
    name: string;
    lat: number;
    lng: number;
    address: string;
    postalCode?: string;
  }) => void;
  disabled: boolean;
}

const containerStyle = {
  width: "100%",
  height: "400px",
  border: '2px solid gray'
};

const libraries: ("places")[] = ["places"];

const GoogleMapAutocomplete: React.FC<GoogleMapAutocompleteProps> = ({
  showMap = true,
  apiKey,
  address,
  defaultCenter = { lat: 51.505, lng: -0.09 },
  onPlaceSelected,
  disabled,
}) => {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [inputValue, setInputValue] = useState(address || "");
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || import.meta.env.VITE_GOOGLE_MAP_KEY,
    libraries,
  });

  const handlePlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (!place.geometry) return;

      const lat = place.geometry.location?.lat();
      const lng = place.geometry.location?.lng();

      let postalCode = "";
      if (place.address_components) {
        const pc = place.address_components.find((c: any) =>
          c.types.includes("postal_code")
        );
        postalCode = pc ? pc.long_name : "";
      }

      setPosition({ lat, lng });
      setInputValue(place.formatted_address || place.name || "");

      onPlaceSelected?.({
        name: place.name || "",
        lat: lat || 0,
        lng: lng || 0,
        address: place.formatted_address || "",
        postalCode,
      });
    }
  };

  useEffect(() => {
    if (isLoaded && address) {
      setInputValue(address);
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();
          setPosition({ lat, lng });
        }
      });
    }
  }, [isLoaded, address]);

  if (loadError) return <div>❌ Google Maps failed to load</div>;
  if (!isLoaded) return <div>Loading map…</div>;
  const ukBounds = {
    north: 60.8566,
    south: 49.8566,
    west: -8.6493,
    east: 1.7578,
  };

console.log(showMap)
  return (
    <div>
      <Autocomplete
        onLoad={(ref) => (autocompleteRef.current = ref)}
        onPlaceChanged={handlePlaceChanged}
        options={{
          componentRestrictions: { country: "uk" },
          // types: ["address"],
        }}
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search location"
          disabled={disabled}
          // style={{
          //   width: "100%",
          //   padding: "10px",
          //   marginBottom: "10px",
          //   height: "44px",
          //   border: "1px solid #ccc",
          //   borderRadius: "6px",
          // }}
          className={`w-full h-[52px] ${showMap && "mb-5"} px-5 bg-white rounded border border-gray-200 text-neutral-700 hover:border-neutral-400 focus:border-blue-500 focus:outline-none font-light transition-colors`}
        />
      </Autocomplete>

      {showMap && inputValue !== "" && (
        <div className="rounded-lg overflow-hidden border border-gray-200">
          <GoogleMap
            mapContainerStyle={{
              width: "100%",
              height: "400px",
            }}
            center={position || defaultCenter}
            zoom={position ? 19 : 10}
            options={{
              restriction: {
                latLngBounds: ukBounds,
                strictBounds: true,
              },
            }}
          >
            <TrafficLayer />
            {position && <Marker position={position} />}
          </GoogleMap>
        </div>
      )}
    </div>
  );
};

export default GoogleMapAutocomplete;
