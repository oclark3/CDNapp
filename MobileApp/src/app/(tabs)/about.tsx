import { useEffect, useRef, useState, useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { buildApiUrl } from '@/services/apiConfig';
import { useScrollToTop } from "@react-navigation/native"
import { useRefreshOnTabPress } from '@/hooks/useRefreshOnTabPress';
import LogoHeader from '@/components/LogoHeader';
import StaticPageItem from '@/components/ListItems/StaticPageItem';
import { Link } from 'expo-router';
import MainFooter from '@/components/mainFooter';
import React from 'react';

type AboutBlock =
  | { type: 'heading'; text: string }
  | { type: 'text'; text: string }
  | { type: 'image'; url: string };

type AboutPayload = {
  id: string;
  slug: string;
  title: string;
  blocks: AboutBlock[];
};

type AboutApiResponse = {
  pages?: AboutPayload[];
};

export default function AboutScreen() {
  const [pages, setPages] = useState<AboutPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listRef = useRef<FlatList>(null);

  useScrollToTop(listRef);

  const loadContent = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/v1/assets/about/'));
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as AboutApiResponse;
      setPages(Array.isArray(data.pages) ? data.pages : []);
      setError(null);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load About page');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    loadContent();
  }, []);

  useRefreshOnTabPress(() => {
    handleRefresh();
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  });

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#5f249f" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: '#b00020', textAlign: 'center' }}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} edges={['top']}>
      <LogoHeader />

      {/* Content */}
      <FlatList
        data={pages}
        ref={listRef}
        keyExtractor={(item, index) => item.id || item.slug || `${item.title}-${index}`}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor="#5f249f" />}
        renderItem={({ item }) => {
          return (
            <Link href={`staticPages/${item.slug || item.id}`} asChild>
              <Pressable>
                <StaticPageItem title={item.title} />
              </Pressable>
            </Link>
          );
        }}
        ListFooterComponent={
              <MainFooter />
          }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={{ fontSize: 16, color: '#999' }}>No static pages found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}