import { useEffect, useState } from "react";
import "../../styles/admin.css";
import {
  getAdminSupportRequests,
  updateAdminSupportRequest,
} from "../../api/support";

function formatStatus(status) {
  const map = {
    new: "Новое",
    in_progress: "В работе",
    done: "Обработано",
  };

  return map[status] || status || "—";
}

function formatDate(value) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString("ru-RU");
  } catch {
    return value;
  }
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusTab, setStatusTab] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [replyDraft, setReplyDraft] = useState("");

  useEffect(() => {
    loadRequests();
  }, [statusTab]);

  async function loadRequests() {
    try {
      setIsLoading(true);
      const data = await getAdminSupportRequests(statusTab);
      const items = Array.isArray(data?.results) ? data.results : [];
      setRequests(items);
    } catch (e) {
      console.error("Не удалось загрузить обращения", e);
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }

  function startReply(item) {
    setEditingId(item.id);
    setReplyDraft(item.admin_reply || "");
  }

  function cancelReply() {
    setEditingId(null);
    setReplyDraft("");
  }

  async function saveReply(item, nextStatus) {
    try {
      await updateAdminSupportRequest(item.id, {
        status: nextStatus,
        admin_reply: replyDraft,
      });

      setEditingId(null);
      setReplyDraft("");
      await loadRequests();
    } catch (e) {
      console.error("Не удалось сохранить ответ", e);
      alert("Не удалось сохранить ответ");
    }
  }

  async function quickChangeStatus(item, nextStatus) {
    try {
      await updateAdminSupportRequest(item.id, {
        status: nextStatus,
      });

      await loadRequests();
    } catch (e) {
      console.error("Не удалось обновить статус", e);
      alert("Не удалось обновить статус");
    }
  }

  if (isLoading) {
    return <div className="admin__state text-p2">Загрузка...</div>;
  }

  return (
    <section className="admin-requests-page">
      <div className="admin__header">
        <h1 className="admin__title text-h2">Обращения пользователей</h1>
        <div className="admin__subtitle text-p2">
          Здесь администратор просматривает входящие обращения и отправляет
          ответ.
        </div>
      </div>

      <div className="admin__tabs">
        <button
          type="button"
          className={`admin__tab text-p2 ${statusTab === "all" ? "is-active" : ""}`}
          onClick={() => setStatusTab("all")}
        >
          Все
        </button>
        <button
          type="button"
          className={`admin__tab text-p2 ${statusTab === "new" ? "is-active" : ""}`}
          onClick={() => setStatusTab("new")}
        >
          Новые
        </button>
        <button
          type="button"
          className={`admin__tab text-p2 ${statusTab === "in_progress" ? "is-active" : ""}`}
          onClick={() => setStatusTab("in_progress")}
        >
          В работе
        </button>
        <button
          type="button"
          className={`admin__tab text-p2 ${statusTab === "done" ? "is-active" : ""}`}
          onClick={() => setStatusTab("done")}
        >
          Обработанные
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="admin__empty">
          <div className="admin__empty-title text-h3">Обращений нет</div>
          <div className="admin__empty-text text-p2">
            В выбранной категории пока ничего нет.
          </div>
        </div>
      ) : (
        <div className="admin__requests-list">
          {requests.map((item) => {
            const isEditing = editingId === item.id;

            return (
              <article key={item.id} className="admin__request-card">
                <div className="admin__request-top">
                  <div>
                    <div className="admin__request-title text-h4">
                      {item.subject || "Без темы"}
                    </div>
                    <div className="admin__request-sub text-p2">
                      {item.name || "Без имени"} · {item.email || "—"}
                    </div>
                  </div>

                  <div className="admin__request-badge text-p3">
                    {formatStatus(item.status)}
                  </div>
                </div>

                <div className="admin__request-meta text-p3">
                  Создано: {formatDate(item.created_at)}
                </div>

                <div className="admin__request-message text-p2">
                  {item.message || "Пустое сообщение"}
                </div>

                {item.admin_reply && !isEditing ? (
                  <div className="admin__reply-block">
                    <div className="admin__reply-title text-p3">
                      Ответ администратора
                    </div>
                    <div className="admin__reply-text text-p2">
                      {item.admin_reply}
                    </div>
                    <div className="admin__request-meta text-p3">
                      Ответ отправлен: {formatDate(item.replied_at)}
                    </div>
                  </div>
                ) : null}

                {isEditing ? (
                  <div className="admin__reply-editor">
                    <label className="admin__reply-label text-p3">
                      Ответ пользователю
                    </label>

                    <textarea
                      className="admin__reply-textarea text-p2"
                      value={replyDraft}
                      onChange={(e) => setReplyDraft(e.target.value)}
                      placeholder="Введите ответ пользователю"
                    />

                    <div className="admin__reply-actions">
                      <button
                        type="button"
                        className="admin__secondary text-p2"
                        onClick={cancelReply}
                      >
                        Отмена
                      </button>

                      <button
                        type="button"
                        className="admin__secondary text-p2"
                        onClick={() => saveReply(item, "in_progress")}
                      >
                        Сохранить в работу
                      </button>

                      <button
                        type="button"
                        className="admin__approve text-p2"
                        onClick={() => saveReply(item, "done")}
                      >
                        Ответить и закрыть
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="admin__request-actions">
                    {item.status === "new" && (
                      <button
                        type="button"
                        className="admin__secondary text-p2"
                        onClick={() => quickChangeStatus(item, "in_progress")}
                      >
                        Взять в работу
                      </button>
                    )}

                    {item.status !== "done" && (
                      <button
                        type="button"
                        className="admin__approve text-p2"
                        onClick={() => startReply(item)}
                      >
                        Ответить
                      </button>
                    )}

                    {item.status === "done" && (
                      <button
                        type="button"
                        className="admin__secondary text-p2"
                        onClick={() => startReply(item)}
                      >
                        Изменить ответ
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
