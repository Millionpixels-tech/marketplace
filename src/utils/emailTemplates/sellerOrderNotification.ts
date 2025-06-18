import type { Order } from '../orders';
import { PaymentMethod } from '../../types/enums';

const FROM_NAME = 'Sina.lk';

export const generateSellerOrderNotificationEmail = (order: Order & { id: string }) => {
    const subject = `New Order Received - ${order.itemName}`;
    
    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <title>New Order Notification</title>
            <!--[if mso]>
            <noscript>
                <xml>
                    <o:OfficeDocumentSettings>
                        <o:PixelsPerInch>96</o:PixelsPerInch>
                    </o:OfficeDocumentSettings>
                </xml>
            </noscript>
            <![endif]-->
            <style type="text/css">
                /* Reset styles */
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
                table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
                img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
                
                /* Client-specific styles */
                .ReadMsgBody { width: 100%; }
                .ExternalClass { width: 100%; }
                .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }
                
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
                
                /* Mobile styles */
                @media only screen and (max-width: 600px) {
                    .container { width: 100% !important; max-width: 100% !important; }
                    .mobile-padding { padding-left: 15px !important; padding-right: 15px !important; }
                    .mobile-center { text-align: center !important; }
                    .mobile-hide { display: none !important; }
                    .mobile-full { width: 100% !important; height: auto !important; }
                    .mobile-text-sm { font-size: 14px !important; line-height: 1.4 !important; }
                    .mobile-button { display: block !important; width: 90% !important; max-width: 280px !important; margin: 15px auto !important; }
                    .mobile-button a { display: block !important; width: 100% !important; padding: 15px 20px !important; }
                    .item-image { width: 60px !important; height: 60px !important; }
                    .mobile-stack { display: block !important; width: 100% !important; }
                    .mobile-stack td { display: block !important; width: 100% !important; padding-right: 0 !important; padding-bottom: 15px !important; }
                }

                /* Dark mode support */
                @media (prefers-color-scheme: dark) {
                    .dark-mode { background-color: #1a1a1a !important; color: #ffffff !important; }
                }
            </style>
        </head>
        <body style="margin: 0; padding: 0; width: 100%; background-color: #f8faf8; font-family: Arial, Helvetica, sans-serif;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8faf8;">
                <tr>
                    <td style="padding: 20px 0;">
                        <!-- Main Container -->
                        <table class="container" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" align="center" style="background-color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            
                            <!-- Header -->
                            <tr>
                                <td class="mobile-padding" style="padding: 30px 40px; text-align: center; background: linear-gradient(135deg, #72b01d, #5a8c17); border-radius: 8px 8px 0 0;">
                                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold; line-height: 1.2;">
                                        ${FROM_NAME}
                                    </h1>
                                    <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 18px; font-weight: 500;">
                                        New Order Received
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Alert Message -->
                            <tr>
                                <td class="mobile-padding" style="padding: 20px 40px;">
                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #d4edda, #c3e6cb); border: 1px solid #c3e6cb; border-radius: 8px;">
                                        <tr>
                                            <td style="padding: 20px; text-align: center;">
                                                <h2 style="margin: 0 0 10px 0; color: #155724; font-size: 20px; font-weight: 600;">
                                                    New Order Received!
                                                </h2>
                                                <p style="margin: 0; color: #155724; font-size: 16px;">
                                                    Action Required: Please process this order as soon as possible.
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            
                            <!-- Order Information -->
                            <tr>
                                <td class="mobile-padding" style="padding: 0 40px;">
                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f9fa; border-radius: 8px; margin-bottom: 20px;">
                                        <tr>
                                            <td style="padding: 25px;">
                                                <h3 style="margin: 0 0 20px 0; color: #0d0a0b; font-size: 18px; font-weight: 600;">
                                                    Order Details
                                                </h3>
                                                
                                                <!-- Order Info Grid -->
                                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                                    <tr>
                                                        <td style="padding: 8px 0; color: #454955; font-size: 14px; font-weight: 500; width: 30%;">Order ID:</td>
                                                        <td style="padding: 8px 0; color: #0d0a0b; font-size: 14px; font-weight: 600;">${order.id}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 8px 0; color: #454955; font-size: 14px; font-weight: 500;">Date:</td>
                                                        <td style="padding: 8px 0; color: #0d0a0b; font-size: 14px; font-weight: 600;">${new Date().toLocaleDateString()}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 8px 0; color: #454955; font-size: 14px; font-weight: 500;">Shop:</td>
                                                        <td style="padding: 8px 0; color: #0d0a0b; font-size: 14px; font-weight: 600;">${order.sellerShopName}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 8px 0; color: #454955; font-size: 14px; font-weight: 500;">Total:</td>
                                                        <td style="padding: 8px 0; color: #72b01d; font-size: 16px; font-weight: 700;">LKR ${order.total.toLocaleString()}</td>
                                                    </tr>
                                                </table>
                                                
                                                <!-- Item Information -->
                                                <table class="mobile-stack" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                                                    <tr>
                                                        <td>
                                                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                                                <tr>
                                                                    ${order.itemImage ? `
                                                                    <td class="mobile-stack" style="width: 80px; vertical-align: top; padding-right: 15px;">
                                                                        <img src="${order.itemImage}" alt="${order.itemName}" class="item-image" style="width: 80px; height: 80px; object-fit: cover; border-radius: 6px; display: block;">
                                                                    </td>
                                                                    ` : ''}
                                                                    <td class="mobile-stack" style="vertical-align: top;">
                                                                        <h4 style="margin: 0 0 8px 0; color: #0d0a0b; font-size: 16px; font-weight: 600; line-height: 1.3;">
                                                                            ${order.itemName}
                                                                        </h4>
                                                                        <p style="margin: 0 0 5px 0; color: #454955; font-size: 14px;">
                                                                            Quantity: ${order.quantity}
                                                                        </p>
                                                                        <p style="margin: 0; color: #454955; font-size: 14px;">
                                                                            Price per item: LKR ${order.price.toLocaleString()}
                                                                        </p>
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                </table>
                                                
                                                <p style="margin: 15px 0 0 0; color: #454955; font-size: 14px;">
                                                    <strong>Payment Method:</strong> ${
                                                        order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY ? 'Cash on Delivery' : 
                                                        order.paymentMethod === PaymentMethod.BANK_TRANSFER ? 'Bank Transfer' : 
                                                        'Other'
                                                    }
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            
                            <!-- Customer Information -->
                            <tr>
                                <td class="mobile-padding" style="padding: 0 40px;">
                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; margin-bottom: 20px;">
                                        <tr>
                                            <td style="padding: 20px;">
                                                <h4 style="margin: 0 0 15px 0; color: #856404; font-size: 16px; font-weight: 600;">Customer Information</h4>
                                                
                                                ${order.buyerInfo ? `
                                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                                    <tr>
                                                        <td style="padding: 4px 0; color: #856404; font-size: 14px; width: 25%;">Name:</td>
                                                        <td style="padding: 4px 0; color: #856404; font-size: 14px; font-weight: 600;">${order.buyerInfo.firstName} ${order.buyerInfo.lastName}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 4px 0; color: #856404; font-size: 14px;">Email:</td>
                                                        <td style="padding: 4px 0; color: #856404; font-size: 14px; font-weight: 600;">${order.buyerInfo.email}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 4px 0; color: #856404; font-size: 14px;">Phone:</td>
                                                        <td style="padding: 4px 0; color: #856404; font-size: 14px; font-weight: 600;">${order.buyerInfo.phone}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 4px 0; color: #856404; font-size: 14px; vertical-align: top;">Address:</td>
                                                        <td style="padding: 4px 0; color: #856404; font-size: 14px; font-weight: 600;">${order.buyerInfo.address}, ${order.buyerInfo.city} ${order.buyerInfo.postalCode}</td>
                                                    </tr>
                                                </table>
                                                ` : `
                                                <p style="margin: 0; color: #856404; font-size: 14px;">
                                                    <strong>Buyer Email:</strong> ${order.buyerEmail}
                                                </p>
                                                `}
                                                
                                                ${order.buyerNotes ? `
                                                <div style="margin-top: 15px; padding: 15px; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 6px;">
                                                    <h5 style="margin: 0 0 8px 0; color: #721c24; font-size: 14px; font-weight: 600;">Special Instructions:</h5>
                                                    <p style="margin: 0; color: #721c24; font-size: 14px; line-height: 1.4;">${order.buyerNotes}</p>
                                                </div>
                                                ` : ''}
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            
                            <!-- Next Steps -->
                            <tr>
                                <td class="mobile-padding" style="padding: 0 40px;">
                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #e8f5e8; border: 1px solid #72b01d; border-radius: 8px; margin-bottom: 30px;">
                                        <tr>
                                            <td style="padding: 20px;">
                                                <h4 style="margin: 0 0 15px 0; color: #155724; font-size: 16px; font-weight: 600;">Next Steps:</h4>
                                                <ul style="margin: 0; padding-left: 20px; color: #155724; font-size: 14px; line-height: 1.6;">
                                                    <li style="margin-bottom: 5px;">Confirm the order and prepare the item for dispatch</li>
                                                    <li style="margin-bottom: 5px;">Contact the customer if you need clarification</li>
                                                    <li style="margin-bottom: 5px;">Update the order status once shipped</li>
                                                    <li>Provide tracking information if available</li>
                                                </ul>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            
                            <!-- CTA Button -->
                            <tr>
                                <td class="mobile-padding" style="padding: 0 40px; text-align: center;">
                                    <table class="mobile-button" role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto;">
                                        <tr>
                                            <td style="background: linear-gradient(135deg, #72b01d, #5a8c17); border-radius: 6px; text-align: center;">
                                                <a href="${typeof window !== 'undefined' ? window.location.origin : 'https://sina.lk'}/dashboard" style="display: inline-block; padding: 15px 30px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; line-height: 1;">
                                                    Manage Order
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td class="mobile-padding" style="padding: 30px 40px; text-align: center; border-top: 1px solid #eee; margin-top: 30px;">
                                    <p style="margin: 0 0 10px 0; color: #999999; font-size: 12px; line-height: 1.4;">
                                        Manage your orders at ${typeof window !== 'undefined' ? window.location.origin : 'https://sina.lk'}/dashboard
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
