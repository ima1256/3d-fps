import * as THREE from 'three';

export class ShootingManager {

    constructor(world3d, gun, camera, camAudioManager, availableTargets) {

        this.raycaster = new THREE.Raycaster();
        this.raycasterOrigin = new THREE.Vector3();
        this.raycasterDirection = new THREE.Vector3();

        this.gun = gun;
        this.shooting = false
        this.cadence = 100
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

    #addBullet() {
        const bullet = new THREE.Object3D();
        this.scene.add(bullet);
        this.camera.getWorldPosition(bullet.position);
        this.camera.getWorldQuaternion(bullet.quaternion);
        this.bullets.push(bullet);

        // if (this.bullets.length > 10) {
        //     const oldBullet = this.bullets.shift()
        //     oldBullet.removeFromParent()
        // }  

    }

    shoot = async () => {

        this.shooting = true

        while(true) {

            this.#addBullet()

            if (this.gun.sound.isPlaying) this.gun.sound.stop()
    
            this.gun.sound.currentTime = 0;
            this.gun.sound.play()
            await this.sleep(this.cadence); // Pause for 2000 milliseconds (2 seconds)
            if (!this.shooting) break
            
        }


    };

    addTarget(target) {
        this.availableTargets.push(target)
    }

    stop_shooting = () => {
        //this.gun.sound.stop()
        this.shooting = false
    }

    onTargetHit = (target) => {

        // const sphereGeometry1 = new THREE.SphereGeometry(0.3, 32, 32); // Radius 5, width and height segments 32
        // const sphereMaterial1 = new THREE.MeshLambertMaterial({ color: 0xff0000 }); // Red color
        // const sphere = new THREE.Mesh(sphereGeometry1, sphereMaterial1);
        // const hitPoint = target.point;
        // sphere.position.copy(hitPoint);
        // this.scene.add(sphere);

        // // const sound = this.camAudioManager.getSound('linkedin_msg');

        // // sphere.add(sound);
        
        // // sound.play();
        // target.object.attach(sphere);

        //console.log(this.world3d.models.zombie)

        // if (this.isZombie(target)) {
        //     // const sound = this.world3d.models.zombie.sound
        //     // if (sound.isPlaying) sound.stop()
        //     // sound.play()

        //     console.log('zombie')
        // } 

    };

    isZombie(target) {

        let parent = target.object.parent
        while(parent) {
            if (parent.name == 'zombie') return true
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
            bullet.position.add(this.raycasterDirection.multiplyScalar(0.1));

        });
    };
}
