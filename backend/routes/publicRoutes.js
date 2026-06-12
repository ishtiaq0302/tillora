import express from "express";
import prisma from "../lib/prisma.js";

const router = express.Router();

// GET ALL PRODUCTS (PUBLIC)
router.get("/products", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

export default router;