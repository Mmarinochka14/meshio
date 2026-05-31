import { useEffect, useState } from "react";
import "../../styles/admin.css";
import apiClient from "../../api/client";
import { buildMediaUrl } from "../../api/url";

function getDisplayName(user) {
  const fullName = [user?.last_name, user?.first_name, user?.middle_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || user?.username || "Без имени";
}

function normalizePreview(url) {
  return buildMediaUrl(url);
}

function formatSellerStatus(status) {
  const map = {
    pending: "На рассмотрении",
    approved: "Одобрен",
    rejected: "Отклонен",
  };

  return map[status] || "На рассмотрении";
}

function getStatusClass(status) {
  if (status === "approved") return "is-published";
  if (status === "rejected") return "is-rejected";
  return "is-pending";
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setIsLoading(true);

      const res = await apiClient.get("/users/admin/seller-requests/");
      const items = Array.isArray(res.data?.results) ? res.data.results : [];

      setUsers(items);
    } catch (e) {
      console.error("Не удалось загрузить заявки продавцов", e);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleApprove(userId) {
    setStatusMessage("");

    try {
      await apiClient.patch(`/users/${userId}/approve-seller/`);
      setUsers((prev) =>
        prev.map((item) =>
          item.id === userId ? { ...item, seller_status: "approved" } : item,
        ),
      );
      setStatusMessage("Заявка продавца одобрена.");
      await loadUsers();
    } catch (e) {
      console.error("Не удалось одобрить заявку", e);
      setStatusMessage("Не удалось одобрить заявку.");
    }
  }

  async function handleReject(userId) {
    setStatusMessage("");

    try {
      await apiClient.patch(`/users/${userId}/reject-seller/`);
      setUsers((prev) =>
        prev.map((item) =>
          item.id === userId ? { ...item, seller_status: "rejected" } : item,
        ),
      );
      setStatusMessage("Заявка продавца отклонена.");
      await loadUsers();
    } catch (e) {
      console.error("Не удалось отклонить заявку", e);
      setStatusMessage("Не удалось отклонить заявку.");
    }
  }

  if (isLoading) {
    return <div className="admin__state text-p2">Загрузка...</div>;
  }

  return (
    <section className="admin-users-page">
      <div className="admin__header">
        <h1 className="admin__title text-h2">Заявки продавцов</h1>
      </div>

      {statusMessage ? (
        <div className={`admin__notice ${statusMessage.startsWith("Не удалось") ? "admin__notice--error" : "admin__notice--success"} text-p2`}>
          {statusMessage}
        </div>
      ) : null}

      {users.length === 0 ? (
        <div className="admin__empty">
          <div className="admin__empty-title text-h3">
            Сейчас нет новых заявок
          </div>
          <div className="admin__empty-text text-p2">
            Когда пользователь отправит заявку на продавца, она появится здесь.
          </div>
        </div>
      ) : (
        <div className="admin__grid admin__grid--users">
          {users.map((user) => {
            const avatarSrc = normalizePreview(
              user?.seller_profile?.store_avatar_url,
            );
            const sellerStatus = user.seller_status || "pending";

            return (
              <article
                key={user.id}
                className="admin__card admin__card--compact"
              >
                <div className="admin__card-preview admin__card-preview--user">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={user?.seller_profile?.store_name || user.username}
                      className="admin__card-preview-image"
                    />
                  ) : (
                    <div className="admin__card-preview-placeholder text-p3">
                      Store
                    </div>
                  )}
                  <div className={`admin__card-badge admin__status-badge text-p3 ${getStatusClass(sellerStatus)}`}>
                    {formatSellerStatus(sellerStatus)}
                  </div>
                </div>

                <div className="admin__card-body">
                  <div className="admin__card-title text-h4">
                    {getDisplayName(user)}
                  </div>

                  <div className="admin__card-meta-list">
                    <div className="admin__card-meta text-p2">
                      <span className="admin__card-meta-label">Никнейм:</span>
                      <span className="admin__card-meta-value">
                        {user.username || "—"}
                      </span>
                    </div>

                    <div className="admin__card-meta text-p2">
                      <span className="admin__card-meta-label">Email:</span>
                      <span className="admin__card-meta-value">
                        {user.email || "—"}
                      </span>
                    </div>

                    <div className="admin__card-meta text-p2">
                      <span className="admin__card-meta-label">Телефон:</span>
                      <span className="admin__card-meta-value">
                        {user.phone || "—"}
                      </span>
                    </div>

                    <div className="admin__card-meta text-p2">
                      <span className="admin__card-meta-label">Магазин:</span>
                      <span className="admin__card-meta-value">
                        {user.seller_profile?.store_name || "—"}
                      </span>
                    </div>
                  </div>

                  {user.seller_profile?.store_description ? (
                    <div className="admin__comment text-p3">
                      <span className="admin__comment-label">
                        Описание магазина:
                      </span>
                      <span>{user.seller_profile.store_description}</span>
                    </div>
                  ) : null}

                  <div
                    className={`admin__actions ${
                      sellerStatus === "approved" || sellerStatus === "rejected"
                        ? "admin__actions--single"
                        : ""
                    }`}
                  >
                    {sellerStatus !== "approved" ? (
                      <button
                        type="button"
                        className="admin__approve text-p2"
                        onClick={() => handleApprove(user.id)}
                      >
                        Одобрить
                      </button>
                    ) : null}

                    {sellerStatus !== "rejected" ? (
                      <button
                        type="button"
                        className="admin__reject text-p2"
                        onClick={() => handleReject(user.id)}
                      >
                        Отклонить
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
