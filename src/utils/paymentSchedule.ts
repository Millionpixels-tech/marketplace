// Payment schedule utilities for seller payments
// Payments are made every 14 days, holding money for minimum 14 days

export interface PaymentPeriod {
  startDate: Date;
  endDate: Date;
  paymentDate: Date;
  isActive: boolean;
}

export interface PaymentSchedule {
  lastPaymentDate: Date;
  nextPaymentDate: Date;
  currentPeriod: PaymentPeriod;
  previousPeriod: PaymentPeriod | null;
}

// Set the initial last payment date as requested (we assume today 2025-06-07 is a payment day)
const INITIAL_LAST_PAYMENT_DATE = new Date('2025-06-07');

// Calculate payment schedule based on current date
export function calculatePaymentSchedule(currentDate: Date = new Date()): PaymentSchedule {
  // Get the last payment date from localStorage or use initial date
  const lastPaymentDateStr = localStorage.getItem('lastPaymentDate');
  const lastPaymentDate = lastPaymentDateStr 
    ? new Date(lastPaymentDateStr) 
    : INITIAL_LAST_PAYMENT_DATE;

  // Calculate next payment date (14 days after last payment)
  const nextPaymentDate = new Date(lastPaymentDate);
  nextPaymentDate.setDate(nextPaymentDate.getDate() + 14);

  // If current date has passed the next payment date, we need to update
  if (currentDate >= nextPaymentDate) {
    // Update to the most recent payment cycle
    const daysSinceLastPayment = Math.floor((currentDate.getTime() - lastPaymentDate.getTime()) / (1000 * 60 * 60 * 24));
    const completedCycles = Math.floor(daysSinceLastPayment / 14);
    
    const updatedLastPaymentDate = new Date(lastPaymentDate);
    updatedLastPaymentDate.setDate(updatedLastPaymentDate.getDate() + (completedCycles * 14));
    
    const updatedNextPaymentDate = new Date(updatedLastPaymentDate);
    updatedNextPaymentDate.setDate(updatedNextPaymentDate.getDate() + 14);
    
    // Update localStorage
    localStorage.setItem('lastPaymentDate', updatedLastPaymentDate.toISOString());
    
    return calculatePaymentSchedule(currentDate); // Recursive call with updated dates
  }

  // Calculate current period (orders that will be paid on next payment date)
  // These are orders created between (lastPaymentDate - 14 days) and lastPaymentDate
  // They will be paid on nextPaymentDate (14 days after lastPaymentDate)
  const currentPeriodStart = new Date(lastPaymentDate);
  currentPeriodStart.setDate(currentPeriodStart.getDate() - 14);
  
  const currentPeriod: PaymentPeriod = {
    startDate: currentPeriodStart,
    endDate: lastPaymentDate,
    paymentDate: nextPaymentDate,
    isActive: true
  };

  // Calculate previous period if exists (orders that were paid on last payment date)
  let previousPeriod: PaymentPeriod | null = null;
  if (lastPaymentDate > INITIAL_LAST_PAYMENT_DATE) {
    const prevPaymentDate = new Date(lastPaymentDate);
    prevPaymentDate.setDate(prevPaymentDate.getDate() - 14);
    
    const prevPeriodStart = new Date(prevPaymentDate);
    prevPeriodStart.setDate(prevPeriodStart.getDate() - 14);
    
    previousPeriod = {
      startDate: prevPeriodStart,
      endDate: prevPaymentDate,
      paymentDate: lastPaymentDate,
      isActive: false
    };
  }

  return {
    lastPaymentDate,
    nextPaymentDate,
    currentPeriod,
    previousPeriod
  };
}

// Get orders that are eligible for payment in the current period
export function getEligibleOrdersForPayment(
  orders: any[], 
  period: PaymentPeriod
): any[] {
  const validStatuses = ['received', 'shipped', 'pending'];
  
  return orders.filter(order => {
    // Check if order status is valid
    if (!validStatuses.includes(order.status?.toLowerCase())) {
      return false;
    }
    
    // Check if payment method is paynow (exclude COD orders)
    if (order.paymentMethod?.toLowerCase() !== 'paynow') {
      return false;
    }
    
    // Check if order was created within the period
    const orderDate = order.createdAt?.seconds 
      ? new Date(order.createdAt.seconds * 1000)
      : new Date(order.createdAt);
    
    // Make the date comparison more inclusive
    const periodStart = new Date(period.startDate);
    const periodEnd = new Date(period.endDate);
    
    // Set times to compare dates only (not times)
    periodStart.setHours(0, 0, 0, 0);
    periodEnd.setHours(23, 59, 59, 999);
    orderDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
    
    const isInRange = orderDate >= periodStart && orderDate <= periodEnd;
    
    console.log(`Order ${order.id}:`, {
      orderDate: orderDate.toISOString(),
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      status: order.status,
      paymentMethod: order.paymentMethod,
      isInRange,
      isValidStatus: validStatuses.includes(order.status?.toLowerCase()),
      isPayNow: order.paymentMethod?.toLowerCase() === 'paynow'
    });
    
    return isInRange;
  });
}

// Calculate total earnings for a period
export function calculatePeriodEarnings(orders: any[]): number {
  return orders.reduce((total, order) => {
    return total + (order.total || 0);
  }, 0);
}

// Format date for display
export function formatPaymentDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Get days until next payment
export function getDaysUntilNextPayment(nextPaymentDate: Date): number {
  const now = new Date();
  const diffTime = nextPaymentDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// Update last payment date (for admin use)
export function updateLastPaymentDate(date: Date): void {
  localStorage.setItem('lastPaymentDate', date.toISOString());
}

// Admin functions (for testing and management)
export function getStoredPaymentData(): { lastPaymentDate: Date | null } {
  const lastPaymentDateStr = localStorage.getItem('lastPaymentDate');
  return {
    lastPaymentDate: lastPaymentDateStr ? new Date(lastPaymentDateStr) : null
  };
}

// Initialize payment system (call this once to set up)
export function initializePaymentSystem(): void {
  const stored = getStoredPaymentData();
  if (!stored.lastPaymentDate) {
    localStorage.setItem('lastPaymentDate', INITIAL_LAST_PAYMENT_DATE.toISOString());
    console.log('Payment system initialized with date:', INITIAL_LAST_PAYMENT_DATE.toISOString());
  }
}

// For testing - simulate payment completion
export function simulatePaymentCompletion(date: Date = new Date()): void {
  localStorage.setItem('lastPaymentDate', date.toISOString());
  console.log('Payment completion simulated for date:', date.toISOString());
}

// Get payment history for display
export function getPaymentHistory(): PaymentPeriod[] {
  const schedule = calculatePaymentSchedule();
  const history: PaymentPeriod[] = [];
  
  if (schedule.previousPeriod) {
    history.push(schedule.previousPeriod);
  }
  history.push(schedule.currentPeriod);
  
  return history;
}

// Reset payment system to initial state (for testing)
export function resetPaymentSystem(): void {
  localStorage.removeItem('lastPaymentDate');
  console.log('Payment system reset to initial state');
}

// Debug function to check if an order should be eligible
export function debugOrderEligibility(order: any, period: PaymentPeriod): {
  isEligible: boolean;
  reason: string;
  orderDate: Date;
  periodStart: Date;
  periodEnd: Date;
} {
  const validStatuses = ['received', 'shipped', 'pending'];
  
  // Check status
  if (!validStatuses.includes(order.status?.toLowerCase())) {
    return {
      isEligible: false,
      reason: `Invalid status: ${order.status}`,
      orderDate: new Date(),
      periodStart: period.startDate,
      periodEnd: period.endDate
    };
  }
  
  // Check payment method
  if (order.paymentMethod?.toLowerCase() !== 'paynow') {
    return {
      isEligible: false,
      reason: `Invalid payment method: ${order.paymentMethod} (only 'paynow' orders are eligible)`,
      orderDate: new Date(),
      periodStart: period.startDate,
      periodEnd: period.endDate
    };
  }
  
  // Check date
  const orderDate = order.createdAt?.seconds 
    ? new Date(order.createdAt.seconds * 1000)
    : new Date(order.createdAt);
  
  const periodStart = new Date(period.startDate);
  const periodEnd = new Date(period.endDate);
  
  periodStart.setHours(0, 0, 0, 0);
  periodEnd.setHours(23, 59, 59, 999);
  orderDate.setHours(12, 0, 0, 0);
  
  const isInRange = orderDate >= periodStart && orderDate <= periodEnd;
  
  return {
    isEligible: isInRange,
    reason: isInRange ? 'Eligible' : `Order date ${orderDate.toDateString()} not in period ${periodStart.toDateString()} to ${periodEnd.toDateString()}`,
    orderDate,
    periodStart,
    periodEnd
  };
}
