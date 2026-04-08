import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, OrbitControls, useGLTF } from "@react-three/drei";
import { Box3, Group, Vector3 } from "three";

function buildCenteredScene(scene) {
  const clone = scene.clone(true);
  clone.updateMatrixWorld(true);

  const box = new Box3().setFromObject(clone);
  const center = new Vector3();
  const size = new Vector3();

  box.getCenter(center);
  box.getSize(size);

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

  const targetSize = 2.2;
  const fitScale = targetSize / maxAxis;

  wrapper.scale.setScalar(fitScale);
  wrapper.updateMatrixWorld(true);

  return wrapper;
}

function HeroModel() {
  const gltf = useGLTF("/models/hero-model.glb");

  const prepared = useMemo(() => {
    return buildCenteredScene(gltf.scene);
  }, [gltf.scene]);

  return <primitive object={prepared} />;
}

export default function HeroModelCanvas() {
  return (
    <div className="hero__model-canvas">
      <Canvas camera={{ position: [0, 0, 4], fov: 35 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={1.4} />
          <directionalLight position={[4, 5, 4]} intensity={1.6} />
          <directionalLight position={[-3, 2, -2]} intensity={0.8} />

          <Bounds fit clip observe margin={1.2}>
            <HeroModel />
          </Bounds>

          <OrbitControls
            enablePan={false}
            enableZoom={false}
            autoRotate
            autoRotateSpeed={1.8}
            enableDamping
            dampingFactor={0.08}
            rotateSpeed={0.6}
            minPolarAngle={Math.PI / 2.2}
            maxPolarAngle={Math.PI / 1.8}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload("/models/hero-model.glb");
