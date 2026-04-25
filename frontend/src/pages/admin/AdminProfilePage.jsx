import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/admin.css";

import ConfirmModal from "../../components/ConfirmModal";
import apiClient from "../../api/client";
import { isAuthenticated, logout } from "../../components/auth/authStore";
import {
  meRequest,
  updateProfileRequest,
  changePasswordRequest,
} from "../../api/auth";
import { getAdminSupportRequests } from "../../api/support";

function formatRuPhone(value) {
  const digits = value.replace(/\D/g, "");

  let d = digits;
  if (d.startsWith("7")) d = d.slice(1);
  if (d.startsWith("8")) d = d.slice(1);
  d = d.slice(0, 10);

  const p1 = d.slice(0, 3);
  const p2 = d.slice(3, 6);
  const p3 = d.slice(6, 8);
  const p4 = d.slice(8, 10);

  let out = "+7";
  if (p1) out += ` (${p1}`;
  if (p1.length === 3) out += `)`;
  if (p2) out += ` ${p2}`;
  if (p3) out += `-${p3}`;
  if (p4) out += `-${p4}`;
  return out;
}

function getInitial(username) {
  if (!username) return "A";
  return username[0].toUpperCase();
}

export default function AdminProfilePage() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [form, setForm] = useState({
    username: "",
    first_name: "",
    last_name: "",
    middle_name: "",
    email: "",
    phone: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const [pwForm, setPwForm] = useState({
    old_password: "",
    new_password: "",
  });
  const [isPwSaving, setIsPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState("");

  const [stats, setStats] = useState({
    moderationCount: 0,
    sellerRequestsCount: 0,
    newSupportCount: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/");
      return;
    }

    loadProfile();
    loadStats();
  }, [navigate]);

  async function loadProfile() {
    try {
      setIsLoading(true);
      const data = await meRequest();

      setProfile(data);
      setForm({
        username: data?.username || "",
        first_name: data?.first_name || "",
        last_name: data?.last_name || "",
        middle_name: data?.middle_name || "",
        email: data?.email || "",
        phone: data?.phone ? formatRuPhone(data.phone) : "",
      });
    } catch (e) {
      logout();
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadStats() {
    try {
      setStatsLoading(true);

      const [productsRes, usersRes, supportRes] = await Promise.all([
        apiClient.get("/products/moderation-queue/"),
        apiClient.get("/users/admin/seller-requests/"),
        getAdminSupportRequests("new"),
      ]);

      const moderationItems = Array.isArray(productsRes.data?.results)
        ? productsRes.data.results
        : [];
      const sellerItems = Array.isArray(usersRes.data?.results)
        ? usersRes.data.results
        : [];
      const supportItems = Array.isArray(supportRes?.results)
        ? supportRes.results
        : [];

      setStats({
        moderationCount: moderationItems.length,
        sellerRequestsCount: sellerItems.length,
        newSupportCount: supportItems.length,
      });
    } catch (e) {
      setStats({
        moderationCount: 0,
        sellerRequestsCount: 0,
        newSupportCount: 0,
      });
    } finally {
      setStatsLoading(false);
    }
  }

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setSaveMsg("");
  }

  function setPwField(name, value) {
    setPwForm((prev) => ({ ...prev, [name]: value }));
    setPwMsg("");
  }

  async function handleSaveProfile() {
    setSaveMsg("");
    setIsSaving(true);

    try {
      const updated = await updateProfileRequest({
        username: form.username,
        first_name: form.first_name,
        last_name: form.last_name,
        middle_name: form.middle_name,
        email: form.email,
        phone: form.phone,
      });

      setProfile(updated);
      setSaveMsg("Профиль сохранён");
    } catch (e) {
      const data = e?.response?.data;
      const msg =
        data?.username?.[0] ||
        data?.email?.[0] ||
        data?.phone?.[0] ||
        data?.detail ||
        "Ошибка сохранения";
      setSaveMsg(msg);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleChangePassword() {
    setPwMsg("");
    setIsPwSaving(true);

    try {
      await changePasswordRequest(pwForm.old_password, pwForm.new_password);
      setPwMsg("Пароль изменён");
      setPwForm({
        old_password: "",
        new_password: "",
      });
    } catch (e) {
      const data = e?.response?.data;
      const msg =
        data?.old_password?.[0] ||
        data?.new_password?.[0] ||
        data?.detail ||
        "Ошибка смены пароля";
      setPwMsg(msg);
    } finally {
      setIsPwSaving(false);
    }
  }

  function handleConfirmLogout() {
    logout();
    navigate("/");
  }

  const userName = profile?.username || "Администратор";
  const fullName = useMemo(() => {
    const parts = [
      profile?.last_name,
      profile?.first_name,
      profile?.middle_name,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(" ") : "Администратор Meshio";
  }, [profile]);

  const userRole = "Администратор";
  const avatarInitial = getInitial(profile?.username);

  if (isLoading) {
    return <div className="admin__state text-p2">Загрузка...</div>;
  }

  return (
    <section className="admin-profile-page">
      <div className="admin__header">
        <h1 className="admin__title text-h2">Личный кабинет администратора</h1>
        <div className="admin__subtitle text-p2">
          Управление профилем, быстрый доступ к разделам и сводка по платформе.
        </div>
      </div>

      <div className="admin-profile-page__top">
        <div className="admin-profile-page__hero admin-profile-page__panel">
          <div className="admin-profile-page__hero-left">
            <div className="admin-profile-page__avatar text-h3">
              {avatarInitial}
            </div>

            <div className="admin-profile-page__hero-info">
              <div className="admin-profile-page__name text-h3">{userName}</div>
              <div className="admin-profile-page__email text-p2">
                {profile?.email || "email@example.com"}
              </div>
              <div className="admin-profile-page__role text-p3">{userRole}</div>
            </div>
          </div>

          <div className="admin-profile-page__hero-actions">
            <Link
              to="/admin/products"
              className="admin-profile-page__link-btn text-p2"
            >
              К модерации
            </Link>

            <button
              type="button"
              className="admin-profile-page__logout text-p2"
              onClick={() => setIsLogoutModalOpen(true)}
            >
              Выйти
            </button>
          </div>
        </div>

        <div className="admin-profile-page__stats">
          <div className="admin-profile-page__stat-card admin-profile-page__panel">
            <div className="admin-profile-page__stat-label text-p3">
              На модерации
            </div>
            <div className="admin-profile-page__stat-value text-h2">
              {statsLoading ? "—" : stats.moderationCount}
            </div>
          </div>

          <div className="admin-profile-page__stat-card admin-profile-page__panel">
            <div className="admin-profile-page__stat-label text-p3">
              Заявки продавцов
            </div>
            <div className="admin-profile-page__stat-value text-h2">
              {statsLoading ? "—" : stats.sellerRequestsCount}
            </div>
          </div>

          <div className="admin-profile-page__stat-card admin-profile-page__panel">
            <div className="admin-profile-page__stat-label text-p3">
              Новые обращения
            </div>
            <div className="admin-profile-page__stat-value text-h2">
              {statsLoading ? "—" : stats.newSupportCount}
            </div>
          </div>
        </div>
      </div>

      <div className="admin-profile-page__grid">
        <div className="admin-profile-page__panel">
          <div className="admin-profile-page__section-title text-h4">
            Данные аккаунта
          </div>

          <div className="admin-profile-page__form">
            <label className="admin-profile-page__field">
              <span className="admin-profile-page__label text-p3">Никнейм</span>
              <input
                className="admin-profile-page__input text-p2"
                value={form.username}
                onChange={(e) => setField("username", e.target.value)}
                maxLength={150}
              />
            </label>

            <label className="admin-profile-page__field">
              <span className="admin-profile-page__label text-p3">Имя</span>
              <input
                className="admin-profile-page__input text-p2"
                value={form.first_name}
                onChange={(e) => setField("first_name", e.target.value)}
              />
            </label>

            <label className="admin-profile-page__field">
              <span className="admin-profile-page__label text-p3">Фамилия</span>
              <input
                className="admin-profile-page__input text-p2"
                value={form.last_name}
                onChange={(e) => setField("last_name", e.target.value)}
              />
            </label>

            <label className="admin-profile-page__field">
              <span className="admin-profile-page__label text-p3">
                Отчество
              </span>
              <input
                className="admin-profile-page__input text-p2"
                value={form.middle_name}
                onChange={(e) => setField("middle_name", e.target.value)}
              />
            </label>

            <label className="admin-profile-page__field">
              <span className="admin-profile-page__label text-p3">
                Электронная почта
              </span>
              <input
                type="email"
                className="admin-profile-page__input text-p2"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="name@example.com"
              />
            </label>

            <label className="admin-profile-page__field">
              <span className="admin-profile-page__label text-p3">Телефон</span>
              <input
                className="admin-profile-page__input text-p2"
                value={form.phone}
                onChange={(e) =>
                  setField("phone", formatRuPhone(e.target.value))
                }
                inputMode="tel"
                placeholder="+7 (___) ___-__-__"
                maxLength={18}
              />
            </label>
          </div>

          <div className="admin-profile-page__actions">
            <button
              type="button"
              className="admin__approve text-p2"
              onClick={handleSaveProfile}
              disabled={isSaving}
            >
              {isSaving ? "Сохранение..." : "Сохранить"}
            </button>
          </div>

          {saveMsg ? (
            <div className="admin-profile-page__msg text-p2">{saveMsg}</div>
          ) : null}
        </div>

        <div className="admin-profile-page__right-column">
          <div className="admin-profile-page__panel">
            <div className="admin-profile-page__section-title text-h4">
              Быстрые переходы
            </div>

            <div className="admin-profile-page__quick-links">
              <Link
                to="/admin/products"
                className="admin-profile-page__quick-link text-p2"
              >
                Модерация товаров
              </Link>

              <Link
                to="/admin/users"
                className="admin-profile-page__quick-link text-p2"
              >
                Заявки продавцов
              </Link>

              <Link
                to="/admin/requests"
                className="admin-profile-page__quick-link text-p2"
              >
                Обращения пользователей
              </Link>

              <Link to="/" className="admin-profile-page__quick-link text-p2">
                Перейти на сайт
              </Link>
            </div>
          </div>

          <div className="admin-profile-page__panel">
            <div className="admin-profile-page__section-title text-h4">
              Смена пароля
            </div>

            <div className="admin-profile-page__form admin-profile-page__form--stack">
              <label className="admin-profile-page__field">
                <span className="admin-profile-page__label text-p3">
                  Старый пароль
                </span>
                <input
                  type="password"
                  className="admin-profile-page__input text-p2"
                  value={pwForm.old_password}
                  onChange={(e) => setPwField("old_password", e.target.value)}
                  placeholder="Введите старый пароль"
                />
              </label>

              <label className="admin-profile-page__field">
                <span className="admin-profile-page__label text-p3">
                  Новый пароль
                </span>
                <input
                  type="password"
                  className="admin-profile-page__input text-p2"
                  value={pwForm.new_password}
                  onChange={(e) => setPwField("new_password", e.target.value)}
                  placeholder="Минимум 8 символов"
                />
              </label>
            </div>

            <div className="admin-profile-page__actions">
              <button
                type="button"
                className="admin__approve text-p2"
                onClick={handleChangePassword}
                disabled={
                  isPwSaving ||
                  !pwForm.old_password ||
                  pwForm.new_password.length < 8
                }
              >
                {isPwSaving ? "Сохранение..." : "Сменить пароль"}
              </button>
            </div>

            {pwMsg ? (
              <div className="admin-profile-page__msg text-p2">{pwMsg}</div>
            ) : null}
          </div>

          <div className="admin-profile-page__panel">
            <div className="admin-profile-page__section-title text-h4">
              Информация об аккаунте
            </div>

            <div className="admin-profile-page__info-list">
              <div className="admin-profile-page__info-row text-p2">
                <span className="admin-profile-page__info-label">Имя:</span>
                <span className="admin-profile-page__info-value">
                  {fullName}
                </span>
              </div>

              <div className="admin-profile-page__info-row text-p2">
                <span className="admin-profile-page__info-label">Роль:</span>
                <span className="admin-profile-page__info-value">
                  {userRole}
                </span>
              </div>

              <div className="admin-profile-page__info-row text-p2">
                <span className="admin-profile-page__info-label">Логин:</span>
                <span className="admin-profile-page__info-value">
                  {profile?.username || "—"}
                </span>
              </div>

              <div className="admin-profile-page__info-row text-p2">
                <span className="admin-profile-page__info-label">Email:</span>
                <span className="admin-profile-page__info-value">
                  {profile?.email || "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        title="Выйти из аккаунта?"
        description="Вы уверены, что хотите выйти из аккаунта администратора?"
        confirmText="Выйти"
        cancelText="Отмена"
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </section>
  );
}
