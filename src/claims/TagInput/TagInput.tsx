import React, { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface Tag {
  id: string;
  label: string;
}

interface TagInputProps {
  tags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  placeholder?: string;
  className?: string;
}

export const TagInput: React.FC<TagInputProps> = ({ 
  tags, 
  onTagsChange, 
  placeholder = "Type here...",
  className = ""
}) => {
  const [inputValue, setInputValue] = useState('');

  const addTag = (label: string) => {
    if (label.trim() && !tags.some(tag => tag.label === label.trim())) {
      const newTag: Tag = {
        id: Date.now().toString(),
        label: label.trim()
      };
      onTagsChange([...tags, newTag]);
    }
    setInputValue('');
  };

  const removeTag = (tagId: string) => {
    onTagsChange(tags.filter(tag => tag.id !== tagId));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addTag(inputValue);
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 max-w-[500px] px-3 py-2 border border-gray-300 rounded-md bg-white min-h-[30px] font-medium  focus-within:ring-1 transition-colors ${className}`}>
      {tags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1 px-2 py-1 border border-gray-300 bg-gray-100 text-gray-700 rounded-md text-sm"
        >
          {tag.label}
          <button
            type="button"
            onClick={() => removeTag(tag.id)}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label={`Remove ${tag.label}`}
          >
            <X size={14} />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px]  outline-none bg-transparent text-gray-800 placeholder:text-gray-400 text-sm"
        aria-label="Add tags"
      />
    </div>
  );
}; 