import React, {Component} from 'react';
import bg from './img/bg2.png';
import './App.css';
import * as THREE from "three";
export default class App extends Component{

    state = {
        color: "#FF0000",
        mode: 0,
        ctx: null,
        clickDelay: 0,
        outer: false
    };

    componentDidMount() {
        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera( 90, window.innerWidth/window.innerHeight, 0.1, 1000 );

        var renderer = new THREE.WebGLRenderer();

        renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( renderer.domElement );

        var OrbitControls = require('three-orbit-controls')(THREE);
        var controls = new OrbitControls(camera, renderer.domElement);
        controls.enablePan = false;
        controls.enableZoom = true;

        var tex = new THREE.TextureLoader().load(bg);
        scene.background = tex;

        var raycaster = new THREE.Raycaster(); // create once
        var mouse = new THREE.Vector2(); // create once

        var light = new THREE.AmbientLight( 0x00ff00 ); // soft white light
        scene.add( light );

        var pixels = [];
        var pixelsExternal = [];

        // So No Head?
        // Face (skin.png @ 8, 8) if k = 0
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                for (let k = 0; k < 8; k++) {
                    if ((i === 0 || i === 7) || (j === 0 || j === 7) || (k === 0 || k === 7)) {
                        let cube = new THREE.Mesh(new THREE.CubeGeometry(1, 1, 1), new THREE.MeshBasicMaterial({
                        color: 0xffffff,
                        vertexColors: THREE.FaceColors
                        }));
                        cube.position.set(i-4, j-4, k - 4);

                        /*
                        let cube2 = new THREE.Mesh(new THREE.CubeGeometry(1, 1, 1), new THREE.MeshBasicMaterial({
                            color: 0xffffff,
                            vertexColors: THREE.FaceColors
                        }));
                        cube2.position.set(i-4, j-4, k - 4);
                        for (let i = 0; i < cube.geometry.faces.length; i++) {
                            cube2.material.opacity = 0.1;
                            cube2.material.transparent = true;

                        }*/

                        if (k === 7) { // Creating face pixels
                            pixels.push({cube: cube, face: cube.geometry.faces, side: 8, vector: {x: i + 8, y: 7 + (8 - j)}});
                            //pixelsExternal.push({face: cube2.geometry.faces, side: 8, vector: {x: i + 8, y: 7 + (8 - j)}});
                        }
                        if (k === 0) { // Creating back of head pixels
                            pixels.push({cube: cube, face: cube.geometry.faces, side: 10, vector: {x: 7 + (24 - i), y: 7 + (8 - j)}});
                        }
                        if (i === 0) { // Creating left head pixels
                            pixels.push({cube: cube, face: cube.geometry.faces, side: 2, vector: {x: k, y: 7 + (8-j)}});
                        }
                        if (i === 7) { // Creating right head pixels
                            pixels.push({cube: cube, face: cube.geometry.faces, side: 0, vector: {x: 7+(16-k), y: 7 + (8-j)}});
                        }
                        if (j === 0) { // Creating bottom head pixels
                            pixels.push({cube: cube, face: cube.geometry.faces, side: 6, vector: {x: 16 + i, y: 7-k}});
                        }
                        if (j === 7) { // Creating top head pixels
                            pixels.push({cube: cube, face: cube.geometry.faces, side: 4, vector: {x: i + 8, y: k}});
                        }

                        // Highlight Edges ( 2 points on skin)
                        if (((i === 0 || i === 7) && ((j === 0 || j === 7) || (k === 0 || k === 7))) ||
                            ((j === 0 || j === 7)&& ((i === 0 || i === 7)  || (k === 0 || k === 7)))) {
                            for (let i = 0; i < cube.geometry.faces.length; i++) {
                                //cube2.geometry.faces[i].color.set(new THREE.Color("green"));
                            }
                        }


                        // Highlight Vertex's (3 points on skin)
                        if ((i === 0 || i === 7) && (j === 0 || j === 7) && (k === 0 || k === 7)) {
                            for (let i = 0; i < cube.geometry.faces.length; i++) {
                               // cube2.geometry.faces[i].color.set(new THREE.Color("red"));
                            }
                        }

                        scene.add(cube);
                       // scene.add(cube2);
                    }
                }
            }
        }

        console.log(pixels);

        for (var i = 0; i < pixels.length; i++) {
            pixels[i].face[pixels[i].side].color.set(new THREE.Color("orange"));
            pixels[i].face[pixels[i].side + 1].color.set(new THREE.Color("orange"));

        }

        camera.position.z = 32;

        document.addEventListener('mousemove', (e) => {
            mouse.x = ( e.clientX / renderer.domElement.clientWidth ) * 2 - 1;
            mouse.y = - ( e.clientY / renderer.domElement.clientHeight ) * 2 + 1;
        });
        document.addEventListener("touchmove", (e) => {
            e.preventDefault();
            e.stopPropagation();
            mouse.x = ( e.touches[0].clientX / renderer.domElement.clientWidth ) * 2 - 1;
            mouse.y = - ( e.touches[0].clientY / renderer.domElement.clientHeight ) * 2 + 1;

        }, {passive: false});

        var mouseDown = false;
        document.addEventListener('mousedown', (e) => mouseDown = true, false);
        document.addEventListener('mouseup', (e) => mouseDown = false, false);
        document.addEventListener('touchstart', (e) => mouseDown = true, false);
        document.addEventListener('touchend', (e) => mouseDown = false, false);

        let isCubeInPixels = (cube) => {
            let found = false;
            let {outer} = this.state;
            if (outer) {
                pixelsExternal.map((p) => {
                    if (!found) {
                        if (p.cube === cube) {
                            found = true;
                        }
                    }
                });
            } else {
                pixels.map((p) => {
                    if (!found) {
                        if (p.cube === cube) {
                            found = true;
                        }
                    }
                });
            }
            return found;
        }

        var isDragging = false;

        var clock = new THREE.Clock();
        var matrix = new THREE.Matrix4();
        let animate = () => {
            requestAnimationFrame( animate );
            let {color, mode} = this.state;

            matrix.makeRotationY(clock.getDelta() * 2 * Math.PI / 5);
            //camera.position.applyMatrix4(matrix);
            camera.lookAt(0, 0);

            raycaster.setFromCamera( mouse, camera );

            if (mode === 0) {
                controls.enabled = false;
                if (mouseDown) {
                    let intersects = raycaster.intersectObjects(scene.children);
                    if (intersects.length > 0) {
                        controls.enabled = false;
                        if (isCubeInPixels(intersects[0].object)) {
                        let faceIndex = intersects[0].faceIndex;
                            intersects[0].object.geometry.faces[faceIndex].color.set(new THREE.Color(color));
                            if (faceIndex === 0 || (faceIndex % 2) === 0) {
                                intersects[0].object.geometry.faces[faceIndex + 1].color.set(new THREE.Color(color));
                            } else {
                                intersects[0].object.geometry.faces[faceIndex - 1].color.set(new THREE.Color(color));
                            }
                            intersects[0].object.geometry.colorsNeedUpdate = true;
                        }

                    }
                }
            } else {
                controls.enabled = true;
            }

            controls.update();
            renderer.render( scene, camera );
        };

        animate();

        // Double Click Handler
        setInterval(() => {
           if (this.state.clickDelay > 0) {
               this.setState({clickDelay: (this.state.clickDelay-1)});
           }
        },1000/60);


        // Setup preview canvas
        const canvas = this.refs.canvas;
        const ctx = canvas.getContext("2d");

        canvas.width = 64;
        canvas.height = 64;

        setInterval(()=> {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < pixels.length; i++) {
                var c = pixels[i].face[pixels[i].side].color
                ctx.fillStyle = "rgb(" + (c.r * 255) + ", " + (c.g * 255) + ", " + (c.b * 255) + ")";
                ctx.fillRect(pixels[i].vector.x, pixels[i].vector.y, 1, 1);
            }
        }, 1000 / 10 );
    };

    colorSelect = (e) => {
        if (this.state.clickDelay === 0) {
            this.setState({clickDelay: 30});
        } else {
            alert("double");
        }
        this.setState({color: e.target.attributes.getNamedItem('color').value});
        console.log("changed to" + e.target.attributes.getNamedItem('color').value);
        this.setState({mode: 0});
    };

    setMode = (e) => {
        this.setState({mode: parseInt(e.target.attributes.getNamedItem('mode').value)});
    };

    render() {
        return (
            <div>

                <div className="colors">
                    <div onClick={this.colorSelect} color="#ff0000" className="color-select cs-selected" style={{backgroundColor: "red"}}/>
                    <div onClick={this.colorSelect} color="#0000ff" className="color-select" style={{backgroundColor: "blue"}}/>
                    <div onClick={this.colorSelect} color="#00ff00" className="color-select" style={{backgroundColor: "green"}}/>
                    <div onClick={this.colorSelect} color="#ffff00" className="color-select" style={{backgroundColor: "yellow"}}/>
                    <div onClick={this.setMode} mode="0" className="color-select" style={{backgroundColor: "purple"}}/>
                    <div onClick={this.setMode} mode="1" className="color-select" style={{backgroundColor: "white"}}/>

                </div>

                <canvas ref="canvas" style={{position: "absolute", width: "128px", height: "128px", imageRendering: "pixelated"}} />


            </div>
        );
    }
}