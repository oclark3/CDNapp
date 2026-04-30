// Parses req.query, calls service, sends res.json (used in route)

import { Request, Response } from 'express';
import { searchAssets, fetchAssetContent, fetchCategories } from '../services/article.service';
import fetchAboutContentHtml from '../config/staticData';

export async function getAllAssets(req: Request, res: Response) {
    try {
        const query = req.query.q as string || '';
        const offset = req.query.o as string || '0';
        const limit = req.query.l as string || '100';
        const category = req.query.c as string || '';
        const flag = req.query.fl as string || '';

        const authHeader = typeof req.headers.authorization === 'string' ? req.headers.authorization.split(' ')[1] : undefined;
        const data = await searchAssets(query, offset, limit, category, flag, authHeader);
        res.json(data);
    } catch (error) {
        console.error('Failed to fetch articles:', error);
        res.status(500).json({ error: 'Failed to fetch articles from CDN' });
    }
}

export async function getAssetContent(req: Request, res: Response) {
    const { id } = req.query;
    if (!id) {
        return res.status(400).json({ error: 'Asset ID is required' });
    }
    try {
        const authHeader = typeof req.headers.authorization === 'string' ? req.headers.authorization.split(' ')[1] : undefined;
        const data = await fetchAssetContent(id as string, authHeader);
        res.json(data);
    } catch (error: any) {
        console.error('Failed to fetch asset content:', error.message);
        // Do not log CDN error response to avoid leaking sensitive information
        res.status(500).json({ error: 'Failed to fetch asset content from CDN' });
    }
}

export async function getCategories(req: Request, res: Response) {
    try {
        const flatCategories = await fetchCategories();
        res.json(flatCategories);
    } catch (error) {
        console.error('Failed to fetch categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories from CDN' });
    }
}

export async function getAboutContent(req: Request, res: Response) {
    try {
        const data = await fetchAboutContentHtml();
        res.json(data);
    } catch (error) {
        console.error('Failed to fetch about content:', error);
        res.status(500).json({ error: 'Failed to fetch about content' });
    }
}