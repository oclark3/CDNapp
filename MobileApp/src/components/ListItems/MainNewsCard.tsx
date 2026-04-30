import { News, AssetContent, AssetItem } from "@/types/types";
import { Image, Text, View, Pressable } from "react-native";
import { memo } from 'react';
import DateAndAuthor from "@/components/DateAndAuthor";
import { Link } from "expo-router";
import { stripHtmlTags } from '@/utils/html';

type MainNewsCardProps = {
  newsItem?: AssetItem;
  onVideoClick?: (parentId?: string) => void;
}

/**
 * Clean and decode article content fields that may contain HTML
 */
function processAssetItem(asset: AssetItem | undefined): AssetItem | undefined {
  if (!asset) return asset;
  const processed = { ...asset };

  // Process summary - strip HTML to show clean preview
  if (processed.summary && typeof processed.summary === 'string') {
    processed.summary = stripHtmlTags(processed.summary);
  }
  
  return processed;
}

const MainNewsCard = memo(function MainNewsCard({ newsItem, onVideoClick }: MainNewsCardProps) {
  const article = processAssetItem(newsItem);
  const isVideo = article?.type?.toLowerCase().includes('video');
  
  // For full AssetContent with relationships (from article detail page)
  const parentId = isVideo && 'relationships' in (article || {}) 
    ? (article as any)?.relationships?.parent?.[0]?.id 
    : undefined;

  if (!article || !article.id) {
    console.warn('MainNewsCard received invalid article:', article);
    return null;
  }

  const cardContent = (
    <Pressable 
      style={{ backgroundColor: 'white', borderRadius: 10, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 5, elevation: 2 }}
      onPress={() => {
        if (isVideo && onVideoClick) {
          onVideoClick(parentId);
        }
      }}
    >
      {article.preview_url && <Image source={{ uri: article.preview_url }} style={{width: '100%', aspectRatio: 4/3, borderTopLeftRadius: 10, borderTopRightRadius: 10,}} />}
      <View style={{ padding: 10 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>{article.title}</Text>
        <DateAndAuthor publishedDate={article.start_time}/>
        {/* 2 lines of description */}
        <Text numberOfLines={3} style={{  marginVertical: 15 }}>{article.summary}</Text>
        {isVideo && parentId && (
          <Text style={{ color: '#5f249f', fontSize: 12, marginTop: 8 }}>View full article →</Text>
        )}
      </View>
    </Pressable>
  );

  // For featured items (AssetItem) - videos navigate to themselves, articles navigate to article detail
  if (isVideo && !parentId) {
    // Featured video without parent - just show the card (pressing does nothing, but card shows it's clickable)
    return (
      <Link href={`newsArticle/${article.id}`} asChild>
        {cardContent}
      </Link>
    );
  }

  // If not a video, wrap in Link for navigation
  if (!isVideo) {
    return (
      <Link href={`newsArticle/${article.id}`} asChild>
        {cardContent}
      </Link>
    );
  }

  // If it's a video with parent, wrap in Link to parent article
  if (parentId) {
    return (
      <Link href={`newsArticle/${parentId}`} asChild>
        {cardContent}
      </Link>
    );
  }

  // Fallback - just return the pressable
  return cardContent;
});

export default MainNewsCard;