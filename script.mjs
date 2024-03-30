import * as THREE from "three";
import { MapGenerator } from "./newGeneration.mjs";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

var renderer;
var camera;
var scene;
var boat;
var perso;
var boatSpeed = 0;
var boatTargetSpeed = 0;
var boatOrientationSpeed = 0;

var yawAnimation = 0

var boatTargetOrientationSpeed = 0;

const mapWidth = 50;
const mapHeight = 50;

const chunksLoadDistance = 5

var scaleFactor = 10;

const generat = new MapGenerator(
  Math.round(Math.random() * 100),
  7,
  mapWidth,
  mapHeight,
  1.3,


);
const planeGeometry = new THREE.PlaneGeometry(
  mapWidth * scaleFactor,
  mapHeight * scaleFactor,
  mapWidth,
  mapHeight
);

function genChunks(x, y) {
  for (let chunkX = -chunksLoadDistance; chunkX < chunksLoadDistance + 1; chunkX++) {
    for (let chunkY = -chunksLoadDistance; chunkY < chunksLoadDistance + 1; chunkY++) {
      let terrainData = generat.generateMatrice(
        (x + chunkX) * mapWidth,
        (y + chunkY) * mapHeight
      );
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
        displacementScale: 100,
        wireframe: false,
        flatShading: true,
        map: textureMap,
      });
      const mesh = new THREE.Mesh(planeGeometry, planeMaterial);
      mesh.rotation.x = Math.PI / 2;

      mesh.position.x =
        mapWidth * scaleFactor * x + mapWidth * scaleFactor * chunkX;
      mesh.position.z = -(
        mapHeight * scaleFactor * y +
        mapHeight * scaleFactor * chunkY
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


  const loader = new GLTFLoader();

 


  camera.position.set(0, 10, -30);
  camera.lookAt(0,0,0);

  boat = new THREE.Group();
  loader.load( './models/ship.glb', function ( gltf ) {
  
     perso = gltf.scene
     perso.scale.set(0.005, 0.005, 0.005);
     perso.rotation.y = -Math.PI  / 2
     perso.position.y = -4
    boat.add(perso);
  
  });
  boat.add(camera);
  boat.position.y = -75;
  scene.add(boat);

  // CUBE

  const waterMaterial = new THREE.MeshPhongMaterial({
    color: 0x38c2ff,
    side: THREE.DoubleSide,
    wireframe: false,
    flatShading: true,
  });
  const waterplaneGeometry = new THREE.PlaneGeometry(10000, 10000);

  const water = new THREE.Mesh(waterplaneGeometry, waterMaterial);
  water.rotation.x = Math.PI / 2;
  water.position.y = -80;
  scene.add(water);
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

document.addEventListener("keydown", (event) => {
  console.log(boatOrientationSpeed);
  if (event.key === "s") {
    boatTargetSpeed -= 1;
    if (boatTargetSpeed < 0) boatTargetSpeed = 0;
  } else if (event.key === "z") {
    if (boatTargetSpeed < 1) boatTargetSpeed += 1;
  } 
  
  if (event.key === "q") {
    if (boatTargetOrientationSpeed < 0.006) boatTargetOrientationSpeed += 0.006;
  } else if (event.key === "d") {
    if (boatTargetOrientationSpeed > -0.006)
      boatTargetOrientationSpeed -= 0.006;
  } 
});
document.addEventListener("keyup", (event) => {
  if (event.key === "q" || event.key === "d") {
    boatTargetOrientationSpeed = 0
  }
  if (event.key === "s" || event.key === "z") {
    boatTargetSpeed = 0
  }
})
function animate() {
  renderer.render(scene, camera);

  // Calculer la différence entre l'orientation cible et l'orientation actuelle du bateau
  let orientationDifference = boatTargetOrientationSpeed - boatOrientationSpeed;

  boatOrientationSpeed += Math.sin(orientationDifference) * 0.03;
  let rboatOrientationSpeed = boatOrientationSpeed * (boatSpeed + 0.01) * 2;
  console.log(
    Math.round(boatOrientationSpeed * 10000) / 10000,
    Math.round(boatSpeed * 100) / 100,
  );
  // Utiliser la fonction sinus pour moduler l'orientation en fonction de la différence
  // Cela rendra la transition plus douce en utilisant une sorte de courbe "ease in out"
  boat.rotation.y += rboatOrientationSpeed; // Vous pouvez ajuster le coefficient 0.05 selon vos besoins

  yawAnimation += 0.1 * (boatSpeed /2 +0.1)
  let ry =Math.sin(yawAnimation) / 100 * ((boatSpeed /2 +0.2) ** 2)
  console.log(ry)
  if (perso) perso.rotation.x += ry-0.000025

  boat.rotation.z = rboatOrientationSpeed  * 10
  // Calculer la différence entre la vitesse cible et la vitesse actuelle
  let speedDifference = boatTargetSpeed - boatSpeed;
  let malus = 0.003
  if (speedDifference < 0) malus = 0.01
  boatSpeed += Math.sin(speedDifference) * malus * (1 - boatSpeed);

  boat.translateZ(boatSpeed);

  requestAnimationFrame(animate);
}

start();
