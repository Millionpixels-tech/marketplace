/**
 * Utility functions for randomizing listings display
 */

/**
 * Generates a random seed based on user IP and current time
 * This ensures different users see different orders, and refreshing gives new orders
 */
export function generateRandomSeed(userIp?: string): number {
  const baseTime = Math.floor(Date.now() / (1000 * 60 * 10)); // Changes every 10 minutes
  const ipComponent = userIp ? 
    userIp.split('.').reduce((acc, part) => acc + (parseInt(part) || 0), 0) : 
    Math.floor(Math.random() * 1000);
  
  return baseTime + ipComponent + Math.floor(Math.random() * 100);
}

/**
 * Shuffles an array using a seed for reproducible randomization
 */
export function shuffleArrayWithSeed<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  let currentIndex = shuffled.length;
  let randomIndex: number;

  // Simple linear congruential generator for seeded random
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  while (currentIndex !== 0) {
    randomIndex = Math.floor(seededRandom(seed + currentIndex) * currentIndex);
    currentIndex--;
    
    // Swap elements
    [shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]];
  }
  
  return shuffled;
}

/**
 * Fetches randomized listings for homepage or other displays
 */
export async function fetchRandomizedListings(
  db: any, 
  limit: number = 8, 
  userIp?: string
): Promise<any[]> {
  try {
    // Fetch more items than needed for better randomization
    const fetchLimit = Math.min(limit * 3, 50); // Don't fetch too many
    
    // Use document ID ordering for consistent pagination and better distribution
    const { collection, query, orderBy, limit: firestoreLimit, getDocs } = await import("firebase/firestore");
    
    const snap = await getDocs(
      query(
        collection(db, "listings"), 
        orderBy("__name__"), // Use document ID for consistent ordering
        firestoreLimit(fetchLimit)
      )
    );
    
    const allResults = snap.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      __client_ip: userIp 
    }));
    
    // Randomize and return requested number
    const seed = generateRandomSeed(userIp);
    const shuffled = shuffleArrayWithSeed(allResults, seed);
    
    return shuffled.slice(0, limit);
  } catch (error) {
    console.error("Error fetching randomized listings:", error);
    return [];
  }
}
