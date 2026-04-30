import { Text, View, FlatList, Keyboard, TouchableOpacity, Image, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import NewsListItem from "@/components/ListItems/NewsListItem";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput } from "react-native-paper";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { AssetItem } from "@/types/types";
import { Link, useRouter } from "expo-router";
import { useScrollToTop, useNavigation, useFocusEffect } from "@react-navigation/native";
import { useRefreshOnTabPress } from "@/hooks/useRefreshOnTabPress";
import MainFooter from "@/components/mainFooter";
import { useSession } from "@/hooks/useSession";
import { useGetAssets } from "@/hooks/useAssets";
import { FontAwesome } from "@expo/vector-icons";
import LogoHeader from "@/components/LogoHeader";

export default function SearchScreen() {
  const listRef = useRef<FlatList>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const { accessToken } = useSession();
  const isSignedIn = !!accessToken;
  const { allItems, loading, error, hasMore, fetchAssets, cancelFetch } = useGetAssets({ searchQuery: debouncedQuery, isSearchMode: true, enabled: isSignedIn && debouncedQuery.length > 0, accessToken });
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  const router = useRouter();
  const loadingRef = useRef(false);
  const isFocused = useRef(true);
  useScrollToTop(listRef);

  // Cancel fetch requests when navigating away from this tab
  useFocusEffect(
    useCallback(() => {
      // Set focused to true when tab gains focus
      isFocused.current = true;
      
      // Cleanup function called when tab loses focus
      return () => {
        isFocused.current = false;
        cancelFetch();
      };
    }, [cancelFetch])
  );

  const handleRefresh = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
    setCurrentOffset(0);
  }, []);

  useRefreshOnTabPress(() => {
    handleRefresh();
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  });

  // Debounce input to reduce API calls
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 350);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  // Reset offset when search query changes
  useEffect(() => {
    setCurrentOffset(0);
  }, [debouncedQuery]);

  // Filter articles to only show article type
  const filteredArticles = useMemo(() => {
    return allItems.filter(item => item.type === 'article');
  }, [allItems]);

  // Load more results
  const loadMoreResults = useCallback(async () => {
    // Use ref to prevent race conditions
    if (!isSignedIn || !isFocused.current || loadingRef.current || !hasMore || !debouncedQuery) return;
    loadingRef.current = true;

    try {
      setLoadingMore(true);
      
      const newOffset = currentOffset + 100;
      await fetchAssets(debouncedQuery, newOffset);
      
      setCurrentOffset(newOffset);
    } catch (err: any) {
      console.error('Load more error', err);
    } finally {
      setLoadingMore(false);
      loadingRef.current = false;
    }
  }, [currentOffset, hasMore, debouncedQuery, fetchAssets, isSignedIn]);

  /**
   * Render individual article - memoized
   */
  const renderArticleItem = useCallback(({ item }: { item: AssetItem }) => {
    if (!item || !item.id) {
      console.warn('Invalid article item:', item);
      return null;
    }

    return (
      <View style={{ marginBottom: 15 }}>
        <NewsListItem newsItem={item} />
      </View>
    );
  }, []);

  /**
   * Extract safe key from item - memoized
   */
  const keyExtractor = useCallback((item: any, index: number) => {
    if (!item) {
      return `empty-${index}`;
    }
    return item.id ? `${item.id}-${index}` : `news-${index}`;
  }, []);

  /**
   * Footer component for loading indicator
   */
  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={{ paddingVertical: 20 }}>
        <ActivityIndicator size="small" color="#5f249f" />
      </View>
    );
  }, [loadingMore]);

  /**
   * Empty state message
   */
  const renderEmptyState = useCallback(() => (
    <View style={{ alignItems: 'center', marginTop: 40 }}>
      <Text style={{ fontSize: 16, color: '#999', marginBottom: 40 }}>
        {searchQuery.trim() ? 'No articles found' : 'Start typing to search'}
      </Text>
      {searchQuery.trim() && (
        <Text style={{ fontSize: 14, color: '#CCC', marginTop: 5 }}>
          Try different keywords
        </Text>
      )}
    </View>
  ), [searchQuery]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} edges={["top"]}>
        <LogoHeader />

        {/* Results list */}
        <FlatList
          ref={listRef}
          data={filteredArticles}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          renderItem={renderArticleItem}
          keyExtractor={keyExtractor}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={10}
          onEndReached={loadMoreResults}
          onEndReachedThreshold={0.5}
          onScrollBeginDrag={() => Keyboard.dismiss()}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor="#5f249f" />}
          ListHeaderComponent={
              <View>
                <TextInput
                  placeholder="Search articles, authors..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={{
                    borderColor: '#DDD',
                    borderWidth: 1,
                    borderRadius: 10,
                    marginVertical: 25,
                    backgroundColor: '#FFF',
                    paddingHorizontal: 10,
                  }}
                  placeholderTextColor="#999"
                  clearButtonMode="while-editing"
                />

                {/* Results count */}
                {debouncedQuery && (
                  <Text style={{ color: '#666', fontSize: 12, marginBottom: 10 }}>
                    {filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'} found
                  </Text>
                )}
              </View>
          }
          ListFooterComponent={
            <View style={{ width: '100%' }}>
              {renderFooter()}
              <MainFooter />
            </View>
          }
        />

        {loading && (
          <View style={{ alignItems: 'center', marginTop: 10 }}>
            <ActivityIndicator size="small" color="#5f249f" />
          </View>
        )}

        {error && (
          <View style={{ alignItems: 'center', marginTop: 10 }}>
            <Text style={{ color: 'red' }}>{error}</Text>
          </View>
        )}
    </SafeAreaView>
  );
}