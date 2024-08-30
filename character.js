import { ShootingManager } from "./ShootingManager"
import * as THREE from 'three';
import { createHealthBar, generateUUID, updateHealthBar } from "./utils";
import { FirstPersonCamera } from "./controls";
import { CameraAudioManager } from "./functions";

export class Character {

    constructor(world3d, layer) {

        this.initialized = false
        this.world3d = world3d
        this.uid = generateUUID()
        this.maxHealth = 100
        this.health = 100
 
        this.dead = false
        this.size
        this.boxHelper
        this.healthBar
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
        this.body = null
        this.gun = null

        this.layer = layer

        for (let i = 0; i < 32; i++) {

            if (i !== this.layer)
                this.camera.layers.enable(i)
            else
                this.camera.layers.disable(i)

        }

        this.world3d.scene.add(this.camera);
        let camAudioManager = new CameraAudioManager(this.camera)

        let audioFolder = './audio/'
        camAudioManager.loadSound(audioFolder + 'm4_silencer.mp3', 'm4_silencer')
        camAudioManager.loadSound(audioFolder + 'blaster.mp3', 'blaster')
        camAudioManager.loadSound(audioFolder + 'cod_zombies_round.mp3', 'cod_zombies_round')
        camAudioManager.loadSound(audioFolder + 'linkedin_msg.mp3', 'linkedin_msg')
        camAudioManager.loadSound()


        let zombiesFolder = audioFolder + 'zombies/'
        camAudioManager.loadSound(zombiesFolder + 'zombie_35.mp3', "zombie_35");
        camAudioManager.loadSound(zombiesFolder + 'zombie_38.mp3', "zombie_38");
        camAudioManager.loadSound(zombiesFolder + 'zombie_39.mp3', "zombie_39");
        camAudioManager.loadSound(zombiesFolder + 'zombie_40.mp3', "zombie_40");
        camAudioManager.loadSound(zombiesFolder + 'zombie_41.mp3', "zombie_41");

        camAudioManager.loadSound(zombiesFolder + 'human_zombie_hit.mp3', "zombie_hit");
        camAudioManager.loadSound(zombiesFolder + 'bullet_hit.mp3', 'bullet_hit')


        this.camAudioManager = camAudioManager
        this.bloodMesh = this.#getBloodMesh()

    }

    setPhysics() {

        const size = this.size

        // const radius = size.x * 0.5; // Assuming width of the character is appropriate for the radius
        // const height = size.y - 2 * radius; // Subtract the diameter of the capsule ends
        // const colShape = new Ammo.btCapsuleShape(radius, height);

        // Ammo.js expects half-extents for the btBoxShape
        const halfExtents = new Ammo.btVector3(size.x * 0.5, size.y * 0.5, size.z * 0.5);
        const colShape = new Ammo.btBoxShape(halfExtents);

        const transform = new Ammo.btTransform();
        transform.setIdentity();

        // Use the position of the character's mesh (or Object3D) to set the initial position of the physics body
        const pos = this.character.position.clone();
        transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));

        console.log("Bounding Box:", this.box);
        console.log("Character Position:", this.character.position);
        console.log("Adjusted Position:", pos.y);
        console.log("Character", this.character)

        // Motion state and local inertia
        const motionState = new Ammo.btDefaultMotionState(transform);
        const localInertia = new Ammo.btVector3(0, 0, 0);
        const mass = 80
        colShape.calculateLocalInertia(mass, localInertia); // Mass = 1

        // Set the collision margin
        colShape.setMargin(0.5); // Adjust the margin as needed

        const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
        const body = new Ammo.btRigidBody(rbInfo);

        body.activate()
        // body.setDamping(0.9, 0.9); // Set damping factors for linear and angular motion

        body.setFriction(0.1);    // Adjust friction
        body.setRestitution(0.2); // Lower restitution to avoid bouncing

        this.setBody(body)

        return body
    }

    setBody(body) {
        this.body = body
        this.fpsCamera.setBody(body)
    }

    async initialize() {
        await this.loadCharacter()
        await this.loadWeapon()
        this.initialized = true
    }

    getRandomPosition(min, max) {
        return Math.random() * (max - min) + min;
    }

    onGetsHit() {
        this.health -= 10
    }

    initBBox = () => {
        this.boxHelper = new THREE.BoxHelper(this.character.children[0], 0xff0000); // Red wireframe box
        //this.world3d.scene.add(this.boxHelper);
        this.box = new THREE.Box3().setFromObject(this.character);
        const size = new THREE.Vector3();
        this.box.getSize(size); // Get the size (width, height, depth) of the bounding box
        this.size = size

        //this.size.multiply(this.scale);
        
        const center = new THREE.Vector3()
        this.box.getCenter(center)
        this.center = center
    }

    initHealthBar = () => {

        let character = this.character

        let healthBar = createHealthBar()

        const mult = 1/this.scale

        healthBar.position.set(0, this.size.y*mult * 1.05 , 0)

        healthBar.layers.set(this.layer)

        this.world3d.scene.add(healthBar)
        character.add(healthBar);
        this.healthBar = healthBar

    }

    loadCharacter = async () => {

        let gltf = await this.world3d.loadModel('models/csgo_terrorist.glb', 'player-' + this.uid)

        console.log('animations', gltf.animations)

        this.character = gltf.scene
        this.character.gameTag = '_character_'
        this.character.uid = this.uid
        console.log('character', this.character)
        this.character.health = this.health

        this.scale = 0.3
        this.character.scale.set(this.scale, this.scale, this.scale)
        this.character.position.set(20, 0, 20)

        this.character.traverse((child) => {
            child.layers.set(this.layer);
        });

        this.character.updateMatrixWorld(true);

        
        this.initBBox()

        this.initHealthBar()

        this.character.add(this.camera)

        
        const mult = 1/this.scale

        this.camera.position.set(this.center.x*mult, this.size.y*mult*0.8, this.center.z*mult)

        // Ensure the camera's world matrix is up-to-date
        this.camera.updateMatrixWorld(true);

        // this.camera.rotation.y = Math.PI; // 180 degrees in radians


        // Create a vector to hold the world position
        const worldPosition = new THREE.Vector3();

        // Get the world position of the camera
        this.camera.getWorldPosition(worldPosition);

        // Now `worldPosition` holds the camera's position in world coordinates
        console.log('World position of the camera:', worldPosition);

        const forwardDirection = new THREE.Vector3(0, 1, 0); // Local Z-axis in forward direction
        forwardDirection.applyQuaternion(this.character.quaternion); // Rotate by character's orientation

        // Calculate the target position in world coordinates
        const targetPosition = new THREE.Vector3();
        targetPosition.copy(this.character.position).add(forwardDirection);

    

        // Make the camera look at this target position
        // this.camera.lookAt(targetPosition);

        //this.world3d.addSphere(worldPosition, 1)


        this.fpsCamera = new FirstPersonCamera(this.uid, this.camera, this.character, this.world3d)


    }

    loadWeapon = async () => {

        let gunGltf = await this.world3d.loadModel('models/weapons/csgo_weapon_m4.glb', 'gun-' + this.uid)

        let gun = gunGltf.scene

        const scale = 0.0005
        gun.scale.set(scale, scale, scale)

        gun.sound = this.camAudioManager.getSound('blaster')
        gun.sound.setVolume(0.3)
        gun.add(gun.sound)


        this.camera.add(gun);
        //gun.quaternion.invert();
        // gun.position.y = 10
        gun.rotation.x = - Math.PI
        gun.rotation.z = - Math.PI
        // gun.rotation.y = - Math.PI / 12

        gun.position.z = 0.1
        gun.position.y = -0.2
        gun.position.x = 0.1

        this.gun = gun

        this.camera.camAudioManager = this.camAudioManager

        this.sm = new ShootingManager(this.world3d, gun, this.camera, this.camAudioManager, [this.world3d.terrain])
        this.fpsCamera.input_.addShootingManager(this.sm)

    }

    hit() {

        console.log('health', this.health, this.uid)

        if (this.health <= 0) {
            this.health = 100
        } else this.health -= 20

        updateHealthBar(this.healthBar, this.health / this.maxHealth)

    }

    addTarget(target) {
        this.sm.addTarget(target)
    }

    #getBloodMesh() {

        // Load the blood texture
        const loader = new THREE.TextureLoader();
        const bloodTexture = loader.load('./images/blood.png');

        // Create a material using the blood texture
        const bloodMaterial = new THREE.MeshBasicMaterial({
            map: bloodTexture,
            transparent: true, // Enable transparency so the background shows through
            opacity: 0.8 // Adjust opacity for the desired effect
        });

        // Create a plane geometry that will cover the entire screen
        const aspect = window.innerWidth / window.innerHeight;
        const bloodGeometry = new THREE.PlaneGeometry(2 * aspect, 2); // Size it to cover the screen

        // Create the mesh
        const bloodMesh = new THREE.Mesh(bloodGeometry, bloodMaterial);

        // Position the plane in front of the camera
        bloodMesh.position.set(0, 0, -1.2); // Slightly in front of the camera

        return bloodMesh

    }

    showBloodEffect() {


        // Add the blood mesh to the camera so it appears on the screen
        this.camera.add(this.bloodMesh);

        // Set a timeout to remove the blood effect after 1 second (1000 milliseconds)
        setTimeout(() => {
            this.camera.remove(this.bloodMesh);
        }, 3000);

    }

    update = (delta) => {

        let fpsCamera = this.fpsCamera
        let sm = this.sm

        if (fpsCamera) fpsCamera.update(delta)

        if (sm) sm.updateBullets()

        // console.log('character', this.character.position, this.body)
        // console.log('terrain', this.world3d.terrain.position)

        if (this.boxHelper) {
            this.boxHelper.update()
        }

        this.#copyCameraRotation()

        //console.log(this.sm.availableTargets)

        // if (character) {
        //     this.#copyCharacterPosition()
        // }
    }

    reset() {

    }

    #copyCameraRotation() {

        this.character.children[0].rotation.z = this.camera.rotation.z - Math.PI

    }

    #copyCharacterPosition() {

        if (this.box && this.size) {

            // this.camera.position.copy(this.character.position)
            this.camera.position.y += this.size.y * 2 / 3
        }

    }

    #copyCameraPosition() {
        this.character.position.copy(this.camera.position);
        this.character.rotation.y = this.camera.rotation.y - Math.PI; // Copy Y-axis rotation
        // const offset = new THREE.Vector3(0, 0, ); // Adjust -2 to the desired offset
        // offset.applyQuaternion(this.camera.quaternion);
        // this.character.position.add(offset);
    }

}

