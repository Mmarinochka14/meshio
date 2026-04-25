import { useEffect, useMemo, useState } from "react";
import "../styles/add-model-modal.css";

import ProductViewer from "./viewer/ProductViewer";
import {
  createProductRequest,
  getViewerUrl,
  sendProductToReviewRequest,
  updateProductRequest,
  uploadProductFileRequest,
  uploadProductPreviewRequest,
} from "../api/products";

const INITIAL_FORM = {
  title: "",
  price: "",
  description: "",
  category: "",
  license: "",
  geometry_type: "",
  poly_style: "",
  topology_type: "",
  polygon_count: "",
  has_uv: false,
  has_textures: false,
  texture_type: "",
  has_rigging: false,
  has_animation: false,
  animation_clips_count: "",
};

function buildProductPayload(form) {
  const payload = {
    title: form.title.trim(),
    description: form.description.trim(),
    price: form.price === "" ? 0 : Number(form.price),
    has_uv: form.has_uv,
    has_textures: form.has_textures,
    has_rigging: form.has_rigging,
    has_animation: form.has_animation,
  };

  if (form.category) payload.category = Number(form.category);
  if (form.license) payload.license = Number(form.license);
  if (form.geometry_type) payload.geometry_type = form.geometry_type;
  if (form.poly_style) payload.poly_style = form.poly_style;
  if (form.topology_type) payload.topology_type = form.topology_type;
  if (form.texture_type.trim()) payload.texture_type = form.texture_type.trim();
  if (form.polygon_count !== "")
    payload.polygon_count = Number(form.polygon_count);
  if (form.animation_clips_count !== "") {
    payload.animation_clips_count = Number(form.animation_clips_count);
  }

  return payload;
}

function mapProductToForm(product) {
  if (!product) return INITIAL_FORM;

  return {
    title: product.title || "",
    price:
      product.price === null || product.price === undefined
        ? ""
        : String(product.price),
    description: product.description || "",
    category: product.category?.id ? String(product.category.id) : "",
    license: product.license?.id ? String(product.license.id) : "",
    geometry_type: product.geometry_type || "",
    poly_style: product.poly_style || "",
    topology_type: product.topology_type || "",
    polygon_count:
      product.polygon_count === null || product.polygon_count === undefined
        ? ""
        : String(product.polygon_count),
    has_uv: Boolean(product.has_uv),
    has_textures: Boolean(product.has_textures),
    texture_type: product.texture_type || "",
    has_rigging: Boolean(product.has_rigging),
    has_animation: Boolean(product.has_animation),
    animation_clips_count:
      product.animation_clips_count === null ||
      product.animation_clips_count === undefined
        ? ""
        : String(product.animation_clips_count),
  };
}

export default function AddModelModal({
  isOpen,
  onClose,
  onSuccess,
  filtersMeta,
  mode = "create",
  initialProduct = null,
}) {
  const isEditMode = mode === "edit";
  const isPublishedEdit = isEditMode && initialProduct?.status === "published";

  const [form, setForm] = useState(INITIAL_FORM);
  const [previewFile, setPreviewFile] = useState(null);
  const [modelFile, setModelFile] = useState(null);

  const [previewLocalUrl, setPreviewLocalUrl] = useState("");
  const [modelFileName, setModelFileName] = useState("");

  const [productId, setProductId] = useState(null);
  const [viewerUrl, setViewerUrl] = useState("");
  const [viewerStatus, setViewerStatus] = useState("idle");
  const [viewerError, setViewerError] = useState("");

  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSendingReview, setIsSendingReview] = useState(false);

  const [statusText, setStatusText] = useState("");
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    setPreviewFile(null);
    setModelFile(null);
    setModelFileName("");
    setStatusText("");
    setErrorText("");
    setSuccessText("");
    setViewerError("");

    if (previewLocalUrl && previewLocalUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewLocalUrl);
    }

    if (isEditMode && initialProduct) {
      setForm(mapProductToForm(initialProduct));
      setProductId(initialProduct.id || null);
      setPreviewLocalUrl(initialProduct.main_preview_url || "");
      setViewerUrl(initialProduct.viewer_url || "");
      setViewerStatus(
        initialProduct.viewer_status ||
          (initialProduct.viewer_url ? "ready" : "idle"),
      );
    } else {
      setForm(INITIAL_FORM);
      setProductId(null);
      setPreviewLocalUrl("");
      setViewerUrl("");
      setViewerStatus("idle");
    }
  }, [isOpen, isEditMode, initialProduct]);

  useEffect(() => {
    return () => {
      if (previewLocalUrl && previewLocalUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewLocalUrl);
      }
    };
  }, [previewLocalUrl]);

  const categories = filtersMeta?.categories || [];
  const licenses = filtersMeta?.licenses || [];
  const geometryTypes = filtersMeta?.geometry_types || [];
  const polyStyles = filtersMeta?.poly_styles || [];
  const topologyTypes = filtersMeta?.topology_types || [];

  const canSubmit = useMemo(() => {
    return Boolean(form.title.trim());
  }, [form.title]);

  if (!isOpen) return null;

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrorText("");
    setSuccessText("");
  }

  function toggleField(name) {
    setForm((prev) => ({ ...prev, [name]: !prev[name] }));
    setErrorText("");
    setSuccessText("");
  }

  function handlePreviewChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (previewLocalUrl && previewLocalUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewLocalUrl);
    }

    setPreviewFile(file);
    setPreviewLocalUrl(URL.createObjectURL(file));
    setErrorText("");
    setSuccessText("");
  }

  function handleModelChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setModelFile(file);
    setModelFileName(file.name);
    setViewerStatus("idle");
    setViewerUrl("");
    setViewerError("");
    setErrorText("");
    setSuccessText("");
  }

  async function refreshViewer(targetProductId) {
    try {
      const data = await getViewerUrl(targetProductId);
      setViewerUrl(data?.viewer_url || "");
      setViewerStatus(data?.viewer_status || "ready");
      setViewerError("");
    } catch (e) {
      const data = e?.response?.data;
      setViewerUrl("");
      setViewerStatus("pending");
      setViewerError(data?.detail || "");
    }
  }

  async function saveProduct({ sendToReview = false }) {
    if (!canSubmit) return;

    const setLoading = sendToReview ? setIsSendingReview : setIsSavingDraft;

    try {
      setLoading(true);
      setErrorText("");
      setSuccessText("");
      setViewerError("");

      const payload = buildProductPayload(form);

      let targetProductId = productId;

      if (isEditMode && initialProduct?.id) {
        targetProductId = initialProduct.id;
        setProductId(targetProductId);

        setStatusText("Сохраняем изменения...");
        await updateProductRequest(targetProductId, payload);
      } else {
        setStatusText("Создаём карточку товара...");
        const created = await createProductRequest(payload);
        targetProductId = created.id;
        setProductId(targetProductId);

        setStatusText("Сохраняем данные модели...");
        await updateProductRequest(targetProductId, payload);
      }

      if (previewFile) {
        setStatusText(
          isEditMode
            ? "Обновляем обложку карточки..."
            : "Загружаем обложку карточки...",
        );
        await uploadProductPreviewRequest(targetProductId, previewFile);
      }

      if (modelFile) {
        setViewerStatus("pending");
        setStatusText(
          "Загружаем исходную модель и подготавливаем viewer-модель в Blender. Это может занять некоторое время...",
        );

        await uploadProductFileRequest(targetProductId, modelFile, {
          file_type: "model_source",
          is_primary: true,
          replace_existing: true,
          sort_order: 0,
        });

        await refreshViewer(targetProductId);
      }

      if (sendToReview) {
        setStatusText("Отправляем модель на модерацию...");
        await sendProductToReviewRequest(targetProductId);
        setSuccessText(
          isEditMode
            ? "Изменения сохранены, модель отправлена на модерацию."
            : "Модель сохранена и отправлена на модерацию.",
        );
      } else {
        setSuccessText(
          isEditMode
            ? isPublishedEdit
              ? "Изменения сохранены. Опубликованный товар повторно отправлен на модерацию."
              : "Изменения сохранены."
            : "Черновик сохранён.",
        );
      }

      setStatusText("");

      if (onSuccess) {
        onSuccess();
      }
    } catch (e) {
      console.log("CREATE/UPDATE ERROR DATA:", e?.response?.data);
      console.error(e);

      const data = e?.response?.data;

      const firstError =
        data?.detail ||
        data?.title?.[0] ||
        data?.price?.[0] ||
        data?.category?.[0] ||
        data?.license?.[0] ||
        data?.polygon_count?.[0] ||
        data?.file?.[0] ||
        "Не удалось сохранить модель.";

      setErrorText(firstError);
      setStatusText("");

      if (viewerStatus === "pending") {
        setViewerStatus("failed");
        setViewerError(firstError);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="add-model-modal">
      <div className="add-model-modal__backdrop" onClick={onClose} />

      <div className="add-model-modal__dialog">
        <button
          type="button"
          className="add-model-modal__close"
          onClick={onClose}
        >
          ✕
        </button>

        <div className="add-model-modal__header">
          <h2 className="add-model-modal__title text-h2">
            {isEditMode ? "Редактирование модели" : "Добавление модели"}
          </h2>
          <p className="add-model-modal__subtitle text-p2">
            После загрузки исходная модель будет автоматически обработана в
            Blender. Подготовка viewer-модели и UV-preview может занять
            некоторое время.
          </p>
        </div>

        <div className="add-model-modal__content">
          <div className="add-model-modal__left">
            <div className="add-model-modal__panel">
              <div className="add-model-modal__panel-title text-p1">
                Исходная модель
              </div>

              <label className="add-model-modal__upload-area">
                <input
                  type="file"
                  className="add-model-modal__file-input"
                  onChange={handleModelChange}
                />
                <span className="add-model-modal__upload-title text-p2">
                  {isEditMode
                    ? "Заменить файл модели"
                    : "Загрузить файл модели"}
                </span>
                <span className="add-model-modal__upload-text text-p3">
                  Поддерживаются GLB, GLTF, OBJ, FBX, BLEND
                </span>
                {modelFileName ? (
                  <span className="add-model-modal__file-name text-p3">
                    {modelFileName}
                  </span>
                ) : null}
              </label>
            </div>

            <div className="add-model-modal__panel">
              <div className="add-model-modal__panel-title text-p1">
                Основная информация
              </div>

              <div className="add-model-modal__fields">
                <label className="add-model-modal__field add-model-modal__field--full">
                  <span className="add-model-modal__label text-p3">
                    Название
                  </span>
                  <input
                    className="add-model-modal__input text-p2"
                    value={form.title}
                    onChange={(e) => setField("title", e.target.value)}
                    placeholder="Название модели"
                  />
                </label>

                <label className="add-model-modal__field">
                  <span className="add-model-modal__label text-p3">Цена</span>
                  <input
                    className="add-model-modal__input text-p2"
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) => setField("price", e.target.value)}
                    placeholder="0"
                  />
                </label>

                <label className="add-model-modal__field">
                  <span className="add-model-modal__label text-p3">
                    Категория
                  </span>
                  <select
                    className="add-model-modal__input text-p2"
                    value={form.category}
                    onChange={(e) => setField("category", e.target.value)}
                  >
                    <option value="">Не выбрано</option>
                    {categories.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="add-model-modal__field">
                  <span className="add-model-modal__label text-p3">
                    Лицензия
                  </span>
                  <select
                    className="add-model-modal__input text-p2"
                    value={form.license}
                    onChange={(e) => setField("license", e.target.value)}
                  >
                    <option value="">Не выбрано</option>
                    {licenses.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="add-model-modal__field add-model-modal__field--full">
                  <span className="add-model-modal__label text-p3">
                    Описание
                  </span>
                  <textarea
                    className="add-model-modal__textarea text-p2"
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                    placeholder="Описание модели"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="add-model-modal__right">
            <div className="add-model-modal__panel">
              <div className="add-model-modal__panel-title text-p1">
                Обложка карточки
              </div>

              <label className="add-model-modal__preview-box">
                <input
                  type="file"
                  accept="image/*"
                  className="add-model-modal__file-input"
                  onChange={handlePreviewChange}
                />

                {previewLocalUrl ? (
                  <img
                    src={previewLocalUrl}
                    alt="Preview"
                    className="add-model-modal__preview-image"
                  />
                ) : (
                  <span className="add-model-modal__preview-placeholder text-p2">
                    Загрузить превью
                  </span>
                )}
              </label>
            </div>

            <div className="add-model-modal__panel">
              <div className="add-model-modal__panel-title text-p1">
                3D предпросмотр · PBR
              </div>

              <div className="add-model-modal__viewer-box">
                {viewerUrl ? (
                  <ProductViewer
                    modelUrl={viewerUrl}
                    viewMode="lighted"
                    generatedTextureUrl={null}
                    selectedMaterialPreset="original"
                    customMaterialColor="#ebebeb"
                    customRoughness={0.5}
                    customMetalness={0.1}
                    customOpacity={1}
                    customEmissive="#000000"
                  />
                ) : viewerStatus === "pending" ? (
                  <div className="add-model-modal__viewer-state text-p2">
                    Модель обрабатывается в Blender. Viewer появится после
                    подготовки.
                  </div>
                ) : viewerStatus === "failed" ? (
                  <div className="add-model-modal__viewer-state text-p2">
                    Не удалось подготовить viewer.
                    {viewerError ? ` ${viewerError}` : ""}
                  </div>
                ) : productId || modelFile ? (
                  <div className="add-model-modal__viewer-state text-p2">
                    Viewer станет доступен после загрузки и обработки модели.
                  </div>
                ) : (
                  <div className="add-model-modal__viewer-state text-p2">
                    Загрузите исходную модель, чтобы появился 3D-предпросмотр.
                  </div>
                )}
              </div>
            </div>

            <div className="add-model-modal__panel">
              <div className="add-model-modal__panel-title text-p1">
                Характеристики модели
              </div>

              <div className="add-model-modal__fields">
                <label className="add-model-modal__field">
                  <span className="add-model-modal__label text-p3">
                    Тип геометрии
                  </span>
                  <select
                    className="add-model-modal__input text-p2"
                    value={form.geometry_type}
                    onChange={(e) => setField("geometry_type", e.target.value)}
                  >
                    <option value="">Не выбрано</option>
                    {geometryTypes.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="add-model-modal__field">
                  <span className="add-model-modal__label text-p3">
                    Poly style
                  </span>
                  <select
                    className="add-model-modal__input text-p2"
                    value={form.poly_style}
                    onChange={(e) => setField("poly_style", e.target.value)}
                  >
                    <option value="">Не выбрано</option>
                    {polyStyles.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="add-model-modal__field">
                  <span className="add-model-modal__label text-p3">
                    Топология
                  </span>
                  <select
                    className="add-model-modal__input text-p2"
                    value={form.topology_type}
                    onChange={(e) => setField("topology_type", e.target.value)}
                  >
                    <option value="">Не выбрано</option>
                    {topologyTypes.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="add-model-modal__field">
                  <span className="add-model-modal__label text-p3">
                    Кол-во полигонов
                  </span>
                  <input
                    className="add-model-modal__input text-p2"
                    type="number"
                    min="0"
                    value={form.polygon_count}
                    onChange={(e) => setField("polygon_count", e.target.value)}
                    placeholder="0"
                  />
                </label>

                <label className="add-model-modal__field">
                  <span className="add-model-modal__label text-p3">
                    Тип текстур
                  </span>
                  <input
                    className="add-model-modal__input text-p2"
                    value={form.texture_type}
                    onChange={(e) => setField("texture_type", e.target.value)}
                    placeholder="Например: PBR"
                  />
                </label>

                <label className="add-model-modal__field">
                  <span className="add-model-modal__label text-p3">
                    Кол-во анимаций
                  </span>
                  <input
                    className="add-model-modal__input text-p2"
                    type="number"
                    min="0"
                    value={form.animation_clips_count}
                    onChange={(e) =>
                      setField("animation_clips_count", e.target.value)
                    }
                    placeholder="0"
                  />
                </label>
              </div>

              <div className="add-model-modal__toggles">
                <label className="add-model-modal__toggle">
                  <input
                    type="checkbox"
                    checked={form.has_uv}
                    onChange={() => toggleField("has_uv")}
                  />
                  <span className="text-p2">UV-развертка</span>
                </label>

                <label className="add-model-modal__toggle">
                  <input
                    type="checkbox"
                    checked={form.has_textures}
                    onChange={() => toggleField("has_textures")}
                  />
                  <span className="text-p2">Текстуры</span>
                </label>

                <label className="add-model-modal__toggle">
                  <input
                    type="checkbox"
                    checked={form.has_rigging}
                    onChange={() => toggleField("has_rigging")}
                  />
                  <span className="text-p2">Риг</span>
                </label>

                <label className="add-model-modal__toggle">
                  <input
                    type="checkbox"
                    checked={form.has_animation}
                    onChange={() => toggleField("has_animation")}
                  />
                  <span className="text-p2">Анимация</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="add-model-modal__note text-p3">
          Если обложка карточки не загружена вручную, потом можно будет
          автоматически подставлять кадр, сгенерированный из Blender.
        </div>

        {statusText ? (
          <div className="add-model-modal__status text-p2">{statusText}</div>
        ) : null}

        {errorText ? (
          <div className="add-model-modal__error text-p2">{errorText}</div>
        ) : null}

        {successText ? (
          <div className="add-model-modal__success text-p2">{successText}</div>
        ) : null}

        <div className="add-model-modal__actions">
          <button
            type="button"
            className="add-model-modal__secondary text-p2"
            onClick={() => saveProduct({ sendToReview: false })}
            disabled={isSavingDraft || isSendingReview || !canSubmit}
          >
            {isSavingDraft
              ? "Сохранение..."
              : isEditMode
                ? "Сохранить изменения"
                : "Сохранить черновик"}
          </button>

          {(!isEditMode ||
            initialProduct?.status === "draft" ||
            initialProduct?.status === "archived" ||
            initialProduct?.status === "rejected") && (
            <button
              type="button"
              className="add-model-modal__primary text-p2"
              onClick={() => saveProduct({ sendToReview: true })}
              disabled={isSavingDraft || isSendingReview || !canSubmit}
            >
              {isSendingReview
                ? "Отправка..."
                : isEditMode
                  ? "Сохранить и отправить"
                  : "Отправить на модерацию"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
