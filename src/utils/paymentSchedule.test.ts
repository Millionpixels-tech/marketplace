// Test file to verify payment schedule logic
// Run this in browser console to test the payment system

import { 
    calculatePaymentSchedule, 
    getEligibleOrdersForPayment, 
    calculatePeriodEarnings, 
    formatPaymentDate, 
    getDaysUntilNextPayment,
    initializePaymentSystem,
    simulatePaymentCompletion
} from './paymentSchedule';

// Test data - mock orders
const mockOrders = [
    {
        id: 'order1',
        status: 'received',
        total: 1500,
        createdAt: { seconds: Math.floor(new Date('2025-05-25').getTime() / 1000) }, // Within first period
        itemName: 'Test Item 1'
    },
    {
        id: 'order2',
        status: 'shipped',
        total: 2000,
        createdAt: { seconds: Math.floor(new Date('2025-05-30').getTime() / 1000) }, // Within first period
        itemName: 'Test Item 2'
    },
    {
        id: 'order3',
        status: 'pending',
        total: 3000,
        createdAt: { seconds: Math.floor(new Date('2025-06-05').getTime() / 1000) }, // Within current period
        itemName: 'Test Item 3'
    },
    {
        id: 'order4',
        status: 'cancelled',
        total: 1000,
        createdAt: { seconds: Math.floor(new Date('2025-06-01').getTime() / 1000) }, // Should be excluded
        itemName: 'Test Item 4'
    }
];

export function testPaymentSchedule() {
    console.log('=== Testing Payment Schedule System ===');
    
    // Initialize the system
    initializePaymentSystem();
    
    // Get current schedule
    const schedule = calculatePaymentSchedule();
    console.log('Current Payment Schedule:');
    console.log('- Last Payment Date:', formatPaymentDate(schedule.lastPaymentDate));
    console.log('- Next Payment Date:', formatPaymentDate(schedule.nextPaymentDate));
    console.log('- Days until next payment:', getDaysUntilNextPayment(schedule.nextPaymentDate));
    
    console.log('\nCurrent Period:');
    console.log('- Start:', formatPaymentDate(schedule.currentPeriod.startDate));
    console.log('- End:', formatPaymentDate(schedule.currentPeriod.endDate));
    console.log('- Payment Date:', formatPaymentDate(schedule.currentPeriod.paymentDate));
    
    if (schedule.previousPeriod) {
        console.log('\nPrevious Period:');
        console.log('- Start:', formatPaymentDate(schedule.previousPeriod.startDate));
        console.log('- End:', formatPaymentDate(schedule.previousPeriod.endDate));
        console.log('- Payment Date:', formatPaymentDate(schedule.previousPeriod.paymentDate));
    }
    
    // Test order filtering
    const eligibleOrders = getEligibleOrdersForPayment(mockOrders, schedule.currentPeriod);
    console.log('\nEligible Orders for Current Period:', eligibleOrders.length);
    eligibleOrders.forEach(order => {
        console.log(`- ${order.id}: ${order.status}, LKR ${order.total}, ${new Date(order.createdAt.seconds * 1000).toLocaleDateString()}`);
    });
    
    const totalEarnings = calculatePeriodEarnings(eligibleOrders);
    console.log(`\nTotal Earnings for Current Period: LKR ${totalEarnings.toLocaleString()}`);
    
    return {
        schedule,
        eligibleOrders,
        totalEarnings
    };
}

// Test simulating payment completion
export function testPaymentCompletion() {
    console.log('\n=== Testing Payment Completion ===');
    
    const beforeSchedule = calculatePaymentSchedule();
    console.log('Before payment completion:');
    console.log('- Next Payment Date:', formatPaymentDate(beforeSchedule.nextPaymentDate));
    
    // Simulate completing a payment today
    const today = new Date();
    simulatePaymentCompletion(today);
    
    const afterSchedule = calculatePaymentSchedule();
    console.log('\nAfter payment completion:');
    console.log('- Last Payment Date:', formatPaymentDate(afterSchedule.lastPaymentDate));
    console.log('- Next Payment Date:', formatPaymentDate(afterSchedule.nextPaymentDate));
    
    return { beforeSchedule, afterSchedule };
}

// Reset to initial state for testing
export function resetPaymentSystemForTesting() {
    localStorage.removeItem('lastPaymentDate');
    initializePaymentSystem();
    console.log('Payment system reset to initial state');
}

// Export for browser console testing
(window as any).testPaymentSchedule = testPaymentSchedule;
(window as any).testPaymentCompletion = testPaymentCompletion;
(window as any).resetPaymentSystemForTesting = resetPaymentSystemForTesting;
