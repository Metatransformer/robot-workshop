"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

type ArtifactPreviewProps = {
  token: string;
  projectId: string;
  path: string;
};

type AssetState =
  | { key: string; status: "loading" }
  | { key: string; status: "error"; message: string }
  | { key: string; status: "ready"; mime: string; bytes: ArrayBuffer };

type ViewHandle = {
  reset: () => void;
  orbit: (horizontal: number, vertical: number) => void;
};

const panelStyle: CSSProperties = {
  position: "relative",
  display: "grid",
  minHeight: 320,
  width: "100%",
  overflow: "hidden",
  borderRadius: 12,
  background: "linear-gradient(180deg, #e9eef0 0%, #dce4e7 100%)",
};

function decodeBase64(value: string): ArrayBuffer {
  const binary = window.atob(value);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return buffer;
}

function disposeMaterial(material: THREE.Material): void {
  for (const value of Object.values(material)) {
    if (value instanceof THREE.Texture) {
      const image = value.source.data as unknown;
      if (typeof ImageBitmap !== "undefined" && image instanceof ImageBitmap) image.close();
      value.dispose();
    }
  }
  material.dispose();
}

function disposeObject(root: THREE.Object3D): void {
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    mesh.geometry?.dispose();
    if (Array.isArray(mesh.material)) mesh.material.forEach(disposeMaterial);
    else if (mesh.material) disposeMaterial(mesh.material);
  });
}

function ImagePreview({ bytes, mime, path: filePath }: { bytes: ArrayBuffer; mime: string; path: string }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    const objectUrl = URL.createObjectURL(new Blob([bytes], { type: mime }));
    setUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [bytes, mime]);

  if (!url) return <div role="status" style={{ margin: "auto" }}>Preparing image preview…</div>;
  return (
    <div style={{ ...panelStyle, placeItems: "center", padding: 20 }}>
      <img
        src={url}
        alt={filePath}
        style={{ display: "block", maxWidth: "100%", maxHeight: "70vh", objectFit: "contain" }}
      />
    </div>
  );
}

function ModelPreview({ bytes, path: filePath }: { bytes: ArrayBuffer; path: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<ViewHandle | null>(null);
  const [message, setMessage] = useState("Preparing model preview…");
  const [error, setError] = useState("");
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setError("");
    setMessage("Preparing model preview…");

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      setError("WebGL is unavailable, so this GLB model cannot be previewed on this device.");
      setMessage("");
      return;
    }

    let disposed = false;
    let animationFrame = 0;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe4eaec);
    const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 10_000);
    camera.position.set(2.5, 2, 3.5);
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = !reducedMotion;
    controls.dampingFactor = 0.08;
    controls.screenSpacePanning = true;
    controls.target.set(0, 0, 0);

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x52616a, 2.5));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.5);
    keyLight.position.set(4, 7, 5);
    scene.add(keyLight);

    let modelRoot: THREE.Object3D | null = null;
    let grid: THREE.GridHelper | null = null;
    const defaultCamera = new THREE.Vector3(2.5, 2, 3.5);
    const defaultTarget = new THREE.Vector3();

    const render = () => {
      if (!disposed) renderer.render(scene, camera);
    };
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height || disposed) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
      render();
    };
    const reset = () => {
      camera.position.copy(defaultCamera);
      controls.target.copy(defaultTarget);
      controls.update();
      render();
    };
    const orbit = (horizontal: number, vertical: number) => {
      const offset = camera.position.clone().sub(controls.target);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      spherical.theta += horizontal;
      spherical.phi = THREE.MathUtils.clamp(spherical.phi + vertical, 0.08, Math.PI - 0.08);
      camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
      camera.lookAt(controls.target);
      controls.update();
      render();
    };
    viewRef.current = { reset, orbit };

    controls.addEventListener("change", render);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    if (!reducedMotion) {
      const animate = () => {
        if (disposed) return;
        controls.update();
        renderer.render(scene, camera);
        animationFrame = requestAnimationFrame(animate);
      };
      animate();
    }

    const manager = new THREE.LoadingManager();
    manager.setURLModifier((url) => {
      if (url.startsWith("blob:") || /^data:image\/(?:png|jpeg|webp);base64,/i.test(url)) return url;
      throw new Error("This GLB references an external resource. Only self-contained models can be previewed.");
    });
    const loader = new GLTFLoader(manager);
    try {
      loader.parse(
        bytes,
        "",
        (gltf) => {
          if (disposed) {
            disposeObject(gltf.scene);
            return;
          }
          modelRoot = gltf.scene;
          scene.add(modelRoot);
          modelRoot.updateMatrixWorld(true);
          const bounds = new THREE.Box3().setFromObject(modelRoot);
          if (bounds.isEmpty()) {
            scene.remove(modelRoot);
            disposeObject(modelRoot);
            modelRoot = null;
            setError("The GLB loaded but does not contain visible geometry.");
            setMessage("");
            return;
          }
          const size = bounds.getSize(new THREE.Vector3());
          const center = bounds.getCenter(new THREE.Vector3());
          if (![size.x, size.y, size.z, center.x, center.y, center.z].every(Number.isFinite)) {
            scene.remove(modelRoot);
            disposeObject(modelRoot);
            modelRoot = null;
            setError("The GLB contains invalid geometry bounds and cannot be framed safely.");
            setMessage("");
            return;
          }
          const radius = Math.max(size.length() / 2, 0.001);
          const distance = Math.max(radius / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.25, 0.01);
          defaultTarget.copy(center);
          defaultCamera.copy(center).add(new THREE.Vector3(1, 0.75, 1).normalize().multiplyScalar(distance));
          camera.near = Math.max(distance / 10_000, 0.0001);
          camera.far = Math.max(distance * 100, radius * 200, 10);
          camera.updateProjectionMatrix();
          controls.minDistance = Math.max(radius * 0.03, 0.0001);
          controls.maxDistance = Math.max(radius * 100, distance * 10);

          const gridSize = Math.max(size.x, size.z, radius * 2, 0.01) * 1.5;
          grid = new THREE.GridHelper(gridSize, 20, 0x6f848d, 0xa9b7bc);
          grid.position.y = bounds.min.y;
          scene.add(grid);
          reset();
          setMessage("");
        },
        (reason) => {
          if (!disposed) {
            setError(reason instanceof Error ? reason.message : "The GLB model could not be decoded.");
            setMessage("");
          }
        },
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The GLB model could not be decoded.");
      setMessage("");
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      controls.removeEventListener("change", render);
      controls.dispose();
      if (modelRoot) disposeObject(modelRoot);
      if (grid) {
        grid.geometry.dispose();
        disposeMaterial(grid.material as THREE.Material);
      }
      renderer.renderLists.dispose();
      renderer.dispose();
      viewRef.current = null;
    };
  }, [bytes, reducedMotion]);

  const onCanvasKeyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    const movement: Record<string, [number, number]> = {
      ArrowLeft: [-0.12, 0],
      ArrowRight: [0.12, 0],
      ArrowUp: [0, -0.1],
      ArrowDown: [0, 0.1],
    };
    const delta = movement[event.key];
    if (!delta) return;
    event.preventDefault();
    viewRef.current?.orbit(...delta);
  };

  return (
    <section aria-label={`3D preview of ${filePath}`} style={{ display: "grid", gap: 10 }}>
      <div style={{ ...panelStyle, minHeight: 420 }}>
        <canvas
          ref={canvasRef}
          tabIndex={0}
          aria-label={`3D model ${filePath}. Drag to orbit, scroll to zoom, or use arrow keys to orbit.`}
          onKeyDown={onCanvasKeyDown}
          style={{ display: "block", width: "100%", height: 420, outlineOffset: -3 }}
        />
        {message && <div role="status" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none" }}>{message}</div>}
        {error && <div role="alert" style={{ position: "absolute", inset: 20, display: "grid", placeItems: "center", textAlign: "center", color: "#7b2e22", pointerEvents: "none" }}>{error}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <p style={{ margin: 0, color: "#526168", fontSize: 13 }}>Imported model · geometry preview · glTF meters; dimensions/buildability not validated</p>
        <button className="button" type="button" onClick={() => viewRef.current?.reset()} disabled={Boolean(error)}>
          Reset view
        </button>
      </div>
    </section>
  );
}

export default function ArtifactPreview({ token, projectId, path: filePath }: ArtifactPreviewProps) {
  const requestKey = `${projectId}\0${filePath}`;
  const [asset, setAsset] = useState<AssetState>({ key: requestKey, status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    setAsset({ key: requestKey, status: "loading" });
    const load = async () => {
      try {
        const query = new URLSearchParams({ action: "asset", id: projectId, path: filePath });
        const response = await fetch(`/api/workshop?${query.toString()}`, {
          headers: { "X-Workshop-Token": token },
          signal: controller.signal,
          cache: "no-store",
        });
        const body = await response.json() as { data?: { mime?: unknown; base64?: unknown }; error?: unknown };
        if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "The artifact preview could not be loaded.");
        if (!body.data || typeof body.data.mime !== "string" || typeof body.data.base64 !== "string") {
          throw new Error("The artifact preview response was invalid.");
        }
        const supported = ["image/png", "image/jpeg", "image/webp", "model/gltf-binary"];
        if (!supported.includes(body.data.mime)) throw new Error("This artifact type is not supported for preview.");
        const bytes = decodeBase64(body.data.base64);
        if (!controller.signal.aborted) setAsset({ key: requestKey, status: "ready", mime: body.data.mime, bytes });
      } catch (reason) {
        if (controller.signal.aborted) return;
        setAsset({ key: requestKey, status: "error", message: reason instanceof Error ? reason.message : "The artifact preview could not be loaded." });
      }
    };
    void load();
    return () => controller.abort();
  }, [filePath, projectId, requestKey, token]);

  if (asset.key !== requestKey || asset.status === "loading") {
    return <div role="status" aria-live="polite" style={{ ...panelStyle, placeItems: "center" }}>Loading {filePath}…</div>;
  }
  if (asset.status === "error") {
    return <div role="alert" style={{ ...panelStyle, placeItems: "center", padding: 24, textAlign: "center", color: "#7b2e22" }}>{asset.message}</div>;
  }
  if (asset.mime === "model/gltf-binary") return <ModelPreview bytes={asset.bytes} path={filePath} />;
  return <ImagePreview bytes={asset.bytes} mime={asset.mime} path={filePath} />;
}
