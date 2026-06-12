import MainLayout from "../../layout/MainLayout";
import { useEffect, useState } from "react";
import api from "../../services/api";
import Button from "../component/Button";
import toast from "react-hot-toast";

const RolePermissionsPage = () => {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [permissions, setPermissions] = useState({});
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [saving, setSaving] = useState(false);

  // =====================
  // LOAD INITIAL DATA
  // =====================
  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, []);

  // =====================
  // LOAD ROLES
  // =====================
  const loadRoles = async () => {
    try {
      const res = await api.get("/roles");
      if (Array.isArray(res.data)) {
        const filtered = res.data.filter((r) => r.name !== "Super Admin");
        setRoles(filtered);
        if (filtered.length > 0) setSelectedRole(filtered[0].id);
      } else {
        setRoles([]);
      }
    } catch (error) {
      console.log(error);
      setRoles([]);
    }
  };

  // =====================
  // LOAD ALL PERMISSIONS
  // =====================
  const loadPermissions = async () => {
    try {
      const res = await api.get("/roles/permissions/all");
      setPermissions(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  // =====================
  // LOAD ROLE PERMISSIONS
  // =====================
  useEffect(() => {
    if (selectedRole) loadRolePermissions();
  }, [selectedRole]);

  const loadRolePermissions = async () => {
    try {
      const res = await api.get(`/roles/${selectedRole}/permissions`);
      const names = res.data.rolePermissions.map((rp) => rp.permission.name);
      setSelectedPermissions(names);
    } catch (error) {
      console.log(error);
    }
  };

  // =====================
  // TOGGLE SINGLE
  // =====================
  const togglePermission = (name) => {
    setSelectedPermissions((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name],
    );
  };

  // =====================
  // TOGGLE MODULE
  // =====================
  const toggleModule = (modulePermissions) => {
    const names = modulePermissions.map((p) => p.name);
    const allSelected = names.every((n) => selectedPermissions.includes(n));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((p) => !names.includes(p)));
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...names])]);
    }
  };

  // =====================
  // TOGGLE ALL
  // =====================
  const allPermissionNames = Object.values(permissions)
    .flat()
    .map((p) => p.name);
  const allSelected =
    allPermissionNames.length > 0 &&
    allPermissionNames.every((n) => selectedPermissions.includes(n));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions(allPermissionNames);
    }
  };

  // =====================
  // SAVE
  // =====================
  const savePermissions = async () => {
    try {
      setSaving(true);

      await api.put(`/roles/${selectedRole}/permissions`, {
        permissions: selectedPermissions,
      });

      toast.success("Permissions updated successfully");
    } catch (error) {
      console.log(error);

      toast.error(
        error.response?.data?.message || "Failed to update permissions",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="card">
        {/* ── HEADER ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
          <strong className="ct" style={{ fontSize: 15 }}>
            Role Permissions
          </strong>

          <div className="flex items-center gap-3 flex-wrap">
            {/* ROLE SELECT */}
            <div
              className="flex items-center gap-2"
              style={{ fontSize: 12, color: "var(--tx3)" }}
            >
              <span>Role</span>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                style={{
                  background: "var(--inp)",
                  border: "1px solid var(--inpbd)",
                  borderRadius: "var(--r)",
                  padding: "4px 28px 4px 8px",
                  fontSize: 12,
                  color: "var(--tx)",
                  fontFamily: "var(--font)",
                  outline: "none",
                  minWidth: 130,
                }}
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            {/* SAVE BUTTON */}
            <Button
              variant="primary"
              size="sm"
              onClick={savePermissions}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Permissions"}
            </Button>
          </div>
        </div>

        <hr style={{ borderColor: "var(--bd)", margin: "0 0 12px" }} />

        {/* ── TABLE ── */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th style={{ width: 200 }}>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      style={{
                        width: 12,
                        height: 12,
                        accentColor: "var(--accent)",
                        cursor: "pointer",
                      }}
                    />
                    <span>Module</span>
                  </div>
                </th>
                <th>Permissions</th>
              </tr>
            </thead>

            <tbody>
              {Object.keys(permissions).length === 0 ? (
                <tr>
                  <td
                    colSpan="2"
                    style={{ textAlign: "center", color: "var(--tx3)" }}
                  >
                    Loading permissions...
                  </td>
                </tr>
              ) : (
                Object.keys(permissions).map((module) => {
                  const modulePermissions = permissions[module];
                  const allModuleSelected = modulePermissions.every((p) =>
                    selectedPermissions.includes(p.name),
                  );
                  const someSelected = modulePermissions.some((p) =>
                    selectedPermissions.includes(p.name),
                  );

                  return (
                    <tr key={module}>
                      {/* MODULE NAME + CHECKBOX */}
                      <td style={{ verticalAlign: "middle" }}>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={allModuleSelected}
                            ref={(el) => {
                              if (el)
                                el.indeterminate =
                                  someSelected && !allModuleSelected;
                            }}
                            onChange={() => toggleModule(modulePermissions)}
                            style={{
                              width: 12,
                              height: 12,
                              accentColor: "var(--accent)",
                              cursor: "pointer",
                            }}
                          />
                          <span
                            className="capitalize"
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "var(--tx)",
                            }}
                          >
                            {module}
                          </span>
                        </div>
                      </td>

                      {/* PERMISSION CHECKBOXES */}
                      <td style={{ verticalAlign: "middle" }}>
                        <div
                          className="flex gap-4 flex-wrap"
                          style={{ padding: "4px 0" }}
                        >
                          {modulePermissions.map((perm) => {
                            const isChecked = selectedPermissions.includes(
                              perm.name,
                            );
                            return (
                              <label
                                key={perm.id}
                                className="flex items-center gap-1.5"
                                style={{
                                  fontSize: 12,
                                  color: isChecked
                                    ? "var(--accent)"
                                    : "var(--tx2)",
                                  cursor: "pointer",
                                  userSelect: "none",
                                  transition: "color .15s",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => togglePermission(perm.name)}
                                  style={{
                                    width: 12,
                                    height: 12,
                                    accentColor: "var(--accent)",
                                    cursor: "pointer",
                                  }}
                                />
                                <span className="capitalize">
                                  {perm.name.split(".")[1]}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
};

export default RolePermissionsPage;
