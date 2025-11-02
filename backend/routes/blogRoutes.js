const express = require("express");
const router = express.Router();
const blogCtrl = require("../controllers/blogController");

// Public routes
router.get("/", blogCtrl.getPosts); // GET /api/v1/blog?page=1&limit=10&tag=...&search=...
router.get("/recent", blogCtrl.getPosts); // alias - same endpoint (use query to limit)
router.get("/:id", blogCtrl.getPost); // GET /api/v1/blog/:id_or_slug

// Admin/editor actions (no auth applied here — integrate verifyFirebaseToken later)
router.post("/", blogCtrl.createPost); // POST /api/v1/blog
router.put("/:id", blogCtrl.updatePost); // PUT /api/v1/blog/:id
router.delete("/:id", blogCtrl.deletePost); // DELETE /api/v1/blog/:id

module.exports = router;
