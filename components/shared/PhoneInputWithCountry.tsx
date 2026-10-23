import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Search, ChevronDown, Check } from "lucide-react";
import { ScrollArea } from "@/components/shared/ScrollArea";

export interface CountryPhoneConfig {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  digits: number;
  pattern: RegExp;
  placeholder: string;
}

export const SUPPORTED_COUNTRIES: CountryPhoneConfig[] = [
  {
    code: "BD",
    name: "Bangladesh",
    dialCode: "+880",
    flag: "🇧🇩",
    digits: 11,
    pattern: /^01[3-9]\d{8}$/,
    placeholder: "017XXXXXXXX",
  },
  {
    code: "US",
    name: "United States",
    dialCode: "+1",
    flag: "🇺🇸",
    digits: 10,
    pattern: /^\d{10}$/,
    placeholder: "2025550123",
  },
  {
    code: "CA",
    name: "Canada",
    dialCode: "+1",
    flag: "🇨🇦",
    digits: 10,
    pattern: /^\d{10}$/,
    placeholder: "4165550123",
  },
  {
    code: "GB",
    name: "United Kingdom",
    dialCode: "+44",
    flag: "🇬🇧",
    digits: 10,
    pattern: /^\d{10,11}$/,
    placeholder: "7911123456",
  },
  {
    code: "IN",
    name: "India",
    dialCode: "+91",
    flag: "🇮🇳",
    digits: 10,
    pattern: /^[6-9]\d{9}$/,
    placeholder: "9876543210",
  },
  {
    code: "PK",
    name: "Pakistan",
    dialCode: "+92",
    flag: "🇵🇰",
    digits: 10,
    pattern: /^3\d{9}$/,
    placeholder: "3001234567",
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    dialCode: "+971",
    flag: "🇦🇪",
    digits: 9,
    pattern: /^5\d{8}$/,
    placeholder: "501234567",
  },
  {
    code: "SA",
    name: "Saudi Arabia",
    dialCode: "+966",
    flag: "🇸🇦",
    digits: 9,
    pattern: /^5\d{8}$/,
    placeholder: "512345678",
  },
  {
    code: "QA",
    name: "Qatar",
    dialCode: "+974",
    flag: "🇶🇦",
    digits: 8,
    pattern: /^[3567]\d{7}$/,
    placeholder: "33123456",
  },
  {
    code: "KW",
    name: "Kuwait",
    dialCode: "+965",
    flag: "🇰🇼",
    digits: 8,
    pattern: /^[569]\d{7}$/,
    placeholder: "51234567",
  },
  {
    code: "OM",
    name: "Oman",
    dialCode: "+968",
    flag: "🇴🇲",
    digits: 8,
    pattern: /^9\d{7}$/,
    placeholder: "91234567",
  },
  {
    code: "SG",
    name: "Singapore",
    dialCode: "+65",
    flag: "🇸🇬",
    digits: 8,
    pattern: /^[89]\d{7}$/,
    placeholder: "81234567",
  },
  {
    code: "MY",
    name: "Malaysia",
    dialCode: "+60",
    flag: "🇲🇾",
    digits: 10,
    pattern: /^1\d{8,9}$/,
    placeholder: "123456789",
  },
  {
    code: "AU",
    name: "Australia",
    dialCode: "+61",
    flag: "🇦🇺",
    digits: 9,
    pattern: /^4\d{8}$/,
    placeholder: "412345678",
  },
  {
    code: "DE",
    name: "Germany",
    dialCode: "+49",
    flag: "🇩🇪",
    digits: 11,
    pattern: /^1[567]\d{8,9}$/,
    placeholder: "15123456789",
  },
];

interface PhoneInputWithCountryProps {
  value: string;
  onChange: (fullNumber: string, isValid: boolean) => void;
  defaultCountryCode?: string;
  error?: string;
  className?: string;
  label?: string;
  required?: boolean;
}

export const PhoneInputWithCountry: React.FC<PhoneInputWithCountryProps> = ({
  value,
  onChange,
  defaultCountryCode = "BD",
  error,
  className,
  label = "Contact Phone",
  required = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [selectedCountry, setSelectedCountry] = useState<CountryPhoneConfig>(
    () => SUPPORTED_COUNTRIES.find((c) => c.code === defaultCountryCode) || SUPPORTED_COUNTRIES[0]
  );

  const [rawNumber, setRawNumber] = useState(() => {
    if (!value) return "";
    if (value.startsWith(selectedCountry.dialCode)) {
      return value.replace(selectedCountry.dialCode, "");
    }
    return value;
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch("");
    }
  }, [isOpen]);

  const handleCountrySelect = (country: CountryPhoneConfig) => {
    setSelectedCountry(country);
    setIsOpen(false);
    validateAndNotify(rawNumber, country);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, "");
    setRawNumber(cleaned);
    validateAndNotify(cleaned, selectedCountry);
  };

  const validateAndNotify = (num: string, country: CountryPhoneConfig) => {
    const isValid = country.pattern.test(num) && num.length === country.digits;
    let formatted = num;
    if (num) {
      if (country.code === "BD") {
        formatted = num.startsWith("0") ? num : `0${num}`;
      } else {
        formatted = `${country.dialCode}${num}`;
      }
    }
    onChange(formatted, isValid);
  };

  const filteredCountries = SUPPORTED_COUNTRIES.filter((c) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.dialCode.includes(q)
    );
  });

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label className="text-[11px] font-semibold text-slate-800 flex items-center justify-between">
          <span>{label} {required && "*"}</span>
          <span className="text-[10px] text-slate-400 font-normal">
            ({selectedCountry.name}: {selectedCountry.digits} digits)
          </span>
        </label>
      )}

      <div className={cn(
        "flex items-center h-10 w-full rounded-lg border bg-white relative transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10",
        error ? "border-rose-400" : "border-slate-200"
      )}>
        {/* Country Picker Trigger with Flag */}
        <div ref={dropdownRef} className="relative h-full">
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex items-center gap-1.5 h-full px-2.5 bg-slate-50/70 hover:bg-slate-100 border-r border-slate-100 transition rounded-l-lg select-none text-left"
          >
            <span className="text-base leading-none">{selectedCountry.flag}</span>
            <span className="text-xs font-semibold text-slate-700 font-mono">{selectedCountry.dialCode}</span>
            <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")} />
          </button>

          {/* Premium Searchable Dropdown Popup */}
          {isOpen && (
            <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-72 bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
              {/* Search Bar */}
              <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search country or code..."
                    className="w-full h-8 pl-8 pr-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Scrollable Countries List with Custom Scrollbar */}
              <ScrollArea maxHeight="220px" className="p-1">
                {filteredCountries.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No country found
                  </div>
                ) : (
                  filteredCountries.map((c) => {
                    const isSelected = c.code === selectedCountry.code;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => handleCountrySelect(c)}
                        className={cn(
                          "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left",
                          isSelected
                            ? "bg-emerald-50 text-emerald-900 font-semibold"
                            : "text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-base shrink-0">{c.flag}</span>
                          <span className="truncate">{c.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="text-[11px] font-mono text-slate-400 font-medium">{c.dialCode}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Local Number Input */}
        <input
          type="tel"
          value={rawNumber}
          onChange={handleNumberChange}
          placeholder={selectedCountry.placeholder}
          maxLength={selectedCountry.digits + 2}
          className="flex-1 h-full px-3 text-xs text-slate-900 bg-transparent placeholder-slate-400 focus:outline-none font-mono"
        />
      </div>

      {error ? (
        <p className="text-[10px] text-rose-700 font-medium">{error}</p>
      ) : (
        <p className="text-[10px] text-slate-400">
          Must be {selectedCountry.digits} digits (e.g. {selectedCountry.placeholder})
        </p>
      )}
    </div>
  );
};
