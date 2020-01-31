import React, {Component} from 'react';
import '../App.css';

export default class SkinMenu extends Component {

    load = (e) => {
        for (let i = 0; i < this.props.skins.length; i++) {
            if (this.props.skins[i].img === e.target.src) {
                this.props.setSkinIndex(i);
                this.props.loadSkin(e.target.src);
                break;
            }
        }
    };

    upload = () => {
        document.getElementById("selectImage").click();
    };

    render() {
        let skins = [];
        let i = 0;
        this.props.skins.forEach((s) => {
            skins.push(<div key={"skin" + i} className="skin-menu-preview"
                            style={{borderColor: i === this.props.selected ? "#F5D300" : "#41487C"}}>
                <img onClick={this.load} className="skin-menu-img" ref="skin0" src={s.img} alt="skin_img"/>
                <p> {(s.size === 128 ? "HD " : "") + s.type} </p></div>);
            i++;
        });

        return (
            <div className="skin-menu-container" style={{display: this.props.open ? "initial" : "none"}}>
                <div className="skin-menu-skins">
                    {skins}
                </div>
                <div style={{textAlign: "center"}}>
                    <svg onClick={this.props.remove} id="plus-circle-icon-2" data-name="plus-circle-icon" xmlns="http://www.w3.org/2000/svg"
                         width="40" height="40" viewBox="0 0 20 20" style={{padding: "20px"}}>
                        <path style={{cursor: "pointer"}} id="minus-circle-icon"
                              d="M9.641,20A9.826,9.826,0,0,1,0,10,9.826,9.826,0,0,1,9.641,0a9.826,9.826,0,0,1,9.641,10A9.826,9.826,0,0,1,9.641,20Zm0-17.5A7.369,7.369,0,0,0,2.41,10a7.369,7.369,0,0,0,7.231,7.5A7.369,7.369,0,0,0,16.872,10,7.369,7.369,0,0,0,9.641,2.5Zm4.821,8.75H4.821a1.251,1.251,0,0,1,0-2.5h9.641a1.251,1.251,0,0,1,0,2.5Z"
                              transform="translate(0.359)" fill="#41487C" fillRule="evenodd"/>
                    </svg>
                    <input id='selectImage' hidden style={{display: "none"}} type="file"
                           onChange={this.props.loadImage}/>
                    <svg onClick={this.upload} id="plus-circle-icon-2" data-name="plus-circle-icon" xmlns="http://www.w3.org/2000/svg"
                         width="40" height="40" viewBox="0 0 20 20" style={{padding: "20px"}}>
                        <path style={{cursor: "pointer"}} id="plus-circle-icon-2" data-name="plus-circle-icon"
                              d="M10,20A10,10,0,1,1,20,10,10,10,0,0,1,10,20ZM10,2.5A7.5,7.5,0,1,0,17.5,10,7.5,7.5,0,0,0,10,2.5Zm5,8.75H11.25V15a1.25,1.25,0,0,1-2.5,0V11.25H5a1.25,1.25,0,0,1,0-2.5H8.75V5a1.25,1.25,0,0,1,2.5,0V8.75H15a1.25,1.25,0,0,1,0,2.5Z"
                              fill="#41487C" fillRule="evenodd"/>
                    </svg>
                </div>
            </div>
        );
    }
}