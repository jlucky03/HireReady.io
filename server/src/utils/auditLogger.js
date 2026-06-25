import AuditLog from "../models/AuditLog.js";

export const logAction = async ({
  req,
  actor = null,
  targetUser = null,
  action,
  entityType = "",
  entityId = null,
  metadata = {},
}) => {
  try {
    await AuditLog.create({
      actor: actor || req?.user?._id || null,
      targetUser,
      action,
      entityType,
      entityId,
      metadata,
      ip:
        req?.headers?.["x-forwarded-for"]?.split(",")[0] ||
        req?.socket?.remoteAddress ||
        "",
    });
  } catch (err) {
    console.warn("Audit log failed:", err.message);
  }
};