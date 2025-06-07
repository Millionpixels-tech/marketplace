// Payment hash utility functions

export interface PaymentHashParams {
  merchant_id: string;
  order_id: string;
  amount: string;
  currency: string;
  merchant_secret: string;
}

export interface PaymentHashResponse {
  hash: string;
  success: boolean;
  error?: string;
}

/**
 * Calls the Firebase function to generate a payment hash
 * @param params - Payment parameters required for hash generation
 * @returns Promise<PaymentHashResponse> - The generated hash or error
 */
export const generatePaymentHash = async (params: PaymentHashParams): Promise<PaymentHashResponse> => {
  try {
    // Validate required parameters
    const { merchant_id, order_id, amount, currency, merchant_secret } = params;
    
    if (!merchant_id || !order_id || !amount || !currency || !merchant_secret) {
      return {
        hash: '',
        success: false,
        error: 'Missing required parameters for hash generation'
      };
    }

    // Get the Firebase project ID from the config
    const projectId = 'marketplace-bd270';
    
    // Construct the Firebase function URL
    const functionUrl = `https://us-central1-${projectId}.cloudfunctions.net/generatePaymentHash`;
    
    // Make the request to the Firebase function
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      return {
        hash: '',
        success: false,
        error: `HTTP error! status: ${response.status}`
      };
    }

    const result: PaymentHashResponse = await response.json();
    return result;

  } catch (error) {
    console.error('Error calling payment hash function:', error);
    return {
      hash: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Alternative method using Firebase SDK (requires Firebase SDK setup)
 * Uncomment and use this if you prefer to use the Firebase SDK
 */
/*
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase'; // Import your Firebase app

export const generatePaymentHashWithSDK = async (params: PaymentHashParams): Promise<PaymentHashResponse> => {
  try {
    const functions = getFunctions(app);
    const generateHash = httpsCallable<PaymentHashParams, PaymentHashResponse>(functions, 'generatePaymentHash');
    
    const result = await generateHash(params);
    return result.data;
  } catch (error) {
    console.error('Error calling payment hash function:', error);
    return {
      hash: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
*/

/**
 * Example usage:
 * 
 * const hashParams = {
 *   merchant_id: 'YOUR_MERCHANT_ID',
 *   order_id: 'ORDER_123',
 *   amount: '1000.00',
 *   currency: 'LKR',
 *   merchant_secret: 'YOUR_MERCHANT_SECRET'
 * };
 * 
 * const result = await generatePaymentHash(hashParams);
 * if (result.success) {
 *   console.log('Generated hash:', result.hash);
 * } else {
 *   console.error('Error:', result.error);
 * }
 */
