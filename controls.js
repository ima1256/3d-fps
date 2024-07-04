import * as THREE from 'three';
import { clamp } from 'three/src/math/MathUtils.js';

// FIRST PERSON CONTROLS START 

const KEYS = {
    W: 87, // 'W' key
    A: 65, // 'A' key
    S: 83, // 'S' key
    D: 68,  // 'D' key,
    Q: 81,
    E: 69
};

export class InputController {

    constructor(characterId) {
        this.characterId = characterId
        this.initialize_();
    }

    initialize_() {

        this.current_ = {
            leftButton: false,
            rightButton: false,
            mouseX: 0,
            mouseY: 0
        };
        this.previous_ = null;
        this.keys_ = {};
        this.previousKeys_ = {};

        // Load the sound
        this.clickSound = new Audio('./audio/bo2-dsr-sniper.mp3');

        document.addEventListener('mousedown', (e) => this.onMouseDown_(e), false);
        document.addEventListener('mouseup', (e) => this.onMouseUp_(e), false);
        document.addEventListener('mousemove', (e) => this.onMouseMove_(e), false);
        document.addEventListener('keydown', (e) => this.onKeyDown_(e), false);
        document.addEventListener('keyup', (e) => this.onKeyUp_(e), false);

    }

    addShootingManager(sm) {
        this.sm = sm
    }

    onMouseDown_(e) {
        switch (e.button) {
            case 0: {
                this.current_.leftButton = true;
                if (this.characterId === localStorage.getItem('characterId') ) 
                    this.sm.shoot()
                break;
            }
            case 2: {
                this.current_.rightButton = true;
                break;
            }
        }
    }


    onMouseUp_(e) {
        switch (e.button) {
            case 0: {
                this.current_.leftButton = false;
                this.sm.stop_shooting()
                break;
            }
            case 2: {
                this.current_.rightButton = false;
                break;
            }
        }
    }

    onMouseMove_(e) {

        if (this.previous_ === null) {
            this.previous_ = { ...this.current_ };
        }

        this.current_.mouseX = e.pageX - window.innerWidth / 2;
        this.current_.mouseY = e.pageY - window.innerHeight / 2;

        this.current_.mouseXDelta = this.current_.mouseX - this.previous_.mouseX;
        this.current_.mouseYDelta = this.current_.mouseY - this.previous_.mouseY;

    }

    onKeyDown_(e) {
        this.keys_[e.keyCode] = true;
    }

    onKeyUp_(e) {
        this.keys_[e.keyCode] = false;
    }

    // Play the click sound
    playClickSound() {
        this.clickSound.currentTime = 0;  // Rewind to the start
        //this.clickSound.play();
    }

    key(keyCode) {
        return this.keys_[keyCode]
    }

    update() {
        this.previous_ = { ...this.current_ }
    }

}

export class FirstPersonCamera {

    constructor(characterId, camera) {
        this.characterId = characterId
        this.camera_ = camera;
        this.input_ = new InputController(characterId);
        this.rotation_ = camera.quaternion;
        this.translation_ = camera.position;
        this.phi_ = 0;
        this.theta_ = 0;
        this.hsensitivity_ = 0.1
        this.vsensitivity_ = 0.3
        this.headBobActive_ = false;
        this.headBobTimer_ = 0;
    }

    update(timeElapsedS) {

        this.updateRotation_(timeElapsedS)
        this.updateTranslation_(timeElapsedS)
        // this.updateCamera_(timeElapsedS)
        // this.input_.update(timeElapsedS)
        //this.updateHeadBob_(timeElapsedS)
    }


    updateCamera_() {
        this.camera_.quaternion.copy(this.rotation_);
        this.camera_.position.copy(this.translation_)
        //this.camera_.position.y += Math.sin(this.headBobTimer_ * 10) * 0.5;
    }

    updateHeadBob_(timeElapsedS) {
        if (this.headBobActive_) {
            const wavelength = Math.PI;
            const nextStep = 1 + Math.floor(((this.headBobTimer_ + 0.000001) * 10) / wavelength);
            const nextStepTime = nextStep * wavelength / 10;
            this.headBobTimer_ = Math.min(this.headBobTimer_ + timeElapsedS, nextStepTime);

            if (this.headBobTimer_ === nextStepTime) {
                this.headBobActive_ = false;
            }
        }
    }

    updateRotation_(timeElapsedS) {

        let xh = this.input_.current_.mouseXDelta / window.innerWidth;
        let yh = this.input_.current_.mouseYDelta / window.innerHeight;

        if (Number.isNaN(xh) || Number.isNaN(yh)) return

        this.phi_ += -xh * this.hsensitivity_;
        this.theta_ = clamp(this.theta_ - yh * this.vsensitivity_, -Math.PI / 3, Math.PI / 3);

        const qx = new THREE.Quaternion();
        qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi_);

        const qz = new THREE.Quaternion();
        qz.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.theta_);

        const q = new THREE.Quaternion();
        q.multiply(qx);
        q.multiply(qz);

        this.rotation_.copy(q);
    }

    updateTranslation_(timeElapsedS) {

        const forwardVelocity = (this.input_.key(KEYS.W) ? 1 : 0) + (this.input_.key(KEYS.S) ? -1 : 0);
        const strafeVelocity = (this.input_.key(KEYS.A) ? 1 : 0) + (this.input_.key(KEYS.D) ? -1 : 0);
        const verticalVelocity = (this.input_.key(KEYS.Q) ? 1 : 0) + (this.input_.key(KEYS.E) ? -1 : 0); 

        const qx = new THREE.Quaternion();
        qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi_);

        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(qx);
        forward.multiplyScalar(forwardVelocity * timeElapsedS * 50);

        const left = new THREE.Vector3(-1, 0, 0);
        left.applyQuaternion(qx);
        left.multiplyScalar(strafeVelocity * timeElapsedS * 50);

        const up = new THREE.Vector3(0, -1, 0); // Correct upward direction
        up.applyQuaternion(qx)
        up.multiplyScalar(verticalVelocity * timeElapsedS * 50); // Scale by vertical velocity
        
        // Update the camera translation with forward and strafe velocities
        this.translation_.add(forward);
        this.translation_.add(left)
        this.translation_.add(up); // Add the upward/downward movement

        if (forwardVelocity != 0 || strafeVelocity != 0) {
            this.headBobActive_ = true
        }

    }


}

// FIRST PERSON CONTROLS FINISH