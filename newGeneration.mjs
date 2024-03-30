let perlin = {
  rand_vect: function () {
    let theta = Math.random() * 2 * Math.PI;
    return { x: Math.cos(theta), y: Math.sin(theta) };
  },
  dot_prod_grid: function (x, y, vx, vy) {
    let g_vect;
    let d_vect = { x: x - vx, y: y - vy };
    if (this.gradients[[vx, vy]]) {
      g_vect = this.gradients[[vx, vy]];
    } else {
      g_vect = this.rand_vect();
      this.gradients[[vx, vy]] = g_vect;
    }
    return d_vect.x * g_vect.x + d_vect.y * g_vect.y;
  },
  smootherstep: function (x) {
    return 6 * x ** 5 - 15 * x ** 4 + 10 * x ** 3;
  },
  interp: function (x, a, b) {
    return a + this.smootherstep(x) * (b - a);
  },
  seed: function () {
    this.gradients = {};
    this.memory = {};
  },
  get: function (x, y) {
    if (this.memory.hasOwnProperty([x, y])) return this.memory[[x, y]];
    let xf = Math.floor(x);
    let yf = Math.floor(y);
    //interpolate
    let tl = this.dot_prod_grid(x, y, xf, yf);
    let tr = this.dot_prod_grid(x, y, xf + 1, yf);
    let bl = this.dot_prod_grid(x, y, xf, yf + 1);
    let br = this.dot_prod_grid(x, y, xf + 1, yf + 1);
    let xt = this.interp(x - xf, tl, tr);
    let xb = this.interp(x - xf, bl, br);
    let v = this.interp(y - yf, xt, xb);
    this.memory[[x, y]] = v;
    return v;
  },
};
perlin.seed();

export class MapGenerator {
  constructor(
    seed,
    octaves,
    width,
    height,
    depth = 20,
    scale = 0.05,
    persistence = 0.5,
    lacunarity = 2.0
  ) {
    this.octaves = octaves;
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.scale = scale;
    this.persistence = persistence;
    this.lacunarity = lacunarity;
  }

  generateMatrice(
    xOffset,
    yOffset,
    octaves = this.octaves,
    width = this.width,
    height = this.height,
    depth = this.depth,
    scale = this.scale,
    persistence = this.persistence,
    lacunarity = this.lacunarity
  ) {
    var terrain = [];

    for (let y = 0; y <= height; y++) {
      const row = [];
      for (let x = 0; x <= width; x++) {
        // Utilisez les coordonnées décalées
        const realX = x + xOffset;
        const realY = y + yOffset;

        let value = 0;
        let frequency = 1;
        let amplitude = 1;

        for (let i = 0; i < octaves; i++) {
          value +=
            perlin.get(
              (realX * frequency) / width,
              (realY * frequency) / height
            ) * amplitude;

          frequency *= lacunarity;
          amplitude *= persistence;
        }

        row.push(value * depth);
      }
      terrain.push(row);
    }

    // Normalizez et retournez la matrice de terrain

    for (let y = 0; y < terrain.length; y++) {
      for (let x = 0; x < terrain[y].length; x++) {
        //terrain[y][x] = 1 - terrain[y][x] ** 2;
        terrain[y][x] = terrain[y][x] * (1 + Math.exp(terrain[y][x]) * 2);
      }
    }

    this.normalizeTerrain(terrain, 0, 1);

    for (let y = 0; y < terrain.length; y++) {
      for (let x = 0; x < terrain[y].length; x++) {
        terrain[y][x] = 1 - terrain[y][x];
      }
    }

    return terrain;
  }

  /*
  generateMatrice(
    xOffset,
    yOffset,
    octaves = this.octaves,
    width = this.width,
    height = this.height
  ) {
    var terrain = [];

    for (let y = yOffset; y < yOffset + height; y++) {
      const row = [];
      for (let x = xOffset; x < xOffset + width; x++) {
        let value = 0;
        let frequency = 1;

        for (let i = 0; i < octaves; i++) {
          let rr = this.perlinGenerator.generate(
            (x * frequency) / width,
            (y * frequency) / height
          );
          console.log(rr);
          frequency *= 2;
          value += rr;
        }

        row.push(value);
      }
      terrain.push(row);
    }

    /*for (let y = 0; y < terrain.length; y++) {
      for (let x = 0; x < terrain[y].length; x++) {
        //terrain[y][x] = 1 - terrain[y][x] ** 2;
        terrain[y][x] = terrain[y][x] * (1 + Math.exp(terrain[y][x]) * 2);
      }
    }


    for (let y = 0; y < terrain.length; y++) {
      for (let x = 0; x < terrain[y].length; x++) {
        terrain[y][x] = 1 - terrain[y][x];
      }
    }

    this.normalizeTerrain(terrain, 0, 1, this);

    return terrain;
  }*/

  normalizeTerrain(terrain, minValue, maxValue) {
    const max = 6.5;
    const min = 0;

    const range = max - min;
    const newRange = maxValue - minValue;

    for (let y = 0; y < terrain.length; y++) {
      for (let x = 0; x < terrain[y].length; x++) {
        terrain[y][x] = ((terrain[y][x] - min) / range) * newRange + minValue;
      }
    }
  }

  generateTextureCanvas(terrain) {
    const canvas = document.createElement("canvas");
    const canvasWidth = terrain[0].length; // Width is determined by the depth of the height data
    const canvasHeight = terrain.length; // Height is determined by the height data rows
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const context = canvas.getContext("2d");

    for (let y = 0; y < canvasHeight; y++) {
      for (let x = 0; x < canvasWidth; x++) {
        const averageSlope = this.calculateAverageSlope(terrain, x, y);
        const color = this.getColorForNormalizedValue(
          averageSlope,
          terrain[y][x],
          y,
          x
        );

        // Utilisez les coordonnées réelles en prenant en compte le décalage
        context.fillStyle = color;
        context.fillRect(x, y, 1, 1);
      }
    }

    return canvas;
  }

  getColorForNormalizedValue(normalizedValue, depth, y, x) {
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

    if (depth < Math.random() / 16 +  0.2) {
      return snow;
    } else if (depth < Math.random() / 16 + 0.7) {
      return grass;
    } else {
      if (normalizedValue > 0.03) {
        return grey;
      } else {
        return sand;
      }
    }
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
