import * as THREE from 'three';

export class Physics {

    constructor(world3d) {

        this.physicsWorld = null
        this.world3d = world3d
        this.rigidBodies = []

    }

    initialize = async () => {

        await Ammo()
        this.tmpTrans = new Ammo.btTransform();  // Initialize tmpTrans after Ammo.js is loaded
        await this.initAmmo()
        await this.createPhysicsObjects()
        await this.createPhysicsForWorld3D()

    }

    initAmmo = () => {

        // Physics configuration
        const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
        const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
        const overlappingPairCache = new Ammo.btDbvtBroadphase();
        const solver = new Ammo.btSequentialImpulseConstraintSolver();
      
        // Create the physics world
        this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
        this.physicsWorld.setGravity(new Ammo.btVector3(0, -9.82, 0));
      
        return this.physicsWorld

      }

      createPhysicsObjects = async () => {

        const characters = this.world3d.characters

        for (let i = 0; i < characters.length; i++) {
      
            const body = characters[i].setPhysics();
            
            this.physicsWorld.addRigidBody(body);
      
            this.rigidBodies.push({ mesh: characters[i].character, body });
      
        }
      }

      createPhysicsForWorld3D = async () => {

        const body = this.world3d.setTerrainPhysics()
      
        // Example usage in your main application
        // addRedSphere(world3d.scene, world3d.physicsWorld);
      
        // Add the physics body to the world
        this.physicsWorld.addRigidBody(body);
      
      }

      update = (delta) => {

        this.physicsWorld.stepSimulation(delta, 10)

        for (let i = 0; i < this.rigidBodies.length; i++) {

            const obj = this.rigidBodies[i];
            const motionState = obj.body.getMotionState();

            if (motionState) {

                motionState.getWorldTransform(this.tmpTrans);
                const pos = this.tmpTrans.getOrigin();
                const quat = this.tmpTrans.getRotation();
      
                obj.mesh.position.set(pos.x(), pos.y(), pos.z());
                obj.mesh.quaternion.set(quat.x(), quat.y(), quat.z(), quat.w());
            }
        }

      }

}