import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/seller-profile-page.css";
import "../styles/profile-shared.css";

import ConfirmModal from "../components/ConfirmModal";
import SellerAnalyticsPanel from "../components/SellerAnalyticsPanel";
import ProfileTabBanner from "../components/ProfileTabBanner";
import ProfileMenuSection from "../components/ProfileMenuSection";

import userIcon from "../assets/icons/user.svg";
import analyticsIcon from "../assets/icons/analytics.svg";
import notificationIcon from "../assets/icons/notification.svg";
import settingsIcon from "../assets/icons/settings.svg";
import logoutIcon from "../assets/icons/logout.svg";

import { isAuthenticated, logout } from "../components/auth/authStore";
import {
  meRequest,
  updateProfileRequest,
  changePasswordRequest,
  deleteSellerAvatarRequest,
  deleteSellerBannerRequest,
  updateSellerProfileRequest,
  getMySellerProfileRequest,
  uploadSellerAvatarRequest,
  uploadSellerBannerRequest,
} from "../api/auth";

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

export default function SellerProfilePage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("profile");

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    middle_name: "",
    email: "",
    phone: "",
  });

  const [storeForm, setStoreForm] = useState({
    store_name: "",
    store_description: "",
  });

  const [pwForm, setPwForm] = useState({
    old_password: "",
    new_password: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isPwSaving, setIsPwSaving] = useState(false);
  const [mediaUploading, setMediaUploading] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const tabs = useMemo(
    () => [
      { key: "profile", label: "Профиль", icon: userIcon, section: "Основное" },
      { key: "analytics", label: "Аналитика", icon: analyticsIcon, section: "Управление" },
      { key: "notifications", label: "Уведомления", icon: notificationIcon, section: "Коммуникация" },
      { key: "settings", label: "Настройки", icon: settingsIcon, section: "Коммуникация" },
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

        const userData = await meRequest();
        setProfile(userData);

        setForm({
          first_name: userData?.first_name || "",
          last_name: userData?.last_name || "",
          middle_name: userData?.middle_name || "",
          email: userData?.email || "",
          phone: userData?.phone ? formatRuPhone(userData.phone) : "",
        });

        try {
          const sellerData = await getMySellerProfileRequest();

          setStoreForm({
            store_name: sellerData?.store_name || "",
            store_description: sellerData?.store_description || "",
          });

          setProfile((prev) => ({
            ...prev,
            seller_profile: sellerData,
          }));
        } catch (sellerError) {
          setStoreForm({
            store_name: "",
            store_description: "",
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

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setSaveMsg("");
  }

  function setStoreField(name, value) {
    setStoreForm((prev) => ({ ...prev, [name]: value }));
    setSaveMsg("");
  }

  function setPwField(name, value) {
    setPwForm((prev) => ({ ...prev, [name]: value }));
    setPwMsg("");
  }

  function handleLogout() {
    setIsLogoutModalOpen(true);
  }

  function handleConfirmLogout() {
    logout();
    navigate("/");
  }

  async function handleSaveProfile() {
    setSaveMsg("");
    setIsSaving(true);

    try {
      const updatedUser = await updateProfileRequest({
        first_name: form.first_name,
        last_name: form.last_name,
        middle_name: form.middle_name,
        email: form.email,
        phone: form.phone,
      });

      let updatedSellerProfile = null;

      try {
        updatedSellerProfile = await updateSellerProfileRequest({
          store_name: storeForm.store_name,
          store_description: storeForm.store_description,
        });
      } catch (sellerError) {
        updatedSellerProfile = null;
      }

      setProfile((prev) => ({
        ...prev,
        ...updatedUser,
        seller_profile: updatedSellerProfile || prev?.seller_profile,
      }));

      setSaveMsg(
        updatedSellerProfile
          ? "Профиль и магазин сохранены"
          : "Профиль сохранён",
      );
    } catch (e) {
      const data = e?.response?.data;

      const msg =
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

  async function handleSellerMediaUpload(type, file) {
    if (!file) return;

    setSaveMsg("");
    setMediaUploading(type);

    try {
      const data =
        type === "avatar"
          ? await uploadSellerAvatarRequest(file)
          : await uploadSellerBannerRequest(file);

      setProfile((prev) => ({
        ...prev,
        seller_profile: data?.seller_profile || prev?.seller_profile,
      }));
      setSaveMsg(type === "avatar" ? "Аватар магазина обновлен" : "Баннер магазина обновлен");
    } catch (e) {
      setSaveMsg(e?.response?.data?.detail || "Не удалось загрузить изображение");
    } finally {
      setMediaUploading("");
      if (type === "avatar" && avatarInputRef.current) avatarInputRef.current.value = "";
      if (type === "banner" && bannerInputRef.current) bannerInputRef.current.value = "";
    }
  }

  async function handleSellerMediaDelete(type) {
    setSaveMsg("");
    setMediaUploading(type);

    try {
      const data =
        type === "avatar"
          ? await deleteSellerAvatarRequest()
          : await deleteSellerBannerRequest();

      setProfile((prev) => ({
        ...prev,
        seller_profile: data?.seller_profile || prev?.seller_profile,
      }));
      setSaveMsg(type === "avatar" ? "Аватар магазина удален" : "Баннер магазина удален");
    } catch (e) {
      setSaveMsg(e?.response?.data?.detail || "Не удалось удалить изображение");
    } finally {
      setMediaUploading("");
    }
  }

  const userName =
    profile?.seller_profile?.store_name ||
    profile?.username ||
    "NeonMesh Studio";

  const userEmail = profile?.email || "email@example.com";
  const avatarInitial = getInitial(profile?.username || userName);
  const storeAvatarUrl = profile?.seller_profile?.store_avatar_url || "";
  const storeBannerUrl = profile?.seller_profile?.store_banner_url || "";

  return (
    <section className="seller-profile-page">
      <div className="seller-profile-page__container">
        <h1 className="seller-profile-page__title text-h2">Личный кабинет</h1>
        <div className="seller-profile-page__divider" />

        <div className="seller-profile-page__mobile-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`seller-profile-page__mobile-tab ${
                activeTab === tab.key ? "is-active" : ""
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}

          <button
            type="button"
            className="seller-profile-page__mobile-tab seller-profile-page__mobile-tab--logout"
            onClick={handleLogout}
          >
            Выйти
          </button>
        </div>

        <div className="seller-profile-page__layout">
          <aside className="seller-profile-page__sidebar">
            <nav className="seller-profile-page__menu">
              {Array.from(
                new Map(tabs.map((tab) => [tab.section, tab.section])).values()
              ).map((section) => (
                <ProfileMenuSection key={section} label={section}>
                  {tabs
                    .filter((tab) => tab.section === section)
                    .map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        className={`seller-profile-page__menu-item ${
                          activeTab === tab.key ? "is-active" : ""
                        }`}
                        onClick={() => setActiveTab(tab.key)}
                      >
                        <img
                          src={tab.icon}
                          alt=""
                          className="seller-profile-page__menu-icon"
                        />
                        <span className="text-p1">{tab.label}</span>
                      </button>
                    ))}
                </ProfileMenuSection>
              ))}

              <button
                type="button"
                className="seller-profile-page__menu-logout text-p1"
                onClick={handleLogout}
              >
                <img
                  src={logoutIcon}
                  alt=""
                  className="seller-profile-page__menu-icon"
                />
                <span>Выйти</span>
              </button>
            </nav>
          </aside>

          <main className="seller-profile-page__content">
            {isLoading ? (
              <div className="seller-profile-page__state text-p2">
                Загрузка...
              </div>
            ) : activeTab === "analytics" ? (
              <SellerAnalyticsPanel />
            ) : activeTab === "notifications" ? (
              <div className="seller-profile-page__card">
                <ProfileTabBanner
                  title="Уведомления"
                  description="Управляйте предпочтениями уведомлений"
                  icon={notificationIcon}
                  gradient="gradient-4"
                />
                <div className="seller-profile-page__stub-title text-h3">
                  Раздел в разработке
                </div>
                <div className="seller-profile-page__stub-text text-p2">
                  Этот раздел доделаем следующим этапом.
                </div>
              </div>
            ) : activeTab === "settings" ? (
              <div className="seller-profile-page__card">
                <ProfileTabBanner
                  title="Настройки"
                  description="Персонализируйте ваш магазин"
                  icon={settingsIcon}
                  gradient="gradient-5"
                />
                <div className="seller-profile-page__stub-title text-h3">
                  Раздел в разработке
                </div>
                <div className="seller-profile-page__stub-text text-p2">
                  Этот раздел доделаем следующим этапом.
                </div>
              </div>
            ) : (
              <div className="seller-profile-page__card">
                <ProfileTabBanner
                  title="Ваш профиль"
                  description="Управляйте информацией магазина"
                  icon={userIcon}
                  gradient="gradient-1"
                />
                <div
                  className="seller-profile-page__banner"
                  style={
                    storeBannerUrl
                      ? { backgroundImage: `url(${storeBannerUrl})` }
                      : undefined
                  }
                >
                  <div className="seller-profile-page__media-actions">
                    <button
                      type="button"
                      className="seller-profile-page__media-btn text-p3"
                      onClick={() => bannerInputRef.current?.click()}
                      disabled={mediaUploading === "banner"}
                    >
                      {mediaUploading === "banner" ? "Загружка..." : "Загрузить баннер"}
                    </button>
                    {storeBannerUrl ? (
                      <button
                        type="button"
                        className="seller-profile-page__media-btn seller-profile-page__media-btn--ghost text-p3"
                        onClick={() => handleSellerMediaDelete("banner")}
                        disabled={mediaUploading === "banner"}
                      >
                        Удалить
                      </button>
                    ) : null}
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      className="seller-profile-page__file-input"
                      onChange={(e) =>
                        handleSellerMediaUpload("banner", e.target.files?.[0])
                      }
                    />
                  </div>
                </div>

                <div className="seller-profile-page__head">
                  <div className="seller-profile-page__avatar-wrap">
                    <div className="seller-profile-page__avatar">
                      {storeAvatarUrl ? (
                        <img src={storeAvatarUrl} alt={userName} />
                      ) : (
                        avatarInitial
                      )}
                    </div>

                    <div className="seller-profile-page__avatar-actions">
                      <button
                        type="button"
                        className="seller-profile-page__avatar-btn text-p3"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={mediaUploading === "avatar"}
                      >
                        {mediaUploading === "avatar" ? "..." : "Ава"}
                      </button>
                      {storeAvatarUrl ? (
                        <button
                          type="button"
                          className="seller-profile-page__avatar-btn text-p3"
                          onClick={() => handleSellerMediaDelete("avatar")}
                          disabled={mediaUploading === "avatar"}
                        >
                          ×
                        </button>
                      ) : null}
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="seller-profile-page__file-input"
                        onChange={(e) =>
                          handleSellerMediaUpload("avatar", e.target.files?.[0])
                        }
                      />
                    </div>
                  </div>

                  <div className="seller-profile-page__head-info">
                    <div className="seller-profile-page__name text-h3">
                      {userName}
                    </div>

                    <div className="seller-profile-page__email text-p1">
                      {userEmail}
                    </div>

                    <div className="seller-profile-page__role text-p2">
                      Продавец
                    </div>

                    <div className="seller-profile-page__rating-row">
                      <span className="seller-profile-page__stars">★★★★☆</span>
                      <span className="seller-profile-page__rating text-p2">
                        4.44
                      </span>
                    </div>
                  </div>
                </div>

                <div className="seller-profile-page__section-title text-h4">
                  Редактировать учетную запись
                </div>

                <div className="seller-profile-page__form seller-profile-page__form--account">
                  <label className="seller-profile-page__field">
                    <span className="seller-profile-page__label text-p3">
                      Фамилия
                    </span>
                    <input
                      className="seller-profile-page__input text-p2"
                      value={form.last_name}
                      onChange={(e) => setField("last_name", e.target.value)}
                      placeholder="Фамилия"
                    />
                  </label>

                  <label className="seller-profile-page__field">
                    <span className="seller-profile-page__label text-p3">
                      Электронная почта
                    </span>
                    <input
                      className="seller-profile-page__input text-p2"
                      type="email"
                      value={form.email}
                      onChange={(e) => setField("email", e.target.value)}
                      placeholder="Электронная почта"
                    />
                  </label>

                  <label className="seller-profile-page__field">
                    <span className="seller-profile-page__label text-p3">
                      Имя
                    </span>
                    <input
                      className="seller-profile-page__input text-p2"
                      value={form.first_name}
                      onChange={(e) => setField("first_name", e.target.value)}
                      placeholder="Имя"
                    />
                  </label>

                  <label className="seller-profile-page__field">
                    <span className="seller-profile-page__label text-p3">
                      Телефон
                    </span>
                    <input
                      className="seller-profile-page__input text-p2"
                      value={form.phone}
                      onChange={(e) =>
                        setField("phone", formatRuPhone(e.target.value))
                      }
                      placeholder="Телефон"
                      inputMode="tel"
                      maxLength={18}
                    />
                  </label>

                  <label className="seller-profile-page__field">
                    <span className="seller-profile-page__label text-p3">
                      Отчество
                    </span>
                    <input
                      className="seller-profile-page__input text-p2"
                      value={form.middle_name}
                      onChange={(e) => setField("middle_name", e.target.value)}
                      placeholder="Отчество"
                    />
                  </label>
                </div>

                <div className="seller-profile-page__section-title text-h4">
                  Редактировать магазин
                </div>

                <div className="seller-profile-page__form seller-profile-page__form--store">
                  <label className="seller-profile-page__field seller-profile-page__field--full">
                    <span className="seller-profile-page__label text-p3">
                      Название
                    </span>
                    <input
                      className="seller-profile-page__input text-p2"
                      value={storeForm.store_name}
                      onChange={(e) =>
                        setStoreField("store_name", e.target.value)
                      }
                      placeholder="Название магазина"
                    />
                  </label>

                  <label className="seller-profile-page__field seller-profile-page__field--full">
                    <span className="seller-profile-page__label text-p3">
                      Описание
                    </span>
                    <textarea
                      className="seller-profile-page__textarea text-p2"
                      value={storeForm.store_description}
                      onChange={(e) =>
                        setStoreField("store_description", e.target.value)
                      }
                      placeholder="Описание магазина"
                    />
                  </label>
                </div>

                <div className="seller-profile-page__section-title text-h4">
                  Сменить пароль
                </div>

                <div className="seller-profile-page__form seller-profile-page__form--account">
                  <label className="seller-profile-page__field">
                    <span className="seller-profile-page__label text-p3">
                      Старый пароль
                    </span>
                    <input
                      className="seller-profile-page__input text-p2"
                      type="password"
                      value={pwForm.old_password}
                      onChange={(e) =>
                        setPwField("old_password", e.target.value)
                      }
                      placeholder="Старый пароль"
                    />
                  </label>

                  <label className="seller-profile-page__field">
                    <span className="seller-profile-page__label text-p3">
                      Новый пароль
                    </span>
                    <input
                      className="seller-profile-page__input text-p2"
                      type="password"
                      value={pwForm.new_password}
                      onChange={(e) =>
                        setPwField("new_password", e.target.value)
                      }
                      placeholder="Новый пароль"
                    />
                  </label>
                </div>

                <div className="seller-profile-page__bottom">
                  <div className="seller-profile-page__messages">
                    {saveMsg ? (
                      <div className="seller-profile-page__save-msg text-p2">
                        {saveMsg}
                      </div>
                    ) : null}

                    {pwMsg ? (
                      <div className="seller-profile-page__save-msg text-p2">
                        {pwMsg}
                      </div>
                    ) : null}
                  </div>

                  <div className="seller-profile-page__actions">
                    <button
                      type="button"
                      className="seller-profile-page__secondary text-p2"
                      onClick={handleChangePassword}
                      disabled={
                        isPwSaving ||
                        !pwForm.old_password ||
                        pwForm.new_password.length < 8
                      }
                    >
                      {isPwSaving ? "Сохранение..." : "Сменить пароль"}
                    </button>

                    <button
                      type="button"
                      className="seller-profile-page__save text-p2"
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                    >
                      {isSaving ? "Сохранение..." : "Сохранить"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        title="Выйти из аккаунта?"
        description="Вы уверены, что хотите выйти из аккаунта продавца?"
        confirmText="Выйти"
        cancelText="Отмена"
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </section>
  );
}