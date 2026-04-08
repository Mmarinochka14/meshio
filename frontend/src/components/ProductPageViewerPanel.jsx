import ProductViewer from "./viewer/ProductViewer";

const materialPresets = [
  { key: "original", label: "Исходный" },
  { key: "plastic", label: "Пластик" },
  { key: "metal", label: "Металл" },
  { key: "wood", label: "Дерево" },
  { key: "rubber", label: "Резина" },
  { key: "ceramic", label: "Керамика" },
  { key: "glass", label: "Стекло" },
  { key: "fabric", label: "Ткань" },
];

const colorSwatches = [
  "#ebebeb",
  "#0f0f10",
  "#7a7d85",
  "#d84a4a",
  "#f08ac3",
  "#5f7cff",
  "#52a86b",
  "#8c5cff",
  "#c9a24a",
];

const emissiveSwatches = [
  "#000000",
  "#ffffff",
  "#ff6b6b",
  "#7c5cff",
  "#4ecdc4",
];

async function downloadFileByUrl(url, filename = "generated-texture.png") {
  if (!url) return;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Не удалось скачать файл.");
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(objectUrl);
  } catch (error) {
    console.error("Ошибка скачивания текстуры:", error);
  }
}

function downloadMaterialConfig({
  selectedMaterialPreset,
  customMaterialColor,
  customRoughness,
  customMetalness,
  customOpacity,
  customEmissive,
}) {
  const payload = {
    material_mode: selectedMaterialPreset,
    base_color: customMaterialColor,
    roughness: customRoughness,
    metalness: customMetalness,
    opacity: customOpacity,
    emissive: customEmissive,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "material-config.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export default function ProductPageViewerPanel({
  viewerUrl,
  viewMode,
  setViewMode,
  texturePrompt,
  setTexturePrompt,
  onGenerateTexture,
  generatedTextureUrl,
  isGeneratingTexture,
  texturePromptSuggestions = [],
  selectedMaterialPreset,
  setSelectedMaterialPreset,
  customMaterialColor,
  setCustomMaterialColor,
  customRoughness,
  setCustomRoughness,
  customMetalness,
  setCustomMetalness,
  customOpacity,
  setCustomOpacity,
  customEmissive,
  setCustomEmissive,
  onResetMaterial,
}) {
  const isPbrMode = viewMode === "lighted";

  function activateCustomMaterial() {
    if (selectedMaterialPreset === "original") {
      setSelectedMaterialPreset("custom");
    }
  }

  function handleColorPick(color) {
    activateCustomMaterial();
    setCustomMaterialColor(color);
  }

  function handleRoughnessChange(value) {
    activateCustomMaterial();
    setCustomRoughness(value);
  }

  function handleMetalnessChange(value) {
    activateCustomMaterial();
    setCustomMetalness(value);
  }

  function handleOpacityChange(value) {
    activateCustomMaterial();
    setCustomOpacity(value);
  }

  function handleEmissivePick(color) {
    activateCustomMaterial();
    setCustomEmissive(color);
  }

  async function handleDownloadTexture() {
    if (!generatedTextureUrl) return;
    await downloadFileByUrl(generatedTextureUrl, "generated-texture.png");
  }

  function handleDownloadMaterial() {
    downloadMaterialConfig({
      selectedMaterialPreset,
      customMaterialColor,
      customRoughness,
      customMetalness,
      customOpacity,
      customEmissive,
    });
  }

  return (
    <div className="product-page__viewer-card">
      <div className="product-page__viewer-stage">
        <ProductViewer
          modelUrl={viewerUrl}
          viewMode={viewMode}
          generatedTextureUrl={generatedTextureUrl}
          selectedMaterialPreset={selectedMaterialPreset}
          customMaterialColor={customMaterialColor}
          customRoughness={customRoughness}
          customMetalness={customMetalness}
          customOpacity={customOpacity}
          customEmissive={customEmissive}
        />
      </div>

      <div className="product-page__mode-switch">
        <button
          type="button"
          className={`product-page__mode-pill text-p3 ${viewMode === "default" ? "is-active" : ""}`}
          onClick={() => setViewMode("default")}
        >
          Обычный
        </button>

        <button
          type="button"
          className={`product-page__mode-pill text-p3 ${viewMode === "wireframe" ? "is-active" : ""}`}
          onClick={() => setViewMode("wireframe")}
        >
          Каркас
        </button>

        <button
          type="button"
          className={`product-page__mode-pill text-p3 ${viewMode === "lighted" ? "is-active" : ""}`}
          onClick={() => setViewMode("lighted")}
        >
          PBR
        </button>
      </div>

      <div className="product-page__generator">
        <div className="product-page__generator-actions">
          <button
            type="button"
            className="product-page__small-secondary text-p3"
            onClick={onResetMaterial}
            disabled={!isPbrMode}
          >
            Сбросить материал
          </button>
        </div>

        <h3 className="product-page__section-title text-h4">
          Пресеты материалов
        </h3>

        <div className="product-page__prompt-suggestions">
          {materialPresets.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`product-page__prompt-chip text-p3 ${selectedMaterialPreset === item.key ? "is-active" : ""}`}
              onClick={() => setSelectedMaterialPreset(item.key)}
              disabled={!isPbrMode}
            >
              {item.label}
            </button>
          ))}
        </div>

        <h3 className="product-page__section-title text-h4">Цвет материала</h3>

        <div className="product-page__color-swatches">
          {colorSwatches.map((color) => (
            <button
              key={color}
              type="button"
              className={`product-page__color-dot ${customMaterialColor === color ? "is-active" : ""}`}
              style={{ backgroundColor: color }}
              onClick={() => handleColorPick(color)}
              disabled={!isPbrMode}
            />
          ))}
        </div>

        <div className="product-page__material-controls">
          <label className="product-page__range-control text-p3">
            <span>Roughness: {Number(customRoughness).toFixed(2)}</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={customRoughness}
              onChange={(e) => handleRoughnessChange(Number(e.target.value))}
              disabled={!isPbrMode}
            />
          </label>

          <label className="product-page__range-control text-p3">
            <span>Metalness: {Number(customMetalness).toFixed(2)}</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={customMetalness}
              onChange={(e) => handleMetalnessChange(Number(e.target.value))}
              disabled={!isPbrMode}
            />
          </label>

          <label className="product-page__range-control text-p3">
            <span>Opacity: {Number(customOpacity).toFixed(2)}</span>
            <input
              type="range"
              min="0.05"
              max="1"
              step="0.01"
              value={customOpacity}
              onChange={(e) => handleOpacityChange(Number(e.target.value))}
              disabled={!isPbrMode}
            />
          </label>
        </div>

        <h3 className="product-page__section-title text-h4">Emission</h3>

        <div className="product-page__color-swatches">
          {emissiveSwatches.map((color) => (
            <button
              key={color}
              type="button"
              className={`product-page__color-dot ${customEmissive === color ? "is-active" : ""}`}
              style={{ backgroundColor: color }}
              onClick={() => handleEmissivePick(color)}
              disabled={!isPbrMode}
            />
          ))}
        </div>

        <h3 className="product-page__section-title text-h4">
          Генерация текстуры
        </h3>

        <p className="product-page__section-text text-p3">
          Выберите готовую подсказку или введите свой промпт для генерации
          материала.
        </p>

        <div className="product-page__prompt-suggestions">
          {texturePromptSuggestions.map((item) => (
            <button
              key={item}
              type="button"
              className={`product-page__prompt-chip text-p3 ${texturePrompt === item ? "is-active" : ""}`}
              onClick={() => setTexturePrompt(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="product-page__prompt-box">
          <label className="product-page__prompt-label text-p3">
            Промпт / параметры
          </label>

          <textarea
            className="product-page__prompt-input text-p2"
            placeholder="Например: розовый матовый пластик"
            value={texturePrompt}
            onChange={(e) => setTexturePrompt(e.target.value)}
          />
        </div>

        <div className="product-page__generator-actions product-page__generator-actions--extended">
          <button
            type="button"
            className="product-page__small-primary text-p3"
            onClick={onGenerateTexture}
            disabled={isGeneratingTexture}
          >
            {isGeneratingTexture ? "Генерация..." : "Сгенерировать"}
          </button>

          <button
            type="button"
            className="product-page__small-secondary text-p3"
            onClick={() => setTexturePrompt("")}
          >
            Сбросить
          </button>

          <button
            type="button"
            className="product-page__small-secondary text-p3"
            onClick={handleDownloadTexture}
            disabled={!generatedTextureUrl}
          >
            Скачать текстуру
          </button>

          <button
            type="button"
            className="product-page__small-secondary text-p3"
            onClick={handleDownloadMaterial}
            disabled={!isPbrMode}
          >
            Сохранить материал
          </button>
        </div>

        <div className="product-page__texture-result">
          <div className="product-page__texture-card">
            <div className="product-page__texture-card-title text-p3">
              Сгенерированная текстура
            </div>

            <div className="product-page__texture-card-body product-page__texture-card-body--result">
              {generatedTextureUrl ? (
                <img
                  src={generatedTextureUrl}
                  alt="Сгенерированная текстура"
                  className="product-page__generated-texture-image"
                />
              ) : (
                <div className="product-page__texture-placeholder text-p3">
                  После генерации здесь появится текстура
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
