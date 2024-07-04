import { ShootingManager } from "./ShootingManager"
import * as THREE from 'three';
import { createHealthBar, generateUUID } from "./utils";
import { FirstPersonCamera } from "./controls";
import { CameraAudioManager } from "./functions";

export class Character {

    constructor(world3d, layer) {

        this.world3d = world3d
        this.uid = generateUUID()
        this.health = 100
        this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight , 0.1, 100000 );
        this.camera.position.set(10, 20, 10)
        this.camera.lookAt(new THREE.Vector3(0, 0, 0))

        this.layer = layer

        for (let i = 0; i < 32; i++) {

            if (i !== this.layer)
                this.camera.layers.enable(i)
            else
                this.camera.layers.disable(i)
        }

        this.world3d.scene.add(this.camera);

        let camAudioManager = new CameraAudioManager(this.camera)

        // camAudioManager.loadSound('./audio/linkedin_msg.mp3'}, 'linkedin_msg')
        // camAudioManager.loadSound('./audio/zombie_yell.mp3', 'zombie_yell')
        let audioFolder = './audio/'
        camAudioManager.loadSound(audioFolder + 'm4_silencer.mp3', 'm4_silencer')
        camAudioManager.loadSound(audioFolder + 'cod_zombies_round.mp3', 'zombies_round')
        let zombiesFolder = 'zombies/'
        // camAudioManager.loadSound(audioFolder + zombiesFolder, 'zombie_35.mp3' )
        // camAudioManager.loadSound(audioFolder + zombiesFolder, 'zombie_38.mp3' )
        // camAudioManager.loadSound(audioFolder + zombiesFolder, 'zombie_39.mp3' )
        // camAudioManager.loadSound(audioFolder + zombiesFolder, 'zombie_40.mp3' )
        // camAudioManager.loadSound(audioFolder + zombiesFolder, 'zombie_41.mp3' )

        this.camAudioManager = camAudioManager

        this.fpsCamera = new FirstPersonCamera(this.uid, this.camera)
      

    }

    async initialize() {
        await this.loadCharacter()
        await this.loadWeapon()
    }

    getRandomPosition(min, max) {
        return Math.random() * (max - min) + min;
    }

    onGetsHit() {
        this.health -= 10
    }

    loadCharacter = async () => {

        let healthBar = createHealthBar()

        let character = await this.world3d.loadModel('models/csgo_terrorist.glb', 'player-' + this.uid)
        let scale = 0.3
        character.scale.set(scale, scale, scale)
        character.position.y = 0
        character.position.x = this.getRandomPosition(-10, 10);
        character.position.z = this.getRandomPosition(-10, 10)
        //this.world3D.scene.add(character)
      
        character.traverse((child) => {
            child.layers.set(this.layer);
        });
      
        this.world3d.scene.add(healthBar)
        character.add(healthBar);

        healthBar.position.set(0, 80, 0);
        healthBar.layers.set(this.layer)

        this.character = character
        this.healthBar = healthBar

    }

    loadWeapon = async () => {

        let gun = await this.world3d.loadModel('models/weapons/csgo_weapon_m4.glb', 'gun-' + this.uid)
        //this.world3d.scene.add(gun);
      
        const scale = 0.0005
        gun.scale.set(scale, scale, scale)

        gun.sound = this.camAudioManager.getSound('m4_silencer')
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

        this.camera.camAudioManager = this.camAudioManager
      
        this.sm = new ShootingManager(this.world3d, gun, this.camera, this.camAudioManager, [this.world3d.terrain] )
        this.fpsCamera.input_.addShootingManager(this.sm)

    }

    addTarget(target) {
        this.sm.addTarget(target)
    }

    update = (delta) => {

        let fpsCamera = this.fpsCamera
        let sm = this.sm
        let character = this.character
        let camera = this.camera

        if (fpsCamera) fpsCamera.update(delta)

        // Example: Update the position of the mesh dynamically
    
        if (sm) sm.updateBullets()
    
        // if (targetBone) targetBone[0].rotation.x += 0.01
        // // updateCrossPosition()
        //if (mixer) mixer.update(delta)
    
        if (character) {
            character.position.copy(camera.position);
            character.position.set(camera.position.x, camera.position.y-20, camera.position.z)
            character.rotation.y = camera.rotation.y - Math.PI; // Copy Y-axis rotation
            // const offset = new THREE.Vector3(0, 0, ); // Adjust -2 to the desired offset
            // offset.applyQuaternion(camera.quaternion);
            // character.position.add(offset);
        }
    }

}