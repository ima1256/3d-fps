import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Camera } from './camera';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const _VS = `
varying vec3 vWorldPosition;

void main() {
  vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
  vWorldPosition = worldPosition.xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`;


const _FS = `
uniform vec3 topColor;
uniform vec3 bottomColor;
uniform float offset;
uniform float exponent;

varying vec3 vWorldPosition;

void main() {
  float h = normalize( vWorldPosition + offset ).y;
  gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );
}`;

export class World3d {

    constructor(renderer, characters, enemies) {
        
        this.scene = new THREE.Scene();
        this.loader = new GLTFLoader();
        this.models = {}
        this.cameras = {}
        this.characters = characters
        this.enemies = enemies
        this.terrain = null
        this.physicsWorld = null
        this.bodyMetadata = new Map()
        this.renderer = renderer

    }

    async initialize() {

        // Add AxesHelper to show the x, y, and z axes
        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);

        this.loadSun()
        this.loadSky()
        this.loadTerrain()

    }

    addSphere(position, radius) {
        // Create a sphere geometry with a specified radius, width segments, and height segments
        const widthSegments = 32; // Number of horizontal segments
        const heightSegments = 32; // Number of vertical segments
        const sphereGeometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);

        // Create a basic material for the sphere
        const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red color

        // Create the mesh by combining the geometry and material
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

        // Set the position of the sphere in the scene
        sphere.position.set(position.x, position.y, position.z); // Positioned at (0, 1, 0) in world coordinates

        // Add the sphere to the scene
        this.scene.add(sphere);
    }

    setupCameras = async () => {

        //CAMERAS START
        let camera
        let controls

        let name = 'main_camera'
        this.cameras[name] = new Camera()
        this.cameras[name].cam = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
        this.cameras[name].controls = new OrbitControls(this.cameras[name].cam, this.renderer.domElement);

        camera = this.cameras[name].cam
        controls = this.cameras[name].controls


        camera.position.set(30, 30, 30)
        camera.lookAt(new THREE.Vector3(0, 0, 0))
        camera.layers.enable(0)
        camera.layers.enable(1)
        camera.layers.enable(2)
        camera.layers.enable(3)

  
        // Set up OrbitControls
        
        controls.target.set(0, 0, 0); // The point the camera orbits around
        

    }

    update() {
        controls.update(); // Update the controls to reflect the initial target
    }

    loadSun() {

        this.scene.background = new THREE.Color(0xFFFFFF);
        this.scene.fog = new THREE.FogExp2(0x89b2eb, 0.002);

        let light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
        light.position.set(-10, 500, 10);
        light.target.position.set(0, 0, 0);
        light.castShadow = true;
        light.shadow.bias = -0.001;
        light.shadow.mapSize.width = 4096;
        light.shadow.mapSize.height = 4096;
        light.shadow.camera.near = 0.1;
        light.shadow.camera.far = 1000.0;
        light.shadow.camera.left = 100;
        light.shadow.camera.right = -100;
        light.shadow.camera.top = 100;
        light.shadow.camera.bottom = -100;

        this.scene.add(light);
    }

    loadSky() {

        const hemiLight = new THREE.HemisphereLight(0xFFFFFF, 0xFFFFFFF, 0.6);
        hemiLight.color.setHSL(0.6, 1, 0.6);
        hemiLight.groundColor.setHSL(0.095, 1, 0.75);
        this.scene.add(hemiLight);

        const uniforms = {
            "topColor": { value: new THREE.Color(0x0077ff) },
            "bottomColor": { value: new THREE.Color(0xffffff) },
            "offset": { value: 33 },
            "exponent": { value: 0.6 }
        };
        
        uniforms["topColor"].value.copy(hemiLight.color);
        
        this.scene.fog.color.copy(uniforms["bottomColor"].value);

        const skyGeo = new THREE.SphereGeometry(1000, 32, 15);

        const skyMat = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: _VS,
            fragmentShader: _FS,
            side: THREE.BackSide
        });

        const sky = new THREE.Mesh(skyGeo, skyMat);
        this.scene.add(sky);

    }

    loadTerrain() {
        // Load the texture
        const textureLoader = new THREE.TextureLoader();
        const terrainTexture = textureLoader.load('./textures/texture-floor.png'); // Replace with the actual path to your texture
    
        terrainTexture.wrapS = THREE.RepeatWrapping;
        terrainTexture.wrapT = THREE.RepeatWrapping;
        terrainTexture.repeat.set(1000, 1000);

        // Create the plane geometry
        const planeGeometry = new THREE.PlaneGeometry(20000, 20000, 20, 20);
    
        // Create the material using the loaded texture
        const planeMaterial = new THREE.MeshStandardMaterial({
            map: terrainTexture, // Apply the texture to the material
        });
    
        // Create the mesh with the geometry and material
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        
        // Set the plane's properties
        plane.castShadow = false;
        plane.receiveShadow = true;
        plane.rotation.x = -Math.PI / 2;
    
        // Add the plane to the scene
        this.scene.add(plane);
        this.terrain = plane;
    }

    setTerrainPhysics() {

        // Create a ground plane physics shape
        const planeNormal = new Ammo.btVector3(0, 1, 0); // Plane normal pointing up
        const planeConstant = 0; // Distance from the origin, can be 0 for a ground plane at y=0
        const planeMesh = this.terrain

        const planeShape = new Ammo.btStaticPlaneShape(planeNormal, planeConstant);

        const transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(planeMesh.position.x, planeMesh.position.y, planeMesh.position.z));

        const motionState = new Ammo.btDefaultMotionState(transform);
        const localInertia = new Ammo.btVector3(0, 0, 0); // Static objects have no inertia


        const rbInfo = new Ammo.btRigidBodyConstructionInfo(0, motionState, planeShape, localInertia); // Mass = 0 for static objects
        const body = new Ammo.btRigidBody(rbInfo);
        body.isGround = true

        body.setRestitution(0.1); // Low restitution for less bounce
        body.setFriction(0.2); // High friction to slow down the bullet

        body.activate()

        this.bodyMetadata.set(body, {isGround: true})


        this.terrain.body = body

        return body
    }
    
    loadTerrain2() {

        const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(20000, 20000, 20, 20),
        new THREE.MeshStandardMaterial({
            color: 0x1e601c
            }));
        
        plane.castShadow = false;
        plane.receiveShadow = true;
        plane.rotation.x = -Math.PI / 2;
        this.scene.add(plane);
        this.terrain = plane
          
    }

    addCamera(camera, tag) {
        this.cameras[tag] = camera
    }

    loadModel = (path, name) => {

        return new Promise((resolve, reject) => {

            this.loader.load(path, function (gltf) {

                let model = gltf.scene;
                this.scene.add(model);
    
                model.traverse(c => {
                    model.castShadow = true;
                })
                
                this.models[name] = model
    
                resolve(gltf);

            }.bind(this), undefined, error => {
                
                console.error(error);
                reject(error);

            });
        });
    
    }
    
}