import prisma from "../lib/prisma.js";

export const getSettings = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const storeId = req.storeId || null;

    const settings = await prisma.setting.findMany({
      where: { tenantId, storeId },
    });

    // Return array of { key, value } to match frontend expectations
    const formatted = settings.map((s) => ({
      key: s.settingKey,
      value: s.settingValue,
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const saveSetting = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const storeId = req.storeId || null;

    // Accept both { key, value } (frontend) and { settingKey, settingValue } (legacy)
    const key = req.body.key ?? req.body.settingKey;
    const value = req.body.value ?? req.body.settingValue ?? "";

    if (!key) {
      return res.status(400).json({ message: "Setting key is required" });
    }

    // Use findFirst + update/create instead of upsert to handle NULL storeId
    // (PostgreSQL treats NULL != NULL in unique indexes so upsert won't match)
    const existing = await prisma.setting.findFirst({
      where: { tenantId, storeId, settingKey: key },
    });

    let setting;
    if (existing) {
      setting = await prisma.setting.update({
        where: { id: existing.id },
        data: { settingValue: value },
      });
    } else {
      setting = await prisma.setting.create({
        data: { tenantId, storeId, settingKey: key, settingValue: value },
      });
    }

    res.json({ message: "Setting saved successfully", key: setting.settingKey, value: setting.settingValue });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
