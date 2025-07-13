import React from 'react';
import { FiUser, FiShoppingBag } from 'react-icons/fi';
import CategoryNavigation from '../src/components/UI/CategoryNavigation';

// Test component to validate CategoryNavigation
function TestCategoryNavigation() {
  const [selected, setSelected] = React.useState('');
  const [expanded, setExpanded] = React.useState<string | null>(null);

  const testCategories = [
    {
      key: 'electronics',
      label: 'Electronics',
      icon: <FiUser className="w-4 h-4" />,
      isSelected: selected === 'electronics',
      onClick: () => setSelected('electronics'),
      hasSubcategories: true,
      isExpanded: expanded === 'electronics',
      onToggleExpand: (e: React.MouseEvent) => {
        e.stopPropagation();
        setExpanded(expanded === 'electronics' ? null : 'electronics');
      }
    },
    {
      key: 'fashion',
      label: 'Fashion',
      icon: <FiShoppingBag className="w-4 h-4" />,
      isSelected: selected === 'fashion',
      onClick: () => setSelected('fashion')
    }
  ];

  const testSubcategories = expanded === 'electronics' ? [
    {
      key: 'phones',
      label: 'Phones',
      isSelected: selected === 'phones',
      onClick: () => setSelected('phones')
    },
    {
      key: 'laptops',
      label: 'Laptops',
      isSelected: selected === 'laptops',
      onClick: () => setSelected('laptops')
    }
  ] : undefined;

  return (
    <div className="p-4">
      <h1>Category Navigation Test</h1>
      <CategoryNavigation
        categories={testCategories}
        subcategories={testSubcategories}
        isMobile={false}
      />
    </div>
  );
}

export default TestCategoryNavigation;
