import type { Order } from '../orders';

const FROM_NAME = 'Sina.lk';

export const generatePaymentSlipNotificationEmail = (order: Order & { id: string }) => {
    const subject = `Payment Slip Uploaded - Order ${order.id}`;
    
    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <title>Payment Slip Uploaded</title>
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
                                        Payment Slip Received
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Success Message -->
                            <tr>
                                <td class="mobile-padding" style="padding: 20px 40px;">
                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #d4edda, #c3e6cb); border: 1px solid #c3e6cb; border-radius: 8px;">
                                        <tr>
                                            <td style="padding: 20px; text-align: center;">
                                                <h2 style="margin: 0 0 10px 0; color: #155724; font-size: 20px; font-weight: 600;">
                                                    Great news! Payment slip received
                                                </h2>
                                                <p style="margin: 0; color: #155724; font-size: 16px;">
                                                    Your customer has uploaded their payment slip for order <strong>${order.id}</strong>.
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
                                                        <td style="padding: 8px 0; color: #454955; font-size: 14px; font-weight: 500;">Customer:</td>
                                                        <td style="padding: 8px 0; color: #0d0a0b; font-size: 14px; font-weight: 600;">${order.buyerEmail || 'N/A'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 8px 0; color: #454955; font-size: 14px; font-weight: 500;">Payment Method:</td>
                                                        <td style="padding: 8px 0; color: #0d0a0b; font-size: 14px; font-weight: 600;">Bank Transfer</td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 8px 0; color: #454955; font-size: 14px; font-weight: 500;">Total Amount:</td>
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
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            
                            <!-- Next Steps -->
                            <tr>
                                <td class="mobile-padding" style="padding: 0 40px;">
                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; margin-bottom: 30px;">
                                        <tr>
                                            <td style="padding: 20px;">
                                                <h4 style="margin: 0 0 15px 0; color: #856404; font-size: 16px; font-weight: 600;">Next Steps:</h4>
                                                <ol style="margin: 0; padding-left: 20px; color: #856404; font-size: 14px; line-height: 1.6;">
                                                    <li style="margin-bottom: 8px;">Log in to your dashboard to view the payment slip</li>
                                                    <li style="margin-bottom: 8px;">Verify the bank transfer against your account</li>
                                                    <li style="margin-bottom: 8px;">Once confirmed, update the order status to "Pending" or "Shipped"</li>
                                                    <li>Process the order for shipping or pickup</li>
                                                </ol>
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
                                                    View Order Dashboard
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
                                        Thank you for selling on ${FROM_NAME}!
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
