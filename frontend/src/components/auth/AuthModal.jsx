import { useEffect, useState } from "react";
import Modal from "../modals/Modal";
import "../../styles/auth-modal.css";

import { loginRequest, registerRequest } from "../../api/auth";

export default function AuthModal({
  isOpen,
  onClose,
  initialStep = "login",
  initialRole = "",
}) {
  const [step, setStep] = useState("login");
  // login | registerRole | registerForm

  const [role, setRole] = useState("");
  const [error, setError] = useState("");

  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
    password_confirm: "",
    agree: false,
  });

  useEffect(() => {
    if (!isOpen) return;

    setError("");

    if (initialStep === "registerForm" && initialRole) {
      setStep("registerForm");
      setRole(initialRole);
      return;
    }

    if (initialStep === "registerRole") {
      setStep("registerRole");
      setRole(initialRole || "");
      return;
    }

    setStep("login");
    setRole("");
  }, [isOpen, initialStep, initialRole]);

  function closeAndReset() {
    setStep("login");
    setRole("");
    setError("");
    setLoginForm({ username: "", password: "" });
    setRegisterForm({
      username: "",
      email: "",
      password: "",
      password_confirm: "",
      agree: false,
    });
    onClose?.();
  }

  async function handleLoginSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      await loginRequest(loginForm.username, loginForm.password);
      closeAndReset();
    } catch {
      setError("Неверный логин или пароль.");
    }
  }

  function handleRegisterContinue() {
    if (!role) return;
    setStep("registerForm");
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    setError("");

    if (!role) {
      setError("Сначала выберите роль.");
      return;
    }

    if (!registerForm.agree) {
      setError("Нужно согласиться с правилами.");
      return;
    }

    try {
      await registerRequest({
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password,
        password_confirm: registerForm.password_confirm,
        role,
      });

      closeAndReset();
    } catch {
      setError("Ошибка регистрации. Проверь данные (username/email/пароли).");
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={closeAndReset}>
      {step === "login" && (
        <div className="auth-modal">
          <h2 className="auth-modal__title text-h2">Вход</h2>

          <form onSubmit={handleLoginSubmit} className="auth-modal__form">
            <label className="auth-modal__field">
              <span className="auth-modal__label text-p2">Никнейм</span>
              <input
                className="auth-modal__input text-p2"
                placeholder="Введите никнейм"
                value={loginForm.username}
                onChange={(e) =>
                  setLoginForm((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }))
                }
              />
            </label>

            <label className="auth-modal__field">
              <span className="auth-modal__label text-p2">Пароль</span>
              <input
                type="password"
                className="auth-modal__input text-p2"
                placeholder="Введите пароль"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
              />
            </label>

            {error ? (
              <div className="auth-modal__error text-p2">{error}</div>
            ) : null}

            <div className="auth-modal__row">
              <button type="button" className="auth-modal__link text-p2">
                Забыли пароль?
              </button>
            </div>

            <button type="submit" className="auth-modal__primary text-p2">
              Войти
            </button>

            <div className="auth-modal__footer text-p2">
              Нет аккаунта?{" "}
              <button
                type="button"
                className="auth-modal__link"
                onClick={() => {
                  setError("");
                  setRole("");
                  setStep("registerRole");
                }}
              >
                Зарегистрироваться
              </button>
            </div>
          </form>
        </div>
      )}

      {step === "registerRole" && (
        <div className="auth-modal">
          <h2 className="auth-modal__title text-h2">Регистрация</h2>

          <div className="auth-modal__roles">
            <button
              type="button"
              className={`auth-modal__role ${
                role === "buyer" ? "is-active" : ""
              }`}
              onClick={() => setRole("buyer")}
            >
              <span className="auth-modal__radio" />
              <div className="auth-modal__role-text">
                <div className="text-p1">Покупатель</div>
                <div className="text-p2 auth-modal__muted">
                  Хочу покупать и скачивать 3D-модели
                </div>
              </div>
            </button>

            <button
              type="button"
              className={`auth-modal__role ${
                role === "seller" ? "is-active" : ""
              }`}
              onClick={() => setRole("seller")}
            >
              <span className="auth-modal__radio" />
              <div className="auth-modal__role-text">
                <div className="text-p1">Продавец</div>
                <div className="text-p2 auth-modal__muted">
                  Хочу продавать 3D-модели
                </div>
              </div>
            </button>
          </div>

          <button
            type="button"
            className="auth-modal__primary text-p2"
            onClick={handleRegisterContinue}
            disabled={!role}
          >
            Продолжить
          </button>

          <div className="auth-modal__footer text-p2">
            Уже есть аккаунт?{" "}
            <button
              type="button"
              className="auth-modal__link"
              onClick={() => {
                setError("");
                setStep("login");
              }}
            >
              Войти
            </button>
          </div>
        </div>
      )}

      {step === "registerForm" && (
        <div className="auth-modal">
          <h2 className="auth-modal__title text-h2">Регистрация</h2>

          {role === "seller" ? (
            <div className="auth-modal__role-badge text-p2"></div>
          ) : role === "buyer" ? (
            <div className="auth-modal__role-badge text-p2"></div>
          ) : null}

          <form onSubmit={handleRegisterSubmit} className="auth-modal__form">
            <label className="auth-modal__field">
              <span className="auth-modal__label text-p2">Никнейм</span>
              <input
                className="auth-modal__input text-p2"
                placeholder="Введите никнейм"
                value={registerForm.username}
                onChange={(e) =>
                  setRegisterForm((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }))
                }
              />
            </label>

            <label className="auth-modal__field">
              <span className="auth-modal__label text-p2">
                Электронная почта
              </span>
              <input
                className="auth-modal__input text-p2"
                placeholder="Введите электронную почту"
                value={registerForm.email}
                onChange={(e) =>
                  setRegisterForm((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
              />
            </label>

            <label className="auth-modal__field">
              <span className="auth-modal__label text-p2">Пароль</span>
              <input
                type="password"
                className="auth-modal__input text-p2"
                placeholder="Введите пароль"
                value={registerForm.password}
                onChange={(e) =>
                  setRegisterForm((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
              />
            </label>

            <label className="auth-modal__field">
              <span className="auth-modal__label text-p2">
                Подтверждение пароля
              </span>
              <input
                type="password"
                className="auth-modal__input text-p2"
                placeholder="Подтвердите пароль"
                value={registerForm.password_confirm}
                onChange={(e) =>
                  setRegisterForm((prev) => ({
                    ...prev,
                    password_confirm: e.target.value,
                  }))
                }
              />
            </label>

            <label className="auth-modal__agree">
              <input
                type="checkbox"
                checked={registerForm.agree}
                onChange={(e) =>
                  setRegisterForm((prev) => ({
                    ...prev,
                    agree: e.target.checked,
                  }))
                }
              />
              <span className="text-p2">
                Соглашаюсь с правилами использования торговой площадки
              </span>
            </label>

            {error ? (
              <div className="auth-modal__error text-p2">{error}</div>
            ) : null}

            <button
              type="submit"
              className="auth-modal__primary text-p2"
              disabled={!registerForm.agree}
            >
              Создать аккаунт
            </button>

            <div className="auth-modal__footer text-p2">
              Уже есть аккаунт?{" "}
              <button
                type="button"
                className="auth-modal__link"
                onClick={() => {
                  setError("");
                  setStep("login");
                }}
              >
                Войти
              </button>
            </div>
          </form>
        </div>
      )}
    </Modal>
  );
}
