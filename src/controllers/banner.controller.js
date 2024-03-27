const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const prisma = new PrismaClient();

exports.getBanners = async (req, res) => {
  try {
    const banners = await prisma.banners.findMany();
    res.status(200).json(banners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBannerById = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await prisma.banners.findUnique({
      where: {
        id: id,
      },
    });
    res.status(200).json(banner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createBanner = async (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0 || !req.files.file) {
    return res.status(400).json({ message: 'Please upload a Banner picture' });
  }

  const file = req.files.file;
  const fileSize = file.data.length;
  const ext = path.extname(file.name);
  const fileName = file.md5 + '_' + Date.now() + ext;
  const url = `${req.protocol}://umkm.up.railway.app/banners/${fileName}`;
  const allowedType = ['.png', '.jpg', '.jpeg', '.webp'];

  if (!allowedType.includes(ext.toLowerCase())) {
    return res.status(422).json({ message: 'Format Foto tidak didukung' });
  }

  if (fileSize > 5000000) {
    return res.status(422).json({ message: 'Ukuran Foto harus kurang dari 5Mb' });
  }
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Nama harus diisi' });
  }
  file.mv(`src/public/banners/${fileName}`, async (err) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
  });
  try {
    await prisma.banners.create({
      data: {
        name,
        image: fileName,
        ImageUrl: url,
      },
    });
    res.status(201).json({ message: 'Banners created!' });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateBanner = async (req, res) => {
  const { id } = req.params;
  const banner = await prisma.banners.findUnique({
    where: { id: id },
  });

  let fileName = '';
  if (req.files === null) {
    fileName = banner.image;
  } else {
    const file = req.files.file;
    const fileSize = file.data.length;
    const ext = path.extname(file.name);
    fileName = file.md5 + '_' + Date.now() + ext;
    const allowedType = ['.png', '.jpg', '.jpeg'];

    if (!allowedType.includes(ext.toLowerCase())) {
      return res.status(422).json({ message: 'Format image tidak didukung' });
    }

    if (fileSize > 5000000) {
      return res
        .status(422)
        .json({ message: 'Ukuran image harus kurang dari 5Mb' });
    }

    const filePath = `src/public/banners/${banner.image}`;
    fs.unlinkSync(filePath);

    file.mv(`src/public/banners/${fileName}`, async (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
      }
    });
  }
  const { name } = req.body;
  const url = `${req.protocol}://umkm.up.railway.app/banners/${fileName}`;
  try {
    const banner = await prisma.banners.update({
      where: { id: id },
      data: {
        name,
        image: fileName,
        ImageUrl: url,
      },
    });
    res.status(200).json({ message: 'Banner updated', banner });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteBanner = async (req, res) => {
  const { id } = req.params;
  const banner = await prisma.banners.findUnique({
    where: { id: id },
  });

  const filePath = `src/public/banners/${banner.image}`;
  fs.unlinkSync(filePath);

  try {
    await prisma.banners.delete({
      where: { id: id },
    });
    res.status(200).json({ message: 'Banner deleted Success!' });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};
