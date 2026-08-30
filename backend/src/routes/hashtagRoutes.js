import express from 'express';
import { getHashtagThoughts, getTrendingHashtags, universalSearch } from '../controllers/hashtagController.js';

const router = express.Router();

router.get('/trending', getTrendingHashtags);
router.get('/search/all', universalSearch);
router.get('/:tag', getHashtagThoughts);

export default router;
