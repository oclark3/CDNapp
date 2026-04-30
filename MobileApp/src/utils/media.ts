// To extract YouTube video ID from various URL formats
// Used in article content

export const extractYouTubeId = (url: string): string | null => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const youtubeIdPattern = /^[A-Za-z0-9_-]{11}$/;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1] && youtubeIdPattern.test(match[1])) {
      return match[1];
    }
  }

  return null;
};