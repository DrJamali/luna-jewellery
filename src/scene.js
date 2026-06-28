/* =========================================================
   LUNA — real-time 3D hero scene
   Gold crescent moon (PBR) + glass gem (transmission) +
   floating sparkles, real environment reflections, bloom.
   Vanilla Three.js (r160). A loadModel() hook is exposed so
   AI-generated GLB jewellery can be dropped in later.
   ========================================================= */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export function initHeroScene(canvas) {
  if (!canvas) return null;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  // --- Procedural environment for realistic metal/glass reflections ---
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  // --- Lighting (pink key + gold rim) ---
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const key = new THREE.DirectionalLight(0xffd9e6, 2.2);
  key.position.set(4, 6, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffe6b0, 1.6);
  rim.position.set(-6, -2, 3);
  scene.add(rim);
  const fill = new THREE.PointLight(0xf7b8cd, 30, 40);
  fill.position.set(-3, 3, 5);
  scene.add(fill);

  // --- Group that holds the hero jewellery ---
  const jewel = new THREE.Group();
  scene.add(jewel);

  /* ---- Gold crescent moon (extruded crescent shape) ---- */
  const crescent = (() => {
    const R = 1.55, rInner = 1.28, offset = 0.62;
    const shape = new THREE.Shape();
    shape.absarc(0, 0, R, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(offset, 0.05, rInner, 0, Math.PI * 2, true);
    shape.holes.push(hole);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.42, bevelEnabled: true, bevelThickness: 0.16,
      bevelSize: 0.16, bevelSegments: 8, curveSegments: 96,
    });
    geo.center();

    const mat = new THREE.MeshPhysicalMaterial({
      color: 0xf0cd8b, metalness: 1.0, roughness: 0.17,
      clearcoat: 0.6, clearcoatRoughness: 0.25, envMapIntensity: 1.4,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.set(-0.15, -0.55, 0.18);
    return mesh;
  })();
  jewel.add(crescent);

  /* ---- Glowing gem "star" set into the crescent ---- */
  const gem = (() => {
    const geo = new THREE.OctahedronGeometry(0.42, 0);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, metalness: 0, roughness: 0.02,
      transmission: 1.0, thickness: 0.9, ior: 2.2,
      iridescence: 1.0, iridescenceIOR: 1.6,
      specularColor: 0xffd9e6, envMapIntensity: 2.0,
      attenuationColor: 0xffd0e2, attenuationDistance: 1.4,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0.15, 0.1, 0.7);
    mesh.scale.setScalar(1.05);
    return mesh;
  })();
  jewel.add(gem);

  // a tiny emissive core so the gem reads as luminous through bloom
  const spark = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  spark.position.copy(gem.position);
  jewel.add(spark);

  /* ---- Floating sparkle dust ---- */
  const dust = (() => {
    const COUNT = reduced ? 120 : 360;
    const tex = (() => {
      const c = document.createElement("canvas");
      c.width = c.height = 64;
      const g = c.getContext("2d");
      const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, "rgba(255,255,255,1)");
      grad.addColorStop(0.3, "rgba(255,225,238,0.85)");
      grad.addColorStop(1, "rgba(255,225,238,0)");
      g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
      const t = new THREE.Texture(c); t.needsUpdate = true; return t;
    })();
    const palette = [0xffffff, 0xf7b8cd, 0xef9ab6, 0xe6c690];
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);
    const c = new THREE.Color();
    for (let i = 0; i < COUNT; i++) {
      const r = 2.4 + Math.random() * 4.2;
      const t = Math.random() * Math.PI * 2;
      const p = (Math.random() - 0.5) * Math.PI;
      pos[i * 3] = Math.cos(t) * Math.cos(p) * r;
      pos[i * 3 + 1] = Math.sin(p) * r;
      pos[i * 3 + 2] = Math.sin(t) * Math.cos(p) * r * 0.6;
      c.setHex(palette[(Math.random() * palette.length) | 0]);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.09, map: tex, vertexColors: true, transparent: true,
      depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
    });
    return new THREE.Points(geo, mat);
  })();
  scene.add(dust);

  /* ---- Post-processing: subtle bloom on the bright gem + dust ---- */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.5, 0.82);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* ---- Resize ---- */
  function resize() {
    const r = canvas.parentElement.getBoundingClientRect();
    const w = Math.max(1, r.width), h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas.parentElement);
  resize();

  /* ---- Pointer parallax ---- */
  let tx = 0, ty = 0, cx = 0, cy = 0;
  if (!window.matchMedia("(hover: none)").matches) {
    window.addEventListener("mousemove", (e) => {
      tx = (e.clientX / innerWidth - 0.5);
      ty = (e.clientY / innerHeight - 0.5);
    });
  }

  /* ---- Animation loop ---- */
  const clock = new THREE.Clock();
  let raf;
  function tick() {
    const t = clock.getElapsedTime();
    cx += (tx - cx) * 0.05;
    cy += (ty - cy) * 0.05;

    if (!reduced) {
      jewel.rotation.y = Math.sin(t * 0.25) * 0.35 + cx * 0.6;
      jewel.rotation.x = Math.sin(t * 0.32) * 0.08 - cy * 0.4;
      jewel.position.y = Math.sin(t * 0.8) * 0.12;
      gem.rotation.y = t * 0.9;
      gem.rotation.x = t * 0.5;
      spark.rotation.copy(gem.rotation);
      const pulse = 0.85 + Math.sin(t * 2.2) * 0.15;
      spark.scale.setScalar(pulse);
      dust.rotation.y = t * 0.04;
    }
    composer.render();
    raf = requestAnimationFrame(tick);
  }
  tick();

  /* ---- Public API: swap in an AI-generated GLB model ---- */
  function loadModel(url, { hideProcedural = true, scale = 1, y = 0 } = {}) {
    const loader = new GLTFLoader();
    loader.load(url, (gltf) => {
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const fit = 3.2 / Math.max(size.x, size.y, size.z);
      model.position.sub(center);
      model.scale.setScalar(fit * scale);
      model.position.y += y;
      if (hideProcedural) { crescent.visible = false; gem.visible = false; spark.visible = false; }
      jewel.add(model);
    });
  }

  return {
    loadModel,
    dispose() { cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); pmrem.dispose(); },
  };
}
