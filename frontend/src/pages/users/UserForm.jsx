import MainLayout from "../../layout/MainLayout";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../component/Button";
import { useEffect, useRef, useState } from "react";
import api from "../../services/api";
import { createUser, updateUser, getUser } from "../../services/userService";
import toast from "react-hot-toast";
import { useLanguage } from "../../context/LanguageContext";

export default function UserForm() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    isSuperAdmin: false,
    isActive: true,
    roleIds: [],
  });

  useEffect(() => {
    if (!isEdit) return;
    const fetchUser = async () => {
      try {
        setLoading(true);
        const data = await getUser(id);
        setForm({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          password: "",
          phone: data.phone || "",
          isSuperAdmin: data.isSuperAdmin ?? false,
          isActive: data.isActive ?? true,
          roleIds: data.userRoles?.map((ur) => ur.role.id).slice(0, 1) || [],
        });
        if (data.avatar) {
          const base = (
            import.meta.env.VITE_API_URL || "http://localhost:5000/api"
          ).replace(/\/api$/, "");
          setAvatarPreview(`${base}/${data.avatar}`);
        }
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const res = await api.get("/roles");
      setRoles(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === "isActive" || name === "isSuperAdmin")
      finalValue = value === "true";
    setForm({ ...form, [name]: finalValue });
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleRoleChange = (roleId) => {
    setForm({ ...form, roleIds: [roleId] });
    if (errors.roleId) setErrors((prev) => ({ ...prev, roleId: undefined }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.firstName.trim())
      newErrors.firstName = t("first_name_required", "users");
    if (!form.email.trim()) newErrors.email = t("email_required", "users");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = t("email_invalid", "users");
    if (!isEdit && !form.password.trim())
      newErrors.password = t("password_required", "users");
    if (form.roleIds.length === 0)
      newErrors.roleId = t("role_required", "users");
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("firstName", form.firstName);
      formData.append("lastName", form.lastName);
      formData.append("email", form.email);
      formData.append("phone", form.phone);
      formData.append("isSuperAdmin", form.isSuperAdmin);
      formData.append("isActive", form.isActive);
      formData.append("roleIds", JSON.stringify(form.roleIds));
      if (!isEdit || form.password) formData.append("password", form.password);
      if (avatarFile) formData.append("avatar", avatarFile);

      if (isEdit) {
        await updateUser(id, formData);
        toast.success(t("updated_successfully", "users"));
      } else {
        await createUser(formData);
        toast.success(t("created_successfully", "users"));
      }
      navigate("/users");
    } catch (err) {
      console.log(err);
      toast.error(
        err?.response?.data?.message || t("something_went_wrong", "users"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="fcard">
        <div className="ch">
          <div className="ct relative flex items-center justify-center w-full">
            <div className="absolute left-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/users")}
              >
                <ArrowLeft size={14} />
                <span>{t("back", "users")}</span>
              </Button>
            </div>
            <strong className="text-base sm:text-xl font-semibold">
              {isEdit ? t("edit_user", "users") : t("create_user", "users")}
            </strong>
          </div>
        </div>

        <hr className="mb-3" />

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {/* ASSIGN ROLE */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-3">
            <label className="font-semibold block mb-3">
              {t("assign_role", "users")}{" "}
              <span style={{ color: "var(--danger, #e53e3e)" }}>*</span>
            </label>
            <div className="flex flex-wrap gap-4">
              {roles.map((role) => (
                <label
                  key={role.id}
                  className="flex items-center gap-2 border px-3 py-2 rounded cursor-pointer"
                  style={
                    errors.roleId
                      ? { borderColor: "var(--danger, #e53e3e)" }
                      : {}
                  }
                >
                  <input
                    type="radio"
                    name="roleId"
                    checked={form.roleIds.includes(role.id)}
                    onChange={() => handleRoleChange(role.id)}
                  />
                  {role.name}
                </label>
              ))}
            </div>
            {errors.roleId && (
              <span
                style={{
                  fontSize: 11,
                  color: "var(--danger, #e53e3e)",
                  marginTop: 4,
                  display: "block",
                }}
              >
                {errors.roleId}
              </span>
            )}
          </div>

          {/* FIRST NAME */}
          <div className="fg">
            <label>
              {t("first_name", "users")}{" "}
              <span style={{ color: "var(--danger, #e53e3e)" }}>*</span>
            </label>
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              autoFocus
              style={
                errors.firstName
                  ? { borderColor: "var(--danger, #e53e3e)" }
                  : {}
              }
            />
            {errors.firstName && (
              <span
                style={{
                  fontSize: 11,
                  color: "var(--danger, #e53e3e)",
                  marginTop: 2,
                }}
              >
                {errors.firstName}
              </span>
            )}
          </div>

          {/* LAST NAME */}
          <div className="fg">
            <label>{t("last_name", "users")}</label>
            <input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
            />
          </div>

          {/* EMAIL */}
          <div className="fg">
            <label>
              {t("email", "users")}{" "}
              <span style={{ color: "var(--danger, #e53e3e)" }}>*</span>
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              style={
                errors.email ? { borderColor: "var(--danger, #e53e3e)" } : {}
              }
            />
            {errors.email && (
              <span
                style={{
                  fontSize: 11,
                  color: "var(--danger, #e53e3e)",
                  marginTop: 2,
                }}
              >
                {errors.email}
              </span>
            )}
          </div>

          {/* PASSWORD */}
          <div className="fg">
            <label>
              {isEdit ? (
                t("password_edit_label", "users")
              ) : (
                <>
                  {t("password_label", "users")}{" "}
                  <span style={{ color: "var(--danger, #e53e3e)" }}>*</span>
                </>
              )}
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              style={
                errors.password ? { borderColor: "var(--danger, #e53e3e)" } : {}
              }
            />
            {errors.password && (
              <span
                style={{
                  fontSize: 11,
                  color: "var(--danger, #e53e3e)",
                  marginTop: 2,
                }}
              >
                {errors.password}
              </span>
            )}
          </div>

          {/* PHONE */}
          <div className="fg">
            <label>{t("phone", "users")}</label>
            <input name="phone" value={form.phone} onChange={handleChange} />
          </div>

          {/* AVATAR */}
          <div className="fg">
            <label>{t("avatar", "users")}</label>
            <div className="flex items-center gap-3">
              {avatarPreview && (
                <img
                  src={avatarPreview}
                  alt="avatar preview"
                  className="w-12 h-12 rounded-full object-cover border"
                />
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current.click()}
              >
                {avatarPreview
                  ? t("change_picture", "users")
                  : t("upload_picture", "users")}
              </Button>
              {avatarFile && (
                <span className="text-sm text-gray-500 truncate max-w-[120px]">
                  {avatarFile.name}
                </span>
              )}
            </div>
          </div>

          {/* SUPER ADMIN */}
          <div className="fg">
            <label>{t("is_super_admin", "users")}</label>
            <select
              name="isSuperAdmin"
              value={form.isSuperAdmin}
              onChange={handleChange}
            >
              <option value="false">{t("no", "users")}</option>
              <option value="true">{t("yes", "users")}</option>
            </select>
          </div>

          {/* STATUS */}
          <div className="fg">
            <label>{t("status", "users")}</label>
            <select
              name="isActive"
              value={form.isActive}
              onChange={handleChange}
            >
              <option value="true">{t("active", "users")}</option>
              <option value="false">{t("inactive", "users")}</option>
            </select>
          </div>

          {/* BUTTONS */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex justify-end gap-2">
            <Button type="submit" variant="primary" disabled={loading}>
              {loading
                ? t("saving", "users")
                : isEdit
                  ? t("update_user", "users")
                  : t("create_user", "users")}
            </Button>
            <Button variant="ghost" onClick={() => navigate("/users")}>
              <ArrowLeft size={14} />
              <span>{t("back", "users")}</span>
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
