import React, {Component} from 'react';
import bg2 from './img/bg2.png';
import bg from './img/bg.png';
import steve from './img/skin.png';
import alex from './img/alex.png';
import './App.css';
import * as THREE from "three";
import Pallet from './components/Pallet.js';
import Menu from './components/Menu.js';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faPen, faEraser, faSync, faLayerGroup, faEyeDropper, faFill, faFileExport} from '@fortawesome/free-solid-svg-icons'
import Parts from "./components/Parts";

export default class App extends Component {

    scene = null;
    textures = [];
    canvas = null;
    ctx = null;

    // Double Click
    clickDelay = 0;
    lastClicked = -1;

    mouse = null;
    drawing = false;
    dragging = false;

    head = null;
    headOuter = null;
    chest = null;
    chestOuter = null;
    armL = null;
    armLOuter = null;
    armR = null;
    armROuter = null;
    legL = null;
    legLOuter = null;
    legR = null;
    legROuter = null;

    offsets = [];

    colors = ['#f44336', '#2196F3',
        '#4CAF50', '#FFEB3B', "#FF9800", "#9C27B0"];

    state = {
        mode: 0, // 0 - pencil, 1 - eraser, 2 - rotate, 3 - eye drop, 4 - fill
        colorSlot: 0,
        ctx: null,
        outer: true,
        part: -1, // 0 - head, 1 - chest, 2 - left arm, 3 - right arm, 4 - left leg, 5 - right leg,
        pallet: false,
        menu: false,
        isAlex: false
    };

    touchDevice = (navigator.maxTouchPoints || 'ontouchstart' in document.documentElement);
    mouseDown = false;

    componentDidMount() {
        this.scene = new THREE.Scene();
        let camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 32;

        let renderer = new THREE.WebGLRenderer({ logarithmicDepthBuffer: true, antialias: true });

        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        let OrbitControls = require('three-orbit-controls')(THREE);
        let controls = new OrbitControls(camera, renderer.domElement);
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

        this.ctx = this.canvas.getContext("2d");

        let start = () => {
            this.ctx.fillStyle = this.colors[this.state.colorSlot];

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

            this.loadPreset(steve);
            animate();
        };

        let animate = () => {
            requestAnimationFrame(animate);
            camera.lookAt(0, 0);

            controls.update();
            renderer.render(this.scene, camera);

            for (let t = 0; t < this.textures.length; t++) {
                this.textures[t].needsUpdate = true;
            }

            update();
        };

        let update = () => {
            let {colorSlot, mode, outer} = this.state;
            raycaster.setFromCamera(this.mouse, camera);
            let intersects = raycaster.intersectObjects(this.scene.children);
            this.ctx.fillStyle = this.colors[this.state.colorSlot];
            switch (mode) {
                case -1:
                    controls.enabled = false;
                    break;
                case 0: // Pencil
                    if (!this.touchDevice && !this.mouseDown) {
                        break;
                    }

                    if (!this.touchDevice) {
                        if (this.dragging && !this.drawing) {
                            controls.enabled = true;
                        }
                    } else {
                        controls.enabled = false;
                    }

                    if (intersects.length > 0 && !this.dragging) {
                        controls.enabled = false;
                        if (!this.touchDevice) {
                            this.dragging = false;
                            this.drawing = true;
                        }
                        let faceIndex = (intersects[0].faceIndex % 2 === 1 ? intersects[0].faceIndex - 1 : intersects[0].faceIndex) / 2;
                        for (let i = 0; i < this.offsets.length; i++) {
                            if (intersects[0].object === this.offsets[i].object) {
                                switch (faceIndex) {
                                    case 0: // left
                                        this.ctx.fillRect(this.offsets[i].left.xOffset + Math.floor(intersects[0].uv.x * this.offsets[i].left.sizeX), this.offsets[i].left.yOffset + (this.offsets[i].left.sizeY-1)-Math.floor(intersects[0].uv.y *  this.offsets[i].left.sizeY), 1, 1);
                                        break;
                                    case 1: // right
                                        this.ctx.fillRect(this.offsets[i].right.xOffset + Math.floor(intersects[0].uv.x * this.offsets[i].right.sizeX), this.offsets[i].right.yOffset  + (this.offsets[i].right.sizeY-1)-Math.floor(intersects[0].uv.y * this.offsets[i].right.sizeY), 1, 1);
                                        break;
                                    case 2: // top
                                        this.ctx.fillRect(this.offsets[i].top.xOffset + Math.floor(intersects[0].uv.x * this.offsets[i].top.sizeX), this.offsets[i].top.yOffset + ((this.offsets[i].top.sizeY-1)-Math.floor(intersects[0].uv.y * this.offsets[i].top.sizeY)), 1, 1);
                                        break;
                                    case 3: // bot
                                        this.ctx.fillRect(this.offsets[i].bot.xOffset + Math.floor(intersects[0].uv.x * this.offsets[i].bot.sizeX), this.offsets[i].bot.yOffset + Math.floor(intersects[0].uv.y * this.offsets[i].bot.sizeY), 1, 1);
                                        break;
                                    case 4: // front
                                        this.ctx.fillRect(this.offsets[i].front.xOffset + Math.floor(intersects[0].uv.x * this.offsets[i].front.sizeX), this.offsets[i].front.yOffset + ((this.offsets[i].front.sizeY-1)-Math.floor(intersects[0].uv.y * this.offsets[i].front.sizeY)), 1, 1);
                                        break;
                                    case 5: // back
                                        this.ctx.fillRect(this.offsets[i].back.xOffset + Math.floor(intersects[0].uv.x * this.offsets[i].back.sizeX), this.offsets[i].back.yOffset + ((this.offsets[i].back.sizeY-1)-Math.floor(intersects[0].uv.y * this.offsets[i].back.sizeY)), 1, 1);
                                        break;
                                }
                                break;
                            }
                        }

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
                            let faceIndex = (intersects[0].faceIndex % 2 === 1 ? intersects[0].faceIndex - 1 : intersects[0].faceIndex) / 2;
                            for (let i = 0; i < this.offsets.length; i++) {
                                if (intersects[0].object === this.offsets[i].object) {
                                    switch (faceIndex) {
                                        case 0: // left
                                            this.ctx.clearRect(this.offsets[i].left.xOffset + ((this.offsets[i].left.sizeX-1)-Math.floor(intersects[0].uv.x * this.offsets[i].left.sizeX)), this.offsets[i].left.yOffset + (this.offsets[i].left.sizeY-1)-Math.floor(intersects[0].uv.y *  this.offsets[i].left.sizeY), 1, 1);
                                            break;
                                        case 1: // right
                                            this.ctx.clearRect(this.offsets[i].right.xOffset + ((this.offsets[i].right.sizeX-1)-Math.floor(intersects[0].uv.x * this.offsets[i].right.sizeX)), this.offsets[i].right.yOffset  + (this.offsets[i].right.sizeY-1)-Math.floor(intersects[0].uv.y * this.offsets[i].right.sizeY), 1, 1);
                                            break;
                                        case 2: // top
                                            this.ctx.clearRect(this.offsets[i].top.xOffset + Math.floor(intersects[0].uv.x * this.offsets[i].top.sizeX), this.offsets[i].top.yOffset + ((this.offsets[i].top.sizeY-1)-Math.floor(intersects[0].uv.y * this.offsets[i].top.sizeY)), 1, 1);
                                            break;
                                        case 3: // bot
                                            this.ctx.clearRect(this.offsets[i].bot.xOffset + Math.floor(intersects[0].uv.x * this.offsets[i].bot.sizeX), this.offsets[i].bot.yOffset + Math.floor(intersects[0].uv.y * this.offsets[i].bot.sizeY), 1, 1);
                                            break;
                                        case 4: // front
                                            this.ctx.clearRect(this.offsets[i].front.xOffset + Math.floor(intersects[0].uv.x * this.offsets[i].front.sizeX), this.offsets[i].front.yOffset + ((this.offsets[i].front.sizeY-1)-Math.floor(intersects[0].uv.y * this.offsets[i].front.sizeY)), 1, 1);
                                            break;
                                        case 5: // back
                                            this.ctx.clearRect(this.offsets[i].back.xOffset + Math.floor(intersects[0].uv.x * this.offsets[i].back.sizeX), this.offsets[i].back.yOffset + ((this.offsets[i].back.sizeY-1)-Math.floor(intersects[0].uv.y * this.offsets[i].back.sizeY)), 1, 1);
                                            break;
                                    }
                                    break;
                                }
                            }
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
                        let faceIndex = (intersects[0].faceIndex % 2 === 1 ? intersects[0].faceIndex - 1 : intersects[0].faceIndex) / 2;
                        let p = null;
                        for (let i = 0; i < this.offsets.length; i++) {
                            if (intersects[0].object === this.offsets[i].object) {
                                switch (faceIndex) {
                                    case 0: // left
                                        p = this.ctx.getImageData(this.offsets[i].left.xOffset + ((this.offsets[i].left.sizeX-1)-Math.floor(intersects[0].uv.x * this.offsets[i].left.sizeX)), this.offsets[i].left.yOffset + (this.offsets[i].left.sizeY-1)-Math.floor(intersects[0].uv.y *  this.offsets[i].left.sizeY), 1, 1).data
                                        break;
                                    case 1: // right
                                        p = this.ctx.getImageData(this.offsets[i].right.xOffset + ((this.offsets[i].right.sizeX-1)-Math.floor(intersects[0].uv.x * this.offsets[i].right.sizeX)), this.offsets[i].right.yOffset  + (this.offsets[i].right.sizeY-1)-Math.floor(intersects[0].uv.y * this.offsets[i].right.sizeY), 1, 1).data;
                                        break;
                                    case 2: // top
                                        p = this.ctx.getImageData(this.offsets[i].top.xOffset + Math.floor(intersects[0].uv.x * this.offsets[i].top.sizeX), this.offsets[i].top.yOffset + ((this.offsets[i].top.sizeY-1)-Math.floor(intersects[0].uv.y * this.offsets[i].top.sizeY)), 1, 1).data;
                                        break;
                                    case 3: // bot
                                        p = this.ctx.getImageData(this.offsets[i].bot.xOffset + Math.floor(intersects[0].uv.x * this.offsets[i].bot.sizeX), this.offsets[i].bot.yOffset + Math.floor(intersects[0].uv.y * this.offsets[i].bot.sizeY), 1, 1).data;
                                        break;
                                    case 4: // front
                                        p = this.ctx.getImageData(this.offsets[i].front.xOffset + Math.floor(intersects[0].uv.x * this.offsets[i].front.sizeX), this.offsets[i].front.yOffset + ((this.offsets[i].front.sizeY-1)-Math.floor(intersects[0].uv.y * this.offsets[i].front.sizeY)), 1, 1).data;
                                        break;
                                    case 5: // back
                                        p = this.ctx.getImageData(this.offsets[i].back.xOffset + Math.floor(intersects[0].uv.x * this.offsets[i].back.sizeX), this.offsets[i].back.yOffset + ((this.offsets[i].back.sizeY-1)-Math.floor(intersects[0].uv.y * this.offsets[i].back.sizeY)), 1, 1).data;
                                        break;
                                }
                                break;
                            }
                        }

                        this.colors[colorSlot] = "#" + ("000000" + ((p[0] << 16) | (p[1] << 8) | p[2]).toString(16)).slice(-6);
                        this.updateColors();
                    } else {
                        if (!this.touchDevice && !this.drawing) {
                            this.dragging = true;
                        }
                    }

                    break;
                case 4: // Bucket
                    if (!this.touchDevice && !this.mouseDown) {
                        break;
                    }

                    if (!this.touchDevice) {
                        if (this.dragging && !this.drawing) {
                            controls.enabled = true;
                        }
                    } else {
                        controls.enabled = false;
                    }

                    if (intersects.length > 0 && !this.dragging) {
                        controls.enabled = false;
                        if (!this.touchDevice) {
                            this.dragging = false;
                            this.drawing = true;
                        }
                        let faceIndex = (intersects[0].faceIndex % 2 === 1 ? intersects[0].faceIndex - 1 : intersects[0].faceIndex) / 2;
                        for (let i = 0; i < this.offsets.length; i++) {
                            if (intersects[0].object === this.offsets[i].object) {
                                switch (faceIndex) {
                                    case 0: // left
                                        this.ctx.fillRect(this.offsets[i].left.xOffset, this.offsets[i].left.yOffset, this.offsets[i].left.sizeX, this.offsets[i].left.sizeY);
                                        break;
                                    case 1: // right
                                        this.ctx.fillRect(this.offsets[i].right.xOffset, this.offsets[i].right.yOffset, this.offsets[i].right.sizeX, this.offsets[i].right.sizeY);
                                        break;
                                    case 2: // top
                                        this.ctx.fillRect(this.offsets[i].top.xOffset, this.offsets[i].top.yOffset, this.offsets[i].top.sizeX, this.offsets[i].top.sizeY);
                                        break;
                                    case 3: // bot
                                        this.ctx.fillRect(this.offsets[i].bot.xOffset, this.offsets[i].bot.yOffset, this.offsets[i].bot.sizeX, this.offsets[i].bot.sizeY);
                                        break;
                                    case 4: // front
                                        this.ctx.fillRect(this.offsets[i].front.xOffset, this.offsets[i].front.yOffset, this.offsets[i].front.sizeX, this.offsets[i].front.sizeY);
                                        break;
                                    case 5: // back
                                        this.ctx.fillRect(this.offsets[i].back.xOffset, this.offsets[i].back.yOffset, this.offsets[i].back.sizeX, this.offsets[i].back.sizeY);
                                        break;
                                }
                                break;
                            }
                        }

                    } else {
                        if (!this.touchDevice && !this.drawing) {
                            this.dragging = true;
                        }
                    }
                    break;
            }
        };

        start();

        // Double Click Handler
        setInterval(() => {
            if (this.clickDelay > 0) {
                this.clickDelay -= 1;
            }
        }, 1000 / 10);

    };

    createBodyPart = (objRef, texture, leftParam, rightParam, topParam, botParam, frontParam, backParam, dims) => {
        let left = texture.clone();
        let right = texture.clone();
        let top = texture.clone();
        let bot = texture.clone();
        let front = texture.clone();
        let back = texture.clone();

        left.repeat.set(leftParam.sizeX/64, leftParam.sizeY/64);
        left.offset.x = leftParam.xOffset/64;
        left.offset.y = 1 - (leftParam.sizeY/64) - (leftParam.yOffset/64);

        right.repeat.set(rightParam.sizeX/64, rightParam.sizeY/64);
        right.offset.x = rightParam.xOffset/64;
        right.offset.y = 1 - (rightParam.sizeY/64) - (rightParam.yOffset/64);

        top.repeat.set(topParam.sizeX/64, topParam.sizeY/64);
        top.offset.x = topParam.xOffset/64;
        top.offset.y = 1 - (topParam.sizeY/64) - (topParam.yOffset/64);

        bot.repeat.set(botParam.sizeX/64, -botParam.sizeY/64);
        bot.offset.x = botParam.xOffset/64;
        bot.offset.y = 1 - (botParam.sizeY/64) - (botParam.yOffset/64) + botParam.sizeY/64;

        front.repeat.set(frontParam.sizeX/64, frontParam.sizeY/64);
        front.offset.x = frontParam.xOffset/64;
        front.offset.y = 1 - (frontParam.sizeY/64) - (frontParam.yOffset/64);

        back.repeat.set(backParam.sizeX/64, backParam.sizeY/64);
        back.offset.x = backParam.xOffset/64;
        back.offset.y = 1 - (backParam.sizeY/64) - (backParam.yOffset/64);

        this.textures.push(left);
        this.textures.push(right);
        this.textures.push(top);
        this.textures.push(bot);
        this.textures.push(front);
        this.textures.push(back);

        let material = [new THREE.MeshBasicMaterial({ map: left }), new THREE.MeshBasicMaterial({ map: right }), new THREE.MeshBasicMaterial({ map: top }), new THREE.MeshBasicMaterial({ map: bot }), new THREE.MeshBasicMaterial({ map: front }), new THREE.MeshBasicMaterial({ map: back })];
        let geometry = new THREE.BoxBufferGeometry( dims.x, dims.y, dims.z);

        if (dims.isOuter) {
            material = [new THREE.MeshBasicMaterial({ map: left, transparent: true }), new THREE.MeshBasicMaterial({ map: right, transparent: true }), new THREE.MeshBasicMaterial({ map: top, transparent: true }), new THREE.MeshBasicMaterial({ map: bot, transparent: true }), new THREE.MeshBasicMaterial({ map: front, transparent: true }), new THREE.MeshBasicMaterial({ map: back, transparent: true })];
            geometry = new THREE.BoxBufferGeometry( dims.x + 0.5, dims.y + 0.5, dims.z + 0.5);
        }

        let obj = new THREE.Mesh( geometry, material );
        this.offsets.push({object: obj, left: leftParam, right: rightParam, top: topParam, bot: botParam, front: frontParam, back: backParam});

        if (dims.isOuter) {
            var geo = new THREE.EdgesGeometry( obj.geometry );
            var mat = new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 1 } );
            var wireframe = new THREE.LineSegments( geo, mat );
            wireframe.renderOrder = 1; // make sure wireframes are rendered 2nd
            obj.add( wireframe );
        }


        return obj;
    };


    init = () => {
        this.clearScene();

        let texture;
        texture = new THREE.CanvasTexture(this.canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.LinearMipMapLinearFilter;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

        this.head = this.createBodyPart(this.head, texture,
            {sizeX: 8, sizeY: 8, xOffset: 16, yOffset: 8},
            {sizeX: 8, sizeY: 8, xOffset: 0, yOffset: 8},
            {sizeX: 8, sizeY: 8, xOffset: 8, yOffset: 0},
            {sizeX: 8, sizeY: 8, xOffset: 16, yOffset: 0},
            {sizeX: 8, sizeY: 8, xOffset: 8, yOffset: 8},
            {sizeX: 8, sizeY: 8, xOffset: 24, yOffset: 8},
            {x: 8, y: 8, z: 8, isOuter: false});

        this.headOuter = this.createBodyPart(this.headOuter, texture,
            {sizeX: 8, sizeY: 8, xOffset: 48, yOffset: 8},
            {sizeX: 8, sizeY: 8, xOffset: 32, yOffset: 8},
            {sizeX: 8, sizeY: 8, xOffset: 40, yOffset: 0},
            {sizeX: 8, sizeY: 8, xOffset: 48, yOffset: 0},
            {sizeX: 8, sizeY: 8, xOffset: 40, yOffset: 8},
            {sizeX: 8, sizeY: 8, xOffset: 56, yOffset: 8},
            {x: 8, y: 8, z: 8, isOuter: true});

        this.chest = this.createBodyPart(this.chest, texture,
            {sizeX: 4, sizeY: 12, xOffset: 28, yOffset: 20},
            {sizeX: 4, sizeY: 12, xOffset: 16, yOffset: 20},
            {sizeX: 8, sizeY: 4, xOffset: 20, yOffset: 16},
            {sizeX: 8, sizeY: 4, xOffset: 28, yOffset: 16},
            {sizeX: 8, sizeY: 12, xOffset: 20, yOffset: 20},
            {sizeX: 8, sizeY: 12, xOffset: 32, yOffset: 20},
            {x: 8, y: 12, z: 4, isOuter: false});

        this.chestOuter = this.createBodyPart(this.chestOuter, texture,
            {sizeX: 4, sizeY: 12, xOffset: 28, yOffset: 36},
            {sizeX: 4, sizeY: 12, xOffset: 16, yOffset: 36},
            {sizeX: 8, sizeY: 4, xOffset: 20, yOffset: 32},
            {sizeX: 8, sizeY: 4, xOffset: 28, yOffset: 32},
            {sizeX: 8, sizeY: 12, xOffset: 20, yOffset: 36},
            {sizeX: 8, sizeY: 12, xOffset: 32, yOffset: 36},
            {x: 8, y: 12, z: 4, isOuter: true});

        if (this.state.isAlex) {
            this.armL = this.createBodyPart(this.armL, texture,
                {sizeX: 4, sizeY: 12, xOffset: 39, yOffset: 52},
                {sizeX: 4, sizeY: 12, xOffset: 32, yOffset: 52},
                {sizeX: 3, sizeY: 4, xOffset: 36, yOffset: 48},
                {sizeX: 3, sizeY: 4, xOffset: 39, yOffset: 48},
                {sizeX: 3, sizeY: 12, xOffset: 36, yOffset: 52},
                {sizeX: 3, sizeY: 12, xOffset: 43, yOffset: 52},
                {x: 3, y: 12, z: 4, isOuter: false});

            this.armLOuter = this.createBodyPart(this.armLOuter, texture,
                {sizeX: 4, sizeY: 12, xOffset: 55, yOffset: 52},
                {sizeX: 4, sizeY: 12, xOffset: 48, yOffset: 52},
                {sizeX: 3, sizeY: 4, xOffset: 52, yOffset: 48},
                {sizeX: 3, sizeY: 4, xOffset: 55, yOffset: 48},
                {sizeX: 3, sizeY: 12, xOffset: 52, yOffset: 52},
                {sizeX: 3, sizeY: 12, xOffset: 59, yOffset: 52},
                {x: 3, y: 12, z: 4, isOuter: true});

            this.armR = this.createBodyPart(this.armR, texture,
                {sizeX: 4, sizeY: 12, xOffset: 47, yOffset: 20},
                {sizeX: 4, sizeY: 12, xOffset: 40, yOffset: 20},
                {sizeX: 3, sizeY: 4, xOffset: 44, yOffset: 16},
                {sizeX: 3, sizeY: 4, xOffset: 47, yOffset: 16},
                {sizeX: 3, sizeY: 12, xOffset: 44, yOffset: 20},
                {sizeX: 3, sizeY: 12, xOffset: 51, yOffset: 20},
                {x: 3, y: 12, z: 4, isOuter: false});

            this.armROuter = this.createBodyPart(this.armROuter, texture,
                {sizeX: 4, sizeY: 12, xOffset: 47, yOffset: 36},
                {sizeX: 4, sizeY: 12, xOffset: 40, yOffset: 36},
                {sizeX: 3, sizeY: 4, xOffset: 44, yOffset: 32},
                {sizeX: 3, sizeY: 4, xOffset: 47, yOffset: 32},
                {sizeX: 3, sizeY: 12, xOffset: 44, yOffset: 36},
                {sizeX: 3, sizeY: 12, xOffset: 51, yOffset: 36},
                {x: 3, y: 12, z: 4, isOuter: true});
        } else {
            this.armL = this.createBodyPart(this.armL, texture,
                {sizeX: 4, sizeY: 12, xOffset: 40, yOffset: 52},
                {sizeX: 4, sizeY: 12, xOffset: 32, yOffset: 52},
                {sizeX: 4, sizeY: 4, xOffset: 36, yOffset: 48},
                {sizeX: 4, sizeY: 4, xOffset: 40, yOffset: 48},
                {sizeX: 4, sizeY: 12, xOffset: 36, yOffset: 52},
                {sizeX: 4, sizeY: 12, xOffset: 44, yOffset: 52},
                {x: 4, y: 12, z: 4, isOuter: false});

            this.armLOuter = this.createBodyPart(this.armLOuter, texture,
                {sizeX: 4, sizeY: 12, xOffset: 56, yOffset: 52},
                {sizeX: 4, sizeY: 12, xOffset: 48, yOffset: 52},
                {sizeX: 4, sizeY: 4, xOffset: 52, yOffset: 48},
                {sizeX: 4, sizeY: 4, xOffset: 56, yOffset: 48},
                {sizeX: 4, sizeY: 12, xOffset: 52, yOffset: 52},
                {sizeX: 4, sizeY: 12, xOffset: 60, yOffset: 52},
                {x: 4, y: 12, z: 4, isOuter: true});

            this.armR = this.createBodyPart(this.armR, texture,
                {sizeX: 4, sizeY: 12, xOffset: 48, yOffset: 20},
                {sizeX: 4, sizeY: 12, xOffset: 40, yOffset: 20},
                {sizeX: 4, sizeY: 4, xOffset: 44, yOffset: 16},
                {sizeX: 4, sizeY: 4, xOffset: 48, yOffset: 16},
                {sizeX: 4, sizeY: 12, xOffset: 44, yOffset: 20},
                {sizeX: 4, sizeY: 12, xOffset: 52, yOffset: 20},
                {x: 4, y: 12, z: 4, isOuter: false});

            this.armROuter = this.createBodyPart(this.armROuter, texture,
                {sizeX: 4, sizeY: 12, xOffset: 48, yOffset: 36},
                {sizeX: 4, sizeY: 12, xOffset: 40, yOffset: 36},
                {sizeX: 4, sizeY: 4, xOffset: 44, yOffset: 32},
                {sizeX: 4, sizeY: 4, xOffset: 48, yOffset: 32},
                {sizeX: 4, sizeY: 12, xOffset: 44, yOffset: 36},
                {sizeX: 4, sizeY: 12, xOffset: 52, yOffset: 36},
                {x: 4, y: 12, z: 4, isOuter: true});
        }

        this.legL = this.createBodyPart(this.legL, texture,
            {sizeX: 4, sizeY: 12, xOffset: 24, yOffset: 52},
            {sizeX: 4, sizeY: 12, xOffset: 16, yOffset: 52},
            {sizeX: 4, sizeY: 4, xOffset: 20, yOffset: 48},
            {sizeX: 4, sizeY: 4, xOffset: 24, yOffset: 48},
            {sizeX: 4, sizeY: 12, xOffset: 20, yOffset: 52},
            {sizeX: 4, sizeY: 12, xOffset: 28, yOffset: 52},
            {x: 4, y: 12, z: 4, isOuter: false});

        this.legLOuter = this.createBodyPart(this.legLOuter, texture,
            {sizeX: 4, sizeY: 12, xOffset: 8, yOffset: 52},
            {sizeX: 4, sizeY: 12, xOffset: 0, yOffset: 52},
            {sizeX: 4, sizeY: 4, xOffset: 4, yOffset: 48},
            {sizeX: 4, sizeY: 4, xOffset: 8, yOffset: 48},
            {sizeX: 4, sizeY: 12, xOffset: 4, yOffset: 52},
            {sizeX: 4, sizeY: 12, xOffset: 12, yOffset: 52},
            {x: 4, y: 12, z: 4, isOuter: true});

        this.legR = this.createBodyPart(this.legR, texture,
            {sizeX: 4, sizeY: 12, xOffset: 8, yOffset: 20},
            {sizeX: 4, sizeY: 12, xOffset: 0, yOffset: 20},
            {sizeX: 4, sizeY: 4, xOffset: 4, yOffset: 16},
            {sizeX: 4, sizeY: 4, xOffset: 8, yOffset: 16},
            {sizeX: 4, sizeY: 12, xOffset: 4, yOffset: 20},
            {sizeX: 4, sizeY: 12, xOffset: 12, yOffset: 20},
            {x: 4, y: 12, z: 4, isOuter: false});

        this.legROuter = this.createBodyPart(this.legROuter, texture,
            {sizeX: 4, sizeY: 12, xOffset: 8, yOffset: 36},
            {sizeX: 4, sizeY: 12, xOffset: 0, yOffset: 36},
            {sizeX: 4, sizeY: 4, xOffset: 4, yOffset: 32},
            {sizeX: 4, sizeY: 4, xOffset: 8, yOffset: 32},
            {sizeX: 4, sizeY: 12, xOffset: 4, yOffset: 36},
            {sizeX: 4, sizeY: 12, xOffset: 12, yOffset: 36},
            {x: 4, y: 12, z: 4, isOuter: true});

        this.showFull();
    };

    colorSelect = (e) => {
        if (this.clickDelay !== 0 && this.lastClicked === parseInt(e.target.attributes.getNamedItem('slot').value)) {
            this.openPallet();
        } else {
            this.clickDelay = 5;
            this.lastClicked = parseInt(e.target.attributes.getNamedItem('slot').value);
            this.setState({colorSlot: parseInt(e.target.attributes.getNamedItem('slot').value)});
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

    openMenu = () => {
        if (!this.state.menu) {
            this.setState({menu: true});
            this.setState({mode: -1});
        }
    };

    closeMenu = () => {
        if (this.state.menu) {
            this.setState({menu: false});
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

    setBucket = () => {
        this.setState({mode: 4});
    };

    setAlex = (t) => {
        this.setState({isAlex: t});
    };

    clearScene = () => {
        while (this.scene.children.length) {
            this.scene.remove(this.scene.children[0]);
        }
    };

    showFull = () => {
        this.clearScene();
        this.head.position.set(0, 12, 0);
        this.scene.add(this.head);
        this.headOuter.position.set(0, 12, 0);
        this.chest.position.set(0, 2, 0);
        this.scene.add(this.chest);
        this.chestOuter.position.set(0, 2, 0);

        this.scene.add(this.armL);
        this.scene.add(this.armR);
        this.scene.add(this.legL);
        this.scene.add(this.legR);
        this.legL.position.set(-2, -10, 0);
        this.legLOuter.position.set(-2, -10, 0);
        this.legR.position.set(2, -10, 0);
        this.legROuter.position.set(2, -10, 0);

        if (this.state.isAlex) {
            this.armL.position.set(5.5, 2, 0);
            this.armLOuter.position.set(5.5, 2, 0);
            this.armR.position.set(-5.5, 2, 0);
            this.armROuter.position.set(-5.5, 2, 0);
        } else {
            this.armL.position.set(6, 2, 0);
            this.armLOuter.position.set(6, 2, 0);
            this.armR.position.set(-6, 2, 0);
            this.armROuter.position.set(-6, 2, 0);
        }



        if (this.state.outer) {
            this.scene.add(this.headOuter);
            this.scene.add(this.chestOuter);
            this.scene.add(this.armLOuter);
            this.scene.add(this.armROuter);
            this.scene.add(this.legLOuter);
            this.scene.add(this.legROuter);
        }

        this.setState({part: -1});
    };

    showHead = () => {
        this.clearScene();
        this.scene.add(this.head);
        this.head.position.set(0, 0, 0);
        if (this.state.outer) {
            this.scene.add(this.headOuter);
        }
        this.headOuter.position.set(0, 0, 0);
        this.setState({part: 0});
    };

    showChest = () => {
        this.clearScene();
        this.scene.add(this.chest);
        this.chest.position.set(0, 0, 0);
        if (this.state.outer) {
            this.scene.add(this.chestOuter);
        }
        this.chestOuter.position.set(0, 0, 0);
        this.setState({part: 1});
    };

    showLeftArm = () => {
        this.clearScene();
        this.scene.add(this.armL);
        this.armL.position.set(0, 0, 0);
        if (this.state.outer) {
            this.scene.add(this.armLOuter);
        }
        this.armLOuter.position.set(0, 0, 0);
        this.setState({part: 2});
    };

    showRightArm = () => {
        this.clearScene();
        this.scene.add(this.armR);
        this.armR.position.set(0, 0, 0);
        if (this.state.outer) {
            this.scene.add(this.armROuter);
        }
        this.armROuter.position.set(0, 0, 0);
        this.setState({part: 3});
    };

    showLeftLeg = () => {
        this.clearScene();
        this.scene.add(this.legL);
        this.legL.position.set(0, 0, 0);
        if (this.state.outer) {
            this.scene.add(this.legLOuter);
        }
        this.legLOuter.position.set(0, 0, 0);
        this.setState({part: 4});
    };

    showRightLeg = () => {
        this.clearScene();
        this.scene.add(this.legR);
        this.legR.position.set(0, 0, 0);
        if (this.state.outer) {
            this.scene.add(this.legROuter);
        }
        this.legROuter.position.set(0, 0, 0);
        this.setState({part: 5});
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
        if (this.state.part === -1) {
            if (this.state.outer) {
                this.setState({outer: false});
                this.scene.remove(this.headOuter);
                this.scene.remove(this.chestOuter);
                this.scene.remove(this.legLOuter);
                this.scene.remove(this.legROuter);
                this.scene.remove(this.armLOuter);
                this.scene.remove(this.armROuter);
            } else {
                this.setState({outer: true});
                this.scene.add(this.headOuter);
                this.scene.add(this.chestOuter);
                this.scene.add(this.legLOuter);
                this.scene.add(this.legROuter);
                this.scene.add(this.armLOuter);
                this.scene.add(this.armROuter);
            }
        } else {
            if (this.state.outer) {
                this.setState({outer: false});
                switch (this.state.part) {
                    case 0:
                        this.scene.remove(this.headOuter);
                        break;
                    case 1:
                        this.scene.remove(this.chestOuter);
                        break;
                    case 2:
                        this.scene.remove(this.armLOuter);
                        break;
                    case 3:
                        this.scene.remove(this.armROuter);
                        break;
                    case 4:
                        this.scene.remove(this.legLOuter);
                        break;
                    case 5:
                        this.scene.remove(this.legROuter);
                        break;
                }
            } else {
                this.setState({outer: true});
                switch (this.state.part) {
                    case 0:
                        this.scene.add(this.headOuter);
                        break;
                    case 1:
                        this.scene.add(this.chestOuter);
                        break;
                    case 2:
                        this.scene.add(this.armLOuter);
                        break;
                    case 3:
                        this.scene.add(this.armROuter);
                        break;
                    case 4:
                        this.scene.add(this.legLOuter);
                        break;
                    case 5:
                        this.scene.add(this.legROuter);
                        break;
                }
            }

        }
    };

    loadImage = (e) => {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.state.menu) {
            this.closeMenu();
        }

        let reader = new FileReader();
        reader.onload = (event) => {
            let img = new Image();
            img.onload = () => {
                if (img.width === 64 && img.height === 64) {
                    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    this.ctx.drawImage(img, 0, 0);
                    this.init();
                } else {
                    console.log("Error! Invalid skin file");
                }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(e.target.files[0]);
    };

    loadImageFromDrop = (e) => {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.state.menu) {
            this.closeMenu();
        }

        let reader = new FileReader();
        reader.onload = (event) => {
            let img = new Image();
            img.onload = () => {
                if (img.width === 64 && img.height === 64) {
                    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    this.ctx.drawImage(img, 0, 0);
                    this.init();
                } else {
                    console.log("Error! Invalid skin file");
                }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(e[0]);
    };

    loadPreset = (skin) => {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        let img = new Image();
        img.onload = () => {
            this.ctx.drawImage(img, 0, 0);
            this.init();
        };
        img.src = skin;
    };

    fromScratch = () => {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.state.menu) {
            this.closeMenu();
        }

        let img = new Image();
        img.onload = () => {
            this.ctx.drawImage(img, 0, 0);
            this.init();
        };
        if (this.state.isAlex) {
            img.src = alex;
        } else {
            img.src = steve;
        }
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

                    <div className={"tool-holder" + (this.state.mode === 4 ? ' th-selected' : '')}
                         onClick={this.setBucket}>
                        <FontAwesomeIcon className="tool" icon={faFill} size="2x"/>
                    </div>

                    <div className={"tool-holder" + (this.state.mode === 2 ? ' th-selected' : '')}
                         onClick={this.setRotate}>
                        <FontAwesomeIcon className="tool" icon={faSync} size="2x"/>
                    </div>

                    <div className="menu-button tool-holder" onClick={this.openMenu}>
                        <FontAwesomeIcon className="tool" icon={faFileExport} size="2x"/>
                    </div>
                </div>

                <div className={"layer-tool tool-holder" + (this.state.outer ? ' th-selected' : '')} onClick={this.toggleLayer}>
                    <FontAwesomeIcon className="tool" icon={faLayerGroup} size="2x"/>
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

                </div>

                <Pallet colorSlot={this.state.colorSlot} colorSelect={this.changeColorSlot} colorSelectCustom={this.changeColorSlotCustom} closePallet={this.closePallet} pallet={this.state.pallet}/>
                <Menu loadFromDrop={this.loadImageFromDrop} fromScratch={this.fromScratch} setAlex={this.setAlex} loadImage={this.loadImage} closeMenu={this.closeMenu} menu={this.state.menu} canvasAccess={(c) => { this.canvas = c; } }/>
                <Parts part={this.state.part} full={this.showFull} head={this.showHead} chest={this.showChest} leftArm={this.showLeftArm} rightArm={this.showRightArm} leftLeg={this.showLeftLeg} rightLeg={this.showRightLeg}/>
            </div>
        );
    }
}