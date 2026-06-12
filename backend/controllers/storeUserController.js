import prisma from "../lib/prisma.js";

export const assignStoreToUser = async (req, res) => {
  try {
    const { userId, storeIds } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required",
      });
    }

    await prisma.$transaction(async (tx) => {
      // REMOVE OLD ASSIGNMENTS
      await tx.storeUser.deleteMany({
        where: {
          userId,
        },
      });

      // ADD NEW ASSIGNMENTS
      if (storeIds && storeIds.length > 0) {
        await tx.storeUser.createMany({
          data: storeIds.map((storeId) => ({
            userId,
            storeId,
            role: "staff",
          })),
        });
      }
    });

    res.json({
      message: "Stores assigned successfully",
    });
  } catch (error) {
    console.log("STORE USER ERROR:", error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};
