const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

exports.getOrders = async (req, res) => {
  try {
    const orders = await prisma.orders.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        OrderItem: true,
      }
    });
    if (orders.length === 0 || !orders) {
      return res.status(404).json({ message: 'Belum ada order' });
    }
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrderByid = async (req, res) => {
  try {
    const order = await prisma.orders.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        OrderItem: true,
      },
    });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createOrder = async (req, res) => {
  const { userId, productId, quantity, totalPrice } = req.body;
  const user = await prisma.users.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }

  const product = await prisma.products.findUnique({
    where: {
      id: productId,
    },
  });

  try {
    const order = await prisma.orders.upsert({
      where: { userId: userId },
      create: {
        userId: userId,
        pengiriman: user.address,
        OrderItem: {
          create: {
            productId: productId,
            quantity: Number(quantity),
            totalPrice: totalPrice,
            price: product.price,
          },
        },
      },
      update: {
        pengiriman: user.address,
        OrderItem: {
          create: {
            productId: productId,
            quantity: Number(quantity),
            totalPrice: totalPrice,
            price: product.price,
          }
        }
      },
      include: {
        OrderItem: true,
      }
    });

    if (order) {
      const stocks = Number(product.stock) - Number(quantity);
      await prisma.products.update({
        where: {
          id: productId,
        },
        data: {
          stock: stocks,
        },
      });
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateDelivery = async (req, res) => {
  const { id } = req.params;
  const order = await prisma.orderItem.findUnique({
    where: { id: id },
  });

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  try {
    const order = await prisma.orderItem.update({
      where: { id: id },
      data: {
        delivery: true,
      }
    });

    res.status(200).json({ message: 'Order updated delivery', order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updatePayment = async (req, res) => {
  const { id } = req.params;
  const order = await prisma.orderItem.findUnique({
    where: { id: id },
  });

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  try {
    const order = await prisma.orderItem.update({
      where: { id: id },
      data: {
        paid: true,
      },
    });

    res.status(200).json({ message: 'Order updated payment', order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteOrder = async (req, res) => {
  const { id } = req.params;
  const order = await prisma.orders.findUnique({
    where: { id: id },
  });

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }
  try {
    const orderItem = await prisma.orderItem.deleteMany({
      where: {
        orderId: id,
      },
    });

    if (orderItem) {
      await prisma.orders.delete({
        where: { id: id },
      });

      res.status(200).json({ message: 'Order deleted' });
    }

    res.status(200).json({ message: 'Order deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
