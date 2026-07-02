import prisma from "../lib/prisma.js";
import { logAudit } from "../lib/audit.js";

const fmt = (t) => ({
  id: t.id,
  tenant_id: t.tenantId || null,
  language_id: t.languageId,
  language: t.language ? { id: t.language.id, code: t.language.code, name: t.language.name } : null,
  group: t.translationGroup,
  key: t.translationKey,
  value: t.translationValue,
  created_at: t.createdAt,
  updated_at: t.updatedAt,
});

export const getTranslations = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { language_id, group } = req.query;
    const items = await prisma.translation.findMany({
      where: {
        tenantId,
        ...(language_id ? { languageId: language_id } : {}),
        ...(group ? { translationGroup: group } : {}),
      },
      include: { language: { select: { id: true, code: true, name: true } } },
      orderBy: [{ translationGroup: "asc" }, { translationKey: "asc" }],
    });
    res.json({ data: items.map(fmt) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const upsertTranslation = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { language_id, group, key, value } = req.body;
    if (!language_id) return res.status(400).json({ message: "Language is required" });
    if (!group?.trim()) return res.status(400).json({ message: "Group is required" });
    if (!key?.trim()) return res.status(400).json({ message: "Key is required" });

    const existing = await prisma.translation.findFirst({
      where: { tenantId, languageId: language_id, translationGroup: group.trim(), translationKey: key.trim() },
    });

    let result;
    if (existing) {
      result = await prisma.translation.update({
        where: { id: existing.id },
        data: { translationValue: value ?? "" },
        include: { language: { select: { id: true, code: true, name: true } } },
      });
    } else {
      result = await prisma.translation.create({
        data: {
          tenantId, languageId: language_id,
          translationGroup: group.trim(), translationKey: key.trim(), translationValue: value ?? "",
        },
        include: { language: { select: { id: true, code: true, name: true } } },
      });
    }
    logAudit({ tenantId, userId: req.user.id, module: "translations", action: existing ? "update" : "create", recordId: result.id, newValues: { language_id, group, key }, req });
    res.json(fmt(result));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const bulkUpsertTranslations = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { group, key, values } = req.body;
    if (!group?.trim()) return res.status(400).json({ message: "Group is required" });
    if (!key?.trim()) return res.status(400).json({ message: "Key is required" });
    if (!Array.isArray(values) || !values.length) return res.status(400).json({ message: "At least one language value is required" });

    const results = [];
    for (const { language_id, value } of values) {
      if (!language_id) continue;
      const existing = await prisma.translation.findFirst({
        where: { tenantId, languageId: language_id, translationGroup: group.trim(), translationKey: key.trim() },
      });
      let result;
      if (existing) {
        result = await prisma.translation.update({
          where: { id: existing.id },
          data: { translationValue: value ?? "" },
          include: { language: { select: { id: true, code: true, name: true } } },
        });
      } else {
        result = await prisma.translation.create({
          data: { tenantId, languageId: language_id, translationGroup: group.trim(), translationKey: key.trim(), translationValue: value ?? "" },
          include: { language: { select: { id: true, code: true, name: true } } },
        });
      }
      results.push(fmt(result));
    }
    logAudit({ tenantId, userId: req.user.id, module: "translations", action: "bulk_upsert", newValues: { group, key, count: results.length }, req });
    res.json({ data: results });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const deleteTranslation = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.translation.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) return res.status(404).json({ message: "Translation not found" });
    await prisma.translation.delete({ where: { id: req.params.id } });
    logAudit({ tenantId, userId: req.user.id, module: "translations", action: "delete", recordId: req.params.id, req });
    res.json({ message: "Deleted successfully" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const deleteTranslationGroup = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { group, key } = req.query;
    if (!group?.trim() || !key?.trim())
      return res.status(400).json({ message: "Group and key are required" });
    const { count } = await prisma.translation.deleteMany({
      where: { tenantId, translationGroup: group.trim(), translationKey: key.trim() },
    });
    logAudit({ tenantId, userId: req.user.id, module: "translations", action: "delete_group", newValues: { group, key, count }, req });
    res.json({ message: "Deleted successfully", count });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
