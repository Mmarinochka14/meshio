import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Bounds, OrbitControls } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  AnimationMixer,
  Box3,
  Group,
  MeshStandardMaterial,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
} from "three";

function cloneMaterial(material) {
  if (!material) return null;

  const cloned = material.clone();

  if (cloned.map) {
    cloned.map.colorSpace = SRGBColorSpace;
    cloned.map.needsUpdate = true;
  }

  if (cloned.emissiveMap) {
    cloned.emissiveMap.colorSpace = SRGBColorSpace;
    cloned.emissiveMap.needsUpdate = true;
  }

  if (cloned.normalMap) {
    cloned.normalMap.needsUpdate = true;
  }

  if (cloned.roughnessMap) {
    cloned.roughnessMap.needsUpdate = true;
  }

  if (cloned.metalnessMap) {
    cloned.metalnessMap.needsUpdate = true;
  }

  cloned.needsUpdate = true;
  return cloned;
}

function applyViewMode(
  object,
  mode,
  generatedTextureUrl,
  selectedMaterialPreset,
  customMaterialColor,
  customRoughness,
  customMetalness,
  customOpacity,
  customEmissive,
) {
  let generatedTexture = null;

  if (generatedTextureUrl && mode === "lighted") {
    generatedTexture = new TextureLoader().load(generatedTextureUrl);
    generatedTexture.flipY = false;
    generatedTexture.colorSpace = SRGBColorSpace;
    generatedTexture.needsUpdate = true;
  }

  object.traverse((child) => {
    if (!child.isMesh) return;

    child.castShadow = true;
    child.receiveShadow = true;

    const originalMaterial = child.material;

    if (mode === "wireframe") {
      child.material = new MeshStandardMaterial({
        color: "#d7d7dd",
        roughness: 0.82,
        metalness: 0.05,
        wireframe: true,
      });
      child.material.needsUpdate = true;
      return;
    }

    if (mode === "default") {
      child.material = new MeshStandardMaterial({
        color: "#d7d7dd",
        roughness: 0.82,
        metalness: 0.05,
      });
      child.material.needsUpdate = true;
      return;
    }

    if (mode === "lighted") {
      if (selectedMaterialPreset === "original" && !generatedTexture) {
        if (Array.isArray(originalMaterial)) {
          child.material = originalMaterial.map((mat) => cloneMaterial(mat));
        } else {
          child.material = cloneMaterial(originalMaterial);
        }
        return;
      }

      const isTransparent = customOpacity < 1;

      const material = new MeshStandardMaterial({
        color: customMaterialColor,
        roughness: customRoughness,
        metalness: customMetalness,
        opacity: customOpacity,
        transparent: isTransparent,
        depthWrite: !isTransparent,
        emissive: customEmissive,
        emissiveIntensity: customEmissive !== "#000000" ? 0.35 : 0,
        map: generatedTexture || null,
      });

      material.needsUpdate = true;
      child.material = material;
    }
  });
}

function buildPreparedScene(
  scene,
  viewMode,
  generatedTextureUrl,
  selectedMaterialPreset,
  customMaterialColor,
  customRoughness,
  customMetalness,
  customOpacity,
  customEmissive,
) {
  const clone = scene.clone(true);
  applyViewMode(
    clone,
    viewMode,
    generatedTextureUrl,
    selectedMaterialPreset,
    customMaterialColor,
    customRoughness,
    customMetalness,
    customOpacity,
    customEmissive,
  );

  clone.updateMatrixWorld(true);

  const box = new Box3().setFromObject(clone);
  const size = new Vector3();
  const center = new Vector3();

  box.getSize(size);
  box.getCenter(center);

  const wrapper = new Group();
  wrapper.add(clone);

  clone.position.x -= center.x;
  clone.position.y -= center.y;
  clone.position.z -= center.z;

  wrapper.updateMatrixWorld(true);

  const centeredBox = new Box3().setFromObject(wrapper);
  const centeredSize = new Vector3();
  centeredBox.getSize(centeredSize);

  const maxAxis = Math.max(centeredSize.x, centeredSize.y, centeredSize.z) || 1;
  const targetSize = 1.8;
  const fitScale = targetSize / maxAxis;

  wrapper.scale.setScalar(fitScale);
  wrapper.updateMatrixWorld(true);

  return wrapper;
}

function AnimatedGlbModel({
  url,
  viewMode,
  generatedTextureUrl,
  selectedMaterialPreset,
  customMaterialColor,
  customRoughness,
  customMetalness,
  customOpacity,
  customEmissive,
}) {
  const gltf = useLoader(GLTFLoader, url);
  const mixerRef = useRef(null);

  const prepared = useMemo(() => {
    return buildPreparedScene(
      gltf.scene,
      viewMode,
      generatedTextureUrl,
      selectedMaterialPreset,
      customMaterialColor,
      customRoughness,
      customMetalness,
      customOpacity,
      customEmissive,
    );
  }, [
    gltf.scene,
    viewMode,
    generatedTextureUrl,
    selectedMaterialPreset,
    customMaterialColor,
    customRoughness,
    customMetalness,
    customOpacity,
    customEmissive,
  ]);

  useEffect(() => {
    if (gltf.animations?.length) {
      const mixer = new AnimationMixer(prepared);
      mixerRef.current = mixer;

      gltf.animations.forEach((clip) => {
        mixer.clipAction(clip).play();
      });
    }

    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        mixerRef.current = null;
      }

      prepared.traverse((child) => {
        if (!child.isMesh) return;

        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => mat?.dispose?.());
        } else {
          child.material?.dispose?.();
        }
      });
    };
  }, [gltf.animations, prepared]);

  useFrame((_, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });

  return <primitive object={prepared} />;
}

function ViewerLights({ viewMode }) {
  if (viewMode === "lighted") {
    return (
      <>
        <ambientLight intensity={1.8} />
        <directionalLight position={[6, 8, 6]} intensity={2.8} castShadow />
        <directionalLight position={[-5, 4, -4]} intensity={1.4} />
        <spotLight
          position={[0, 7, 5]}
          intensity={1.5}
          angle={0.35}
          penumbra={0.5}
        />
      </>
    );
  }

  if (viewMode === "wireframe") {
    return (
      <>
        <ambientLight intensity={1.05} />
        <directionalLight position={[4, 5, 4]} intensity={0.95} />
      </>
    );
  }

  return (
    <>
      <ambientLight intensity={1} />
      <directionalLight position={[4, 5, 4]} intensity={0.9} />
    </>
  );
}

export default function ProductViewer({
  modelUrl,
  viewMode = "default",
  generatedTextureUrl = "",
  selectedMaterialPreset = "original",
  customMaterialColor = "#d7d7dd",
  customRoughness = 0.55,
  customMetalness = 0.05,
  customOpacity = 1,
  customEmissive = "#000000",
}) {
  const [isLightTheme, setIsLightTheme] = useState(() =>
    typeof document !== "undefined" ? document.body.classList.contains("theme-light") : false,
  );

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const updateTheme = () => {
      setIsLightTheme(document.body.classList.contains("theme-light"));
    };

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });
    updateTheme();

    return () => observer.disconnect();
  }, []);

  const viewerBackground = isLightTheme ? "#f7f6fc" : "#1f2025";

  if (!modelUrl) {
    return (
      <div className="product-viewer__state text-p2">
        Файл модели недоступен
      </div>
    );
  }

  return (
    <div className="product-viewer">
      <Canvas shadows camera={{ position: [0, 1.5, 6], fov: 45 }}>
        <Suspense fallback={<color attach="background" args={[viewerBackground]} />}>
          <color attach="background" args={[viewerBackground]} />
          <fog attach="fog" args={[viewerBackground, 10, 26]} />

          <ViewerLights viewMode={viewMode} />

          <Bounds fit clip observe margin={1.2}>
            <AnimatedGlbModel
              url={modelUrl}
              viewMode={viewMode}
              generatedTextureUrl={generatedTextureUrl}
              selectedMaterialPreset={selectedMaterialPreset}
              customMaterialColor={customMaterialColor}
              customRoughness={customRoughness}
              customMetalness={customMetalness}
              customOpacity={customOpacity}
              customEmissive={customEmissive}
            />
          </Bounds>

          <OrbitControls
            enablePan={false}
            enableZoom
            zoomSpeed={0.9}
            minDistance={2}
            maxDistance={30}
            enableDamping
            dampingFactor={0.08}
            rotateSpeed={0.65}
            minPolarAngle={Math.PI / 3.2}
            maxPolarAngle={Math.PI / 1.8}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
