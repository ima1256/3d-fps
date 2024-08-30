import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 100, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

camera.position.z = 5;

function animate() {
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
	renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );


// Mouse wheel for zoom
// window.addEventListener('wheel', (event) => {

//     // var audio = new Audio('audio/drone.mp3');
//     // audio.play();

//     if (!model) return

//     const direction = new THREE.Vector3();
//     direction.subVectors(model.position, camera.position).normalize();

//     const zoomSpeed = 3; // Adjust the zoom speed as needed

//     if (event.deltaY < 0) {
//         // Zoom in
//         const cameraCopy = camera.clone();
//         cameraCopy.position.addScaledVector(direction, zoomSpeed);

//         let collision = checkCollision(cameraCopy, model)
//         console.log(collision)

//         if (collision) return

//         camera.position.addScaledVector(direction, zoomSpeed);
//     } else {
//         // Zoom out
//         camera.position.addScaledVector(direction, -zoomSpeed);
//     }

// })


// const pointer = new THREE.Vector2();

// const onPointerMove = ( event ) => {

// 	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
// 	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

// }


// window.addEventListener( 'pointermove', onPointerMove );

// if (event.key == "w") {
//     model.position.z += 1
// }

// if (event.key == "d") {
//     model.position.x -= 1
// }

// if (event.key == "s") {
//     model.position.z -= 1
// }

// if (event.key == "a") {
//     model.position.x += 1 
// }


// function animate() {


//     // Spotlight around the model
//     angle += (Math.PI / 180)* spotVelocity

    
//     spotLight.position.x = Math.cos(angle)*radius + 0;
//     spotLight.position.z = Math.sin(angle)*radius + 0;

//     const delta = clock.getDelta(); // Create a clock instance outside the animate function if not already done

//     // Update the mixer for animation
//     if (mixer) update(delta)

//     // if (model) {
//     //     // Calculate gravity force
//     //     const gravityForce = calculateGravity(objectMass, model.position.y);
//     //     velocity -= gravityForce * 0.01; // 0.01 is a time step for the simulation
//     //     model.position.y += velocity * 0.01;
    
//     //     // Check for ground collision (assuming ground is at y=0)
//     //     if (model.position.y <= 0) {
//     //         model.position.y = altitude;
//     //         velocity = 0;
//     //     }
//     // }

//     controls.update();
//     //controls2.update();
//     spotLightHelper.update(); // Update the helper
//     // if (controls) controls.update();
//     renderer.render( scene, camera );
// }

// renderer.setAnimationLoop( animate );