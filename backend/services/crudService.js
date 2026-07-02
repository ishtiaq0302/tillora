// backend/services/crudService.js
export const createOne = (model) => async (req, res) => {
  try {
    const data = await model.create({
      data: req.body,
    });

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAll = (model, options = {}) => async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", searchFields = [] } = req.query;

    const skip = (page - 1) * limit;

    let where = {};

    // 🔥 SEARCH BUILDER (Prisma style)
    if (search && searchFields.length) {
      where = {
        OR: searchFields.map((field) => ({
          [field]: {
            contains: search,
            mode: "insensitive",
          },
        })),
      };
    }

    const [data, total] = await Promise.all([
      model.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        orderBy: { createdAt: "desc" },
      }),
      model.count({ where }),
    ]);

    res.json({
      data,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getById = (model) => async (req, res) => {
  try {
    const data = await model.findUnique({
      where: { id: req.params.id },
    });

    if (!data) return res.status(404).json({ message: "Not found" });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateOne = (model) => async (req, res) => {
  try {
    const data = await model.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteOne = (model) => async (req, res) => {
  try {
    await model.delete({
      where: { id: req.params.id },
    });

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};