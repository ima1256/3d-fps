import * as THREE from 'three';
import { clamp } from 'three/src/math/MathUtils.js';
import { InputController, KEYS } from './input';

// FIRST PERSON CONTROLS START 

export class FirstPersonCamera {

    constructor(characterId, camera, character, world3d) {

        this.characterId = characterId
        this.camera_ = camera;
        this.world3d = world3d
        this.input_ = new InputController(characterId)

        this.rotation_ = new THREE.Quaternion(0, 0, 0, 0)
        this.translation_ = new THREE.Vector3(0, 0, 0)
        this.character = character

        // this.camera_.getWorldPosition(this.translation_);

        this.rotation_ = this.camera_.quaternion
        this.translation_ = this.character.position
        this.phi_ = 0;
        this.theta_ = 0;
        this.hsensitivity_ = 0.1
        this.vsensitivity_ = 0.3
        this.headBobActive_ = false;
        this.headBobTimer_ = 0;
        this.isOnGround = false
        
    }

    setBody(body) {
        this.body = body
    }

    update(timeElapsedS) {

        //console.log(this.character.position, this.camera_.position)

        // if (this.body) {
            this.updateRotation_(timeElapsedS)
            this.updateTranslation_(timeElapsedS)
            this.updateCamera_()

            // this.updateGroundContact()
            // if (this.isOnGround) {
            //     const smallImpulse = new Ammo.btVector3(0, 0.1, 0);
            //     this.body.applyImpulse(smallImpulse, new Ammo.btVector3(0, 0, 0));
            // }
            // this.updateCamera_(timeElapsedS)
            // this.input_.update(timeElapsedS)
            //this.updateHeadBob_(timeElapsedS)
        // }
    }


    updateCamera_() {
        //this.character.quaternion.copy(this.rotation_);
        // this.camera_.quaternion.copy(this.rotation_)
        // this.character.position.copy(this.translation_)
        // this.character.position.copy(this.translation_)
        //this.character.quaternion.copy(this.rotation_)

        // // Assume `quaternion` is the given quaternion you want to extract the Y-axis rotation from
        // const quaternion = this.rotation_; // Replace with your actual quaternion

        // // Convert the quaternion to Euler angles
        // const euler = new THREE.Euler().setFromQuaternion(quaternion, 'YXZ'); // 'YXZ' order to ensure Y-axis is considered first

        // // Extract the Y-axis rotation (in radians)
        // const yRotation = euler.y;

        // // Apply the Y-axis rotation to the object's quaternion
        // const yQuaternion = new THREE.Quaternion();
        // yQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yRotation);

        // // Apply the rotation to the object
        // this.character.children[0].quaternion.premultiply(yQuaternion);
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

    // bodiesAreEqual(body1, body2) {
    //     return body1.kB === body2.kB
    // }

    // // Function to check if the character's body is in contact with the ground
    // isCharacterOnGround() {
        
    //     const dispatcher = this.world3d.physicsWorld.getDispatcher();
    //     const numManifolds = dispatcher.getNumManifolds();

    //     //console.log(numManifolds)

    //     for (let i = 0; i < numManifolds; i++) {
    //         const contactManifold = dispatcher.getManifoldByIndexInternal(i);
    //         const body0 = contactManifold.getBody0();
    //         const body1 = contactManifold.getBody1();

    //         if ((this.bodiesAreEqual(body0, this.body) && this.bodiesAreEqual(body1, this.world3d.terrain.body)) 
    //             || (this.bodiesAreEqual(body1, this.body) && this.bodiesAreEqual(body0, this.world3d.terrain.body)) ) {

    //             const numContacts = contactManifold.getNumContacts();

    //             //console.log(numContacts)
                
    //             for (let j = 0; j < numContacts; j++) {
    //                 const pt = contactManifold.getContactPoint(j);

    //                 // console.log(pt.getDistance())

    //                 if (pt.getDistance() <= 0) {
    //                     // The character is in contact with the ground

    //                     return true;
    //                 }
    //             }
    //         }
    //     }

    //     return false;
    // }

    // updateGroundContact() {
    //     // Check ground contact when the character's Y velocity is close to zero
    //     const velocity = this.body.getLinearVelocity();
    //     if (Math.abs(velocity.y()) < 0.01) {
    //         this.isOnGround = this.isCharacterOnGround(this.body, this.world3d.physicsWorld);
    //     } else {
    //         this.isOnGround = false
    //     }
    // }

    // updateTranslation_2(timeElapsedS) {

    //     const velocityStrength = 1000; // Adjust this for faster or slower movement
    //     const velocity = new Ammo.btVector3(0, 0, 0); // Initialize the velocity vector

    //     const setVelocity = (direction) => {

    //         direction.y = 0; // Ensure y component is zero to keep movement in the xz plane
    //         direction.normalize();
      
    //         const currentVelocity = this.body.getLinearVelocity()
      
    //         velocity.setValue(direction.x * velocityStrength, direction.y * velocityStrength, direction.z * velocityStrength);
    //         this.body.setLinearVelocity(velocity); // Set the character's linear velocity
      
    //     }

    //     let moveForward = this.input_.key(KEYS.W);
    //     let moveBackward = this.input_.key(KEYS.S);
    //     let moveLeft = this.input_.key(KEYS.A);
    //     let moveRight = this.input_.key(KEYS.D);
    //     let moveUp = this.input_.key(KEYS.SPACE)

    //     if (moveForward) {
    //         const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.rotation_);
    //         setVelocity(forward);
    //     } else if (moveBackward) {
    //         const backward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.rotation_);
    //         setVelocity(backward);
    //     } else if (moveLeft) {
    //         const left = new THREE.Vector3(-1, 0, 0).applyQuaternion(this.rotation_);
    //         setVelocity(left);
    //     } else if (moveRight) {
    //         const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.rotation_);
    //         setVelocity(right);
    //     } else {
    //         const currentVelocity = this.body.getLinearVelocity()
    //         // If no movement keys are pressed, stop the character
    //         this.body.setLinearVelocity(new Ammo.btVector3(0, currentVelocity.y(), 0));
    //     }

    //     if (moveUp && this.isOnGround) {
    //         const jumpImpulse = new Ammo.btVector3(0, 1, 0); // Adjust the y-value for jump strength
    //         this.body.applyImpulse(jumpImpulse, new Ammo.btVector3(0, 0, 0));
    //     }

    // }

}

// FIRST PERSON CONTROLS FINISH