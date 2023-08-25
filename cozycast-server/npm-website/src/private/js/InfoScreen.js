import { h } from 'preact'

export const InfoScreen = ({ message, submessage, children }) => {

    return (
        <div class="admin-background">
            <div class="infoScreenCenter">
                <div class="infoScreenMessage">{message}</div>
                <div class="infoScreenSubMessage">{submessage}</div>
                {children}
            </div>
        </div>
    );
}
