// Calls article controller functions based on endpoint, used in server.ts to register routes

import express from 'express';
import { getAllAssets, getAssetContent, getCategories, getAboutContent } from '../controllers/article.controller';

// Middleware
const router = express.Router();

// Search for articles
router.get('/search/', getAllAssets);

// Get categories
router.get('/categories/', getCategories);

// Get about page html content
router.get('/about/', getAboutContent);

// Get article details by ID
router.get('/get/', getAssetContent);

export default router;
