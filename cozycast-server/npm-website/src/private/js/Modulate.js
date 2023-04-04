import { h, Component, createRef } from 'preact'

export class Modulate extends Component {

    modulateOuter = createRef();
    render({children, closeCallback, title}) {
        return <div class="modulate-absolute" ref={this.modulateOuter} onmousedown={(e) => {if(e.target == this.modulateOuter.current) if(closeCallback) closeCallback()}}>
            <div class="modulate-container">
                {title && <div class="roomSettingsHeaders">{title}</div>}
            {children}
            <button class="btn btn-primary btnStandard" type="button" onclick={closeCallback}>Close</button>
            </div>
        </div>
        ;
    }
}
