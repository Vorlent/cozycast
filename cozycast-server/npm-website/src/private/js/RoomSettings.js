import { h } from 'preact'

import { Button } from './Button.js'

import { InviteModal } from './InviteModal.js'

import { PermissionManager } from './PermissionManager.js'

import { Modulate } from './Modulate.js'
import { RoomAdminUserlist } from './RoomAdminUserlist.js'
import { InviteManager } from './InviteManager.js'
import { Whisper } from './Whisper.js'
import { DefaultButton } from './DefaultButton.js'
import { useCallback, useContext, useEffect, useState } from 'preact/hooks'
import { WebSocketContext } from './websocket/WebSocketContext.js'

export const RoomSettings = ({ }) => {
    const { roomSettings, sendMessage, roomId } = useContext(WebSocketContext)
    const [localRoomSettings, setRoomSettings] = useState({});
    const [ openModal, setOpenModal ] = useState({});

    useEffect(() => {
        setRoomSettings(roomSettings.value);
    }, [roomSettings.value])

    const sendRoomSettings = () => {
        sendMessage({
            action: 'room_settings_save',
            desktopResolution: localRoomSettings.desktopResolution,
            streamResolution: localRoomSettings.streamResolution,
            framerate: localRoomSettings.framerate,
            videoBitrate: localRoomSettings.videoBitrate,
            audioBitrate: localRoomSettings.audioBitrate
        });
        alert("Send!")
    }

    const sendRoomAccess = () => {
        sendMessage({
            action: 'room_access_save',
            remote_ownership: "" + localRoomSettings.remote_ownership,
            default_image_permission: "" + localRoomSettings.default_image_permission,
            default_remote_permission: "" + localRoomSettings.default_remote_permission,
            hidden_to_unauthorized: "" + localRoomSettings.hidden_to_unauthorized,
            accessType: localRoomSettings.accessType,
            centerRemote: localRoomSettings.centerRemote
        });
        alert("Send!")
    }

    const sendWorkerRestart = () => {
        sendMessage({
            action: 'worker_restart'
        });
    }

    const restartWorker = () => {
        sendWorkerRestart()
    }

    const updateRoomSettings = (e) => {
        setRoomSettings(oldSettings => ({ ...oldSettings, [e.target.name]: e.target.value }))
    }

    const toggleRoomSettings = (e) => {
        setRoomSettings(oldSettings => ({ ...oldSettings, [e.target.name]: !oldSettings[e.target.name] }))
    }

    const openPermissionModal = () => {
        sendMessage({
            action: 'getuserinfo'
        });
        
        setOpenModal({permissionModal: true})
    }

    const closeModalCallback = useCallback(() => {
        setOpenModal({})
    }, []);

    return (
        <div id="settings" class="roomSettingsContainer">
            {openModal.inviteModal && <InviteModal roomId={roomId.value} closeModal={closeModalCallback} />}
            {openModal.permissionModal &&
                <Modulate title="User Management" closeCallback={closeModalCallback}>
                    <DefaultButton onclick={() => setOpenModal(({allPermission}) => ({permissionModal: true ,allPermission: !allPermission }))}>
                        {openModal.allPermission ? 'All Users' : 'Current Users'}
                    </DefaultButton>
                    {!openModal.allPermission && <RoomAdminUserlist />}
                    {openModal.allPermission && <PermissionManager room={roomId.value} />}
                </Modulate>}
            {openModal.inviteViewModal && <Modulate title="Invites" closeCallback={closeModalCallback}>
                <InviteManager room={roomId.value} />
            </Modulate>}
            {openModal.whisperModal && <Modulate title="Whisper" closeCallback={closeModalCallback}>
                <Whisper/>
            </Modulate>}

            <div class="roomSettingCategory">
                <div class="center roomSettingsHeaders">Room Access</div>

                <select id="room-access"
                    value={localRoomSettings.accessType}
                    name='accessType'
                    onChange={updateRoomSettings}>
                    <option value="public">Public</option>
                    <option value="authenticated">Users</option>
                    <option value="invite">Invited Users only</option>
                </select>
                <label>
                    <input
                        type="checkbox"
                        checked={localRoomSettings.hidden_to_unauthorized}
                        name="hidden_to_unauthorized"
                        onclick={toggleRoomSettings} />
                    Hidden To Unauthorized
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={localRoomSettings.default_image_permission}
                        name="default_image_permission"
                        onclick={toggleRoomSettings} />
                    Default Image Permission
                </label>

                <label>
                    <input
                        type="checkbox"
                        checked={localRoomSettings.default_remote_permission}
                        name="default_remote_permission"
                        onclick={toggleRoomSettings} />
                    Default Remote Permission
                </label>

                <label>
                    <input
                        type="checkbox"
                        checked={localRoomSettings.remote_ownership}
                        name="remote_ownership"
                        onclick={toggleRoomSettings} />
                    Remote Ownership
                </label>

                <label>
                    <input
                        type="checkbox"
                        checked={localRoomSettings.centerRemote}
                        name="centerRemote"
                        onclick={toggleRoomSettings} />
                    Always Center Remote
                </label>

                <Button enabled={true} style={"maxHeightButton"} onclick={sendRoomAccess}>
                    Update Room Access
                </Button>
            </div>

            <div class="roomSettingCategory">
                <div class="center roomSettingsHeaders">Admin Tools</div>

                <Button style={"maxHeightButton"} onclick={e => setOpenModal({ inviteModal: true })}>
                    Create Invite
                </Button>
                <Button style={"maxHeightButton"} onclick={restartWorker}>
                    Restart
                </Button>
                <Button style={"maxHeightButton"} onclick={openPermissionModal}>
                    User Management
                </Button>
                <Button style={"maxHeightButton"} onclick={e => setOpenModal({ inviteViewModal: true })}>
                    Invite Management
                </Button>
                <Button style={"maxHeightButton"} onclick={e => setOpenModal({ whisperModal: true })}>
                    Whisper User
                </Button>
            </div>
            <div class="roomSettingCategory">

                <div class="center roomSettingsHeaders">Stream settings</div>

                <table id="stream-settings">
                    <tbody>
                        <tr>
                            <td>Desktop Resolution</td>
                            <td>
                                <select id="settings-desktop-resolution"
                                    value={localRoomSettings.desktopResolution}
                                    name='desktopResolution'
                                    onChange={updateRoomSettings}>
                                    <option value="1080">1080p</option>
                                    <option value="720">720p</option>
                                    <option value="480">480p</option>
                                    <option value="240">240p</option>
                                    <option value="144">144p</option>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <td>Stream Resolution</td>
                            <td>
                                <select id="settings-stream-resolution"
                                    value={localRoomSettings.streamResolution}
                                    name='streamResolution'
                                    onChange={updateRoomSettings}>
                                    <option value="1080">1080p</option>
                                    <option value="720">720p</option>
                                    <option value="480">480p</option>
                                    <option value="240">240p</option>
                                    <option value="144">144p</option>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <td>Frame Rate</td>
                            <td>
                                <select id="settings-framerate"
                                    value={localRoomSettings.framerate}
                                    name='framerate'
                                    onChange={updateRoomSettings}>
                                    <option value="30">30 fps</option>
                                    <option value="25">25 fps</option>
                                    <option value="20">20 fps</option>
                                    <option value="15">15 fps</option>
                                    <option value="10">10 fps</option>
                                    <option value="5">5 fps</option>
                                </select>
                            </td>
                        </tr>

                        <tr>
                            <td>Video Bitrate</td>
                            <td>
                                <select id="settings-video-bitrate"
                                    value={localRoomSettings.videoBitrate}
                                    name='videoBitrate'
                                    onChange={updateRoomSettings}>
                                    <option value="2M">2 Mb/s</option>
                                    <option value="1M">1 Mb/s</option>
                                    <option value="500k">0.5 Mb/s</option>
                                    <option value="300k">0.3 Mb/s</option>
                                </select>
                            </td>
                        </tr>

                        <tr>
                            <td>Audio Bitrate</td>
                            <td>
                                <select id="settings-audio-bitrate"
                                    value={localRoomSettings.audioBitrate}
                                    name='audioBitrate'
                                    onChange={updateRoomSettings}>
                                    <option value="192k">192 Kb/s</option>
                                    <option value="96k">96 Kb/s</option>
                                    <option value="64k">64 Kb/s</option>
                                    <option value="48k">48 Kb/s</option>
                                    <option value="32k">32 Kb/s</option>
                                </select>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <Button enabled={true} style={"maxHeightButton"} onclick={sendRoomSettings}>
                    Update Stream Settings
                </Button>
            </div>
        </div>
    );
}
