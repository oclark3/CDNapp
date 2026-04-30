// Used in article controller

import { fetchFromCDN } from './cdn.service';
import { ENV_VARS } from '../config/envVars';
import { buildCategoryTree, flattenCategoryTree, FlatCategoryItem } from '../utils/categoryTree';

const ASSET_CONTENT_ENDPOINT = '/editorial/get/';
const ASSET_SEARCH_ENDPOINT = '/editorial/search/';
const CATEGORIES_ENDPOINT = '/editorial/categories/';
const CDN_BASE_URL = ENV_VARS.WEB_SERVICE_BASE;

// Get assets based on parameters
export async function searchAssets(
    query: string,
    offset: string,
    limit: string,
    category: string,
    flag: string,
    authtoken?: string
) {
    const url = CDN_BASE_URL + ASSET_SEARCH_ENDPOINT;
    const params: Record<string, any> = {};

    if (query) params.q = query.toLowerCase();
    if (category) params.c = category;
    if (flag) params.fl = flag;
    params.o = offset;
    params.l = limit;
    if (authtoken) params.authtoken = authtoken;

    const data = await fetchFromCDN(url, { params });
    return data;
}

// Get full content for a specific asset
export async function fetchAssetContent(id: string, authtoken?: string) {
    const url = `${CDN_BASE_URL}${ASSET_CONTENT_ENDPOINT}`;
    const params: Record<string, any> = { id };
    if (authtoken) params.authtoken = authtoken;
    return await fetchFromCDN(url, { params });
}

// Get category list then build hierarchical tree for frontend dropdown menu and return flat list with parent metadata
export async function fetchCategories(): Promise<FlatCategoryItem[]> {
    const url = CDN_BASE_URL + CATEGORIES_ENDPOINT;
    const data = await fetchFromCDN(url);

    const categoriesArray = Array.isArray(data) ? data : [];
    const categoryTree = buildCategoryTree(categoriesArray);
    return flattenCategoryTree(categoryTree);
}
