import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { buildApiUrl, API_BASE_URL } from '@/services/apiConfig';
import { AllAssets, AssetContent, AssetItem, CategoryPaths, CollectionAsset } from '@/types/types';
import { decodeHtmlEntities, stripHtmlTags } from '@/utils/html';

type UseGetAssetsOptions = {
    searchQuery?: string;
    isSearchMode?: boolean;
    category?: string;
    flag?: string;
    enabled?: boolean;
    accessToken?: string | null;
};

const EXCLUDED_CATEGORIES = new Set([
    'anniversaries',
    'arts_and_entertainment',
    'calendar',
    'church',
    'perspectives',
    'cartoon_corner',
    'columnists',
    'middle-school',
    'entrepreneur',
    'online_features',
    'multimedia',
    'births',
    'local-school-achievements',
    'engagements',
    'senior_superstar',
    'weddings',
    'covid',
    'marketplace',
    'newsletter',
    'bridal',
    'business_and_careers',
    'community_cares',
    'espanol',
    'family_living',
    'fashion_beauty_fitness',
    'food_recipes_entertaining',
    'gift_ideas',
    'green_living',
    'home_decorating',
    'home_improvement',
    'hot_topics',
    'how_to',
    'kitchen_bed_bath',
    'lawn_and_garden',
    'money_and_finance',
    'pets',
    'real_estate',
    'seasonal',
    'senior_living',
    'online_features/sports',
    'tech_talk_and_innovation',
    'travel',
    'cartoons',
    'press_club',
    'site',
    'datos-demographicos',
    'radio',
    'church_easter_promotion',
    'test',
    'tributes',
    'sponsored',
]);

const shouldExcludeCategory = (path: string): boolean => {
    const parts = path.split('/');
    for (const part of parts) {
        if (EXCLUDED_CATEGORIES.has(part)) {
            return true;
        }
    }
    return false;
};

function processArticleContent(asset: AssetContent): AssetContent {
    if (!asset) return asset;

    const processed = { ...asset };

    if (processed.byline && typeof processed.byline === 'string') {
        processed.byline = stripHtmlTags(processed.byline);
    }

    if (processed.summary && typeof processed.summary === 'string') {
        processed.summary = stripHtmlTags(processed.summary);
    }

    if (Array.isArray(processed.content)) {
        processed.content = processed.content.map(item => {
            if (typeof item === 'string') {
                return decodeHtmlEntities(item);
            }
            return item;
        });
    }

    return processed;
}

export const useGetAssets = (options?: UseGetAssetsOptions | string) => {
    const { searchQuery, isSearchMode, category, flag } = typeof options === 'string'
        ? { searchQuery: options, isSearchMode: true, category: undefined, flag: undefined }
        : { searchQuery: options?.searchQuery || '', isSearchMode: options?.isSearchMode ?? true, category: options?.category, flag: options?.flag };

    const enabled = typeof options === 'string' ? true : (options?.enabled ?? true);
    const accessToken = typeof options === 'string' ? null : options?.accessToken;

    const [allItems, setAllItems] = useState<AssetItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const initializedRef = useRef(false);
    const previousQueryRef = useRef<string>('');
    const previousCategoryRef = useRef<string | undefined>(undefined);
    const previousFlagRef = useRef<string | undefined>(undefined);
    const abortControllerRef = useRef<AbortController | null>(null);
    const requestIdRef = useRef(0);

    const fetchAssets = useCallback(async (query: string = '', offset: number = 0, flagOverride: string = '') => {
        if (!enabled) return;
        const requestId = ++requestIdRef.current;
        try {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            const abortController = new AbortController();
            abortControllerRef.current = abortController;

            setLoading(offset === 0);
            const actualQuery = isSearchMode ? query : '';

            let url = `${API_BASE_URL}/api/v1/assets/search/?o=${offset}&l=100`;
            const flagToUse = flagOverride || flag;
            if (flagToUse) {
                url += `&fl=${encodeURIComponent(flagToUse)}`;
            }
            if (actualQuery) {
                url += `&q=${encodeURIComponent(actualQuery)}`;
            }
            if (category) {
                url += `&c=${encodeURIComponent(category)}*`;
            }

            const res = await axios.get(url, {
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
                signal: abortController.signal,
            });
            const data: AllAssets = res.data;

            if (requestId !== requestIdRef.current) return;

            if (offset === 0) {
                setAllItems(data.items);
            } else {
                setAllItems(prev => [...prev, ...data.items]);
            }

            setHasMore(data.items.length === 100);
            setError(null);
        } catch (err: any) {
            if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
                setError(err?.message || 'Failed to fetch assets');
            }
        } finally {
            if (requestId === requestIdRef.current) {
                setLoading(false);
            }
        }
    }, [enabled, isSearchMode, category, flag, accessToken]);

    useEffect(() => {
        if (!enabled) {
            initializedRef.current = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
            return;
        }

        const nextQuery = searchQuery || '';
        const isFirstEnabledRun = !initializedRef.current;
        const hasQueryChanged = nextQuery !== previousQueryRef.current;
        const hasCategoryChanged = category !== previousCategoryRef.current;
        const hasFlagChanged = flag !== previousFlagRef.current;

        if (isFirstEnabledRun || hasQueryChanged || hasCategoryChanged || hasFlagChanged) {
            initializedRef.current = true;
            previousQueryRef.current = nextQuery;
            previousCategoryRef.current = category;
            previousFlagRef.current = flag;
            fetchAssets(nextQuery, 0, flag || '');
        }

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
        };
    }, [enabled, searchQuery, category, flag, fetchAssets]);

    const cancelFetch = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    }, []);

    return { allItems, loading, error, hasMore, fetchAssets, cancelFetch };
};

export const useGetArticleContent = (id: string | string[] | undefined, accessToken: string | null) => {
    const [article, setArticle] = useState<AssetContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [featuredImage, setFeaturedImage] = useState<AssetContent | null>(null);
    const [collectionImages, setCollectionImages] = useState<AssetContent[]>([]);
    const [additionalImages, setAdditionalImages] = useState<AssetContent[]>([]);

    useEffect(() => {
        const abortController = new AbortController();
        let isActive = true;

        const fetchAssetById = async (assetId: string, headers: Record<string, string>): Promise<AssetContent | null> => {
            try {
                const assetUrl = buildApiUrl(`/api/v1/assets/get/?id=${encodeURIComponent(assetId)}`);
                const response = await axios.get(assetUrl, {
                    headers,
                    signal: abortController.signal,
                });
                return response.data as AssetContent;
            } catch (err: any) {
                if (err.name === 'AbortError' || err.name === 'CanceledError') {
                    return null;
                }
                return null;
            }
        };

        const fetchRelationshipAssets = async (children: { id: string; asset_type: string }[], headers: Record<string, string>) => {
            try {
                const mediaAssetTypes = ['image', 'video', 'photo'];
                const mediaChildren = children.filter(child => mediaAssetTypes.includes(child.asset_type));
                const collectionChildren = children.filter(child => child.asset_type === 'collection');

                const featuredPromise = mediaChildren.length > 0
                    ? fetchAssetById(mediaChildren[0].id, headers)
                    : Promise.resolve(null);

                const additionalPromise = mediaChildren.length > 1
                    ? Promise.all(mediaChildren.slice(1).map(child => fetchAssetById(child.id, headers)))
                    : Promise.resolve([] as Array<AssetContent | null>);

                const collectionPromise = collectionChildren.length > 0
                    ? fetchAssetById(collectionChildren[0].id, headers)
                    : Promise.resolve(null);

                const [featuredAsset, additionalAssetsRaw, collectionAsset] = await Promise.all([
                    featuredPromise,
                    additionalPromise,
                    collectionPromise,
                ]);

                if (!isActive) return;

                setFeaturedImage(featuredAsset);
                setAdditionalImages(additionalAssetsRaw.filter(Boolean) as AssetContent[]);

                if (collectionAsset) {
                    const collectionData = collectionAsset as CollectionAsset;
                    if (collectionData.relationships?.child) {
                        const collectionMediaChildren = collectionData.relationships.child
                            .filter(child => mediaAssetTypes.includes(child.asset_type));

                        const collectionAssetsRaw = await Promise.all(
                            collectionMediaChildren.map(child => fetchAssetById(child.id, headers))
                        );

                        if (isActive) {
                            setCollectionImages(collectionAssetsRaw.filter(Boolean) as AssetContent[]);
                        }
                    }
                }
            } catch (err) {
                if ((err as any)?.name === 'AbortError') {
                    return;
                }
                console.error('Error fetching relationship assets');
            }
        };

        const getArticleContent = async () => {
            if (!id || typeof id !== 'string') {
                setError('Invalid article ID');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                setFeaturedImage(null);
                setCollectionImages([]);
                setAdditionalImages([]);

                const detailUrl = buildApiUrl(`/api/v1/assets/get/?id=${encodeURIComponent(id)}`);
                const headers: Record<string, string> = {};
                if (accessToken) {
                    headers['Authorization'] = `Bearer ${accessToken}`;
                }

                const response = await axios.get(detailUrl, {
                    headers,
                    signal: abortController.signal,
                });
                let data = response.data as AssetContent;
                data = processArticleContent(data);
                if (!isActive) return;
                setArticle(data);

                if (data.relationships?.child && data.relationships.child.length > 0) {
                    await fetchRelationshipAssets(data.relationships.child, headers);
                }
            } catch (err) {
                if ((err as any)?.name === 'AbortError') {
                    return;
                }
                console.error('Error fetching article');
                if (isActive) {
                    setError(err instanceof Error ? err.message : 'Failed to load article');
                }
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        getArticleContent();

        return () => {
            isActive = false;
            abortController.abort();
        };
    }, [id, accessToken]);

    return { article, loading, error, featuredImage, collectionImages, additionalImages };
};

export const useGetCategories = (enabled: boolean = true) => {
    const [categories, setCategories] = useState<CategoryPaths>([]);

    useEffect(() => {
        if (!enabled) {
            setCategories([]);
            return;
        }

        const controller = new AbortController();
        let isActive = true;

        const getCategories = async () => {
            try {
                const res = await axios.get(buildApiUrl('/api/v1/assets/categories/'), {
                    signal: controller.signal,
                });
                if (!isActive) return;

                const data = Array.isArray(res.data) ? res.data : [];
                const paths = data
                    .map((item: { path?: string }) => item?.path)
                    .filter((path: string | undefined): path is string => typeof path === 'string')
                    .filter((path: string) => !shouldExcludeCategory(path));
                setCategories(paths);
            } catch (error: any) {
                if (error?.name === 'AbortError' || error?.name === 'CanceledError') return;
                console.error('Failed to fetch categories');
                if (isActive) {
                    setCategories([]);
                }
            }
        };

        getCategories();

        return () => {
            isActive = false;
            controller.abort();
        };
    }, [enabled]);

    return { categories };
};

export default useGetAssets;