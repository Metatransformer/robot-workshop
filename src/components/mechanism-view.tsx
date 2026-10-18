"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { AlertTriangle, Eye, Pause, Play, RotateCcw, Route } from "lucide-react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { ModelKind } from "@/lib/contracts";
import { fourBarFromRecord, solveFourBar, type Point2 } from "@/lib/kinematics";

type MechanismViewProps = {
  model: ModelKind;
  parameters: Record<string, number>;
  onParametersChange?: (parameters: Record<string, number>) => void;
};

type SceneHandle = {
  reset: () => void;
  setExploded: (amount: number) => void;
  orbit: (horizontal: number, vertical: number) => void;
};

function disposeObject(root: THREE.Object3D) {
  root.traverse((object) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
      object.geometry?.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => material?.dispose());
    }
  });
}

function setRod(mesh: THREE.Mesh, a: Point2, b: Point2, scale: number, center: number, y: number) {
  const ax = a.x * scale - center;
  const az = a.y * scale;
  const bx = b.x * scale - center;
  const bz = b.y * scale;
  mesh.position.set((ax + bx) / 2, y, (az + bz) / 2);
  mesh.scale.x = Math.max(0.001, Math.hypot(bx - ax, bz - az));
  mesh.rotation.y = -Math.atan2(bz - az, bx - ax);
}

export default function MechanismView({ model, parameters, onParametersChange }: MechanismViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<SceneHandle | null>(null);
  const parametersRef = useRef(parameters);
  const playingRef = useRef(false);
  const trailRef = useRef(true);
  const [playing, setPlaying] = useState(false);
  const [trail, setTrail] = useState(true);
  const [exploded, setExploded] = useState(0);
  const [warning, setWarning] = useState("");
  const [webglError, setWebglError] = useState("");
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    parametersRef.current = parameters;
  }, [parameters]);
  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => { trailRef.current = trail; }, [trail]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReducedMotion(media.matches);
      if (media.matches) setPlaying(false);
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      setWebglError("The 3D view could not start. Project documents and parameters are still available.");
      setPlaying(false);
      return;
    }
    setWebglError("");
    const contextLost = (event: Event) => {
      event.preventDefault();
      setWebglError("The 3D view stopped because WebGL became unavailable. Project documents and parameters are still available.");
      setPlaying(false);
    };
    canvas.addEventListener("webglcontextlost", contextLost);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xe8edf0, 13, 27);
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    const defaultCamera = new THREE.Vector3(9.6, 9.2, 13.2);
    camera.position.copy(defaultCamera);
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 6;
    controls.maxDistance = 22;
    controls.target.set(0, 0.35, 1.1);

    scene.add(new THREE.HemisphereLight(0xfffbef, 0x435160, 2.5));
    const key = new THREE.DirectionalLight(0xfff2d8, 4.2);
    key.position.set(-4, 9, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x7fabc2, 2.4);
    rim.position.set(7, 4, -7);
    scene.add(rim);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(12, 0.3, 8),
      new THREE.MeshStandardMaterial({ color: 0x26333a, roughness: 0.82, metalness: 0.08 }),
    );
    base.position.y = -0.25;
    base.receiveShadow = true;
    scene.add(base);

    const grid = new THREE.GridHelper(12, 24, 0x5f91a9, 0x345362);
    grid.position.y = -0.09;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.42;
    scene.add(grid);

    const modelRoot = new THREE.Group();
    scene.add(modelRoot);
    const explodedPieces: { object: THREE.Object3D; origin: THREE.Vector3; direction: THREE.Vector3 }[] = [];
    let updateModel: (elapsed: number) => void = () => undefined;
    let resetModel: () => void = () => undefined;

    if (model === "linkage") {
      const orange = new THREE.MeshStandardMaterial({ color: 0xc75a2a, metalness: 0.58, roughness: 0.28 });
      const blue = new THREE.MeshStandardMaterial({ color: 0x3f7088, metalness: 0.66, roughness: 0.25 });
      const steel = new THREE.MeshStandardMaterial({ color: 0xc2c8c5, metalness: 0.84, roughness: 0.2 });
      const dark = new THREE.MeshStandardMaterial({ color: 0x20282b, metalness: 0.5, roughness: 0.38 });
      const rodGeometry = new THREE.BoxGeometry(1, 0.18, 0.32);
      const crankRod = new THREE.Mesh(rodGeometry, orange);
      const couplerRod = new THREE.Mesh(rodGeometry, blue);
      const rockerRod = new THREE.Mesh(rodGeometry, dark);
      [crankRod, couplerRod, rockerRod].forEach((mesh) => { mesh.castShadow = true; modelRoot.add(mesh); });

      const pivots = Array.from({ length: 4 }, () => {
        const pivot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.42, 32), steel);
        pivot.castShadow = true;
        pivot.position.y = 0.44;
        modelRoot.add(pivot);
        return pivot;
      });
      const feet = [-2.6, 2.6].map((x) => {
        const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.62, 0.3, 32), dark);
        foot.position.set(x, 0.05, 0);
        foot.castShadow = true;
        modelRoot.add(foot);
        return foot;
      });
      const trailGeometry = new THREE.BufferGeometry();
      const trailMaterial = new THREE.LineBasicMaterial({ color: 0xf1b780, transparent: true, opacity: 0.85 });
      const trailLine = new THREE.Line(trailGeometry, trailMaterial);
      trailLine.position.y = 0.03;
      modelRoot.add(trailLine);
      const trailPoints: THREE.Vector3[] = [];
      let angle = parametersRef.current.angle ?? 0.35;
      let previousTime = 0;

      updateModel = (elapsed) => {
        const p = fourBarFromRecord(parametersRef.current);
        if (playingRef.current) {
          const delta = Math.min(0.05, Math.max(0, elapsed - previousTime));
          angle = (angle + delta * (parametersRef.current.speed ?? 0.72)) % (Math.PI * 2);
        }
        previousTime = elapsed;
        const solved = solveFourBar(p, angle);
        const scale = p.ground > 0 ? 5.2 / p.ground : 1;
        const center = 2.6;
        if (!solved.valid) {
          setWarning(solved.reason);
          crankRod.visible = false;
          couplerRod.visible = false;
          rockerRod.visible = false;
          pivots.slice(2).forEach((pivot) => { pivot.visible = false; });
          return;
        }
        setWarning("");
        crankRod.visible = couplerRod.visible = rockerRod.visible = true;
        pivots.forEach((pivot) => { pivot.visible = true; });
        setRod(crankRod, solved.groundA, solved.crankEnd, scale, center, 0.38);
        setRod(couplerRod, solved.crankEnd, solved.couplerEnd, scale, center, 0.55);
        setRod(rockerRod, solved.groundB, solved.couplerEnd, scale, center, 0.38);
        [solved.groundA, solved.groundB, solved.crankEnd, solved.couplerEnd].forEach((point, index) => {
          pivots[index].position.set(point.x * scale - center, index > 1 ? 0.58 : 0.34, point.y * scale);
        });
        [solved.groundA, solved.groundB].forEach((point, index) => {
          feet[index].position.set(point.x * scale - center, 0.05, point.y * scale);
        });
        if (playingRef.current && trailRef.current) {
          const next = new THREE.Vector3(solved.couplerEnd.x * scale - center, 0, solved.couplerEnd.y * scale);
          if (!trailPoints.length || next.distanceTo(trailPoints[trailPoints.length - 1]) > 0.06) {
            trailPoints.push(next);
            if (trailPoints.length > 180) trailPoints.shift();
            trailGeometry.setFromPoints(trailPoints);
          }
        }
        trailLine.visible = trailRef.current;
      };
      resetModel = () => {
        angle = 0.35;
        trailPoints.splice(0);
        trailGeometry.setFromPoints([]);
      };
    } else if (model === "robot") {
      const yellow = new THREE.MeshStandardMaterial({ color: 0xd59038, metalness: 0.42, roughness: 0.34 });
      const charcoal = new THREE.MeshStandardMaterial({ color: 0x20292c, metalness: 0.66, roughness: 0.28 });
      const pieces = [
        new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.5, 0.55, 40), charcoal),
        new THREE.Mesh(new THREE.BoxGeometry(0.68, 3.5, 0.7), yellow),
        new THREE.Mesh(new THREE.BoxGeometry(0.62, 2.9, 0.62), yellow),
        new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 0.52), charcoal),
      ];
      pieces[0].position.set(0, 0.25, 0);
      pieces[1].position.set(0, 2.1, 0); pieces[1].rotation.z = -0.42;
      pieces[2].position.set(1.4, 4.7, 0); pieces[2].rotation.z = -0.72;
      pieces[3].position.set(3.15, 5.65, 0);
      pieces.forEach((piece, index) => {
        piece.castShadow = true; modelRoot.add(piece);
        explodedPieces.push({ object: piece, origin: piece.position.clone(), direction: new THREE.Vector3(index * 0.45 - 0.6, index * 0.32, index % 2 ? 0.65 : -0.5) });
      });
    } else if (model === "cyberdeck") {
      const shell = new THREE.MeshStandardMaterial({ color: 0x333b3b, metalness: 0.18, roughness: 0.72 });
      const screen = new THREE.MeshStandardMaterial({ color: 0x6ca4b5, emissive: 0x173d49, emissiveIntensity: 1.3, roughness: 0.22 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(6.7, 0.8, 4.4), shell);
      body.position.y = 0.45;
      const display = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.22, 2.15), screen);
      display.position.set(-0.65, 1, -0.42);
      const controlsPanel = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.28, 3.1), shell);
      controlsPanel.position.set(2.55, 1.03, 0.2);
      [body, display, controlsPanel].forEach((piece, index) => {
        piece.castShadow = true; modelRoot.add(piece);
        explodedPieces.push({ object: piece, origin: piece.position.clone(), direction: new THREE.Vector3(index - 1, index * 0.75, index % 2 ? -0.5 : 0.5) });
      });
      for (let row = 0; row < 3; row += 1) for (let column = 0; column < 3; column += 1) {
        const keycap = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.15, 16), new THREE.MeshStandardMaterial({ color: column === 2 ? 0xc75a2a : 0xc6c3b5, roughness: 0.5 }));
        keycap.position.set(2.25 + column * 0.34, 1.25, -0.45 + row * 0.45);
        modelRoot.add(keycap);
      }
    }

    handleRef.current = {
      reset: () => {
        camera.position.copy(defaultCamera);
        controls.target.set(0, 0.35, 1.1);
        controls.update();
        resetModel();
      },
      setExploded: (amount) => explodedPieces.forEach(({ object, origin, direction }) => object.position.copy(origin).addScaledVector(direction, amount)),
      orbit: (horizontal, vertical) => {
        controls.rotateLeft(horizontal);
        controls.rotateUp(vertical);
        controls.update();
      },
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    let animationFrame = 0;
    const clock = new THREE.Clock();
    const render = () => {
      updateModel(clock.getElapsedTime());
      controls.update();
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", contextLost);
      controls.dispose();
      disposeObject(scene);
      renderer.dispose();
      handleRef.current = null;
    };
  }, [model]);

  const changeCrank = useCallback((value: number) => {
    onParametersChange?.({ ...parameters, crank: value });
  }, [onParametersChange, parameters]);

  const changeExploded = (value: number) => {
    setExploded(value);
    handleRef.current?.setExploded(value);
  };

  const orbitWithKeyboard = (event: ReactKeyboardEvent<HTMLCanvasElement>) => {
    const movement: Record<string, [number, number]> = {
      ArrowLeft: [0.14, 0], ArrowRight: [-0.14, 0], ArrowUp: [0, 0.12], ArrowDown: [0, -0.12],
    };
    const next = movement[event.key];
    if (!next || webglError) return;
    event.preventDefault();
    handleRef.current?.orbit(...next);
  };

  return (
    <section className="mechanism" aria-label={model === "linkage" ? "Interactive four-bar linkage" : `${model} concept preview`}>
      <canvas ref={canvasRef} className="mechanism__canvas" tabIndex={0} onKeyDown={orbitWithKeyboard} aria-label="3D model. Drag to orbit, or focus this view and use the arrow keys." />
      <div className="mechanism__wash" aria-hidden="true" />
      <div className="mechanism__legend">
        <span className="eyebrow">{model === "linkage" ? "Kinematic study" : "Concept preview"}</span>
        <strong>{model === "linkage" ? "Motion you can inspect." : "Form and assembly, not manufacturing dimensions."}</strong>
      </div>
      {webglError && <div className="mechanism__error"><AlertTriangle size={16} /> {webglError}</div>}
      {warning && <div className="mechanism__error"><AlertTriangle size={16} /> {warning}</div>}
      <div className="mechanism__controls">
        {model === "linkage" ? (
          <>
            <button className="round-control" type="button" onClick={() => setPlaying((value) => !value)} aria-label={playing ? "Pause mechanism" : "Play mechanism"} disabled={Boolean(webglError)}>
              {playing ? <Pause size={17} /> : <Play size={17} />}
            </button>
            <label className="range-control">
              <span>Crank length <b>{(parameters.crank ?? 25).toFixed(1)} mm</b></span>
              <input aria-label="Crank length in millimetres" type="range" min="5" max="40" step="0.5" value={parameters.crank ?? 25} onChange={(event) => changeCrank(Number(event.target.value))} />
            </label>
            <button className={`icon-text-control ${trail ? "is-active" : ""}`} type="button" onClick={() => setTrail((value) => !value)} aria-pressed={trail} disabled={Boolean(webglError)}>
              <Route size={16} /> Pen trail
            </button>
          </>
        ) : model !== "none" ? (
          <label className="range-control">
            <span>Exploded view <b>{Math.round(exploded * 100)}%</b></span>
            <input aria-label="Exploded view amount" type="range" min="0" max="1" step="0.05" value={exploded} onChange={(event) => changeExploded(Number(event.target.value))} />
          </label>
        ) : <span className="muted"><Eye size={16} /> This project is documentation-first.</span>}
        <button className="icon-text-control" type="button" onClick={() => handleRef.current?.reset()} disabled={Boolean(webglError)}>
          <RotateCcw size={16} /> Reset view
        </button>
      </div>
      {reducedMotion && model === "linkage" && !playing && <span className="motion-note">Animation paused for reduced motion</span>}
    </section>
  );
}
