import type { Order } from '../orders';

const FROM_NAME = 'Sina.lk';

export const generateOrderStatusChangeEmail = (order: Order & { id: string }, newStatus: string, statusChangeMessage: string) => {
    const subject = `Order Update - ${order.itemName}`;
    
    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'SHIPPED':
                return {
                    title: 'Your Order Has Been Shipped',
                    message: 'Good news! Your order is on its way to you.',
                    color: '#72b01d',
                    icon: '📦'
                };
            case 'REFUNDED':
                return {
                    title: 'Your Order Has Been Refunded',
                    message: 'Your refund has been processed.',
                    color: '#72b01d',
                    icon: '💰'
                };
            case 'CONFIRMED':
                return {
                    title: 'Your Order Has Been Confirmed',
                    message: 'Your order has been confirmed and is being prepared.',
                    color: '#72b01d',
                    icon: '✅'
                };
            default:
                return {
                    title: 'Order Status Update',
                    message: 'Your order status has been updated.',
                    color: '#72b01d',
                    icon: '📋'
                };
        }
    };

    const statusInfo = getStatusInfo(newStatus);
    
    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <title>Order Status Update</title>
            <style type="text/css">
                /* Reset styles */
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
                table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
                img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
                
                /* Base styles */
                body { 
                    width: 100% !important; 
                    min-width: 100%; 
                    height: 100% !important; 
                    background-color: #f8faf8; 
                    margin: 0; 
                    padding: 0; 
                    font-family: Arial, Helvetica, sans-serif; 
                    font-size: 14px;
                    line-height: 1.6;
                }
                table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
                
                /* Responsive styles */
                @media only screen and (max-width: 600px) {
                    .container { width: 100% !important; }
                    .mobile-padding { padding: 0 20px !important; }
                    .mobile-button { width: 100% !important; }
                    .mobile-text { font-size: 16px !important; }
                }
            </style>
        </head>
        <body>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8faf8;">
                <tr>
                    <td>
                        <table class="container" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" align="center" style="margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                            
                            <!-- Header -->
                            <tr>
                                <td style="background: linear-gradient(135deg, #72b01d, #5a8c17); padding: 30px 40px; text-align: center;">
                                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                                        ${FROM_NAME}
                                    </h1>
                                    <p style="margin: 8px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">
                                        Your trusted marketplace
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Status Update -->
                            <tr>
                                <td class="mobile-padding" style="padding: 40px; text-align: center;">
                                    <div style="background-color: #e8f5e8; border: 2px solid #72b01d; border-radius: 12px; padding: 30px; margin-bottom: 30px;">
                                        <div style="font-size: 48px; margin-bottom: 15px;">${statusInfo.icon}</div>
                                        <h2 style="margin: 0 0 10px 0; color: #155724; font-size: 24px; font-weight: 700;">
                                            ${statusInfo.title}
                                        </h2>
                                        <p style="margin: 0; color: #155724; font-size: 16px; line-height: 1.5;">
                                            ${statusInfo.message}
                                        </p>
                                    </div>
                                    
                                    ${statusChangeMessage ? `
                                    <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: left;">
                                        <h4 style="margin: 0 0 10px 0; color: #495057; font-size: 14px; font-weight: 600;">Update Details:</h4>
                                        <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.4;">${statusChangeMessage}</p>
                                    </div>
                                    ` : ''}
                                </td>
                            </tr>
                            
                            <!-- Order Details -->
                            <tr>
                                <td class="mobile-padding" style="padding: 0 40px 30px 40px;">
                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8faf8; border-radius: 12px; overflow: hidden;">
                                        <tr>
                                            <td style="padding: 25px;">
                                                <h3 style="margin: 0 0 20px 0; color: #0d0a0b; font-size: 18px; font-weight: 600;">Order Details</h3>
                                                
                                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                                    <tr>
                                                        <td style="padding: 8px 0; color: #454955; font-size: 14px;">Order ID:</td>
                                                        <td style="padding: 8px 0; color: #0d0a0b; font-size: 14px; font-weight: 600; text-align: right;">#${order.id}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 8px 0; color: #454955; font-size: 14px;">Item:</td>
                                                        <td style="padding: 8px 0; color: #0d0a0b; font-size: 14px; font-weight: 600; text-align: right;">${order.itemName}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 8px 0; color: #454955; font-size: 14px;">Quantity:</td>
                                                        <td style="padding: 8px 0; color: #0d0a0b; font-size: 14px; text-align: right;">${order.quantity}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 8px 0; color: #454955; font-size: 14px;">Total:</td>
                                                        <td style="padding: 8px 0; color: #72b01d; font-size: 16px; font-weight: 700; text-align: right;">LKR ${order.total.toLocaleString()}</td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            
                            <!-- CTA Button -->
                            <tr>
                                <td class="mobile-padding" style="padding: 0 40px 40px 40px; text-align: center;">
                                    <table class="mobile-button" role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto;">
                                        <tr>
                                            <td style="background: linear-gradient(135deg, #72b01d, #5a8c17); border-radius: 6px; text-align: center;">
                                                <a href="${typeof window !== 'undefined' ? window.location.origin : 'https://sina.lk'}/order/${order.id}" style="display: inline-block; padding: 15px 30px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; line-height: 1;">
                                                    View Order Details
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td class="mobile-padding" style="padding: 30px 40px; text-align: center; border-top: 1px solid #eee;">
                                    <p style="margin: 0 0 10px 0; color: #999999; font-size: 12px; line-height: 1.4;">
                                        Questions about your order? Contact us at support@${FROM_NAME.toLowerCase()}.com
                                    </p>
                                    <p style="margin: 0; color: #999999; font-size: 12px;">
                                        © 2025 ${FROM_NAME}. All rights reserved.
                                    </p>
                                </td>
                            </tr>
                            
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;

    return { subject, html };
};
