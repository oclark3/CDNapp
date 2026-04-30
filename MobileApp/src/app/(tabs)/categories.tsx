import { SafeAreaView } from 'react-native-safe-area-context';
import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { Text, FlatList, View, Pressable, Image, Modal, TouchableOpacity, ActivityIndicator, LayoutChangeEvent, StyleSheet, RefreshControl } from 'react-native';
import { Entypo, FontAwesome } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { AssetItem, AssetContent } from '@/types/types';
import { useScrollToTop, useFocusEffect } from "@react-navigation/native";
import { useGetAssets, useGetCategories } from '@/hooks/useAssets';
import { useRefreshOnTabPress } from '@/hooks/useRefreshOnTabPress';
import MainNewsCard from '@/components/ListItems/MainNewsCard';
import ImageCarousel from '@/components/ImageCarousel';
import { useSession } from '@/hooks/useSession';
import LogoHeader from '@/components/LogoHeader';

type CategoryNode = {
  path: string;
  name: string;
  displayName: string;
  level: number;
};

const SMALL_WORDS = new Set(['of', 'the', 'and']);

const formatDisplayName = (text: string): string => {
  // Special case: election_2024 should display as "Election"
  if (text === 'election_2024') {
    return 'Election';
  }
  if (text === 'general') {
    return 'National & World';
  }
  
  const cleaned = text.replace(/_/g, ' ');
  return cleaned
    .split(' ')
    .map((word, idx) => {
      const lower = word.toLowerCase();
      if (idx !== 0 && SMALL_WORDS.has(lower)) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ')
    .trim();
};

const buildHierarchicalCategories = (categoryPaths: string[]): CategoryNode[] => {
  const nodes: CategoryNode[] = [];
  const pathSet = new Set(categoryPaths);
  const visited = new Set<string>();
  
  // Recursive function to add a category and all its children
  const addCategoryAndChildren = (path: string, level: number) => {
    if (visited.has(path)) return;
    visited.add(path);
    
    const parts = path.split('/');
    const name = parts[parts.length - 1];
    const displayName = formatDisplayName(name);
    nodes.push({ path, name, displayName, level });
    
    // Find and add all direct children (one level deeper)
    const childPrefix = path + '/';
    const childPaths = categoryPaths
      .filter(p => p.startsWith(childPrefix) && !p.slice(childPrefix.length).includes('/'))
      .sort();
    
    for (const childPath of childPaths) {
      addCategoryAndChildren(childPath, level + 1);
    }
  };
  
  // Start with all top-level categories (no slashes)
  const topLevelPaths = categoryPaths
    .filter(p => !p.includes('/'))
    .sort();
  
  for (const path of topLevelPaths) {
    addCategoryAndChildren(path, 0);
  }
  
  return nodes;
};



export default function CategoriesScreen() {
  const { accessToken } = useSession();
  const isSignedIn = !!accessToken;
  const { categories } = useGetCategories(isSignedIn);
  const [selectedCategoryPath, setSelectedCategoryPath] = useState<string>('news');
  const { allItems, loading, error, hasMore, fetchAssets, cancelFetch } = useGetAssets({ isSearchMode: false, category: selectedCategoryPath, enabled: isSignedIn, accessToken });
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  
  const listRef = useRef<FlatList>(null);
  const contentHeight = useRef(0);
  const layoutHeight = useRef(0);
  const initialLoadStarted = useRef(false);
  const initialLoadFinished = useRef(false);
  const loadingMoreRef = useRef(false);
  const hasAutoLoadedForViewportRef = useRef(false);
  const offsetRef = useRef(0);
  const isFocused = useRef(true);

  useEffect(() => {
    if (loading) {
      initialLoadStarted.current = true;
      return;
    }

    if (initialLoadStarted.current) {
      initialLoadFinished.current = true;
    }
  }, [loading]);

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

  useRefreshOnTabPress(() => {
    setCurrentOffset(0);
    offsetRef.current = 0;
    hasAutoLoadedForViewportRef.current = false;
    fetchAssets('', 0);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  });

  // Reset offset when category changes
  useEffect(() => {
    setCurrentOffset(0);
    offsetRef.current = 0;
    hasAutoLoadedForViewportRef.current = false;
    setLoadingMore(false);
  }, [selectedCategoryPath]);

  // Check if Business Directory is selected
  const isBusinessDirectory = selectedCategoryPath === 'business_directory' || selectedCategoryPath?.endsWith('business_directory');
  const isKayClarkDirectory = selectedCategoryPath === 'kay_clark' || selectedCategoryPath?.endsWith('kay_clark');

  // Filter articles by type only (articles are now filtered by category via API)
  const filteredArticles = useMemo(() => {
    return allItems.filter(item => item.type === 'article');
  }, [allItems]);

  // Filter image items - only show when Business Directory or Kay Clark Directory is selected
  const imageItems = useMemo(() => {
    if (!isBusinessDirectory && !isKayClarkDirectory) return [];
    return allItems.filter(item => {
      const lowerType = item.type?.toLowerCase() || '';
      return lowerType === 'image' || lowerType === 'photo';
    });
  }, [allItems, isBusinessDirectory, isKayClarkDirectory]);

  const imageAssets = useMemo(() => {
    if (!isBusinessDirectory && !isKayClarkDirectory) return [];
    return imageItems.map(item => ({
      id: item.id,
      title: item.title,
      type: item.type,
      url: item.url,
      summary: item.summary,
      byline: '',
      preview_image: item.preview_url ? {
        url: item.preview_url,
        width: 1050,
        height: 600,
      } : null,
      external_id: null,
      slug: null,
      revision: 0,
      canonical_url: item.url,
      start_time: item.start_time,
      content: [],
      links: [],
      flags: [],
      published: item.published,
      priority: item.priority,
      access: 'free',
      presentation: null,
      source: null,
      custom: [],
      last_updated: item.update_time,
      site_tags: [],
      seo_title: item.title,
      seo_description: item.summary,
      origin_domain: null,
      related_content: [],
      article_type: null,
      publications: [],
      settings: { allow_comments: false },
      location: {
        address: null,
        municipality: null,
        region: '',
        postal_code: null,
        latitude: '',
        longitude: '',
      },
      workflow_name: item.workflow_name,
      workflow_process_name: item.workflow_process_name,
      subhead: item.subhead,
      update_time: item.update_time,
      tags: { site: [], section: [], keyword: [], geo: [] },
      relationships: { child: [], parent: [], sibling: [] },
      authors: [],
      subheadline: item.subhead,
      hammer: null,
      kicker: null,
      tagline: item.category || '',
    } as AssetContent));
  }, [isBusinessDirectory, isKayClarkDirectory, imageItems]);

  // Build hierarchical category structure
  const hierarchicalCategories = useMemo(() => {
    return buildHierarchicalCategories(categories);
  }, [categories]);

  // Get selected category's display name
  const selectedCategoryDisplayName = useMemo(() => {
    if (!selectedCategoryPath) return 'All';
    const selected = hierarchicalCategories.find(cat => cat.path === selectedCategoryPath);
    return selected?.displayName || 'All';
  }, [selectedCategoryPath, hierarchicalCategories]);

  // Auto-load more if content doesn't fill screen on first render
  const handleContentSizeChange = (h: number) => {
    contentHeight.current = h;
    if (
      contentHeight.current <= layoutHeight.current &&
      hasMore &&
      !loading &&
      initialLoadFinished.current &&
      !hasAutoLoadedForViewportRef.current
    ) {
      hasAutoLoadedForViewportRef.current = true;
      handleLoadMore();
    }
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    layoutHeight.current = event.nativeEvent.layout.height;
  };

  const handleLoadMore = useCallback(() => {
    if (!initialLoadFinished.current || !isFocused.current || loadingMoreRef.current || !hasMore || loading) return;

    const newOffset = offsetRef.current + 100;
    offsetRef.current = newOffset;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    setCurrentOffset(newOffset);

    fetchAssets('', newOffset).finally(() => {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    });
  }, [hasMore, loading, fetchAssets]);

  const handleRefresh = useCallback(() => {
    setCurrentOffset(0);
    offsetRef.current = 0;
    hasAutoLoadedForViewportRef.current = false;
    fetchAssets('', 0);
  }, [fetchAssets]);

  const handleSelectCategory = useCallback((categoryPath: string) => {
    setSelectedCategoryPath(categoryPath);
    setModalVisible(false);
  }, []);

  const renderCategoryItem = ({ item }: { item: CategoryNode }) => {
    const isSelected = item.path === selectedCategoryPath;
    const indentWidth = item.level * 20; // 20 pixels per level
    
    return (
      <TouchableOpacity
        onPress={() => handleSelectCategory(item.path)}
        style={{ paddingVertical: 12, paddingHorizontal: 15, paddingLeft: 15 + indentWidth }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: isSelected ? 'bold' : '400',
            color: isSelected ? '#5f249f' : '#000',
          }}
        >
          {item.displayName}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: AssetItem | AssetContent }) => {
    // If it's an image asset (has 'content' property from transformation), render with ImageCarousel
    const lowerType = item.type?.toLowerCase() || '';
    if (lowerType === 'image') {
      return (
        <View >
          <ImageCarousel images={[item as AssetContent]} />
        </View>
      );
    }
    
    // Otherwise render as article
    if (lowerType === 'article') {
      return <MainNewsCard newsItem={item as AssetItem} />;
    }
    
    return null;
  };

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={{ paddingVertical: 20 }}>
        <ActivityIndicator size="small" color="#5f249f" />
      </View>
    );
  }, [loadingMore]);

  const keyExtractor = useCallback((item: AssetItem | AssetContent, index: number) => {
    return item?.id ? `${item.id}-${index}` : `article-${index}`;
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#5f249f" />
        <Text style={{ marginTop: 10 }}>Loading articles...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView onLayout={handleLayout} style={{ flex: 1, backgroundColor: 'white' }} edges={["top"]}>
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.35)',
            justifyContent: 'center',
            paddingHorizontal: 30,
            paddingTop: 50,
          }}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              paddingVertical: 10,
              maxHeight: '70%',
            }}
            onPress={() => {}}
          >
            <FlatList
              data={hierarchicalCategories}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item.path}
              scrollEnabled={true}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* ARTICLES AND IMAGES filtered by selected category */}
      <FlatList
        ref={listRef}
        data={isBusinessDirectory || isKayClarkDirectory ? [...imageAssets, ...filteredArticles] : filteredArticles}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        onContentSizeChange={handleContentSizeChange}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={10}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor="#5f249f" />}
        ListHeaderComponent={
          <View>
            <LogoHeader />

            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 19, marginRight: 5 }}>
                Category:
              </Text>
              <Pressable
                onPress={() => setModalVisible(true)}
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                <Text style={{ fontWeight: 'bold', fontSize: 19, color: '#5f249f' }}>
                  {selectedCategoryDisplayName}
                </Text>
                <Entypo name="chevron-down" size={26} color="#5f249f" />
              </Pressable>
            </View>
          </View>
        }
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={{ fontSize: 16, color: '#999' }}>
              Nothing found in this category
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContainer: {
  },
  error: {
    color: 'red',
    fontSize: 14
  },
});