import * as THREE from 'three';

export class ShootingManager {

    constructor(world3d, gun, camera, camAudioManager, availableTargets) {

        this.raycaster = new THREE.Raycaster();
        this.raycasterOrigin = new THREE.Vector3();
        this.raycasterDirection = new THREE.Vector3();

        this.gun = gun;
        this.shooting = false

        this.bulletsPerMinute = 100
        this.waitShooting = false
        this.cadence = this.#getCadence()
        this.world3d = world3d
        this.scene = world3d.scene;
        this.bullets = [];
        this.camera = camera
        this.availableTargets = availableTargets
        this.camAudioManager = camAudioManager

    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async waitShootingBuffer() {
        await this.sleep(this.cadence); // Pause for 2000 milliseconds (2 seconds)
        this.waitShooting = false
    }

    #getCadence() {
        return (1000 / (this.bulletsPerMinute / 60))
    }

    #addBullet() {

        const bullet = new THREE.Object3D();
        // Create a thin cylinder or box geometry to represent the laser
        // const laserGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 32); // Thin cylinder
        // // Alternatively, use a box geometry for a rectangular laser:
        // // const laserGeometry = new THREE.BoxGeometry(0.1, 0.1, 2); // Thin rectangular laser

        // // Create a material with emissive properties to make it look like a glowing laser
        // const laserMaterial = new THREE.MeshBasicMaterial({
        //     color: 0xff0000, // Red laser color
        //     emissive: 0xff0000, // Emissive color (same as base color)
        //     emissiveIntensity: 1.5 // Make the laser appear to glow
        // });

        // // Create the laser mesh
        // const laserBullet = new THREE.Mesh(laserGeometry, laserMaterial);

        // const bullet = laserBullet

        this.scene.add(bullet);
        this.camera.getWorldPosition(bullet.position);
        this.camera.getWorldQuaternion(bullet.quaternion);

        //bullet.position.add(laserBullet.getWorldDirection(new THREE.Vector3()).multiplyScalar(1));

        this.bullets.push(bullet);

        // if (this.bullets.length > 10) {
        //     const oldBullet = this.bullets.shift()
        //     oldBullet.removeFromParent()
        // }  

    }

    #playGunSound() {
        if (this.gun.sound.isPlaying) 
            this.gun.sound.stop()
        this.gun.sound.currentTime = 0;
        this.gun.sound.play()
    }

    shoot = async () => {

        this.shooting = true

        while(true) {

            if (!this.waitShooting) {

                this.waitShooting = true
    
                this.#addBullet()
    
                this.#playGunSound()
    
                await this.waitShootingBuffer()
    
                if (!this.shooting) break
                
            } 
            
        }

    };

    stop_shooting = () => {
        //this.gun.sound.stop()
        this.shooting = false
        this.waitShooting = false
    }

    addTarget(target) {
        this.availableTargets.push(target)
    }


    async #createSphere(target) {

        const sound = this.camAudioManager.getSound('linkedin_msg')
        
        const sphereGeometry1 = new THREE.SphereGeometry(0.3, 32, 32); // Radius 5, width and height segments 32
        const sphereMaterial1 = new THREE.MeshLambertMaterial({ color: 0xff0000 }); // Red color
        const sphere = new THREE.Mesh(sphereGeometry1, sphereMaterial1);
        const hitPoint = target.point;
        sphere.position.copy(hitPoint);
        this.scene.add(sphere);

        sphere.add(sound);

        sound.play();
        target.object.attach(sphere);

    }

    onTargetHit = async (target) => {

        //console.log(this.world3d.models.zombie)

        let parent = this.isZombie(target)

        if (parent) {

            console.log('zombie', target, parent)
            const sound = parent.userData.sounds['bullet_hit']
            if (sound.isPlaying) sound.stop()
            sound.play()
            // const sound = this.camAudioManager.getSound('linkedin_msg');
   
            // sound.play()

            //await this.#createSphere(target)

        } 

    };

    isZombie(target) {

        let parent = target.object.parent
        while(parent) {
            if (parent.name == 'my_zombie') return parent
            parent = parent.parent
        }

        return false

    }

    updateBullets = () => {

        [...this.bullets].forEach((bullet) => {

            // NOTE Raycast from each bullet and see if it hit any target compatible with the idea of being hit by a bullet
            bullet.getWorldPosition(this.raycasterOrigin);
            bullet.getWorldDirection(this.raycasterDirection);

            // Ensure the direction is unitary
            this.raycasterDirection.normalize();

            this.raycasterDirection.multiplyScalar(-1);

            this.raycaster.set(this.raycasterOrigin, this.raycasterDirection);

            const hits = this.raycaster.intersectObjects(this.availableTargets, true);
            

            if (hits.length > 0) {

                const firstHitTarget = hits[0];

                // NOTE React to being hit by the bullet in some way, for example:
                this.onTargetHit(firstHitTarget);

                // NOTE Remove bullet from the world
                bullet.removeFromParent();

                this.bullets.splice(this.bullets.indexOf(bullet), 1);

            }

            // NOTE If no target was hit, just travel further, apply gravity to the bullet etc.
            bullet.position.add(this.raycasterDirection.multiplyScalar(1));

        });
    };
}
