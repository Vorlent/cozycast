import { Component, render } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'

import { state, updateState } from '/js/index.js'


export function showHover(e,name,pos,showUsername) {
    if(pos =='top' && showUsername) return;
    let box = e.target.getBoundingClientRect();
    if(pos == 'top'){
    updateState(function (state) {
        state.hoverText = {
            text: name,
            x: Math.round(box.x) + box.width/2,
            y: Math.round(box.y) - box.width/2 * 1.3,
            pos: 'top'
        };
    })
    } else if (pos == 'right'){
        updateState(function (state) {
            state.hoverText = {
                text: name,
                x: Math.round(box.x) + box.width * 1.1,
                y: Math.round(box.y) + box.width/2,
                pos: 'right'
            };
        })
        }
}

export function hideHover(){
    updateState(function (state) {
        delete state.hoverText;
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