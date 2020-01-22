import React, {Component} from 'react';
import bg2 from './img/bg2.png';
import bg from './img/bg.png';
import skin from './img/skin.png';
import './App.css';
import * as THREE from "three";
import Pallet from './components/Pallet.js';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faPen, faEraser, faSync, faLayerGroup, faEyeDropper} from '@fortawesome/free-solid-svg-icons'

export default class App extends Component {

    scene = null;
    pixels = [];
    canvas = null;
    ctx = null;
    clickDelay = 0;
    mouse = null;
    drawing = false;
    dragging = false;

    colors = ['#f44336', '#2196F3',
        '#4CAF50', '#FFEB3B', "#FF9800", "#9C27B0"];

    state = {
        mode: 0, // 0 - pencil, 1 - eraser, 2 - rotate
        colorSlot: 0,
        ctx: null,
        outer: true,
        part: -1, // 0 - head, 1 - chest, 2 - left arm, 3 - right arm, 4 - left leg, 5 - right leg,
        pallet: false
    };

    touchDevice = (navigator.maxTouchPoints || 'ontouchstart' in document.documentElement);
    mouseDown = false;

    componentDidMount() {
        this.scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 32;

        var renderer = new THREE.WebGLRenderer();

        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        var OrbitControls = require('three-orbit-controls')(THREE);
        var controls = new OrbitControls(camera, renderer.domElement);
        controls.enablePan = false;
        controls.enableZoom = true;

        let tex;
        if (this.touchDevice) {
            tex = new THREE.TextureLoader().load(bg2);
        } else {
            tex = new THREE.TextureLoader().load(bg);
        }
        this.scene.background = tex;

        var raycaster = new THREE.Raycaster(); // create once
        this.mouse = new THREE.Vector2(); // create once
        this.mouse.x = -100;

        var light = new THREE.AmbientLight(0x00ff00); // soft white light
        this.scene.add(light);

        // All the geometry in one render  object
        let geometry = new THREE.Geometry();

        let init = () => {
            for (let i = 0; i < 64; i++) {
                this.pixels[i] = [0];
                for (let j = 0; j < 64; j++) {
                    this.pixels[i][j] = 0;
                }
            }

            // So No Head?
            for (let i = 0; i < 8; i++) {
                for (let j = 0; j < 8; j++) {
                    for (let k = 0; k < 8; k++) {
                        if ((i === 0 || i === 7) || (j === 0 || j === 7) || (k === 0 || k === 7)) {
                            let geo = new THREE.CubeGeometry(1, 1, 1);
                            let cube = new THREE.Mesh(geo, [new THREE.MeshBasicMaterial({
                                color: 0xffffff,
                                vertexColors: THREE.FaceColors
                            }), new THREE.MeshBasicMaterial({
                                color: 0xffffff,
                                vertexColors: THREE.FaceColors,
                                transparent: true,
                                opacity: 0
                            })]);
                            if (this.state.part === 0) {
                                cube.position.set(i - 4, j - 4, k - 4);
                            } else if (this.state.part === -1) {
                                cube.position.set(i - 4, j - 4 + 16, k - 4);
                            }
                            geometry.merge(geo);

                            let geo2 = new THREE.CubeGeometry(1.1, 1.1, 1.1);
                            let cube2 = new THREE.Mesh(geo2, [new THREE.MeshBasicMaterial({
                                color: 0xffffff,
                                vertexColors: THREE.FaceColors,
                                transparent: false
                            }), new THREE.MeshBasicMaterial({
                                color: 0xffffff,
                                vertexColors: THREE.BackSide,
                                transparent: true,
                                opacity: 0.1
                            }), new THREE.MeshBasicMaterial({
                                color: 0xffffff,
                                vertexColors: THREE.FaceColors,
                                transparent: true,
                                opacity: 0
                            })]);
                            geometry.merge(geo2);

                            if (this.state.part === 0) {
                                cube2.position.set(i - 4, j - 4, k - 4);
                            } else if (this.state.part === -1) {
                                cube2.position.set(i - 4, j - 4 + 16, k - 4);
                            }

                            for (let i = 0; i < cube.geometry.faces.length; i++) {
                                cube.geometry.faces[i].materialIndex = 1;
                                cube2.geometry.faces[i].materialIndex = 2;
                            }

                            if (k === 7) { // Creating face pixels
                                this.pixels[i + 8][7 + (8 - j)] = {
                                    cube: cube,
                                    side: 8,
                                    hasColor: true,
                                    external: false,
                                    part: 0
                                };
                                this.pixels[i + 8 + 32][7 + (8 - j)] = {
                                    cube: cube2,
                                    side: 8,
                                    hasColor: false,
                                    external: true,
                                    part: 0
                                };
                            }
                            if (k === 0) { // Creating back of head pixels
                                this.pixels[7 + (24 - i)][7 + (8 - j)] = {
                                    cube: cube,
                                    side: 10,
                                    hasColor: true,
                                    external: false,
                                    part: 0
                                };
                                this.pixels[7 + (24 - i) + 32][7 + (8 - j)] = {
                                    cube: cube2,
                                    side: 10,
                                    hasColor: false,
                                    external: true,
                                    part: 0
                                };
                            }
                            if (i === 0) { // Creating left head pixels
                                this.pixels[k][7 + (8 - j)] = {cube: cube, side: 2, hasColor: true, external: false, part: 0};
                                this.pixels[k + 32][7 + (8 - j)] = {
                                    cube: cube2,
                                    side: 2,
                                    hasColor: false,
                                    external: true,
                                    part: 0
                                };
                            }
                            if (i === 7) { // Creating right head pixels
                                this.pixels[7 + (16 - k)][7 + (8 - j)] = {
                                    cube: cube,
                                    side: 0,
                                    hasColor: true,
                                    external: false,
                                    part: 0
                                };
                                this.pixels[7 + (16 - k) + 32][7 + (8 - j)] = {
                                    cube: cube2,
                                    side: 0,
                                    hasColor: false,
                                    external: true,
                                    part: 0
                                };
                            }
                            if (j === 0) { // Creating bottom head pixels
                                this.pixels[16 + i][7 - k] = {cube: cube, side: 6, hasColor: true, external: false, part: 0};
                                this.pixels[16 + i + 32][7 - k] = {
                                    cube: cube2,
                                    side: 6,
                                    hasColor: false,
                                    external: true,
                                    part: 0
                                };
                            }
                            if (j === 7) { // Creating top head pixels
                                this.pixels[i + 8][k] = {cube: cube, side: 4, hasColor: true, external: false,
                                    part: 0};
                                this.pixels[i + 8 + 32][k] = {cube: cube2, side: 4, hasColor: false, external: true,
                                    part: 0};
                            }

                            this.scene.add(cube);
                            this.scene.add(cube2);

                            cube.geometry.colorsNeedUpdate = true;
                            cube.geometry.groupsNeedUpdate = true;

                            cube2.geometry.colorsNeedUpdate = true;
                            cube2.geometry.groupsNeedUpdate = true;
                        }
                    }
                }
            }

            // Chest machine
            for (let i = 0; i < 8; i++) {
                for (let j = 0; j < 12; j++) {
                    for (let k = 0; k < 4; k++) {
                        if ((i === 0 || i === 7) || (j === 0 || j === 11) || (k === 0 || k === 3)) {
                            let geo = new THREE.CubeGeometry(1, 1, 1);
                            let cube = new THREE.Mesh(geo, [new THREE.MeshBasicMaterial({
                                color: 0xffffff,
                                vertexColors: THREE.FaceColors
                            }), new THREE.MeshBasicMaterial({
                                color: 0xffffff,
                                vertexColors: THREE.FaceColors,
                                transparent: true,
                                opacity: 0
                            })]);
                            if (this.state.part === 1) {
                                cube.position.set(i - 4, j - 4, k - 4 + 2);
                            } else if (this.state.part === -1) {
                                cube.position.set(i - 4, j, k - 4 + 2);
                            }
                            geometry.merge(geo);

                            let geo2 = new THREE.CubeGeometry(1.1, 1.1, 1.1);
                            let cube2 = new THREE.Mesh(geo2, [new THREE.MeshBasicMaterial({
                                color: 0xffffff,
                                vertexColors: THREE.FaceColors,
                                transparent: false
                            }), new THREE.MeshBasicMaterial({
                                color: 0xffffff,
                                vertexColors: THREE.FaceColors,
                                transparent: true,
                                opacity: 0.1
                            }), new THREE.MeshBasicMaterial({
                                color: 0xffffff,
                                vertexColors: THREE.FaceColors,
                                transparent: true,
                                opacity: 0
                            })]);
                            if (this.state.part === 1) {
                                cube2.position.set(i - 4, j - 4, k - 4 + 2);
                            } else if (this.state.part === -1) {
                                cube2.position.set(i - 4, j - 4 + 4, k - 4 + 2);
                            }
                            geometry.merge(geo2);

                            for (let i = 0; i < cube.geometry.faces.length; i++) {
                                cube.geometry.faces[i].materialIndex = 1;
                                cube2.geometry.faces[i].materialIndex = 2;
                            }

                            if (k === 3) { // front
                                this.pixels[i + 20][11 + (20 - j)] = {
                                    cube: cube,
                                    side: 8,
                                    hasColor: true,
                                    external: false
                                };
                                this.pixels[i + 20][11 + (36 - j)] = {
                                    cube: cube2,
                                    side: 8,
                                    hasColor: false,
                                    external: true
                                };
                            }
                            if (k === 0) { // back
                                this.pixels[i + 32][11 + (20 - j)] = {
                                    cube: cube,
                                    side: 10,
                                    hasColor: true,
                                    external: false
                                };
                                this.pixels[i + 32][11 + (36 - j)] = {
                                    cube: cube2,
                                    side: 10,
                                    hasColor: false,
                                    external: true
                                };
                            }
                            if (i === 0) { // left
                                this.pixels[k + 28][11 + (20 - j)] = {
                                    cube: cube,
                                    side: 2,
                                    hasColor: true,
                                    external: false
                                };
                                this.pixels[k + 28][11 + (36 - j)] = {
                                    cube: cube2,
                                    side: 2,
                                    hasColor: false,
                                    external: true
                                };
                            }

                            if (i === 7) { // right
                                this.pixels[3 + (16 - k)][11 + (20 - j)] = {
                                    cube: cube,
                                    side: 0,
                                    hasColor: true,
                                    external: false
                                };
                                this.pixels[3 + (16 - k)][11 + (36 - j)] = {
                                    cube: cube2,
                                    side: 0,
                                    hasColor: false,
                                    external: true
                                };
                            }

                            if (j === 0) { // bottom body
                                this.pixels[28 + i][16 + k] = {cube: cube, side: 6, hasColor: true, external: false};
                                this.pixels[28 + i][32 + k] = {cube: cube2, side: 6, hasColor: false, external: true};
                            }

                            if (j === 11) { // top body
                                this.pixels[i + 20][k + 16] = {cube: cube, side: 4, hasColor: true, external: false};
                                this.pixels[i + 20][k + 32] = {cube: cube2, side: 4, hasColor: false, external: true};
                            }

                            this.scene.add(cube);
                            this.scene.add(cube2);

                            cube.geometry.colorsNeedUpdate = true;
                            cube.geometry.groupsNeedUpdate = true;

                            cube2.geometry.colorsNeedUpdate = true;
                            cube2.geometry.groupsNeedUpdate = true;
                        }
                    }
                }
            }

            // Left arm baby
            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 12; j++) {
                    for (let k = 0; k < 4; k++) {
                        if ((i === 0 || i === 3) || (j === 0 || j === 11) || (k === 0 || k === 3)) {
                            let geo = new THREE.CubeGeometry(1, 1, 1);
                            let cube = new THREE.Mesh(geo, [new THREE.MeshBasicMaterial({
                                color: 0xffffff,
                                vertexColors: THREE.FaceColors
                            }), new THREE.MeshBasicMaterial({
                                color: 0xffffff,
                                vertexColors: THREE.FaceColors,
                                transparent: true,
                                opacity: 0
                            })]);
                            if (this.state.part === 2) {
                                cube.position.set(i - 2, j - 6, k - 2);
                            } else if (this.state.part === -1) {
                                cube.position.set(i - 8, j, k - 2);
                            }
                            geometry.merge(geo);

                            let geo2 = new THREE.CubeGeometry(1.1, 1.1, 1.1);
                            let cube2 = new THREE.Mesh(geo2, [new THREE.MeshBasicMaterial({
                                color: 0xffffff,
                                vertexColors: THREE.FaceColors,
                                transparent: false
                            }), new THREE.MeshBasicMaterial({
                                color: 0xffffff,
                                vertexColors: THREE.FaceColors,
                                transparent: true,
                                opacity: 0.1
                            }), new THREE.MeshBasicMaterial({
                                color: 0xffffff,
                                vertexColors: THREE.FaceColors,
                                transparent: true,
                                opacity: 0
                            })]);
                            if (this.state.part === 2) {
                                cube2.position.set(i - 2, j - 6, k - 2);
                            } else if (this.state.part === -1) {
                                cube2.position.set(i - 8, j, k - 2);
                            }
                            geometry.merge(geo2);

                            for (let i = 0; i < cube.geometry.faces.length; i++) {
                                cube.geometry.faces[i].materialIndex = 1;
                                cube2.geometry.faces[i].materialIndex = 2;
                            }

                            if (k === 3) { // front
                                this.pixels[i + 36][11 + (52 - j)] = {
                                    cube: cube,
                                    side: 8,
                                    hasColor: true,
                                    external: false
                                };
                                this.pixels[i + 52][11 + (52 - j)] = {
                                    cube: cube2,
                                    side: 8,
                                    hasColor: false,
                                    external: true
                                };
                            }
                            if (k === 0) { // back
                                this.pixels[i + 44][11 + (52 - j)] = {
                                    cube: cube,
                                    side: 10,
                                    hasColor: true,
                                    external: false
                                };
                                this.pixels[i + 60][11 + (52 - j)] = {
                                    cube: cube2,
                                    side: 10,
                                    hasColor: false,
                                    external: true
                                };
                            }
                            if (i === 0) { // left
                                this.pixels[k + 40][11 + (52 - j)] = {
                                    cube: cube,
                                    side: 2,
                                    hasColor: true,
                                    external: false
                                };
                                this.pixels[k + 56][11 + (52 - j)] = {
                                    cube: cube2,
                                    side: 2,
                                    hasColor: false,
                                    external: true
                                };
                            }

                            if (i === 3) { // right
                                this.pixels[3 + (32 - k)][11 + (52 - j)] = {
                                    cube: cube,
                                    side: 0,
                                    hasColor: true,
                                    external: false
                                };
                                this.pixels[3 + (48 - k)][11 + (52 - j)] = {
                                    cube: cube2,
                                    side: 0,
                                    hasColor: false,
                                    external: true
                                };
                            }

                            if (j === 0) { // bottom
                                this.pixels[40 + i][48 + k] = {cube: cube, side: 6, hasColor: true, external: false};
                                this.pixels[56 + i][48 + k] = {cube: cube2, side: 6, hasColor: false, external: true};
                            }

                            if (j === 11) { // top
                                this.pixels[i + 36][k + 48] = {cube: cube, side: 4, hasColor: true, external: false};
                                this.pixels[i + 52][k + 48] = {cube: cube2, side: 4, hasColor: false, external: true};
                            }

                            this.scene.add(cube);
                            this.scene.add(cube2);

                            cube.geometry.colorsNeedUpdate = true;
                            cube.geometry.groupsNeedUpdate = true;

                            cube2.geometry.colorsNeedUpdate = true;
                            cube2.geometry.groupsNeedUpdate = true;
                        }
                    }
                }
            }

            // Beat off arm
            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 12; j++) {
                    for (let k = 0; k < 4; k++) {
                        if ((i === 0 || i === 3) || (j === 0 || j === 11) || (k === 0 || k === 3)) {
                            let geo = new THREE.CubeGeometry(1, 1, 1);
                            let cube = new THREE.Mesh(geo, [new THREE.MeshBasicMaterial({
                                color: 0xffffff,
                                vertexColors: THREE.FaceColors
                            }), new THREE.MeshBasicMaterial({
                                color: 0xffffff,
                                vertexColors: THREE.FaceColors,
                                transparent: true,
                                opacity: 0
                            })]);
                            if (this.state.part === 3) {
                                cube.position.set(i - 2, j - 6, k - 2);
                            } else if (this.state.part === -1) {
                                cube.position.set(i + 4, j, k - 2);
                            }
                            geometry.merge(geo);

                            let geo2 = new THREE.CubeGeometry(1.1, 1.1, 1.1);
                            let cube2 = new THREE.Mesh(geo2, [new THREE.MeshBasicMaterial({
                                color: 0xffffff,
                                vertexColors: THREE.FaceColors,
                                transparent: false
                            }), new THREE.MeshBasicMaterial({
                                color: 0xffffff,
                                vertexColors: THREE.FaceColors,
                                transparent: true,
                                opacity: 0.1
                            }), new THREE.MeshBasicMaterial({
                                color: 0xffffff,
                                vertexColors: THREE.FaceColors,
                                transparent: true,
                                opacity: 0
                            })]);
                            if (this.state.part === 3) {
                                cube2.position.set(i - 2, j - 6, k - 2);
                            } else if (this.state.part === -1) {
                                cube2.position.set(i + 4, j, k - 2);
                            }
                            geometry.merge(geo2);

                            for (let i = 0; i < cube.geometry.faces.length; i++) {
                                cube.geometry.faces[i].materialIndex = 1;
                                cube2.geometry.faces[i].materialIndex = 2;
                            }

                            if (k === 3) { // front
                                this.pixels[i + 44][11 + (20 - j)] = {
                                    cube: cube,
                                    side: 8,
                                    hasColor: true,
                                    external: false
                                };
                                this.pixels[i + 44][11 + (36 - j)] = {
                                    cube: cube2,
                                    side: 8,
                                    hasColor: false,
                                    external: true
                                };
                            }
                            if (k === 0) { // back
                                this.pixels[i + 52][11 + (20 - j)] = {
                                    cube: cube,
                                    side: 10,
                                    hasColor: true,
                                    external: false
                                };
                                this.pixels[i + 52][11 + (36 - j)] = {
                                    cube: cube2,
                                    side: 10,
                                    hasColor: false,
                                    external: true
                                };
                            }
                            if (i === 0) { // left
                                this.pixels[k + 48][11 + (20 - j)] = {
                                    cube: cube,
                                    side: 2,
                                    hasColor: true,
                                    external: false
                                };
                                this.pixels[k + 48][11 + (36 - j)] = {
                                    cube: cube2,
                                    side: 2,
                                    hasColor: false,
                                    external: true
                                };
                            }

                            if (i === 3) { // right
                                this.pixels[3 + (40 - k)][11 + (20 - j)] = {
                                    cube: cube,
                                    side: 0,
                                    hasColor: true,
                                    external: false
                                };
                                this.pixels[3 + (40 - k)][11 + (36 - j)] = {
                                    cube: cube2,
                                    side: 0,
                                    hasColor: false,
                                    external: true
                                };
                            }

                            if (j === 0) { // bottom body
                                this.pixels[48 + i][16 + k] = {cube: cube, side: 6, hasColor: true, external: false};
                                this.pixels[48 + i][32 + k] = {cube: cube2, side: 6, hasColor: false, external: true};
                            }

                            if (j === 11) { // top body
                                this.pixels[i + 44][k + 16] = {cube: cube, side: 4, hasColor: true, external: false};
                                this.pixels[i + 44][k + 32] = {cube: cube2, side: 4, hasColor: false, external: true};
                            }

                            this.scene.add(cube);
                            this.scene.add(cube2);

                            cube.geometry.colorsNeedUpdate = true;
                            cube.geometry.groupsNeedUpdate = true;

                            cube2.geometry.colorsNeedUpdate = true;
                            cube2.geometry.groupsNeedUpdate = true;
                        }
                    }
                }
            }

            // Left leg
            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 12; j++) {
                    for (let k = 0; k < 4; k++) {
                        if ((i === 0 || i === 3) || (j === 0 || j === 11) || (k === 0 || k === 3)) {
                            let geo = new THREE.CubeGeometry(1, 1, 1);
                            let cube = new THREE.Mesh(geo, [new THREE.MeshBasicMaterial({
                                color: 0xffffff,
                                vertexColors: THREE.FaceColors
                            }), new THREE.MeshBasicMaterial({
                                color: 0xffffff,
                                vertexColors: THREE.FaceColors,
                                transparent: true,
                                opacity: 0
                            })]);
                            if (this.state.part === 4) {
                                cube.position.set(i - 2, j - 6, k - 2);
                            } else if (this.state.part === -1) {
                                cube.position.set(i - 4, j - 12, k - 2);
                            }
                            geometry.merge(geo);

                            let geo2 = new THREE.CubeGeometry(1.1, 1.1, 1.1);
                            let cube2 = new THREE.Mesh(geo2, [new THREE.MeshBasicMaterial({
                                color: 0xffffff,
                                vertexColors: THREE.FaceColors,
                                transparent: false
                            }), new THREE.MeshBasicMaterial({
                                color: 0xffffff,
                                vertexColors: THREE.FaceColors,
                                transparent: true,
                                opacity: 0.1
                            }), new THREE.MeshBasicMaterial({
                                color: 0xffffff,
                                vertexColors: THREE.FaceColors,
                                transparent: true,
                                opacity: 0
                            })]);
                            if (this.state.part === 4) {
                                cube2.position.set(i - 2, j - 6, k - 2);
                            } else if (this.state.part === -1) {
                                cube2.position.set(i - 4, j - 12, k - 2);
                            }
                            geometry.merge(geo2);

                            for (let i = 0; i < cube.geometry.faces.length; i++) {
                                cube.geometry.faces[i].materialIndex = 1;
                                cube2.geometry.faces[i].materialIndex = 2;
                            }

                            if (k === 3) { // front
                                this.pixels[i + 20][11 + (52 - j)] = {
                                    cube: cube,
                                    side: 8,
                                    hasColor: true,
                                    external: false
                                };
                                this.pixels[i + 4][11 + (52 - j)] = {
                                    cube: cube2,
                                    side: 8,
                                    hasColor: false,
                                    external: true
                                };
                            }
                            if (k === 0) { // back
                                this.pixels[i + 28][11 + (52 - j)] = {
                                    cube: cube,
                                    side: 10,
                                    hasColor: true,
                                    external: false
                                };
                                this.pixels[i + 12][11 + (52 - j)] = {
                                    cube: cube2,
                                    side: 10,
                                    hasColor: false,
                                    external: true
                                };
                            }
                            if (i === 0) { // left
                                this.pixels[k + 24][11 + (52 - j)] = {
                                    cube: cube,
                                    side: 2,
                                    hasColor: true,
                                    external: false
                                };
                                this.pixels[k + 8][11 + (52 - j)] = {
                                    cube: cube2,
                                    side: 2,
                                    hasColor: false,
                                    external: true
                                };
                            }

                            if (i === 3) { // right
                                this.pixels[3 + (16 - k)][11 + (52 - j)] = {
                                    cube: cube,
                                    side: 0,
                                    hasColor: true,
                                    external: false
                                };
                                this.pixels[3 + (-k)][11 + (52 - j)] = {
                                    cube: cube2,
                                    side: 0,
                                    hasColor: false,
                                    external: true
                                };
                            }

                            if (j === 0) { // bottom body
                                this.pixels[24 + i][48 + k] = {cube: cube, side: 6, hasColor: true, external: false};
                                this.pixels[8 + i][48 + k] = {cube: cube2, side: 6, hasColor: false, external: true};
                            }

                            if (j === 11) { // top body
                                this.pixels[i + 20][k + 48] = {cube: cube, side: 4, hasColor: true, external: false};
                                this.pixels[i + 4][k + 48] = {cube: cube2, side: 4, hasColor: false, external: true};
                            }

                            this.scene.add(cube);
                            this.scene.add(cube2);

                            cube.geometry.colorsNeedUpdate = true;
                            cube.geometry.groupsNeedUpdate = true;

                            cube2.geometry.colorsNeedUpdate = true;
                            cube2.geometry.groupsNeedUpdate = true;
                        }
                    }
                }
            }

            // Right leg
            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 12; j++) {
                    for (let k = 0; k < 4; k++) {
                        if ((i === 0 || i === 3) || (j === 0 || j === 11) || (k === 0 || k === 3)) {
                            let geo = new THREE.CubeGeometry(1, 1, 1);
                            let cube = new THREE.Mesh(geo, [new THREE.MeshBasicMaterial({
                                color: 0xffffff,
                                vertexColors: THREE.FaceColors
                            }), new THREE.MeshBasicMaterial({
                                color: 0xffffff,
                                vertexColors: THREE.FaceColors,
                                transparent: true,
                                opacity: 0
                            })]);
                            if (this.state.part === 5){
                                cube.position.set(i - 2 , j - 6, k - 2);
                            } else if (this.state.part === -1) {
                                cube.position.set(i, j - 12, k - 2);
                            }
                            geometry.merge(geo);
                            let geo2 = new THREE.CubeGeometry(1.1, 1.1, 1.1);
                            let cube2 = new THREE.Mesh(geo2, [new THREE.MeshBasicMaterial({
                                color: 0xffffff,
                                vertexColors: THREE.FaceColors,
                                transparent: false
                            }), new THREE.MeshBasicMaterial({
                                color: 0xffffff,
                                vertexColors: THREE.FaceColors,
                                transparent: true,
                                opacity: 0.1
                            }), new THREE.MeshBasicMaterial({
                                color: 0xffffff,
                                vertexColors: THREE.FaceColors,
                                transparent: true,
                                opacity: 0
                            })]);
                            if (this.state.part === 5){
                                cube2.position.set(i - 2 , j - 6, k - 2);
                            } else if (this.state.part === -1) {
                                cube2.position.set(i, j - 12, k - 2);
                            }
                            geometry.merge(geo2);

                            for (let i = 0; i < cube.geometry.faces.length; i++) {
                                cube.geometry.faces[i].materialIndex = 1;
                                cube2.geometry.faces[i].materialIndex = 2;
                            }

                            if (k === 3) { // front
                                this.pixels[i + 4][11 + (20 - j)] = {
                                    cube: cube,
                                    side: 8,
                                    hasColor: true,
                                    external: false
                                };
                                this.pixels[i + 4][11 + (36 - j)] = {
                                    cube: cube2,
                                    side: 8,
                                    hasColor: false,
                                    external: true
                                };
                            }
                            if (k === 0) { // back
                                this.pixels[i + 12][11 + (20 - j)] = {
                                    cube: cube,
                                    side: 10,
                                    hasColor: true,
                                    external: false
                                };
                                this.pixels[i + 12][11 + (36 - j)] = {
                                    cube: cube2,
                                    side: 10,
                                    hasColor: false,
                                    external: true
                                };
                            }
                            if (i === 0) { // left
                                this.pixels[k + 8][11 + (20 - j)] = {
                                    cube: cube,
                                    side: 2,
                                    hasColor: true,
                                    external: false
                                };
                                this.pixels[k + 8][11 + (36 - j)] = {
                                    cube: cube2,
                                    side: 2,
                                    hasColor: false,
                                    external: true
                                };
                            }

                            if (i === 3) { // right
                                this.pixels[3 + (-k)][11 + (20 - j)] = {
                                    cube: cube,
                                    side: 0,
                                    hasColor: true,
                                    external: false
                                };
                                this.pixels[3 + (-k)][11 + (36 - j)] = {
                                    cube: cube2,
                                    side: 0,
                                    hasColor: false,
                                    external: true
                                };
                            }

                            if (j === 0) { // bottom
                                this.pixels[8 + i][16 + k] = {cube: cube, side: 6, hasColor: true, external: false};
                                this.pixels[8 + i][32 + k] = {cube: cube2, side: 6, hasColor: false, external: true};
                            }

                            if (j === 11) { // top
                                this.pixels[i + 4][k + 16] = {cube: cube, side: 4, hasColor: true, external: false};
                                this.pixels[i + 4][k + 32] = {cube: cube2, side: 4, hasColor: false, external: true};
                            }

                            this.scene.add(cube);
                            this.scene.add(cube2);

                            cube.geometry.colorsNeedUpdate = true;
                            cube.geometry.groupsNeedUpdate = true;

                            cube2.geometry.colorsNeedUpdate = true;
                            cube2.geometry.groupsNeedUpdate = true;
                        }
                    }
                }
            }
            start();
        };

        let start = () => {
            let {pixels} = this;

            for (let i = 0; i < pixels.length; i++) {
                for (let j = 0; j < pixels[i].length; j++) {
                    if (pixels[i][j] !== 0) {
                        if (!pixels[i][j].external) { // Inner
                                pixels[i][j].cube.geometry.faces[pixels[i][j].side].materialIndex = 0;
                                pixels[i][j].cube.geometry.faces[pixels[i][j].side + 1].materialIndex = 0;
                        } else { // Outer
                                pixels[i][j].cube.geometry.faces[pixels[i][j].side].materialIndex = 1;
                                pixels[i][j].cube.geometry.faces[pixels[i][j].side + 1].materialIndex = 1;
                        }
                        pixels[i][j].cube.geometry.colorsNeedUpdate = true;
                        pixels[i][j].cube.geometry.groupsNeedUpdate = true;
                    }
                }
            }

            document.addEventListener('mousemove', (e) => {
                this.mouse.x = (e.clientX / renderer.domElement.clientWidth) * 2 - 1;
                this.mouse.y = -(e.clientY / renderer.domElement.clientHeight) * 2 + 1;
            });
            document.addEventListener("touchmove", (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.mouse.x = (e.touches[0].clientX / renderer.domElement.clientWidth) * 2 - 1;
                this.mouse.y = -(e.touches[0].clientY / renderer.domElement.clientHeight) * 2 + 1;

            }, {passive: false});

            if (!this.touchDevice) {
                document.addEventListener('mousedown', (e) => {
                    this.mouseDown = true;
                });
                document.addEventListener('mouseup', (e) => {
                    this.mouseDown = false;
                    this.drawing = false;
                    this.dragging = false;
                });
            }

            animate();
        };

        let animate = () => {
            requestAnimationFrame(animate);
            camera.lookAt(0, 0);

            controls.update();
            renderer.render(this.scene, camera);

            update();
        };

        let update = () => {
            let {colorSlot, mode, outer} = this.state;
            raycaster.setFromCamera(this.mouse, camera);
            let intersects = raycaster.intersectObjects(this.scene.children);

            switch (mode) {
                case 0: // Pencil
                    if (!this.touchDevice && !this.mouseDown) {
                        break;
                    }

                    if (!this.touchDevice && this.dragging && !this.drawing) {
                        controls.enabled = true;
                    }

                    if (intersects.length > 0 && !this.dragging) {
                        controls.enabled = false;
                        if (!this.touchDevice) {
                            this.dragging = false;
                            this.drawing = true;
                        }
                        let faceIndex = intersects[0].faceIndex;
                        intersects[0].object.geometry.faces[faceIndex].color.set(new THREE.Color(this.colors[colorSlot]));
                        intersects[0].object.geometry.faces[faceIndex].materialIndex = 0;
                        if (faceIndex === 0 || (faceIndex % 2) === 0) {
                            intersects[0].object.geometry.faces[faceIndex + 1].color.set(new THREE.Color(this.colors[colorSlot]));
                            intersects[0].object.geometry.faces[faceIndex + 1].materialIndex = 0;
                        } else {
                            intersects[0].object.geometry.faces[faceIndex - 1].color.set(new THREE.Color(this.colors[colorSlot]));
                            intersects[0].object.geometry.faces[faceIndex - 1].materialIndex = 0;
                        }
                        intersects[0].object.geometry.colorsNeedUpdate = true;
                        intersects[0].object.geometry.groupsNeedUpdate = true;
                        this.setColored(intersects[0].object, faceIndex, true);
                        this.updateSkinPreview();
                    } else {
                        if (!this.touchDevice && !this.drawing) {
                            this.dragging = true;
                        }
                    }
                    break;
                case 1: // Eraser
                    if (!this.touchDevice && !this.mouseDown) {
                        break;
                    }

                    if (!this.touchDevice && this.dragging && !this.drawing) {
                        controls.enabled = true;
                    }

                    if (outer) {
                        if (intersects.length > 0 && !this.dragging) {
                            controls.enabled = false;
                            if (!this.touchDevice) {
                                this.dragging = false;
                                this.drawing = true;
                            }
                            let faceIndex = intersects[0].faceIndex;
                            intersects[0].object.geometry.faces[faceIndex].color.set(new THREE.Color("white"));
                            intersects[0].object.geometry.faces[faceIndex].materialIndex = 1;
                            if (faceIndex === 0 || (faceIndex % 2) === 0) {
                                intersects[0].object.geometry.faces[faceIndex + 1].color.set(new THREE.Color("white"));
                                intersects[0].object.geometry.faces[faceIndex + 1].materialIndex = 1;
                            } else {
                                intersects[0].object.geometry.faces[faceIndex - 1].color.set(new THREE.Color("white"));
                                intersects[0].object.geometry.faces[faceIndex - 1].materialIndex = 1;
                            }
                            intersects[0].object.geometry.colorsNeedUpdate = true;
                            intersects[0].object.geometry.groupsNeedUpdate = true;
                            this.setColored(intersects[0].object, faceIndex, false);
                            this.updateSkinPreview();
                        } else {
                            if (!this.touchDevice && !this.drawing) {
                                this.dragging = true;
                            }
                        }
                    }
                    break;
                case 2: // Rotate
                    controls.enabled = true;
                    break;
                case 3: // Eye Dropper
                    if (!this.touchDevice && !this.mouseDown) {
                        break;
                    }

                    if (!this.touchDevice && this.dragging && !this.drawing) {
                        controls.enabled = true;
                    }

                    if (intersects.length > 0 && !this.dragging) {
                        controls.enabled = false;
                        if (!this.touchDevice) {
                            this.dragging = false;
                            this.drawing = true;
                        }
                        let faceIndex = intersects[0].faceIndex;
                        let c = intersects[0].object.geometry.faces[faceIndex].color;
                        this.colors[colorSlot] = `rgb(${c.r * 255}, ${c.g * 255}, ${c.b * 255})`;
                        this.updateColors();
                    } else {
                        if (!this.touchDevice && !this.drawing) {
                            this.dragging = true;
                        }
                    }

                    break;
            }
        };

        init();

        // Double Click Handler
        setInterval(() => {
            if (this.clickDelay > 0) {
                this.clickDelay -= 1;
            }
        }, 1000 / 10);


        // Setup preview canvas
        this.canvas = this.refs.canvas;
        this.ctx = this.canvas.getContext("2d");

        this.canvas.width = 64;
        this.canvas.height = 64;

        this.loadImageFromFile(skin);
    };


    updateSkinPreview = () => {
        const {pixels} = this;
        for (let i = 0; i < pixels.length; i++) {
            for (let j = 0; j < pixels[i].length; j++) {
                if (pixels[i][j] !== 0) {
                    if (pixels[i][j].hasColor) {
                        let c = pixels[i][j].cube.geometry.faces[pixels[i][j].side].color;
                        this.ctx.fillStyle = "rgb(" + (c.r * 255) + ", " + (c.g * 255) + ", " + (c.b * 255) + ")";
                        this.ctx.fillRect(i, j, 1, 1);
                    } else {
                        if (pixels[i][j].external) {
                            this.ctx.clearRect(i, j, 1, 1);
                        }
                    }
                }
            }
        }
        return true;
    };

    setColored = (cube, side, colored) => {
        let {pixels} = this;
        let successful = false;
        for (let i = 0; i < pixels.length; i++) {
            if (successful) {
                break;
            }
            for (let j = 0; j < pixels[i].length; j++) {
                if (pixels[i][j] !== 0) {
                    if (pixels[i][j].cube === cube) {
                        if (side % 2 === 1) {
                            if (pixels[i][j].side === side - 1) {
                                pixels[i][j].hasColor = colored;
                                successful = true;
                                break;
                            }
                        } else {
                            if (pixels[i][j].side === side) {
                                pixels[i][j].hasColor = colored;
                                successful = true;
                                break;
                            }
                        }
                    }
                }
            }
        }
        return successful;
    };

    colorSelect = (e) => {
        if (this.clickDelay === 0) {
            this.clickDelay = 5;
            this.setState({colorSlot: parseInt(e.target.attributes.getNamedItem('slot').value)});
            this.setState({mode: 0});
        } else {
            this.openPallet();
        }
    };

    changeColorSlot = (e) => {
        this.colors[this.state.colorSlot] = e.target.attributes.getNamedItem('color').value;
        this.updateColors();
        this.closePallet();
    };

    changeColorSlotCustom = (h) => {
        if (h.length === 7 && /^#[0-9A-F]{6}$/i.test(h)) {
            this.colors[this.state.colorSlot] = h;
        } else if (h.length === 6) {
           this.colors[this.state.colorSlot] = "#" + h;
        }
        this.updateColors();
        this.closePallet();
    };

    openPallet = () => {
        if (!this.state.pallet) {
            this.setState({pallet: true});
            this.setState({mode: -1});
        }
    };

    closePallet = () => {
        if (this.state.pallet) {
            this.setState({pallet: false});
            this.mouse.x = -100;
            this.setState({mode: 0});
        }
    };

    setPen = () => {
        this.setState({mode: 0});
    };

    setEraser = () => {
        this.setState({mode: 1});
    };

    setRotate = () => {
        this.setState({mode: 2});
    };

    setDropper = () => {
        this.setState({mode: 3});
    };

    updateColors = () => {
        switch (this.state.colorSlot) {
            case 0:
                this.refs.slot0.style.backgroundColor = this.colors[this.state.colorSlot];
                break;
            case 1:
                this.refs.slot1.style.backgroundColor = this.colors[this.state.colorSlot];
                break;
            case 2:
                this.refs.slot2.style.backgroundColor = this.colors[this.state.colorSlot];
                break;
            case 3:
                this.refs.slot3.style.backgroundColor = this.colors[this.state.colorSlot];
                break;
            case 4:
                this.refs.slot4.style.backgroundColor = this.colors[this.state.colorSlot];
                break;
            case 5:
                this.refs.slot5.style.backgroundColor = this.colors[this.state.colorSlot];
                break;
            default:
                alert("An unknown error as occurred");
                break;
        }
    };

    toggleLayer = (e) => {
        let {pixels} = this;
        if (this.state.outer) {
            this.setState({outer: false});
            for (let i = 0; i < pixels.length; i++) {
                for (let j = 0; j < pixels[i].length; j++) {
                    if (pixels[i][j] !== 0) {
                        if (pixels[i][j].external) {
                            this.scene.remove(pixels[i][j].cube);
                        }
                    }
                }
            }
        } else {
            this.setState({outer: true});
            for (let i = 0; i < pixels.length; i++) {
                for (let j = 0; j < pixels[i].length; j++) {
                    if (pixels[i][j] !== 0) {
                        if (pixels[i][j].external) {
                            this.scene.add(pixels[i][j].cube);
                        }
                    }
                }
            }
        }
    };

    clearCanvas = () => {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (let i = 0; i < this.pixels.length; i++) {
            for (let j = 0; j < this.pixels[i].length; j++) {
                if (this.pixels[i][j] !== 0) {

                    let faceIndex = this.pixels[i][j].side;

                    this.pixels[i][j].cube.geometry.faces[faceIndex].materialIndex = 1;
                    this.pixels[i][j].cube.geometry.faces[faceIndex + 1].materialIndex = 1;

                    this.pixels[i][j].cube.geometry.faces[faceIndex].color.set(new THREE.Color("white"));
                    this.pixels[i][j].cube.geometry.faces[faceIndex + 1].color.set(new THREE.Color("white"));


                    this.pixels[i][j].cube.geometry.colorsNeedUpdate = true;
                    this.pixels[i][j].cube.geometry.groupsNeedUpdate = true;
                    this.pixels[i][j].hasColor = false;
                }
            }

        }
    };

    loadImage = (e) => {
        // Loading skin to canvas so clear beforehand
        this.clearCanvas();

        var reader = new FileReader();
        reader.onload = (event) => {
            var img = new Image();
            img.onload = () => {
                if (img.width === 64 && img.height === 64) {
                    this.ctx.drawImage(img, 0, 0);
                    let imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                    // Pixels
                    for (let i = 0; i < 64; i++) {
                        for (let j = 0; j < 64; j++) {
                            if (this.pixels[i][j] !== 0) {

                                let index = (j * imageData.width + i) * 4;
                                let r = imageData.data[index];
                                let g = imageData.data[index + 1];
                                let b = imageData.data[index + 2];
                                let a = imageData.data[index + 3];

                                let color = `rgb(${r}, ${g}, ${b})`;
                                let faceIndex = this.pixels[i][j].side;

                                if (a > 0) {
                                    if (this.pixels[i][j].external) {
                                        this.pixels[i][j].hasColor = true;
                                    }
                                    this.pixels[i][j].cube.geometry.faces[faceIndex].color.set(new THREE.Color(color));
                                    this.pixels[i][j].cube.geometry.faces[faceIndex].materialIndex = 0;
                                    if (faceIndex === 0 || (faceIndex % 2) === 0) {
                                        this.pixels[i][j].cube.geometry.faces[faceIndex + 1].color.set(new THREE.Color(color));
                                        this.pixels[i][j].cube.geometry.faces[faceIndex + 1].materialIndex = 0;
                                    } else {
                                        this.pixels[i][j].cube.geometry.faces[faceIndex - 1].color.set(new THREE.Color(color));
                                        this.pixels[i][j].cube.geometry.faces[faceIndex - 1].materialIndex = 0;
                                    }
                                    this.pixels[i][j].cube.geometry.colorsNeedUpdate = true;
                                    this.pixels[i][j].cube.geometry.groupsNeedUpdate = true;
                                }
                            }
                        }
                    }
                }
            };
            img.src = event.target.result;

        };
        reader.readAsDataURL(e.target.files[0]);

    };


    loadImageFromFile = (file) => {
        // Loading skin to canvas so clear beforehand
        this.clearCanvas();
        let img = new Image();
        img.onload = () => {
            if (img.width === 64 && img.height === 64) {
                this.ctx.drawImage(img, 0, 0);
                let imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                // Pixels
                for (let i = 0; i < 64; i++) {
                    for (let j = 0; j < 64; j++) {
                        if (this.pixels[i][j] !== 0) {

                            let index = (j * imageData.width + i) * 4;
                            let r = imageData.data[index];
                            let g = imageData.data[index + 1];
                            let b = imageData.data[index + 2];
                            let a = imageData.data[index + 3];

                            let color = `rgb(${r}, ${g}, ${b})`;
                            let faceIndex = this.pixels[i][j].side;

                            if (a > 0) {
                                if (this.pixels[i][j].external) {
                                    this.pixels[i][j].hasColor = true;
                                }

                                this.pixels[i][j].cube.geometry.faces[faceIndex].color.set(new THREE.Color(color));
                                this.pixels[i][j].cube.geometry.faces[faceIndex].materialIndex = 0;
                                if (faceIndex === 0 || (faceIndex % 2) === 0) {
                                    this.pixels[i][j].cube.geometry.faces[faceIndex + 1].color.set(new THREE.Color(color));
                                    this.pixels[i][j].cube.geometry.faces[faceIndex + 1].materialIndex = 0;
                                } else {
                                    this.pixels[i][j].cube.geometry.faces[faceIndex - 1].color.set(new THREE.Color(color));
                                    this.pixels[i][j].cube.geometry.faces[faceIndex - 1].materialIndex = 0;
                                }


                                this.pixels[i][j].cube.geometry.colorsNeedUpdate = true;
                                this.pixels[i][j].cube.geometry.groupsNeedUpdate = true;
                            }
                        }
                    }
                }
            }
        };
        img.src = file;
    };

    download = () => {
        if (this.canvas !== null && this.updateSkinPreview()) {
            var download = document.getElementById("download");
            var image = this.canvas.toDataURL("image/png");
            download.setAttribute("href", image);
        }
    };

    upload = () => {
        document.getElementById("selectImage").click();
    };

    render() {
        return (
            <div>

                <div className="tools">
                    <div className={"tool-holder" + (this.state.mode === 0 ? ' th-selected' : '')}
                         onClick={this.setPen}>
                        <FontAwesomeIcon className="tool" icon={faPen} size="2x"/>
                    </div>
                    <div className={"tool-holder" + (this.state.mode === 1 ? ' th-selected' : '')}
                         onClick={this.setEraser}>
                        <FontAwesomeIcon className="tool" icon={faEraser} size="2x"/>
                    </div>
                    <div className={"tool-holder" + (this.state.mode === 3 ? ' th-selected' : '')}
                         onClick={this.setDropper}>
                        <FontAwesomeIcon className="tool" icon={faEyeDropper} size="2x"/>
                    </div>
                    <div className={"tool-holder" + (this.state.mode === 2 ? ' th-selected' : '')}
                         onClick={this.setRotate}>
                        <FontAwesomeIcon className="tool" icon={faSync} size="2x"/>
                    </div>
                    <div className="tool-holder" onClick={this.toggleLayer}>
                        <FontAwesomeIcon className="tool" icon={faLayerGroup} size="2x"/>
                    </div>
                </div>

                <div className="colors">
                    <div onClick={this.colorSelect} ref="slot0" slot='0'
                         className={"color-select" + (this.state.colorSlot === 0 ? ' cs-selected' : '')}
                         style={{backgroundColor: "#f44336"}}/>
                    <div onClick={this.colorSelect} ref="slot1" slot='1'
                         className={"color-select" + (this.state.colorSlot === 1 ? ' cs-selected' : '')}
                         style={{backgroundColor: "#2196F3"}}/>
                    <div onClick={this.colorSelect} ref="slot2" slot='2'
                         className={"color-select" + (this.state.colorSlot === 2 ? ' cs-selected' : '')}
                         style={{backgroundColor: "#4CAF50"}}/>
                    <div onClick={this.colorSelect} ref="slot3" slot='3'
                         className={"color-select" + (this.state.colorSlot === 3 ? ' cs-selected' : '')}
                         style={{backgroundColor: "#FFEB3B"}}/>
                    <div onClick={this.colorSelect} ref="slot4" slot='4'
                         className={"color-select" + (this.state.colorSlot === 4 ? ' cs-selected' : '')}
                         style={{backgroundColor: "#FF9800"}}/>
                    <div onClick={this.colorSelect} ref="slot5" slot='5'
                         className={"color-select" + (this.state.colorSlot === 5 ? ' cs-selected' : '')}
                         style={{backgroundColor: "#9C27B0"}}/>
                     <br/>
                     <div style={{textAlign: "center"}}>
                         <button className="custom-button" onClick={this.upload}>Upload</button>
                         <input id='selectImage' hidden style={{display: "none"}} type="file" onChange={this.loadImage} />

                         <a id="download" download="skin.png"><button type="button" className="custom-button" onClick={this.download}>Download</button></a>
                     </div>
                </div>

                <canvas ref="canvas" className="preview-canvas"/>

                <Pallet colorSlot={this.state.colorSlot} colorSelect={this.changeColorSlot} colorSelectCustom={this.changeColorSlotCustom} closePallet={this.closePallet} pallet={this.state.pallet}/>

            </div>
        );
    }
}