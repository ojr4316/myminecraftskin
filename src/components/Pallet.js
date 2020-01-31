import React, {Component} from 'react';
import '../App.css';
import {faTimes} from '@fortawesome/free-solid-svg-icons'
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

export default class Pallet extends Component {

    state = {
        hexcode: "",
        val: ""
    };

    onChange = (e) => {
        this.setState({val: e.target.value});
        if (this.isColor(e.target.value)) {
            this.refs.previewButton.style.backgroundColor = e.target.value;
            if (this.isLight(e.target.value) > 255 / 2 || this.isLight(this.colorNameToHex(e.target.value)) > 255 / 2) {
                this.refs.previewButton.style.color = "#000000";
                this.refs.previewButton.style.borderColor = "#000000";
            } else {
                this.refs.previewButton.style.color = "#FFFFFF";
                this.refs.previewButton.style.borderColor = "#FFFFFF";
            }

            if (e.target.value[0] === "#") {
                this.setState({hexcode: e.target.value});
            } else {
                this.setState({hexcode: this.colorNameToHex(e.target.value)});
            }
        }
    };

    isColor = (strColor) => {
        let s = new Option().style;
        s.color = strColor;
        let test1 = s.color === strColor;
        let test2 = /^#[0-9A-F]{6}$/i.test(strColor);
        return test1 === true || test2 === true;
    };

    colorNameToHex = (colour) => {
        let colours = {
            "aliceblue": "#f0f8ff",
            "antiquewhite": "#faebd7",
            "aqua": "#00ffff",
            "aquamarine": "#7fffd4",
            "azure": "#f0ffff",
            "beige": "#f5f5dc",
            "bisque": "#ffe4c4",
            "black": "#000000",
            "blanchedalmond": "#ffebcd",
            "blue": "#0000ff",
            "blueviolet": "#8a2be2",
            "brown": "#a52a2a",
            "burlywood": "#deb887",
            "cadetblue": "#5f9ea0",
            "chartreuse": "#7fff00",
            "chocolate": "#d2691e",
            "coral": "#ff7f50",
            "cornflowerblue": "#6495ed",
            "cornsilk": "#fff8dc",
            "crimson": "#dc143c",
            "cyan": "#00ffff",
            "darkblue": "#00008b",
            "darkcyan": "#008b8b",
            "darkgoldenrod": "#b8860b",
            "darkgray": "#a9a9a9",
            "darkgreen": "#006400",
            "darkkhaki": "#bdb76b",
            "darkmagenta": "#8b008b",
            "darkolivegreen": "#556b2f",
            "darkorange": "#ff8c00",
            "darkorchid": "#9932cc",
            "darkred": "#8b0000",
            "darksalmon": "#e9967a",
            "darkseagreen": "#8fbc8f",
            "darkslateblue": "#483d8b",
            "darkslategray": "#2f4f4f",
            "darkturquoise": "#00ced1",
            "darkviolet": "#9400d3",
            "deeppink": "#ff1493",
            "deepskyblue": "#00bfff",
            "dimgray": "#696969",
            "dodgerblue": "#1e90ff",
            "firebrick": "#b22222",
            "floralwhite": "#fffaf0",
            "forestgreen": "#228b22",
            "fuchsia": "#ff00ff",
            "gainsboro": "#dcdcdc",
            "ghostwhite": "#f8f8ff",
            "gold": "#ffd700",
            "goldenrod": "#daa520",
            "gray": "#808080",
            "green": "#008000",
            "greenyellow": "#adff2f",
            "honeydew": "#f0fff0",
            "hotpink": "#ff69b4",
            "indianred ": "#cd5c5c",
            "indigo": "#4b0082",
            "ivory": "#fffff0",
            "khaki": "#f0e68c",
            "lavender": "#e6e6fa",
            "lavenderblush": "#fff0f5",
            "lawngreen": "#7cfc00",
            "lemonchiffon": "#fffacd",
            "lightblue": "#add8e6",
            "lightcoral": "#f08080",
            "lightcyan": "#e0ffff",
            "lightgoldenrodyellow": "#fafad2",
            "lightgrey": "#d3d3d3",
            "lightgreen": "#90ee90",
            "lightpink": "#ffb6c1",
            "lightsalmon": "#ffa07a",
            "lightseagreen": "#20b2aa",
            "lightskyblue": "#87cefa",
            "lightslategray": "#778899",
            "lightsteelblue": "#b0c4de",
            "lightyellow": "#ffffe0",
            "lime": "#00ff00",
            "limegreen": "#32cd32",
            "linen": "#faf0e6",
            "magenta": "#ff00ff",
            "maroon": "#800000",
            "mediumaquamarine": "#66cdaa",
            "mediumblue": "#0000cd",
            "mediumorchid": "#ba55d3",
            "mediumpurple": "#9370d8",
            "mediumseagreen": "#3cb371",
            "mediumslateblue": "#7b68ee",
            "mediumspringgreen": "#00fa9a",
            "mediumturquoise": "#48d1cc",
            "mediumvioletred": "#c71585",
            "midnightblue": "#191970",
            "mintcream": "#f5fffa",
            "mistyrose": "#ffe4e1",
            "moccasin": "#ffe4b5",
            "navajowhite": "#ffdead",
            "navy": "#000080",
            "oldlace": "#fdf5e6",
            "olive": "#808000",
            "olivedrab": "#6b8e23",
            "orange": "#ffa500",
            "orangered": "#ff4500",
            "orchid": "#da70d6",
            "palegoldenrod": "#eee8aa",
            "palegreen": "#98fb98",
            "paleturquoise": "#afeeee",
            "palevioletred": "#d87093",
            "papayawhip": "#ffefd5",
            "peachpuff": "#ffdab9",
            "peru": "#cd853f",
            "pink": "#ffc0cb",
            "plum": "#dda0dd",
            "powderblue": "#b0e0e6",
            "purple": "#800080",
            "rebeccapurple": "#663399",
            "red": "#ff0000",
            "rosybrown": "#bc8f8f",
            "royalblue": "#4169e1",
            "saddlebrown": "#8b4513",
            "salmon": "#fa8072",
            "sandybrown": "#f4a460",
            "seagreen": "#2e8b57",
            "seashell": "#fff5ee",
            "sienna": "#a0522d",
            "silver": "#c0c0c0",
            "skyblue": "#87ceeb",
            "slateblue": "#6a5acd",
            "slategray": "#708090",
            "snow": "#fffafa",
            "springgreen": "#00ff7f",
            "steelblue": "#4682b4",
            "tan": "#d2b48c",
            "teal": "#008080",
            "thistle": "#d8bfd8",
            "tomato": "#ff6347",
            "turquoise": "#40e0d0",
            "violet": "#ee82ee",
            "wheat": "#f5deb3",
            "white": "#ffffff",
            "whitesmoke": "#f5f5f5",
            "yellow": "#ffff00",
            "yellowgreen": "#9acd32"
        };

        if (typeof colours[colour.toLowerCase()] != 'undefined')
            return colours[colour.toLowerCase()];

        return false;
    };

    isLight = (c) => {
        let color = "" + c, isHEX = color.indexOf("#") === 0, isRGB = color.indexOf("rgb") === 0;
        let r, g, b;
        if (isHEX) {
            const hasFullSpec = color.length === 7;
            let m = color.substr(1).match(hasFullSpec ? /(\S{2})/g : /(\S{1})/g);
            if (m){
                r = parseInt(m[0] + (hasFullSpec ? '' : m[0]), 16);
                g = parseInt(m[1] + (hasFullSpec ? '' : m[1]), 16);
                b = parseInt(m[2] + (hasFullSpec ? '' : m[2]), 16);
            }
        }
        if (isRGB) {
            let m = color.match(/(\d+){3}/g);
            if (m) {
                r = m[0];
                g = m[1];
                b = m[2];
            }
        }
        if (typeof r != "undefined") return ((r * 299) + (g * 587) + (b * 114)) / 1000;
    };

    customChange = (e) => {
        e.preventDefault();
        this.props.colorSelectCustom(this.state.hexcode);
        this.close();
    };

    close = () => {
        this.setState({val: ""});
        this.props.closePallet();
    };


    render() {
        let simColors = this.props.simColors(this.props.currentColor);
        let simColorSelectors = [];
        for (let i = 0; i < simColors.length; i++) {
            simColorSelectors.push(<div key={"selector" + i} onClick={this.props.colorSelect} color={simColors[i]}
                                        className={"color-select cs-xl"}
                                        style={{
                                            backgroundColor: simColors[i],
                                            borderColor: this.props.borderColor(simColors[i])
                                        }}/>);
        }

        return (
            <div className="pallet" style={{display: this.props.pallet ? "initial" : "none"}}>
                <FontAwesomeIcon onClick={this.close} className="close" icon={faTimes} size="2x"/>
                <p style={{fontSize: "1.5em", marginBottom: "8px"}}> Similar Colors </p>

                {simColorSelectors}

                <hr/>

                <form onSubmit={this.customChange}>
                    <p style={{fontSize: "1.5em", marginBottom: "8px"}}> Change Color </p>
                    <input className="color-input" autoComplete="off" name="hexcode" onChange={this.onChange}
                           value={this.state.val}/>
                    <br/>
                    <input ref="previewButton" className="custom-button" type="submit" />
                </form>

            </div>
        );
    }
}