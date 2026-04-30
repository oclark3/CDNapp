import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { buildApiUrl } from '@/services/apiConfig';

type StaticPageBlock =
  | { type: 'heading'; text: string }
  | { type: 'text'; text: string }
  | { type: 'image'; url: string };

type StaticPage = {
  id: string;
  slug: string;
  title: string;
  blocks: StaticPageBlock[];
};

type StaticPagesResponse = {
  pages?: StaticPage[];
};

export default function StaticPageDetail() {
  const { id } = useLocalSearchParams();
  const [page, setPage] = useState<StaticPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadPage = async () => {
      if (!id || typeof id !== 'string') {
        setError('Invalid static page ID');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(buildApiUrl('/api/v1/assets/about/'));
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = (await response.json()) as StaticPagesResponse;
        const pages = Array.isArray(data.pages) ? data.pages : [];
        const selectedPage = pages.find((item) => item.slug === id || item.id === id) || null;

        if (mounted) {
          setPage(selectedPage);
          if (!selectedPage) {
            setError('Static page not found');
          }
        }
      } catch (fetchError) {
        if (mounted) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load static page');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadPage();

    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#5f249f" />
      </View>
    );
  }

  if (error || !page) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: '#b00020', textAlign: 'center' }}>{error || 'Static page not found'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: 'white' }}>
      <Stack.Screen options={{ headerTitle: page.title }} />

      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: '#111', marginBottom: 16 }}>
          {page.title}
        </Text>

        {page.blocks.map((block, index) => {
          if (block.type === 'heading') {
            return (
              <Text key={`${block.type}-${index}`} style={{ fontSize: 20, fontWeight: '700', color: '#000000', marginTop: 12, marginBottom: 8 }}>
                {block.text}
              </Text>
            );
          }

          if (block.type === 'image') {
            return (
              <View key={`${block.type}-${index}`}>
                <Image
                  source={{ uri: block.url }}
                  style={{ width: '70%', aspectRatio: 5 / 6, resizeMode: 'cover', borderRadius: 10, marginVertical: 10 }}
                />
                <View style={{ height: 1, backgroundColor: '#000000', marginVertical: 10 }} />
              </View>
            );
          }

          return (
            <Text key={`${block.type}-${index}`} style={{ fontSize: 16, lineHeight: 24, color: '#000000', marginBottom: 8 }}>
              {block.text}
            </Text>
          );
        })}
      </View>
    </ScrollView>
  );
}
