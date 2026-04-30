import { Image, Pressable, Text, View } from "react-native";
import { memo } from 'react';
import { AssetItem, News } from "@/types/types";
import DateAndAuthor from "../DateAndAuthor";
import { Link } from "expo-router";
import { stripHtmlTags } from '@/utils/html';

type NewsListItemProps = {
  newsItem?: AssetItem;
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

// export default function NewsListItem({ newsArticle, newsItem }: NewsListItemProps) {
const NewsListItem = memo(function NewsListItem({newsItem }: NewsListItemProps) {
  // Accept both prop names for compatibility
  // const article = newsArticle || newsItem;
  const article = processAssetItem(newsItem);

  // Safety check
  if (!article || !article.id) {
    console.warn('NewsListItem received invalid article:', article);
    return null;
  }

  return (
    <Link href={`newsArticle/${article.id}`} asChild>
      <Pressable style={{ backgroundColor: 'white', padding: 10, gap: 10, borderRadius: 10, marginBottom: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 2 }}>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flexShrink: 1, gap: 5, flex: article.preview_url ? undefined : 1 }}>
            <Text style={{ fontSize: 17, fontWeight: 'bold', marginRight: 10 }}>{article.title}</Text>
            <DateAndAuthor publishedDate={article.start_time} />
          </View>
          {article.preview_url && <Image source={{ uri: article.preview_url }} style={{ width: 100, aspectRatio: 1, borderRadius: 10, marginTop: 5, marginRight: 5 }} />}
        </View>
        
        {/* 2 lines of description */}
        <Text numberOfLines={2} style={{  marginBottom: 15 }}>{article.summary}</Text>
        
      </Pressable>
    </Link>
  )
});

export default NewsListItem;