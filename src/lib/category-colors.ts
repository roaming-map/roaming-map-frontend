// Shared category color mapping for consistency across the app
export const getCategoryColors = (categoryName: string) => {
  const colorMap: Record<string, { bgColor: string; textColor: string; borderColor: string }> = {
    'Transport': { 
      bgColor: 'bg-purple-100', 
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200'
    },
    'Food': { 
      bgColor: 'bg-orange-100', 
      textColor: 'text-orange-700',
      borderColor: 'border-orange-200'
    },
    'Accommodation': { 
      bgColor: 'bg-blue-100', 
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200'
    },
    'Attraction': { 
      bgColor: 'bg-green-100', 
      textColor: 'text-green-700',
      borderColor: 'border-green-200'
    },
    'Culture/Other': { 
      bgColor: 'bg-pink-100', 
      textColor: 'text-pink-700',
      borderColor: 'border-pink-200'
    },
  };
  return colorMap[categoryName] || { 
    bgColor: 'bg-gray-100', 
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200'
  };
};
