import { useEffect, useRef, useState } from "react";
import { useJsApiLoader } from "@react-google-maps/api";

type Props = {
  address: string;
  onChange: (address: string) => void;
  onPlaceSelected: (place: { address: string; postcode: string }) => void;
  placeholder?: string;
  inputClassName?: string;
  disabled?: boolean;
};

type Suggestion =
  | { type: "postcode"; description: string; address: string; postcode: string }
  | { type: "google"; description: string; place_id: string };

const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;
const libraries: "places"[] = ["places"];

export const AddressAutocomplete = ({
  address,
  onChange,
  onPlaceSelected,
  placeholder = "Enter Address",
  inputClassName = "",
  disabled = false,
}: Props) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const userTyping = useRef(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAP_KEY,
    libraries,
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!userTyping.current) return;

    const input = address.trim();
    if (input.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setSuggestions([]);
      setShowDropdown(true);

      if (UK_POSTCODE.test(input)) {
        // Postcode entered — use ideal-postcodes for full address list
        try {
          const key = import.meta.env.VITE_IDEAL_POSTCODES_KEY;
          const res = await fetch(
            `https://api.ideal-postcodes.co.uk/v1/postcodes/${encodeURIComponent(input)}?api_key=${key}`,
          );
          if (res.ok) {
            const data = await res.json();
            const results: Suggestion[] = (data.result || []).map((a: any) => ({
              type: "postcode" as const,
              description: [a.line_1, a.line_2, a.line_3, a.post_town, a.postcode]
                .filter(Boolean)
                .join(", "),
              address: [a.line_1, a.line_2, a.line_3].filter(Boolean).join(", "),
              postcode: a.postcode || input,
            }));
            setSuggestions(results);
            if (results.length === 0) setShowDropdown(false);
          } else {
            setShowDropdown(false);
          }
        } catch {
          setShowDropdown(false);
        }
        setLoading(false);
      } else if (isLoaded) {
        // Free-text address — use Google Maps Places
        const g = (window as any).google;
        if (!g?.maps?.places?.AutocompleteService) {
          setLoading(false);
          return;
        }
        const service = new g.maps.places.AutocompleteService();
        service.getPlacePredictions(
          { input, componentRestrictions: { country: "gb" } },
          (
            results: google.maps.places.AutocompletePrediction[],
            status: google.maps.places.PlacesServiceStatus,
          ) => {
            if (status === "OK" && results?.length > 0) {
              setSuggestions(
                results.map((r) => ({
                  type: "google" as const,
                  description: r.description.replace(/, UK$/, ""),
                  place_id: r.place_id,
                })),
              );
            } else {
              setShowDropdown(false);
            }
            setLoading(false);
          },
        );
        return; // loading cleared inside callback
      } else {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [address, isLoaded]);

  const selectSuggestion = (s: Suggestion) => {
    userTyping.current = false;
    setSuggestions([]);
    setShowDropdown(false);

    if (s.type === "postcode") {
      onChange(s.description);
      onPlaceSelected({ address: s.description, postcode: s.postcode });
      return;
    }

    // Google Maps — fetch full details for postcode extraction
    const g = (window as any).google;
    const service = new g.maps.places.PlacesService(document.createElement("div"));
    service.getDetails(
      { placeId: s.place_id, fields: ["address_components", "formatted_address"] },
      (place: google.maps.places.PlaceResult, status: google.maps.places.PlacesServiceStatus) => {
        if (status !== "OK" || !place?.address_components) {
          onChange(s.description);
          onPlaceSelected({ address: s.description, postcode: "" });
          return;
        }
        let postcode = "";
        for (const comp of place.address_components) {
          if (comp.types.includes("postal_code")) { postcode = comp.long_name; break; }
        }
        const addressStr = place.formatted_address?.replace(/, UK$/, "") ?? s.description;
        onChange(addressStr);
        onPlaceSelected({ address: addressStr, postcode });
      },
    );
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        placeholder={placeholder}
        value={address}
        disabled={disabled}
        onChange={(e) => {
          userTyping.current = true;
          onChange(e.target.value);
          setSuggestions([]);
          setShowDropdown(false);
        }}
        className={inputClassName}
      />

      {showDropdown && (loading || suggestions.length > 0) && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 shadow-lg z-[200] max-h-52 overflow-y-auto rounded-b">
          {loading && (
            <div className="px-4 py-3 flex items-center gap-2 text-sm text-gray-400">
              <svg className="animate-spin h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Finding addresses…
            </div>
          )}
          {suggestions.map((s, i) => (
            <div
              key={i}
              onClick={() => selectSuggestion(s)}
              className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-sm text-neutral-700 border-b border-gray-100 last:border-0"
            >
              {s.description}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
