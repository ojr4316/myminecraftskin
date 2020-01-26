import React, {Component} from 'react';
import '../App.css';
import face from '../img/face.png';
import chest from '../img/chest.png';
import leftarm from '../img/leftarm.png';
import rightarm from '../img/rightarm.png';
import leftleg from '../img/leftleg.png';
import rightleg from '../img/rightleg.png';
import full from '../img/front.png';

export default class Parts extends Component {

    render() {
        let r ;
        if (this.props.part === -1) {
            r = <div><img alt="face" src={face} className="part face" onClick={this.props.head}/>
                <br/>
                <img alt="leftarm" src={leftarm} className="part appendage" onClick={this.props.leftArm}/>
                <img alt="chest" src={chest} className="part chest" onClick={this.props.chest}/>
                <img alt="rightarm" src={rightarm} className="part appendage" onClick={this.props.rightArm}/>
                <br/>
                <img alt="leftleg" src={leftleg} className="part appendage" onClick={this.props.leftLeg}/>
                <img alt="rightleg" src={rightleg} className="part appendage" onClick={this.props.rightLeg}/></div>;
        } else {
            r = <div><img alt="full body" src={full} className="part full" onClick={this.props.full}/></div>
        }
        return (
            <div className="parts">
                {r}
            </div>
        );
    }
}