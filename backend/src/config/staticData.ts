// Uses axios and cheerio to fetch and parse static pages

import axios from 'axios';
import * as cheerio from 'cheerio';
type StaticPageBlock =
  | { type: 'heading'; text: string }
  | { type: 'text'; text: string }
  | { type: 'image'; url: string };

type StaticPage = {
  id: string;
  slug: string;
  title: string;
  blocks: StaticPageBlock[];
  sourceUrl: string;
};

const STATIC_PAGE_CONFIG = [
  { id: 'about', slug: 'about', fallbackTitle: 'About', url: 'https://www.collinsvilledailynews.com/site/about.html' },
  { id: 'contact', slug: 'contact', fallbackTitle: 'Contact', url: 'https://www.collinsvilledailynews.com/site/contact.html' },
  { id: 'privacy', slug: 'privacy', fallbackTitle: 'Privacy', url: 'https://www.collinsvilledailynews.com/site/privacy.html' },
  { id: 'terms', slug: 'terms', fallbackTitle: 'Terms', url: 'https://www.collinsvilledailynews.com/site/terms.html' },
];

async function fetchSingleStaticPage(id: string, slug: string, fallbackTitle: string, url: string): Promise<StaticPage> {
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);

  const pageTitle = $('header.staticpage-header h1').first().text().trim() || fallbackTitle;
  const blocks: StaticPageBlock[] = [];

  $('#staticpage-content')
    .find('p, div')
    .filter((_, element) => {
      if (element.tagName?.toLowerCase() === 'p') {
        return true;
      }

      return $(element).children('p, div').length === 0;
    })
    .each((_, element) => {
      const paragraph = $(element);
      const imageUrl = paragraph.find('img').first().attr('src')?.trim();

      if (imageUrl) {
        blocks.push({ type: 'image', url: imageUrl });
        return;
      }

      const text = paragraph.text().replace(/\s+/g, ' ').trim();
      if (!text) return;

      const strongText = paragraph.find('strong').first().text().replace(/\s+/g, ' ').trim();
      const isHeading = strongText.length > 0 && strongText === text;

      if (isHeading) {
        blocks.push({ type: 'heading', text });
        return;
      }

      blocks.push({ type: 'text', text });
    });

  return {
    id,
    slug,
    title: pageTitle,
    blocks,
    sourceUrl: url,
  };
}

export default async function fetchAboutContentHtml() {
  const settled = await Promise.allSettled(
    STATIC_PAGE_CONFIG.map((page) => fetchSingleStaticPage(page.id, page.slug, page.fallbackTitle, page.url))
  );

  const pages = settled
    .filter((result): result is PromiseFulfilledResult<StaticPage> => result.status === 'fulfilled')
    .map((result) => result.value);

  return {
    pages,
  };
}