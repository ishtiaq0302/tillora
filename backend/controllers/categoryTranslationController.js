import prisma from "../lib/prisma.js";
import { logAudit } from "../lib/audit.js";

const fmt = (t) => ({
  id: t.id,
  category_id: t.categoryId,
  category: t.category ? { id: t.category.id, name: t.category.name } : null,
  language_id: t.languageId,
  language: t.language ? { id: t.language.id, code: t.language.code, name: t.language.name } : null,
  name: t.name,
  created_at: t.createdAt,
});

export const getCategoryTranslations = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { category_id, language_id } = req.query;
    const items = await prisma.categoryTranslation.findMany({
      where: {
        category: { tenantId },
        ...(category_id ? { categoryId: category_id } : {}),
        ...(language_id ? { languageId: language_id } : {}),
      },
      include: {
        category: { select: { id: true, name: true } },
        language: { select: { id: true, code: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    res.json({ data: items.map(fmt) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const upsertCategoryTranslation = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { category_id, language_id, name } = req.body;
    if (!category_id) return res.status(400).json({ message: "Category is required" });
    if (!language_id) return res.status(400).json({ message: "Language is required" });
    if (!name?.trim()) return res.status(400).json({ message: "Name is required" });
    const category = await prisma.category.findFirst({ where: { id: category_id, tenantId } });
    if (!category) return res.status(404).json({ message: "Category not found" });
    const existing = await prisma.categoryTranslation.findFirst({
      where: { categoryId: category_id, languageId: language_id },
    });
    let result;
    if (existing) {
      result = await prisma.categoryTranslation.update({
        where: { id: existing.id },
        data: { name: name.trim() },
        include: { category: { select: { id: true, name: true } }, language: { select: { id: true, code: true, name: true } } },
      });
    } else {
      result = await prisma.categoryTranslation.create({
        data: { categoryId: category_id, languageId: language_id, name: name.trim() },
        include: { category: { select: { id: true, name: true } }, language: { select: { id: true, code: true, name: true } } },
      });
    }
    logAudit({ tenantId, userId: req.user.id, module: "category_translations", action: existing ? "update" : "create", recordId: result.id, newValues: { category_id, language_id, name }, req });
    res.json(fmt(result));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const deleteCategoryTranslation = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.categoryTranslation.findFirst({
      where: { id: req.params.id, category: { tenantId } },
    });
    if (!existing) return res.status(404).json({ message: "Category translation not found" });
    await prisma.categoryTranslation.delete({ where: { id: req.params.id } });
    logAudit({ tenantId, userId: req.user.id, module: "category_translations", action: "delete", recordId: req.params.id, req });
    res.json({ message: "Deleted successfully" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
