//Audio for an object
// create an AudioListener and add it to the camera
const listener = new THREE.AudioListener();
camera2.add( listener );

// create the PositionalAudio object (passing in the listener)
const sound = new THREE.PositionalAudio( listener );

// load a sound and set it as the PositionalAudio object's buffer
const audioLoader = new THREE.AudioLoader();
audioLoader.load( './audio/bo2-dsr-sniper.mp3', function( buffer ) {
	sound.setBuffer( buffer );
	sound.setRefDistance( 20 );
    //sound.setLoop(true)
	//sound.play();
});

// create an object for the sound to play from
const sphere = new THREE.SphereGeometry( 20, 32, 16 );
const material = new THREE.MeshPhongMaterial( { color: 0xff2200 } );
const mesh = new THREE.Mesh( sphere, material );
scene.add( mesh );

// finally add the sound to the mesh
mesh.add( sound );

// const dirLight = new THREE.DirectionalLight( 0xffffff, 5 );
// dirLight.position.set( -1, 0.75, 1 );
// dirLight.position.multiplyScalar( 50);
// dirLight.name = "dirlight";
// // dirLight.shadowCameraVisible = true;

// scene.add( dirLight );
// dirLight.castShadow = true;
// dirLight.shadowMapWidth = dirLight.shadowMapHeight = 1024*2;

// const d = 300;
// dirLight.shadowCameraLeft = -d;
// dirLight.shadowCameraRight = d;
// dirLight.shadowCameraTop = d;
// dirLight.shadowCameraBottom = -d;

// dirLight.shadowCameraFar = 3500;
// dirLight.shadowBias = -0.0001;
// dirLight.shadowDarkness = 0.35;




// scene.add(getSunlight())

// const hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 3 );
// const skyColor = HSVtoHSL(0.6, 0.75, 0.5);
// const groundColor = HSVtoHSL(0.095, 0.5, 0.5);
// hemiLight.color.setHSL(skyColor.h, skyColor.s, skyColor.l);
// hemiLight.groundColor.setHSL(groundColor.h, groundColor.s, groundColor.l);
// hemiLight.position.set( 0, 500, 0 );
// scene.add( hemiLight );






//CONOR Mcgregor

const aspect = 16/9
const scale = 20

const planet = new THREE.Mesh(
new THREE.PlaneGeometry(8*scale*2, 8*scale*2, 20, 20),
new THREE.MeshStandardMaterial({
    color: 0x1e601c
    }));

planet.castShadow = false;
planet.receiveShadow = true;
planet.rotation.x = -Math.PI / 2
scene.add(planet);

const planes = planet.clone()

planes.position.y = 9*scale
planes.rotation.x = Math.PI / 2
planes.material = new THREE.MeshStandardMaterial({
  color: 0x000000
  })

const al = new THREE.AmbientLight(0xffffff)
scene.add(al)

document.addEventListener('click', () => {


  let camera, video, videoTexture, videoMaterial, plane;
  
  // Video element
  video = document.getElementById('video');
  video.play()
  video.muted = false; // Ensure sound plays
  
  // Video texture
  videoTexture = new THREE.VideoTexture(video);
  videoTexture.minFilter = THREE.LinearFilter;
  videoTexture.magFilter = THREE.LinearFilter;
  videoTexture.format = THREE.RGBFormat;
  
  // Video material
  videoMaterial = new THREE.MeshBasicMaterial({ map: videoTexture, side: THREE.DoubleSide });
  
  // Plane geometry and mesh
  const geometry = new THREE.PlaneGeometry(16*scale, 9*scale, 10, 10); // Adjust size as needed
  plane = new THREE.Mesh(geometry, videoMaterial);
  scene.add(plane);
  plane.position.y = 9*scale / 2
 

  const plane2 = plane.clone()

  const plane3 = plane.clone()

  const plane4 = plane.clone()

  plane.position.z = -8*scale



  plane2.rotation.y = Math.PI / 2;

  plane2.position.x = -8*scale
    
  scene.add(plane2)


  plane3.rotation.y = - Math.PI / 2;

  plane3.position.x = +8*scale

  scene.add(plane3)


  plane4.rotation.y = - Math.PI 

  plane4.position.z = +8*scale

  scene.add(plane4)


  scene.add(planes)

})



// // // Get the cross element
// const cross = document.getElementById('cross');

// console.log(cross)

// console.log(cross.offsetHeight, cross.offsetWidth)

// // Function to update the cross position
// function updateCrossPosition() {
//     // Get the camera's direction vector
//     const direction = new THREE.Vector3();
//     camera2.getWorldDirection(direction);

//     // Set the position of the cross in front of the camera
//     const cameraPosition = camera2.position.clone();
//     const distance = 5; // Adjust the distance as needed
//     const crossPosition = cameraPosition.add(direction.multiplyScalar(distance));

//     // Convert the cross position to 2D screen coordinates
//     const vector = crossPosition.project(camera2);
//     const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
//     const y = -(vector.y * 0.5 - 0.5) * window.innerHeight;

//     cross.offsetHeight = 0
//     cross.offsetWidth = 0

//     // Update the cross element position
//     cross.style.left = `${x - cross.offsetWidth / 2}px`;
//     cross.style.top = `${y - cross.offsetHeight / 2}px`;
// }


let character

let targetBone

// world3d.loader.load( 'models/character.glb', function ( gltf ) {

//   character = gltf.scene
//   scene.add(character);
  
//   console.log('c', character)
//   targetBone = character;
//   for (let i = 0; i < 5; i++) {
//       targetBone = targetBone.children[0];
//   }
//   console.log(targetBone)
  
//   // scene.add(camera2);
//   // camera2.add(character);
//   //character.position.set(0.5, -1.5, -1.5); // Adjust position relative to the camera

// }, undefined, error => console.error( error ) );



// Create and add health bar
let healthBar = createHealthBar();

world3d.loader.load('models/csgo_terrorist.glb', (gltf) => {

  character = gltf.scene
  let scale = 0.3
  character.scale.set(scale, scale, scale)
  character.position.y = 0
  scene.add(character)

  character.traverse((child) => {
      child.layers.set(1);
  });

  scene.add(healthBar)
  character.add(healthBar);
  console.log(character)
  console.log(getModelHeight(character))
  healthBar.position.set(0, 80, 0);
  healthBar.layers.set(1)

}) 


// Load the FBX file
let man
let mixer 
const loader = new FBXLoader();
loader.load('./models/zombie_reaction.fbx', function (object) {
    scene.add(object);
    console.log('c', object)

    object.scale.set(0.1, 0.1, 0.1)

    object.position.set(-10, 0, -10)

    const animation = object.animations[0]

    mixer = new THREE.AnimationMixer(object);

    const action = mixer.clipAction(animation);
    action.play();

}, undefined, function (error) {
    console.error(error);
});



world3d.loader.load( 'models/weapons/csgo_weapon_m4.glb', function ( gltf ) {

  gun = gltf.scene
  scene.add(gun);

  const scale = 0.0005

  gun.scale.set(scale, scale, scale)

  gun.sound = camAudioManager.getSound('m4_silencer')

  gun.sound.setVolume(0.3)

  gun.add(gun.sound)

  // const zombie = world3d.models.zombie
  // zombie.sound = camAudioManager.getSound('zombie_yell')
  // world3d.models.zombie = zombie
  
  
  scene.add(camera2);
  camera2.add(gun);
  //gun.quaternion.invert();
  // gun.position.y = 10
  gun.rotation.x = - Math.PI
  gun.rotation.z = - Math.PI
  // gun.rotation.y = - Math.PI / 12

  gun.position.z = 0.1
  gun.position.y = -0.2
  gun.position.x = 0.1

  sm = new ShootingManager(world3d, gun, camera2, camAudioManager, [world3d.terrain, zombie] )
  fpsCamera.input_.addShootingManager(sm)

}, undefined, error => console.error( error ) );