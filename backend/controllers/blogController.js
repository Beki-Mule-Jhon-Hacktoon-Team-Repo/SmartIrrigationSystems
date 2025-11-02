const Blog = require("../models/blogModel");

/**
 * createPost(req, res)
 * Body: { title, body, excerpt?, tags?, author?, published?, coverImage? }
 */
exports.createPost = async (req, res) => {
  try {
    const { title, body, excerpt, tags, author, published, coverImage } =
      req.body;
    if (!title || !body)
      return res
        .status(400)
        .json({ status: "fail", message: "title and body are required" });

    const post = await Blog.create({
      title,
      slug: req.body.slug || undefined, // slug will be generated if undefined
      body,
      excerpt,
      tags: Array.isArray(tags)
        ? tags
        : typeof tags === "string"
        ? tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      author,
      published: published === undefined ? true : Boolean(published),
      publishedAt: published ? new Date() : undefined,
      coverImage,
      meta: req.body.meta || {},
    });

    return res.status(201).json({ status: "success", data: { post } });
  } catch (err) {
    console.error("createPost error:", err && err.message);
    return res
      .status(500)
      .json({
        status: "error",
        message: "Failed to create post",
        details: err && err.message,
      });
  }
};

/**
 * getPosts(req, res)
 * Query params: page, limit, tag, published, search
 */
exports.getPosts = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.published !== undefined) {
      filter.published = String(req.query.published) === "true";
    }
    if (req.query.tag) {
      filter.tags = { $in: [req.query.tag] };
    }
    if (req.query.search) {
      const q = req.query.search;
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { excerpt: { $regex: q, $options: "i" } },
        { body: { $regex: q, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      Blog.find(filter)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Blog.countDocuments(filter),
    ]);

    return res.json({
      status: "success",
      data: { items, meta: { total, page, limit } },
    });
  } catch (err) {
    console.error("getPosts error:", err && err.message);
    return res
      .status(500)
      .json({ status: "error", message: "Failed to fetch posts" });
  }
};

/**
 * getPost(req, res)
 * :id can be ObjectId or slug
 */
exports.getPost = async (req, res) => {
  try {
    const id = req.params.id;
    let post = null;
    if (!id)
      return res.status(400).json({ status: "fail", message: "id required" });
    // try find by slug first
    post = await Blog.findOne({ slug: id }).lean();
    if (!post) {
      // try by _id
      if (/^[0-9a-fA-F]{24}$/.test(id)) {
        post = await Blog.findById(id).lean();
      }
    }
    if (!post)
      return res
        .status(404)
        .json({ status: "fail", message: "Post not found" });
    return res.json({ status: "success", data: { post } });
  } catch (err) {
    console.error("getPost error:", err && err.message);
    return res
      .status(500)
      .json({ status: "error", message: "Failed to fetch post" });
  }
};

/**
 * updatePost(req, res)
 * :id is ObjectId
 */
exports.updatePost = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id))
      return res
        .status(400)
        .json({ status: "fail", message: "Valid id required" });

    const updates = {};
    const allowed = [
      "title",
      "body",
      "excerpt",
      "tags",
      "published",
      "coverImage",
      "meta",
    ];
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });
    if (updates.published === true && !updates.publishedAt)
      updates.publishedAt = new Date();

    const post = await Blog.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).lean();
    if (!post)
      return res
        .status(404)
        .json({ status: "fail", message: "Post not found" });
    return res.json({ status: "success", data: { post } });
  } catch (err) {
    console.error("updatePost error:", err && err.message);
    return res
      .status(500)
      .json({ status: "error", message: "Failed to update post" });
  }
};

/**
 * deletePost(req, res)
 */
exports.deletePost = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id))
      return res
        .status(400)
        .json({ status: "fail", message: "Valid id required" });
    const post = await Blog.findByIdAndDelete(id).lean();
    if (!post)
      return res
        .status(404)
        .json({ status: "fail", message: "Post not found" });
    return res.json({ status: "success", message: "Post deleted" });
  } catch (err) {
    console.error("deletePost error:", err && err.message);
    return res
      .status(500)
      .json({ status: "error", message: "Failed to delete post" });
  }
};
