import React, {Component} from 'react';
import '../App.css';

export default class LoadablePallet extends Component {

    loadPallet = () => {
      this.props.loadPallet(this.props.colors);
      this.props.closePallet();
    };

    render() {

        let p = [];
        for (let i = 1; i < this.props.colors.length; i++) {
            p.push(<div key={"pallet" + i} className='color-bar' style={{backgroundColor: this.props.colors[i]}}/>);
        }

        return (
            <div onClick={this.loadPallet}>
                <div className="individual-pallet">
                    {p}
                </div>
                <p> {this.props.colors[0]} </p>
            </div>

        );
    }
}