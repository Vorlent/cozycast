import { Component } from 'preact'
import { html } from 'htm/preact'

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