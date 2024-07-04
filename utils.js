import * as THREE from 'three';

export function generateUUID() {
    // Return a randomly generated UUID (version 4)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function createHealthBar() {
    // Create a canvas element
    const canvas = document.createElement('canvas');
    // const scale = 0.1
    canvas.width = 128
    canvas.height = 16;
    const context = canvas.getContext('2d');

    // Draw the health bar
    context.fillStyle = 'red';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'green';
    context.fillRect(0, 0, canvas.width, canvas.height); // Assume full health initially

    // Create a texture from the canvas
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);

    const aspectRatio = canvas.width / canvas.height;
    sprite.scale.set( 1.5*aspectRatio, 1, 1);
    // sprite.rotation.x = -Math.PI / 2;

    return sprite;
}

export function updateHealthBar(healthBar, healthPercentage) {
    const canvas = healthBar.material.map.image;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = 'red';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'green';
    context.fillRect(0, 0, canvas.width * healthPercentage, canvas.height);

    healthBar.material.map.needsUpdate = true;
}
  
export function getModelHeight(model) {
    const box = new THREE.Box3().setFromObject(model);
    return box.max.y - box.min.y;
}
  