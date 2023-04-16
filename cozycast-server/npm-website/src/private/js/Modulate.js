import { h } from 'preact'
import { useRef } from 'preact/hooks';

export const Modulate = ({ closeCallback, title, children }) => {

    const modulateOuter = useRef();
    return (
        <div class="modulate-absolute" ref={modulateOuter} onmousedown={(e) => { if (e.target == modulateOuter.current) if (closeCallback) closeCallback() }}>
            <div class="modulate-container">
                {title && <div class="roomSettingsHeaders">{title}</div>}
                {children}
                <button class="btn btn-primary btnStandard" type="button" onclick={closeCallback}>Close</button>
            </div>
        </div>
    );
}
