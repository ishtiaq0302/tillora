import prisma from "../lib/prisma.js";
import { logAudit } from "../lib/audit.js";

const fmt = (t) => ({
  id: t.id,
  product_id: t.productId,
  product: t.product ? { id: t.product.id, name: t.product.name } : null,
  language_id: t.languageId,
  language: t.language ? { id: t.language.id, code: t.language.code, name: t.language.name } : null,
  name: t.name,
  description: t.description || null,
  created_at: t.createdAt,
});

export const getProductTranslations = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { product_id, language_id } = req.query;
    const items = await prisma.productTranslation.findMany({
      where: {
        product: { tenantId },
        ...(product_id ? { productId: product_id } : {}),
        ...(language_id ? { languageId: language_id } : {}),
      },
      include: {
        product: { select: { id: true, name: true } },
        language: { select: { id: true, code: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    res.json({ data: items.map(fmt) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const upsertProductTranslation = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { product_id, language_id, name, description } = req.body;
    if (!product_id) return res.status(400).json({ message: "Product is required" });
    if (!language_id) return res.status(400).json({ message: "Language is required" });
    if (!name?.trim()) return res.status(400).json({ message: "Name is required" });
    const product = await prisma.product.findFirst({ where: { id: product_id, tenantId } });
    if (!product) return res.status(404).json({ message: "Product not found" });
    const existing = await prisma.productTranslation.findFirst({
      where: { productId: product_id, languageId: language_id },
    });
    let result;
    if (existing) {
      result = await prisma.productTranslation.update({
        where: { id: existing.id },
        data: { name: name.trim(), description: description?.trim() || null },
        include: { product: { select: { id: true, name: true } }, language: { select: { id: true, code: true, name: true } } },
      });
    } else {
      result = await prisma.productTranslation.create({
        data: { productId: product_id, languageId: language_id, name: name.trim(), description: description?.trim() || null },
        include: { product: { select: { id: true, name: true } }, language: { select: { id: true, code: true, name: true } } },
      });
    }
    logAudit({ tenantId, userId: req.user.id, module: "product_translations", action: existing ? "update" : "create", recordId: result.id, newValues: { product_id, language_id, name }, req });
    res.json(fmt(result));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const deleteProductTranslation = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.productTranslation.findFirst({
      where: { id: req.params.id, product: { tenantId } },
    });
    if (!existing) return res.status(404).json({ message: "Product translation not found" });
    await prisma.productTranslation.delete({ where: { id: req.params.id } });
    logAudit({ tenantId, userId: req.user.id, module: "product_translations", action: "delete", recordId: req.params.id, req });
    res.json({ message: "Deleted successfully" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
