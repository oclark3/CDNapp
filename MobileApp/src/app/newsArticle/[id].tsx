import { Link, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Text, StyleSheet, ScrollView, View, Image, ActivityIndicator, Linking, Pressable, Dimensions } from "react-native";
import { format } from 'date-fns';
import { AssetContent, CollectionAsset } from "@/types/types";
import { useSession } from "@/hooks/useSession";
import ImageCarousel from "@/components/ImageCarousel";
import MainFooter from "@/components/mainFooter";
import { useGetArticleContent } from "@/hooks/useAssets";
import { WebView } from 'react-native-webview';
import { extractYouTubeId } from '@/utils/media';
import { parseHtmlContent } from '@/utils/html';

const { width: screenWidth } = Dimensions.get('window');

const SMALL_WORDS = new Set(['of', 'the', 'and']);
const formatCategoryName = (raw: string) => {
  const parts = raw.split('/');
  const lastPart = parts[parts.length - 1];
  
  // Special case: election_2024 should display as "Election"
  if (lastPart === 'election_2024') {
    return 'Election';
  }
  if (lastPart === 'general') {
    return 'National & World';
  }
  
  const cleaned = (lastPart || '').replace(/_/g, ' ');
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

const getArticleCategory = (tags: AssetContent['tags'] | undefined): string | null => {
  const sections = (tags?.section ?? []).filter((s): s is string => typeof s === 'string' && s.length > 0);
  if (sections.length === 0) return null;

  const sectionSet = new Set(sections);
  const isSubcategoryOfExisting = (path: string): boolean => {
    const parts = path.split('/');
    if (parts.length <= 1) return false;
    let current = '';
    for (let i = 0; i < parts.length - 1; i++) {
      current = current ? `${current}/${parts[i]}` : parts[i];
      if (sectionSet.has(current)) return true;
    }
    return false;
  };

  const displayCategories = sections
    .filter(path => !isSubcategoryOfExisting(path))
    .map(formatCategoryName)
    .filter(Boolean);

  if (displayCategories.length === 0) return null;

  const unique = Array.from(new Set(displayCategories));
  return unique.join('; ');
};


export default function DetailedArticle() {
  const { id } = useLocalSearchParams();
  const { accessToken } = useSession();
  const router = useRouter();
  
  const { article, loading, error, featuredImage, collectionImages, additionalImages } = useGetArticleContent(id, accessToken);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !article) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 16, color: 'red', textAlign: 'center' }}>
          {error || 'Article not found'}
        </Text>
      </View>
    );
  }

  const articleCategory = getArticleCategory(article.tags);

  return (
    <ScrollView style={{ backgroundColor: 'white' }}>
      <Stack.Screen options={{ headerTitle: article.title }} />
      
      {/* Featured image - always show article preview_image */}
      {article.preview_image?.url && (
        <Image 
          source={{ uri: article.preview_image.url }} 
          style={{ width: '100%', aspectRatio: 1/1 }} 
        />
      )}

      <View style={{ padding: 20 }}>
        {/* Title */}
        <View style={{ gap: 10, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold' }}>{article.title}</Text>

          {articleCategory && (
            <Text style={{ color: 'grey', fontSize: 13 }}>{articleCategory}</Text>
          )}
          
          {/* Byline and date */}
          <Text style={{ fontWeight: '300', color: 'grey', fontSize: 13 }}>
            {article.byline && `by ${article.byline} • `}
            {format(new Date(article.start_time), 'MMM dd, yyyy')}
          </Text>
        </View>

        {/* Summary/Description */}
        {article.summary && (
          <Text style={{ fontSize: 16, color: '#555', marginTop: 15, marginBottom: 15, fontStyle: 'italic' }}>
            {article.summary}
          </Text>
        )}
      </View>
        
        {/* Image Collection Carousel - displayed below summary */}
        {collectionImages.length > 0 && (
          <ImageCarousel images={collectionImages} />
        )}
      
      {/* Featured media (images/videos from relationships) - displayed as carousel */}
      {/* {featuredImage && (
        <ImageCarousel images={[featuredImage]} />
      )} */}
      <View style={{ padding: 20 }}>
        {/* Article content - HTML strings with clickable links */}
        {Array.isArray(article.content) && article.content.length > 0 && (
          <View style={{ marginTop: 20, gap: 12 }}>
            {article.content.map((contentItem, index) => {
              const parts = parseHtmlContent(typeof contentItem === 'string' ? contentItem : '');
              
              return (
                <Text key={index} style={{ fontSize: 15, lineHeight: 24, color: '#333' }}>
                  {parts.map((part, partIndex) => 
                    part.type === 'link' ? (
                      <Text key={partIndex} style={{ color: '#5f249f', textDecorationLine: 'underline' }} onPress={() => part.url && Linking.openURL(part.url)}>
                        {part.content}
                      </Text>
                    ) : (
                      <Text key={partIndex}>{part.content}</Text>
                    )
                  )}
                </Text>
              );
            })}
          </View>
        )}

        
      </View>
      {/* Additional Images Carousel - displayed after content */}
        {additionalImages.length > 0 && (
          <View>
            <ImageCarousel images={additionalImages} compact={true} />
          </View>
        )}
        {/* Embedded video if it's a video and has remote_video_id */}
      {article.type?.toLowerCase().includes('video') && (article as any).remote_video_id && (() => {
        const youtubeId = extractYouTubeId((article as any).remote_video_id);
        return youtubeId ? (
          <View style={{ width: '100%', aspectRatio: 16/9, backgroundColor: '#000' }}>
            <WebView
              source={{
                html: `
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <meta charset="utf-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
                      <style>
                        html, body { margin: 0; padding: 0; width: 100%; height: 100%; background-color: #000; }
                        iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
                      </style>
                    </head>
                    <body>
                      <iframe 
                        src="https://www.youtube.com/embed/${encodeURIComponent(youtubeId)}?modestbranding=1&rel=0&controls=1"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen
                      ></iframe>
                    </body>
                  </html>
                `,
              }}
              style={{ flex: 1 }}
              scalesPageToFit={true}
              scrollEnabled={false}
              javaScriptEnabled={true}
            />
          </View>
        ) : null;
      })()}

      {/* Featured media (images/videos from relationships) - displayed as carousel */}
      {/* only show if not in collectionImages or additionalImages */}

      {featuredImage && 
        !collectionImages.some(img => img.id === featuredImage.id) && 
        !additionalImages.some(img => img.id === featuredImage.id) && (
        <ImageCarousel images={[featuredImage]} />
      )}
      <MainFooter />

      
    </ScrollView>
  );
}