export {}
// import {addActionListener, addRawActionReducer, dispatch, State} from "../store/store";
// import {GLOBAL_CLIENT} from "../../server-connection/client/client";
// import {ServerMessages} from "../../../../common/src/message-transport/serializer/client-server-serializer";
// import {isMessageFactory} from "../../../../common/src/message-transport/is-message";
// import {ReceivedFrameA, SelectedInstanceA, WorldStateConsumedA} from "../actions/simulation-instance";
//
// GLOBAL_CLIENT.createFilteredWrapperCallback(isMessageFactory<ServerMessages>()('sm-frame'), frame => {
//     dispatch({
//         type: "received-frame",
//         instanceId: frame.instanceId,
//         frame: frame.frame
//     });
// });
//
// addActionListener("selected-instance", async (st: SelectedInstanceA, disp) => {
//     disp({type: "requesting-frames"});
//     await GLOBAL_CLIENT.startSendingFrames(st.id, st.options);
// });
//
// // addActionListener("world-state-consumed", async (st: WorldStateConsumedA, disp, getState) => {
// //     const serverState = getState().server;
// //
// //     if (serverState.currentlyRequesting)
// //         return;
// //
// //     const currentBuffer = serverState.bufferedFrames;
// //     // -1 since the reducer will shift the first element of the buffer when this action reaches it
// //     if (currentBuffer.length >= NUMBER_OF_FRAMES_TO_BUFFER)
// //         return;
// //
// //     // debugger;
// //     const nrToReq = NUMBER_OF_FRAMES_TO_BUFFER - currentBuffer.length;
// //
// //     // there should always be at least one element in this array
// //
// //     const last = currentBuffer[currentBuffer.length - 1];
// //     if (!last)
// //         throw new Error('there is no frame remaining, can not request next');
// //
// //     const nextId = last.frameId + 1;
// //
// //     disp({type: "requesting-frames"});
// //     // console.log('Requesting ' + nrToReq + ' frames');
// //     const frames = await GLOBAL_CLIENT.requestFrames(nrToReq, nextId);
// //
// //     disp({
// //         type: 'received-new-frames',
// //         frames
// //     });
// // })
//
//
// addRawActionReducer("requesting-frames", (st) => {
//     return {
//         ...st,
//         server: {
//             ...st.server,
//             currentlyRequesting: true
//         }
//     } as State
// })
//
// addRawActionReducer("world-state-consumed", (st, ac: WorldStateConsumedA) => {
//     return {
//         ...st,
//         server: {
//             ...st.server,
//             bufferedFrames: st.server.bufferedFrames.slice(1)
//         }
//     } as State
// })
//
// addRawActionReducer("received-frame", (st, ac: ReceivedFrameA) => {
//     const frame = ac.frame;
//
//     const bf = st.server.bufferedFrames.concat([{frame}]);
//
//     // TODO there is an apparent overflow which will crash the app at some point
//     //  see if bf needs to be reduced
//
//     return {
//         ...st,
//         server: {
//             ...st.server,
//             bufferedFrames: bf
//         }
//     };
// });
