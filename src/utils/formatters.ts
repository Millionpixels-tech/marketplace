// src/utils/formatters.ts

/**
 * Format price to show two decimal places when there are decimals, otherwise show as integer
 * @param price - The price number to format
 * @returns Formatted price string with LKR prefix
 */
export function formatPrice(price: number | undefined | null): string {
  if (price === undefined || price === null || isNaN(price)) {
    return 'LKR 0';
  }

  // Check if the price has decimal places
  const hasDecimals = price % 1 !== 0;
  
  if (hasDecimals) {
    // Show 2 decimal places for prices with decimals
    return `LKR ${price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  } else {
    // Show as integer for whole numbers
    return `LKR ${price.toLocaleString()}`;
  }
}

/**
 * Format currency amount without LKR prefix
 * @param amount - The amount to format
 * @returns Formatted amount string
 */
export function formatAmount(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0';
  }

  const hasDecimals = amount % 1 !== 0;
  
  if (hasDecimals) {
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  } else {
    return amount.toLocaleString();
  }
}
