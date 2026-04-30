import { useRoute } from '@react-navigation/native';
import { useEffect } from 'react';

/**
 * Custom hook to detect when a tab is pressed for a second time (_refresh param changes).
 * Triggers a callback whenever the _refresh param is updated.
 * 
 * Usage:
 * useRefreshOnTabPress(() => {
 *   // Re-fetch data or reset screen state
 *   fetchAssets();
 * });
 */
export const useRefreshOnTabPress = (onRefresh: () => void) => {
  const route = useRoute();

  useEffect(() => {
    const params = route.params as any;
    if (params && params._refresh) {
      onRefresh();
    }
  }, [(route.params as any)?._refresh]);
};
