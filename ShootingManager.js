import * as THREE from 'three';

export class ShootingManager {

    constructor(world3d, gun, camera, camAudioManager, availableTargets) {

        this.raycaster = new THREE.Raycaster();
        this.raycaster.layers.enableAll();
        this.raycaster.far = 1000
        this.raycasterOrigin = new THREE.Vector3();
        this.raycasterDirection = new THREE.Vector3();

        this.gun = gun;
        this.shooting = false

        this.bulletsPerMinute = 100
        this.cadence = this.#getCadence()
        this.world3d = world3d
        this.scene = world3d.scene;
        this.bullets = [];
        this.camera = camera
        this.availableTargets = availableTargets
        this.camAudioManager = camAudioManager

        this.rayHelper = null //new THREE.ArrowHelper(this.raycasterDirection, this.raycasterOrigin, 10, 0xff0000); // Red arrow
        
        
        //this.world3d.scene.add(this.rayHelper);

    }

    #addBullet() {

        let bullet = new THREE.Object3D();
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

        // bullet = laserBullet

        this.scene.add(bullet);
        this.camera.getWorldPosition(bullet.position);
        this.camera.getWorldQuaternion(bullet.quaternion);


        this.bullets.push(bullet);

        // if (this.bullets.length > 10) {
        //     const oldBullet = this.bullets.shift()
        //     oldBullet.removeFromParent()
        // }  

    }

    updateBullets = () => {

        [...this.bullets].forEach((bullet) => {

            // NOTE Raycast from each bullet and see if it hit any target compatible with the idea of being hit by a bullet
            bullet.getWorldPosition(this.raycasterOrigin);
            bullet.getWorldDirection(this.raycasterDirection);

            // Ensure the direction is unitary
            this.raycasterDirection.normalize();
            this.raycasterDirection.multiplyScalar(-1);

            if (this.rayHelper) {
                this.rayHelper.setDirection(this.raycasterDirection);
                this.rayHelper.setLength(10); // You can adjust the length dynamically if needed
                this.rayHelper.position.copy(this.raycasterOrigin);
            }


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

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    #getCadence() {
        return (1000 / (this.bulletsPerMinute / 60))
    }

    #playGunSound() {
        if (this.gun.sound.isPlaying) 
            this.gun.sound.stop()
        this.gun.sound.currentTime = 0;
        this.gun.sound.play()
    }

    shoot = () => {


        //if (!this.shooting) {

            this.shooting = true

            this.#addBullet()

            //this.#playGunSound()

            // this.sleep(this.cadence).then(() => {
            //     this.shooting = false
            // })
            
        //} 

    };

    // stop_shooting = () => {
    //     //this.gun.sound.stop()
    //     this.shooting = false
    // }

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

        // const boxHelper = new THREE.BoxHelper(target.object, 0xff0000); // Red wireframe box
        // this.world3d.scene.add(boxHelper);

        let parent = this.isElement(target)

        // this.world3d.addSphere(target.point, 1)

        if (parent) {

            if (parent.gameTag.includes('character')) {

                console.log(parent, this.world3d.characters)
                
                let character = this.world3d.characters.find(c => c.uid === parent.uid)
                character.hit()

            }

            // console.log('zombie', target, parent)
            // const sound = parent.userData.sounds['bullet_hit']
            // sound.play()
            const sound = this.camAudioManager.getSound('bullet_hit');
            
            if (sound.isPlaying) sound.stop()
   
            sound.play()

            //await this.#createSphere(target)

        } 

    };

    isElement(target) {
        let parent = target.object.parent
        while(parent) {
            if (parent.gameTag) return parent
            parent = parent.parent
        }

        return false
    }

}
