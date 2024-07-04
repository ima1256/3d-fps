// Assuming heightmapImage is loaded with the heightmap image
const heightmapImage = new Image();
heightmapImage.src = 'images/terrainBlur.png'; // Replace with your image path


heightmapImage.onload = function() {

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = heightmapImage.width;
    canvas.height = heightmapImage.height;
    context.drawImage(heightmapImage, 0, 0);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const heightmap = {
        width: imageData.width,
        height: imageData.height,
        pixels: imageData.data
    };

    ModifyVerticesWithHeightmap(heightmap);

};

function ModifyVerticesWithHeightmap(heightmap) {

  const maxTerrainHeight = 3

  let vertices = floor.geometry.attributes.position.array

  const terrainHeight = 200
  const terrainWidth = 200

  const terrainOffset = { x: -terrainWidth / 2, z: -terrainHeight / 2 };

  for (let i = 0; i < floor.geometry.attributes.position.array.length; i++) {

      const v = new THREE.Vector3(vertices[ i * 3 + 0 ], vertices[ i * 3 + 1 ], vertices[ i * 3 + 2 ])

      v.applyMatrix4(floor.matrixWorld.clone().invert());

      // Map the terrain dimensions to the range [0, 1]
      const xf = (v.x - terrainOffset.x) / terrainWidth;
      const yf = (v.z - terrainOffset.z) / terrainHeight;


      // Sample the heightmap and scale the height
      const heightValue = _SampleHeightmap(heightmap, xf, yf);
      v.y = heightValue * maxTerrainHeight;

      //console.log(v.y)
      vertices[ i * 3 + 2 ] = v.y

  }

  // Mark the vertices as needing an update
  floor.geometry.attributes.position.needsUpdate = true;
  
}

function _SampleHeightmap(heightmap, xf, yf) {

  const w = heightmap.width - 1;
  const h = heightmap.height - 1;

  const x1 = Math.floor(xf * w);
  const y1 = Math.floor(yf * h);
  const x2 = Math.min(x1 + 1, w);
  const y2 = Math.min(y1 + 1, h);

  const xp = xf * w - x1;
  const yp = yf * h - y1;

  const p11 = _GetPixelAsFloat(heightmap, x1, y1);
  const p21 = _GetPixelAsFloat(heightmap, x2, y1);
  const p12 = _GetPixelAsFloat(heightmap, x1, y2);
  const p22 = _GetPixelAsFloat(heightmap, x2, y2);

  const px1 = lerp(p11, p21, xp);
  const px2 = lerp(p12, p22, xp);

  return lerp(px1, px2, yp);

}

function _GetPixelAsFloat(heightmap, x, y) {
  const position = (x + (heightmap.width * y)) * 4;
  return heightmap.pixels[position] / 255.0;
}
