import React, {Component} from 'react';
import bg2 from './img/bg2.png';
import bg from './img/bg.png';
import steve from './img/steve.png';
import alex from './img/alex.png';
import hd_steve from './img/hd_steve.png';
import hd_alex from './img/hd_alex.png';
import './App.css';
import * as THREE from "three";
import Pallet from './components/Pallet.js';
import Parts from "./components/Parts";
import SkinMenu from "./components/SkinMenu";
import PalletSelector from "./components/PalletSelector";

import steve_face from './img/face.png';
import alex_face from './img/face_alex.png'

export default class App extends Component {

    scene = null;
    camera = null;
    raycaster = null;

    textures = [];

    canvas = null;
    ctx = null;

    actions = [];
    aIdx = -1;
    aSize = 63;

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

    skins = []; // {img: dataURL, type: alex/steve, size: 64/128}
    skinIndex = 0;

    colors = ['#f44336', '#2196F3',
        '#4CAF50', '#FFEB3B', "#FF9800"];

    touchDevice = (navigator.maxTouchPoints || 'ontouchstart' in document.documentElement);
    mouseDown = false;

    state = {
        mode: 0, // 0 - pencil, 1 - eraser, 2 - rotate, 3 - eye drop, 4 - fill
        colorSlot: 0,
        ctx: null,
        outer: false,
        part: -1, // 0 - head, 1 - chest, 2 - left arm, 3 - right arm, 4 - left leg, 5 - right leg,
        pallet: false,
        skinMenu: false,
        palletSelector: false,
        innerGrid: false,
        outerGrid: false,
        preview: true
    };

    isAlex = false;
    skinSize = 64;

    componentDidMount() {

        window.addEventListener("dragenter", (e) => {
            e.preventDefault();
            document.querySelector(".dropzone").style.visibility = "";
            document.querySelector(".dropzone").style.opacity = 1;
        }, false);

        window.addEventListener("dragover", function (e) {
            e.preventDefault();
            document.querySelector(".dropzone").style.visibility = "";
            document.querySelector(".dropzone").style.opacity = 1;
        }, false);

        window.addEventListener("drop", (e) => {
            e.preventDefault();
            this.loadImageFromDrop(e.dataTransfer.files);
            document.querySelector(".dropzone").style.visibility = "hidden";
            document.querySelector(".dropzone").style.opacity = 0;
        }, false);

        window.addEventListener("dragleave", (e) => {
            e.preventDefault();
            document.querySelector(".dropzone").style.visibility = "hidden";
            document.querySelector(".dropzone").style.opacity = 0;
        }, false);


        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight,
            0.1, 1000);
        this.camera.position.z = 32;
        this.camera.position.y = 1;

        this.renderer = new THREE.WebGLRenderer({logarithmicDepthBuffer: true, antialias: true});

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        let OrbitControls = require('three-orbit-controls')(THREE);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enablePan = false;
        this.controls.enableZoom = true;
        this.controls.minDistance = 8;
        this.controls.maxDistance = 32;

        let tex;
        if (this.touchDevice) {
            tex = new THREE.TextureLoader().load(bg2);
        } else {
            tex = new THREE.TextureLoader().load(bg);
        }
        this.scene.background = tex;

        this.raycaster = new THREE.Raycaster(); // create once
        this.mouse = new THREE.Vector2(); // create once
        this.mouse.x = -100;

        this.canvas = this.refs.canvas;
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = this.skinSize;
        this.canvas.height = this.skinSize;

        this.ctx.fillStyle = this.colors[this.state.colorSlot];
        this.updateBorders();

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }, false);

        document.addEventListener('mousemove', (e) => {
            this.mouse.x = ((e.clientX - this.renderer.domElement.offsetLeft) / this.renderer.domElement.clientWidth) * 2 - 1;
            this.mouse.y = -((e.clientY - this.renderer.domElement.offsetTop) / this.renderer.domElement.clientHeight) * 2 + 1;
        });
        document.addEventListener("touchmove", (e) => {
            e.preventDefault();
            e.stopPropagation();

            this.mouse.x = ((e.touches[0].clientX - this.renderer.domElement.offsetLeft) / this.renderer.domElement.clientWidth) * 2 - 1;
            this.mouse.y = -((e.touches[0].clientY - this.renderer.domElement.offsetTop) / this.renderer.domElement.clientHeight) * 2 + 1;


        }, {passive: false});

        document.addEventListener('keydown', (e) => {
            if (e.keyCode === 90 && e.ctrlKey) { // Undo ctrl-z
                this.undo();
            }
            if (e.keyCode === 89 && e.ctrlKey) { // Redo ctrl-y
                this.redo();
            }
        });

        if (!this.touchDevice) {
            document.addEventListener('mousedown', () => {
                this.mouseDown = true;
            });

            this.renderer.domElement.addEventListener('mouseup', () => {
                this.mouseDown = true;
                this.addAction();
            });

            document.addEventListener('mouseup', () => {
                this.mouseDown = false;
                this.drawing = false;
                this.dragging = false;
            });
        } else {
            this.renderer.domElement.addEventListener('touchend', () => {
                this.addAction();
            });
        }

        this.loadPreset(steve);
        this.animate();

        // Double Click Handler
        setInterval(() => {
            if (this.clickDelay > 0) {
                this.clickDelay -= 1;
            }
        }, 1000 / 10);

    };

    update = () => {
        let {colorSlot, mode} = this.state;
        let {raycaster, camera, controls} = this;
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
                                    this.ctx.fillRect(this.offsets[i].left.xOffset + Math.floor(intersects[0].uv.x * this.offsets[i].left.sizeX), this.offsets[i].left.yOffset + (this.offsets[i].left.sizeY - 1) - Math.floor(intersects[0].uv.y * this.offsets[i].left.sizeY), 1, 1);
                                    break;
                                case 1: // right
                                    this.ctx.fillRect(this.offsets[i].right.xOffset + Math.floor(intersects[0].uv.x * this.offsets[i].right.sizeX), this.offsets[i].right.yOffset + (this.offsets[i].right.sizeY - 1) - Math.floor(intersects[0].uv.y * this.offsets[i].right.sizeY), 1, 1);
                                    break;
                                case 2: // top
                                    this.ctx.fillRect(this.offsets[i].top.xOffset + Math.floor(intersects[0].uv.x * this.offsets[i].top.sizeX), this.offsets[i].top.yOffset + ((this.offsets[i].top.sizeY - 1) - Math.floor(intersects[0].uv.y * this.offsets[i].top.sizeY)), 1, 1);
                                    break;
                                case 3: // bot
                                    this.ctx.fillRect(this.offsets[i].bot.xOffset + Math.floor(intersects[0].uv.x * this.offsets[i].bot.sizeX), this.offsets[i].bot.yOffset + Math.floor(intersects[0].uv.y * this.offsets[i].bot.sizeY), 1, 1);
                                    break;
                                case 4: // front
                                    this.ctx.fillRect(this.offsets[i].front.xOffset + Math.floor(intersects[0].uv.x * this.offsets[i].front.sizeX), this.offsets[i].front.yOffset + ((this.offsets[i].front.sizeY - 1) - Math.floor(intersects[0].uv.y * this.offsets[i].front.sizeY)), 1, 1);
                                    break;
                                case 5: // back
                                    this.ctx.fillRect(this.offsets[i].back.xOffset + Math.floor(intersects[0].uv.x * this.offsets[i].back.sizeX), this.offsets[i].back.yOffset + ((this.offsets[i].back.sizeY - 1) - Math.floor(intersects[0].uv.y * this.offsets[i].back.sizeY)), 1, 1);
                                    break;
                                default:
                                    alert("Error! Please alert the developer!");
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
                                    this.ctx.clearRect(this.offsets[i].left.xOffset + Math.floor(intersects[0].uv.x * this.offsets[i].left.sizeX), this.offsets[i].left.yOffset + (this.offsets[i].left.sizeY - 1) - Math.floor(intersects[0].uv.y * this.offsets[i].left.sizeY), 1, 1);
                                    break;
                                case 1: // right
                                    this.ctx.clearRect(this.offsets[i].right.xOffset + Math.floor(intersects[0].uv.x * this.offsets[i].right.sizeX), this.offsets[i].right.yOffset + (this.offsets[i].right.sizeY - 1) - Math.floor(intersects[0].uv.y * this.offsets[i].right.sizeY), 1, 1);
                                    break;
                                case 2: // top
                                    this.ctx.clearRect(this.offsets[i].top.xOffset + Math.floor(intersects[0].uv.x * this.offsets[i].top.sizeX), this.offsets[i].top.yOffset + ((this.offsets[i].top.sizeY - 1) - Math.floor(intersects[0].uv.y * this.offsets[i].top.sizeY)), 1, 1);
                                    break;
                                case 3: // bot
                                    this.ctx.clearRect(this.offsets[i].bot.xOffset + Math.floor(intersects[0].uv.x * this.offsets[i].bot.sizeX), this.offsets[i].bot.yOffset + Math.floor(intersects[0].uv.y * this.offsets[i].bot.sizeY), 1, 1);
                                    break;
                                case 4: // front
                                    this.ctx.clearRect(this.offsets[i].front.xOffset + Math.floor(intersects[0].uv.x * this.offsets[i].front.sizeX), this.offsets[i].front.yOffset + ((this.offsets[i].front.sizeY - 1) - Math.floor(intersects[0].uv.y * this.offsets[i].front.sizeY)), 1, 1);
                                    break;
                                case 5: // back
                                    this.ctx.clearRect(this.offsets[i].back.xOffset + Math.floor(intersects[0].uv.x * this.offsets[i].back.sizeX), this.offsets[i].back.yOffset + ((this.offsets[i].back.sizeY - 1) - Math.floor(intersects[0].uv.y * this.offsets[i].back.sizeY)), 1, 1);
                                    break;
                                default:
                                    alert("Error! Please alert the developer!");
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
                                    p = this.ctx.getImageData(this.offsets[i].left.xOffset + ((this.offsets[i].left.sizeX - 1) - Math.floor(intersects[0].uv.x * this.offsets[i].left.sizeX)), this.offsets[i].left.yOffset + (this.offsets[i].left.sizeY - 1) - Math.floor(intersects[0].uv.y * this.offsets[i].left.sizeY), 1, 1).data;
                                    break;
                                case 1: // right
                                    p = this.ctx.getImageData(this.offsets[i].right.xOffset + ((this.offsets[i].right.sizeX - 1) - Math.floor(intersects[0].uv.x * this.offsets[i].right.sizeX)), this.offsets[i].right.yOffset + (this.offsets[i].right.sizeY - 1) - Math.floor(intersects[0].uv.y * this.offsets[i].right.sizeY), 1, 1).data;
                                    break;
                                case 2: // top
                                    p = this.ctx.getImageData(this.offsets[i].top.xOffset + Math.floor(intersects[0].uv.x * this.offsets[i].top.sizeX), this.offsets[i].top.yOffset + ((this.offsets[i].top.sizeY - 1) - Math.floor(intersects[0].uv.y * this.offsets[i].top.sizeY)), 1, 1).data;
                                    break;
                                case 3: // bot
                                    p = this.ctx.getImageData(this.offsets[i].bot.xOffset + Math.floor(intersects[0].uv.x * this.offsets[i].bot.sizeX), this.offsets[i].bot.yOffset + Math.floor(intersects[0].uv.y * this.offsets[i].bot.sizeY), 1, 1).data;
                                    break;
                                case 4: // front
                                    p = this.ctx.getImageData(this.offsets[i].front.xOffset + Math.floor(intersects[0].uv.x * this.offsets[i].front.sizeX), this.offsets[i].front.yOffset + ((this.offsets[i].front.sizeY - 1) - Math.floor(intersects[0].uv.y * this.offsets[i].front.sizeY)), 1, 1).data;
                                    break;
                                case 5: // back
                                    p = this.ctx.getImageData(this.offsets[i].back.xOffset + Math.floor(intersects[0].uv.x * this.offsets[i].back.sizeX), this.offsets[i].back.yOffset + ((this.offsets[i].back.sizeY - 1) - Math.floor(intersects[0].uv.y * this.offsets[i].back.sizeY)), 1, 1).data;
                                    break;
                                default:
                                    alert("Error! Please alert the developer!");
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
                                default:
                                    alert("Error! Please alert the developer!");
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
            default:
                alert("Error! Please alert the developer!");
                break;
        }
    };

    animate = () => {
        requestAnimationFrame(this.animate);
        this.camera.lookAt(0, 0);

        this.controls.update();
        this.renderer.render(this.scene, this.camera);

        for (let t = 0; t < this.textures.length; t++) {
            this.textures[t].needsUpdate = true;
        }

        this.update();
    };

    addGrid = (mesh, xSize, ySize, xCoord, yCoord, zCoord, plane, offset) => {
        let material = new THREE.LineBasicMaterial({color: 0x00000});

        if (plane === 0) {
            for (let i = 0; i < xSize + 1; i++) {
                let geo = new THREE.Geometry();
                geo.vertices.push(new THREE.Vector3(mesh.geometry.parameters.width * (i / xSize + xCoord), mesh.geometry.parameters.height * (yCoord), mesh.geometry.parameters.depth * (zCoord)));
                geo.vertices.push(new THREE.Vector3(mesh.geometry.parameters.width * (i / xSize + xCoord), mesh.geometry.parameters.height * (yCoord + 1), mesh.geometry.parameters.depth * (zCoord)));
                let line = new THREE.Line(geo, material);
                line.position.set(0, 0, offset);
                mesh.add(line);
            }

            for (let i = 0; i < ySize + 1; i++) {
                let geo = new THREE.Geometry();
                geo.vertices.push(new THREE.Vector3(mesh.geometry.parameters.width * (xCoord), mesh.geometry.parameters.height * (i / ySize + yCoord), mesh.geometry.parameters.depth * (zCoord)));
                geo.vertices.push(new THREE.Vector3(mesh.geometry.parameters.width * (xCoord + 1), mesh.geometry.parameters.height * (i / ySize + yCoord), mesh.geometry.parameters.depth * (zCoord)));
                let line = new THREE.Line(geo, material);
                line.position.set(offset, 0, 0);
                mesh.add(line);
            }
        } else if (plane === 1) {
            for (let i = 0; i < xSize + 1; i++) {
                let geo = new THREE.Geometry();
                geo.vertices.push(new THREE.Vector3(mesh.geometry.parameters.width * (xCoord), mesh.geometry.parameters.height * (yCoord + i / xSize), mesh.geometry.parameters.depth * (zCoord)));
                geo.vertices.push(new THREE.Vector3(mesh.geometry.parameters.width * (xCoord), mesh.geometry.parameters.height * (yCoord + i / xSize), mesh.geometry.parameters.depth * (zCoord + 1)));
                let line = new THREE.Line(geo, material);
                line.position.set(offset, 0, 0);
                mesh.add(line);
            }

            for (let i = 0; i < ySize + 1; i++) {
                let geo = new THREE.Geometry();
                geo.vertices.push(new THREE.Vector3(mesh.geometry.parameters.width * (xCoord), mesh.geometry.parameters.height * (yCoord), mesh.geometry.parameters.depth * (zCoord + i / ySize)));
                geo.vertices.push(new THREE.Vector3(mesh.geometry.parameters.width * (xCoord), mesh.geometry.parameters.height * (yCoord + 1), mesh.geometry.parameters.depth * (zCoord + i / ySize)));
                let line = new THREE.Line(geo, material);
                line.position.set(0, offset, 0);
                mesh.add(line);
            }
        } else if (plane === 2) {
            for (let i = 0; i < xSize + 1; i++) {
                let geo = new THREE.Geometry();
                geo.vertices.push(new THREE.Vector3(mesh.geometry.parameters.width * (xCoord), mesh.geometry.parameters.height * (yCoord), mesh.geometry.parameters.depth * (zCoord + i / xSize)));
                geo.vertices.push(new THREE.Vector3(mesh.geometry.parameters.width * (xCoord + 1), mesh.geometry.parameters.height * (yCoord), mesh.geometry.parameters.depth * (zCoord + i / xSize)));
                let line = new THREE.Line(geo, material);
                line.position.set(0, offset, 0);
                mesh.add(line);
            }

            for (let i = 0; i < ySize + 1; i++) {
                let geo = new THREE.Geometry();
                geo.vertices.push(new THREE.Vector3(mesh.geometry.parameters.width * (xCoord + i / ySize), mesh.geometry.parameters.height * (yCoord), mesh.geometry.parameters.depth * (zCoord)));
                geo.vertices.push(new THREE.Vector3(mesh.geometry.parameters.width * (xCoord + i / ySize), mesh.geometry.parameters.height * (yCoord), mesh.geometry.parameters.depth * (zCoord + 1)));
                let line = new THREE.Line(geo, material);
                line.position.set(0, 0, offset);
                mesh.add(line);
            }
        }
    };

    createBodyPart = (objRef, texture, leftParam, rightParam, topParam, botParam, frontParam, backParam, dims) => {
        let left = texture.clone();
        let right = texture.clone();
        let top = texture.clone();
        let bot = texture.clone();
        let front = texture.clone();
        let back = texture.clone();

        left.repeat.set(leftParam.sizeX / this.skinSize, leftParam.sizeY / this.skinSize);
        left.offset.x = leftParam.xOffset / this.skinSize;
        left.offset.y = 1 - (leftParam.sizeY / this.skinSize) - (leftParam.yOffset / this.skinSize);

        right.repeat.set(rightParam.sizeX / this.skinSize, rightParam.sizeY / this.skinSize);
        right.offset.x = rightParam.xOffset / this.skinSize;
        right.offset.y = 1 - (rightParam.sizeY / this.skinSize) - (rightParam.yOffset / this.skinSize);

        top.repeat.set(topParam.sizeX / this.skinSize, topParam.sizeY / this.skinSize);
        top.offset.x = topParam.xOffset / this.skinSize;
        top.offset.y = 1 - (topParam.sizeY / this.skinSize) - (topParam.yOffset / this.skinSize);

        bot.repeat.set(botParam.sizeX / this.skinSize, -botParam.sizeY / this.skinSize);
        bot.offset.x = botParam.xOffset / this.skinSize;
        bot.offset.y = 1 - (botParam.sizeY / this.skinSize) - (botParam.yOffset / this.skinSize) + botParam.sizeY / this.skinSize;

        front.repeat.set(frontParam.sizeX / this.skinSize, frontParam.sizeY / this.skinSize);
        front.offset.x = frontParam.xOffset / this.skinSize;
        front.offset.y = 1 - (frontParam.sizeY / this.skinSize) - (frontParam.yOffset / this.skinSize);

        back.repeat.set(backParam.sizeX / this.skinSize, backParam.sizeY / this.skinSize);
        back.offset.x = backParam.xOffset / this.skinSize;
        back.offset.y = 1 - (backParam.sizeY / this.skinSize) - (backParam.yOffset / this.skinSize);

        this.textures.push(left);
        this.textures.push(right);
        this.textures.push(top);
        this.textures.push(bot);
        this.textures.push(front);
        this.textures.push(back);

        let material = [new THREE.MeshBasicMaterial({
            map: left,
            transparent: true
        }), new THREE.MeshBasicMaterial({map: right, transparent: true}), new THREE.MeshBasicMaterial({
            map: top,
            transparent: true
        }), new THREE.MeshBasicMaterial({map: bot, transparent: true}), new THREE.MeshBasicMaterial({
            map: front,
            transparent: true
        }), new THREE.MeshBasicMaterial({map: back, transparent: true})];

        let geometry = new THREE.BoxBufferGeometry(dims.x, dims.y, dims.z);

        if (dims.isOuter) {
            geometry = new THREE.BoxBufferGeometry(dims.x + 0.5, dims.y + 0.5, dims.z + 0.5);
        }

        let obj = new THREE.Mesh(geometry, material);
        this.offsets.push({
            object: obj,
            left: leftParam,
            right: rightParam,
            top: topParam,
            bot: botParam,
            front: frontParam,
            back: backParam
        });

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
            {
                sizeX: 8 * (this.skinSize / 64),
                sizeY: 8 * (this.skinSize / 64),
                xOffset: 16 * (this.skinSize / 64),
                yOffset: 8 * (this.skinSize / 64)
            },
            {
                sizeX: 8 * (this.skinSize / 64),
                sizeY: 8 * (this.skinSize / 64),
                xOffset: 0,
                yOffset: 8 * (this.skinSize / 64)
            },
            {
                sizeX: 8 * (this.skinSize / 64),
                sizeY: 8 * (this.skinSize / 64),
                xOffset: 8 * (this.skinSize / 64),
                yOffset: 0
            },
            {
                sizeX: 8 * (this.skinSize / 64),
                sizeY: 8 * (this.skinSize / 64),
                xOffset: 16 * (this.skinSize / 64),
                yOffset: 0
            },
            {
                sizeX: 8 * (this.skinSize / 64),
                sizeY: 8 * (this.skinSize / 64),
                xOffset: 8 * (this.skinSize / 64),
                yOffset: 8 * (this.skinSize / 64)
            },
            {
                sizeX: 8 * (this.skinSize / 64),
                sizeY: 8 * (this.skinSize / 64),
                xOffset: 24 * (this.skinSize / 64),
                yOffset: 8 * (this.skinSize / 64)
            },
            {x: 8, y: 8, z: 8, isOuter: false});

        this.headOuter = this.createBodyPart(this.headOuter, texture,
            {
                sizeX: 8 * (this.skinSize / 64),
                sizeY: 8 * (this.skinSize / 64),
                xOffset: 48 * (this.skinSize / 64),
                yOffset: 8 * (this.skinSize / 64)
            },
            {
                sizeX: 8 * (this.skinSize / 64),
                sizeY: 8 * (this.skinSize / 64),
                xOffset: 32 * (this.skinSize / 64),
                yOffset: 8 * (this.skinSize / 64)
            },
            {
                sizeX: 8 * (this.skinSize / 64),
                sizeY: 8 * (this.skinSize / 64),
                xOffset: 40 * (this.skinSize / 64),
                yOffset: 0
            },
            {
                sizeX: 8 * (this.skinSize / 64),
                sizeY: 8 * (this.skinSize / 64),
                xOffset: 48 * (this.skinSize / 64),
                yOffset: 0
            },
            {
                sizeX: 8 * (this.skinSize / 64),
                sizeY: 8 * (this.skinSize / 64),
                xOffset: 40 * (this.skinSize / 64),
                yOffset: 8 * (this.skinSize / 64)
            },
            {
                sizeX: 8 * (this.skinSize / 64),
                sizeY: 8 * (this.skinSize / 64),
                xOffset: 56 * (this.skinSize / 64),
                yOffset: 8 * (this.skinSize / 64)
            },
            {x: 8, y: 8, z: 8, isOuter: true});

        this.chest = this.createBodyPart(this.chest, texture,
            {
                sizeX: 4 * (this.skinSize / 64),
                sizeY: 12 * (this.skinSize / 64),
                xOffset: 28 * (this.skinSize / 64),
                yOffset: 20 * (this.skinSize / 64)
            },
            {
                sizeX: 4 * (this.skinSize / 64),
                sizeY: 12 * (this.skinSize / 64),
                xOffset: 16 * (this.skinSize / 64),
                yOffset: 20 * (this.skinSize / 64)
            },
            {
                sizeX: 8 * (this.skinSize / 64),
                sizeY: 4 * (this.skinSize / 64),
                xOffset: 20 * (this.skinSize / 64),
                yOffset: 16 * (this.skinSize / 64)
            },
            {
                sizeX: 8 * (this.skinSize / 64),
                sizeY: 4 * (this.skinSize / 64),
                xOffset: 28 * (this.skinSize / 64),
                yOffset: 16 * (this.skinSize / 64)
            },
            {
                sizeX: 8 * (this.skinSize / 64),
                sizeY: 12 * (this.skinSize / 64),
                xOffset: 20 * (this.skinSize / 64),
                yOffset: 20 * (this.skinSize / 64)
            },
            {
                sizeX: 8 * (this.skinSize / 64),
                sizeY: 12 * (this.skinSize / 64),
                xOffset: 32 * (this.skinSize / 64),
                yOffset: 20 * (this.skinSize / 64)
            },
            {x: 8, y: 12, z: 4, isOuter: false});

        this.chestOuter = this.createBodyPart(this.chestOuter, texture,
            {
                sizeX: 4 * (this.skinSize / 64),
                sizeY: 12 * (this.skinSize / 64),
                xOffset: 28 * (this.skinSize / 64),
                yOffset: 36 * (this.skinSize / 64)
            },
            {
                sizeX: 4 * (this.skinSize / 64),
                sizeY: 12 * (this.skinSize / 64),
                xOffset: 16 * (this.skinSize / 64),
                yOffset: 36 * (this.skinSize / 64)
            },
            {
                sizeX: 8 * (this.skinSize / 64),
                sizeY: 4 * (this.skinSize / 64),
                xOffset: 20 * (this.skinSize / 64),
                yOffset: 32 * (this.skinSize / 64)
            },
            {
                sizeX: 8 * (this.skinSize / 64),
                sizeY: 4 * (this.skinSize / 64),
                xOffset: 28 * (this.skinSize / 64),
                yOffset: 32 * (this.skinSize / 64)
            },
            {
                sizeX: 8 * (this.skinSize / 64),
                sizeY: 12 * (this.skinSize / 64),
                xOffset: 20 * (this.skinSize / 64),
                yOffset: 36 * (this.skinSize / 64)
            },
            {
                sizeX: 8 * (this.skinSize / 64),
                sizeY: 12 * (this.skinSize / 64),
                xOffset: 32 * (this.skinSize / 64),
                yOffset: 36 * (this.skinSize / 64)
            },
            {x: 8, y: 12, z: 4, isOuter: true});

        if (this.isAlex) {
            this.armL = this.createBodyPart(this.armL, texture,
                {
                    sizeX: 4 * (this.skinSize / 64),
                    sizeY: 12 * (this.skinSize / 64),
                    xOffset: 39 * (this.skinSize / 64),
                    yOffset: 52 * (this.skinSize / 64)
                },
                {
                    sizeX: 4 * (this.skinSize / 64),
                    sizeY: 12 * (this.skinSize / 64),
                    xOffset: 32 * (this.skinSize / 64),
                    yOffset: 52 * (this.skinSize / 64)
                },
                {
                    sizeX: 3 * (this.skinSize / 64),
                    sizeY: 4 * (this.skinSize / 64),
                    xOffset: 36 * (this.skinSize / 64),
                    yOffset: 48 * (this.skinSize / 64)
                },
                {
                    sizeX: 3 * (this.skinSize / 64),
                    sizeY: 4 * (this.skinSize / 64),
                    xOffset: 39 * (this.skinSize / 64),
                    yOffset: 48 * (this.skinSize / 64)
                },
                {
                    sizeX: 3 * (this.skinSize / 64),
                    sizeY: 12 * (this.skinSize / 64),
                    xOffset: 36 * (this.skinSize / 64),
                    yOffset: 52 * (this.skinSize / 64)
                },
                {
                    sizeX: 3 * (this.skinSize / 64),
                    sizeY: 12 * (this.skinSize / 64),
                    xOffset: 43 * (this.skinSize / 64),
                    yOffset: 52 * (this.skinSize / 64)
                },
                {x: 3, y: 12, z: 4, isOuter: false});

            this.armLOuter = this.createBodyPart(this.armLOuter, texture,
                {
                    sizeX: 4 * (this.skinSize / 64),
                    sizeY: 12 * (this.skinSize / 64),
                    xOffset: 55 * (this.skinSize / 64),
                    yOffset: 52 * (this.skinSize / 64)
                },
                {
                    sizeX: 4 * (this.skinSize / 64),
                    sizeY: 12 * (this.skinSize / 64),
                    xOffset: 48 * (this.skinSize / 64),
                    yOffset: 52 * (this.skinSize / 64)
                },
                {
                    sizeX: 3 * (this.skinSize / 64),
                    sizeY: 4 * (this.skinSize / 64),
                    xOffset: 52 * (this.skinSize / 64),
                    yOffset: 48 * (this.skinSize / 64)
                },
                {
                    sizeX: 3 * (this.skinSize / 64),
                    sizeY: 4 * (this.skinSize / 64),
                    xOffset: 55 * (this.skinSize / 64),
                    yOffset: 48 * (this.skinSize / 64)
                },
                {
                    sizeX: 3 * (this.skinSize / 64),
                    sizeY: 12 * (this.skinSize / 64),
                    xOffset: 52 * (this.skinSize / 64),
                    yOffset: 52 * (this.skinSize / 64)
                },
                {
                    sizeX: 3 * (this.skinSize / 64),
                    sizeY: 12 * (this.skinSize / 64),
                    xOffset: 59 * (this.skinSize / 64),
                    yOffset: 52 * (this.skinSize / 64)
                },
                {x: 3, y: 12, z: 4, isOuter: true});

            this.armR = this.createBodyPart(this.armR, texture,
                {
                    sizeX: 4 * (this.skinSize / 64),
                    sizeY: 12 * (this.skinSize / 64),
                    xOffset: 47 * (this.skinSize / 64),
                    yOffset: 20 * (this.skinSize / 64)
                },
                {
                    sizeX: 4 * (this.skinSize / 64),
                    sizeY: 12 * (this.skinSize / 64),
                    xOffset: 40 * (this.skinSize / 64),
                    yOffset: 20 * (this.skinSize / 64)
                },
                {
                    sizeX: 3 * (this.skinSize / 64),
                    sizeY: 4 * (this.skinSize / 64),
                    xOffset: 44 * (this.skinSize / 64),
                    yOffset: 16 * (this.skinSize / 64)
                },
                {
                    sizeX: 3 * (this.skinSize / 64),
                    sizeY: 4 * (this.skinSize / 64),
                    xOffset: 47 * (this.skinSize / 64),
                    yOffset: 16 * (this.skinSize / 64)
                },
                {
                    sizeX: 3 * (this.skinSize / 64),
                    sizeY: 12 * (this.skinSize / 64),
                    xOffset: 44 * (this.skinSize / 64),
                    yOffset: 20 * (this.skinSize / 64)
                },
                {
                    sizeX: 3 * (this.skinSize / 64),
                    sizeY: 12 * (this.skinSize / 64),
                    xOffset: 51 * (this.skinSize / 64),
                    yOffset: 20 * (this.skinSize / 64)
                },
                {x: 3, y: 12, z: 4, isOuter: false});

            this.armROuter = this.createBodyPart(this.armROuter, texture,
                {
                    sizeX: 4 * (this.skinSize / 64),
                    sizeY: 12 * (this.skinSize / 64),
                    xOffset: 47 * (this.skinSize / 64),
                    yOffset: 36 * (this.skinSize / 64)
                },
                {
                    sizeX: 4 * (this.skinSize / 64),
                    sizeY: 12 * (this.skinSize / 64),
                    xOffset: 40 * (this.skinSize / 64),
                    yOffset: 36 * (this.skinSize / 64)
                },
                {
                    sizeX: 3 * (this.skinSize / 64),
                    sizeY: 4 * (this.skinSize / 64),
                    xOffset: 44 * (this.skinSize / 64),
                    yOffset: 32 * (this.skinSize / 64)
                },
                {
                    sizeX: 3 * (this.skinSize / 64),
                    sizeY: 4 * (this.skinSize / 64),
                    xOffset: 47 * (this.skinSize / 64),
                    yOffset: 32 * (this.skinSize / 64)
                },
                {
                    sizeX: 3 * (this.skinSize / 64),
                    sizeY: 12 * (this.skinSize / 64),
                    xOffset: 44 * (this.skinSize / 64),
                    yOffset: 36 * (this.skinSize / 64)
                },
                {
                    sizeX: 3 * (this.skinSize / 64),
                    sizeY: 12 * (this.skinSize / 64),
                    xOffset: 51 * (this.skinSize / 64),
                    yOffset: 36 * (this.skinSize / 64)
                },
                {x: 3, y: 12, z: 4, isOuter: true});
        } else {
            this.armL = this.createBodyPart(this.armL, texture,
                {
                    sizeX: 4 * (this.skinSize / 64),
                    sizeY: 12 * (this.skinSize / 64),
                    xOffset: 40 * (this.skinSize / 64),
                    yOffset: 52 * (this.skinSize / 64)
                },
                {
                    sizeX: 4 * (this.skinSize / 64),
                    sizeY: 12 * (this.skinSize / 64),
                    xOffset: 32 * (this.skinSize / 64),
                    yOffset: 52 * (this.skinSize / 64)
                },
                {
                    sizeX: 4 * (this.skinSize / 64),
                    sizeY: 4 * (this.skinSize / 64),
                    xOffset: 36 * (this.skinSize / 64),
                    yOffset: 48 * (this.skinSize / 64)
                },
                {
                    sizeX: 4 * (this.skinSize / 64),
                    sizeY: 4 * (this.skinSize / 64),
                    xOffset: 40 * (this.skinSize / 64),
                    yOffset: 48 * (this.skinSize / 64)
                },
                {
                    sizeX: 4 * (this.skinSize / 64),
                    sizeY: 12 * (this.skinSize / 64),
                    xOffset: 36 * (this.skinSize / 64),
                    yOffset: 52 * (this.skinSize / 64)
                },
                {
                    sizeX: 4 * (this.skinSize / 64),
                    sizeY: 12 * (this.skinSize / 64),
                    xOffset: 44 * (this.skinSize / 64),
                    yOffset: 52 * (this.skinSize / 64)
                },
                {x: 4, y: 12, z: 4, isOuter: false});

            this.armLOuter = this.createBodyPart(this.armLOuter, texture,
                {
                    sizeX: 4 * (this.skinSize / 64),
                    sizeY: 12 * (this.skinSize / 64),
                    xOffset: 56 * (this.skinSize / 64),
                    yOffset: 52 * (this.skinSize / 64)
                },
                {
                    sizeX: 4 * (this.skinSize / 64),
                    sizeY: 12 * (this.skinSize / 64),
                    xOffset: 48 * (this.skinSize / 64),
                    yOffset: 52 * (this.skinSize / 64)
                },
                {
                    sizeX: 4 * (this.skinSize / 64),
                    sizeY: 4 * (this.skinSize / 64),
                    xOffset: 52 * (this.skinSize / 64),
                    yOffset: 48 * (this.skinSize / 64)
                },
                {
                    sizeX: 4 * (this.skinSize / 64),
                    sizeY: 4 * (this.skinSize / 64),
                    xOffset: 56 * (this.skinSize / 64),
                    yOffset: 48 * (this.skinSize / 64)
                },
                {
                    sizeX: 4 * (this.skinSize / 64),
                    sizeY: 12 * (this.skinSize / 64),
                    xOffset: 52 * (this.skinSize / 64),
                    yOffset: 52 * (this.skinSize / 64)
                },
                {
                    sizeX: 4 * (this.skinSize / 64),
                    sizeY: 12 * (this.skinSize / 64),
                    xOffset: 60 * (this.skinSize / 64),
                    yOffset: 52 * (this.skinSize / 64)
                },
                {x: 4, y: 12, z: 4, isOuter: true});

            this.armR = this.createBodyPart(this.armR, texture,
                {
                    sizeX: 4 * (this.skinSize / 64),
                    sizeY: 12 * (this.skinSize / 64),
                    xOffset: 48 * (this.skinSize / 64),
                    yOffset: 20 * (this.skinSize / 64)
                },
                {
                    sizeX: 4 * (this.skinSize / 64),
                    sizeY: 12 * (this.skinSize / 64),
                    xOffset: 40 * (this.skinSize / 64),
                    yOffset: 20 * (this.skinSize / 64)
                },
                {
                    sizeX: 4 * (this.skinSize / 64),
                    sizeY: 4 * (this.skinSize / 64),
                    xOffset: 44 * (this.skinSize / 64),
                    yOffset: 16 * (this.skinSize / 64)
                },
                {
                    sizeX: 4 * (this.skinSize / 64),
                    sizeY: 4 * (this.skinSize / 64),
                    xOffset: 48 * (this.skinSize / 64),
                    yOffset: 16 * (this.skinSize / 64)
                },
                {
                    sizeX: 4 * (this.skinSize / 64),
                    sizeY: 12 * (this.skinSize / 64),
                    xOffset: 44 * (this.skinSize / 64),
                    yOffset: 20 * (this.skinSize / 64)
                },
                {
                    sizeX: 4 * (this.skinSize / 64),
                    sizeY: 12 * (this.skinSize / 64),
                    xOffset: 52 * (this.skinSize / 64),
                    yOffset: 20 * (this.skinSize / 64)
                },
                {x: 4, y: 12, z: 4, isOuter: false});

            this.armROuter = this.createBodyPart(this.armROuter, texture,
                {
                    sizeX: 4 * (this.skinSize / 64),
                    sizeY: 12 * (this.skinSize / 64),
                    xOffset: 48 * (this.skinSize / 64),
                    yOffset: 36 * (this.skinSize / 64)
                },
                {
                    sizeX: 4 * (this.skinSize / 64),
                    sizeY: 12 * (this.skinSize / 64),
                    xOffset: 40 * (this.skinSize / 64),
                    yOffset: 36 * (this.skinSize / 64)
                },
                {
                    sizeX: 4 * (this.skinSize / 64),
                    sizeY: 4 * (this.skinSize / 64),
                    xOffset: 44 * (this.skinSize / 64),
                    yOffset: 32 * (this.skinSize / 64)
                },
                {
                    sizeX: 4 * (this.skinSize / 64),
                    sizeY: 4 * (this.skinSize / 64),
                    xOffset: 48 * (this.skinSize / 64),
                    yOffset: 32 * (this.skinSize / 64)
                },
                {
                    sizeX: 4 * (this.skinSize / 64),
                    sizeY: 12 * (this.skinSize / 64),
                    xOffset: 44 * (this.skinSize / 64),
                    yOffset: 36 * (this.skinSize / 64)
                },
                {
                    sizeX: 4 * (this.skinSize / 64),
                    sizeY: 12 * (this.skinSize / 64),
                    xOffset: 52 * (this.skinSize / 64),
                    yOffset: 36 * (this.skinSize / 64)
                },
                {x: 4, y: 12, z: 4, isOuter: true});
        }

        this.legL = this.createBodyPart(this.legL, texture,
            {
                sizeX: 4 * (this.skinSize / 64),
                sizeY: 12 * (this.skinSize / 64),
                xOffset: 24 * (this.skinSize / 64),
                yOffset: 52 * (this.skinSize / 64)
            },
            {
                sizeX: 4 * (this.skinSize / 64),
                sizeY: 12 * (this.skinSize / 64),
                xOffset: 16 * (this.skinSize / 64),
                yOffset: 52 * (this.skinSize / 64)
            },
            {
                sizeX: 4 * (this.skinSize / 64),
                sizeY: 4 * (this.skinSize / 64),
                xOffset: 20 * (this.skinSize / 64),
                yOffset: 48 * (this.skinSize / 64)
            },
            {
                sizeX: 4 * (this.skinSize / 64),
                sizeY: 4 * (this.skinSize / 64),
                xOffset: 24 * (this.skinSize / 64),
                yOffset: 48 * (this.skinSize / 64)
            },
            {
                sizeX: 4 * (this.skinSize / 64),
                sizeY: 12 * (this.skinSize / 64),
                xOffset: 20 * (this.skinSize / 64),
                yOffset: 52 * (this.skinSize / 64)
            },
            {
                sizeX: 4 * (this.skinSize / 64),
                sizeY: 12 * (this.skinSize / 64),
                xOffset: 28 * (this.skinSize / 64),
                yOffset: 52 * (this.skinSize / 64)
            },
            {x: 4, y: 12, z: 4, isOuter: false});

        this.legLOuter = this.createBodyPart(this.legLOuter, texture,
            {
                sizeX: 4 * (this.skinSize / 64),
                sizeY: 12 * (this.skinSize / 64),
                xOffset: 8 * (this.skinSize / 64),
                yOffset: 52 * (this.skinSize / 64)
            },
            {
                sizeX: 4 * (this.skinSize / 64),
                sizeY: 12 * (this.skinSize / 64),
                xOffset: 0,
                yOffset: 52 * (this.skinSize / 64)
            },
            {
                sizeX: 4 * (this.skinSize / 64),
                sizeY: 4 * (this.skinSize / 64),
                xOffset: 4 * (this.skinSize / 64),
                yOffset: 48 * (this.skinSize / 64)
            },
            {
                sizeX: 4 * (this.skinSize / 64),
                sizeY: 4 * (this.skinSize / 64),
                xOffset: 8 * (this.skinSize / 64),
                yOffset: 48 * (this.skinSize / 64)
            },
            {
                sizeX: 4 * (this.skinSize / 64),
                sizeY: 12 * (this.skinSize / 64),
                xOffset: 4 * (this.skinSize / 64),
                yOffset: 52 * (this.skinSize / 64)
            },
            {
                sizeX: 4 * (this.skinSize / 64),
                sizeY: 12 * (this.skinSize / 64),
                xOffset: 12 * (this.skinSize / 64),
                yOffset: 52 * (this.skinSize / 64)
            },
            {x: 4, y: 12, z: 4, isOuter: true});

        this.legR = this.createBodyPart(this.legR, texture,
            {
                sizeX: 4 * (this.skinSize / 64),
                sizeY: 12 * (this.skinSize / 64),
                xOffset: 8 * (this.skinSize / 64),
                yOffset: 20 * (this.skinSize / 64)
            },
            {
                sizeX: 4 * (this.skinSize / 64),
                sizeY: 12 * (this.skinSize / 64),
                xOffset: 0,
                yOffset: 20 * (this.skinSize / 64)
            },
            {
                sizeX: 4 * (this.skinSize / 64),
                sizeY: 4 * (this.skinSize / 64),
                xOffset: 4 * (this.skinSize / 64),
                yOffset: 16 * (this.skinSize / 64)
            },
            {
                sizeX: 4 * (this.skinSize / 64),
                sizeY: 4 * (this.skinSize / 64),
                xOffset: 8 * (this.skinSize / 64),
                yOffset: 16 * (this.skinSize / 64)
            },
            {
                sizeX: 4 * (this.skinSize / 64),
                sizeY: 12 * (this.skinSize / 64),
                xOffset: 4 * (this.skinSize / 64),
                yOffset: 20 * (this.skinSize / 64)
            },
            {
                sizeX: 4 * (this.skinSize / 64),
                sizeY: 12 * (this.skinSize / 64),
                xOffset: 12 * (this.skinSize / 64),
                yOffset: 20 * (this.skinSize / 64)
            },
            {x: 4, y: 12, z: 4, isOuter: false});

        this.legROuter = this.createBodyPart(this.legROuter, texture,
            {
                sizeX: 4 * (this.skinSize / 64),
                sizeY: 12 * (this.skinSize / 64),
                xOffset: 8 * (this.skinSize / 64),
                yOffset: 36 * (this.skinSize / 64)
            },
            {
                sizeX: 4 * (this.skinSize / 64),
                sizeY: 12 * (this.skinSize / 64),
                xOffset: 0,
                yOffset: 36 * (this.skinSize / 64)
            },
            {
                sizeX: 4 * (this.skinSize / 64),
                sizeY: 4 * (this.skinSize / 64),
                xOffset: 4 * (this.skinSize / 64),
                yOffset: 32 * (this.skinSize / 64)
            },
            {
                sizeX: 4 * (this.skinSize / 64),
                sizeY: 4 * (this.skinSize / 64),
                xOffset: 8 * (this.skinSize / 64),
                yOffset: 32 * (this.skinSize / 64)
            },
            {
                sizeX: 4 * (this.skinSize / 64),
                sizeY: 12 * (this.skinSize / 64),
                xOffset: 4 * (this.skinSize / 64),
                yOffset: 36 * (this.skinSize / 64)
            },
            {
                sizeX: 4 * (this.skinSize / 64),
                sizeY: 12 * (this.skinSize / 64),
                xOffset: 12 * (this.skinSize / 64),
                yOffset: 36 * (this.skinSize / 64)
            },
            {x: 4, y: 12, z: 4, isOuter: true});

        this.showFull();
    };

    addInnerGrid = () => {
        [this.head,].forEach((i) => {
            this.addGrid(i, 8 * (this.skinSize / 64), 8 * (this.skinSize / 64), -1 / 2, -1 / 2, -1 / 2, 0, -0.05);
            this.addGrid(i, 8 * (this.skinSize / 64), 8 * (this.skinSize / 64), -1 / 2, -1 / 2, 1 / 2, 0, 0.05);
            this.addGrid(i, 8 * (this.skinSize / 64), 8 * (this.skinSize / 64), -1 / 2, -1 / 2, -1 / 2, 1, -0.05);
            this.addGrid(i, 8 * (this.skinSize / 64), 8 * (this.skinSize / 64), 1 / 2, -1 / 2, -1 / 2, 1, 0.05);
            this.addGrid(i, 8 * (this.skinSize / 64), 8 * (this.skinSize / 64), -1 / 2, -1 / 2, -1 / 2, 2, -0.05);
            this.addGrid(i, 8 * (this.skinSize / 64), 8 * (this.skinSize / 64), -1 / 2, 1 / 2, -1 / 2, 2, 0.05);
        });

        [this.chest].forEach((i) => {
            this.addGrid(i, 8 * (this.skinSize / 64), 12 * (this.skinSize / 64), -1 / 2, -1 / 2, -1 / 2, 0, -0.1);
            this.addGrid(i, 8 * (this.skinSize / 64), 12 * (this.skinSize / 64), -1 / 2, -1 / 2, 1 / 2, 0, 0.1);
            this.addGrid(i, 12 * (this.skinSize / 64), 4 * (this.skinSize / 64), -1 / 2, -1 / 2, -1 / 2, 1, -0.1);
            this.addGrid(i, 12 * (this.skinSize / 64), 4 * (this.skinSize / 64), 1 / 2, -1 / 2, -1 / 2, 1, 0.1);
            this.addGrid(i, 4 * (this.skinSize / 64), 8 * (this.skinSize / 64), -1 / 2, -1 / 2, -1 / 2, 2, -0.1);
            this.addGrid(i, 4 * (this.skinSize / 64), 8 * (this.skinSize / 64), -1 / 2, 1 / 2, -1 / 2, 2, 0.1);
        });

        [this.armL, this.armR].forEach((i) => {
            if (this.isAlex) {
                this.addGrid(i, 3 * (this.skinSize / 64), 12 * (this.skinSize / 64), -1 / 2, -1 / 2, -1 / 2, 0, -0.1);
                this.addGrid(i, 3 * (this.skinSize / 64), 12 * (this.skinSize / 64), -1 / 2, -1 / 2, 1 / 2, 0, 0.1);
            } else {
                this.addGrid(i, 4 * (this.skinSize / 64), 12 * (this.skinSize / 64), -1 / 2, -1 / 2, -1 / 2, 0, -0.1);
                this.addGrid(i, 4 * (this.skinSize / 64), 12 * (this.skinSize / 64), -1 / 2, -1 / 2, 1 / 2, 0, 0.1);
            }

            this.addGrid(i, 12 * (this.skinSize / 64), 4 * (this.skinSize / 64), -1 / 2, -1 / 2, -1 / 2, 1, -0.1);
            this.addGrid(i, 12 * (this.skinSize / 64), 4 * (this.skinSize / 64), 1 / 2, -1 / 2, -1 / 2, 1, 0.1);
            this.addGrid(i, 4 * (this.skinSize / 64), 4 * (this.skinSize / 64), -1 / 2, -1 / 2, -1 / 2, 2, -0.1);
            this.addGrid(i, 4 * (this.skinSize / 64), 4 * (this.skinSize / 64), -1 / 2, 1 / 2, -1 / 2, 2, 0.1);
        });

        [this.legL, this.legR].forEach((i) => {
            this.addGrid(i, 4 * (this.skinSize / 64), 12 * (this.skinSize / 64), -1 / 2, -1 / 2, -1 / 2, 0, -0.1);
            this.addGrid(i, 4 * (this.skinSize / 64), 12 * (this.skinSize / 64), -1 / 2, -1 / 2, 1 / 2, 0, 0.1);
            this.addGrid(i, 12 * (this.skinSize / 64), 4 * (this.skinSize / 64), -1 / 2, -1 / 2, -1 / 2, 1, -0.1);
            this.addGrid(i, 12 * (this.skinSize / 64), 4 * (this.skinSize / 64), 1 / 2, -1 / 2, -1 / 2, 1, 0.1);
            this.addGrid(i, 4 * (this.skinSize / 64), 4 * (this.skinSize / 64), -1 / 2, -1 / 2, -1 / 2, 2, -0.1);
            this.addGrid(i, 4 * (this.skinSize / 64), 4 * (this.skinSize / 64), -1 / 2, 1 / 2, -1 / 2, 2, 0.1);
        });
        this.setState({innerGrid: true});
    };

    addOuterGrid = () => {
        [this.headOuter].forEach((i) => {
            this.addGrid(i, 8 * (this.skinSize / 64), 8 * (this.skinSize / 64), -1 / 2, -1 / 2, -1 / 2, 0, -0.05);
            this.addGrid(i, 8 * (this.skinSize / 64), 8 * (this.skinSize / 64), -1 / 2, -1 / 2, 1 / 2, 0, 0.05);
            this.addGrid(i, 8 * (this.skinSize / 64), 8 * (this.skinSize / 64), -1 / 2, -1 / 2, -1 / 2, 1, -0.05);
            this.addGrid(i, 8 * (this.skinSize / 64), 8 * (this.skinSize / 64), 1 / 2, -1 / 2, -1 / 2, 1, 0.05);
            this.addGrid(i, 8 * (this.skinSize / 64), 8 * (this.skinSize / 64), -1 / 2, -1 / 2, -1 / 2, 2, -0.05);
            this.addGrid(i, 8 * (this.skinSize / 64), 8 * (this.skinSize / 64), -1 / 2, 1 / 2, -1 / 2, 2, 0.05);
        });

        [this.chestOuter].forEach((i) => {
            this.addGrid(i, 8 * (this.skinSize / 64), 12 * (this.skinSize / 64), -1 / 2, -1 / 2, -1 / 2, 0, -0.1);
            this.addGrid(i, 8 * (this.skinSize / 64), 12 * (this.skinSize / 64), -1 / 2, -1 / 2, 1 / 2, 0, 0.1);
            this.addGrid(i, 12 * (this.skinSize / 64), 4 * (this.skinSize / 64), -1 / 2, -1 / 2, -1 / 2, 1, -0.1);
            this.addGrid(i, 12 * (this.skinSize / 64), 4 * (this.skinSize / 64), 1 / 2, -1 / 2, -1 / 2, 1, 0.1);
            this.addGrid(i, 4 * (this.skinSize / 64), 8 * (this.skinSize / 64), -1 / 2, -1 / 2, -1 / 2, 2, -0.1);
            this.addGrid(i, 4 * (this.skinSize / 64), 8 * (this.skinSize / 64), -1 / 2, 1 / 2, -1 / 2, 2, 0.1);
        });

        [this.armLOuter, this.armROuter].forEach((i) => {
            if (this.isAlex) {
                this.addGrid(i, 3 * (this.skinSize / 64), 12 * (this.skinSize / 64), -1 / 2, -1 / 2, -1 / 2, 0, -0.1);
                this.addGrid(i, 3 * (this.skinSize / 64), 12 * (this.skinSize / 64), -1 / 2, -1 / 2, 1 / 2, 0, 0.1);
            } else {
                this.addGrid(i, 4 * (this.skinSize / 64), 12 * (this.skinSize / 64), -1 / 2, -1 / 2, -1 / 2, 0, -0.1);
                this.addGrid(i, 4 * (this.skinSize / 64), 12 * (this.skinSize / 64), -1 / 2, -1 / 2, 1 / 2, 0, 0.1);
            }

            this.addGrid(i, 12 * (this.skinSize / 64), 4 * (this.skinSize / 64), -1 / 2, -1 / 2, -1 / 2, 1, -0.1);
            this.addGrid(i, 12 * (this.skinSize / 64), 4 * (this.skinSize / 64), 1 / 2, -1 / 2, -1 / 2, 1, 0.1);
            this.addGrid(i, 4 * (this.skinSize / 64), 4 * (this.skinSize / 64), -1 / 2, -1 / 2, -1 / 2, 2, -0.1);
            this.addGrid(i, 4 * (this.skinSize / 64), 4 * (this.skinSize / 64), -1 / 2, 1 / 2, -1 / 2, 2, 0.1);
        });

        [this.legLOuter, this.legROuter].forEach((i) => {
            this.addGrid(i, 4 * (this.skinSize / 64), 12 * (this.skinSize / 64), -1 / 2, -1 / 2, -1 / 2, 0, -0.1);
            this.addGrid(i, 4 * (this.skinSize / 64), 12 * (this.skinSize / 64), -1 / 2, -1 / 2, 1 / 2, 0, 0.1);
            this.addGrid(i, 12 * (this.skinSize / 64), 4 * (this.skinSize / 64), -1 / 2, -1 / 2, -1 / 2, 1, -0.1);
            this.addGrid(i, 12 * (this.skinSize / 64), 4 * (this.skinSize / 64), 1 / 2, -1 / 2, -1 / 2, 1, 0.1);
            this.addGrid(i, 4 * (this.skinSize / 64), 4 * (this.skinSize / 64), -1 / 2, -1 / 2, -1 / 2, 2, -0.1);
            this.addGrid(i, 4 * (this.skinSize / 64), 4 * (this.skinSize / 64), -1 / 2, 1 / 2, -1 / 2, 2, 0.1);
        });
        this.setState({outerGrid: true});

    };

    removeInnerGrid = () => {
        [this.head, this.chest, this.armL, this.armR, this.legL, this.legR].forEach((i) => {
            while (i.children.length > 0) {
                i.remove(i.children[0]);
            }
        });
        this.setState({innerGrid: false});
    };

    removeOuterGrid = () => {
        [this.headOuter, this.chestOuter, this.armLOuter, this.armROuter, this.legLOuter, this.legROuter].forEach((i) => {
            while (i.children.length > 0) {
                i.remove(i.children[0]);
            }
        });
        this.setState({outerGrid: false});
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

    download = () => {
        if (this.canvas !== null) {
            let download = document.getElementById("download");
            let image = this.canvas.toDataURL("image/png");
            download.setAttribute("href", image);
        }
    };

    upload = () => {
        document.getElementById("selectImage").click();
    };

    toggleSkinMenu = () => {
        if (!this.state.skinMenu) {
            this.setState({skinMenu: true});
        } else {
            this.setState({skinMenu: false});
        }
    };

    openPalletSelector = () => {
        if (!this.state.palletSelector) {
            this.setState({palletSelector: true});
            this.setState({mode: -1});
        }
    };

    closePalletSelector = () => {
        if (this.state.palletSelector) {
            this.setState({palletSelector: false});
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
        this.isAlex = t;
    };

    setSkinIndex = (i) => {
        this.skinIndex = i;
    };

    togglePreview = () => {
        if (this.state.preview) {
            this.refs.canvas.style.display = "none";
            this.setState({preview: false});
        } else {
            this.refs.canvas.style.display = "initial";
            this.setState({preview: true});
        }
    };

    removeIndex = () => {
        if (this.skins.length > 1) {
            this.skins.splice(this.skinIndex, 1);
            if (this.skinIndex !== 0) {
                this.skinIndex--;
            }

            this.loadImgFromUrl(this.skins[this.skinIndex].img);
        }
    };

    clearScene = () => {
        while (this.scene.children.length) {
            this.scene.remove(this.scene.children[0]);
        }
    };

    showFull = () => {
        this.clearScene();
        this.head.position.set(0, 12, 0);
        this.headOuter.position.set(0, 12, 0);
        this.chest.position.set(0, 2, 0);
        this.chestOuter.position.set(0, 2, 0);

        this.scene.add(this.head);
        this.scene.add(this.chest);
        this.scene.add(this.armL);
        this.scene.add(this.armR);
        this.scene.add(this.legL);
        this.scene.add(this.legR);

        this.legL.position.set(-2, -10, 0);
        this.legLOuter.position.set(-2, -10, 0);
        this.legR.position.set(2, -10, 0);
        this.legROuter.position.set(2, -10, 0);

        if (this.isAlex) {
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
        this.refs.slot0.style.backgroundColor = this.colors[0];
        this.refs.slot1.style.backgroundColor = this.colors[1];
        this.refs.slot2.style.backgroundColor = this.colors[2];
        this.refs.slot3.style.backgroundColor = this.colors[3];
        this.refs.slot4.style.backgroundColor = this.colors[4];
        this.updateBorders();
    };

    updateBorders = () => {
        this.refs.slot0.style.borderColor = this.getBorderColor(this.colors[0]);
        this.refs.slot1.style.borderColor = this.getBorderColor(this.colors[1]);
        this.refs.slot2.style.borderColor = this.getBorderColor(this.colors[2]);
        this.refs.slot3.style.borderColor = this.getBorderColor(this.colors[3]);
        this.refs.slot4.style.borderColor = this.getBorderColor(this.colors[4]);
    };

    toggleLayer = (e) => {
        e.stopPropagation();
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
                    default:
                        alert("Error! Please alert the developer!");
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
                    default:
                        alert("Error! Please alert the developer!");
                        break;
                }
            }

        }
    };

    loadImage = (e) => { // Loading from an input upload
        let reader = new FileReader();
        reader.onload = (event) => {
            let img = new Image();
            img.onload = () => {
                this.loadImg(img);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(e.target.files[0]);
    };

    loadImageFromDrop = (e) => { // Loading from a drag and drop
        for (let i = 0; i < e.length; i++) {
            let reader = new FileReader();
            reader.onload = (event) => {
                let img = new Image();
                img.onload = () => {
                    this.loadImg(img);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(e[i]);
        }

    };

    loadImg = (img) => { // Helper image loading function
        if (img.width === 64 && img.height === 64) {
            this.skinSize = 64;
        } else if (img.width === 128 && img.height === 128) {
            this.skinSize = 128;
        } else {
            alert("Invalid Skin Format");
            return false;
        }

        this.skinIndex = this.skins.length;
        this.canvas.width = this.skinSize;
        this.canvas.height = this.skinSize;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(img, 0, 0);

        if (this.ctx.getImageData(54 * (this.skinSize / 64), 20 * (this.skinSize / 64), 1, 1).data[3] === 0) {
            this.setAlex(true);
        } else {
            this.setAlex(false);
        }

        this.skins[this.skinIndex] = {
            img: this.canvas.toDataURL(),
            type: this.isAlex ? "Alex" : "Steve",
            size: this.skinSize
        };

        this.init();
        this.resetActions();
    };

    loadImgFromUrl = (i) => { // Loads a previously edited image from currently opened skins
        let img = new Image();
        img.src = i;
        img.onload = () => {
            if (img.width === 64 && img.height === 64) {
                this.skinSize = 64;
            } else if (img.width === 128 && img.height === 128) {
                this.skinSize = 128;
            } else {
                alert("Invalid Skin Format");
                return false;
            }

            this.canvas.width = this.skinSize;
            this.canvas.height = this.skinSize;

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);

            if (this.ctx.getImageData(54 * (this.skinSize / 64), 20 * (this.skinSize / 64), 1, 1).data[3] === 0) {
                this.setAlex(true);
            } else {
                this.setAlex(false);
            }

            this.skins[this.skinIndex] = {
                img: this.canvas.toDataURL(),
                type: this.isAlex ? "Alex" : "Steve",
                size: this.skinSize
            };

            this.init();
            this.resetActions();
        };
    };

    loadPreset = (skin) => { // Loads from template file
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        let img = new Image();
        img.onload = () => {
            this.loadImg(img);
        };
        img.src = skin;
    };

    loadSteve64 = () => {
        this.setAlex(false);
        this.skinSize = 64;
        this.loadPreset(steve);
    };

    loadAlex64 = () => {
        this.setAlex(true);
        this.skinSize = 64;
        this.loadPreset(alex);
    };

    loadSteve128 = () => {
        this.setAlex(false);
        this.skinSize = 128;
        this.loadPreset(hd_steve);
    };

    loadAlex128 = () => {
        this.setAlex(true);
        this.skinSize = 128;
        this.loadPreset(hd_alex);
    };

    resetActions = () => {
        this.aIdx = -1;
        this.actions = [];
        this.addAction();
    };

    addAction = () => {
        if (this.actions.length > this.aSize) {
            this.actions.shift();
        }

        if (this.actions[this.aIdx] !== this.canvas.toDataURL()) {
            this.aIdx++;
            this.actions = this.actions.slice(0, this.aIdx);
            this.actions.push(this.canvas.toDataURL());
            this.skins[this.skinIndex] = {
                img: this.canvas.toDataURL(),
                type: this.isAlex ? "Alex" : "Steve",
                size: this.skinSize
            };
        }
    };

    undo = () => {
        if (this.aIdx !== 0) {
            this.aIdx--;

            let image = new Image();
            image.onload = () => {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(image, 0, 0);
                this.skins[this.skinIndex] = {
                    img: this.canvas.toDataURL(),
                    type: this.isAlex ? "Alex" : "Steve",
                    size: this.skinSize
                };
            };
            image.src = this.actions[this.aIdx];
        } else {
            console.log("cant undo");
        }

    };

    redo = () => {
        if (this.aIdx !== this.actions.length - 1) {
            this.aIdx++;
            let image = new Image();
            image.onload = () => {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(image, 0, 0);
                this.skins[this.skinIndex] = {
                    img: this.canvas.toDataURL(),
                    type: this.isAlex ? "Alex" : "Steve",
                    size: this.skinSize
                };
            };
            image.src = this.actions[this.aIdx];
        } else {
            console.log("cant redo");
        }
    };

    clearSkin = () => {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    };

    zoomIn = () => {
        if (this.camera.position.z > 8) {
            this.camera.position.z -= 4;
        }
    };

    zoomOut = () => {
        if (this.camera.position.z < 32) {
            this.camera.position.z += 4;
        }
    };

    getSimColors = (color) => {
        let hsl = this.hexToHSL(color);
        let colors = [];
        for (let i = -15; i < 20; i += 5) {

            let h;
            if (hsl[0] + i < 0) {
                h = hsl[0] + i + 360;
            } else if (hsl[0] + i > 360) {
                h = hsl[0] + i - 360;
            } else {
                h = hsl[0] + i;
            }
            let l;
            if (hsl[2] + i / 2 < 0) {
                l = i + 15;
            } else if (hsl[2] + i / 2 > 100) {
                l = 100;
            } else {
                l = hsl[2] + i / 2;
            }
            colors.push(this.HSLToHex(h, hsl[1], l));
        }
        return colors;
    };

    getBorderColor = (c) => {
        let colors = this.getSimColors(c);
        let i = 0;
        while (colors[i] === "#000000") {
            i++;
        }
        return colors[i];
    };

    hexToHSL = (H) => {
        let r = 0, g = 0, b = 0;
        if (H.length === 4) {
            r = "0x" + H[1] + H[1];
            g = "0x" + H[2] + H[2];
            b = "0x" + H[3] + H[3];
        } else if (H.length === 7) {
            r = "0x" + H[1] + H[2];
            g = "0x" + H[3] + H[4];
            b = "0x" + H[5] + H[6];
        }

        r /= 255;
        g /= 255;
        b /= 255;
        let cmin = Math.min(r, g, b),
            cmax = Math.max(r, g, b),
            delta = cmax - cmin,
            h = 0,
            s = 0,
            l = 0;

        if (delta === 0)
            h = 0;
        else if (cmax === r)
            h = ((g - b) / delta) % 6;
        else if (cmax === g)
            h = (b - r) / delta + 2;
        else
            h = (r - g) / delta + 4;

        h = Math.round(h * 60);

        if (h < 0)
            h += 360;

        l = (cmax + cmin) / 2;
        s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
        s = +(s * 100).toFixed(1);
        l = +(l * 100).toFixed(1);

        return [h, s, l]; //"hsl(" + h + "," + s + "%," + l + "%)";
    };

    HSLToHex = (h, s, l) => {
        s /= 100;
        l /= 100;

        let c = (1 - Math.abs(2 * l - 1)) * s,
            x = c * (1 - Math.abs((h / 60) % 2 - 1)),
            m = l - c / 2,
            r = 0,
            g = 0,
            b = 0;

        if (0 <= h && h < 60) {
            r = c;
            g = x;
            b = 0;
        } else if (60 <= h && h < 120) {
            r = x;
            g = c;
            b = 0;
        } else if (120 <= h && h < 180) {
            r = 0;
            g = c;
            b = x;
        } else if (180 <= h && h < 240) {
            r = 0;
            g = x;
            b = c;
        } else if (240 <= h && h < 300) {
            r = x;
            g = 0;
            b = c;
        } else if (300 <= h && h < 360) {
            r = c;
            g = 0;
            b = x;
        }
        // Having obtained RGB, convert channels to hex
        r = Math.round((r + m) * 255).toString(16);
        g = Math.round((g + m) * 255).toString(16);
        b = Math.round((b + m) * 255).toString(16);

        // Prepend 0s, if necessary
        if (r.length === 1)
            r = "0" + r;
        if (g.length === 1)
            g = "0" + g;
        if (b.length === 1)
            b = "0" + b;

        return "#" + r + g + b;
    };

    loadPallet = (colors) => {
        for (let i = 1; i < colors.length; i++) {
            this.colors[i-1] = colors[i];
        }
        this.updateColors();
    };

    render() {
        let skinMenuIcon;

        if (this.state.skinMenu) {
            skinMenuIcon = <svg xmlns="http://www.w3.org/2000/svg" width={this.touchDevice ? 47 / 1.25 : "47"}
                                height={this.touchDevice ? 34.993 / 1.25 : "34.993"} viewBox="0 0 47 34.993">
                <path id="minus-icon"
                      d="M2.938,26.438H44.063a2.938,2.938,0,0,0,0-5.875H2.938a2.938,2.938,0,0,0,0,5.875Z"
                      transform="translate(0 -6.003)" fill="#f5d300" fillRule="evenodd"/>
            </svg>;
        } else {
            skinMenuIcon = <svg id="menu-right-1-icon" xmlns="http://www.w3.org/2000/svg"
                                width={this.touchDevice ? 47 / 1.25 : "47"}
                                height={this.touchDevice ? 34.993 / 1.25 : "34.993"} viewBox="0 0 47 34.993">
                <path id="menu-right-1-icon-2" data-name="menu-right-1-icon"
                      d="M44.063,36.993a2.916,2.916,0,1,0,0-5.832H26.438a2.916,2.916,0,1,0,0,5.832Zm0-14.581a2.916,2.916,0,1,0,0-5.832H14.688a2.916,2.916,0,1,0,0,5.832ZM2.938,7.832H44.063a2.916,2.916,0,1,0,0-5.832H2.938a2.916,2.916,0,1,0,0,5.832Z"
                      transform="translate(0 -2)" fill="#41487c" fillRule="evenodd"/>
            </svg>;
        }

        return (
            <div>
                <div className='dropdowns'>
                    <div className="dropdown">
                        <button className="dropbtn"> File</button>
                        <div className="dropdown-content">
                            <p> New... </p>
                            <div style={{display: "inline-flex", padding: '8px'}}>
                                <img className="menu-face" src={steve_face} alt=""/>
                                <p style={{marginLeft: "4px"}}> Steve Model </p>
                            </div>
                            <div style={{display: "inline-flex"}}>
                                <button className="link-button" onClick={this.loadSteve64}> 4px 64x64</button>
                                <button className="link-button" onClick={this.loadSteve128}> 4px 128x128</button>
                            </div>

                            <div style={{display: "inline-flex", padding: '8px'}}>
                                <img className="menu-face" src={alex_face} alt=""/>
                                <p style={{marginLeft: "4px"}}> Alex Model </p>
                            </div>
                            <div style={{display: "inline-flex"}}>
                                <button className="link-button" onClick={this.loadAlex64}> 3px 64x64</button>
                                <button className="link-button" onClick={this.loadAlex128}> 3px 128x128</button>
                            </div>

                            <input id='selectImage' hidden style={{display: "none"}} type="file"
                                   onChange={this.loadImage}/>
                            <button onClick={this.upload} className="link-button"> Upload
                            </button>

                        </div>

                    </div>

                    <div className="dropdown">
                        <button className="dropbtn"> Edit</button>
                        <div className="dropdown-content">
                            <button className="link-button" onClick={this.undo}> Undo <p className="hotkey"> Ctrl-Z </p>
                            </button>
                            <button className="link-button" onClick={this.redo}> Redo <p className="hotkey"> Ctrl-Y </p>
                            </button>
                            <button className="link-button" onClick={this.clearSkin}> Clear Skin</button>
                        </div>

                    </div>

                    <div className="dropdown">
                        <button className="dropbtn"> View</button>
                        <div className="dropdown-content">
                            <button className="link-button"
                                    onClick={this.state.innerGrid ? this.removeInnerGrid : this.addInnerGrid}> {this.state.innerGrid ? "Disable Inner Grid" : "Enable Inner Grid"} </button>
                            <button className="link-button"
                                    onClick={this.state.outerGrid ? this.removeOuterGrid : this.addOuterGrid}> {this.state.outerGrid ? "Disable Outer Grid" : "Enable Outer Grid"} </button>
                            <button className="link-button"
                                    onClick={this.togglePreview}> {this.state.preview ? "Hide Preview" : "Show Preview"} </button>

                        </div>

                    </div>
                </div>

                <div className="tools">
                    <div className="main-tools">
                        <div className="tool-holder do-buttons"
                             onClick={this.undo}>
                            <svg id="jump-left-down-icon" xmlns="http://www.w3.org/2000/svg"
                                 width={this.touchDevice ? 36.525 / 1.25 : "36.525"}
                                 height={this.touchDevice ? 19.89 / 1.25 : "19.89"} viewBox="0 0 36.525 19.89">
                                <path id="jump-left-down-icon-2" data-name="jump-left-down-icon"
                                      d="M15.951,8.631V2.868c0-.89-.776-1.134-1.735-.547L.719,10.872A1.255,1.255,0,0,0,0,11.936,1.263,1.263,0,0,0,.719,13l13.5,8.571c.959.589,1.735.342,1.735-.547V15.262h2.283c8.721,0,16.179-5.247,18-10.917a7.131,7.131,0,0,0,.285-1.277c.068-.444-.228-.542-.662-.232,0,0-.126.083-.228.166a31.428,31.428,0,0,1-17.4,5.637H15.946l0-.007Z"
                                      transform="translate(0 -2.001)" fill="#41487c" fillRule="evenodd"/>
                            </svg>
                        </div>

                        <div className={"tool-holder" + (this.state.mode === 0 ? ' th-selected' : '')}
                             onClick={this.setPen}>
                            <svg id="Paint_Brush" data-name="Paint Brush" xmlns="http://www.w3.org/2000/svg"
                                 width={this.touchDevice ? 36.763 / 1.25 : "36.763"}
                                 height={this.touchDevice ? 37.352 / 1.25 : "37.352"} viewBox="0 0 36.763 37.352">
                                <path id="Path_10" data-name="Path 10"
                                      d="M3.551,37.14s4.974-4.28,7.078-9.226c2.7-6.349,11.784-1.183,7.519,4.871S3.551,37.14,3.551,37.14ZM21.985,27.005,40.065,2.092A1.362,1.362,0,0,0,38.029.327L16.35,21.936Z"
                                      transform="translate(-3.551 -0.007)"
                                      fill={this.state.mode === 0 ? "#F5D300" : "#41487c"}/>
                            </svg>
                        </div>

                        <div className="tool-holder"
                             onClick={this.setEraser}>
                            <svg id="Rubber" xmlns="http://www.w3.org/2000/svg"
                                 width={this.touchDevice ? 38.779 / 1.25 : "38.779"}
                                 height={this.touchDevice ? 38.105 / 1.25 : "38.105"} viewBox="0 0 38.779 38.105">
                                <path id="Path_11" data-name="Path 11"
                                      d="M38.779,15.764,27.952,4.277,0,33.947l7.959,8.435h22.5V40.194h-14.7ZM8.822,40.194,2.93,33.947,13.664,22.558l7.918,8.336-8.759,9.3Z"
                                      transform="translate(0 -4.277)"
                                      fill={this.state.mode === 1 ? "#F5D300" : "#41487c"}/>
                            </svg>
                        </div>

                        <div className="tool-holder"
                             onClick={this.setBucket}>
                            <svg id="_x31_2" xmlns="http://www.w3.org/2000/svg"
                                 width={this.touchDevice ? 36.765 / 1.25 : "36.765"}
                                 height={this.touchDevice ? 37.734 / 1.25 : "37.734"} viewBox="0 0 36.765 37.734">
                                <path id="Path_12" data-name="Path 12"
                                      d="M31.99,19.172,19.834,6.159a1.7,1.7,0,0,0-2.522,0L16.34,7.2a12.994,12.994,0,0,0-2.389-2.845C12.169,2.8,10.343,2.311,8.81,2.989s-2.371,2.75-2.4,5.852a23.83,23.83,0,0,0,1.31,7.59l-7.2,7.715a2.011,2.011,0,0,0,0,2.7L12.677,39.861a1.683,1.683,0,0,0,2.513,0l16.8-17.987A2.012,2.012,0,0,0,31.99,19.172ZM9.5,4.755c.882-.391,2.1,0,3.333,1.079a11.094,11.094,0,0,1,2.219,2.75L9.122,14.933a21.046,21.046,0,0,1-.927-6.082C8.213,6.674,8.711,5.1,9.5,4.755Zm4.438,33.759L1.787,25.5,15.966,10.3q.214.458.4.945a16.686,16.686,0,0,1,1,3.876,2.338,2.338,0,0,0-.41.344,2.683,2.683,0,0,0,0,3.619,2.273,2.273,0,0,0,3.378,0,2.683,2.683,0,0,0,0-3.619,2.316,2.316,0,0,0-1.221-.707,18.736,18.736,0,0,0-1.105-4.239,16.53,16.53,0,0,0-.722-1.633L18.577,7.5,30.724,20.528Zm22.83-10.339a2.923,2.923,0,1,1-5.827,0c0-2.485,2.913-5.623,2.913-5.623S36.765,25.691,36.765,28.176Z"
                                      transform="translate(0 -2.691)"
                                      fill={this.state.mode === 4 ? "#F5D300" : "#41487c"}/>
                            </svg>
                        </div>

                        <div className="tool-holder"
                             onClick={this.setRotate}>
                            <svg id="reload-1-icon" xmlns="http://www.w3.org/2000/svg"
                                 width={this.touchDevice ? 37.416 / 1.25 : "37.416"}
                                 height={this.touchDevice ? 37.734 / 1.25 : "37.734"} viewBox="0 0 37.416 37.734">
                                <path id="reload-1-icon-2" data-name="reload-1-icon"
                                      d="M25.653,14.15c-1.286,0-1.6-.736-.662-1.674l3.6-3.615a14.073,14.073,0,0,0-23.939,8.2,2.213,2.213,0,0,1-2.306,1.8A2.354,2.354,0,0,1,0,16.509a2.518,2.518,0,0,1,.058-.519A18.763,18.763,0,0,1,31.913,5.526l3.851-3.868c.912-.915,1.651-.6,1.651.677v10.66a1.169,1.169,0,0,1-1.153,1.156ZM11.763,23.584c1.286,0,1.6.736.662,1.674l-3.6,3.615a14.076,14.076,0,0,0,23.944-8.2,2.213,2.213,0,0,1,2.306-1.8,2.353,2.353,0,0,1,2.343,2.358,2.5,2.5,0,0,1-.058.519A18.763,18.763,0,0,1,5.5,32.208L1.651,36.076C.739,36.991,0,36.67,0,35.4V24.737a1.169,1.169,0,0,1,1.153-1.156h10.61Z"
                                      fill={this.state.mode === 2 ? "#F5D300" : "#41487c"} fillRule="evenodd"/>
                            </svg>
                        </div>

                        <div className="tool-holder"
                             onClick={this.setDropper}>
                            <svg id="_x36_" xmlns="http://www.w3.org/2000/svg"
                                 width={this.touchDevice ? 36.958 / 1.25 : "36.958"}
                                 height={this.touchDevice ? 38.105 / 1.25 : "38.105"} viewBox="0 0 36.958 38.105">
                                <path id="Path_14" data-name="Path 14"
                                      d="M35.818,7.281A4.18,4.18,0,0,0,36.957,4.3a4.434,4.434,0,0,0-1.25-3.011A4.031,4.031,0,0,0,29.9,1.18L24.2,7.053a2.75,2.75,0,0,0-.431.536L19.291,2.97,15.486,6.882l3.164,3.262L0,29.37l.653,8.051,7.81.684L27.123,18.878l3.164,3.262,3.794-3.923-4.491-4.63a2.411,2.411,0,0,0,.531-.433ZM7.632,35.744,2.71,35.311l-.42-5.074L19.922,12.059l5.343,5.5Z"
                                      transform="translate(0 0)" fill={this.state.mode === 3 ? "#F5D300" : "#41487c"}/>
                            </svg>
                        </div>

                        <div className="tool-holder"
                             onClick={this.zoomIn}>
                            <svg id="zoom-in-icon" xmlns="http://www.w3.org/2000/svg"
                                 width={this.touchDevice ? 29.19 / 1.25 : "29.19"}
                                 height={this.touchDevice ? 28.998 / 1.25 : "28.998"} viewBox="0 0 29.19 28.998">
                                <path id="zoom-in-icon-2" data-name="zoom-in-icon"
                                      d="M14.6,10.874h3.649a1.812,1.812,0,1,1,0,3.625H14.6v3.625a1.824,1.824,0,0,1-3.649,0V14.5H7.3a1.812,1.812,0,1,1,0-3.625h3.649V7.249a1.824,1.824,0,0,1,3.649,0Zm5.849,11.992,5.637,5.593a1.806,1.806,0,0,0,2.572,0,1.834,1.834,0,0,0,0-2.592l-5.619-5.582a12.6,12.6,0,0,0,2.53-7.587A12.783,12.783,0,1,0,12.783,25.4a12.791,12.791,0,0,0,7.662-2.532Zm-7.662-1.1A9.071,9.071,0,1,1,21.913,12.7a9.1,9.1,0,0,1-9.131,9.071Z"
                                      fill="#41487c" fillRule="evenodd"/>
                            </svg>
                        </div>

                        <div className="tool-holder"
                             onClick={this.zoomOut}>
                            <svg id="zoom-out-icon" xmlns="http://www.w3.org/2000/svg"
                                 width={this.touchDevice ? 28.646 / 1.25 : "28.646"}
                                 height={this.touchDevice ? 29.29 / 1.25 : "29.29"} viewBox="0 0 28.646 29.29">
                                <path id="zoom-out-icon-2" data-name="zoom-out-icon"
                                      d="M10.742,10.984a1.831,1.831,0,0,0,0,3.661H21.484a1.831,1.831,0,0,0,0-3.661ZM8.583,23.1,3.051,28.746a1.737,1.737,0,0,1-2.524,0,1.891,1.891,0,0,1,0-2.618L6.041,20.49a12.974,12.974,0,0,1-2.483-7.663A12.688,12.688,0,0,1,16.1,0,12.688,12.688,0,0,1,28.646,12.827,12.688,12.688,0,0,1,16.1,25.655,12.318,12.318,0,0,1,8.581,23.1ZM16.1,21.99a9.062,9.062,0,0,0,8.959-9.162A9.062,9.062,0,0,0,16.1,3.665a9.061,9.061,0,0,0-8.959,9.162A9.062,9.062,0,0,0,16.1,21.99Z"
                                      fill="#41487c" fillRule="evenodd"/>
                            </svg>
                        </div>


                        <div className="tool-holder do-buttons"
                             onClick={this.redo}>
                            <svg id="jump-right-down-icon" xmlns="http://www.w3.org/2000/svg"
                                 width={this.touchDevice ? 36.53 / 1.25 : "36.53"}
                                 height={this.touchDevice ? 19.89 / 1.25 : "19.89"} viewBox="0 0 36.53 19.89">
                                <path id="jump-right-down-icon-2" data-name="jump-right-down-icon"
                                      d="M20.577,8.629V2.868c0-.89.776-1.134,1.735-.547l13.5,8.553a1.255,1.255,0,0,1,.719,1.064A1.266,1.266,0,0,1,35.808,13l-13.5,8.569c-.959.588-1.735.341-1.735-.547V15.259H18.291C9.572,15.259,2.112,10.015.3,4.346A7.337,7.337,0,0,1,.01,3.07c-.068-.444.228-.542.662-.232,0,0,.126.083.228.166A31.445,31.445,0,0,0,18.3,8.639h2.283l0-.007Z"
                                      transform="translate(0 -2.001)" fill="#41487c" fillRule="evenodd"/>
                            </svg>
                        </div>
                    </div>

                    <div className='menu-buttons'>
                        {/* eslint-disable-next-line */}
                        <a id="download" download="skin.png">
                            <div className="tool-holder" onClick={this.download}>
                                <svg id="download-icon" xmlns="http://www.w3.org/2000/svg"
                                     width={this.touchDevice ? 36.802 / 1.25 : "36.802"}
                                     height={this.touchDevice ? 36.8 / 1.25 : "36.8"} viewBox="0 0 36.802 36.8">
                                    <path id="download-icon-2" data-name="download-icon"
                                          d="M4.6,32.211S32.2,32.2,32.2,32.2s0-11.5,0-11.5a2.3,2.3,0,0,1,4.6,0V32.211A4.611,4.611,0,0,1,32.2,36.8H4.6A4.588,4.588,0,0,1,0,32.211V20.7a2.3,2.3,0,0,1,4.6,0Zm6.224-22.4a2.281,2.281,0,0,0-3.252,0,2.352,2.352,0,0,0,0,3.294l8.391,8.85a3.421,3.421,0,0,0,4.876,0L29.228,13.1a2.346,2.346,0,0,0,0-3.289,2.277,2.277,0,0,0-3.252,0l-5.274,5.7V2.3a2.3,2.3,0,0,0-4.6,0V15.518Z"
                                          fill="#41487c" fillRule="evenodd"/>
                                </svg>
                            </div>
                        </a>

                        <div className="tool-holder" onClick={this.toggleSkinMenu}>
                            {skinMenuIcon}
                        </div>
                    </div>

                </div>

                <div className="layer-tool tool-holder"
                     onClick={this.toggleLayer}>
                    <svg xmlns="http://www.w3.org/2000/svg" width={this.touchDevice ? 42.385 / 1.25 : "42.385"}
                         height={this.touchDevice ? 48.745 / 1.25 : "48.745"} viewBox="0 0 42.385 48.745">
                        <g id="layer" transform="translate(0)">
                            <path id="layer-2" data-name="layer"
                                  d="M42.385,13.775a1.093,1.093,0,0,0-.48-.93L21.634.129a.82.82,0,0,0-.883,0L.48,12.845a1.141,1.141,0,0,0,0,1.861l6.965,4.369L.481,23.442a1.141,1.141,0,0,0,0,1.861L7.446,29.67.48,34.039a1.141,1.141,0,0,0,0,1.861L20.751,48.615a.818.818,0,0,0,.883,0L41.905,35.9a1.141,1.141,0,0,0,0-1.861L34.939,29.67,41.905,25.3a1.141,1.141,0,0,0,0-1.861l-6.964-4.367,6.964-4.369a1.093,1.093,0,0,0,.48-.93Zm-21.193,32.7L2.845,34.969l6.526-4.091,11.381,7.141a.82.82,0,0,0,.883,0l11.381-7.141,6.525,4.091ZM39.539,24.372,32.573,28.74,21.193,35.881,9.812,28.74h0L2.846,24.372l6.523-4.09,11.382,7.14a.818.818,0,0,0,.883,0l11.382-7.14Zm-18.347.912L2.845,13.775,21.193,2.266,39.54,13.775Zm0,0"
                                  transform="translate(0 0)" fill={this.state.outer ? "#F5D300" : "#41487c"}/>
                        </g>
                    </svg>

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
                    <br/>

                    <div style={{cursor: "pointer"}} onClick={this.openPalletSelector}>
                        <svg id="select-colour-icon" className="pallets-icon" width="49" height="50"
                             viewBox="0 0 49 50">
                            <image id="select-colour-icon-2" data-name="select-colour-icon" width="49" height="49"
                                   xlinkHref="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF2GlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDggNzkuMTY0MDM2LCAyMDE5LzA4LzEzLTAxOjA2OjU3ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjEuMCAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDE2LTEyLTA1VDEyOjM2OjM4WiIgeG1wOk1vZGlmeURhdGU9IjIwMjAtMDEtMjNUMTk6MjM6MzdaIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIwLTAxLTIzVDE5OjIzOjM3WiIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDoxZmMxZDk4NS1iMTIzLWMwNGYtOGM5MS1iNjUyMjk2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"/>
                        </svg>
                    </div>


                </div>

                <canvas ref="canvas" className="preview-canvas top-rightish"/>

                <Pallet simColors={this.getSimColors} borderColor={this.getBorderColor}
                        currentColor={this.colors[this.state.colorSlot]} colorSelect={this.changeColorSlot}
                        colorSelectCustom={this.changeColorSlotCustom} closePallet={this.closePallet}
                        pallet={this.state.pallet}/>

                <SkinMenu open={this.state.skinMenu} skins={this.skins} selected={this.skinIndex}
                          setSkinIndex={this.setSkinIndex}
                          loadSkin={this.loadImgFromUrl} loadImage={this.loadImage} remove={this.removeIndex}/>

                <Parts part={this.state.part} full={this.showFull} head={this.showHead} chest={this.showChest}
                       leftArm={this.showLeftArm} rightArm={this.showRightArm} leftLeg={this.showLeftLeg}
                       rightLeg={this.showRightLeg}/>

                <PalletSelector colors={this.colors} loadPallet={this.loadPallet} close={this.closePalletSelector} open={this.state.palletSelector}/>

                <div style={{visibility: "hidden", opacity: "0"}} className="dropzone">
                    <p style={{fontSize: "4em", marginTop: "30vh"}}> Drop to upload </p>
                </div>

            </div>
        );
    }
}