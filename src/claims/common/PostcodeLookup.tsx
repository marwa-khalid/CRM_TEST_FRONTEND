import { useEffect, useRef, useState } from "react";

export type AddressResult = {
  line1: string;
  line2: string;
  line3: string;
  city: string;
  county: string;
  postcode: string;
};

type Props = {
  postcode: string;
  onChange: (postcode: string) => void;
  onAddressSelect: (address: AddressResult) => void;
  placeholder?: string;
  inputClassName?: string;
};

const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;

export const PostcodeLookup = ({
  postcode,
  onChange,
  onAddressSelect,
  placeholder = "Enter Post Code",
  inputClassName = "",
}: Props) => {
  const [addresses, setAddresses] = useState<AddressResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const userTyping = useRef(false);

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

    const pc = postcode.trim();
    if (!UK_POSTCODE.test(pc)) {
      setAddresses([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      userTyping.current = false;
      setLoading(true);
      setError("");
      setAddresses([]);

      try {
        const key = import.meta.env.VITE_IDEAL_POSTCODES_KEY;
        const res = await fetch(
          `https://api.ideal-postcodes.co.uk/v1/postcodes/${encodeURIComponent(pc)}?api_key=${key}`,
        );

        if (res.status === 404) {
          setError("No addresses found for this postcode");
          setShowDropdown(false);
          return;
        }
        if (res.status === 402) {
          setError("Postcode lookup limit reached — top up your Ideal Postcodes balance");
          setShowDropdown(false);
          return;
        }
        if (!res.ok) {
          setError("Address lookup failed");
          setShowDropdown(false);
          return;
        }

        const data = await res.json();
        const results: AddressResult[] = (data.result || []).map((a: any) => ({
          line1: a.line_1 || "",
          line2: a.line_2 || "",
          line3: a.line_3 || "",
          city: a.post_town || "",
          county: a.county || "",
          postcode: a.postcode || pc,
        }));

        setAddresses(results);
        setShowDropdown(results.length > 0);
        if (results.length === 0) setError("No addresses found for this postcode");
      } catch {
        setError("Address lookup failed");
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [postcode]);

  const isOpen = loading || (showDropdown && addresses.length > 0);

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        placeholder={placeholder}
        value={postcode}
        onChange={(e) => {
          userTyping.current = true;
          onChange(e.target.value);
          setError("");
          setShowDropdown(false);
        }}
        className={inputClassName}
      />

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      {isOpen && (
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
          {addresses.map((addr, i) => (
            <div
              key={i}
              onClick={() => {
                onAddressSelect(addr);
                setShowDropdown(false);
              }}
              className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-sm text-neutral-700 border-b border-gray-100 last:border-0"
            >
              {[addr.line1, addr.line2, addr.line3, addr.city, addr.postcode].filter(Boolean).join(", ")}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
