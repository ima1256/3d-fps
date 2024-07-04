import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

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

    constructor() {
        
        this.scene = new THREE.Scene();
        this.loader = new GLTFLoader();
        this.models = {}
        this.cameras = {}
        this.terrain = null

    }

    async initialize() {

        // Add AxesHelper to show the x, y, and z axes
        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);

        this.loadSun()
        this.loadSky()
        this.loadTerrain()
        this.loadLights()
        await this.loadModels()

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

        const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200, 20, 20),
        new THREE.MeshStandardMaterial({
            color: 0x1e601c
            }));
        
        plane.castShadow = false;
        plane.receiveShadow = true;
        plane.rotation.x = -Math.PI / 2;
        this.scene.add(plane);
        this.terrain = plane
          
    }

    loadLights() {

    }

    addCamera(camera, tag) {
        this.cameras[tag] = camera
    }

    async loadModels() {


        // let zombie = await this.loadModel('models/zombie_female.glb', 'zombie')
        // zombie.scale.set(0.1, 0.1, 0.1)
        // this.models.zombie = zombie

    }

    loadModel = (path, name) => {

        return new Promise((resolve, reject) => {

            this.loader.load(path, function (gltf) {

                let model = gltf.scene;
                this.scene.add(model);
    
                model.children[0].children[0].name = name;
                model.castShadow = true;
                this.models[name] = model
    
                resolve(model);

            }.bind(this), undefined, error => {
                
                console.error(error);
                reject(error);

            });
        });
    
    }

    loadCameras() {
        
    }
    
    
}