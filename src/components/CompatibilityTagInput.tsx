import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface CompatibilityTagInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const CompatibilityTagInput: React.FC<CompatibilityTagInputProps> = ({ value, onChange }) => {
  const [inputValue, setInputValue] = useState('');

  // Convertimos el string de la BD (separado por comas) en un array limpio
  const tags = value ? (typeof value === 'string' ? value : '').split(',').map(t => t.trim()).filter(Boolean) : [];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      // Borrar la última etiqueta si el input está vacío
      removeTag(tags[tags.length - 1]);
    }
  };

  const addTag = () => {
    const newTag = inputValue.trim().toUpperCase();
    if (newTag && !tags.includes(newTag)) {
      const newTags = [...tags, newTag];
      onChange(newTags.join(', ')); // Guardamos en formato "TAG1, TAG2"
    }
    setInputValue('');
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(t => t !== tagToRemove);
    onChange(newTags.join(', '));
  };

  return (
    <div className="w-full min-h-[48px] px-3 py-2 bg-gray-50 rounded-xl border border-gray-100 focus-within:ring-2 ring-primary/20 transition-all flex flex-wrap gap-2 items-center">
      {tags.map((tag, i) => (
        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg shadow-sm">
          {tag}
          <button type="button" onClick={() => removeTag(tag)} className="text-gray-400 hover:text-red-500 transition-colors">
            <X size={12} />
          </button>
        </span>
      ))}
      
      <div className="flex-1 flex items-center gap-2 min-w-[120px]">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={tags.length === 0 ? "Ej. 4265, ACW2860960..." : "Agregar modelo..."}
          className="flex-1 bg-transparent border-none outline-none text-sm font-medium placeholder:text-gray-400"
        />
        {inputValue && (
          <button type="button" onClick={addTag} className="p-1 bg-primary text-white rounded-md hover:bg-primary/90">
            <Plus size={14} />
          </button>
        )}
      </div>
    </div>
  );
};