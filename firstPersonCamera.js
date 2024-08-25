import * as THREE from 'three';
import { World3d } from './3dworldManager';
import { Character, Enemy } from './character';

const world3d = new World3d()
world3d.initialize().then( async () => {

const scene = world3d.scene

//CAMERAS START
const camera1 = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight , 0.1, 100000 );

camera1.position.set(30, 30, 30)
camera1.lookAt(new THREE.Vector3(0, 0, 0))
camera1.layers.enable(0)
camera1.layers.enable(1)
camera1.layers.enable(2)
camera1.layers.enable(3)
//CAMERAS FINISH

//SETUP CONFIGURATION START
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.shadowMap.enabled = true; // Enable shadows
window.document.body.appendChild( renderer.domElement );
window.addEventListener("resize", onWindowResize, false);

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
//SETUP CONFIGURATION FINISH

var characterIndex = 0
let camera = camera1
let characters = []
let numCharacters = 1
let characterCamera = true

let character
let zombie

let enemy 


for (let i = 0; i < numCharacters; i++) {

  let char = new Character(world3d, i+1)

  char.initialize().then(() => {

    characters.push(char)

    if (i == 0) {
      
      localStorage.setItem('characterId', char.uid)
      character = char
  
      world3d.loadModel('models/walking_zombie2.glb', 'zombie').then(res => {
        
        zombie = res
        zombie.name = 'my_zombie'
        character.addTarget(zombie)
        const zombieScale = 5
        zombie.scale.set(zombieScale, zombieScale, zombieScale)

        let sounds = character.camAudioManager.getSounds('zombie')
        let sounds2 = character.camAudioManager.getSounds('bullet_hit')

        sounds = {...sounds, ...sounds2}

        console.log(sounds)

        for (let sound of Object.keys(sounds)) zombie.add(sounds[sound])

        enemy = new Enemy(sounds)

        //enemy.yell()

        zombie.userData.sounds = enemy.sounds

        console.log('load', zombie)
        

      })
  
    } 

  })


  
}

function getBoundedCharacterFromIndex(i, n) {
  return characters[(i % n + n) % n]
}

document.addEventListener('keydown', function(event) {
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
  }else if (event.key === '2') {
      characterCamera = true
  }

});


//LIGHTS AND WORLD START



//LIGHTS AND WORLD FINISH
// character.camAudioManager.getSound('zombies_round').play()
// document.getElementById('startButton').addEventListener('click', () => {
//   character.camAudioManager.getSound('zombies_round').play()
// })


//PhysicsWorld  START 

let physicsWorld;
let rigidBodies = [];
let tmpTrans = new Ammo.btTransform();

function initPhysics() {
    // Set up the physics world configuration
    const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
    const broadphase = new Ammo.btDbvtBroadphase();
    const solver = new Ammo.btSequentialImpulseConstraintSolver();

    // Create the physics world
    physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration);
    physicsWorld.setGravity(new Ammo.btVector3(0, -9.8, 0)); // Set gravity
}


//PhysicsWorld FINISH


//INFINITE LOOP START
const clock = new THREE.Clock();
let delta = 0;

function animate() {
  
    delta = clock.getDelta();

    
    if (zombie && character.character) {

      // console.log('zombie', zombie)

      if (characterCamera) 
        camera = characters[characterIndex].camera
      else
        camera = camera = camera1
      
      // console.log('zombie', zombie.position)
      // console.log('char', character.character.position)
      const direction = new THREE.Vector3();
      direction.y = 0; // Ignore y-axis for horizontal movement
      direction.x = character.character.position.x - zombie.position.x
      direction.z = character.character.position.z - zombie.position.z
      direction.normalize();

      const zombiePosition = new THREE.Vector3(zombie.position.x, zombie.position.y, zombie.position.z);
      const cameraPosition = new THREE.Vector3(character.character.position.x, 0, character.character.position.z);

      const distance = zombiePosition.distanceTo(cameraPosition);

      if (distance > 10) { // Minimum distance to follow
          zombie.position.add(direction.multiplyScalar(0.4)); // Move the zombie towards the camera
      } else {
        let sound = character.camAudioManager.getSound('zombie_hit')
        
        if (!sound.isPlaying) {
          //sound.play()
          character.showBloodEffect()
        }
          
      }

      zombie.lookAt(character.character.position); // Make the zombie look at the camera
  }

    if (characters[characterIndex]) characters[characterIndex].update(delta)

    render()
  
}

function render() {
    renderer.render(scene, camera);
}
  
renderer.setAnimationLoop( animate );

})