"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = exports.generatePaymentHash = void 0;
const functions = __importStar(require("firebase-functions"));
const crypto = __importStar(require("crypto"));
/**
 * Generates payment hash using the formula:
 * hash = to_upper_case(md5(merchant_id + order_id + amount + currency + to_upper_case(md5(merchant_secret))))
 */
exports.generatePaymentHash = functions.https.onRequest((request, response) => {
    // Set CORS headers
    response.set('Access-Control-Allow-Origin', '*');
    response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.set('Access-Control-Allow-Headers', 'Content-Type');
    // Handle preflight request
    if (request.method === 'OPTIONS') {
        response.status(204).send('');
        return;
    }
    try {
        // Only allow POST requests
        if (request.method !== "POST") {
            response.status(405).json({
                success: false,
                error: "Method not allowed. Use POST request.",
            });
            return;
        }
        // Validate request body
        const { merchant_id, order_id, amount, currency, merchant_secret } = request.body;
        if (!merchant_id || !order_id || !amount || !currency || !merchant_secret) {
            response.status(400).json({
                success: false,
                error: "Missing required parameters: merchant_id, order_id, amount, currency, merchant_secret",
            });
            return;
        }
        // Log the request (without sensitive data)
        functions.logger.info("Generating payment hash", {
            merchant_id,
            order_id,
            amount,
            currency,
            // Don't log merchant_secret for security
        });
        // Step 1: Generate MD5 hash of merchant_secret and convert to uppercase
        const merchantSecretHash = crypto
            .createHash("md5")
            .update(merchant_secret)
            .digest("hex")
            .toUpperCase();
        // Step 2: Concatenate merchant_id + order_id + amount + currency + uppercase(md5(merchant_secret))
        const concatenatedString = merchant_id + order_id + amount + currency + merchantSecretHash;
        // Step 3: Generate MD5 hash of the concatenated string and convert to uppercase
        const finalHash = crypto
            .createHash("md5")
            .update(concatenatedString)
            .digest("hex")
            .toUpperCase();
        functions.logger.info("Payment hash generated successfully", {
            merchant_id,
            order_id,
            hashLength: finalHash.length,
        });
        // Return the hash
        const hashResponse = {
            hash: finalHash,
            success: true,
        };
        response.status(200).json(hashResponse);
    }
    catch (error) {
        functions.logger.error("Error generating payment hash", error);
        const errorResponse = {
            hash: "",
            success: false,
            error: "Internal server error while generating hash",
        };
        response.status(500).json(errorResponse);
    }
});
/**
 * Send email using SMTP configuration from request parameters
 */
exports.sendEmail = functions.https.onRequest(async (request, response) => {
    // Set CORS headers
    response.set('Access-Control-Allow-Origin', '*');
    response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.set('Access-Control-Allow-Headers', 'Content-Type');
    // Handle preflight request
    if (request.method === 'OPTIONS') {
        response.status(204).send('');
        return;
    }
    // Only allow POST requests
    if (request.method !== "POST") {
        response.status(405).json({
            success: false,
            error: "Method not allowed. Use POST request.",
        });
        return;
    }
    try {
        // Load nodemailer dynamically to avoid loading it for other functions
        const nodemailer = require("nodemailer");
        // Extract SMTP configuration and emails from request
        const { emails, smtpConfig } = request.body;
        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            response.status(400).json({
                success: false,
                error: 'Invalid request. Expected array of emails.',
            });
            return;
        }
        if (!smtpConfig || !smtpConfig.user || !smtpConfig.pass) {
            response.status(400).json({
                success: false,
                error: 'SMTP configuration is required with user and pass.',
            });
            return;
        }
        // Create SMTP transporter with provided configuration
        const transporterConfig = {
            host: smtpConfig.host,
            port: smtpConfig.port,
            secure: smtpConfig.secure,
            auth: {
                user: smtpConfig.user,
                pass: smtpConfig.pass,
            },
        };
        functions.logger.info('Creating SMTP transporter with config:', {
            host: smtpConfig.host,
            port: smtpConfig.port,
            secure: smtpConfig.secure,
            user: smtpConfig.user,
            fromEmail: smtpConfig.fromEmail,
            fromName: smtpConfig.fromName,
            emailCount: emails.length,
            // Don't log password for security
        });
        // Create transporter
        const transporter = nodemailer.createTransport(transporterConfig);
        // Send all emails
        const sendPromises = emails.map(async (emailData) => {
            try {
                await transporter.sendMail({
                    from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
                    to: emailData.to,
                    subject: emailData.subject,
                    html: emailData.html,
                });
                functions.logger.info(`Email sent successfully to: ${emailData.to}`);
                return { email: emailData.to, success: true };
            }
            catch (error) {
                functions.logger.error(`Failed to send email to ${emailData.to}:`, error);
                return {
                    email: emailData.to,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        });
        // Wait for all emails to be sent
        const results = await Promise.all(sendPromises);
        const successCount = results.filter(r => r.success).length;
        functions.logger.info(`Email sending completed. ${successCount}/${results.length} emails sent successfully.`);
        const emailResponse = {
            success: successCount > 0,
            results: results,
        };
        response.status(200).json(emailResponse);
    }
    catch (error) {
        functions.logger.error("Error in sendEmail function:", error);
        const errorResponse = {
            success: false,
            error: "Internal server error while sending email",
        };
        response.status(500).json(errorResponse);
    }
});
//# sourceMappingURL=index.js.map