// Test file to verify price formatting
import { formatPrice } from './src/utils/formatters.js';

// Test cases
console.log('Testing price formatting:');
console.log('1000 ->', formatPrice(1000)); // Should show: LKR 1,000
console.log('1000.50 ->', formatPrice(1000.50)); // Should show: LKR 1,000.50
console.log('25.99 ->', formatPrice(25.99)); // Should show: LKR 25.99
console.log('150000 ->', formatPrice(150000)); // Should show: LKR 150,000
console.log('0 ->', formatPrice(0)); // Should show: LKR 0
console.log('null ->', formatPrice(null)); // Should show: LKR 0
console.log('undefined ->', formatPrice(undefined)); // Should show: LKR 0
