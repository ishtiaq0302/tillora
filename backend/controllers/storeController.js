import prisma from "../lib/prisma.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// =====================
// MULTER CONFIG
// =====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/logos";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `store-${Date.now()}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPG, PNG or WEBP allowed"));
  },
});

// =====================
// CREATE STORE
// =====================
export const createStore = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const {
      name,
      code,
      storeType,
      address,
      city,
      state,
      country,
      zipCode,
      phone,
      email,
      currency,
      timezone,
      dateFormat,
      taxNumber,
      isActive,
    } = req.body;

    if (!name?.trim())
      return res.status(400).json({ message: "Store name is required" });
    if (!storeType?.trim())
      return res.status(400).json({ message: "Store type is required" });
    if (!currency?.trim())
      return res.status(400).json({ message: "Currency is required" });
    if (!timezone?.trim())
      return res.status(400).json({ message: "Timezone is required" });

    // Email format check
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ message: "Invalid email address" });

    // Unique code check
    if (code) {
      const existing = await prisma.store.findFirst({
        where: { tenantId, code },
      });
      if (existing)
        return res.status(400).json({ message: "Store code already exists" });
    }

    const logo = req.file ? `/uploads/logos/${req.file.filename}` : null;

    const store = await prisma.store.create({
      data: {
        tenantId,
        name,
        storeType,
        address,
        city,
        state,
        country,
        zipCode,
        phone,
        email,
        taxNumber,
        code,
        currency,
        timezone,
        dateFormat,
        logo,
        isActive: isActive === "false" ? false : true,
      },
    });

    res.status(201).json(store);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =====================
// GET ALL STORES
// =====================
export const getStores = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const stores = await prisma.store.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
    res.json(stores);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =====================
// GET SINGLE STORE
// =====================
export const getStore = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const store = await prisma.store.findFirst({ where: { id, tenantId } });
    if (!store) return res.status(404).json({ message: "Store not found" });
    res.json(store);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =====================
// UPDATE STORE
// =====================
export const updateStore = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const store = await prisma.store.findFirst({ where: { id, tenantId } });
    if (!store) return res.status(404).json({ message: "Store not found" });

    const {
      name,
      storeType,
      code,
      address,
      city,
      state,
      country,
      zipCode,
      phone,
      email,
      taxNumber,
      currency,
      timezone,
      dateFormat,
      isActive,
    } = req.body;

    if (name !== undefined && !name.trim())
      return res.status(400).json({ message: "Store name cannot be empty" });

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ message: "Invalid email address" });

    // Unique code check (exclude current store)
    if (code && code !== store.code) {
      const existing = await prisma.store.findFirst({
        where: { tenantId, code, NOT: { id } },
      });
      if (existing)
        return res.status(400).json({ message: "Store code already exists" });
    }

    // Handle logo — replace, remove, or keep existing
    let logo = store.logo;
    if (req.file) {
      if (store.logo) {
        const oldPath = store.logo.replace("/", "");
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      logo = `/uploads/logos/${req.file.filename}`;
    } else if (req.body.removeLogo === "true" && store.logo) {
      const oldPath = store.logo.replace("/", "");
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      logo = null;
    }

    const updated = await prisma.store.update({
      where: { id },
      data: {
        name: name ?? store.name,
        code: code ?? store.code,
        storeType: storeType ?? store.storeType,
        address: address ?? store.address,
        city: city ?? store.city,
        state: state ?? store.state,
        country: country ?? store.country,
        zipCode: zipCode ?? store.zipCode,
        phone: phone ?? store.phone,
        email: email ?? store.email,
        taxNumber: taxNumber ?? store.taxNumber,
        currency: currency ?? store.currency,
        timezone: timezone ?? store.timezone,
        dateFormat: dateFormat ?? store.dateFormat,
        isActive:
          isActive !== undefined
            ? isActive === "false"
              ? false
              : true
            : store.isActive,
        logo,
      },
    });

    res.json(updated);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =====================
// DELETE STORE
// =====================
export const deleteStore = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const store = await prisma.store.findFirst({ where: { id, tenantId } });
    if (!store) return res.status(404).json({ message: "Store not found" });

    // Delete logo file if exists
    if (store.logo) {
      const filePath = store.logo.replace("/", "");
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await prisma.store.delete({ where: { id } });
    res.json({ message: "Store deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};
