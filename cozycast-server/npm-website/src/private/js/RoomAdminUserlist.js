import { h, Component } from 'preact'
import { authFetch, TokenStatus } from './Authentication.js'
import { DefaultButton } from './DefaultButton.js'
import { BanModal } from './BanModal.js';

export class RoomAdminUserlist extends Component {

    constructor(props) {
        super(props);
        this.state = {
            banModal: false,
            banTarget: null,
            changed: false,
            room: this.props.room,
            userlistadmin: this.props.userlistadmin,
            default_remote_permission: this.props.default_remote_permission,
            default_image_permission: this.props.default_image_permission
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.userlistadmin !== prevProps.userlistadmin) {
            this.setState({
                changed: false,
                userlistadmin: this.props.userlistadmin
            })
        }
    }

    deletePerm(room, username) {
        authFetch(`/api/permission/${room}/${username}`, { method: "DELETE" }).then(e => this.refresh())
    }

    updatePerm = (perm) => {
        this.props.sendMessage({
            action: 'updatePermission',
            userId: perm.userId,
            invited: perm.invited,
            remote_permission: perm.remote_permission,
            image_permission: perm.image_permission,
            trusted: perm.trusted
        })
    }

    refresh = () => {
        this.setState({
            default_remote_permission: this.props.default_remote_permission,
            default_image_permission: this.props.default_image_permission
        })
        this.props.sendMessage({
            action: 'getuserinfo'
        })
    }

    filterUsers = (userId, field, value) => {
        let source;
        if (this.state.changed) source = this.state.userlistadmin;
        else source = this.props.userlistadmin;

        const newList = source.map((user) => {
            if (user.userId === userId) {
                return { ...user, [field]: value };
            }
            return user;
        });
        this.setState(state => {
            return {
                changed: true,
                userlistadmin: newList
            }
        });
    };

    updateRoomDefault = () => {
        this.props.sendMessage({
            action: 'room_access_save',
            default_image_permission: "" + this.state.default_image_permission,
            default_remote_permission: "" + this.state.default_remote_permission
        });
    }


    UserRow = (user, state, filterUsers, updatePerm) => {
        const { userId, nickname, nameColor, avatarUrl, anonymous, trusted, invited, tempInviteName, remote_permission, image_permission } = user;

        const onCheckboxToggle = (e) => {
            filterUsers(userId, e.target.name, e.target.checked);
        };

        return (
            <tr class="default-list-element">
                <td class="default-list-avatar-container-header ">
                    <img src={avatarUrl} className="default-list-avatar-image-header"></img>
                </td>
                <td style={{ color: nameColor }} className="nickname">
                    {nickname}
                </td>
                <td>{userId}</td>
                <td>
                    <input name="trusted" onclick={onCheckboxToggle} type="checkbox" checked={trusted} className="trusted"></input>
                </td>
                <td>
                    <input
                        name="invited"
                        onclick={onCheckboxToggle}
                        type="checkbox"
                        checked={invited || trusted}
                        className="invited"
                    />
                </td>
                <td>{tempInviteName}</td>
                <td>
                    <input
                        name="remote_permission"
                        onclick={onCheckboxToggle}
                        type="checkbox"
                        checked={trusted || remote_permission}
                        className="remotePermission"
                    ></input>
                    (<input type="checkbox" disabled checked={state.default_remote_permission || trusted || remote_permission}></input>)
                </td>
                <td>
                    <input
                        name="image_permission"
                        onclick={onCheckboxToggle}
                        type="checkbox"
                        checked={!anonymous && (trusted || image_permission)}
                        className="imagePermission"
                        disabled={anonymous}
                    />
                    (<input type="checkbox" disabled checked={!anonymous && (state.default_image_permission || trusted || image_permission)}></input>)
                </td>
                <td class="default-list-table-center">
                    <DefaultButton enabled={true} onclick={() => { updatePerm(user) }}>
                        Save
                    </DefaultButton>
                </td>
                <td class="default-list-table-center">
                    <DefaultButton
                        enabled={true}
                        onclick={() => { this.setState({ banModal: true, banTarget: user.userId }); }}
                    >
                        Ban/Kick
                    </DefaultButton>
                </td>
            </tr>
        );
    };

    render({ profile }, state) {
        return (
            <div class="default-list-background">
                {state.banModal && (
                    <BanModal
                        updateSettingsState={this.setState.bind(this)}
                        sendMessage={this.props.sendMessage}
                        banTarget={state.banTarget}
                    ></BanModal>
                )}
                <table class="default-list">
                    <tr>
                        <th>Avatar</th>
                        <th>Nickname</th>
                        <th>Username</th>
                        <th>Trusted</th>
                        <th>Invited</th>
                        <th>Invite Name</th>
                        <th>Remote</th>
                        <th>Images</th>
                        <th></th>
                        <th class="default-list-table-center">
                            <DefaultButton enabled={true} onclick={this.refresh}>
                                Refresh
                            </DefaultButton>
                        </th>
                    </tr>
                    <tbody>
                        <tr class="default-list-element">
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td>
                                (<input
                                    type="checkbox"
                                    checked={state.default_remote_permission}
                                    onclick={() =>
                                        this.setState(({ default_remote_permission }) => ({
                                            default_remote_permission: !default_remote_permission,
                                        }))
                                    }
                                    className="defaultRemoteToggle"
                                ></input>
                                default)
                            </td>
                            <td>
                                (<input
                                    type="checkbox"
                                    checked={state.default_image_permission}
                                    onclick={() =>
                                        this.setState(({ default_image_permission }) => ({
                                            default_image_permission: !default_image_permission,
                                        }))
                                    }
                                    className="defaultImageToggle"
                                ></input>
                                default)
                            </td>
                            <td class="default-list-table-center">
                                <DefaultButton enabled={true} onclick={this.updateRoomDefault}>
                                    Update
                                </DefaultButton>
                            </td>
                            <td></td>
                        </tr>
                    </tbody>
                    {state.userlistadmin.map((user) => this.UserRow(user, this.state, this.filterUsers, this.updatePerm))}
                </table>
            </div>
        );
    }
}
