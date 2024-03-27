const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const prisma = new PrismaClient();

exports.getBlogs = async (req, res) => {
  try {
    const blogs = await prisma.blogs.findMany();
    res.status(200).json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBlogById = async (req, res) => {
  try {
    const blog = await prisma.blogs.findUnique({
      where: {
        id: req.params.id,
      },
    });
    res.status(200).json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createBlog = async (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0 || !req.files.file) {
    return res.status(400).json({ message: 'Please upload a blog picture' });
  }

  const file = req.files.file;
  const fileSize = file.data.length;
  const ext = path.extname(file.name);
  const fileName = file.md5 + '_' + Date.now() + ext;
  const url = `${req.protocol}://umkm.up.railway.app/blogs/${fileName}`;
  const allowedType = ['.png', '.jpg', '.jpeg', '.webp'];

  if (!allowedType.includes(ext.toLowerCase())) {
    return res.status(422).json({ message: 'Format image tidak didukung' });
  }

  if (fileSize > 5000000) {
    return res.status(422).json({ message: 'Ukuran image harus kurang dari 5Mb' });
  }
  const { title, description } = req.body;
  if (!title || !description) {
    return res.status(400).json({ message: 'Semua kolom harus diisi' });
  }
  file.mv(`src/public/blogs/${fileName}`, async (err) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
  });
  try {
    await prisma.blogs.create({
      data: {
        title,
        description,
        image: fileName,
        imageUrl: url,
      },
    });
    res.status(201).json({ message: 'Blogs created!' });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateBlog = async (req, res) => {
  const { id } = req.params;
  const blog = await prisma.blogs.findUnique({
    where: { id: id },
  });

  let fileName = '';
  if (req.files === null) {
    fileName = blog.image;
  } else {
    const file = req.files.file;
    const fileSize = file.data.length;
    const ext = path.extname(file.name);
    fileName = file.md5 + '_' + Date.now() + ext;
    const allowedType = ['.png', '.jpg', '.jpeg', '.webp'];

    if (!allowedType.includes(ext.toLowerCase())) {
      return res.status(422).json({ message: 'Format image tidak didukung' });
    }

    if (fileSize > 5000000) {
      return res.status(422).json({ message: 'Ukuran image harus kurang dari 5Mb' });
    }

    const filePath = `src/public/blogs/${blog.image}`;
    fs.unlinkSync(filePath);
    
    file.mv(`src/public/blogs/${fileName}`, async (err) => {
      if (err) {
        return res.status(500).json({ message: err.message });
      }
    });
  }
  const { title, description } = req.body;
  const url = `${req.protocol}://umkm.up.railway.app/blogs/${fileName}`;
  try {
    const blog = await prisma.blogs.update({
      where: { id: id },
      data: {
        title,
        description,
        image: fileName,
        imageUrl: url,
      },
    });
    res.status(200).json({ message: 'Blog updated', blog });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteBlog = async (req, res) => {
  const { id } = req.params;
  const blog = await prisma.blogs.findUnique({
    where: { id: id },
  });

  if (!blog) {
    return res.status(404).json({ message: 'Blog not found' });
  }

  const filePath = `src/public/blogs/${blog.image}`;
  fs.unlinkSync(filePath);

  try {
    await prisma.blogs.delete({
      where: { id: id },
    });
    res.status(200).json({ message: 'Blog deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
