import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function getSceneFloor() {

    var displacement = new THREE.TextureLoader().load( "images/terrain2.jpeg" );

    var groundTexture = new THREE.TextureLoader().load( "images/ground.jpeg" );
    groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set( 1000, 1000);
    groundTexture.anisotropy = 16;
    groundTexture.encoding = THREE.sRGBEncoding;

    const groundMaterial = new THREE.MeshStandardMaterial({
        // displacementMap: displacement,
        // displacementScale: 5,
        // side: THREE.DoubleSide,
        map: groundTexture,
        // normalMap: displacement,
        // normalScale: new THREE.Vector2(0.1, 0.1), // Adjust normal map intensity
    });

    // var groundMaterial = new THREE.MeshStandardMaterial( { map: groundTexture, 
    //     side: THREE.DoubleSide, 
    //     wireframe: true,
    //     displacementMap: displacement,
    //     displacementScale: 3 } );

    let segments = 50

    var mesh = new THREE.Mesh( new THREE.PlaneGeometry( 20, 20, segments, segments ), groundMaterial );
    mesh.position.y = 0.0;
    mesh.rotation.x = - Math.PI / 2;
    // mesh.receiveShadow = true;
    mesh.name = 'suelo'

    console.log(mesh)

    return mesh

}

export function getWorldSphere() {
    // Create the sphere geometry
    const sphereGeometry = new THREE.SphereGeometry(1.27, 32, 32); // Adjust the radius if needed

    const textureLoader = new THREE.TextureLoader();
    const emissiveTexture = textureLoader.load('models/river.jpg'); // Replace with your image path

    // Create the material with MeshLambertMaterial and set the emissive map and color
    const sphereMaterial = new THREE.MeshLambertMaterial({
        side: THREE.BackSide, // Ensure the material is applied on the inner side of the sphere
        emissive: new THREE.Color(0xffffff),
        emissiveMap: emissiveTexture
    });

    // Create the sphere mesh and apply the material
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.scale.set(100, 100, 100); // Scale the sphere 10x larger than the model

    return sphere
}

export function getSunlight() {

    // Add directional light to simulate sunlight
    const sunlight = new THREE.DirectionalLight(0xffffff, 5);
    let maxCoordinate = 7500
    sunlight.position.set(1000/maxCoordinate, 2000/maxCoordinate, 1);
    sunlight.position.multiplyScalar( 1000);
    sunlight.castShadow = true; // Enable shadows for the sunlight

    const d = 300;

    // Set up shadow properties for the sunlight
    sunlight.shadow.mapSize.width = 1024; // Shadow map size (increase for higher quality shadows)
    sunlight.shadow.mapSize.height = 1024;
    sunlight.shadow.camera.near = 0.5;
    sunlight.shadow.camera.far = 3500;
    sunlight.shadow.camera.left = -d;
    sunlight.shadow.camera.right = d;
    sunlight.shadow.camera.top = d;
    sunlight.shadow.camera.bottom = -d;


    return sunlight

}

export function getSunlightConfig(scene) {

    const baseX = 1000
    const baseY = 2000
    const baseZ = 7500
    let sunlight1 = getSunlight(1000, 2000, 7500)

    // Calculate the positions for the other three sunlights
    const radius = Math.sqrt(baseX * baseX + baseZ * baseZ); // Calculate radius from x and z
    const angleOffset = Math.PI / 2; // 90 degrees in radians for even spacing in a circle

    // Position the other sunlights in a circle around the origin in the xz-plane
    const sunlights = [sunlight1];
    for (let i = 1; i < 4; i++) {
        const angle = i * angleOffset;
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        const sunlight = getSunlight(x, baseY, z);
        scene.add(sunlight);
        sunlights.push(sunlight);
    }

    return scene

}

export function getWorldSky() {
    // Create the geometry for the skybox
    var skyGeo = new THREE.SphereGeometry(100000, 25, 25);

    // Load the texture for the skybox
    var loader = new THREE.TextureLoader();
    var texture = loader.load("models/sky.jpeg"); // Make sure this path is correct

    // Create the material for the skybox
    var material = new THREE.MeshPhongMaterial({
        map: texture,
    });

    // Create the mesh and add it to the scene
    var sky = new THREE.Mesh(skyGeo, material);
    sky.material.side = THREE.BackSide; // Render the inside of the sphere

    return sky
}

export const checkCollision = (obj1, obj2) => {

    const firstBB = new THREE.Box3().setFromObject(obj1)

    const secondBB = new THREE.Box3().setFromObject(obj2)

    var collision = firstBB.intersectsBox(secondBB)
    return collision
}

export function getSpotlight() {
    //spotlight
    let spotLight = new THREE.SpotLight( 0xffffff );
    spotLight.intensity = 1
    spotLight.decay = 0
    spotLight.position.set( 0, 20, 10 );
    spotLight.angle = Math.PI / 16
    spotLight.castShadow = true
    spotLight.shadow.mapSize.width = 1024
    spotLight.shadow.mapSize.height = 1024
    spotLight.shadow.camera.near = 0.5
    spotLight.shadow.camera.far = 100
    return spotLight
}

export async function loadModel(scene, path) {
    const loader = new GLTFLoader();

    let model = null
    let animations = null

    loader.load( path, function ( gltf ) {

        model = gltf.scene
        scene.add(model);
        animations = gltf.animations;

    
    }, undefined, error => console.error( error ) );

    return {scene, model, animations}

}

export function HSVtoHSL(h, s, v) {
    let l = (2 - s) * v / 2;

    if (l !== 0) {
        if (l === 1) {
            s = 0;
        } else if (l < 0.5) {
            s = s * v / (l * 2);
        } else {
            s = s * v / (2 - l * 2);
        }
    }

    return { h, s, l };
}

export class CameraAudioManager {

    constructor(camera) {

        this.camera = camera

        this.listener = new THREE.AudioListener();
        camera.add( this.listener );
        this.audioLoader = new THREE.AudioLoader();
        this.sounds = {}

    }

    async loadSound(path, tag) {

        const sound = new THREE.PositionalAudio( this.listener );

        this.audioLoader.load( path, ( buffer ) => {

            sound.setBuffer( buffer );
            sound.setRefDistance( 20 );

            this.sounds[tag] = sound
        });

    }

    getSound(tag) {

        return this.sounds[tag]

    }

}