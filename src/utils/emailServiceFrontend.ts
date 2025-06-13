import type { Order } from './orders';
import { PaymentMethod } from '../types/enums';

// Email template generation functions (kept in frontend)
const FROM_NAME = 'Sina.lk';

// Generate buyer order confirmation email template
export const generateBuyerOrderConfirmationEmail = (order: Order & { id: string }) => {
    const subject = `Order Confirmation - ${order.itemName}`;
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Order Confirmation</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
                .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header { text-align: center; margin-bottom: 30px; }
                .logo { color: #72b01d; font-size: 24px; font-weight: bold; }
                .order-details { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .item-info { display: flex; align-items: center; margin-bottom: 20px; }
                .item-image { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin-right: 15px; }
                .price-breakdown { border-top: 2px solid #72b01d; padding-top: 15px; margin-top: 15px; }
                .total { font-size: 18px; font-weight: bold; color: #72b01d; }
                .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; }
                .button { background-color: #72b01d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 15px 0; }
                .info-box { background-color: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 15px; border-radius: 8px; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">🛒 ${FROM_NAME}</div>
                    <h1 style="color: #333; margin: 10px 0;">Thank you for your order! 🎉</h1>
                </div>

                <div class="order-details">
                    <h2 style="color: #333; margin-top: 0;">Order Information</h2>
                    <p><strong>Order ID:</strong> ${order.id}</p>
                    <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
                    <p><strong>Shop:</strong> ${order.sellerShopName}</p>
                    
                    <div class="item-info">
                        ${order.itemImage ? `<img src="${order.itemImage}" alt="${order.itemName}" class="item-image">` : ''}
                        <div>
                            <h3 style="margin: 0; color: #333;">${order.itemName}</h3>
                            <p style="margin: 5px 0; color: #666;">Quantity: ${order.quantity}</p>
                            <p style="margin: 5px 0; color: #666;">Price per item: LKR ${order.price.toLocaleString()}</p>
                        </div>
                    </div>

                    <div class="price-breakdown">
                        <p style="margin: 5px 0;"><strong>Subtotal:</strong> LKR ${(order.price * order.quantity).toLocaleString()}</p>
                        <p style="margin: 5px 0;"><strong>Shipping:</strong> LKR ${order.shipping.toLocaleString()}</p>
                        <p class="total"><strong>Total:</strong> LKR ${order.total.toLocaleString()}</p>
                    </div>

                    <p><strong>Payment Method:</strong> ${
                        order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY ? 'Cash on Delivery' : 
                        order.paymentMethod === PaymentMethod.BANK_TRANSFER ? 'Bank Transfer' : 
                        'Other'
                    }</p>
                    
                    ${order.buyerNotes ? `
                        <div class="info-box">
                            <strong>Your Notes:</strong> ${order.buyerNotes}
                        </div>
                    ` : ''}
                </div>

                <div class="info-box">
                    <strong>What happens next?</strong><br>
                    The seller will process your order and contact you with delivery details. You can track your order status in your account dashboard.
                </div>

                <div style="text-align: center;">
                    <a href="${window.location.origin}/order/${order.id}" class="button">View Order Details</a>
                </div>

                <div class="footer">
                    <p>Questions about your order? Contact us at support@marketplace.com</p>
                    <p>© 2025 ${FROM_NAME}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return { subject, html };
};

// Generate seller order notification email template
export const generateSellerOrderNotificationEmail = (order: Order & { id: string }) => {
    const subject = `New Order Received - ${order.itemName}`;
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>New Order Notification</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
                .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header { text-align: center; margin-bottom: 30px; }
                .logo { color: #72b01d; font-size: 24px; font-weight: bold; }
                .alert { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 8px; margin: 20px 0; }
                .order-details { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .item-info { display: flex; align-items: center; margin-bottom: 20px; }
                .item-image { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin-right: 15px; }
                .customer-info { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 15px 0; }
                .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; }
                .button { background-color: #72b01d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 15px 0; }
                .urgent { background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 8px; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">🛒 ${FROM_NAME}</div>
                    <h1 style="color: #333; margin: 10px 0;">New Order Received! 🎉</h1>
                </div>

                <div class="alert">
                    <strong>Action Required:</strong> You have received a new order. Please process it as soon as possible.
                </div>

                <div class="order-details">
                    <h2 style="color: #333; margin-top: 0;">Order Information</h2>
                    <p><strong>Order ID:</strong> ${order.id}</p>
                    <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
                    <p><strong>Shop:</strong> ${order.sellerShopName}</p>
                    
                    <div class="item-info">
                        ${order.itemImage ? `<img src="${order.itemImage}" alt="${order.itemName}" class="item-image">` : ''}
                        <div>
                            <h3 style="margin: 0; color: #333;">${order.itemName}</h3>
                            <p style="margin: 5px 0; color: #666;">Quantity: ${order.quantity}</p>
                            <p style="margin: 5px 0; color: #666;">Price per item: LKR ${order.price.toLocaleString()}</p>
                            <p style="margin: 5px 0; color: #72b01d; font-weight: bold;">Total: LKR ${order.total.toLocaleString()}</p>
                        </div>
                    </div>

                    <p><strong>Payment Method:</strong> ${
                        order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY ? 'Cash on Delivery' : 
                        order.paymentMethod === PaymentMethod.BANK_TRANSFER ? 'Bank Transfer' : 
                        'Other'
                    }</p>
                </div>

                <div class="customer-info">
                    <h3 style="margin-top: 0; color: #333;">Customer Information</h3>
                    ${order.buyerInfo ? `
                        <p><strong>Name:</strong> ${order.buyerInfo.firstName} ${order.buyerInfo.lastName}</p>
                        <p><strong>Email:</strong> ${order.buyerInfo.email}</p>
                        <p><strong>Phone:</strong> ${order.buyerInfo.phone}</p>
                        <p><strong>Address:</strong> ${order.buyerInfo.address}, ${order.buyerInfo.city} ${order.buyerInfo.postalCode}</p>
                    ` : `
                        <p><strong>Buyer Email:</strong> ${order.buyerEmail}</p>
                    `}
                    
                    ${order.buyerNotes ? `
                        <div class="urgent">
                            <strong>Special Instructions from Customer:</strong><br>
                            ${order.buyerNotes}
                        </div>
                    ` : ''}
                </div>

                <div style="text-align: center;">
                    <a href="${window.location.origin}/dashboard" class="button">Manage Order</a>
                </div>

                <div class="alert">
                    <strong>Next Steps:</strong>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>Confirm the order and prepare the item for dispatch</li>
                        <li>Contact the customer if you need clarification</li>
                        <li>Update the order status once shipped</li>
                        <li>Provide tracking information if available</li>
                    </ul>
                </div>

                <div class="footer">
                    <p>Manage your orders at ${window.location.origin}/dashboard</p>
                    <p>© 2025 ${FROM_NAME}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return { subject, html };
};

// Generate payment slip notification email for seller
export const generatePaymentSlipNotificationEmail = (order: Order & { id: string }) => {
    const subject = `Payment Slip Uploaded - Order ${order.id}`;
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Payment Slip Uploaded</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
                .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header { text-align: center; margin-bottom: 30px; }
                .logo { color: #72b01d; font-size: 24px; font-weight: bold; }
                .order-details { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .item-info { display: flex; align-items: center; margin-bottom: 20px; }
                .item-image { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin-right: 15px; }
                .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; }
                .button { background-color: #72b01d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 15px 0; }
                .alert-box { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 8px; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">💰 ${FROM_NAME}</div>
                    <h1 style="color: #333; margin: 10px 0;">Payment Slip Received! 📄</h1>
                </div>

                <div class="alert-box">
                    <strong>🎉 Great news!</strong> Your customer has uploaded their payment slip for bank transfer order <strong>${order.id}</strong>.
                </div>

                <div class="order-details">
                    <h2 style="color: #333; margin-top: 0;">Order Information</h2>
                    <p><strong>Order ID:</strong> ${order.id}</p>
                    <p><strong>Customer:</strong> ${order.buyerEmail || 'N/A'}</p>
                    <p><strong>Payment Method:</strong> Bank Transfer</p>
                    
                    <div class="item-info">
                        ${order.itemImage ? `<img src="${order.itemImage}" alt="${order.itemName}" class="item-image">` : ''}
                        <div>
                            <h3 style="margin: 0; color: #333;">${order.itemName}</h3>
                            <p style="margin: 5px 0; color: #666;">Quantity: ${order.quantity}</p>
                            <p style="margin: 5px 0; color: #666;">Total Amount: LKR ${order.total.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div style="text-align: center; margin: 20px 0;">
                    <h3 style="color: #333;">Next Steps:</h3>
                    <ol style="text-align: left; max-width: 400px; margin: 0 auto;">
                        <li>Log in to your dashboard to view the payment slip</li>
                        <li>Verify the bank transfer against your account</li>
                        <li>Once confirmed, update the order status to "Pending" or "Shipped"</li>
                        <li>Process the order for shipping or pickup</li>
                    </ol>
                </div>

                <div style="text-align: center;">
                    <a href="${process.env.REACT_APP_SITE_URL || 'https://sina.lk'}/dashboard" class="button">
                        View Order Dashboard →
                    </a>
                </div>

                <div class="footer">
                    <p>Thank you for selling on ${FROM_NAME}! 🛒</p>
                    <p>If you have any questions, please contact our support team.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    const text = `
        Payment Slip Uploaded - ${FROM_NAME}
        
        Great news! Your customer has uploaded their payment slip for order ${order.id}.
        
        Order Details:
        - Order ID: ${order.id}
        - Customer: ${order.buyerEmail || 'N/A'}
        - Item: ${order.itemName}
        - Quantity: ${order.quantity}
        - Total Amount: LKR ${order.total.toLocaleString()}
        - Payment Method: Bank Transfer
        
        Next Steps:
        1. Log in to your dashboard to view the payment slip
        2. Verify the bank transfer against your account
        3. Once confirmed, update the order status
        4. Process the order for shipping or pickup
        
        Thank you for selling on ${FROM_NAME}!
    `;

    return { subject, html, text };
};

// Send payment slip notification to seller
export const sendPaymentSlipNotification = async (order: Order & { id: string }, sellerEmail: string) => {
    try {
        console.log("📧 Sending payment slip notification to seller:", sellerEmail);
        
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
            host: process.env.REACT_APP_SMTP_HOST,
            port: parseInt(process.env.REACT_APP_SMTP_PORT || '587'),
            secure: process.env.REACT_APP_SMTP_SECURE === 'true',
            user: process.env.REACT_APP_SMTP_USER,
            pass: process.env.REACT_APP_SMTP_PASS
        };

        console.log("📤 Email configuration:", {
            host: smtpConfig.host,
            port: smtpConfig.port,
            secure: smtpConfig.secure,
            user: smtpConfig.user ? '***' : 'NOT_SET',
            emailCount: emails.length
        });

        // Call the Netlify function to send emails
        const functionUrl = process.env.NODE_ENV === 'production' 
            ? '/.netlify/functions/send-email'
            : 'http://localhost:8888/.netlify/functions/send-email';

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
        console.log("📧 Payment slip notification result:", result);
        return result;

    } catch (error) {
        console.error('❌ Error sending payment slip notification:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
};

// Function to send emails via Firebase Function
export const sendOrderConfirmationEmails = async (order: Order & { id: string }, sellerEmail: string) => {
    try {
        console.log("🔧 Email service called with:", {
            orderId: order.id,
            buyerEmail: order.buyerEmail,
            sellerEmail: sellerEmail,
            itemName: order.itemName
        });

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

        console.log("🔧 SMTP Config:", {
            host: smtpConfig.host,
            port: smtpConfig.port,
            secure: smtpConfig.secure,
            user: smtpConfig.user ? `${smtpConfig.user.substring(0, 3)}***` : 'NOT SET',
            pass: smtpConfig.pass ? '***SET***' : 'NOT SET',
            fromEmail: smtpConfig.fromEmail,
            fromName: smtpConfig.fromName
        });

        // Check if SMTP is configured
        if (!smtpConfig.user || !smtpConfig.pass) {
            console.warn('❌ SMTP not configured. Please set VITE_SMTP_USER and VITE_SMTP_PASS environment variables.');
            return { success: false, error: 'SMTP not configured' };
        }

        // Generate email templates
        const buyerEmailData = order.buyerEmail ? generateBuyerOrderConfirmationEmail(order) : null;
        const sellerEmailData = generateSellerOrderNotificationEmail(order);

        console.log("📧 Email generation:", {
            buyerEmailGenerated: !!buyerEmailData,
            sellerEmailGenerated: !!sellerEmailData,
            buyerEmail: order.buyerEmail,
            sellerEmail: sellerEmail
        });

        // Prepare emails array
        const emails = [];
        
        if (buyerEmailData && order.buyerEmail) {
            emails.push({
                to: order.buyerEmail,
                subject: buyerEmailData.subject,
                html: buyerEmailData.html,
            });
            console.log("📧 Added buyer email to queue");
        }

        if (sellerEmail) {
            emails.push({
                to: sellerEmail,
                subject: sellerEmailData.subject,
                html: sellerEmailData.html,
            });
            console.log("📧 Added seller email to queue");
        }

        console.log("📧 Total emails to send:", emails.length);

        if (emails.length === 0) {
            console.warn('❌ No emails to send - missing recipient addresses');
            return { success: false, error: 'No valid email addresses provided' };
        }

        // Call Firebase Function with SMTP config and emails
        // Always use production URL since we deployed the function to Firebase
        const functionUrl = 'https://us-central1-marketplace-bd270.cloudfunctions.net/sendEmail';

        console.log("🚀 Calling Firebase function:", functionUrl);
        console.log("📤 Payload:", {
            emailCount: emails.length,
            recipients: emails.map(e => e.to),
            smtpConfigured: !!(smtpConfig.user && smtpConfig.pass)
        });

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

        console.log("📥 Response status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ HTTP error:", response.status, errorText);
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }

        const result = await response.json();
        console.log("📥 Response data:", result);
        
        if (result.success) {
            console.log('✅ Order confirmation emails sent successfully');
            return { success: true, results: result.results };
        } else {
            console.error('❌ Failed to send emails:', result.error);
            return { success: false, error: result.error };
        }

    } catch (error) {
        console.error('Error sending order confirmation emails:', error);
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

        const functionUrl = import.meta.env.PROD 
            ? 'https://us-central1-marketplace-bd270.cloudfunctions.net/sendEmail'
            : 'http://localhost:5001/marketplace-bd270/us-central1/sendEmail';

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
