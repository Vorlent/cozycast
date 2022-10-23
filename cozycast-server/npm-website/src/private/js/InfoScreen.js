import { h, Component } from 'preact'

export class InfoScreen extends Component {

    render({ message,submessage,children }) {
        return <div class="admin-background">
                <div class="infoScreenCenter">
                    <div class="infoScreenMessage">{message}</div>
                    <div class="infoScreenSubMessage">{submessage}</div>
                    {children}
                </div>
            </div>
            ;
    }
}
