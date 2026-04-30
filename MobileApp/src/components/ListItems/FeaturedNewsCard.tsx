import { AssetItem } from "@/types/types";
import { Image, Text, View, Pressable, StyleSheet } from "react-native";
import { memo } from 'react';
import { Link } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { stripHtmlTags } from '@/utils/html';

type FeaturedNewsCardProps = {
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

const FeaturedNewsCard = memo(function FeaturedNewsCard({ newsItem, onVideoClick }: FeaturedNewsCardProps) {
  const article = processAssetItem(newsItem);
  const isVideo = article?.type?.toLowerCase().includes('video');
  
  // For full AssetContent with relationships (from article detail page)
  const parentId = isVideo && 'relationships' in (article || {}) 
    ? (article as any)?.relationships?.parent?.[0]?.id 
    : undefined;

  if (!article || !article.id) {
    console.warn('FeaturedNewsCard received invalid article:', article);
    return null;
  }

  const cardContent = (
    <Pressable 
      style={styles.card}
      onPress={() => {
        if (isVideo && onVideoClick) {
          onVideoClick(parentId);
        }
      }}
    >
      <View style={styles.imageContainer}>
        {article.preview_url && (
          <Image 
            source={{ uri: article.preview_url }} 
            style={styles.image} 
          />
        )}
        
        {/* Gradient overlay that fades towards the top */}
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}
        />
        
        {/* Text overlay */}
        <View style={styles.textOverlay}>
          <Text style={styles.title} numberOfLines={2}>
            {article.title}
          </Text>
          <Text style={styles.summary} numberOfLines={2}>
            {article.summary}
          </Text>
          {isVideo && parentId && (
            <Text style={styles.videoLink}>View full article →</Text>
          )}
        </View>
      </View>
    </Pressable>
  );

  // For featured items (AssetItem) - videos navigate to themselves, articles navigate to article detail
  if (isVideo && !parentId) {
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 4/3,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  textOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    justifyContent: 'flex-end',
    height: '50%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  summary: {
    fontSize: 14,
    color: 'white',
    opacity: 0.95,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  videoLink: {
    color: '#fff',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
});

export default FeaturedNewsCard;
