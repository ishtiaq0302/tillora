import MainLayout from "../../layout/MainLayout";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../component/Button";
import { useEffect, useState } from "react";
import { createRole, updateRole, getRole } from "../../services/roleService";
import toast from "react-hot-toast";
import { useLanguage } from "../../context/LanguageContext";

const Field = ({ label, name, required, errors, children }) => (
  <div className="fg">
    <label>
      {label}
      {required && <span style={{ color: "var(--red)", marginLeft: 2 }}>*</span>}
    </label>
    {children}
    {errors[name] && (
      <span style={{ fontSize: 10.5, color: "var(--red)", marginTop: 2 }}>{errors[name]}</span>
    )}
  </div>
);

export default function RoleForm() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({ name: "", description: "" });

  useEffect(() => {
    if (!isEdit) return;
    const fetchRole = async () => {
      try {
        setLoading(true);
        const data = await getRole(id);
        setForm({ name: data.name || "", description: data.description || "" });
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRole();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = t("role_name_required", "roles");
    else if (form.name.trim().length < 2) e.name = t("role_name_min", "roles");
    if (form.description && form.description.trim().length > 500) e.description = t("description_too_long", "roles");
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      document.querySelector(`[name="${Object.keys(validationErrors)[0]}"]`)?.focus();
      return;
    }
    try {
      setLoading(true);
      if (isEdit) {
        await updateRole(id, form);
        toast.success(t("updated_successfully", "roles"));
      } else {
        await createRole(form);
        toast.success(t("created_successfully", "roles"));
      }
      navigate("/roles");
    } catch (err) {
      console.log(err);
      toast.error(err?.response?.data?.message || t("something_went_wrong", "roles"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="fcard">
        <div className="ch">
          <div className="ct flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/roles")}>
              <ArrowLeft size={14} /><span>{t("back", "roles")}</span>
            </Button>
            <strong className="absolute left-1/2 -translate-x-1/2 text-xl font-semibold">
              {isEdit ? t("edit_role", "roles") : t("create_role", "roles")}
            </strong>
          </div>
        </div>
        <hr className="mb-3" />

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
          <Field label={t("role_name", "roles")} name="name" required errors={errors}>
            <input name="name" value={form.name} onChange={handleChange} autoFocus style={errors.name ? { borderColor: "var(--red)" } : {}} />
          </Field>

          <Field label={t("role_description", "roles")} name="description" errors={errors}>
            <textarea name="description" onChange={handleChange} value={form.description} style={errors.description ? { borderColor: "var(--red)" } : {}} />
          </Field>

          <div className="flex justify-end gap-2">
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? t("saving", "roles") : isEdit ? t("update_role", "roles") : t("create_role", "roles")}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate("/roles")}>
              <ArrowLeft size={14} /><span>{t("back", "roles")}</span>
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
