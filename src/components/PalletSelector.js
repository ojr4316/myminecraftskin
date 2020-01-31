import React, {Component} from 'react';
import '../App.css';
import LoadablePallet from "./LoadablePallet";
import {faTimes} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

export default class PalletSelector extends Component {

    skin1 = ['Skin Tones 1', '#8D5524', '#C68642', '#E0AC69',  '#F1C27D', '#FFDBAC'];
    skin2 = ['Skin Tones 2', '#FFE0BD', '#FFCD94', '#EAC086', '#FFAD60', '#FFE39F'];
    skin3 = ['Skin Tones 3', '#FFE9DC', '#FCE9DB', '#E0A899', '#DFA290', '#C99789'];
    skin4 = ['Skin Tones 4', '#F7C19B', '#F7C19B', '#EBAB7F', '#D39972', '#BD8966'];
    skin5 = ['Skin Tones 5', '#9C7248', '#926A2D', '#876127', '#7C501A', '#6F4F1D'];

    colorful1 = ['Colorful 1', '#D9534F', '#F9F9F9', '#5BC0DE', '#5CB85C', '#428BCA'];
    colorful2 = ['Colorful 2', '#FF71CE', '#01CDFE', '#05FFA1', '#B967FF', '#FFFB96'];
    colorful3 = ['Colorful 3', '#EE4035', '#F37736', '#FDF498', '#7BC043', '#0392CF'];
    colorful4 = ['Colorful 4', '#FF00A9', '#FB9F9F', '#FF0065', '#FFBFD3', '#FB5858'];
    colorful5 = ['Colorful 5', '#FFFFFF', '#FFF000', '#F231F2', '#6565BF', '#6EFDFD'];


    customPallets = [];

    addPallet = () => {
        let p = [...this.props.colors];
        p.unshift("Custom Pallet " + (this.customPallets.length + 1));
        this.customPallets.push(p);
        this.forceUpdate();
    };

    render() {

        let custom = [];
        this.customPallets.forEach((p) => {
            console.log(p);
            custom.push(<LoadablePallet closePallet={this.props.close} loadPallet={this.props.loadPallet} colors={p}/>);
        });

        return (
            <div className="pallets" style={{display: this.props.open ? "flex" : "none"}}>
                <FontAwesomeIcon onClick={this.props.close} className="close" icon={faTimes} size="2x"/>
                <LoadablePallet closePallet={this.props.close} loadPallet={this.props.loadPallet} colors={this.skin1}/>
                <LoadablePallet closePallet={this.props.close} loadPallet={this.props.loadPallet} colors={this.skin2}/>
                <LoadablePallet closePallet={this.props.close} loadPallet={this.props.loadPallet} colors={this.skin3}/>
                <LoadablePallet closePallet={this.props.close} loadPallet={this.props.loadPallet} colors={this.skin4}/>
                <LoadablePallet closePallet={this.props.close} loadPallet={this.props.loadPallet} colors={this.skin5}/>

                <LoadablePallet closePallet={this.props.close} loadPallet={this.props.loadPallet} colors={this.colorful1}/>
                <LoadablePallet closePallet={this.props.close} loadPallet={this.props.loadPallet} colors={this.colorful2}/>
                <LoadablePallet closePallet={this.props.close} loadPallet={this.props.loadPallet} colors={this.colorful3}/>
                <LoadablePallet closePallet={this.props.close} loadPallet={this.props.loadPallet} colors={this.colorful4}/>
                <LoadablePallet closePallet={this.props.close} loadPallet={this.props.loadPallet} colors={this.colorful5}/>

                {custom}

                <svg onClick={this.addPallet} id="plus-circle-icon-2" data-name="plus-circle-icon" xmlns="http://www.w3.org/2000/svg"
                     width="80" height="80" viewBox="0 0 20 30" style={{padding: "20px"}}>
                    <path style={{cursor: "pointer"}} id="plus-circle-icon-2" data-name="plus-circle-icon"
                          d="M10,20A10,10,0,1,1,20,10,10,10,0,0,1,10,20ZM10,2.5A7.5,7.5,0,1,0,17.5,10,7.5,7.5,0,0,0,10,2.5Zm5,8.75H11.25V15a1.25,1.25,0,0,1-2.5,0V11.25H5a1.25,1.25,0,0,1,0-2.5H8.75V5a1.25,1.25,0,0,1,2.5,0V8.75H15a1.25,1.25,0,0,1,0,2.5Z"
                          fill="#41487C" transform="translate(0 10)" fillRule="evenodd"/>
                </svg>
            </div>
        );
    }
}