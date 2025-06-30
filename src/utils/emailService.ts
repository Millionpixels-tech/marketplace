import type { Order } from './orders';
import { PaymentMethod } from '../types/enums';
import { query, collection, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { 
    generateBuyerOrderConfirmationEmail,
    generateSellerOrderNotificationEmail,
    generatePaymentSlipNotificationEmail,
    generateCustomOrderAcceptanceBuyerEmail,
    generateCustomOrderAcceptanceSellerEmail,
    generateOrderStatusChangeEmail,
    FROM_NAME
} from './emailTemplates';

export interface BankAccount {
    id: string;
    accountNumber: string;
    branch: string;
    bankName: string;
    fullName: string;
    isDefault: boolean;
    createdAt: Date;
}

// Helper function to get seller bank account information
async function getSellerBankAccounts(sellerId: string): Promise<BankAccount[]> {
    try {
        const sellerQuery = query(
            collection(db, "users"), 
            where("uid", "==", sellerId)
        );
        const sellerSnap = await getDocs(sellerQuery);
        
        if (!sellerSnap.empty) {
            const sellerData = sellerSnap.docs[0].data();
            
            // Get all bank accounts from new format
            if (sellerData.bankAccounts && Array.isArray(sellerData.bankAccounts)) {
                return sellerData.bankAccounts;
            } 
            // Fallback to legacy single bank account format
            else if (sellerData.bankDetails) {
                const legacyAccount: BankAccount = {
                    id: 'legacy',
                    accountNumber: sellerData.bankDetails.accountNumber || '',
                    branch: sellerData.bankDetails.branch || '',
                    bankName: sellerData.bankDetails.bankName || '',
                    fullName: sellerData.bankDetails.fullName || '',
                    isDefault: true,
                    createdAt: new Date()
                };
                return [legacyAccount];
            }
        }
        return [];
    } catch (error) {
        console.error("Error fetching seller bank accounts:", error);
        return [];
    }
}

// Email service functions
export const sendOrderConfirmationEmails = async (order: Order & { id: string }, sellerEmail: string) => {
    try {
        // console.log("🔧 Email service called with:", {
        //     orderId: order.id,
        //     buyerEmail: order.buyerEmail,
        //     sellerEmail: sellerEmail,
        //     itemName: order.itemName,
        //     paymentMethod: order.paymentMethod
        // });

        // Get seller bank accounts if payment method is bank transfer
        let sellerBankAccounts: BankAccount[] = [];
        if (order.paymentMethod === PaymentMethod.BANK_TRANSFER) {
           // console.log("🏦 Fetching seller bank accounts for bank transfer order...");
            sellerBankAccounts = await getSellerBankAccounts(order.sellerId);
            // console.log("🏦 Retrieved bank accounts:", sellerBankAccounts.length);
        }

        // Get SMTP configuration from environment variables
        const smtpConfig = {
            host: import.meta.env.VITE_SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(import.meta.env.VITE_SMTP_PORT || '587'),
            secure: import.meta.env.VITE_SMTP_SECURE === 'true',
            user: import.meta.env.VITE_SMTP_USER || '',
            pass: import.meta.env.VITE_SMTP_PASS || '',
            fromEmail: import.meta.env.VITE_FROM_EMAIL || 'noreply@marketplace.com',
            fromName: import.meta.env.VITE_FROM_NAME || 'Sina.lk',
        };

        // console.log("🔧 SMTP Config:", {
        //     host: smtpConfig.host,
        //     port: smtpConfig.port,
        //     secure: smtpConfig.secure,
        //     user: smtpConfig.user ? `${smtpConfig.user.substring(0, 3)}***` : 'NOT SET',
        //     pass: smtpConfig.pass ? '***SET***' : 'NOT SET',
        //     fromEmail: smtpConfig.fromEmail,
        //     fromName: smtpConfig.fromName
        // });

        // Check if SMTP is configured
        if (!smtpConfig.user || !smtpConfig.pass) {
            const missingVars = [];
            if (!smtpConfig.user) missingVars.push('VITE_SMTP_USER');
            if (!smtpConfig.pass) missingVars.push('VITE_SMTP_PASS');
            
            console.warn('❌ SMTP not configured. Missing environment variables:', missingVars);
            console.warn('💡 To fix this:');
            console.warn('1. Set VITE_SMTP_USER to your email address');
            console.warn('2. Set VITE_SMTP_PASS to your email password or app password');
            console.warn('3. Restart your development server');
            
            return { 
                success: false, 
                error: `SMTP not configured. Missing: ${missingVars.join(', ')}`,
                missingVariables: missingVars
            };
        }

        // Generate email templates with bank account information
        const buyerEmailData = order.buyerEmail ? generateBuyerOrderConfirmationEmail(order, sellerBankAccounts) : null;
        const sellerEmailData = generateSellerOrderNotificationEmail(order, sellerBankAccounts);

        // console.log("📧 Email generation:", {
        //     buyerEmailGenerated: !!buyerEmailData,
        //     sellerEmailGenerated: !!sellerEmailData,
        //     buyerEmail: order.buyerEmail,
        //     sellerEmail: sellerEmail
        // });

        // Prepare emails array
        const emails = [];
        
        if (buyerEmailData && order.buyerEmail) {
            emails.push({
                to: order.buyerEmail,
                subject: buyerEmailData.subject,
                html: buyerEmailData.html,
            });
            //console.log("📧 Added buyer email to queue");
        }

        if (sellerEmail) {
            emails.push({
                to: sellerEmail,
                subject: sellerEmailData.subject,
                html: sellerEmailData.html,
            });
           // console.log("📧 Added seller email to queue");
        }

       // console.log("📧 Total emails to send:", emails.length);

        if (emails.length === 0) {
            console.warn('❌ No emails to send - missing recipient addresses');
            return { success: false, error: 'No valid email addresses provided' };
        }

        // Call Firebase Function with SMTP config and emails
        // Always use production URL since we deployed the function to Firebase
        const functionUrl = 'https://us-central1-marketplace-bd270.cloudfunctions.net/sendEmail';

        //console.log("🚀 Calling Firebase function:", functionUrl);
        // console.log("📤 Payload:", {
        //     emailCount: emails.length,
        //     recipients: emails.map(e => e.to),
        //     smtpConfigured: !!(smtpConfig.user && smtpConfig.pass)
        // });

        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                emails,
                smtpConfig 
            }),
        }).catch(error => {
            console.error("❌ Fetch error:", error);
            throw new Error(`Network error: ${error.message}`);
        });

       // console.log("📥 Response status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ HTTP error:", response.status, errorText);
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }

        const result = await response.json();
        // console.log("📥 Response data:", result);

        if (result.success) {
           // console.log('✅ Order confirmation emails sent successfully');
            return { success: true, results: result.results };
        } else {
           // console.error('❌ Failed to send emails:', result.error);
            return { success: false, error: result.error };
        }

    } catch (error) {
        //console.error('Error sending order confirmation emails:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
};

// Send payment slip notification to seller
export const sendPaymentSlipNotification = async (order: Order & { id: string }, sellerEmail: string) => {
    try {
       // console.log("📧 Sending payment slip notification to seller:", sellerEmail);
        
        const { subject, html, text } = generatePaymentSlipNotificationEmail(order);
        
        const emails = [
            {
                to: sellerEmail,
                subject,
                html,
                text,
                from: `"${FROM_NAME}" <noreply@sina.lk>`
            }
        ];

        // Get SMTP configuration from environment variables
        const smtpConfig = {
            host: import.meta.env.VITE_SMTP_HOST,
            port: parseInt(import.meta.env.VITE_SMTP_PORT || '587'),
            secure: import.meta.env.VITE_SMTP_SECURE === 'true',
            user: import.meta.env.VITE_SMTP_USER,
            pass: import.meta.env.VITE_SMTP_PASS
        };

        // console.log("📤 Email configuration:", {
        //     host: smtpConfig.host,
        //     port: smtpConfig.port,
        //     secure: smtpConfig.secure,
        //     user: smtpConfig.user ? '***' : 'NOT_SET',
        //     emailCount: emails.length
        // });

        // Call the Firebase function to send emails
        const functionUrl = 'https://us-central1-marketplace-bd270.cloudfunctions.net/sendEmail';

        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                emails,
                smtpConfig 
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
       // console.log("📧 Payment slip notification result:", result);
        return result;

    } catch (error) {
       // console.error('❌ Error sending payment slip notification:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
};

// Test email function for debugging
export const sendTestEmail = async (toEmail: string) => {
    try {
        // Get SMTP configuration from environment variables
        const smtpConfig = {
            host: import.meta.env.VITE_SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(import.meta.env.VITE_SMTP_PORT || '587'),
            secure: import.meta.env.VITE_SMTP_SECURE === 'true',
            user: import.meta.env.VITE_SMTP_USER || '',
            pass: import.meta.env.VITE_SMTP_PASS || '',
            fromEmail: import.meta.env.VITE_FROM_EMAIL || 'noreply@marketplace.com',
            fromName: import.meta.env.VITE_FROM_NAME || 'Sina.lk',
        };

        if (!smtpConfig.user || !smtpConfig.pass) {
            return { success: false, error: 'SMTP not configured' };
        }

        const emails = [{
            to: toEmail,
            subject: 'Test Email from Sina.lk',
            html: `
                <h1>Test Email</h1>
                <p>This is a test email to verify email sending functionality.</p>
                <p>If you received this, email sending is working correctly!</p>
            `,
        }];

        const functionUrl = 'https://us-central1-marketplace-bd270.cloudfunctions.net/sendEmail';

        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                emails,
                smtpConfig 
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;

    } catch (error) {
        console.error('Error sending test email:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
};

// Send custom order acceptance emails to both buyer and seller
export const sendCustomOrderAcceptanceEmails = async (
    customOrder: any, 
    orders: Array<{id: string, itemName: string, quantity: number, total: number}>,
    sellerEmail: string
) => {
    try {
        // console.log("🔧 Custom order email service called with:", {
        //     customOrderId: customOrder.id,
        //     buyerEmail: customOrder.buyerEmail,
        //     sellerEmail: sellerEmail,
        //     itemCount: customOrder.items.length,
        //     orderCount: orders.length
        // });

        // Get SMTP configuration from environment variables
        const smtpConfig = {
            host: import.meta.env.VITE_SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(import.meta.env.VITE_SMTP_PORT || '587'),
            secure: import.meta.env.VITE_SMTP_SECURE === 'true',
            user: import.meta.env.VITE_SMTP_USER || '',
            pass: import.meta.env.VITE_SMTP_PASS || '',
            fromEmail: import.meta.env.VITE_FROM_EMAIL || 'noreply@marketplace.com',
            fromName: import.meta.env.VITE_FROM_NAME || 'Sina.lk',
        };

        // Check if SMTP is configured
        if (!smtpConfig.user || !smtpConfig.pass) {
            const missingVars = [];
            if (!smtpConfig.user) missingVars.push('VITE_SMTP_USER');
            if (!smtpConfig.pass) missingVars.push('VITE_SMTP_PASS');
            
            console.warn('❌ SMTP not configured for custom order emails. Missing environment variables:', missingVars);
            return {
                success: false,
                error: `Missing SMTP configuration: ${missingVars.join(', ')}`
            };
        }

        // Generate buyer and seller emails
        const buyerEmail = generateCustomOrderAcceptanceBuyerEmail(customOrder, orders);
        const sellerEmail_ = generateCustomOrderAcceptanceSellerEmail(customOrder, orders);

        // console.log("📧 Generated email details:", {
        //     buyerSubject: buyerEmail.subject,
        //     sellerSubject: sellerEmail_.subject,
        //     buyerHtmlLength: buyerEmail.html?.length || 0,
        //     sellerHtmlLength: sellerEmail_.html?.length || 0,
        //     customOrderData: {
        //         id: customOrder.id,
        //         buyerEmail: customOrder.buyerEmail,
        //         itemCount: customOrder.items?.length || 0,
        //         orderCount: orders.length
        //     }
        // });

        // Validate email generation
        if (!buyerEmail.subject || !buyerEmail.html || !sellerEmail_.subject || !sellerEmail_.html) {
            console.error("❌ Email template generation failed:", {
                buyerSubject: !!buyerEmail.subject,
                buyerHtml: !!buyerEmail.html,
                sellerSubject: !!sellerEmail_.subject,
                sellerHtml: !!sellerEmail_.html
            });
            return {
                success: false,
                error: "Email template generation failed - missing subject or HTML content"
            };
        }

        const functionUrl = 'https://us-central1-marketplace-bd270.cloudfunctions.net/sendEmail';
        
      //  console.log("📧 Sending custom order acceptance emails...");

        // Prepare emails array for bulk sending
        const emails = [
            {
                to: customOrder.buyerEmail,
                subject: buyerEmail.subject,
                html: buyerEmail.html
            },
            {
                to: sellerEmail,
                subject: sellerEmail_.subject,
                html: sellerEmail_.html
            }
        ];

        const payload = {
            emails: emails,
            smtpConfig: {
                host: smtpConfig.host,
                port: smtpConfig.port,
                secure: smtpConfig.secure,
                user: smtpConfig.user,
                pass: smtpConfig.pass,
                fromEmail: smtpConfig.fromEmail,
                fromName: smtpConfig.fromName
            }
        };

        // console.log("📤 Email payload:", {
        //     emailCount: emails.length,
        //     emails: emails.map(e => ({
        //         to: e.to,
        //         subject: e.subject,
        //         htmlLength: e.html.length
        //     })),
        //     smtpConfig: {
        //         host: smtpConfig.host,
        //         port: smtpConfig.port,
        //         secure: smtpConfig.secure,
        //         user: smtpConfig.user ? `${smtpConfig.user.substring(0, 3)}***` : 'NOT SET',
        //         fromEmail: smtpConfig.fromEmail,
        //         fromName: smtpConfig.fromName
        //     }
        // });

        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

       // console.log("📧 Email sending result:", result);

        if (result.success) {
            // console.log("✅ Custom order acceptance emails sent successfully");
            return {
                success: true,
                result
            };
        } else {
            // console.error("❌ Failed to send custom order acceptance emails:", {
            //     error: result.error,
            //     results: result.results,
            //     httpStatus: response.status
            // });
            return {
                success: false,
                error: result.error || `HTTP ${response.status}`,
                result
            };
        }

    } catch (error) {
        console.error("❌ Error sending custom order acceptance emails:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
};

// Send order status change notification to buyer
export const sendOrderStatusChangeNotification = async (
    order: Order & { id: string }, 
    newStatus: string, 
    statusChangeMessage?: string
) => {
    try {
        // console.log("🔧 Order status change email service called with:", {
        //     orderId: order.id,
        //     buyerEmail: order.buyerEmail,
        //     newStatus: newStatus,
        //     itemName: order.itemName
        // });

        // Get SMTP configuration from environment variables
        const smtpConfig = {
            host: import.meta.env.VITE_SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(import.meta.env.VITE_SMTP_PORT || '587'),
            secure: import.meta.env.VITE_SMTP_SECURE === 'true',
            user: import.meta.env.VITE_SMTP_USER || '',
            pass: import.meta.env.VITE_SMTP_PASS || '',
            fromEmail: import.meta.env.VITE_FROM_EMAIL || 'noreply@marketplace.com',
            fromName: import.meta.env.VITE_FROM_NAME || 'Sina.lk',
        };

        // Check if SMTP is configured
        if (!smtpConfig.user || !smtpConfig.pass) {
            const missingVars = [];
            if (!smtpConfig.user) missingVars.push('VITE_SMTP_USER');
            if (!smtpConfig.pass) missingVars.push('VITE_SMTP_PASS');
            
            console.warn('❌ SMTP not configured for order status change email. Missing environment variables:', missingVars);
            return {
                success: false,
                error: `Missing SMTP configuration: ${missingVars.join(', ')}`
            };
        }

        // Generate status change email
        const emailData = generateOrderStatusChangeEmail(order, newStatus, statusChangeMessage || '');

        // console.log("📧 Email generation:", {
        //     emailGenerated: !!emailData,
        //     buyerEmail: order.buyerEmail,
        //     subject: emailData.subject
        // });

        // Prepare email
        if (!order.buyerEmail) {
            console.warn('❌ No buyer email found for order:', order.id);
            return { success: false, error: 'No buyer email address found' };
        }

        const emails = [{
            to: order.buyerEmail,
            subject: emailData.subject,
            html: emailData.html,
        }];

        // Call Firebase Function
        const functionUrl = 'https://us-central1-marketplace-bd270.cloudfunctions.net/sendEmail';

       // console.log("🚀 Calling Firebase function for status change email:", functionUrl);

        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                emails,
                smtpConfig 
            }),
        }).catch(error => {
            console.error("❌ Fetch error:", error);
            throw new Error(`Network error: ${error.message}`);
        });

       // console.log("📥 Response status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ HTTP error:", response.status, errorText);
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }

        const result = await response.json();
       // console.log("📥 Response data:", result);
        
        if (result.success) {
           // console.log('✅ Order status change email sent successfully');
            return { success: true, results: result.results };
        } else {
           // console.error('❌ Failed to send status change email:', result.error);
            return { success: false, error: result.error };
        }

    } catch (error) {
       // console.error('Error sending order status change email:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
};

// Debug function to check email configuration and test sending
export const debugEmailConfiguration = async () => {
   // console.log("🔍 Email Configuration Debug");
   // console.log("============================");
    
    // Check environment variables
    const envVars = {
        VITE_SMTP_HOST: import.meta.env.VITE_SMTP_HOST,
        VITE_SMTP_PORT: import.meta.env.VITE_SMTP_PORT,
        VITE_SMTP_SECURE: import.meta.env.VITE_SMTP_SECURE,
        VITE_SMTP_USER: import.meta.env.VITE_SMTP_USER,
        VITE_SMTP_PASS: import.meta.env.VITE_SMTP_PASS ? '***SET***' : 'NOT SET',
        VITE_FROM_EMAIL: import.meta.env.VITE_FROM_EMAIL,
        VITE_FROM_NAME: import.meta.env.VITE_FROM_NAME,
    };
    
   // console.log("📧 Environment Variables:", envVars);
    
    // Check if required variables are set
    const missingVars = [];
    if (!import.meta.env.VITE_SMTP_USER) missingVars.push('VITE_SMTP_USER');
    if (!import.meta.env.VITE_SMTP_PASS) missingVars.push('VITE_SMTP_PASS');
    
    if (missingVars.length > 0) {
        console.error("❌ Missing required environment variables:", missingVars);
        return {
            success: false,
            error: `Missing environment variables: ${missingVars.join(', ')}`,
            recommendations: [
                "Set VITE_SMTP_USER to your email address",
                "Set VITE_SMTP_PASS to your email password or app password",
                "Make sure environment variables are loaded in your .env file",
                "Restart your development server after adding environment variables"
            ]
        };
    }
    
    // Test Firebase function connectivity
    try {
        const functionUrl = 'https://us-central1-marketplace-bd270.cloudfunctions.net/sendEmail';
       // console.log("🚀 Testing Firebase function connectivity:", functionUrl);
        
        const testResponse = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                test: true,
                emails: [],
                smtpConfig: {
                    host: import.meta.env.VITE_SMTP_HOST || 'smtp.gmail.com',
                    port: parseInt(import.meta.env.VITE_SMTP_PORT || '587'),
                    secure: import.meta.env.VITE_SMTP_SECURE === 'true',
                    user: import.meta.env.VITE_SMTP_USER,
                    pass: import.meta.env.VITE_SMTP_PASS
                }
            }),
        });
        
        if (testResponse.ok) {
           // console.log("✅ Firebase function is reachable");
           // const result = await testResponse.json();
          //  console.log("📥 Test response:", result);
        } else {
            console.error("❌ Firebase function returned error:", testResponse.status);
            const errorText = await testResponse.text();
            console.error("Error details:", errorText);
        }
        
    } catch (error) {
       // console.error("❌ Failed to reach Firebase function:", error);
        return {
            success: false,
            error: `Firebase function connectivity issue: ${error instanceof Error ? error.message : 'Unknown error'}`,
            recommendations: [
                "Check internet connectivity",
                "Verify Firebase function is deployed",
                "Check Firebase project configuration"
            ]
        };
    }
    
    return {
        success: true,
        message: "Email configuration appears to be set up correctly",
        config: envVars
    };
};

// Re-export template functions for backwards compatibility
export { 
    generateBuyerOrderConfirmationEmail,
    generateSellerOrderNotificationEmail,
    generatePaymentSlipNotificationEmail,
    generateCustomOrderAcceptanceBuyerEmail,
    generateCustomOrderAcceptanceSellerEmail,
    generateOrderStatusChangeEmail
} from './emailTemplates';
