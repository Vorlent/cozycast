import { h, Component } from 'preact'

export class InfoScreen extends Component {

    render({ message,submessage }) {
        return <div class="admin-background">
                <div class="infoScreenCenter">
                    <div class="infoScreenMessage">{message}</div>
                    <div class="infoScreenSubMessage">{submessage}</div>
                </div>
            </div>
            ;
    }
}
