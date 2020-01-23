import React, {Component} from 'react';
import '../App.css';
import {faTimes} from '@fortawesome/free-solid-svg-icons'
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import face from '../img/face.png';
import face_alex from '../img/face_alex.png';

export default class Menu extends Component {

    state = {
        skinType: "steve"
    };

    canvas = null;

    componentDidMount() {
        this.canvas = this.refs.canvas;
        this.canvas.width = 64;
        this.canvas.height = 64;

        this.props.canvasAccess(this.canvas);

    }

    download = () => {
        if (this.canvas !== null) {
            var download = document.getElementById("download");
            var image = this.canvas.toDataURL("image/png");
            download.setAttribute("href", image);
        }
    };

    upload = () => {
        document.getElementById("selectImage").click();
    };

    onChange = (e) => {
        this.setState({ [e.target.name]: e.target.value }, () => {
            if (this.state.skinType === "steve") {
                this.props.setAlex(false);
            } else {
                this.props.setAlex(true);
            }
        });

    };

    render() {
        return (
            <div className="menu" style={{display: this.props.menu ? "initial" : "none"}}>
                <FontAwesomeIcon onClick={this.props.closeMenu} className="close" icon={faTimes} size="2x"/>

                <p style={{color: "white", fontSize: "2em", margin: "0", padding: "0"}}> Skin Preview </p>
                <div style={{textAlign: "center"}}>
                    <canvas ref="canvas" className="preview-canvas"/>
                    <br/>
                    <a id="download" download="skin.png"><button type="button" className="custom-button" onClick={this.download}>Download</button></a>
                    <hr/>
                    <div>
                        <img className="small-face" src={face}/>
                        <label style={{color: "white", fontSize: "1em", margin: "0", padding: "0"}}> Steve </label>
                        <input type="radio" name="skinType" value="steve" onChange={this.onChange} checked={this.state.skinType === "steve"} />
                        <img className="small-face" style={{marginLeft: "5vw"}} src={face_alex}/>
                        <label style={{color: "white", fontSize: "1em", margin: "0", padding: "0"}}> Alex </label>
                        <input type="radio" name="skinType" value="alex" onChange={this.onChange} checked={this.state.skinType === "alex"}/>
                    </div>

                    <button className="custom-button" onClick={this.upload}>Upload</button>
                    <input id='selectImage' hidden style={{display: "none"}} type="file" onChange={this.props.loadImage} />
                    <button className="custom-button" onClick={this.props.fromScratch}>Start New</button>

                </div>
            </div>
        );
    }
}