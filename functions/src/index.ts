import * as functions from "firebase-functions";
import * as crypto from "crypto";

// Interface for the request body
interface HashRequest {
  merchant_id: string;
  order_id: string;
  amount: string;
  currency: string;
  merchant_secret: string;
}

// Interface for the response
interface HashResponse {
  hash: string;
  success: boolean;
  error?: string;
}

/**
 * Generates payment hash using the formula:
 * hash = to_upper_case(md5(merchant_id + order_id + amount + currency + to_upper_case(md5(merchant_secret))))
 */
export const generatePaymentHash = functions.https.onRequest((request: any, response: any) => {
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
    const { merchant_id, order_id, amount, currency, merchant_secret }: HashRequest = request.body;

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
    const hashResponse: HashResponse = {
      hash: finalHash,
      success: true,
    };

    response.status(200).json(hashResponse);
  } catch (error) {
    functions.logger.error("Error generating payment hash", error);
    
    const errorResponse: HashResponse = {
      hash: "",
      success: false,
      error: "Internal server error while generating hash",
    };

    response.status(500).json(errorResponse);
  }
});
