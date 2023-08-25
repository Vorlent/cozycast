import { h} from 'preact'
import { useContext } from 'preact/hooks';
import { WebSocketContext } from './WebSocketContext';

export const useWebSocketSendMessage = () => {
  const { sendMessage } = useContext(WebSocketContext);
  return sendMessage;
};
