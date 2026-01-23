import { signal, computed } from "@preact/signals";

export function createWebsocketState() {
  const roomId = signal([]);
  const chatMessages = signal([]);
  const typingUsers = signal([]);
  const newMessageCount = signal(0);

  const authorization = signal({});
  const personalPermissions = signal({});
  const roomSettings = signal({});
  const banned = signal(false);
  const permissions = computed(() => {
    return {
      remotePermission: authorization.value.trusted || personalPermissions.value.remotePermission || roomSettings.value.default_remote_permission,
      imagePermission: !(authorization.value.anonymous) && (authorization.value.trusted || personalPermissions.value.imagePermission || roomSettings.value.default_image_permission)
    }
  });

  const viewPort = signal({
    width: 1280,
    height: 720,
  })

  const userlist = signal([]);
  const userlistAdmin = signal([]);
  const pingLookup = signal({});
  const remoteInfo = signal({});
  const session = signal({});
  const videoPaused = signal(true);
  const videoLoading = signal('loading');
  const audioOnly = signal(false);

  return { audioOnly, chatMessages, typingUsers,newMessageCount, permissions, personalPermissions, authorization, userlist, userlistAdmin , pingLookup, remoteInfo, session, roomSettings, roomId, viewPort, videoPaused, videoLoading, banned }
}