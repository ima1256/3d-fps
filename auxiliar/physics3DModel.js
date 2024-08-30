import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let scene, camera, renderer, physicsWorld;
let loadedModel, modelBody;

Ammo().then(() => {
    initThreeJS();
    initPhysics();
    loadModel();
    animate();
});

function initThreeJS() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcccccc);  // Set a background color to help with visibility

    // Camera setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 5);
    camera.lookAt(0, 1, 0);  // Make sure the camera is looking at the scene

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;  // Enable shadows
    document.body.appendChild(renderer.domElement);

    // Lighting setup
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    directionalLight.castShadow = true;  // Enable shadows for the light
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);  // Soft white light
    scene.add(ambientLight);

    // Add a ground plane for better visualization
    const groundGeometry = new THREE.PlaneGeometry(10, 10);
    const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;  // Ground receives shadows
    scene.add(ground);
}

function initPhysics() {
    const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
    const overlappingPairCache = new Ammo.btDbvtBroadphase();
    const solver = new Ammo.btSequentialImpulseConstraintSolver();

    physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    physicsWorld.setGravity(new Ammo.btVector3(0, -9.82, 0));
}

function loadModel() {
    const loader = new GLTFLoader();
    loader.load('models/output.glb', (gltf) => {
        loadedModel = gltf.scene;
        scene.add(loadedModel);

        // Add debug message
        console.log('Model loaded', loadedModel);

        // Create physics body for the model
        createPhysicsForModel(loadedModel);

        //setPosition(loadedModel, { x: 0, y: 1, z: 0 })

    }, undefined, (error) => {
        console.error('An error occurred loading the model', error);
    });
}

function setPosition(model, position) {
    model.position.set(position.x, position.y, position.z);

    model.traverse((child) => {
        if (child.isMesh && child.userData.physicsBody) {
            const physicsBody = child.userData.physicsBody;
            const transform = new Ammo.btTransform();
            transform.setIdentity();
            transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
            physicsBody.setWorldTransform(transform);
            physicsBody.getMotionState().setWorldTransform(transform);

            // Activate the body to ensure it reacts to physics
            physicsBody.activate();
        }
    });
}

function createPhysicsForModel(model) {
    model.traverse((child) => {
        if (child.isMesh) {
            
            child.castShadow = true;  // Allow meshes to cast shadows
            child.receiveShadow = true;  // Allow meshes to receive shadows

            // Create a bounding box for the mesh
            const bbox = new THREE.Box3().setFromObject(child);
            const size = new THREE.Vector3();
            bbox.getSize(size);

            const shape = new Ammo.btBoxShape(new Ammo.btVector3(size.x / 2, size.y / 2, size.z / 2));
            const transform = new Ammo.btTransform();
            transform.setIdentity();
            transform.setOrigin(new Ammo.btVector3(child.position.x, child.position.y, child.position.z));
            const motionState = new Ammo.btDefaultMotionState(transform);

            const mass = 1;
            const inertia = new Ammo.btVector3(0, 0, 0);
            shape.calculateLocalInertia(mass, inertia);

            const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, inertia);
            modelBody = new Ammo.btRigidBody(rbInfo);
            physicsWorld.addRigidBody(modelBody);

            // Store the physics body in the mesh's userData for later use
            child.userData.physicsBody = modelBody;

        }
    });

}

function animate() {
    requestAnimationFrame(animate);

    const deltaTime = 1 / 60;
    physicsWorld.stepSimulation(deltaTime, 10);

    // Update the loaded model position and rotation based on the physics simulation
    if (loadedModel) {
        loadedModel.traverse((child) => {
            if (child.isMesh && child.userData.physicsBody) {
                const objAmmo = child.userData.physicsBody;
                const ms = objAmmo.getMotionState();
                if (ms) {
                    const transform = new Ammo.btTransform();
                    ms.getWorldTransform(transform);
                    const p = transform.getOrigin();
                    const q = transform.getRotation();
                    child.position.set(p.x(), p.y(), p.z());
                    child.quaternion.set(q.x(), q.y(), q.z(), q.w());
                }
            }
        });
    }

    renderer.render(scene, camera);
}
