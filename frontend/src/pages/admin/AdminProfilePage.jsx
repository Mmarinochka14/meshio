import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/admin.css";
import "../../styles/admin-profile-page.css";

import ConfirmModal from "../../components/ConfirmModal";
import apiClient from "../../api/client";
import { isAuthenticated, logout } from "../../components/auth/authStore";
import {
  meRequest,
  updateProfileRequest,
  changePasswordRequest,
  updatePreferencesRequest,
} from "../../api/auth";
import { getAdminSupportRequests } from "../../api/support";

import profileIcon from "../../assets/icons/user.svg";
import notificationIcon from "../../assets/icons/notification.svg";
import settingsIcon from "../../assets/icons/settings.svg";
import logoutIcon from "../../assets/icons/logout.svg";
import moderationIcon from "../../assets/icons/models.svg";
import sellersIcon from "../../assets/icons/user.svg";
import requestsIcon from "../../assets/icons/comment.svg";

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
  if (p1.length === 3) out += ")";
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

  const [activeTab, setActiveTab] = useState("profile");

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
  const [settingsForm, setSettingsForm] = useState({
    dark_theme: true,
    compact_mode: false,
  });
  const [settingsMsg, setSettingsMsg] = useState("");

  const [stats, setStats] = useState({
    moderationCount: 0,
    sellerRequestsCount: 0,
    newSupportCount: 0,
  });

  const [statsLoading, setStatsLoading] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);

  const tabs = useMemo(
    () => [
      {
        key: "profile",
        label: "Профиль",
        icon: profileIcon,
      },
      {
        key: "notifications",
        label: "Уведомления",
        icon: notificationIcon,
      },
      {
        key: "settings",
        label: "Настройки",
        icon: settingsIcon,
      },
    ],
    [],
  );

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

      if (data?.preferences) {
        setSettingsForm({
          dark_theme: data.preferences.dark_theme,
          compact_mode: data.preferences.compact_mode,
        });
      }
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

  function toggleSettings(name) {
    setSettingsForm((prev) => ({ ...prev, [name]: !prev[name] }));
    setSettingsMsg("");
  }

  async function handleSaveSettings() {
    setSettingsMsg("");

    try {
      const preferences = await updatePreferencesRequest(settingsForm);
      setSettingsForm({
        dark_theme: preferences.dark_theme,
        compact_mode: preferences.compact_mode,
      });
      setSettingsMsg("Настройки сохранены");
    } catch (e) {
      setSettingsMsg("Не удалось сохранить настройки");
    }
  }

  async function handleDeleteAccount() {
    try {
      await apiClient.delete("/users/me/delete/");
      logout();
      navigate("/");
    } catch (e) {
      setSettingsMsg(
        e?.response?.data?.detail || "Не удалось удалить аккаунт.",
      );
    }
  }

  function handleConfirmLogout() {
    logout();
    navigate("/");
  }

  const userName = profile?.username || "Администратор";
  const avatarInitial = getInitial(profile?.username);

  if (isLoading) {
    return <div className="admin__state text-p2">Загрузка...</div>;
  }

  return (
    <section className="admin-account-page">
      <h1 className="admin-account-page__title text-h2">
        Личный кабинет
      </h1>

      <div className="admin-account-page__divider" />

      <div className="admin-account-page__mobile-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`admin-account-page__mobile-tab ${
              activeTab === tab.key ? "is-active" : ""
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="admin-account-page__layout">
        <aside className="admin-account-page__sidebar">
          <nav className="admin-account-page__menu">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`admin-account-page__menu-item ${
                  activeTab === tab.key ? "is-active" : ""
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                <img
                  src={tab.icon}
                  alt=""
                  className="admin-account-page__menu-icon"
                />
                <span className="text-p1">{tab.label}</span>
              </button>
            ))}

            <button
              type="button"
              className="admin-account-page__menu-logout text-p1"
              onClick={() => setIsLogoutModalOpen(true)}
            >
              <img
                src={logoutIcon}
                alt=""
                className="admin-account-page__menu-icon"
              />
              <span>Выйти</span>
            </button>
          </nav>
        </aside>

        <main className="admin-account-page__content">
          {activeTab === "profile" && (
            <div className="admin-account-page__card">
              <div className="admin-account-page__profile-head">
                <div className="admin-account-page__avatar text-h3">
                  {avatarInitial}
                </div>

                <div className="admin-account-page__profile-info">
                  <div className="admin-account-page__name text-h3">
                    {userName}
                  </div>

                  <div className="admin-account-page__email text-p1">
                    {profile?.email || "email@example.com"}
                  </div>

                  <div className="admin-account-page__role text-p2">
                    Администратор
                  </div>
                </div>
              </div>

              <div className="admin-account-page__stats-row">
                <Link to="/admin/products" className="admin-account-page__stat">
                  <span className="admin-account-page__stat-value text-h3">
                    {statsLoading ? "—" : stats.moderationCount}
                  </span>
                  <span className="admin-account-page__stat-label text-p3">
                    Товары
                  </span>
                </Link>

                <Link to="/admin/users" className="admin-account-page__stat">
                  <span className="admin-account-page__stat-value text-h3">
                    {statsLoading ? "—" : stats.sellerRequestsCount}
                  </span>
                  <span className="admin-account-page__stat-label text-p3">
                    Продавцы
                  </span>
                </Link>

                <Link to="/admin/requests" className="admin-account-page__stat">
                  <span className="admin-account-page__stat-value text-h3">
                    {statsLoading ? "—" : stats.newSupportCount}
                  </span>
                  <span className="admin-account-page__stat-label text-p3">
                    Обращения
                  </span>
                </Link>
              </div>

              <div className="admin-account-page__section-title text-p1">
                Данные аккаунта
              </div>

              <div className="admin-account-page__form">
                <label className="admin-account-page__field">
                  <span className="admin-account-page__label text-p3">
                    Никнейм
                  </span>
                  <input
                    className="admin-account-page__input text-p2"
                    value={form.username}
                    onChange={(e) => setField("username", e.target.value)}
                    maxLength={150}
                  />
                </label>

                <label className="admin-account-page__field">
                  <span className="admin-account-page__label text-p3">Имя</span>
                  <input
                    className="admin-account-page__input text-p2"
                    value={form.first_name}
                    onChange={(e) => setField("first_name", e.target.value)}
                  />
                </label>

                <label className="admin-account-page__field">
                  <span className="admin-account-page__label text-p3">
                    Фамилия
                  </span>
                  <input
                    className="admin-account-page__input text-p2"
                    value={form.last_name}
                    onChange={(e) => setField("last_name", e.target.value)}
                  />
                </label>

                <label className="admin-account-page__field">
                  <span className="admin-account-page__label text-p3">
                    Отчество
                  </span>
                  <input
                    className="admin-account-page__input text-p2"
                    value={form.middle_name}
                    onChange={(e) => setField("middle_name", e.target.value)}
                  />
                </label>

                <label className="admin-account-page__field">
                  <span className="admin-account-page__label text-p3">
                    Электронная почта
                  </span>
                  <input
                    type="email"
                    className="admin-account-page__input text-p2"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    placeholder="name@example.com"
                  />
                </label>

                <label className="admin-account-page__field">
                  <span className="admin-account-page__label text-p3">
                    Телефон
                  </span>
                  <input
                    className="admin-account-page__input text-p2"
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

              <div className="admin-account-page__actions">
                <button
                  type="button"
                  className="admin-account-page__save text-p2"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                >
                  {isSaving ? "Сохранение..." : "Сохранить"}
                </button>
              </div>

              {saveMsg ? (
                <div className="admin-account-page__msg text-p2">{saveMsg}</div>
              ) : null}

              <div className="admin-account-page__section-title text-p1">
                Смена пароля
              </div>

              <div className="admin-account-page__form admin-account-page__form--stack">
                <label className="admin-account-page__field">
                  <span className="admin-account-page__label text-p3">
                    Старый пароль
                  </span>
                  <input
                    type="password"
                    className="admin-account-page__input text-p2"
                    value={pwForm.old_password}
                    onChange={(e) => setPwField("old_password", e.target.value)}
                    placeholder="Введите старый пароль"
                  />
                </label>

                <label className="admin-account-page__field">
                  <span className="admin-account-page__label text-p3">
                    Новый пароль
                  </span>
                  <input
                    type="password"
                    className="admin-account-page__input text-p2"
                    value={pwForm.new_password}
                    onChange={(e) => setPwField("new_password", e.target.value)}
                    placeholder="Минимум 8 символов"
                  />
                </label>
              </div>

              <div className="admin-account-page__actions">
                <button
                  type="button"
                  className="admin-account-page__save text-p2"
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
                <div className="admin-account-page__msg text-p2">{pwMsg}</div>
              ) : null}
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="admin-account-page__card">
              <div className="admin-account-page__card-title text-h3">
                Уведомления
              </div>

              <div className="admin-account-page__notifications">
                <Link
                  to="/admin/products"
                  className="admin-account-page__notification-card"
                >
                  <div className="admin-account-page__notification-icon-wrap">
                    <img
                      src={moderationIcon}
                      alt=""
                      className="admin-account-page__notification-icon"
                    />
                  </div>

                  <div className="admin-account-page__notification-info">
                    <div className="admin-account-page__notification-title text-p1">
                      Товары на проверке
                    </div>
                    <div className="admin-account-page__notification-text text-p2">
                      Модели, которые продавцы отправили на модерацию перед
                      публикацией.
                    </div>
                  </div>
                </Link>

                <Link
                  to="/admin/users"
                  className="admin-account-page__notification-card"
                >
                  <div className="admin-account-page__notification-icon-wrap">
                    <img
                      src={sellersIcon}
                      alt=""
                      className="admin-account-page__notification-icon"
                    />
                  </div>

                  <div className="admin-account-page__notification-info">
                    <div className="admin-account-page__notification-title text-p1">
                      Заявки продавцов
                    </div>
                    <div className="admin-account-page__notification-text text-p2">
                      Пользователи, ожидающие подтверждения роли продавца.
                    </div>
                  </div>
                </Link>

                <Link
                  to="/admin/requests"
                  className="admin-account-page__notification-card"
                >
                  <div className="admin-account-page__notification-icon-wrap">
                    <img
                      src={requestsIcon}
                      alt=""
                      className="admin-account-page__notification-icon"
                    />
                  </div>

                  <div className="admin-account-page__notification-info">
                    <div className="admin-account-page__notification-title text-p1">
                      Новые обращения
                    </div>
                    <div className="admin-account-page__notification-text text-p2">
                      Сообщения пользователей, на которые нужно ответить.
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="admin-account-page__card admin-account-page__card--narrow">
              <div className="admin-account-page__card-title text-h3">
                Настройки
              </div>

              <div className="admin-account-page__toggles">
                <div className="admin-account-page__toggle-row">
                  <div>
                    <div className="admin-account-page__toggle-title text-p2">
                      Темная тема
                    </div>
                    <div className="admin-account-page__muted text-p3">
                      Основной режим интерфейса
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`admin-account-page__switch ${
                      settingsForm.dark_theme ? "is-on" : ""
                    }`}
                    onClick={() => toggleSettings("dark_theme")}
                  >
                    <span className="admin-account-page__switch-dot" />
                  </button>
                </div>

                <div className="admin-account-page__toggle-row">
                  <div>
                    <div className="admin-account-page__toggle-title text-p2">
                      Компактное отображение
                    </div>
                    <div className="admin-account-page__muted text-p3">
                      Более плотное отображение рабочих блоков
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`admin-account-page__switch ${
                      settingsForm.compact_mode ? "is-on" : ""
                    }`}
                    onClick={() => toggleSettings("compact_mode")}
                  >
                    <span className="admin-account-page__switch-dot" />
                  </button>
                </div>
              </div>

              <div className="admin-account-page__actions admin-account-page__actions--left">
                <button
                  type="button"
                  className="admin-account-page__save text-p2"
                  onClick={handleSaveSettings}
                >
                  Сохранить настройки
                </button>
              </div>

              {settingsMsg ? (
                <div className="admin-account-page__msg text-p2">{settingsMsg}</div>
              ) : null}

              <div className="admin-account-page__danger-zone">
                <div className="admin-account-page__danger-title text-p2">
                  Опасная зона
                </div>
                <div className="admin-account-page__muted text-p3">
                  Удаление аккаунта необратимо.
                </div>

                <button
                  type="button"
                  className="admin-account-page__danger-btn text-p2"
                  onClick={() => setIsDeleteAccountModalOpen(true)}
                >
                  Удалить аккаунт
                </button>
              </div>
            </div>
          )}
        </main>
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

      <ConfirmModal
        isOpen={isDeleteAccountModalOpen}
        title="Удалить аккаунт?"
        description="Это действие необратимо. Все данные аккаунта будут удалены."
        confirmText="Удалить"
        cancelText="Отмена"
        danger
        onClose={() => setIsDeleteAccountModalOpen(false)}
        onConfirm={handleDeleteAccount}
      />
    </section>
  );
}
