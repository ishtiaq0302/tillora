import prisma from "../lib/prisma.js";
import { logAudit } from "../lib/audit.js";

const fmt = (sl) => ({
  id: sl.id,
  store_id: sl.storeId,
  language_id: sl.languageId,
  language: sl.language ? { id: sl.language.id, code: sl.language.code, name: sl.language.name } : null,
  is_default: sl.isDefault,
  created_at: sl.createdAt,
});

export const getStoreLanguages = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { store_id } = req.query;
    const items = await prisma.storeLanguage.findMany({
      where: {
        store: { tenantId },
        ...(store_id ? { storeId: store_id } : {}),
      },
      include: { language: { select: { id: true, code: true, name: true } } },
      orderBy: { isDefault: "desc" },
    });
    res.json({ data: items.map(fmt) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const createStoreLanguage = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { store_id, language_id, is_default } = req.body;
    if (!store_id) return res.status(400).json({ message: "Store is required" });
    if (!language_id) return res.status(400).json({ message: "Language is required" });
    const store = await prisma.store.findFirst({ where: { id: store_id, tenantId } });
    if (!store) return res.status(404).json({ message: "Store not found" });
    const sl = await prisma.storeLanguage.create({
      data: { storeId: store_id, languageId: language_id, isDefault: is_default === true || is_default === "true" },
      include: { language: { select: { id: true, code: true, name: true } } },
    });
    logAudit({ tenantId, userId: req.user.id, module: "store_languages", action: "create", recordId: sl.id, newValues: { store_id, language_id }, req });
    res.status(201).json(fmt(sl));
  } catch (err) {
    if (err.code === "P2002") return res.status(400).json({ message: "Language already added to this store" });
    res.status(500).json({ message: err.message });
  }
};

export const updateStoreLanguage = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.storeLanguage.findFirst({
      where: { id: req.params.id, store: { tenantId } },
    });
    if (!existing) return res.status(404).json({ message: "Store language not found" });
    const { is_default } = req.body;
    const updated = await prisma.storeLanguage.update({
      where: { id: req.params.id },
      data: { isDefault: is_default !== undefined ? (is_default === true || is_default === "true") : existing.isDefault },
      include: { language: { select: { id: true, code: true, name: true } } },
    });
    logAudit({ tenantId, userId: req.user.id, module: "store_languages", action: "update", recordId: req.params.id, req });
    res.json(fmt(updated));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const deleteStoreLanguage = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.storeLanguage.findFirst({
      where: { id: req.params.id, store: { tenantId } },
    });
    if (!existing) return res.status(404).json({ message: "Store language not found" });
    await prisma.storeLanguage.delete({ where: { id: req.params.id } });
    logAudit({ tenantId, userId: req.user.id, module: "store_languages", action: "delete", recordId: req.params.id, req });
    res.json({ message: "Deleted successfully" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
