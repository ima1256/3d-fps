import * as THREE from 'three';
import { World3d } from './3dworldManager';
import { Character } from './character';
import { Enemy } from './enemy';
import { Physics } from './physics';

//PhysicsWorld  START 

//World variables 

var characterIndex = 0
let camera

let characters = []
let numCharacters = 2
let characterCamera = true

let character
let zombie

let enemy

let enemies = []

let delta = 0;

let scene
let camera1
let controls

const clock = new THREE.Clock();
const renderer = new THREE.WebGLRenderer();
const world3d = new World3d(renderer, characters, enemies)

let physics = new Physics(world3d)

//PhysicsWorld FINISH
const initThreeJS = async () => {

  await world3d.initialize()

  scene = world3d.scene

  await world3d.setupCameras()

  camera1 = world3d.cameras['main_camera'].cam
  controls = world3d.cameras['main_camera'].controls

  //SETUP CONFIGURATION START
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true; // Enable shadows
  window.document.body.appendChild(renderer.domElement);
  window.addEventListener("resize", onWindowResize, false);
  //SETUP CONFIGURATION FINISH


  const characterPromises = []

  for (let i = 0; i < numCharacters; i++) {

    let char = new Character(world3d, i + 1)

    const charPromise = char.initialize().then(() => {

      characters.push(char)

      if (i == 0) {

        localStorage.setItem('characterId', char.uid)
        character = char

        world3d.loadModel('models/ZombieGood.glb', 'zombie').then(gltf => {

          zombie = gltf.scene
          character.addTarget(zombie)

          zombie.position.set(0, 0, 20)


          //Sounds
          let sounds = character.camAudioManager.getSounds('zombie')
          zombie.userData.sounds = sounds
          for (let sound of Object.keys(sounds)) zombie.add(sounds[sound])

          enemy = new Enemy(world3d, sounds, '_zombie_', gltf)


        })

      }

    })

    characterPromises.push(charPromise);

  }

  await Promise.all(characterPromises);

  for (let i = 0; i < numCharacters - 1; i++) {

    for (let j = 0; j < numCharacters; j++) {

      if (i != j) {
        characters[i].addTarget(characters[j].character.children[0])
      }

    }
  }

  character = characters[characterIndex]

}

const init = async () => {

  await initThreeJS()
  // await physics.initialize()
  renderer.setAnimationLoop(animate)
}

init()


function animate() {

  delta = clock.getDelta();

  if (zombie && character.character) {

    const direction = new THREE.Vector3();
    direction.y = 0
    direction.x = character.character.position.x - zombie.position.x
    direction.z = character.character.position.z - zombie.position.z
    direction.normalize();

    const zombiePosition = new THREE.Vector3(zombie.position.x, 0, zombie.position.z);
    const cameraPosition = new THREE.Vector3(character.character.position.x, 0, character.character.position.z);

    const distance = zombiePosition.distanceTo(cameraPosition);

    if (distance > 1) {

      let state = enemy.getState()
      let scalar = 0

      if (state == "fastrun") {
        scalar = 3 / 0.5666666626930237
      } else if (state == "walk") {
        scalar = 1.46 / 4
      }

      // Move the zombie towards the camera
      //zombie.position.add(direction.multiplyScalar(((scalar) * delta * enemy.scale)));

    } else {

      //enemy.attack()

      let sound = character.camAudioManager.getSound('zombie_hit')

      if (!sound.isPlaying) {
        //sound.play()
        character.showBloodEffect()
      }

    }

    const targetPosition = character.character.position.clone()
    targetPosition.y = zombie.position.y
    zombie.lookAt(targetPosition)

    enemy.update(delta)

  }

  if (characterCamera) camera = character.camera
  else camera = camera1

  controls.update(delta)
  //PHYSICS STUFF START 
  // physics.update(delta)
  //PHYSICS STUFF FINISH

  character.update(delta)

  render()

}

function render() {
  renderer.render(scene, camera);
}



//---------------------------------------------------------------------------------





// Prevent the context menu for the entire document
document.addEventListener('contextmenu', function (event) {
  //event.preventDefault();
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
