import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { MapGenerator } from "./newGeneration.mjs";

var renderer;
var camera;
var scene;
var controls;

const mapWidth = 6;
const mapHeight = 6;

const generat = new MapGenerator(
  Math.round(Math.random() * 100),
  7,
  mapWidth,
  mapHeight,
  2,
  1,
  0,
  0.1,
  0.8
);
const planeGeometry = new THREE.PlaneGeometry(
  mapWidth * 2,
  mapHeight * 2,
  mapWidth,
  mapHeight
);

function genChunks(x, y) {
  for (let chunkX = -2; chunkX < 3; chunkX++) {
    for (let chunkY = -2; chunkY < 3; chunkY++) {
      console.log(
        (x + chunkX) * (mapWidth - 1),
        (y + chunkY) * (mapHeight - 1)
      );
      let terrainData = generat.generateMatrice(
        (x + chunkX) * mapWidth,
        (y + chunkY) * mapHeight
      );
      console.log(terrainData);
      let heigthCanvas = generat.generateImageFromMatrice(terrainData);
      let textureCanvas = generat.generateTextureCanvas(terrainData);

      let heightMap = new THREE.CanvasTexture(heigthCanvas);
      let textureMap = new THREE.CanvasTexture(textureCanvas);

      textureMap.minFilter = THREE.NearestFilter;
      textureMap.magFilter = THREE.NearestFilter;

      let planeMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        displacementMap: heightMap,
        displacementScale: 10,
        wireframe: false,
        flatShading: true,
        map: textureMap,
      });
      const mesh = new THREE.Mesh(planeGeometry, planeMaterial);
      mesh.rotation.x = Math.PI / 2;

      mesh.position.x = mapWidth * 2 * x + mapWidth * 2 * chunkX;
      mesh.position.z = mapHeight * 2 * y + mapHeight * 2 * chunkY;
      console.log(
        mapWidth * 2 * x + mapWidth * 2 * chunkX,
        mapHeight * 2 * y + mapHeight * 2 * chunkY
      );
      scene.add(mesh);
      document.body.appendChild(heigthCanvas);
      document.body.appendChild(textureCanvas);
    }
  }
}

function start() {
  scene = new THREE.Scene();

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    1,
    10000
  );

  camera.position.set(10, 0, 0);

  // CONTROLS
  controls = new OrbitControls(camera, renderer.domElement);
  controls.update();

  // CUBE

  const perso = new THREE.Mesh(new THREE.SphereGeometry(2));

  scene.add(perso);

  const waterMaterial = new THREE.MeshPhongMaterial({
    color: 0x0000ff,
    side: THREE.DoubleSide,
    wireframe: false,
    flatShading: true,
  });
  const waterplaneGeometry = new THREE.PlaneGeometry(10000, 10000);

  const water = new THREE.Mesh(waterplaneGeometry, waterMaterial);
  water.rotation.x = Math.PI / 2;
  water.position.y = -80;
  // scene.add(water);
  genChunks(0, 0);
  // AUTRE

  // LIGHT
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(0, 50, 0);
  light.position.x = Math.PI * 0.5;
  scene.add(light);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  scene.background = new THREE.Color(0x73aff6);
  animate();
}

function animate() {
  controls.update();
  renderer.render(scene, camera);

  requestAnimationFrame(animate);
}

start();
