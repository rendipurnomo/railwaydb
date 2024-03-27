const express = require("express");
const router = express.Router();
const blogController = require("../controllers/blog.controller.js");

const { protect, protectAdmin } = require("../middleware/protect.js");

router.get("/", blogController.getBlogs);
router.get("/:id", blogController.getBlogById);
router.post("/", protect, protectAdmin, blogController.createBlog);
router.put("/:id", protect, protectAdmin, blogController.updateBlog);
router.delete("/:id", protect, protectAdmin, blogController.deleteBlog);

module.exports = router