import React, { useState, useRef } from 'react';
import { View, Image, FlatList, Dimensions, StyleSheet, Text, TouchableOpacity, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import Video from 'react-native-video';
import { AssetContent } from '@/types/types';
import { Ionicons } from '@expo/vector-icons';
import { extractYouTubeId } from '@/utils/media';

type ImageCarouselProps = {
  images: AssetContent[];
  compact?: boolean; // If true, images won't take full width
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ImageCarousel({ images, compact = false }: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [playingVideoIndex, setPlayingVideoIndex] = useState<number | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const videoRefs = useRef<{ [key: number]: any }>({});

  if (!images || images.length === 0) {
    return null;
  }

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderImage = ({ item, index }: { item: AssetContent; index: number }) => {
    const mediaUrl = item.preview_image?.url;
    const mediaWidth = item.preview_image?.width;
    const mediaHeight = item.preview_image?.height;
    const mediaAspectRatio = mediaWidth && mediaHeight ? mediaWidth / mediaHeight : undefined;
    
    // Detect if this is a video asset
    const isVideo = item.type?.toLowerCase().includes('video');
    
    // Check for YouTube video (has remote_video_id)
    const remoteVideoId = (item as any)?.remote_video_id;
    const isYouTube = isVideo && remoteVideoId && typeof remoteVideoId === 'string' && remoteVideoId.includes('youtube');
    const youtubeId = isYouTube ? extractYouTubeId(remoteVideoId) : null;
    
    // For videos, try to use the item URL if preview_image doesn't exist
    const videoUrl = isVideo ? (item.url || mediaUrl) : mediaUrl;
    
    if (!videoUrl && !youtubeId) {
      return null;
    }

    return (
      <View style={styles.fullscreenImageContainer}>
        <View style={styles.imageWrapper}>
          {isVideo ? (
            <View style={[
              styles.fullscreenImage,
              mediaAspectRatio
                ? { aspectRatio: mediaAspectRatio, height: undefined, maxHeight: screenHeight * 0.7 }
                : { height: screenHeight * 0.7 },
            ]}>
              {isYouTube && youtubeId ? (
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
              ) : (
                <Video
                  ref={(ref: any) => { videoRefs.current[index] = ref; }}
                  source={{ uri: videoUrl }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="contain"
                  controls={true}
                  paused={playingVideoIndex !== index}
                  onError={() => console.error('Video playback error')}
                />
              )}
            </View>
          ) : (
            <Image 
              source={{ uri: videoUrl }} 
              style={[
                styles.fullscreenImage,
                mediaAspectRatio
                  ? { aspectRatio: mediaAspectRatio, height: undefined, maxHeight: screenHeight * 0.7 }
                  : { height: screenHeight * 0.7 },
              ]}
              resizeMode="contain"
            />
          )}
        </View>
        
        {(item.summary || item.byline || item.title) && (
          <View style={styles.fullscreenCaptionContainer}>
            {(item.summary || item.title) && (
              <Text style={styles.fullscreenCaption}>{item.summary || item.title}</Text>
            )}
            {item.byline && (
              <Text style={styles.fullscreenCredit}>{item.byline}</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.fullscreenContainer}>
      <StatusBar hidden />
      
      <FlatList
        ref={flatListRef}
        data={images}
        renderItem={renderImage}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        decelerationRate="fast"
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ flexGrow: 0 }}
      />
      
      {/* Pagination Dots */}
      {images.length > 1 && (
        <View style={styles.fullscreenPagination}>
          {images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.fullscreenPaginationDot,
                index === activeIndex && styles.fullscreenPaginationDotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fullscreenContainer: {
    flexDirection: 'column',
    alignSelf: 'stretch',
    backgroundColor: '#ffffff',
    paddingVertical: 20,
  },
  fullscreenImageContainer: {
    width: screenWidth,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
    position: 'relative',
  },
  fullscreenImage: {
    width: screenWidth,
    resizeMode: 'contain',
  },
  fullscreenCaptionContainer: {
    width: screenWidth,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
  },
  fullscreenCaption: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#000000',
    marginTop: 8,
  },
  fullscreenCredit: {
    fontSize: 12,
    color: '#787474',
    marginTop: 4,
  },
  fullscreenPagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  fullscreenPaginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#aca1a1',
    marginHorizontal: 4,
  },
  fullscreenPaginationDotActive: {
    backgroundColor: '#5f249f',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
