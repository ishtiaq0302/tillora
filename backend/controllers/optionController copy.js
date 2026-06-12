import Option from "../models/Option.js";

// CREATE
export const createOption = async (req, res) => {
  try {
    const { name, price, status } = req.body;

    const option = await Option.create({ name, price, status });

    res.status(201).json(option);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET ALL
export const getOptions = async (req, res) => {
  try {
    const data = await Option.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE
export const updateOption = async (req, res) => {
  try {
    const updated = await Option.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE
export const deleteOption = async (req, res) => {
  try {
    await Option.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};