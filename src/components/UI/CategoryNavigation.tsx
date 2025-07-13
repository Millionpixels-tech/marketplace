import React from 'react';

interface CategoryNavigationItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  isSelected?: boolean;
  onClick: () => void;
  hasSubcategories?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: (e: React.MouseEvent) => void;
}

interface SubcategoryNavigationItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  isSelected?: boolean;
  onClick: () => void;
}

interface CategoryNavigationProps {
  categories: CategoryNavigationItem[];
  subcategories?: SubcategoryNavigationItem[];
  isMobile?: boolean;
  className?: string;
}

export default function CategoryNavigation({ 
  categories, 
  subcategories, 
  isMobile = false, 
  className = "" 
}: CategoryNavigationProps) {
  return (
    <nav className={`p-2 ${className}`}>
      {categories.map((category) => (
        <div key={category.key} className="mb-1">
          <div className="flex items-center w-full">
            <button
              onClick={category.onClick}
              className={`w-full flex items-center gap-3 px-4 py-3 mx-2 my-1 rounded-lg font-medium transition-all duration-200 text-left group ${
                category.isSelected
                  ? 'bg-green-50 text-green-700 shadow-sm border border-green-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className={`transition-colors group-hover:scale-110 transform duration-200 ${
                category.isSelected ? 'text-green-600' : 'text-gray-400'
              }`}>
                {category.icon}
              </span>
              <span className="text-sm font-medium flex-1">{category.label}</span>
              {category.isSelected && (
                <div className="ml-auto w-2 h-2 bg-green-600 rounded-full"></div>
              )}
            </button>
            
            {/* Expand/Collapse button for categories with subcategories */}
            {category.hasSubcategories && category.onToggleExpand && (
              <button
                className="ml-1 p-1 rounded transition-all duration-300"
                style={{ color: '#72b01d' }}
                aria-label={category.isExpanded ? `Collapse ${category.label}` : `Expand ${category.label}`}
                onClick={category.onToggleExpand}
              >
                {category.isExpanded ? (
                  <svg width={isMobile ? "14" : "16"} height={isMobile ? "14" : "16"} fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" strokeWidth="2" d="M18 15l-6-6-6 6" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width={isMobile ? "14" : "16"} height={isMobile ? "14" : "16"} fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" strokeWidth="2" d="M9 18l6-6-6-6" strokeLinecap="round" />
                  </svg>
                )}
              </button>
            )}
          </div>
          
          {/* Subcategories */}
          {category.isExpanded && subcategories && subcategories.length > 0 && (
            <div className={`${isMobile ? 'pl-4 py-2' : 'pl-6 py-2'} flex flex-col gap-1`}>
              {subcategories.map(subcategory => (
                <button
                  key={subcategory.key}
                  onClick={subcategory.onClick}
                  className={`w-full flex items-center gap-3 px-4 py-2 mx-2 rounded-lg font-medium transition-all duration-200 text-left group ${
                    subcategory.isSelected
                      ? 'bg-green-100 text-green-800 shadow-sm border border-green-300'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  {subcategory.icon && (
                    <span className={`transition-colors group-hover:scale-110 transform duration-200 ${
                      subcategory.isSelected ? 'text-green-700' : 'text-gray-400'
                    }`}>
                      {subcategory.icon}
                    </span>
                  )}
                  <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium flex-1`}>
                    {subcategory.label}
                  </span>
                  {subcategory.isSelected && (
                    <div className="ml-auto w-2 h-2 bg-green-700 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}
