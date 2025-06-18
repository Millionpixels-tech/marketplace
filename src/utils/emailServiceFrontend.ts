/**
 * @deprecated This file has been refactored into modular email templates.
 * Please use the new email service structure instead:
 * - Import from './emailService' for email sending functions
 * - Import from './emailTemplates' for individual email template functions
 */

// Re-export all functions from the new modular email service for backwards compatibility
export {
    sendOrderConfirmationEmails,
    sendPaymentSlipNotification,
    sendTestEmail,
    generateBuyerOrderConfirmationEmail,
    generateSellerOrderNotificationEmail,
    generatePaymentSlipNotificationEmail
} from './emailService';

// Re-export debugging function
export { debugEmailConfiguration } from './emailService';
