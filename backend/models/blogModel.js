const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Title is required"], trim: true },
    slug: {
      type: String,
      required: true,
      trim: true,
      index: true,
      unique: true,
    },
    body: { type: String, required: [true, "Body is required"] },
    excerpt: { type: String },
    tags: { type: [String], default: [] },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    published: { type: Boolean, default: true, index: true },
    publishedAt: { type: Date },
    coverImage: { type: String, required: false },
    meta: { type: Object, default: {} },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// simple slug generator
function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[/\s]+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .replace(/\-+/g, "-")
    .replace(/^\-+|\-+$/g, "");
}

// ensure slug
blogSchema.pre("validate", async function (next) {
  if (!this.slug && this.title) {
    let base = slugify(this.title);
    let slug = base || String(Date.now());
    // ensure unique
    let i = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      // try candidate
      // use mongoose model if compiled
      const Blog =
        mongoose.models && mongoose.models.Blog ? mongoose.models.Blog : null;
      if (!Blog) {
        this.slug = slug;
        break;
      }
      // check existing
      const exists = await Blog.findOne({ slug, _id: { $ne: this._id } })
        .select("_id")
        .lean();
      if (!exists) {
        this.slug = slug;
        break;
      }
      i += 1;
      slug = `${base}-${i}`;
    }
  }
  next();
});

// cleanup JSON output
blogSchema.method("toJSON", function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
});

// reuse model if already compiled (nodemon)
const Blog =
  mongoose.models && mongoose.models.Blog
    ? mongoose.models.Blog
    : mongoose.model("Blog", blogSchema);

module.exports = Blog;
