import prisma from "../lib/prisma.js";

const parseBool = (v, def = false) => v === undefined ? def : (v === true || v === "true");

const fmt = (l) => ({
  id: l.id,
  code: l.code,
  name: l.name,
  native_name: l.nativeName || null,
  is_rtl: l.isRtl,
  is_default: l.isDefault,
  is_active: l.isActive,
  created_at: l.createdAt,
});

export const getLanguages = async (req, res) => {
  try {
    const search = req.query.search || "";
    const langs = await prisma.language.findMany({
      where: search ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { code: { contains: search, mode: "insensitive" } },
        ],
      } : {},
      orderBy: { name: "asc" },
    });
    res.json({ data: langs.map(fmt) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getLanguage = async (req, res) => {
  try {
    const lang = await prisma.language.findUnique({ where: { id: req.params.id } });
    if (!lang) return res.status(404).json({ message: "Language not found" });
    res.json(fmt(lang));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const createLanguage = async (req, res) => {
  try {
    const { code, name, native_name, is_rtl, is_default, is_active } = req.body;
    if (!code?.trim()) return res.status(400).json({ message: "Language code is required" });
    if (!name?.trim()) return res.status(400).json({ message: "Language name is required" });
    const lang = await prisma.language.create({
      data: {
        code: code.trim().toLowerCase(),
        name: name.trim(),
        nativeName: native_name?.trim() || null,
        isRtl: parseBool(is_rtl),
        isDefault: parseBool(is_default),
        isActive: parseBool(is_active, true),
      },
    });
    res.status(201).json(fmt(lang));
  } catch (err) {
    if (err.code === "P2002") return res.status(400).json({ message: "Language code already exists" });
    res.status(500).json({ message: err.message });
  }
};

export const updateLanguage = async (req, res) => {
  try {
    const existing = await prisma.language.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "Language not found" });
    const { code, name, native_name, is_rtl, is_default, is_active } = req.body;
    const updated = await prisma.language.update({
      where: { id: req.params.id },
      data: {
        code: code?.trim().toLowerCase() ?? existing.code,
        name: name?.trim() ?? existing.name,
        nativeName: native_name !== undefined ? (native_name?.trim() || null) : existing.nativeName,
        isRtl: is_rtl !== undefined ? parseBool(is_rtl) : existing.isRtl,
        isDefault: is_default !== undefined ? parseBool(is_default) : existing.isDefault,
        isActive: is_active !== undefined ? parseBool(is_active) : existing.isActive,
      },
    });
    res.json(fmt(updated));
  } catch (err) {
    if (err.code === "P2002") return res.status(400).json({ message: "Language code already exists" });
    res.status(500).json({ message: err.message });
  }
};

export const deleteLanguage = async (req, res) => {
  try {
    const existing = await prisma.language.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "Language not found" });
    await prisma.language.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted successfully" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
