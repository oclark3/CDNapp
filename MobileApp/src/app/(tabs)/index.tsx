import { ActivityIndicator, Text, View, SectionList, Image, Pressable, StyleSheet, FlatList, LayoutChangeEvent, Dimensions, RefreshControl } from "react-native";
import MainNewsCard from "@/components/ListItems/MainNewsCard";
import FeaturedNewsCard from "@/components/ListItems/FeaturedNewsCard";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { useScrollToTop, useFocusEffect } from "@react-navigation/native";
import { AssetItem } from "@/types/types";
import { useSession } from '@/hooks/useSession';
import { useGetAssets } from "@/hooks/useAssets";
import { useRefreshOnTabPress } from '@/hooks/useRefreshOnTabPress';
import LogoHeader from "@/components/LogoHeader";

export default function HomeScreen() {
    const { accessToken } = useSession();
    const isSignedIn = !!accessToken;
    const { allItems, loading, error, hasMore, fetchAssets, cancelFetch } = useGetAssets({ enabled: isSignedIn, accessToken });
    const { allItems: featuredItems, loading: featuredLoading, cancelFetch: cancelFeaturedFetch } = useGetAssets({ 
        flag: 'featured', 
        enabled: isSignedIn,
        accessToken 
    });
    const [loadingMore, setLoadingMore] = useState(false);
    const [currentOffset, setCurrentOffset] = useState(0);
    const listRef = useRef<FlatList>(null);
    const featuredCarouselRef = useRef<FlatList>(null);
    const contentHeight = useRef(0);
    const layoutHeight = useRef(0);
    const initialLoadStarted = useRef(false);
    const initialLoadFinished = useRef(false);
    const loadingMoreRef = useRef(false);
    const hasAutoLoadedForViewportRef = useRef(false);
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

    useScrollToTop(
        useRef({
            scrollToTop: () => {
                listRef.current?.scrollToOffset({ offset: 0, animated: true });
                featuredCarouselRef.current?.scrollToOffset({ offset: 0, animated: true });
            }
        })
    );

    useRefreshOnTabPress(() => {
        setCurrentOffset(0);
        hasAutoLoadedForViewportRef.current = false;
        fetchAssets('', 0);
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
        featuredCarouselRef.current?.scrollToOffset({ offset: 0, animated: true });
    });

    // Cancel fetch requests when navigating away from this tab
    useFocusEffect(
        useCallback(() => {
            // Set focused to true when tab gains focus
            isFocused.current = true;
            
            // Cleanup function called when tab loses focus
            return () => {
                isFocused.current = false;
                cancelFetch();
                cancelFeaturedFetch();
            };
        }, [cancelFetch, cancelFeaturedFetch])
    );

    // To load more articles if not enough articles loaded on first render
    const handleContentSizeChange = (h: number) => {
        contentHeight.current = h;
        // Check if content height is less than layout height on first render and more data exists
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
        
        const newOffset = currentOffset + 100;
        loadingMoreRef.current = true;
        setLoadingMore(true);
        setCurrentOffset(newOffset);
        
        fetchAssets('', newOffset).finally(() => {
            loadingMoreRef.current = false;
            setLoadingMore(false);
        });
    }, [currentOffset, loadingMore, hasMore, loading, fetchAssets]);

    const handleRefresh = useCallback(() => {
        setCurrentOffset(0);
        hasAutoLoadedForViewportRef.current = false;
        fetchAssets('', 0);
    }, [fetchAssets]);

    const renderItem = ({ item }: { item: AssetItem }) => {
        if (item.type !== 'article') return null;
        return <MainNewsCard newsItem={item} />;
    };

    const renderFeaturedCarousel = useCallback(() => {
        if (featuredLoading && featuredItems.length === 0) {
            return (
                <View style={styles.carouselContainer}>
                    <ActivityIndicator size="small" color="#5f249f" />
                </View>
            );
        }

        // Filter for articles and videos only (too many images, would take up a lot of space)
        const displayItems = featuredItems.filter(item => 
            item.type === 'article' || item.type?.toLowerCase().includes('video')
        );
        
        if (displayItems.length === 0) return null;

        return (
            <View style={styles.carouselContainer}>
                <Text style={styles.carouselTitle}>Featured Articles</Text>
                <FlatList
                    ref={featuredCarouselRef}
                    data={displayItems}
                    renderItem={({ item }) => (
                        <View style={styles.carouselItem}>
                            <FeaturedNewsCard newsItem={item} />
                        </View>
                    )}
                    keyExtractor={(item, index) => item?.id ? `${item.id}-featured-${index}` : `featured-${index}`}
                    horizontal
                    scrollEnabled
                    showsHorizontalScrollIndicator={false}
                    snapToAlignment="start"
                    decelerationRate="fast"
                    snapToInterval={undefined}
                    contentContainerStyle={styles.carouselContent}
                    refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor="#5f249f" />}
                />
            </View>
        );
    }, [featuredItems, featuredLoading]);

    const renderFooter = useCallback(() => {
        if (!loadingMore) return null;
        return (
            <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator size="small" color="#5f249f" />
            </View>
        );
    }, [loadingMore]);

    // if (loading && assetInfo?.length === 0) {
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
            <FlatList
                ref={listRef}
                data={allItems}
                // If renderItem returns no articles in its render, call handleLoadMore

                renderItem={renderItem}
                keyExtractor={(item, index) => item?.id ? `${item.id}-${index}` : `article-${index}`}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                onContentSizeChange={handleContentSizeChange}
                ListFooterComponent={renderFooter}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor="#5f249f" />}
                ListHeaderComponent={
                    <View>
                        <LogoHeader />
                        {renderFeaturedCarousel()}
                        <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 30, marginBottom: 12, paddingHorizontal: 4, color: '#333' }}>Latest Articles</Text>
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
    articleCard: {
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 12,
    },
    articleTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    articleSubtitle: {
        fontSize: 10,
        color: '#666',
        marginBottom: 10,
    },
    error: {
        color: 'red',
        fontSize: 14
    },
    carouselContainer: {
    },
    carouselTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
        paddingHorizontal: 4,
        color: '#333',
    },
    carouselContent: {
        paddingHorizontal: 0,
    },
    carouselItem: {
        width: Dimensions.get('window').width * 0.8,
        marginRight: 12,
        marginLeft: 4,
    },
});