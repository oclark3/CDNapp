/**
 * Utility functions for subscription management and expiration checking
 */

/**
 * Check if a subscription has expired based on the expiration date
 * 
 * @param latestExpirationDate - ISO string date or null/undefined
 * @returns true if subscription has expired, false if still active or date is invalid
 */
export function isSubscriptionExpired(latestExpirationDate: string | null | undefined): boolean {
  if (!latestExpirationDate) {
    return false;
  }

  try {
    const expirationDate = new Date(latestExpirationDate);
    const now = new Date();
    
    // If the expiration date is in the past, subscription is expired
    return expirationDate < now;
  } catch (error) {
    console.error('Error parsing subscription expiration date:', error);
    return false;
  }
}

/**
 * Get the remaining days until subscription expires
 * Useful for future warning features
 * 
 * @param latestExpirationDate - ISO string date or null/undefined
 * @returns Number of days remaining (negative if expired), or null if date is invalid
 */
export function getDaysUntilExpiration(latestExpirationDate: string | null | undefined): number | null {
  if (!latestExpirationDate) {
    return null;
  }

  try {
    const expirationDate = new Date(latestExpirationDate);
    const now = new Date();
    const diffMs = expirationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch (error) {
    console.error('Error calculating days until expiration:', error);
    return null;
  }
}
