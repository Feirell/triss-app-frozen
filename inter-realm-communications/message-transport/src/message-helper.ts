// type GetReceiving<CC extends ChannelConnector<any, any, any>> = CC['RECEIVING_TYPE'];

import {ChannelConnector} from "./channel/channel-connector";
import {WrappedMessage} from "./wrapping/wrapped-message";
import {WrappedResponseMessage} from "./wrapping/wrapped-response-message";

export function awaitType<CC extends ChannelConnector<any, any, {type: string}>,
  Type extends CC["RECEIVING_TYPE"]["type"],
  unpack extends boolean>(
  cc: CC,
  type: Type,
  unpack: unpack
): unpack extends true
  ? Promise<Extract<CC["RECEIVING_TYPE"], {type: Type}>>
  : Promise<| WrappedMessage<Extract<CC["RECEIVING_TYPE"], {type: Type}>>
    | WrappedResponseMessage<Extract<CC["RECEIVING_TYPE"], {type: Type}>>> {
  if (unpack)
    return cc.waitForMessageWhichMeets(msg => msg.payload.type == type).then(v => v.payload) as any;
  else return cc.waitForMessageWhichMeets(msg => msg.payload.type == type) as any;
}
