import React, {Component} from 'react';
import '../App.css';
import {faLayerGroup, faTimes} from '@fortawesome/free-solid-svg-icons'
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

export default class Pallet extends Component {

    state = {
      hexcode: 0
    };

    onChange = (e) => {
        this.setState({ [e.target.name]: e.target.value });
        if (e.target.name === "hexcode") {
            if (e.target.value.length === 7 && /^#[0-9A-F]{6}$/i.test(e.target.value)) {
                if (this.isLight(e.target.value)) {
                    this.refs.previewButton.style.color = "#000000";
                    this.refs.previewButton.style.borderColor = "#000000";
                } else {
                    this.refs.previewButton.style.color = "#FFFFFF";
                    this.refs.previewButton.style.borderColor = "#FFFFFF";
                }
                this.refs.previewButton.style.backgroundColor = e.target.value;
            } else if (e.target.value.length === 6 && /^#[0-9A-F]{6}$/i.test("#" + e.target.value)) {
                if (this.isLight("#" + e.target.value)) {
                    this.refs.previewButton.style.color = "#000000";
                    this.refs.previewButton.style.borderColor = "#000000";
                } else {
                    this.refs.previewButton.style.color = "#FFFFFF";
                    this.refs.previewButton.style.borderColor = "#FFFFFF";
                }
                this.refs.previewButton.style.backgroundColor = "#" + e.target.value;
            }
        }
    };


    isLight = (color) => {
        var r, g, b, hsp;

        // Check the format of the color, HEX or RGB?
        if (color.match(/^rgb/)) {

            // If HEX --> store the red, green, blue values in separate variables
            color = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);

            r = color[1];
            g = color[2];
            b = color[3];
        } else {

            // If RGB --> Convert it to HEX: http://gist.github.com/983661
            color = +("0x" + color.slice(1).replace(
                color.length < 5 && /./g, '$&$&'));

            r = color >> 16;
            g = color >> 8 & 255;
            b = color & 255;
        }

        // HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
        hsp = Math.sqrt(
            0.299 * (r * r) +
            0.587 * (g * g) +
            0.114 * (b * b)
        );

        // Using the HSP value, determine whether the color is light or dark
        if (hsp>127.5) {
            return true;
        } else {
            return false;
        }
    };

    customChange = (e) => {
        e.preventDefault();
        this.props.colorSelectCustom(this.state.hexcode);
    };

    render() {
        return (
            <div className="pallet" style={{display: this.props.pallet ? "initial" : "none"}}>
                <FontAwesomeIcon onClick={this.props.closePallet} className="close" icon={faTimes} size="2x"/>
                <p style={{color: "#FFFFFF", fontSize: "2em", padding: "0", margin: "0"}}> Select a color </p>
                <div onClick={this.props.colorSelect} color='#f44336'
                     className={"color-select"}
                     style={{backgroundColor: "#f44336"}}/>
                <div onClick={this.props.colorSelect} color='#E91E63'
                     className={"color-select"}
                     style={{backgroundColor: "#E91E63"}}/>
                <div onClick={this.props.colorSelect} color='#9C27B0'
                     className={"color-select"}
                     style={{backgroundColor: "#9C27B0"}}/>
                <div onClick={this.props.colorSelect} color='#673AB7'
                     className={"color-select"}
                     style={{backgroundColor: "#673AB7"}}/>
                <div onClick={this.props.colorSelect} color='#2196F3'
                     className={"color-select"}
                     style={{backgroundColor: "#2196F3"}}/>
                <div onClick={this.props.colorSelect} color='#00BCD4'
                     className={"color-select"}
                     style={{backgroundColor: "#00BCD4"}}/>
                <div onClick={this.props.colorSelect} color='#009688'
                     className={"color-select"}
                     style={{backgroundColor: "#009688"}}/>
                <div onClick={this.props.colorSelect} color='#4CAF50'
                     className={"color-select"}
                     style={{backgroundColor: "#4CAF50"}}/>
                <div onClick={this.props.colorSelect} color='#CDDC39'
                     className={"color-select"}
                     style={{backgroundColor: "#CDDC39"}}/>
                <div onClick={this.props.colorSelect} color='#FFEB3B'
                     className={"color-select"}
                     style={{backgroundColor: "#FFEB3B"}}/>
                <div onClick={this.props.colorSelect} color='#FFC107'
                     className={"color-select"}
                     style={{backgroundColor: "#FFC107"}}/>
                <div onClick={this.props.colorSelect} color='#FF9800'
                     className={"color-select"}
                     style={{backgroundColor: "#FF9800"}}/>
                <div onClick={this.props.colorSelect} color='#FF5722'
                     className={"color-select"}
                     style={{backgroundColor: "#FF5722"}}/>
                <div onClick={this.props.colorSelect} color='#795548'
                     className={"color-select"}
                     style={{backgroundColor: "#795548"}}/>
                <div onClick={this.props.colorSelect} color='#9E9E9E'
                     className={"color-select"}
                     style={{backgroundColor: "#9E9E9E"}}/>
                <div onClick={this.props.colorSelect} color='#607D8B'
                     className={"color-select"}
                     style={{backgroundColor: "#607D8B"}}/>


                <hr />

                     <form onSubmit={this.customChange}>
                         <p style={{color: "#FFFFFF"}}> Hexcode: </p>
                         <input autoComplete="off" name="hexcode" onChange={this.onChange}/>
                         <br/>
                         <input ref="previewButton" className="custom-button" type="submit"/>
                     </form>

            </div>
        );
    }
}