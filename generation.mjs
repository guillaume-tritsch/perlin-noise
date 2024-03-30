export class MapGenerator {
  constructor(
    seed,
    octaves = 8,
    width = 400,
    height = 400,
    depth = 20,
    scale = 0.05,
    persistence = 0.5,
    lacunarity = 2.0
  ) {
    this.seed = seed;
    this.octaves = octaves;
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.scale = scale;
    this.persistence = persistence;
    this.lacunarity = lacunarity;
  }

  setOctaves(octaves) {
    this.octaves = octaves;
  }

  getOctaves() {
    return this.octaves;
  }

  setWidth(width) {
    this.width = width;
  }

  getWidth() {
    return this.width;
  }

  setHeight(height) {
    this.height = height;
  }

  getHeight() {
    return this.height;
  }

  setDepth(depth) {
    this.depth = depth;
  }

  getDepth() {
    return this.depth;
  }

  setScale(scale) {
    this.scale = scale;
  }

  getScale() {
    return this.scale;
  }

  setPersistence(persistence) {
    this.persistence = persistence;
  }

  getPersistence() {
    return this.persistence;
  }

  setLacunarity(lacunarity) {
    this.lacunarity = lacunarity;
  }

  getLacunarity() {
    return this.lacunarity;
  }

  generateMatrice(
    xOffset,
    yOffset,
    seed = this.seed,
    octaves = this.octaves,
    width = this.width,
    height = this.height,
    depth = this.depth,
    scale = this.scale,
    persistence = this.persistence,
    lacunarity = this.lacunarity
  ) {
    function lerp(t, a, b) {
      return a + t * (b - a);
    }

    function grad(hash, x, y) {
      const h = hash & 15;
      const u = h < 8 ? x : y;
      const v = h < 4 ? y : h === 12 || h === 14 ? x : y;
      return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    function generatePermutation(seed) {
      const permutation = Array.from({ length: 256 }, (_, i) => i);

      for (let i = 255; i > 0; i--) {
        const r = (seed * (i + 1) * 2654435761) & 0xff;
        [permutation[i], permutation[r]] = [permutation[r], permutation[i]];
      }

      return permutation.concat(permutation);
    }

    function perlin(x, y) {
      const X = Math.floor(x) & 255;
      const Y = Math.floor(y) & 255;

      x -= Math.floor(x);
      y -= Math.floor(y);

      const u = x * x * x * (x * (x * 6 - 15) + 10);
      const v = y * y * y * (y * (y * 6 - 15) + 10);

      const p = generatePermutation(seed);

      const X0 = X & 255;
      const X1 = (X + 1) & 255;
      const Y0 = Y & 255;
      const Y1 = (Y + 1) & 255;

      const gi00 = p[p[X0] + Y0] & 7;
      const gi01 = p[p[X0] + Y1] & 7;
      const gi10 = p[p[X1] + Y0] & 7;
      const gi11 = p[p[X1] + Y1] & 7;

      let n00 = grad(gi00, x, y);
      let n01 = grad(gi01, x, y - 1);
      let n10 = grad(gi10, x - 1, y);
      let n11 = grad(gi11, x - 1, y - 1);

      const ufade = (3 - 2 * u) * u * u;
      const vfade = (3 - 2 * v) * v * v;

      const x0 = lerp(ufade, n00, n10);
      const x1 = lerp(ufade, n01, n11);

      return lerp(vfade, x0, x1);
    }

    const terrain = [];

    for (let y = yOffset; y <= yOffset + height; y++) {
      const row = [];
      for (let x = xOffset; x <= xOffset + width; x++) {
        let value = 0;
        let frequency = 1;
        let amplitude = 1;

        for (let i = 0; i < octaves; i++) {
          value +=
            perlin((x * frequency) / width, (y * frequency) / height) *
            amplitude;
          frequency *= lacunarity;
          amplitude *= persistence;
        }

        row.push(value * depth);
      }
      terrain.push(row);
    }

    function normalizeTerrain(terrain, minValue, maxValue, mapGenerator) {
      let flatTerrain = [...terrain.flat()];
      const max = mapGenerator.getMax(flatTerrain);
      const min = mapGenerator.getMin(flatTerrain);

      const range = max - min;
      const newRange = maxValue - minValue;

      for (let y = 0; y < terrain.length; y++) {
        for (let x = 0; x < terrain[y].length; x++) {
          terrain[y][x] = ((terrain[y][x] - min) / range) * newRange + minValue;
        }
      }
    }

    for (let y = 0; y < terrain.length; y++) {
      for (let x = 0; x < terrain[y].length; x++) {
        //terrain[y][x] = 1 - terrain[y][x] ** 2;
        terrain[y][x] = terrain[y][x] * (1 + Math.exp(terrain[y][x]) * 2);
      }
    }

    normalizeTerrain(terrain, 0, 1, this);

    for (let y = 0; y < terrain.length; y++) {
      for (let x = 0; x < terrain[y].length; x++) {
        terrain[y][x] = 1 - terrain[y][x];
      }
    }
    return terrain;
  }

  generateImage(
    xOffset,
    yOffset,
    seed = this.seed,
    octaves = this.octaves,
    width = this.width,
    height = this.height,
    depth = this.depth,
    scale = this.scale,
    persistence = this.persistence,
    lacunarity = this.lacunarity
  ) {
    const heightData = this.generateMatrice(
      xOffset,
      yOffset,
      seed,
      octaves,
      width,
      height,
      depth,
      scale,
      persistence,
      lacunarity
    );

    // Créez un canvas pour générer la texture
    var canvas = document.createElement("canvas");
    width = heightData.length;
    depth = heightData[0].length;
    canvas.width = width;
    canvas.height = depth;
    var context = canvas.getContext("2d");

    // Parcourez les données de hauteur et mettez à jour le canvas
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        var heightValue = heightData[y][x];
        var grayscaleValue = heightValue * 255; // Normalisation à une échelle de 0-255
        context.fillStyle =
          "rgb(" +
          grayscaleValue +
          "," +
          grayscaleValue +
          "," +
          grayscaleValue +
          ")";
        context.fillRect(x, y, 1, 1);
      }
    }

    return canvas;
  }

  generateImageFromMatrice(heightData) {
    // Créez un canvas pour générer la texture
    var canvas = document.createElement("canvas");
    var width = heightData.length;
    var height = heightData[0].length;
    canvas.width = width;
    canvas.height = height;
    var context = canvas.getContext("2d");

    // Parcourez les données de hauteur et mettez à jour le canvas
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        var heightValue = heightData[y][x];
        var grayscaleValue = heightValue * 255; // Normalisation à une échelle de 0-255
        context.fillStyle =
          "rgb(" +
          grayscaleValue +
          "," +
          grayscaleValue +
          "," +
          grayscaleValue +
          ")";
        context.fillRect(x, y, 1, 1);
      }
    }

    return canvas;
  }

  getMax(arr) {
    let len = arr.length;
    let max = -Infinity;

    while (len--) {
      max = arr[len] > max ? arr[len] : max;
    }
    return max;
  }

  getMin(arr) {
    let len = arr.length;
    let min = Infinity;

    while (len--) {
      min = arr[len] < min ? arr[len] : min;
    }
    return min;
  }

  generateTextureCanvas(terrain) {
    const canvas = document.createElement("canvas");
    const canvasWidth = terrain[0].length; // Width is determined by the depth of the height data
    const canvasHeight = terrain.length; // Height is determined by the height data rows
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const context = canvas.getContext("2d");

    const min = this.getMin(terrain);
    const max = this.getMax(terrain);

    for (let y = 0; y < canvasHeight; y++) {
      for (let x = 0; x < canvasWidth; x++) {
        const averageSlope = this.calculateAverageSlope(terrain, x, y);
        const color = this.getColorForNormalizedValue(
          averageSlope,
          terrain[y][x]
        );

        context.fillStyle = color;
        context.fillRect(x, y, 1, 1);
      }
    }

    return canvas;
  }

  getColorForNormalizedValue(normalizedValue, depth) {
    // Define color mappings based on normalized height value
    // You can adjust these mappings to fit your desired color scheme
    const gentleSlopeColor = "rgb(30, 128, 30)"; // Brown for steep slopes
    const grass = "rgb(0, 128, 0)"; // Green for gentle slopes
    const grey = "rgb(200, 200, 200)"; // White for flat areas
    const snow = "rgb(255, 255, 255)"; // White for flat areas
    const sand = "rgb(255, 236, 165)"; // White for flat areas
    /*
    if (normalizedValue > 0.02) {
      return grey;
    } else if (normalizedValue > 0.011) {
      
      
        return snow;
      }
      return gentleSlopeColor;
    } else {
      if (depth < Math.random() / 4 + 0.25) {
        return snow;
      } else if (depth < Math.random() / 4 + 0.5) {
        return grey;
      } else {
        return grass;
      }
    }
    */
    if (normalizedValue > 0.01 && depth > /*Math.random() / 16 +*/ 0.2) {
      return grass;
    } else {
      if (depth < /*Math.random() / 16 +*/ 0.2) {
        return snow;
      } else if (depth < /*Math.random() / 16 +*/ 0.75) {
        return grass;
      } else {
        return sand;
      }
    }
  }

  calculateAverageSlope(terrain, x, y) {
    const neighbors = [
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
    ];

    const currentHeight = terrain[y][x];
    let totalSlope = 0;

    for (const neighbor of neighbors) {
      const nx = x + neighbor.dx;
      const ny = y + neighbor.dy;

      if (nx >= 0 && nx < terrain[0].length && ny >= 0 && ny < terrain.length) {
        const neighborHeight = terrain[ny][nx];
        // Calculate the vertical slope
        if (neighbor.dx === 0) {
          totalSlope += Math.abs(neighborHeight - currentHeight);
        }
        // Calculate the horizontal slope
        if (neighbor.dy === 0) {
          totalSlope += Math.abs(neighborHeight - currentHeight);
        }
      }
    }

    // Calculate the average slope as the sum of height differences divided by the number of neighbors
    const averageSlope = totalSlope / neighbors.length;

    // Invert the slope to make 0 represent horizontal and 1 represent vertical
    return averageSlope;
  }
}
