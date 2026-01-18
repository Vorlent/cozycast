import { h } from 'preact';
import { useContext, useState, useEffect } from 'preact/hooks';
import { AppStateContext } from './appstate/AppStateContext';

export const MediaSettings = () => {
    const { userSettings } = useContext(AppStateContext);
    const [settings, setSettings] = useState({});

    useEffect(() => {
        setSettings({ ...userSettings.value });
    }, []);

    const toggle = (e) => {
        setSettings(s => ({ ...s, [e.target.name]: e.target.checked }));
    };

    const saveSettings = () => {
        userSettings.value = { ...settings };
        localStorage.setItem("userSettings", JSON.stringify(settings));
        alert("Media settings updated!");
    };

    return (
        <div class="admin-background">
            <div class="profile modal">
                <div class="roomSettingsHeaders">MEDIA PREFERENCES</div>
                <div class="settingsContainer">
                    <div class="subSettings" style={{ display: 'block' }}>
                        <div style={{ padding: '10px 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <input
                                    class="modal-username"
                                    type="checkbox"
                                    id="manualLoadMedia"
                                    name="manualLoadMedia"
                                    onClick={toggle}
                                    checked={settings.manualLoadMedia}
                                />
                                <label for="manualLoadMedia" style={{ marginLeft: '8px' }}>
                                    Manually Load Images and Videos
                                </label>
                            </div>
                            <p style={{
                                fontSize: '0.85rem',
                                color: '#aaa',
                                marginTop: '5px',
                                fontStyle: 'italic'
                            }}>
                                Note: This is only useful if your internet connection is very slow.
                            </p>
                        </div>
                    </div>
                </div>
                <div class="confirmButton">
                    <button class="btn btn-danger btnStandard" type="button" onClick={saveSettings}>
                        Apply Media Settings
                    </button>
                </div>
            </div>
        </div>
    );
};