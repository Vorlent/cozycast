import { Component, render } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'

import { state, updateState } from '/js/index.js'

export class Button extends Component {

    render({ enabled, onclick, children, title }, { xyz = [] }) {
        return html`
            <button class="btn ${enabled ? 'btn-danger' : 'btn-primary'}"
                title="${title}"
                onclick=${e => onclick(e)}>
                ${children}
            </button>
        `;
    }
}
