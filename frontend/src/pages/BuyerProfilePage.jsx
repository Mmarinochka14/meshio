import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/buyer-profile-page.css";
import { buildMediaUrl, buildProductMediaProxyUrl } from "../api/url";

import downloadIcon from "../assets/icons/download.svg";
import profileIcon from "../assets/icons/user.svg";
import purchasesIcon from "../assets/icons/models.svg";
import supportIcon from "../assets/icons/comment.svg";
import notificationsIcon from "../assets/icons/notification.svg";
import paymentsIcon from "../assets/icons/card.svg";
import settingsIcon from "../assets/icons/settings.svg";
import logoutIcon from "../assets/icons/logout.svg";

import { getMySupportRequests } from "../api/support";

import sbpIcon from "../assets/icons/sbp.svg";
import sberpayIcon from "../assets/icons/sberpay.svg";
import mirIcon from "../assets/icons/mir.svg";
import bankCardIcon from "../assets/icons/card.svg";
import uploadIcon from "../assets/icons/upload.svg";
import trashIcon from "../assets/icons/delete.svg";

import ConfirmModal from "../components/ConfirmModal";
import AddCardModal from "../components/AddCardModal";

import { isAuthenticated, logout } from "../components/auth/authStore";
import {
  meRequest,
  updateProfileRequest,
  changePasswordRequest,
  getNotificationsRequest,
  markNotificationReadRequest,
  updatePreferencesRequest,
} from "../api/auth";
import { downloadProduct, getMyPurchasedProducts } from "../api/products";
import apiClient from "../api/client";

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
  if (!username) return "M";
  return username[0].toUpperCase();
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function normalizePreview(url, productId = null) {
  if (productId) {
    return buildProductMediaProxyUrl(productId, "thumbnail");
  }

  return buildMediaUrl(url);
}

function formatSupportStatus(status) {
  if (status === "new") return "Новое";
  if (status === "in_progress") return "В работе";
  if (status === "done") return "Обработано";
  return "—";
}

export default function BuyerProfilePage({ onOpenSellerModal }) {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [supportRequests, setSupportRequests] = useState([]);
  const [supportLoading, setSupportLoading] = useState(false);

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
  const [generalMsg, setGeneralMsg] = useState("");

  const [pwForm, setPwForm] = useState({
    old_password: "",
    new_password: "",
  });
  const [isPwSaving, setIsPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState("");

  const [purchases, setPurchases] = useState([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);

  const [notificationsForm, setNotificationsForm] = useState({
    sms_notifications: true,
    search_preferences: false,
  });
  const [notificationsMsg, setNotificationsMsg] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState([
    { id: "sbp", label: "СБП •• 5691", active: true, icon: sbpIcon },
    {
      id: "sber",
      label: "SberPay •• 5691",
      active: false,
      icon: sberpayIcon,
    },
    { id: "mir", label: "МИР •• 5691", active: false, icon: mirIcon },
  ]);
  const [paymentsMsg, setPaymentsMsg] = useState("");

  const fileInputRef = useRef(null);

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] =
    useState(false);
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState("");

  const [settingsForm, setSettingsForm] = useState({
    dark_theme: true,
    compact_mode: false,
  });
  const [settingsMsg, setSettingsMsg] = useState("");

  const tabs = useMemo(
    () => [
      { key: "profile", label: "Профиль", icon: profileIcon },
      {
        key: "purchases",
        label: "История покупок",
        icon: purchasesIcon,
      },
      {
        key: "support",
        label: "Поддержка",
        icon: supportIcon,
      },
      {
        key: "notifications",
        label: "Уведомления",
        icon: notificationsIcon,
      },
      {
        key: "payments",
        label: "Способы оплаты",
        icon: paymentsIcon,
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

    async function load() {
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
          setNotificationsForm({
            sms_notifications: data.preferences.sms_notifications,
            search_preferences: data.preferences.search_preferences,
          });
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

    load();
  }, [navigate]);

  useEffect(() => {
    if (activeTab !== "support") return;

    let mounted = true;

    async function loadSupport() {
      try {
        setSupportLoading(true);
        const data = await getMySupportRequests();
        const items = Array.isArray(data?.results) ? data.results : [];

        if (!mounted) return;
        setSupportRequests(items);
      } catch (e) {
        if (!mounted) return;
        setSupportRequests([]);
      } finally {
        if (mounted) setSupportLoading(false);
      }
    }

    loadSupport();

    return () => {
      mounted = false;
    };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "notifications") return;

    let mounted = true;

    async function loadNotifications() {
      try {
        setNotificationsLoading(true);
        const data = await getNotificationsRequest();
        const items = Array.isArray(data?.results) ? data.results : data;
        if (!mounted) return;
        setNotifications(Array.isArray(items) ? items : []);
      } catch (e) {
        if (!mounted) return;
        setNotifications([]);
      } finally {
        if (mounted) setNotificationsLoading(false);
      }
    }

    loadNotifications();

    return () => {
      mounted = false;
    };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "purchases") return;

    let mounted = true;

    async function loadPurchases() {
      try {
        setPurchasesLoading(true);
        const data = await getMyPurchasedProducts();
        if (!mounted) return;

        const items = Array.isArray(data?.results) ? data.results : [];
        setPurchases(items);
      } catch (e) {
        if (!mounted) return;
        setPurchases([]);
      } finally {
        if (mounted) setPurchasesLoading(false);
      }
    }

    loadPurchases();

    return () => {
      mounted = false;
    };
  }, [activeTab]);

  function setField(name, value) {
    setForm((p) => ({ ...p, [name]: value }));
    setSaveMsg("");
  }

  function setPwField(name, value) {
    setPwForm((p) => ({ ...p, [name]: value }));
    setPwMsg("");
  }

  function toggleNotification(name) {
    setNotificationsForm((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
    setNotificationsMsg("");
  }

  async function handleSaveProfile() {
    setSaveMsg("");
    setIsSaving(true);

    try {
      const payload = {
        username: form.username,
        first_name: form.first_name,
        last_name: form.last_name,
        middle_name: form.middle_name,
        email: form.email,
        phone: form.phone,
      };

      const updated = await updateProfileRequest(payload);
      setProfile(updated);
      setSaveMsg("");
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
      setPwMsg("");
      setPwForm({ old_password: "", new_password: "" });
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

  async function handleDownload(productId) {
    setGeneralMsg("");

    try {
      const data = await downloadProduct(productId);
      const url = data?.download_url;
      if (url) {
        window.location.href = url;
      }
    } catch (e) {
      setGeneralMsg("Не удалось скачать модель.");
    }
  }

  function handleRemovePayment(id) {
    setPaymentMethods((prev) => prev.filter((item) => item.id !== id));
    setPaymentsMsg("");
  }

  function handleSetActivePayment(id) {
    setPaymentMethods((prev) =>
      prev.map((item) => ({
        ...item,
        active: item.id === id,
      })),
    );
    setPaymentsMsg("");
  }

  function handleSavePayments() {
    setPaymentsMsg("");
  }

  async function handleSaveNotifications() {
    setNotificationsMsg("");
    try {
      const preferences = await updatePreferencesRequest(notificationsForm);
      setNotificationsForm({
        sms_notifications: preferences.sms_notifications,
        search_preferences: preferences.search_preferences,
      });
      setNotificationsMsg("Настройки уведомлений сохранены");
    } catch (e) {
      setNotificationsMsg("Не удалось сохранить настройки уведомлений");
    }
  }

  function toggleSettings(name) {
    setSettingsForm((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
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

  async function handleReadNotification(item) {
    try {
      const updated = await markNotificationReadRequest(item.id);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === item.id ? updated : notification,
        ),
      );
    } catch (e) {
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === item.id
            ? { ...notification, is_read: true }
            : notification,
        ),
      );
    }

    if (item.link) {
      navigate(item.link);
    }
  }

  async function handleAvatarUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setAvatarUploading(true);
      setAvatarMsg("");

      const formData = new FormData();
      formData.append("file", file);

      const res = await apiClient.post("/users/me/upload-avatar/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const nextProfile = res?.data?.profile;
      if (nextProfile) {
        setProfile(nextProfile);
      }

      setAvatarMsg("");
    } catch (e) {
      setAvatarMsg(e?.response?.data?.detail || "Не удалось загрузить аватар");
    } finally {
      setAvatarUploading(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  }

  async function handleDeleteAvatar() {
    try {
      setAvatarUploading(true);
      setAvatarMsg("");

      const res = await apiClient.delete("/users/me/delete-avatar/");
      const nextProfile = res?.data?.profile;
      if (nextProfile) {
        setProfile(nextProfile);
      }

      setAvatarMsg("");
    } catch (e) {
      setAvatarMsg(e?.response?.data?.detail || "Не удалось удалить аватар");
    } finally {
      setAvatarUploading(false);
    }
  }

  function handleOpenFilePicker() {
    fileInputRef.current?.click();
  }

  function handleAddCard(cardData) {
    const last4 = cardData.number.replace(/\D/g, "").slice(-4) || "0000";
    const brand = cardData.brand || "card";

    const iconMap = {
      sbp: sbpIcon,
      sber: sberpayIcon,
      mir: mirIcon,
      card: bankCardIcon,
    };

    const labelMap = {
      sbp: `СБП •• ${last4}`,
      sber: `SberPay •• ${last4}`,
      mir: `МИР •• ${last4}`,
      card: `Карта •• ${last4}`,
    };

    setPaymentMethods((prev) => [
      ...prev.map((item) => ({ ...item, active: false })),
      {
        id: `card-${Date.now()}`,
        label: labelMap[brand] || `Карта •• ${last4}`,
        active: true,
        icon: iconMap[brand] || bankCardIcon,
      },
    ]);

    setPaymentsMsg("");
    setIsAddCardModalOpen(false);
  }

  function handleConfirmLogout() {
    logout();
    navigate("/");
  }

  async function handleDeleteAccount() {
    setGeneralMsg("");

    try {
      await apiClient.delete("/users/me/delete/");
      logout();
      navigate("/");
    } catch (e) {
      setGeneralMsg(
        e?.response?.data?.detail ||
          "Удаление аккаунта пока не подключено на бэке",
      );
    }
  }

  const userName = profile?.username || "Профиль";
  const isSellerProfile = profile?.role === "seller";
  const userRole = profile?.role === "seller" ? "Продавец" : "Покупатель";
  const avatarInitial = getInitial(profile?.username);
  const avatarUrl = profile?.avatar_url || "";

  return (
    <section className="buyer-profile-page">
      <div className="buyer-profile-page__container">
        <h1 className="buyer-profile-page__title text-h2">Личный кабинет</h1>
        <div className="buyer-profile-page__divider" />

        {generalMsg ? (
          <div className="buyer-profile-page__notice text-p2">
            {generalMsg}
          </div>
        ) : null}

        <div className="buyer-profile-page__mobile-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`buyer-profile-page__mobile-tab ${
                activeTab === tab.key ? "is-active" : ""
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="buyer-profile-page__layout">
          <aside className="buyer-profile-page__sidebar">
            <nav className="buyer-profile-page__menu">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`buyer-profile-page__menu-item ${
                    activeTab === tab.key ? "is-active" : ""
                  }`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <img
                    src={tab.icon}
                    alt=""
                    className="buyer-profile-page__menu-icon"
                  />
                  <span className="text-p2">{tab.label}</span>
                </button>
              ))}

              {!isSellerProfile ? (
                <button
                  type="button"
                  className="buyer-profile-page__menu-cta text-p2"
                  onClick={onOpenSellerModal}
                >
                  Стать продавцом
                </button>
              ) : null}

              <button
                type="button"
                className="buyer-profile-page__menu-logout text-p2"
                onClick={() => setIsLogoutModalOpen(true)}
              >
                <img
                  src={logoutIcon}
                  alt=""
                  className="buyer-profile-page__menu-icon"
                />
                <span>Выйти</span>
              </button>
            </nav>
          </aside>

          <main className="buyer-profile-page__content">
            {isLoading ? (
              <div className="page-state">Загрузка…</div>
            ) : (
              <>
                {activeTab === "profile" && (
                  <div className="buyer-profile-page__card">
                    <div className="buyer-profile-page__profile-head">
                      <div className="buyer-profile-page__avatar-wrap">
                        <div className="buyer-profile-page__avatar text-h3">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={userName}
                              className="buyer-profile-page__avatar-image"
                            />
                          ) : (
                            avatarInitial
                          )}
                        </div>

                        <div className="buyer-profile-page__avatar-actions">
                          <button
                            type="button"
                            className="buyer-profile-page__avatar-btn"
                            onClick={handleOpenFilePicker}
                            disabled={avatarUploading}
                            title="Загрузить аватар"
                          >
                            <img src={uploadIcon} alt="" />
                          </button>

                          <button
                            type="button"
                            className="buyer-profile-page__avatar-btn"
                            onClick={handleDeleteAvatar}
                            disabled={avatarUploading}
                            title="Удалить аватар"
                          >
                            <img src={trashIcon} alt="" />
                          </button>

                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="buyer-profile-page__avatar-input"
                            onChange={handleAvatarUpload}
                          />
                        </div>
                      </div>

                      <div className="buyer-profile-page__profile-info">
                        <div className="text-h3 buyer-profile-page__name">
                          {userName}
                        </div>
                        <div className="text-p2 buyer-profile-page__email">
                          {profile?.email || "email@example.com"}
                        </div>
                        <div className="text-p2 buyer-profile-page__role">
                          {userRole}
                        </div>

                        {!isSellerProfile ? (
                          <button
                            type="button"
                            className="buyer-profile-page__small-btn text-p2"
                            onClick={onOpenSellerModal}
                          >
                            Стать продавцом
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {avatarMsg ? (
                      <div className="buyer-profile-page__save-msg text-p2">
                        {avatarMsg}
                      </div>
                    ) : null}

                    <div className="buyer-profile-page__section-title text-p1">
                      Редактировать учетную запись
                    </div>

                    <div className="buyer-profile-page__form">
                      <label className="buyer-profile-page__field">
                        <span className="buyer-profile-page__label text-p3">
                          Никнейм
                        </span>
                        <input
                          className="buyer-profile-page__input text-p2"
                          value={form.username}
                          onChange={(e) => setField("username", e.target.value)}
                          maxLength={150}
                        />
                      </label>

                      <label className="buyer-profile-page__field">
                        <span className="buyer-profile-page__label text-p3">
                          Имя
                        </span>
                        <input
                          className="buyer-profile-page__input text-p2"
                          value={form.first_name}
                          onChange={(e) =>
                            setField("first_name", e.target.value)
                          }
                        />
                      </label>

                      <label className="buyer-profile-page__field">
                        <span className="buyer-profile-page__label text-p3">
                          Электронная почта
                        </span>
                        <input
                          type="email"
                          className="buyer-profile-page__input text-p2"
                          value={form.email}
                          onChange={(e) => setField("email", e.target.value)}
                          placeholder="name@example.com"
                        />
                      </label>

                      <label className="buyer-profile-page__field">
                        <span className="buyer-profile-page__label text-p3">
                          Фамилия
                        </span>
                        <input
                          className="buyer-profile-page__input text-p2"
                          value={form.last_name}
                          onChange={(e) =>
                            setField("last_name", e.target.value)
                          }
                        />
                      </label>

                      <label className="buyer-profile-page__field">
                        <span className="buyer-profile-page__label text-p3">
                          Отчество
                        </span>
                        <input
                          className="buyer-profile-page__input text-p2"
                          value={form.middle_name}
                          onChange={(e) =>
                            setField("middle_name", e.target.value)
                          }
                        />
                      </label>

                      <label className="buyer-profile-page__field">
                        <span className="buyer-profile-page__label text-p3">
                          Телефон
                        </span>
                        <input
                          className="buyer-profile-page__input text-p2"
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

                    <div className="buyer-profile-page__actions">
                      <button
                        type="button"
                        className="buyer-profile-page__save text-p2"
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                      >
                        {isSaving ? "Сохранение..." : "Сохранить"}
                      </button>
                    </div>

                    {saveMsg && (
                      <div className="buyer-profile-page__save-msg text-p2">
                        {saveMsg}
                      </div>
                    )}

                    <div className="buyer-profile-page__section-title text-p1">
                      Смена пароля
                    </div>

                    <div className="buyer-profile-page__form buyer-profile-page__form--password">
                      <label className="buyer-profile-page__field">
                        <span className="buyer-profile-page__label text-p3">
                          Старый пароль
                        </span>
                        <input
                          type="password"
                          className="buyer-profile-page__input text-p2"
                          value={pwForm.old_password}
                          onChange={(e) =>
                            setPwField("old_password", e.target.value)
                          }
                          placeholder="Введите старый пароль"
                        />
                      </label>

                      <label className="buyer-profile-page__field">
                        <span className="buyer-profile-page__label text-p3">
                          Новый пароль
                        </span>
                        <input
                          type="password"
                          className="buyer-profile-page__input text-p2"
                          value={pwForm.new_password}
                          onChange={(e) =>
                            setPwField("new_password", e.target.value)
                          }
                          placeholder="Минимум 8 символов"
                        />
                      </label>
                    </div>

                    <div className="buyer-profile-page__actions">
                      <button
                        type="button"
                        className="buyer-profile-page__save text-p2"
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

                    {pwMsg && (
                      <div className="buyer-profile-page__save-msg text-p2">
                        {pwMsg}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "purchases" && (
                  <div className="buyer-profile-page__card">
                    <div className="text-h3 buyer-profile-page__card-title">
                      История покупок
                    </div>

                    {purchasesLoading ? (
                      <div className="buyer-profile-page__muted text-p2">
                        Загрузка покупок...
                      </div>
                    ) : purchases.length === 0 ? (
                      <div className="buyer-profile-page__muted text-p2">
                        У вас пока нет покупок.
                      </div>
                    ) : (
                      <div className="buyer-profile-page__list">
                        {purchases.map((item) => {
                          const product = item.product || {};
                          const previewSrc = normalizePreview(
                            product.thumbnail_url || product.main_preview_url,
                            product.id,
                          );

                          return (
                            <div
                              key={item.id}
                              className="buyer-profile-page__purchase"
                            >
                              <div className="buyer-profile-page__purchase-left">
                                <div className="buyer-profile-page__purchase-thumb">
                                  {previewSrc ? (
                                    <img
                                      src={previewSrc}
                                      alt={product.title || "Модель"}
                                      className="buyer-profile-page__purchase-thumb-image"
                                      loading="lazy"
                                      decoding="async"
                                    />
                                  ) : null}
                                </div>

                                <div>
                                  <div className="buyer-profile-page__purchase-name text-p2">
                                    {product.title || "Название модели"}
                                  </div>
                                  <div className="buyer-profile-page__purchase-sub text-p3">
                                    {formatDate(item.created_at)} •{" "}
                                    {Number(item.price_at_purchase || 0)} ₽
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                className="buyer-profile-page__download text-p2"
                                onClick={() => handleDownload(product.id)}
                              >
                                <img
                                  src={downloadIcon}
                                  alt=""
                                  className="buyer-profile-page__download-icon"
                                />
                                <span>Скачать</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "support" && (
                  <div className="buyer-profile-page__card">
                    <div className="text-h3 buyer-profile-page__card-title">
                      Поддержка
                    </div>

                    {supportLoading ? (
                      <div className="page-state">Загрузка…</div>
                    ) : supportRequests.length === 0 ? (
                      <div className="buyer-profile-page__muted text-p2">
                        У вас пока нет обращений в поддержку.
                      </div>
                    ) : (
                      <div className="buyer-profile-page__support-list">
                        {supportRequests.map((item) => (
                          <div
                            key={item.id}
                            className="buyer-profile-page__support-item"
                          >
                            <div className="buyer-profile-page__support-top">
                              <div>
                                <div className="buyer-profile-page__support-subject text-p2">
                                  {item.subject || "Без темы"}
                                </div>
                                <div className="buyer-profile-page__support-date text-p3">
                                  {new Date(item.created_at).toLocaleString(
                                    "ru-RU",
                                  )}
                                </div>
                              </div>

                              <div className="buyer-profile-page__support-status text-p3">
                                {formatSupportStatus(item.status)}
                              </div>
                            </div>

                            <div className="buyer-profile-page__support-message text-p2">
                              {item.message}
                            </div>

                            {item.admin_reply ? (
                              <div className="buyer-profile-page__support-reply">
                                <div className="buyer-profile-page__support-reply-title text-p3">
                                  Ответ поддержки
                                </div>
                                <div className="buyer-profile-page__support-reply-text text-p2">
                                  {item.admin_reply}
                                </div>
                              </div>
                            ) : (
                              <div className="buyer-profile-page__support-waiting text-p3">
                                Ответа пока нет
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "notifications" && (
                  <div className="buyer-profile-page__card buyer-profile-page__card--narrow">
                    <div className="text-h3 buyer-profile-page__card-title">
                      Уведомления
                    </div>

                    <div className="buyer-profile-page__notification-list">
                      {notificationsLoading ? (
                        <div className="buyer-profile-page__muted text-p2">
                          Загрузка уведомлений...
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="buyer-profile-page__muted text-p2">
                          Новых уведомлений пока нет.
                        </div>
                      ) : (
                        notifications.slice(0, 5).map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className={`buyer-profile-page__notification ${
                              item.is_read ? "is-read" : ""
                            }`}
                            onClick={() => handleReadNotification(item)}
                          >
                            <span className="buyer-profile-page__notification-main">
                              <span className="buyer-profile-page__notification-title text-p2">
                                {item.title}
                              </span>
                              <span className="buyer-profile-page__notification-text text-p3">
                                {item.message || formatDate(item.created_at)}
                              </span>
                            </span>
                            <span className="buyer-profile-page__notification-date text-p3">
                              {formatDate(item.created_at)}
                            </span>
                          </button>
                        ))
                      )}
                    </div>

                    <div className="buyer-profile-page__toggles">
                      <div className="buyer-profile-page__toggle-row">
                        <div>
                          <div className="text-p2 buyer-profile-page__toggle-title">
                            Получать СМС-рассылки
                          </div>
                          <div className="text-p3 buyer-profile-page__muted">
                            {form.phone || "+7 906 912-54-87"}
                          </div>
                        </div>

                        <button
                          type="button"
                          className={`buyer-profile-page__switch ${
                            notificationsForm.sms_notifications ? "is-on" : ""
                          }`}
                          onClick={() =>
                            toggleNotification("sms_notifications")
                          }
                        >
                          <span className="buyer-profile-page__switch-dot" />
                        </button>
                      </div>

                      <div className="buyer-profile-page__toggle-row">
                        <div>
                          <div className="text-p2 buyer-profile-page__toggle-title">
                            Учитывать предпочтения
                          </div>
                          <div className="text-p3 buyer-profile-page__muted">
                            в результатах поиска
                          </div>
                        </div>

                        <button
                          type="button"
                          className={`buyer-profile-page__switch ${
                            notificationsForm.search_preferences ? "is-on" : ""
                          }`}
                          onClick={() =>
                            toggleNotification("search_preferences")
                          }
                        >
                          <span className="buyer-profile-page__switch-dot" />
                        </button>
                      </div>
                    </div>

                    <div className="buyer-profile-page__actions buyer-profile-page__actions--left">
                      <button
                        type="button"
                        className="buyer-profile-page__save text-p2"
                        onClick={handleSaveNotifications}
                      >
                        Сохранить
                      </button>
                    </div>

                    {notificationsMsg && (
                      <div className="buyer-profile-page__save-msg text-p2">
                        {notificationsMsg}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "payments" && (
                  <div className="buyer-profile-page__card buyer-profile-page__card--narrow">
                    <div className="text-h3 buyer-profile-page__card-title">
                      Способы оплаты
                    </div>

                    <div className="buyer-profile-page__payment-list">
                      {paymentMethods.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={`buyer-profile-page__payment ${
                            item.active ? "is-active" : ""
                          }`}
                          onClick={() => handleSetActivePayment(item.id)}
                        >
                          <span className="buyer-profile-page__payment-left">
                            <img
                              src={item.icon}
                              alt=""
                              className="buyer-profile-page__payment-icon"
                            />
                            <span className="text-p2">{item.label}</span>
                          </span>

                          <span
                            className="buyer-profile-page__x"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePayment(item.id);
                            }}
                          >
                            ×
                          </span>
                        </button>
                      ))}

                      <button
                        type="button"
                        className="buyer-profile-page__payment"
                        onClick={() => setIsAddCardModalOpen(true)}
                      >
                        <span className="buyer-profile-page__payment-left">
                          <img
                            src={bankCardIcon}
                            alt=""
                            className="buyer-profile-page__payment-icon"
                          />
                          <span className="text-p2">Добавить карту</span>
                        </span>
                        <span className="buyer-profile-page__arrow">›</span>
                      </button>
                    </div>

                    <div className="buyer-profile-page__actions buyer-profile-page__actions--left">
                      <button
                        type="button"
                        className="buyer-profile-page__save text-p2"
                        onClick={handleSavePayments}
                      >
                        Сохранить
                      </button>
                    </div>

                    {paymentsMsg && (
                      <div className="buyer-profile-page__save-msg text-p2">
                        {paymentsMsg}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "settings" && (
                  <div className="buyer-profile-page__card buyer-profile-page__card--narrow">
                    <div className="text-h3 buyer-profile-page__card-title">
                      Настройки
                    </div>

                    <div className="buyer-profile-page__toggles">
                      <div className="buyer-profile-page__toggle-row">
                        <div>
                          <div className="text-p2 buyer-profile-page__toggle-title">
                            Тёмная тема
                          </div>
                          <div className="text-p3 buyer-profile-page__muted">
                            Основной режим интерфейса
                          </div>
                        </div>

                        <button
                          type="button"
                          className={`buyer-profile-page__switch ${
                            settingsForm.dark_theme ? "is-on" : ""
                          }`}
                          onClick={() => toggleSettings("dark_theme")}
                        >
                          <span className="buyer-profile-page__switch-dot" />
                        </button>
                      </div>

                      <div className="buyer-profile-page__toggle-row">
                        <div>
                          <div className="text-p2 buyer-profile-page__toggle-title">
                            Компактный режим
                          </div>
                          <div className="text-p3 buyer-profile-page__muted">
                            Более плотное отображение блоков
                          </div>
                        </div>

                        <button
                          type="button"
                          className={`buyer-profile-page__switch ${
                            settingsForm.compact_mode ? "is-on" : ""
                          }`}
                          onClick={() => toggleSettings("compact_mode")}
                        >
                          <span className="buyer-profile-page__switch-dot" />
                        </button>
                      </div>
                    </div>

                    <div className="buyer-profile-page__actions buyer-profile-page__actions--left">
                      <button
                        type="button"
                        className="buyer-profile-page__save text-p2"
                        onClick={handleSaveSettings}
                      >
                        Сохранить
                      </button>
                    </div>

                    {settingsMsg && (
                      <div className="buyer-profile-page__save-msg text-p2">
                        {settingsMsg}
                      </div>
                    )}

                    <div className="buyer-profile-page__danger-zone">
                      <div className="buyer-profile-page__danger-title text-p2">
                        Опасная зона
                      </div>
                      <div className="buyer-profile-page__muted text-p3">
                        Удаление аккаунта необратимо.
                      </div>

                      <button
                        type="button"
                        className="buyer-profile-page__danger-btn text-p2"
                        onClick={() => setIsDeleteAccountModalOpen(true)}
                      >
                        Удалить аккаунт
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        title="Выйти из аккаунта?"
        description="Вы уверены, что хотите выйти из аккаунта?"
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

      <AddCardModal
        isOpen={isAddCardModalOpen}
        onClose={() => setIsAddCardModalOpen(false)}
        onSubmit={handleAddCard}
      />
    </section>
  );
}
