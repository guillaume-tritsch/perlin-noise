import * as THREE from "three";
import { MapGenerator } from "./newGeneration.mjs";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

class WhiteWave {
  constructor(scene) {
    this.element = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1),
      new THREE.MeshPhongMaterial({ color: 0xffffff })
    );
    scene.add(this.element);
    this.element.position.x = boat.position.x;
    this.element.position.z = boat.position.z + 3;
    this.element.position.y = boat.position.y - 5;

    this.dep = 1.5;
    this.dir = Math.random() <= 0.5;
    this.element.rotation.x = Math.random() * Math.PI;
    this.element.rotation.y = Math.random() * Math.PI;
    this.element.rotation.z = Math.random() * Math.PI;
  }

  getElement() {
    return this.element;
  }

  transform() {
    this.element.scale.x += 0.01;
    this.element.scale.z += 0.01;
    this.element.scale.y += 0.01;
    if (this.dir) {
      this.element.position.x += this.dep;
    } else {
      this.element.position.x -= this.dep;
    }
    this.dep /= 2;
  }
}

var whiteWaveList = [];
var clock;
var waterMaterial;
var renderer;
var camera;
var scene;
var boat;
var perso;
var boatSpeed = 0;
var boatTargetSpeed = 0;
var boatOrientationSpeed = 0;

var yawAnimation = 0;

var boatTargetOrientationSpeed = 0;

const mapWidth = 50;
const mapHeight = 50;

const chunksLoadDistance = 5;

var scaleFactor = 10;

const generat = new MapGenerator(
  Math.round(Math.random() * 100),
  7,
  mapWidth,
  mapHeight,
  1.3
);
const planeGeometry = new THREE.PlaneGeometry(
  mapWidth * scaleFactor,
  mapHeight * scaleFactor,
  mapWidth,
  mapHeight
);

function genChunks(x, y) {
  for (
    let chunkX = -chunksLoadDistance;
    chunkX < chunksLoadDistance + 1;
    chunkX++
  ) {
    for (
      let chunkY = -chunksLoadDistance;
      chunkY < chunksLoadDistance + 1;
      chunkY++
    ) {
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
  camera.lookAt(0, 0, 0);

  boat = new THREE.Group();
  loader.load("./models/ship.glb", function (gltf) {
    perso = gltf.scene;
    perso.scale.set(0.005, 0.005, 0.005);
    perso.rotation.y = -Math.PI / 2;
    perso.position.y = -4;
    boat.add(perso);
  });
  boat.add(camera);
  boat.position.y = -75;
  scene.add(boat);

  clock = new THREE.Clock();

  // CUBE
  waterMaterial = new THREE.ShaderMaterial({
    vertexShader: `precision mediump float;
    
    varying vec2 vUv;
    uniform float uTime;
    
    //
    // Description : Array and textureless GLSL 2D/3D/4D simplex
    //               noise functions.
    //      Author : Ian McEwan, Ashima Arts.
    //  Maintainer : ijm
    //     Lastmod : 20110822 (ijm)
    //     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
    //               Distributed under the MIT License. See LICENSE file.
    //               https://github.com/ashima/webgl-noise
    //
    
    vec3 mod289(vec3 x) {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }
    
    vec4 mod289(vec4 x) {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }
    
    vec4 permute(vec4 x) {
         return mod289(((x*34.0)+1.0)*x);
    }
    
    vec4 taylorInvSqrt(vec4 r)
    {
      return 1.79284291400159 - 0.85373472095314 * r;
    }
    
    float snoise(vec3 v) {
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
      
      // First corner
      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 =   v - i + dot(i, C.xxx) ;
      
      // Other corners
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );
    
      //   x0 = x0 - 0.0 + 0.0 * C.xxx;
      //   x1 = x0 - i1  + 1.0 * C.xxx;
      //   x2 = x0 - i2  + 2.0 * C.xxx;
      //   x3 = x0 - 1.0 + 3.0 * C.xxx;
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
      vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y
      
      // Permutations
      i = mod289(i);
      vec4 p = permute( permute( permute(
                 i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
               + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
               
      // Gradients: 7x7 points over a square, mapped onto an octahedron.
      // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
      float n_ = 0.142857142857; // 1.0/7.0
      vec3  ns = n_ * D.wyz - D.xzx;
    
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)
    
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)
    
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
    
      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );
    
      //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
      //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
    
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    
      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);
      
      // Normalise gradients
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      
      // Mix final noise value
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                    dot(p2,x2), dot(p3,x3) ) );
    }
    
    void main() {
      vUv = uv;
    
      vec3 pos = position;
      float noiseFreq = 5.5;
      float noiseAmp = 1.7; 
      vec3 noisePos = vec3(pos.x * noiseFreq + uTime, pos.y, pos.z);
      pos.z += snoise(noisePos) * noiseAmp;


      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
    }`,
    fragmentShader: `precision mediump float;

    varying vec2 vUv;
    
    void main() {
      gl_FragColor = vec4(0.25, 0.4, 1., 0.6);
    }`,
    uniforms: {
      uTime: { value: 0.0 },
    },
    transparent: true,
    side: THREE.DoubleSide,
    wireframe: false,
    flatShading: true,
  });
  const waterplaneGeometry = new THREE.PlaneGeometry(10000, 10000, 1000, 1000);

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
    boatTargetOrientationSpeed = 0;
  }
  if (event.key === "s" || event.key === "z") {
    boatTargetSpeed = 0;
  }
});
function animate() {
  console.log(boatSpeed);
  if (whiteWaveList.length < Math.round(boatSpeed * 30)) {
    whiteWaveList.push(new WhiteWave(scene));
    whiteWaveList.push(new WhiteWave(scene));

    whiteWaveList.push(new WhiteWave(scene));
  } else if (whiteWaveList.length > 0) {
    let d = whiteWaveList.shift();
    scene.remove(d.getElement());
  }

  whiteWaveList.forEach((element) => {
    element.transform();
  });
  waterMaterial.uniforms.uTime.value = clock.getElapsedTime();

  // Calculer la différence entre l'orientation cible et l'orientation actuelle du bateau
  let orientationDifference = boatTargetOrientationSpeed - boatOrientationSpeed;

  boatOrientationSpeed += Math.sin(orientationDifference) * 0.03;
  let rboatOrientationSpeed = boatOrientationSpeed * (boatSpeed + 0.01) * 2;

  // Utiliser la fonction sinus pour moduler l'orientation en fonction de la différence
  // Cela rendra la transition plus douce en utilisant une sorte de courbe "ease in out"
  boat.rotation.y += rboatOrientationSpeed; // Vous pouvez ajuster le coefficient 0.05 selon vos besoins

  yawAnimation += 0.1 * (boatSpeed / 2 + 0.1);
  let ry = (Math.sin(yawAnimation) / 100) * (boatSpeed / 2 + 0.2) ** 2;
  if (perso) perso.rotation.x += ry;

  boat.rotation.z = rboatOrientationSpeed * 10;
  // Calculer la différence entre la vitesse cible et la vitesse actuelle
  let speedDifference = boatTargetSpeed - boatSpeed;
  let malus = 0.003;
  if (speedDifference < 0) malus = 0.01;
  boatSpeed += Math.sin(speedDifference) * malus * (1 - boatSpeed);

  boat.translateZ(boatSpeed);

  renderer.render(scene, camera);

  requestAnimationFrame(animate);
}

start();
