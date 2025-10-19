'use client';

import { useState, useEffect } from 'react';

interface Category {
  id: number;
  category: string;
}

interface CategorySelectorProps {
  selectedCategoryIds: number[];
  onSelectionChange: (categoryIds: number[]) => void;
  disabled?: boolean;
}

const CategorySelector = ({ 
  selectedCategoryIds, 
  onSelectionChange, 
  disabled = false 
}: CategorySelectorProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Handle category selection
  const toggleCategory = (categoryId: number, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    if (disabled) return;

    const newSelection = selectedCategoryIds.includes(categoryId)
      ? selectedCategoryIds.filter(id => id !== categoryId)
      : [...selectedCategoryIds, categoryId];

    onSelectionChange(newSelection);
  };

  if (loading) {
    return (
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse bg-gray-200 rounded-full px-4 py-2 h-8 w-20"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        Categories (optional)
      </label>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const isSelected = selectedCategoryIds.includes(category.id);
          return (
            <button
              key={category.id}
              type="button"
              onClick={(e) => toggleCategory(category.id, e)}
              disabled={disabled}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${isSelected
                  ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                }
                ${disabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'cursor-pointer hover:shadow-sm'
                }
              `}
            >
              {category.category}
            </button>
          );
        })}
      </div>
      {selectedCategoryIds.length > 0 && (
        <p className="text-xs text-gray-500">
          Selected: {selectedCategoryIds.length} categor{selectedCategoryIds.length === 1 ? 'y' : 'ies'}
        </p>
      )}
    </div>
  );
};

export default CategorySelector;
