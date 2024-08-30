import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { getSceneFloor, getWorldSphere, checkCollision, getSpotlight } from '../functions';
import Stats from "three/examples/jsm/libs/stats.module.js";
import { FlyControls } from 'three/addons/controls/FlyControls.js';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';
import { clamp } from 'three/src/math/MathUtils.js';

// FIRST PERSON CONTROLS START 

class InputController {
  constructor() {
    this.initialize_();
  }

  initialize_() {
    this.current_ = {
      leftButton: false,
      rightButton: false,
      mouseX: 0,
      mouseY: 0
    };
    this.previous_ = null;
    this.keys_ = {};
    this.previousKeys_ = {};

    document.addEventListener('mousedown', (e) => this.onMouseDown_(e), false);
    document.addEventListener('mouseup', (e) => this.onMouseUp_(e), false);
    document.addEventListener('mousemove', (e) => this.onMouseMove_(e), false);
    document.addEventListener('keydown', (e) => this.onKeyDown_(e), false);
    document.addEventListener('keyup', (e) => this.onKeyUp_(e), false);
  }

  onMouseDown_(e) {
    switch(e.button) {
      case 0: {
        this.current_.leftButton = true;
        break;
      }
      case 2: {
        this.current_.rightButton = true;
        break;
      }
    }
  }
  

  onMouseUp_(e) {
    switch(e.button) {
      case 0: {
        this.current_.leftButton = false;
        break;
      }
      case 2: {
        this.current_.rightButton = false;
        break;
      }
    }
  }
  
  onMouseMove_(e) {
    this.current_.mouseX = e.pageX - window.innerWidth / 2;
    this.current_.mouseY = e.pageY - window.innerHeight / 2;
  
    if (this.previous_ === null) {
      this.previous_ = { ...this.current_ };
    }

    this.current_.mouseXDelta = this.current_.mouseX - this.previous_.mouseX;
    this.current_.mouseYDelta = this.current_.mouseY - this.previous_.mouseY;

  }
  
  onKeyDown_(e) {
    this.keys_[e.keyCode] = true;
  }
  
  onKeyUp_(e) {
    this.keys_[e.keyCode] = false;
  }

  update() {
    this.previous_ = {...this.current_}
  }

}

class FirstPersonCamera {

  constructor(camera) {
    this.camera_ = camera;
    this.input_ = new InputController();
    this.rotation_ = new THREE.Quaternion();
    this.translation_ = new THREE.Vector3();
    this.phi_ = 0;
    this.theta_ = 0;
  }

  update(timeElapsedS) {
    this.updateRotation_(timeElapsedS);
    this.updateCamera_(timeElapsedS)
  }

  updateCamera_() {
    this.camera_.quaternion.copy(this.rotation_);
  }  
  
  updateRotation_(timeElapsedS) {
    const xh = this.input_.current_.mouseXDelta / window.innerWidth;
    const yh = this.input_.current_.mouseYDelta / window.innerHeight;
  
    this.phi_ += -xh * 5;
    this.theta_ = clamp(this.theta_ + -yh * 5, -Math.PI / 3, Math.PI / 3);
  
    const qx = new THREE.Quaternion();
    qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi_);
  
    const qz = new THREE.Quaternion();
    qz.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.theta_);
  
    const q = new THREE.Quaternion();
    q.multiply(qx);
    q.multiply(qz);
  
    this.rotation_.copy(q);
  }
  
  
}

// FIRST PERSON CONTROLS FINISH


const scene = new THREE.Scene();
const camera1 = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight , 0.1, 1000 );
const camera2 = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight , 0.1, 1000 );
camera2.position.set(50, 50, 50)

let fpsCamera = new FirstPersonCamera(camera2)


let camera = camera1

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
window.document.body.appendChild( renderer.domElement );

const controls = new OrbitControls( camera, renderer.domElement );
const flyControls = new FirstPersonControls( camera, renderer.domElement )
//const firstPersonControls = new FirstPersonControls( camera, renderer.domElement )
flyControls.movementSpeed = 5
flyControls.lookSpeed = 0.8

const loader = new GLTFLoader();

//spotlight
let spotLight = getSpotlight()
scene.add(spotLight)
spotLight.visible = false
const spotLightHelper = new THREE.SpotLightHelper(spotLight);
//scene.add(spotLightHelper);

//bulb light
const blight = new THREE.PointLight( 0xff00ff, 20 );
blight.position.set( 0, 0, 0 );
scene.add( blight );

//ambientlight
const alight = new THREE.AmbientLight( 0xffffff ); // soft white light
scene.add( alight );

//sphere bulb in the middle 
const sphereGeometry1 = new THREE.SphereGeometry(0.1, 32, 32); // Radius 5, width and height segments 32
const sphereMaterial1 = new THREE.MeshLambertMaterial({ color: 0x000000 }); // Red color
const sphere1 = new THREE.Mesh(sphereGeometry1, sphereMaterial1);
scene.add(sphere1);

// Animations configurations
let mixer
let animations
let action 

function playAnimation(index) {
    const clip = animations[index]
    if (action) action.stop()
    action = mixer.clipAction( clip );
    action.play();
}

function update (deltaSeconds) {
	mixer.update( deltaSeconds );
}

//Model loading
let model

let metro
let astronaut

loader.load( 'models/output.glb', function ( gltf ) {

    astronaut = gltf.scene
	  scene.add(astronaut);
    astronaut.name = 'astronaut'
    astronaut.initialPosition = astronaut.position.clone()
    spotLight.target = astronaut
    model = astronaut

    astronaut.attach(blight)
    //astronaut.attach(camera2)

    //Play animation 
    mixer = new THREE.AnimationMixer( astronaut );
    animations = gltf.animations;

    const thirdPersonCamera = new THREE.Vector3(0, 4, 5)

    camera1.position.set(astronaut.position.x+30, astronaut.position.y+30, astronaut.position.z+30)
    //camera2.rotateX(-Math.PI / 8)

    camera.lookAt(astronaut.position)
    camera2.lookAt(astronaut.position)

}, undefined, error => console.error( error ) );

// instantiate a loader
const loaderObj = new OBJLoader();

// load a resource
loaderObj.load('models/plane/Rocket_Racer.obj',
	function ( object ) {

		scene.add( object )

        object.scale.setScalar(0.01)
        object.position.y = 10
        object.position.x = -30
        object.position.z = -30

	},
	// called when loading is in progresses
	function ( xhr ) {

		console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

	},
	// called when loading has errors
	function ( error ) {

		console.log( 'An error happened' );

	}
);


//CONTROLLING CHARACTER START
// const pivot = new THREE.Object3D();
// pivot.position.set(0, 1, 10);

// const yaw = new THREE.Object3D();
// const pitch = new THREE.Object3D();

// scene.add(pivot);
// pivot.add(yaw);
// yaw.add(pitch);
// pitch.add(camera2);

// window.addEventListener("resize", onWindowResize, false);

// function onWindowResize() {
//   camera2.aspect = window.innerWidth / window.innerHeight;
//   camera2.updateProjectionMatrix();
//   renderer.setSize(window.innerWidth, window.innerHeight);
//   render();
// }

function onDocumentMouseMove(e) {
    yaw.rotation.y -= e.movementX * 0.002;
    const v = pitch.rotation.x - e.movementY * 0.002;
    if (v > -1 && v < 0.1) {
        pitch.rotation.x = v;
    }
    return false;
}

function onDocumentMouseWheel(e) {
    const v = camera.position.z + e.deltaY * 0.005;
    if (v >= 2 && v <= 10) {
        camera.position.z = v;
    }
    return false;
}

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

const keyMap = {};

const onDocumentKey = (e) => {
  keyMap[e.code] = e.type === "keydown";

  if (pointerLocked) {
    moveForward = keyMap["KeyW"];
    moveBackward = keyMap["KeyS"];
    moveLeft = keyMap["KeyA"];
    moveRight = keyMap["KeyD"];
  }
};

const menuPanel = document.getElementById("menuPanel");
const startButton = document.getElementById("startButton");

// startButton.addEventListener("click",() => {
//     renderer.domElement.requestPointerLock();
//   },
//   false
// );

startButton.style.display = "none";
menuPanel.style.display = "none";

let pointerLocked = false;

function onPointerLockChange() {
    if (document.pointerLockElement === renderer.domElement) {
        pointerLocked = true;
    
        startButton.style.display = "none";
        menuPanel.style.display = "none";
    
        document.addEventListener("keydown", onDocumentKey, false);
        document.addEventListener("keyup", onDocumentKey, false);
    
        renderer.domElement.addEventListener(
          "mousemove",
          onDocumentMouseMove,
          false
        );
    
        renderer.domElement.addEventListener("wheel", onDocumentMouseWheel, false);
      } else {
        pointerLocked = false;
    
        menuPanel.style.display = "block";
    
        document.removeEventListener("keydown", onDocumentKey, false);
        document.removeEventListener("keyup", onDocumentKey, false);
    
        renderer.domElement.removeEventListener(
          "mousemove",
          onDocumentMouseMove,
          false
        );
        renderer.domElement.removeEventListener(
          "wheel",
          onDocumentMouseWheel,
          false
        );
    
        setTimeout(() => {
          startButton.style.display = "block";
        }, 1000);
      }
}

// document.addEventListener("pointerlockchange", onPointerLockChange);


//Third person variables
const stats = new Stats();
document.body.appendChild(stats.dom);
const v = new THREE.Vector3();
const inputVelocity = new THREE.Vector3();
const euler = new THREE.Euler();
const quaternion = new THREE.Quaternion();
const clock = new THREE.Clock();
let delta = 0;

//CONTROLLING CHARACTER FINISH

window.addEventListener("keydown", function(event) {

    if (event.key == "r") {
        model.position.x = model.initialPosition.x
        model.position.y = model.initialPosition.y
        model.position.z = model.initialPosition.z
    }

    if (event.which == 32) {
        model.position.y += 1 
        velocity = 0
    }

    if (event.key == '1') {
        camera = camera1
        console.log(action)
        playAnimation(Number(event.key))
    } else if (event.key == '2') {
        camera = camera2
        console.log(action)
        playAnimation(Number(event.key))
    }

    if (event.key == "b"){
        blight.visible = !blight.visible
    } 
});


//World and controls
const raycaster = new THREE.Raycaster();
const raycasterOrigin = new THREE.Vector3();
const raycasterDirection = new THREE.Vector3();
scene.add(getWorldSphere());
scene.add(getSceneFloor())

//PHYSICS
let angle = 0
let radius = 10
let spotVelocity = 1

const G = 9.81; // Gravitational acceleration in m/s^2
const objectMass = 1.62; // Mass of the object in kg
let velocity = 0; // Initial velocity

function calculateGravity(mass, altitude) {
    return mass * G; // Simplified gravity, not altitude dependent
}

let altitude = 10;
if (model) model.position.y = altitude;


function animate() {
  
    delta = clock.getDelta();
  
    // inputVelocity.set(0, 0, 0);
  
    // if (moveForward) {
    //   inputVelocity.z = -10 * delta;
    // }

    // if (moveBackward) {
    //   inputVelocity.z = 10 * delta;
    // }
  
    // if (moveLeft) {
    //   inputVelocity.x = -10 * delta;
    // }
    
    // if (moveRight) {
    //   inputVelocity.x = 10 * delta;
    // }
  
    // // apply camera rotation to inputVelocity
    // euler.y = yaw.rotation.y;
    // quaternion.setFromEuler(euler);
    // inputVelocity.applyQuaternion(quaternion);

    // if (model) {
    //     model.position.add(inputVelocity);
    //     model.getWorldPosition(v);
    // }

    // pivot.position.lerp(v, 0.1);

    // flyControls.update(delta)

    fpsCamera.update(delta)
  
    stats.update();

    render()
  
}

function render() {
    renderer.render(scene, camera2);
}
  
renderer.setAnimationLoop( animate );
  