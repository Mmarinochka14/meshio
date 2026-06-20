import { Component, lazy, Suspense } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { TextureLoader } from "three";
import downloadIcon from "../assets/icons/download.svg";

const ProductViewer = lazy(() => import("./viewer/ProductViewer"));

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
  "#d84a4a",
  "#f08ac3",
  "#52a86b",
  "#c9a24a",
];

const materialHints = {
  roughness:
    "Шероховатость управляет бликами: чем ниже значение, тем более глянцевой выглядит поверхность.",
  metalness:
    "Металличность делает материал похожим на металл и усиливает отражающий характер поверхности.",
  opacity:
    "Прозрачность показывает, насколько материал пропускает свет. Низкое значение делает объект стекляннее.",
};

class ViewerErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error) {
    console.error("3D viewer failed:", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

function InfoTooltip({ text }) {
  return (
    <span className="product-page__info-tip" tabIndex={0} aria-label={text}>
      i
      <span className="product-page__info-tip-popup text-p3">{text}</span>
    </span>
  );
}

function MaterialSphereMesh({
  customMaterialColor,
  customRoughness,
  customMetalness,
  customOpacity,
  customEmissive,
  texture,
}) {
  return (
    <mesh rotation={[0.15, -0.35, 0]}>
      <sphereGeometry args={[1.25, 96, 96]} />
      <meshStandardMaterial
        color={customMaterialColor}
        map={texture}
        roughness={customRoughness}
        metalness={customMetalness}
        opacity={customOpacity}
        transparent={customOpacity < 1}
        emissive={customEmissive}
        emissiveIntensity={customEmissive === "#000000" ? 0 : 0.45}
      />
    </mesh>
  );
}

function MaterialSphereTexturedMesh(props) {
  const texture = useLoader(TextureLoader, props.generatedTextureUrl);
  return <MaterialSphereMesh {...props} texture={texture} />;
}

function MaterialSpherePreview(props) {
  return (
    <div className="product-page__material-sphere-viewer">
      <Canvas camera={{ position: [0, 0, 4.2], fov: 38 }} dpr={[1, 1.6]}>
        <ambientLight intensity={0.72} />
        <directionalLight position={[3, 4, 5]} intensity={1.25} />
        <pointLight position={[-3, -2, 4]} intensity={0.28} color="#ffffff" />
        {props.generatedTextureUrl ? (
          <MaterialSphereTexturedMesh {...props} />
        ) : (
          <MaterialSphereMesh {...props} texture={null} />
        )}
        <OrbitControls enablePan={false} enableZoom={false} rotateSpeed={0.75} />
      </Canvas>
    </div>
  );
}

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
        {!viewerUrl ? (
          <div className="product-viewer__state text-p2">
            Файл модели недоступен
          </div>
        ) : (
          <ViewerErrorBoundary
            resetKey={viewerUrl}
            fallback={
              <div className="product-viewer__state product-viewer__state--error text-p2">
                Не удалось загрузить 3D-модель. Остальная страница доступна.
              </div>
            }
          >
            <Suspense
              fallback={
                <div className="product-viewer__state text-p2">
                  Загрузка 3D-просмотра...
                </div>
              }
            >
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
            </Suspense>
          </ViewerErrorBoundary>
        )}
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
        <div className="product-page__generator-head">
          <div>
            <h3 className="product-page__section-title text-h4">
              Материал и текстура
            </h3>
            <p className="product-page__section-text text-p3">
              Настройте внешний вид модели или сгенерируйте текстуру.
            </p>
          </div>

          <button
            type="button"
            className="product-page__small-secondary text-p3"
            onClick={onResetMaterial}
            disabled={!isPbrMode}
          >
            Сбросить
          </button>
        </div>

        <div className="product-page__material-panel">
          <div className="product-page__material-card">
            <div className="product-page__material-card-title text-p2">
              Пресет
            </div>
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
          </div>

          <div className="product-page__material-card product-page__material-card--swatches">
            <div className="product-page__material-card-title text-p2">
              Цвет
            </div>
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

            <div className="product-page__material-card-title product-page__material-card-title--secondary text-p2">
              Свечение
            </div>
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
          </div>

          <div className="product-page__material-card product-page__material-card--wide">
            <div className="product-page__material-card-head">
              <div>
                <div className="product-page__material-card-title text-p2">
                  Свойства
                </div>
                <div className="product-page__material-card-note text-p3">
                  Эти параметры сохраняются в JSON-файл.
                </div>
              </div>

            </div>
            <div className="product-page__material-properties">
              <div className="product-page__material-controls">
                <label className="product-page__range-control text-p3">
                  <span className="product-page__range-label">
                    <span>Шероховатость {Number(customRoughness).toFixed(2)}</span>
                    <InfoTooltip text={materialHints.roughness} />
                  </span>
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
                  <span className="product-page__range-label">
                    <span>Металличность {Number(customMetalness).toFixed(2)}</span>
                    <InfoTooltip text={materialHints.metalness} />
                  </span>
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
                  <span className="product-page__range-label">
                    <span>Прозрачность {Number(customOpacity).toFixed(2)}</span>
                    <InfoTooltip text={materialHints.opacity} />
                  </span>
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

                <button
                  type="button"
                  className="product-page__small-secondary product-page__download-btn product-page__small-secondary--json text-p3"
                  onClick={handleDownloadMaterial}
                  disabled={!isPbrMode}
                >
                  <img src={downloadIcon} alt="" className="product-page__download-icon" />
                  <span>Скачать JSON</span>
                </button>
              </div>

              <div className="product-page__material-preview">
                <MaterialSpherePreview
                  generatedTextureUrl={generatedTextureUrl}
                  customMaterialColor={customMaterialColor}
                  customRoughness={customRoughness}
                  customMetalness={customMetalness}
                  customOpacity={customOpacity}
                  customEmissive={customEmissive}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="product-page__texture-workspace">
          <div className="product-page__texture-editor">
            <div className="product-page__material-card-title text-p2">
              Генерация текстуры
            </div>
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
                Запрос
              </label>
              <textarea
                className="product-page__prompt-input text-p2"
                placeholder="Например: темное дерево, белая керамика, красная ткань"
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
                Очистить
              </button>
            </div>
          </div>

          <div className="product-page__texture-card">
            <div className="product-page__texture-card-title text-p3">
              Картинка текстуры
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

            <div className="product-page__texture-card-actions product-page__texture-card-actions--single">
              <button
                type="button"
                className="product-page__small-secondary text-p3"
                onClick={handleDownloadTexture}
                disabled={!generatedTextureUrl}
              >
                <img src={downloadIcon} alt="" className="product-page__download-icon" />
                <span>Скачать PNG</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

