import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/buyer-profile-page.css";

import { isAuthenticated, logout } from "../components/auth/authStore";
import {
  meRequest,
  updateProfileRequest,
  changePasswordRequest,
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

export default function BuyerProfilePage({ onOpenSellerModal }) {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("profile"); // profile | purchases | notifications | payments | settings

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // профиль (редактирование)
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

  // смена пароля
  const [pwForm, setPwForm] = useState({ old_password: "", new_password: "" });
  const [isPwSaving, setIsPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState("");

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
    setForm((p) => ({ ...p, [name]: value }));
    setSaveMsg("");
  }

  function setPwField(name, value) {
    setPwForm((p) => ({ ...p, [name]: value }));
    setPwMsg("");
  }

  function handleLogout() {
    logout();
    navigate("/");
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
        phone: form.phone, // приходит строкой +7 (999) ...
      };

      const updated = await updateProfileRequest(payload);
      setProfile(updated);
      setSaveMsg("Сохранено");
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

  const userName = profile?.username || "Профиль";
  const userRole = profile?.role === "seller" ? "Продавец" : "Покупатель";

  return (
    <section className="buyer-profile-page">
      <div className="buyer-profile-page__container">
        <h1 className="buyer-profile-page__title text-h2">Личный кабинет</h1>
        <div className="buyer-profile-page__divider" />

        <div className="buyer-profile-page__layout">
          {/* LEFT MENU */}
          <aside className="buyer-profile-page__sidebar">
            <nav className="buyer-profile-page__menu">
              <button
                type="button"
                className={`buyer-profile-page__menu-item ${
                  activeTab === "profile" ? "is-active" : ""
                }`}
                onClick={() => setActiveTab("profile")}
              >
                <span className="text-p2">Профиль</span>
              </button>

              <button
                type="button"
                className={`buyer-profile-page__menu-item ${
                  activeTab === "purchases" ? "is-active" : ""
                }`}
                onClick={() => setActiveTab("purchases")}
              >
                <span className="text-p2">История покупок</span>
              </button>

              <button
                type="button"
                className={`buyer-profile-page__menu-item ${
                  activeTab === "notifications" ? "is-active" : ""
                }`}
                onClick={() => setActiveTab("notifications")}
              >
                <span className="text-p2">Уведомления</span>
              </button>

              <button
                type="button"
                className={`buyer-profile-page__menu-item ${
                  activeTab === "payments" ? "is-active" : ""
                }`}
                onClick={() => setActiveTab("payments")}
              >
                <span className="text-p2">Способы оплаты</span>
              </button>

              <button
                type="button"
                className={`buyer-profile-page__menu-item ${
                  activeTab === "settings" ? "is-active" : ""
                }`}
                onClick={() => setActiveTab("settings")}
              >
                <span className="text-p2">Настройки</span>
              </button>

              <button
                type="button"
                className="buyer-profile-page__menu-cta text-p2"
                onClick={onOpenSellerModal}
              >
                Стать продавцом
              </button>

              <button
                type="button"
                className="buyer-profile-page__menu-logout text-p2"
                onClick={handleLogout}
              >
                Выйти
              </button>
            </nav>
          </aside>

          {/* RIGHT CONTENT */}
          <main className="buyer-profile-page__content">
            {isLoading ? (
              <div className="page-state">Загрузка…</div>
            ) : (
              <>
                {activeTab === "profile" && (
                  <div className="buyer-profile-page__card">
                    <div className="buyer-profile-page__profile-head">
                      <div className="buyer-profile-page__avatar" />

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

                        <button
                          type="button"
                          className="buyer-profile-page__small-btn text-p2"
                          onClick={onOpenSellerModal}
                        >
                          Стать продавцом
                        </button>
                      </div>
                    </div>

                    {/* PROFILE EDIT */}
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

                    {/* PASSWORD CHANGE */}
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

                    <div className="buyer-profile-page__actions buyer-profile-page__actions--password">
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

                {activeTab !== "profile" && (
                  <div className="buyer-profile-page__card">
                    <div className="text-h3 buyer-profile-page__card-title">
                      Раздел в разработке
                    </div>
                    <div className="text-p2 buyer-profile-page__muted">
                      Сделаем после профиля: сначала покупки, потом остальное.
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </section>
  );
}
