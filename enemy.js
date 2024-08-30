import * as THREE from 'three';
import { createHealthBar, generateUUID } from "./utils";

export class Enemy {

    constructor (world3d, sounds, name, gltf) {

        this.uid = generateUUID()
        this.health = 100
        this.sounds = sounds
        this.yellLow = 3
        this.yellHigh = 6
        this.object = gltf.scene
        this.world3d = world3d
        this.fadeOutDuration = 5000
        this.actions = {}
        this.currentAction = null
        this.object.gameTag = name

        this.scale = 7
        this.object.scale.set(this.scale, this.scale, this.scale)

        this.mixer = new THREE.AnimationMixer(this.object)

        if (gltf.animations && gltf.animations.length > 0) {

            gltf.animations.forEach(animationClip => {

              const action = this.mixer.clipAction(animationClip);
              
              this.actions[animationClip.name] = action
              

            });

          }

          const box = new THREE.Box3().setFromObject(this.object);
          const size = new THREE.Vector3();
          box.getSize(size); // Get the size (width, height, depth) of the bounding box
  
          this.size = size

        //   console.log(this.actions, this.size)

        //   this.walk()

    }

    updateAnimations(delta) {

        this.mixer.update(delta)

    }

    update(delta) {

        this.updateAnimations(delta)

    }

    getState() {

        if (this.currentAction) {
            return this.currentAction._clip.name.toLowerCase()
        }

        return false

    }

    handlePreviousAction(action) {

        // action.setLoop(THREE.LoopOnce);

        // // Optionally stop the action at the end (otherwise it might hold the last frame)
        // action.clampWhenFinished = true;

        if (this.currentAction) {
            this.currentAction.fadeOut(0.5)
        }

        action.reset()
        action.fadeIn(0.5)

        action.play()
        
        this.currentAction = action

    }

    attack() {
        let action = this.actions['Attack'];
        this.handlePreviousAction(action);
    }
    
    crawl() {
        let action = this.actions['Crawl'];
        this.handlePreviousAction(action);
    }
    
    dying() {
        let action = this.actions['Dying'];
        this.handlePreviousAction(action);
    }
    
    fastRun() {
        let action = this.actions['FastRun'];
        this.handlePreviousAction(action);
    }
    
    idle() {
        let action = this.actions['Idle'];
        this.handlePreviousAction(action);
    }
    
    walk() {
        let action = this.actions['Walk'];
        this.handlePreviousAction(action);
    }    

    fadeOut = () => {

        setTimeout(() => {
            this.object.visible = false
        }, this.fadeOutDuration)

        const material = this.object.material;
        material.transparent = true;
    
        const startTime = Date.now();
    
        while (material.opacity > 0) {

            const elapsedTime = Date.now() - startTime;
            const fadeAmount = 1 - (elapsedTime / duration);
    
            // Set the new opacity
            material.opacity = Math.max(0, fadeAmount);
    
        }

        this.world3d.scene.remove(this.object);
    
    }

    yell = () => {


        const randomDelay = Math.floor(Math.random() * (this.yellHigh - this.yellLow + 1) + this.yellLow) * 1000;
  
        const keys = Object.keys(this.sounds)

        this.sounds[keys[Math.floor(Math.random() * keys.length)]].play()
      
        setTimeout(this.yell, randomDelay);

    }

}