import { signal, computed, effect } from "@preact/signals";

function switchDesign(newDesign) {
  let design;
  switch (newDesign) {
    case 'legacyDesign':
      design = 'legacyDesign';
      break;
    case 'lightDesign':
      design = 'lightDesign';
      break;
    case 'defaultDesign':
    default:
      design = 'defaultDesign';
      break;
  }
  return design;
}

function isTouchDevice() {
  return window.matchMedia('(pointer: coarse)').matches;
}

function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function createAppState() {
  //Account
  const profile = signal({
    admin: false,
    nickname: "Anonymous",
    pingName: "anonymous"
  });
  const loggedIn = signal(false);
  const loginCompleted = signal(false);
  const inviteCode = signal(undefined);
  const accessCode = signal(undefined);

  //Volume
  let volumeLevel = parseInt(localStorage.getItem("volume"));
  if (!isNaN(volumeLevel)) volumeLevel = Math.max(Math.min(volumeLevel, 100), 0);
  else volumeLevel = 100;
  const volume = signal(volumeLevel);
  const muted = signal(localStorage.hasOwnProperty('muted') ? localStorage.getItem("muted") == 'true' : false);

  //Settings
  const updateDesign = signal(localStorage.getItem("design"));
  const design = computed(() => { return switchDesign(updateDesign.value) });
  const userSettings = signal({
    muteChatNotification: true,
    showUsernames: true,
    transparentChat: true,
    showLeaveJoinMsg: true,
    showIfMuted: true,
    ...JSON.parse(localStorage.getItem("userSettings"))
  });

  const touchDevice = signal(isMobileDevice());

  //Page Information
  const windowTitle = signal();
  effect(() => {
    let newTitle = (userSettings.value.titleNameInFront ? 'CozyCast: ' : '')  + windowTitle.value + (userSettings.value.titleNameInFront ? '' : ' - CozyCast');
    if (windowTitle.value) { document.title = newTitle}
    else {document.title = "CozyCast - Movie night over the internet"}
  });

  const registerWithInviteOnly = signal(true);
  const cozyMessage = signal("");

  return { design, updateDesign, profile, userSettings, loggedIn, touchDevice, registerWithInviteOnly, cozyMessage, loginCompleted, windowTitle, volume, muted, inviteCode, accessCode }
}