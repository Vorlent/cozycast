import { Component, render } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'

export class Button extends Component {

    render({ enabled, onclick, children, title, style }, { xyz = [] }) {
        return html`
            <button class="btn ${style? style : ''} ${enabled ? 'btn-danger' : 'btn-primary'}"
                title="${title}"
                onclick=${e => onclick(e)}>
                ${children}
            </button>
        `;
    }
}
