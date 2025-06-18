const FROM_NAME = 'Sina.lk';

interface CustomOrderItem {
    id?: string;
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    imageUrl?: string;
}

interface CustomOrder {
    id: string;
    buyerName: string;
    buyerEmail?: string;
    sellerName: string;
    items: CustomOrderItem[];
    totalAmount: number;
    shippingCost: number;
    grandTotal: number;
    paymentMethod: string;
    notes?: string;
    buyerAddress?: string;
    buyerPhone?: string;
}

interface Order {
    id: string;
    itemName: string;
    quantity: number;
    total: number;
}

export const generateCustomOrderAcceptanceBuyerEmail = (customOrder: CustomOrder, orders: Order[]) => {
    const subject = `Custom Order Confirmed - ${customOrder.items.length} Item${customOrder.items.length > 1 ? 's' : ''} from ${customOrder.sellerName}`;
    
    const html = `
        <!DOCTYPE html>
        <html lang="en" xmlns="http://www.w3.org/1999/xhtml">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="x-apple-disable-message-reformatting">
            <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
            <title>Custom Order Confirmed - ${FROM_NAME}</title>
            <style type="text/css">
                /* Reset and base styles */
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body, table, td, p, a, li, blockquote { 
                    -webkit-text-size-adjust: 100%; 
                    -ms-text-size-adjust: 100%; 
                }
                table, td { 
                    mso-table-lspace: 0pt; 
                    mso-table-rspace: 0pt; 
                    border-collapse: collapse;
                }
                img { 
                    -ms-interpolation-mode: bicubic; 
                    border: 0; 
                    outline: none; 
                    text-decoration: none;
                    max-width: 100%;
                    height: auto;
                    display: block;
                }
                
                /* Base email styles */
                body { 
                    width: 100% !important; 
                    min-width: 100%; 
                    height: 100% !important; 
                    background-color: #f8faf8; 
                    margin: 0 !important; 
                    padding: 0 !important; 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    font-size: 16px;
                    line-height: 1.6;
                    color: #0d0a0b;
                }
                
                /* Mobile responsive styles */
                @media only screen and (max-width: 640px) {
                    .email-container { margin: 0 !important; border-radius: 0 !important; }
                    .content { padding: 24px 16px !important; }
                    .header { padding: 24px 16px !important; }
                    .footer { padding: 20px 16px !important; }
                    .card-content { padding: 16px !important; }
                    .card-header { padding: 16px !important; }
                    
                    .logo { font-size: 28px !important; }
                    .header-subtitle { font-size: 16px !important; }
                    .success-title { font-size: 20px !important; }
                    .success-icon { font-size: 40px !important; }
                    
                    .item-container { padding: 16px !important; }
                    .item-image { width: 60px !important; height: 60px !important; margin-right: 12px !important; }
                    .item-name { font-size: 15px !important; }
                    .item-description { font-size: 13px !important; }
                    
                    .summary-total { font-size: 18px !important; }
                    .cta-button { padding: 14px 24px !important; font-size: 15px !important; display: block !important; width: 90% !important; max-width: 280px !important; margin: 15px auto !important; }
                    
                    .mobile-stack-item {
                        display: block !important;
                        width: 100% !important;
                        padding-right: 0 !important;
                        margin-bottom: 12px !important;
                    }
                    
                    .mobile-center { text-align: center !important; }
                    .mobile-hide { display: none !important; }
                }
                
                /* Dark mode support */
                @media (prefers-color-scheme: dark) {
                    body { background-color: #1a202c !important; color: #e2e8f0 !important; }
                }
            </style>
        </head>
        <body style="margin: 0; padding: 20px; background-color: #f8faf8;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                    <td align="center" style="padding: 0;">
                        <!-- Main Container -->
                        <div style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);">
                            
                            <!-- Header -->
                            <div style="background: linear-gradient(135deg, #72b01d 0%, #5a8c17 100%); padding: 32px 24px; text-align: center;">
                                <h1 style="color: #ffffff; font-size: 32px; font-weight: 700; margin: 0 0 8px 0; letter-spacing: -0.5px;">
                                    ${FROM_NAME}
                                </h1>
                                <p style="color: rgba(255, 255, 255, 0.9); font-size: 18px; margin: 0; font-weight: 500;">
                                    Custom Order Confirmed
                                </p>
                            </div>
                            
                            <!-- Content -->
                            <div style="padding: 32px 24px;">
                                
                                <!-- Success Banner -->
                                <div style="background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); border: 2px solid #72b01d; border-radius: 10px; padding: 24px; margin-bottom: 32px; text-align: center;">
                                    <h2 style="color: #155724; font-size: 22px; font-weight: 600; margin: 0 0 8px 0; line-height: 1.3;">
                                        Congratulations, ${customOrder.buyerName}!
                                    </h2>
                                    <p style="color: #155724; font-size: 16px; margin: 0; line-height: 1.5;">
                                        Your custom order has been accepted by <strong>${customOrder.sellerName}</strong> and is now being processed.
                                    </p>
                                </div>
                                
                                <!-- Order Summary Card -->
                                <div style="background-color: #fff; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 24px; overflow: hidden;">
                                    <div style="background-color: #f8fafc; padding: 20px 24px; border-bottom: 1px solid #e2e8f0;">
                                        <h3 style="color: #0d0a0b; font-size: 18px; font-weight: 600; margin: 0;">
                                            Order Summary
                                        </h3>
                                    </div>
                                    <div style="padding: 24px;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding: 8px 0; color: #454955; font-size: 15px; width: 40%;">Order ID:</td>
                                                <td style="padding: 8px 0; color: #0d0a0b; font-size: 15px; font-weight: 600;">${customOrder.id}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #454955; font-size: 15px;">Seller:</td>
                                                <td style="padding: 8px 0; color: #0d0a0b; font-size: 15px; font-weight: 600;">${customOrder.sellerName}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #454955; font-size: 15px;">Date:</td>
                                                <td style="padding: 8px 0; color: #0d0a0b; font-size: 15px; font-weight: 600;">${new Date().toLocaleDateString('en-US', { 
                                                    year: 'numeric', 
                                                    month: 'long', 
                                                    day: 'numeric' 
                                                })}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #454955; font-size: 15px;">Items:</td>
                                                <td style="padding: 8px 0; color: #0d0a0b; font-size: 15px; font-weight: 600;">${customOrder.items.length} item${customOrder.items.length > 1 ? 's' : ''}</td>
                                            </tr>
                                        </table>
                                    </div>
                                </div>
                                
                                <!-- Items Card -->
                                <div style="background-color: #fff; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 24px; overflow: hidden;">
                                    <div style="background-color: #f8fafc; padding: 20px 24px; border-bottom: 1px solid #e2e8f0;">
                                        <h3 style="color: #0d0a0b; font-size: 18px; font-weight: 600; margin: 0;">
                                            Order Items
                                        </h3>
                                    </div>
                                    <div style="padding: 24px;">
                                        ${customOrder.items.map((item, index) => `
                                        <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: ${index < customOrder.items.length - 1 ? '16px' : '0'}; border: 1px solid #e2e8f0;">
                                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                                <tr>
                                                    ${item.imageUrl ? `
                                                    <td class="mobile-stack-item" style="width: 96px; vertical-align: top; padding-right: 16px;">
                                                        <img src="${item.imageUrl}" alt="${item.name}" style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover; display: block;">
                                                    </td>
                                                    ` : ''}
                                                    <td class="mobile-stack-item" style="vertical-align: top;">
                                                        <h4 style="color: #0d0a0b; font-size: 16px; font-weight: 600; margin: 0 0 4px 0; line-height: 1.4;">
                                                            ${item.name}
                                                        </h4>
                                                        ${item.description ? `
                                                        <p style="color: #454955; font-size: 14px; margin: 0 0 12px 0; line-height: 1.4;">
                                                            ${item.description}
                                                        </p>
                                                        ` : ''}
                                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                                            <tr>
                                                                <td style="color: #454955; font-size: 14px; padding: 4px 0;">
                                                                    Quantity: ${item.quantity} × LKR ${item.unitPrice.toLocaleString()}
                                                                </td>
                                                                <td style="color: #72b01d; font-size: 16px; font-weight: 600; text-align: right; padding: 4px 0;">
                                                                    LKR ${(item.quantity * item.unitPrice).toLocaleString()}
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                        </div>
                                        `).join('')}
                                    </div>
                                </div>
                                
                                <!-- Price Summary Card -->
                                <div style="background-color: #fff; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 24px; overflow: hidden;">
                                    <div style="background-color: #f8fafc; padding: 20px 24px; border-bottom: 1px solid #e2e8f0;">
                                        <h3 style="color: #0d0a0b; font-size: 18px; font-weight: 600; margin: 0;">
                                            Price Breakdown
                                        </h3>
                                    </div>
                                    <div style="padding: 24px;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                                <td style="padding: 12px 0; color: #4a5568; font-size: 15px;">Items Total:</td>
                                                <td style="padding: 12px 0; color: #0d0a0b; font-size: 15px; font-weight: 500; text-align: right;">LKR ${customOrder.totalAmount.toLocaleString()}</td>
                                            </tr>
                                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                                <td style="padding: 12px 0; color: #4a5568; font-size: 15px;">Shipping:</td>
                                                <td style="padding: 12px 0; color: #0d0a0b; font-size: 15px; font-weight: 500; text-align: right;">LKR ${customOrder.shippingCost.toLocaleString()}</td>
                                            </tr>
                                            <tr style="border-top: 2px solid #72b01d;">
                                                <td style="padding: 16px 0 8px 0; color: #4a5568; font-size: 15px; font-weight: 600;">Grand Total:</td>
                                                <td style="padding: 16px 0 8px 0; color: #72b01d; font-size: 20px; font-weight: 700; text-align: right;">LKR ${customOrder.grandTotal.toLocaleString()}</td>
                                            </tr>
                                        </table>
                                        
                                        <div style="margin-top: 16px; padding: 16px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                                            <p style="margin: 0; color: #4a5568; font-size: 14px;">
                                                <strong>Payment Method:</strong> 
                                                <span style="color: #72b01d; font-weight: 600;">
                                                    ${customOrder.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Bank Transfer'}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                ${orders.length > 1 ? `
                                <!-- Multiple Orders Notice -->
                                <div style="background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%); border: 2px solid #ffc107; border-radius: 10px; padding: 20px; margin: 24px 0;">
                                    <h4 style="color: #856404; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">
                                        Multiple Order Tracking
                                    </h4>
                                    <p style="color: #856404; font-size: 14px; line-height: 1.5; margin: 0;">
                                        Your custom order has been divided into <strong>${orders.length} separate orders</strong> for optimal processing and tracking. Each order will be handled individually by ${customOrder.sellerName}, allowing for faster fulfillment and easier management.
                                    </p>
                                </div>
                                ` : ''}
                                
                                <!-- Next Steps -->
                                <div style="background: linear-gradient(135deg, #e8f5e8 0%, #d1f2d1 100%); border: 2px solid #72b01d; border-radius: 10px; padding: 20px; margin: 24px 0;">
                                    <h4 style="color: #155724; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">
                                        🚀 What happens next?
                                    </h4>
                                    <p style="color: #155724; font-size: 14px; line-height: 1.5; margin: 0;">
                                        ${customOrder.sellerName} will prepare your order and contact you with delivery details. You'll receive updates on your order status and can track everything from your account dashboard.
                                    </p>
                                </div>
                                
                                <!-- CTA Button -->
                                <div style="text-align: center; margin: 32px 0;">
                                    <a href="${typeof window !== 'undefined' ? window.location.origin : 'https://sina.lk'}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #72b01d 0%, #5a8c17 100%); color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; text-align: center; border: none; box-shadow: 0 4px 12px rgba(114, 176, 29, 0.3);">
                                        📱 View Your Orders
                                    </a>
                                </div>
                                
                                ${customOrder.notes ? `
                                <!-- Order Notes -->
                                <div style="background-color: #fff; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 24px; overflow: hidden;">
                                    <div style="background-color: #f8fafc; padding: 20px 24px; border-bottom: 1px solid #e2e8f0;">
                                        <h3 style="color: #0d0a0b; font-size: 18px; font-weight: 600; margin: 0;">
                                            📝 Order Notes
                                        </h3>
                                    </div>
                                    <div style="padding: 24px;">
                                        <p style="margin: 0; color: #4a5568; font-size: 14px; line-height: 1.6; font-style: italic;">
                                            "${customOrder.notes}"
                                        </p>
                                    </div>
                                </div>
                                ` : ''}
                                
                            </div>
                            
                            <!-- Footer -->
                            <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                                <p style="color: #454955; font-size: 14px; line-height: 1.5; margin: 0 0 8px 0;">
                                    Questions about your order? Contact us at <a href="mailto:support@sina.lk" style="color: #72b01d; text-decoration: none;">support@sina.lk</a>
                                </p>
                                <p style="color: #454955; font-size: 14px; line-height: 1.5; margin: 0 0 8px 0;">
                                    Follow us: <a href="#" style="color: #72b01d; text-decoration: none;">Facebook</a> | <a href="#" style="color: #72b01d; text-decoration: none;">Instagram</a> | <a href="#" style="color: #72b01d; text-decoration: none;">Twitter</a>
                                </p>
                                <p style="color: #a0aec0; font-size: 12px; margin: 0;">
                                    © 2025 ${FROM_NAME}. All rights reserved. | <a href="#" style="color: #a0aec0; text-decoration: none;">Privacy Policy</a> | <a href="#" style="color: #a0aec0; text-decoration: none;">Terms of Service</a>
                                </p>
                            </div>
                            
                        </div>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;

    return { subject, html };
};
