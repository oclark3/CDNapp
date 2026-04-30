// Data-related Types
export type Author = {
  id: string;
  name: string;
};

export type Publisher = {
  id: string;
  name: string;
};

export type News = {
  id: string;
  title: string;
  body: string;
  image: string;
  created_at: string;
  author: Author;
  publisher: Publisher;
  category: string;
  isTrending?: boolean;
};

// Categories type is an array of strings that starts with category then subcategories are after the /
export type CategoryPaths = string[];

// From endpoint editorial/search/
// This is in AllAssets, use this to get the ID
// Then can use the ID to call editorial/get/?id=
export type AssetItem = {
  id: string;
  title: string;
  type: string;
  url: string;
  category: string | null;
  start_time: string;
  summary: string;
  published: boolean;
  priority: number;
  workflow_name: string;
  workflow_process_name: string;
  subhead: string;
  update_time: string;
  preview_url: string;
};

// From endpoint editorial/search/
// Get this to get the asset ID from the items array
export type AllAssets = {
  total: number;
  offset: number;
  limit: number;
  items: AssetItem[];
};

// From endpoint editorial/get/?id=
export type AssetContent = {
  id: string;
  external_id: string | null;
  slug: string | null;
  revision: number;
  title: string;
  byline: string;
  type: "article" | string;
  url: string;
  canonical_url: string;
  start_time: string;
  // Content is an array of HTML strings
  content: string[];
  links: unknown[];
  flags: string[];
  published: boolean;
  priority: number;
  access: string;
  presentation: unknown | null;
  summary: string;
  source: string | null;
  custom: unknown[];
  last_updated: string;
  site_tags: string[];
  seo_title: string;
  seo_description: string;
  origin_domain: string | null;
  related_content: unknown[];
  article_type: string | null;
  publications: unknown[];
  settings: {
    allow_comments: boolean;
  };
  location: {
    address: string | null;
    municipality: string | null;
    region: string;
    postal_code: string | null;
    latitude: string;
    longitude: string;
  };
  workflow_name: string | null;
  workflow_process_name: string | null;
  subhead: string | null;
  update_time: string;
  tags: {
    site: string[];
    section: string[];
    keyword: string[];
    geo: string[];
  };
  relationships: {
    child: {
      id: string;
      asset_type: string;
      hide_details?: boolean;
      hide_headlines?: boolean;
    }[];
    parent: unknown[];
    sibling: unknown[];
  };
  authors: unknown[];
  preview_image: {
    url: string;
    width: number;
    height: number;
  } | null;
  subheadline: string | null;
  hammer: string | null;
  kicker: string | null;
  tagline: string;
};

// // Image asset from relationships
// export type ImageAsset = {
//   id: string;
//   type: "image";
//   url: string;
//   title?: string;
//   caption?: string;
//   credit?: string;
//   width?: number;
//   height?: number;
//   relationships?: {
//     child: unknown[];
//     parent: unknown[];
//     sibling: unknown[];
//   };
// };

// Collection asset containing multiple images
export type CollectionAsset = {
  id: string;
  type: "collection";
  title?: string;
  relationships: {
    child: {
      id: string;
      asset_type: string;
    }[];
    parent: unknown[];
    sibling: unknown[];
  };
};


// Auth-related Types
export type User = {
  id: string;
  name: string;
  email: string;
  subscribed: boolean;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken?: string;
  user: User;
};

export type AuthError = {
  message: string;
  code: string;
};