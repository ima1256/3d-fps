import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { getSceneFloor, getWorldSphere, checkCollision, getSpotlight } from './functions';
import Stats from "three/examples/jsm/libs/stats.module.js";
import { FlyControls } from 'three/addons/controls/FlyControls.js';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';
import { clamp } from 'three/src/math/MathUtils.js';


function getAudio(camera, object3d=null) {

}

