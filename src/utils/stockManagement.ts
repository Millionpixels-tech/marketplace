import { db } from "./firebase";
import { doc, getDoc, runTransaction } from "firebase/firestore";

/**
 * Reduces stock quantity for a listing when an order is placed
 * Handles both simple quantity and variations
 */
export async function reduceListingStock(
  itemId: string,
  quantityToReduce: number,
  variationId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const listingRef = doc(db, "listings", itemId);
    
    return await runTransaction(db, async (transaction) => {
      const listingDoc = await transaction.get(listingRef);
      
      if (!listingDoc.exists()) {
        return { success: false, error: "Listing not found" };
      }
      
      const listingData = listingDoc.data();
      
      // Check if listing has variations
      if (listingData.hasVariations && listingData.variations && variationId) {
        // Handle variation stock reduction
        const variations = [...listingData.variations];
        const variationIndex = variations.findIndex(v => v.id === variationId);
        
        if (variationIndex === -1) {
          return { success: false, error: "Variation not found" };
        }
        
        const variation = variations[variationIndex];
        
        // Check if there's enough stock
        if (variation.quantity < quantityToReduce) {
          return { 
            success: false, 
            error: `Insufficient stock for variation "${variation.name}". Available: ${variation.quantity}, Requested: ${quantityToReduce}` 
          };
        }
        
        // Reduce variation quantity
        variations[variationIndex] = {
          ...variation,
          quantity: variation.quantity - quantityToReduce
        };
        
        // Recalculate total quantity from all variations
        const totalQuantity = variations.reduce((sum, v) => sum + v.quantity, 0);
        
        // Update the listing
        transaction.update(listingRef, {
          variations: variations,
          quantity: totalQuantity
        });
        
       // console.log(`✅ Stock reduced for variation "${variation.name}": ${variation.quantity} -> ${variation.quantity - quantityToReduce}`);
        
      } else {
        // Handle simple quantity stock reduction
        const currentQuantity = listingData.quantity || 0;
        
        // Check if there's enough stock
        if (currentQuantity < quantityToReduce) {
          return { 
            success: false, 
            error: `Insufficient stock. Available: ${currentQuantity}, Requested: ${quantityToReduce}` 
          };
        }
        
        const newQuantity = currentQuantity - quantityToReduce;
        
        // Update the listing quantity
        transaction.update(listingRef, {
          quantity: newQuantity
        });
        
       // console.log(`✅ Stock reduced for listing: ${currentQuantity} -> ${newQuantity}`);
      }
      
      return { success: true };
    });
    
  } catch (error) {
    console.error("Error reducing stock:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to reduce stock" 
    };
  }
}

/**
 * Restores stock quantity for a listing when an order is cancelled or refunded
 * This is the reverse operation of reduceListingStock
 */
export async function restoreListingStock(
  itemId: string,
  quantityToRestore: number,
  variationId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const listingRef = doc(db, "listings", itemId);
    
    return await runTransaction(db, async (transaction) => {
      const listingDoc = await transaction.get(listingRef);
      
      if (!listingDoc.exists()) {
        return { success: false, error: "Listing not found" };
      }
      
      const listingData = listingDoc.data();
      
      // Check if listing has variations
      if (listingData.hasVariations && listingData.variations && variationId) {
        // Handle variation stock restoration
        const variations = [...listingData.variations];
        const variationIndex = variations.findIndex(v => v.id === variationId);
        
        if (variationIndex === -1) {
          return { success: false, error: "Variation not found" };
        }
        
        const variation = variations[variationIndex];
        
        // Restore variation quantity
        variations[variationIndex] = {
          ...variation,
          quantity: variation.quantity + quantityToRestore
        };
        
        // Recalculate total quantity from all variations
        const totalQuantity = variations.reduce((sum, v) => sum + v.quantity, 0);
        
        // Update the listing
        transaction.update(listingRef, {
          variations: variations,
          quantity: totalQuantity
        });
        
       // console.log(`✅ Stock restored for variation "${variation.name}": ${variation.quantity} -> ${variation.quantity + quantityToRestore}`);
        
      } else {
        // Handle simple quantity stock restoration
        const currentQuantity = listingData.quantity || 0;
        const newQuantity = currentQuantity + quantityToRestore;
        
        // Update the listing quantity
        transaction.update(listingRef, {
          quantity: newQuantity
        });

        // console.log(`✅ Stock restored for listing: ${currentQuantity} -> ${newQuantity}`);
      }
      
      return { success: true };
    });
    
  } catch (error) {
    console.error("Error restoring stock:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to restore stock" 
    };
  }
}

/**
 * Checks if sufficient stock is available for a listing before placing an order
 */
export async function checkStockAvailability(
  itemId: string,
  quantityNeeded: number,
  variationId?: string
): Promise<{ available: boolean; currentStock: number; error?: string }> {
  try {
    const listingRef = doc(db, "listings", itemId);
    const listingDoc = await getDoc(listingRef);
    
    if (!listingDoc.exists()) {
      return { available: false, currentStock: 0, error: "Listing not found" };
    }
    
    const listingData = listingDoc.data();
    
    if (listingData.hasVariations && listingData.variations && variationId) {
      // Check variation stock
      const variation = listingData.variations.find((v: any) => v.id === variationId);
      
      if (!variation) {
        return { available: false, currentStock: 0, error: "Variation not found" };
      }
      
      return {
        available: variation.quantity >= quantityNeeded,
        currentStock: variation.quantity
      };
    } else {
      // Check simple quantity stock
      const currentQuantity = listingData.quantity || 0;
      
      return {
        available: currentQuantity >= quantityNeeded,
        currentStock: currentQuantity
      };
    }
    
  } catch (error) {
    console.error("Error checking stock availability:", error);
    return { 
      available: false, 
      currentStock: 0, 
      error: error instanceof Error ? error.message : "Failed to check stock" 
    };
  }
}

/**
 * Checks if a listing has low stock and returns warning information
 */
export async function checkLowStock(
  itemId: string,
  lowStockThreshold: number = 5
): Promise<{ 
  hasLowStock: boolean; 
  warnings: string[]; 
  totalStock: number;
  variationWarnings?: Array<{ id: string; name: string; quantity: number; }>;
}> {
  try {
    const listingRef = doc(db, "listings", itemId);
    const listingDoc = await getDoc(listingRef);
    
    if (!listingDoc.exists()) {
      return { 
        hasLowStock: false, 
        warnings: ["Listing not found"], 
        totalStock: 0 
      };
    }
    
    const listingData = listingDoc.data();
    const warnings: string[] = [];
    const variationWarnings: Array<{ id: string; name: string; quantity: number; }> = [];
    let hasLowStock = false;
    let totalStock = 0;
    
    if (listingData.hasVariations && listingData.variations) {
      // Check variations for low stock
      listingData.variations.forEach((variation: any) => {
        totalStock += variation.quantity;
        
        if (variation.quantity <= lowStockThreshold) {
          hasLowStock = true;
          variationWarnings.push({
            id: variation.id,
            name: variation.name,
            quantity: variation.quantity
          });
          
          if (variation.quantity === 0) {
            warnings.push(`Variation "${variation.name}" is out of stock`);
          } else {
            warnings.push(`Variation "${variation.name}" has low stock: ${variation.quantity} units remaining`);
          }
        }
      });
    } else {
      // Check simple quantity for low stock
      totalStock = listingData.quantity || 0;
      
      if (totalStock <= lowStockThreshold) {
        hasLowStock = true;
        
        if (totalStock === 0) {
          warnings.push("Item is out of stock");
        } else {
          warnings.push(`Low stock: ${totalStock} units remaining`);
        }
      }
    }
    
    return {
      hasLowStock,
      warnings,
      totalStock,
      ...(variationWarnings.length > 0 && { variationWarnings })
    };
    
  } catch (error) {
    console.error("Error checking low stock:", error);
    return { 
      hasLowStock: false, 
      warnings: ["Error checking stock levels"], 
      totalStock: 0 
    };
  }
}

/**
 * Gets a summary of all low stock items for a seller
 */
export async function getLowStockSummary(
  sellerId: string,
  lowStockThreshold: number = 5
): Promise<{
  lowStockItems: Array<{
    id: string;
    name: string;
    totalStock: number;
    warnings: string[];
    variationWarnings?: Array<{ id: string; name: string; quantity: number; }>;
  }>;
  totalLowStockItems: number;
}> {
  try {
    const { collection, query, where, getDocs } = await import("firebase/firestore");
    
    // Get all listings for the seller
    const listingsQuery = query(
      collection(db, "listings"),
      where("owner", "==", sellerId)
    );
    
    const listingsSnapshot = await getDocs(listingsQuery);
    const lowStockItems: Array<{
      id: string;
      name: string;
      totalStock: number;
      warnings: string[];
      variationWarnings?: Array<{ id: string; name: string; quantity: number; }>;
    }> = [];
    
    for (const doc of listingsSnapshot.docs) {
      const stockCheck = await checkLowStock(doc.id, lowStockThreshold);
      
      if (stockCheck.hasLowStock) {
        lowStockItems.push({
          id: doc.id,
          name: doc.data().name || "Unknown Item",
          totalStock: stockCheck.totalStock,
          warnings: stockCheck.warnings,
          variationWarnings: stockCheck.variationWarnings
        });
      }
    }
    
    return {
      lowStockItems,
      totalLowStockItems: lowStockItems.length
    };
    
  } catch (error) {
    console.error("Error getting low stock summary:", error);
    return {
      lowStockItems: [],
      totalLowStockItems: 0
    };
  }
}
