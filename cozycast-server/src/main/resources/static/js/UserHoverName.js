import { Component, render } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'


export function showHover(e,name,pos,showUsername,setState){
    if(pos =='top' && showUsername) return;
    let box = e.target.getBoundingClientRect();
    if(pos == 'top'){
        setState({
            hoverText: {
                text: name,
                x: Math.round(box.x) + box.width/2,
                y: Math.round(box.y) - box.width/2 * 1.1,
                pos: 'top'}
        })
    } else if (pos == 'right'){
        setState({
            hoverText: {
                text: name,
                x: Math.round(box.x) + box.width * 1.1,
                y: Math.round(box.y) + box.width/2,
                pos: 'right'}
        })
        }
}

export function hideHover(setState){
    setState({
        hoverText: undefined
    })
}

export class UserHoverName extends Component {

    render({ state }) {
        return html`
            <div style="top: ${state.hoverText.y}px; left:${state.hoverText.x}px;" class="hoverInfoScript ${state.hoverText.pos}">
                ${state.hoverText.text}
            </div>
        `;
    }
}