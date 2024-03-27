const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

exports.getProducts = async (req, res) => {
  try {
    const response = await prisma.products.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    });
    res.status(200).json(response);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const response = await prisma.products.findUnique({
      where: {
        id: req.params.id,
      },
    });
    res.status(200).json(response);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.createProduct = async (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0 || !req.files.file) {
    return res.status(400).json({ message: 'Please upload a product picture' });
  }

  const file = req.files.file;
  const fileSize = file.data.length;
  const ext = path.extname(file.name);
  const fileName = file.md5 + '_' + Date.now() + ext;
  const url = `${req.protocol}://umkm.up.railway.app/products/${fileName}`;
  const allowedType = ['.png', '.jpg', '.jpeg', '.webp'];

  if (!allowedType.includes(ext.toLowerCase())) {
    return res.status(422).json({ message: 'Format foto tidak didukung' });
  }

  if (fileSize > 2000000) {
    return res.status(422).json({ message: 'Ukuran foto harus kurang dari 2Mb' });
  }
  const { name, brand, description, price, stock, category, position } =
    req.body;
  if (
    !name ||
    !brand ||
    !description ||
    !price ||
    !stock ||
    !category ||
    !position
  ) {
    return res.status(400).json({ message: 'Semua kolom harus diisi' });
  }
  file.mv(`src/public/products/${fileName}`, async (err) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
  });
  try {
    await prisma.products.create({
      data: {
        name,
        brand,
        description,
        price,
        stock: Number(stock),
        category,
        image: fileName,
        imageUrl: url,
        position,
      },
    });
    res.status(201).json({ message: 'Product created!' });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const product = await prisma.products.findUnique({
    where: { id: id },
  });

  if (!product) {
    return res.status(404).json({ message: 'Product not found', });
  }

  let fileName = '';
  if (req.files === null) {
    fileName = product.image;
  } else {
    const file = req.files.file;
    const fileSize = file.data.length;
    const ext = path.extname(file.name);
    fileName = file.md5 + '_' + Date.now() + ext;
    const allowedType = ['.png', '.jpg', '.jpeg', '.webp'];

    if (!allowedType.includes(ext.toLowerCase())) {
      return res.status(422).json({ message: 'Format image must be png, jpg, jpeg, or webp' });
    }

    if (fileSize > 2000000) {
      return res.status(422).json({ message: 'Ukuran foto harus kurang dari 2Mb' });
    }

    const filePath = `src/public/products/${product.image}`;
    fs.unlinkSync(filePath);
    
    file.mv(`src/public/products/${fileName}`, async (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
      }
    });
  }
    const { name, brand, description, price, stock, category, position } =
      req.body;
    
    if (
      !name ||
      !brand ||
      !description ||
      !price ||
      !stock ||
      !category ||
      !position
    ){
      return res.status(400).json({ message: 'Semua kolom harus diisi' });
    }
    const url = `${req.protocol}://umkm.up.railway.app/products/${fileName}`;
    try {
      await prisma.products.update({
        where: { id: req.params.id },
        data: {
          name,
          brand,
          description,
          price,
          stock: Number(stock),
          category,
          position,
          image: fileName,
          imageUrl: url,
        },
      });
      res.status(200).json({ message: 'Product updated' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
};

exports.deleteProduct = async (req, res) => {
  const product = await prisma.products.findFirst({
    where: {
      id: req.params.id,
    },
  });

  if (!product) return res.status(404).json({ msg: 'Product not found!' });

  const filePath = `src/public/products/${product.image}`;
  fs.unlinkSync(filePath);
  try {
    await prisma.products.delete({
      where: {
        id: req.params.id,
      },
    });
    res.status(200).json({ message: 'Product deleted Success!' });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};
