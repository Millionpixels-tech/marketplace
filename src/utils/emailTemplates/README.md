# Email Templates Structure

This directory contains the reorganized email template system for the marketplace application.

## Structure

```
emailTemplates/
├── index.ts                      # Main exports for all email templates
├── buyerOrderConfirmation.ts     # Buyer order confirmation email template
├── sellerOrderNotification.ts    # Seller order notification email template
└── paymentSlipNotification.ts    # Payment slip upload notification template
```

## Usage

### Importing Templates

```typescript
// Import specific template functions
import { generateBuyerOrderConfirmationEmail } from './emailTemplates/buyerOrderConfirmation';
import { generateSellerOrderNotificationEmail } from './emailTemplates/sellerOrderNotification';
import { generatePaymentSlipNotificationEmail } from './emailTemplates/paymentSlipNotification';

// Or import all templates at once
import {
  generateBuyerOrderConfirmationEmail,
  generateSellerOrderNotificationEmail,
  generatePaymentSlipNotificationEmail
} from './emailTemplates';
```

### Email Service

For sending emails, use the main email service:

```typescript
import { 
  sendOrderConfirmationEmails, 
  sendPaymentSlipNotification, 
  sendTestEmail 
} from './emailService';
```

## Template Features

All email templates include:

- **Mobile-first responsive design** - Optimized for both mobile and desktop email clients
- **Table-based layout** - Ensures compatibility with all email clients including Outlook
- **MSO conditionals** - Special handling for Microsoft Outlook
- **Dark mode support** - Respects user's color scheme preferences
- **Accessibility features** - Proper heading structure and alt text for images
- **Cross-client compatibility** - Tested for Gmail, Outlook, Apple Mail, etc.

## Mobile Optimization

Each template includes:

- Responsive CSS media queries
- Mobile-specific padding and sizing
- Stackable layout components
- Touch-friendly button sizes
- Readable font sizes on small screens

## Browser Support

Templates are compatible with:

- Gmail (Web, iOS, Android)
- Outlook (2016+, Office 365, Outlook.com)
- Apple Mail (macOS, iOS)
- Yahoo Mail
- Thunderbird
- And most other modern email clients

## Template Structure

Each email template follows this structure:

1. **DOCTYPE and Meta Tags** - Proper HTML5 structure
2. **CSS Reset** - Normalize appearance across clients
3. **Responsive Styles** - Mobile-first media queries
4. **MSO Conditionals** - Outlook-specific fixes
5. **Table-based Layout** - Main container and content structure
6. **Header Section** - Branding and title
7. **Content Sections** - Order details, customer info, etc.
8. **Call-to-Action** - Buttons and links
9. **Footer** - Contact info and legal text

## Migration Notes

The original `emailServiceFrontend.ts` file has been deprecated and refactored into this modular structure. All existing imports will continue to work due to re-exports in the main file.

### Before
```typescript
// Large monolithic file with all templates
import { generateBuyerOrderConfirmationEmail } from './emailServiceFrontend';
```

### After
```typescript
// Modular structure with dedicated files
import { generateBuyerOrderConfirmationEmail } from './emailTemplates';
// or
import { sendOrderConfirmationEmails } from './emailService';
```

## Best Practices

1. **Keep templates lightweight** - Avoid large images or complex CSS
2. **Test in multiple clients** - Use tools like Litmus or Email on Acid
3. **Use minimal emojis** - As requested, emojis are kept to a minimum
4. **Inline critical CSS** - Important styles are inlined for better compatibility
5. **Provide fallbacks** - Alt text for images, plain text versions when needed

## Adding New Templates

To add a new email template:

1. Create a new file in the `emailTemplates/` directory
2. Follow the existing structure and conventions
3. Export the function from `index.ts`
4. Add corresponding send function to `emailService.ts` if needed
5. Update this README with the new template information
