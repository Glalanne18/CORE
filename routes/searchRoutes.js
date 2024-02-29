const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// Route for search
router.get('/', searchController.searchPosts);

module.exports = router;