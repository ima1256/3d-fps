import * as THREE from 'three';

let scene, camera, renderer, physicsWorld;
let sphereMesh, floorMesh, sphereBody, floorBody;
let projectiles = [];

Ammo().then(() => {
    // Initialize Three.js
    initThreeJS();

    // Initialize Ammo.js
    initAmmo();

    // Create physics objects
    createPhysicsObjects();

    // Add event listener for shooting
    window.addEventListener('mousedown', shoot);

    // Start the animation loop
    animate();
});

function initThreeJS() {
    // Create the scene
    scene = new THREE.Scene();

    // Create the camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);

    // Create the renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Add lights
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // Soft white light
    scene.add(ambientLight);
}

function initAmmo() {
    // Physics configuration
    const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
    const overlappingPairCache = new Ammo.btDbvtBroadphase();
    const solver = new Ammo.btSequentialImpulseConstraintSolver();

    // Create the physics world
    physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    physicsWorld.setGravity(new Ammo.btVector3(0, -9.82, 0));
}

let sphere 

function createPhysicsObjects() {
    // Create the floor
    let floorSize = 20
    const floorGeometry = new THREE.BoxGeometry(floorSize, 1, floorSize);
    const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x999999 });
    floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floorMesh.position.set(0, -0.5, 0);
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Create the floor physics body
    const floorShape = new Ammo.btBoxShape(new Ammo.btVector3(floorSize/2, 0.5, floorSize / 2));
    const floorTransform = new Ammo.btTransform();
    floorTransform.setIdentity();
    floorTransform.setOrigin(new Ammo.btVector3(0, -0.5, 0));
    const floorMotionState = new Ammo.btDefaultMotionState(floorTransform);
    const floorMass = 0; // Mass of 0 means it's static
    const floorInertia = new Ammo.btVector3(0, 0, 0);
    const floorInfo = new Ammo.btRigidBodyConstructionInfo(floorMass, floorMotionState, floorShape, floorInertia);
    floorBody = new Ammo.btRigidBody(floorInfo);
    floorBody.setRestitution(1); // Low restitution for less bounce
    floorBody.setFriction(0.9); // High friction to slow down the bullet
    physicsWorld.addRigidBody(floorBody);

    // Create the main sphere
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
    const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphereMesh.position.set(0, 5, 0);
    sphereMesh.castShadow = true;
    scene.add(sphereMesh);
    sphere = sphereMesh

    // Create the main sphere physics body
    const sphereShape = new Ammo.btSphereShape(1);
    const sphereTransform = new Ammo.btTransform();
    sphereTransform.setIdentity();
    sphereTransform.setOrigin(new Ammo.btVector3(0, 5, 0));
    const sphereMotionState = new Ammo.btDefaultMotionState(sphereTransform);
    const sphereMass = 1;
    const sphereInertia = new Ammo.btVector3(0, 0, 0);
    sphereShape.calculateLocalInertia(sphereMass, sphereInertia);
    const sphereInfo = new Ammo.btRigidBodyConstructionInfo(sphereMass, sphereMotionState, sphereShape, sphereInertia);
    sphereBody = new Ammo.btRigidBody(sphereInfo);
    sphereBody.setRestitution(1); // Set restitution for bounce
    sphereBody.setFriction(0.5); // Add friction to the sphere
    sphereBody.setDamping(0.1, 0.1); // Add linear and angular damping
    physicsWorld.addRigidBody(sphereBody);
}

function shoot() {
    // Create a projectile
    const projectileGeometry = new THREE.SphereGeometry(0.2, 32, 32);
    const projectileMaterial = new THREE.MeshPhongMaterial({ color: 0x0000ff });
    const projectileMesh = new THREE.Mesh(projectileGeometry, projectileMaterial);
    projectileMesh.position.copy(camera.position);
    projectileMesh.castShadow = true;
    scene.add(projectileMesh);

    // Create the projectile physics body
    const projectileShape = new Ammo.btSphereShape(0.5);
    const projectileTransform = new Ammo.btTransform();
    projectileTransform.setIdentity();
    projectileTransform.setOrigin(new Ammo.btVector3(camera.position.x, camera.position.y, camera.position.z));
    const projectileMotionState = new Ammo.btDefaultMotionState(projectileTransform);
    const projectileMass = 0.2;
    const projectileInertia = new Ammo.btVector3(0, 0, 0);
    projectileShape.calculateLocalInertia(projectileMass, projectileInertia);
    const projectileInfo = new Ammo.btRigidBodyConstructionInfo(projectileMass, projectileMotionState, projectileShape, projectileInertia);
    const projectileBody = new Ammo.btRigidBody(projectileInfo);
    projectileBody.setRestitution(0.1); // Low restitution to minimize bounce
    projectileBody.setFriction(0.9); // High friction to make the bullet slow down and stop
    projectileBody.setDamping(0.1, 0.1); // Add linear and angular damping
    physicsWorld.addRigidBody(projectileBody);

    // Apply an initial force to the projectile
    const force = new THREE.Vector3(0, 0, -10); // Direction and magnitude of force
    force.applyQuaternion(camera.quaternion); // Rotate force based on camera orientation
    const ammoForce = new Ammo.btVector3(force.x, force.y, force.z);
    projectileBody.applyCentralImpulse(ammoForce);

    // Store projectile for updating
    projectiles.push({ mesh: projectileMesh, body: projectileBody });
    
}

let isSimulationPaused = false;


function animate() {
    requestAnimationFrame(animate);

    if (!isSimulationPaused) { 

        // Step the physics world
        const deltaTime = 1 / 60;
        physicsWorld.stepSimulation(deltaTime, 10);
    
        // Update Three.js objects based on physics simulation
        updatePhysics();
    }

    console.log(sphere.position.y)


    // Render the scene
    renderer.render(scene, camera);
}

window.addEventListener('keydown', (event) => {
    if (event.key === 'p') { // Use 'p' to pause/resume the simulation
        isSimulationPaused = !isSimulationPaused;
    }
});


function updatePhysics() {
    // Update main sphere
    const sphereTransform = new Ammo.btTransform();
    sphereBody.getMotionState().getWorldTransform(sphereTransform);
    const sphereOrigin = sphereTransform.getOrigin();
    const sphereRotation = sphereTransform.getRotation();
    sphereMesh.position.set(sphereOrigin.x(), sphereOrigin.y(), sphereOrigin.z());
    sphereMesh.quaternion.set(sphereRotation.x(), sphereRotation.y(), sphereRotation.z(), sphereRotation.w());

    // Update projectiles
    projectiles.forEach(({ mesh, body }) => {
        const transform = new Ammo.btTransform();
        body.getMotionState().getWorldTransform(transform);
        const origin = transform.getOrigin();
        const rotation = transform.getRotation();
        mesh.position.set(origin.x(), origin.y(), origin.z());
        mesh.quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());
    });
}
