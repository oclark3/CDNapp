import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import Purchases from "react-native-purchases";

/**
 * Presents paywall only if user lacks the 'pro' entitlement
 * This is the recommended approach for post-signup flows
 */
export async function presentPaywallIfNeeded(): Promise<PAYWALL_RESULT> {
  try {
    const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: "pro", // Must match your RevenueCat dashboard
    });

    switch (paywallResult) {
      case PAYWALL_RESULT.PURCHASED:
      case PAYWALL_RESULT.RESTORED:
        return paywallResult;
      case PAYWALL_RESULT.NOT_PRESENTED:
        return paywallResult;
      case PAYWALL_RESULT.CANCELLED:
        return paywallResult;
      case PAYWALL_RESULT.ERROR:
        console.error("Paywall: Error presenting paywall");
        return paywallResult;
      default:
        return paywallResult;
    }
  } catch (error) {
    console.error("Error presenting paywall:", error);
    return PAYWALL_RESULT.ERROR;
  }
}

/**
 * Get current customer entitlements (check if user is Pro)
 * Call this on app startup and after paywall dismissal
 */
export async function checkProStatus(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return typeof customerInfo.entitlements.active["pro"] !== "undefined";
  } catch (error) {
    console.error("Error checking pro status:", error);
    return false;
  }
}

/**
 * Alternative: Present paywall regardless of entitlement status
 * Useful for explicit "Upgrade" button clicks
 */
export async function presentPaywall(): Promise<boolean> {
  try {
    const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywall();

    switch (paywallResult) {
      case PAYWALL_RESULT.PURCHASED:
      case PAYWALL_RESULT.RESTORED:
        return true;
      default:
        return false;
    }
  } catch (error) {
    console.error("Error presenting paywall:", error);
    return false;
  }
}