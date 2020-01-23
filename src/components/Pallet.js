import React, {Component} from 'react';
import '../App.css';
import {faTimes} from '@fortawesome/free-solid-svg-icons'
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {ChromePicker} from 'react-color';

export default class Pallet extends Component {

    state = {
        hexcode: 0,
        displayColorPicker: false
    };

    handleClick = () => {
        if (!this.state.displayColorPicker) {
            this.setState({ displayColorPicker: true})
        } else {
            this.props.colorSelectCustom(this.state.hexcode);
            this.setState({ displayColorPicker: false});
        }
    };


    customChange = (color) => {
        this.setState({hexcode: color.hex});
    };

    close = (e) => {
        this.setState({displayColorPicker: false});
        this.props.closePallet();
    };


    render() {
        const popover = {
            position: 'absolute',
            zIndex: '2',
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)"
        };
        const cover = {
            position: 'fixed',
            top: '0px',
            right: '0px',
            bottom: '0px',
            left: '0px',
        };
        return (
            <div className="pallet" style={{display: this.props.pallet ? "initial" : "none"}}>
                <FontAwesomeIcon onClick={this.close} className="close" icon={faTimes} size="2x"/>
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

                <div>
                    { this.state.displayColorPicker ? <div style={ popover }>
                        <ChromePicker disableAlpha="true" color={ this.state.hexcode } onChange={this.customChange} />
                    </div> : null }
                    <button onClick={ this.handleClick } className="custom-button" style={{backgroundColor: this.state.displayColorPicker ? "#393e46" : "#222831"}}>{this.state.displayColorPicker ? "Pick Color" : "Choose Custom Color"}</button>

                </div>

            </div>
        );
    }
}