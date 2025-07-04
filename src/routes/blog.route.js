const express = require('express');
const BlogController = require('../controllers/blog.controller');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const router = express.Router();

// GET all blogs
router.get('/', BlogController.getAll);
// GET single blog
router.get('/:id', BlogController.getById);
// CREATE blog
router.post('/', upload.none(), BlogController.create);
// UPDATE blog
router.put('/:id', upload.none(), BlogController.update);
// DELETE blog
router.delete('/:id', BlogController.delete);
// PUT publish/unpublish blog
router.put('/:id/publish', BlogController.publish);

module.exports = router; 