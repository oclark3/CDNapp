// To handle HTML content in strings, including decoding entities, stripping tags, and parsing links
// Used in article content

export type HtmlContentPart = {
  type: 'text' | 'link';
  content: string;
  url?: string;
};

export function decodeHtmlEntities(text: string): string {
  if (!text || typeof text !== 'string') return text;

  return text
    .replace(/\\u([0-9A-Fa-f]{4})/g, (_match, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\n/g, '\n')
    .replace(/\\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

export function stripHtmlTags(html: string): string {
  if (!html || typeof html !== 'string') return html;

  const decoded = decodeHtmlEntities(html);
  return decoded
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/{{[^}]*}}/g, '')
    .trim();
}

export function parseHtmlContent(html: string): HtmlContentPart[] {
  if (!html || typeof html !== 'string') return [];

  const decoded = decodeHtmlEntities(html);
  const parts: HtmlContentPart[] = [];
  const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(decoded)) !== null) {
    const url = match[1];
    const linkText = stripHtmlTags(match[2]);
    const startIndex = match.index;

    if (startIndex > lastIndex) {
      const textBefore = decoded.substring(lastIndex, startIndex);
      const cleaned = stripHtmlTags(textBefore);
      if (cleaned.trim()) {
        parts.push({ type: 'text', content: cleaned });
      }
    }

    if (linkText.trim()) {
      parts.push({ type: 'link', content: linkText, url });
    }

    lastIndex = linkRegex.lastIndex;
  }

  if (lastIndex < decoded.length) {
    const textAfter = decoded.substring(lastIndex);
    const cleaned = stripHtmlTags(textAfter);
    if (cleaned.trim()) {
      parts.push({ type: 'text', content: cleaned });
    }
  }

  if (parts.length === 0) {
    const cleaned = stripHtmlTags(decoded);
    if (cleaned.trim()) {
      parts.push({ type: 'text', content: cleaned });
    }
  }

  return parts;
}