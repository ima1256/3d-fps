import * as THREE from 'three';
import { World3d } from './3dworldManager';
import { Character, Enemy } from './character';

//PhysicsWorld  START 

//World variables 
let physicsWorld;
let tmpTrans; 
let rigidBodies = [];

var characterIndex = 0
let camera 
    
let characters = []
let numCharacters = 1
let characterCamera = true

let character
let zombie

let enemy

const clock = new THREE.Clock();
let delta = 0;

const world3d = new World3d()

let scene
let camera1

const renderer = new THREE.WebGLRenderer();

async function initAmmo() {
  // Physics configuration
  const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
  const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
  const overlappingPairCache = new Ammo.btDbvtBroadphase();
  const solver = new Ammo.btSequentialImpulseConstraintSolver();

  // Create the physics world
  physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
  physicsWorld.setGravity(new Ammo.btVector3(0, -9.82, 0));

  return true
}

function createPhysicsForPlane(planeMesh) {
  // Create a ground plane physics shape
  const planeNormal = new Ammo.btVector3(0, 1, 0); // Plane normal pointing up
  const planeConstant = 0; // Distance from the origin, can be 0 for a ground plane at y=0

  const planeShape = new Ammo.btStaticPlaneShape(planeNormal, planeConstant);

  const transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(planeMesh.position.x, planeMesh.position.y, planeMesh.position.z));

  const motionState = new Ammo.btDefaultMotionState(transform);
  const localInertia = new Ammo.btVector3(0, 0, 0); // Static objects have no inertia


  const rbInfo = new Ammo.btRigidBodyConstructionInfo(0, motionState, planeShape, localInertia); // Mass = 0 for static objects
  const body = new Ammo.btRigidBody(rbInfo);

  body.setRestitution(0.1); // Low restitution for less bounce
  body.setFriction(0.6); // High friction to slow down the bullet


  // Add the physics body to the world
  physicsWorld.addRigidBody(body);

  return body;
}

async function createPhysicsObjects() {

  for (let i = 0; i < characters.length; i++) {

      const character = characters[i];

      // Set the bounding box from the character object
      const size = character.size

      // Ammo.js expects half-extents for the btBoxShape
      const halfExtents = new Ammo.btVector3(size.x * 0.5, size.y * 0.5, size.z * 0.5);
      const colShape = new Ammo.btBoxShape(halfExtents);   

      const transform = new Ammo.btTransform();
      transform.setIdentity();

      // Use the position of the character's mesh (or Object3D) to set the initial position of the physics body
      const pos = character.character.position;
      transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));

      // Motion state and local inertia
      const motionState = new Ammo.btDefaultMotionState(transform);
      const localInertia = new Ammo.btVector3(0, 0, 0);
      colShape.calculateLocalInertia(80, localInertia); // Mass = 1

      // Set the collision margin
      colShape.setMargin(1); // Adjust the margin as needed

      const rbInfo = new Ammo.btRigidBodyConstructionInfo(1, motionState, colShape, localInertia);
      const body = new Ammo.btRigidBody(rbInfo);
      // body.setDamping(0.9, 0.9); // Set damping factors for linear and angular motion

      body.setFriction(0.5);    // Adjust friction
      body.setRestitution(0.1); // Lower restitution to avoid bouncing
      

      // Add the physics body to the world
      physicsWorld.addRigidBody(body);

      // Store the body so it can be updated during the animation loop
      rigidBodies.push({ mesh: character.character, body });

      characters[i].body = body

  }
}

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

window.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'w': // Move forward
            moveForward = true;
            break;
        case 's': // Move backward
            moveBackward = true;
            break;
        case 'a': // Move left
            moveLeft = true;
            break;
        case 'd': // Move right
            moveRight = true;
            break;
            
    }

    if (event.code === 'Space') {
      jump(character); // Assuming you want the first character to jump
    }
  

});

window.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'w': // Stop moving forward
            moveForward = false;
            break;
        case 's': // Stop moving backward
            moveBackward = false;
            break;
        case 'a': // Stop moving left
            moveLeft = false;
            break;
        case 'd': // Stop moving right
            moveRight = false;
            break;

    }
});

function jump(character) {
  const jumpImpulse = new Ammo.btVector3(0, 10, 0); // Adjust the y-value for jump strength
  character.body.applyImpulse(jumpImpulse, new Ammo.btVector3(0, 0, 0));
}

function updateMovement(character) {

  const velocityStrength = 50; // Adjust this for faster or slower movement
  const velocity = new Ammo.btVector3(0, 0, 0); // Initialize the velocity vector

  // Helper function to set the velocity in a given direction
  function setVelocity(direction) {

      direction.y = 0; // Ensure y component is zero to keep movement in the xz plane
      direction.normalize();

      const currentVelocity = character.body.getLinearVelocity()

      velocity.setValue(direction.x * velocityStrength, currentVelocity.y(), direction.z * velocityStrength);
      character.body.setLinearVelocity(velocity); // Set the character's linear velocity

  }

  if (moveForward) {
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(character.camera.quaternion);
      setVelocity(forward);
  } else if (moveBackward) {
      const backward = new THREE.Vector3(0, 0, 1).applyQuaternion(character.camera.quaternion);
      setVelocity(backward);
  } else if (moveLeft) {
      const left = new THREE.Vector3(-1, 0, 0).applyQuaternion(character.camera.quaternion);
      setVelocity(left);
  } else if (moveRight) {
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(character.camera.quaternion);
      setVelocity(right);
  } else {
      const currentVelocity = character.body.getLinearVelocity()
      // If no movement keys are pressed, stop the character
      character.body.setLinearVelocity(new Ammo.btVector3(0, currentVelocity.y(), 0));
  }
}


Ammo().then(async () => {

  tmpTrans = new Ammo.btTransform();  // Initialize tmpTrans after Ammo.js is loaded

  await initThreeJS()
  await initAmmo()
  await createPhysicsObjects()

  createPhysicsForPlane(world3d.terrain);

  renderer.setAnimationLoop(animate);

})

//PhysicsWorld FINISH

const initThreeJS = async () => {

  return world3d.initialize().then(async () => {

    scene = world3d.scene

    //CAMERAS START
    camera1 = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);

    camera1.position.set(30, 30, 30)
    camera1.lookAt(new THREE.Vector3(0, 0, 0))
    camera1.layers.enable(0)
    camera1.layers.enable(1)
    camera1.layers.enable(2)
    camera1.layers.enable(3)
    //CAMERAS FINISH

    //SETUP CONFIGURATION START
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; // Enable shadows
    window.document.body.appendChild(renderer.domElement);
    window.addEventListener("resize", onWindowResize, false);
    //SETUP CONFIGURATION FINISH

    camera = camera1
    const characterPromises = []
    for (let i = 0; i < numCharacters; i++) {

      let char = new Character(world3d, i + 1)

      const charPromise = char.initialize().then(() => {

        characters.push(char)

        if (i == 0) {

          localStorage.setItem('characterId', char.uid)
          character = char

          world3d.loadModel('models/alien_run.glb', 'zombie').then(gltf => {

            console.log(gltf)
    
            zombie = gltf.scene
            zombie.name = 'my_zombie'
            character.addTarget(zombie)
            const zombieScale = 5
            zombie.scale.set(zombieScale, zombieScale, zombieScale)

            let sounds = character.camAudioManager.getSounds('zombie')
            let sounds2 = character.camAudioManager.getSounds('bullet_hit')

            sounds = { ...sounds, ...sounds2 }

            for (let sound of Object.keys(sounds)) zombie.add(sounds[sound])

            enemy = new Enemy(world3d, sounds, zombie)

            //enemy.fadeOut(5000)
            //enemy.yell()

            zombie.userData.sounds = enemy.sounds


          })

        }

      })

      characterPromises.push(charPromise);

    }

    await Promise.all(characterPromises);
    character = characters[characterIndex]

  })

}


function animate() {

  delta = clock.getDelta();


  if (zombie && character.character) {

    // const dist = Math.abs(character.character.children[0].position.y - world3d.terrain.position.y)
    // console.log(dist, character, character.body.getWorldTransform().getOrigin().y())

    if (characterCamera) camera = character.camera
    else camera = camera1

    const direction = new THREE.Vector3();
    direction.y = 0
    direction.x = character.camera.position.x - zombie.position.x
    direction.z = character.camera.position.z - zombie.position.z
    direction.normalize();

    const zombiePosition = new THREE.Vector3(zombie.position.x, 0, zombie.position.z);
    const cameraPosition = new THREE.Vector3(character.character.position.x, 0, character.character.position.z);

    const distance = zombie.position.distanceTo(character.camera.position);

    if (distance > 30) {
      //zombie.position.add(direction.multiplyScalar(0.4)); // Move the zombie towards the camera
    } else {
      let sound = character.camAudioManager.getSound('zombie_hit')

      if (!sound.isPlaying) {
        //sound.play()
        character.showBloodEffect()
      }

    }

    const targetPosition = character.character.position.clone()
    targetPosition.y = zombie.position.y
    zombie.lookAt(targetPosition)

    updateMovement(character); // Update movement based on key presses


    //PHYSICS STUFF START 
    physicsWorld.stepSimulation(delta, 10);

    for (let i = 0; i < rigidBodies.length; i++) {
        const obj = rigidBodies[i];
        const motionState = obj.body.getMotionState();
        if (motionState) {
            motionState.getWorldTransform(tmpTrans);
            const pos = tmpTrans.getOrigin();
            const quat = tmpTrans.getRotation();
            obj.mesh.position.set(pos.x(), pos.y(), pos.z());
            obj.mesh.quaternion.set(quat.x(), quat.y(), quat.z(), quat.w());
        }
    }
    //PHYSICS STUFF FINISH

  }

  if (characters[characterIndex]) characters[characterIndex].update(delta)

  render()

}

// Prevent the context menu for the entire document
document.addEventListener('contextmenu', function(event) {
  event.preventDefault();
});

function onWindowResize() {

  for (let i = 0; i < numCharacters; i++) {
    characters[i].camera.aspect = window.innerWidth / window.innerHeight;
    characters[i].camera.updateProjectionMatrix();
  }

  camera1.aspect = window.innerWidth / window.innerHeight
  camera1.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)

  render()

}

function getBoundedCharacterFromIndex(i, n) {
  return characters[(i % n + n) % n]
}

document.addEventListener('keydown', function (event) {
  // Check if the key pressed is "1"

  if (event.key == 'ArrowRight') {
    characterIndex++
    let character = getBoundedCharacterFromIndex(characterIndex, characters.length)
    localStorage.setItem('characterId', character.uid)
    camera = character.camera
  } else if (event.key == 'ArrowLeft') {
    characterIndex--
    let character = getBoundedCharacterFromIndex(characterIndex, characters.length)
    localStorage.setItem('characterId', character.uid)
    camera = character.camera
  }

  if (event.key === '1') {
    // Perform your desired action here
    characterCamera = false
  } else if (event.key === '2') {
    characterCamera = true
  }

});

function render() {
  renderer.render(scene, camera);
}