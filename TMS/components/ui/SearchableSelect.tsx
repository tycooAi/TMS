'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from './Icons';

export interface SearchableOption {
  id: string;
  label: string;
  sublabel?: string;
  badge?: string;
  group?: string;
  disabled?: boolean;
}

interface SearchableSelectProps<T> {
  id?: string;
  name?: string;
  options: T[];
  value?: string;
  onChange: (value: string, item?: T) => void;
  getOptionValue: (item: T) => string;
  getOptionLabel: (item: T) => string;
  getOptionSublabel?: (item: T) => string;
  getOptionBadge?: (item: T) => string;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  emptyMessage?: string;
  allowClear?: boolean;
}

export function SearchableSelect<T>({
  id,
  name,
  options,
  value,
  onChange,
  getOptionValue,
  getOptionLabel,
  getOptionSublabel,
  getOptionBadge,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Type to search...',
  disabled = false,
  required = false,
  className = '',
  emptyMessage = 'No matching options found.',
  allowClear = false,
}: SearchableSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedItem = options.find((opt) => getOptionValue(opt) === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  const filteredOptions = options.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const label = getOptionLabel(item).toLowerCase();
    const sublabel = getOptionSublabel ? getOptionSublabel(item).toLowerCase() : '';
    const val = getOptionValue(item).toLowerCase();
    return label.includes(term) || sublabel.includes(term) || val.includes(term);
  });

  const handleSelect = (item: T) => {
    const val = getOptionValue(item);
    onChange(val, item);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Hidden input for form validation */}
      {required && (
        <input
          type="text"
          name={name}
          id={id ? `${id}-hidden` : undefined}
          value={value || ''}
          required={required}
          onChange={() => {}}
          className="sr-only"
          tabIndex={-1}
        />
      )}

      {/* Main trigger button */}
      <div
        id={id}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        className={`w-full min-h-[38px] px-3 py-2 text-xs rounded-lg border bg-white flex items-center justify-between cursor-pointer transition-colors ${
          disabled
            ? 'bg-[#f4f6f8] text-[#8898aa] cursor-not-allowed border-[#D9DBD6]'
            : isOpen
            ? 'border-[#2F668F] ring-1 ring-[#2F668F]'
            : 'border-[#D9DBD6] hover:border-[#3B7CA6]'
        }`}
      >
        <div className="flex items-center gap-2 truncate pr-2">
          {selectedItem ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-[#16425B] truncate">
                {getOptionLabel(selectedItem)}
              </span>
              {getOptionSublabel && (
                <span className="text-[11px] text-[#5A6E7F] truncate hidden sm:inline">
                  ({getOptionSublabel(selectedItem)})
                </span>
              )}
              {getOptionBadge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#e8f1f5] text-[#2F668F]">
                  {getOptionBadge(selectedItem)}
                </span>
              )}
            </div>
          ) : (
            <span className="text-[#8898aa]">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-[#5A6E7F]">
          {allowClear && selectedItem && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:text-red-500 rounded"
              title="Clear selection"
            >
              <X size={13} />
            </button>
          )}
          <ChevronDown
            size={14}
            className={`transition-transform duration-150 ${isOpen ? 'rotate-180 text-[#2F668F]' : ''}`}
          />
        </div>
      </div>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-[#D9DBD6] rounded-lg shadow-lg overflow-hidden animate-in fade-in-50 duration-100">
          {/* Search field */}
          <div className="p-2 border-b border-[#D9DBD6] bg-[#f8faf5]">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-[#5A6E7F]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded border border-[#D9DBD6] bg-white focus:outline-none focus:border-[#2F668F]"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsOpen(false);
                  }
                }}
              />
            </div>
          </div>

          {/* Options list */}
          <ul
            role="listbox"
            className="max-h-56 overflow-y-auto divide-y divide-[#f0f2ee] py-1 text-xs"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((item) => {
                const val = getOptionValue(item);
                const isSelected = val === value;
                return (
                  <li
                    key={val}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(item)}
                    className={`px-3 py-2 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#e8f1f5] text-[#16425B] font-semibold'
                        : 'hover:bg-[#f8faf5] text-[#16425B]'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{getOptionLabel(item)}</span>
                        {getOptionBadge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#f0f4f8] text-[#2F668F]">
                            {getOptionBadge(item)}
                          </span>
                        )}
                      </div>
                      {getOptionSublabel && (
                        <p className="text-[11px] text-[#5A6E7F] truncate">
                          {getOptionSublabel(item)}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <Check size={14} className="text-[#2F668F] shrink-0 ml-2" />
                    )}
                  </li>
                );
              })
            ) : (
              <li className="p-4 text-center text-[#5A6E7F] text-xs">
                {emptyMessage}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
