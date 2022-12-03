import { useContext, useEffect, useRef, useState } from "react";
import LocalCam from "@/components/Cam/LocalCam";
import RemoteCam from "@/components/Cam/RemoteCam";

// stomp, sockJS
import SockJS from "sockjs-client";
import Stomp, { Client } from "webstomp-client";

import { userInfoState } from "@/store/userInfoState";
import { useRecoilState } from "recoil";
// import { useStompClient } from "@/context/WebSocketContext";

const CamList = () => {
  const [localStream, setLocalStream] = useState<MediaStream | undefined>(null);
  const setLocalStreamHandler = (stream) => {
    setLocalStream(stream);
  };

  // stomp
  const [stompClient, setStompClient] = useState<Client | null>(null);

  // userInfo
  const [userInfo, setUserInfo] = useRecoilState(userInfoState);

  // socket message send 함수
  const sendMsg = (endpoint: string, data: object) => {
    const payload = { ...data };
    stompClient?.send(
      `${endpoint}/${userInfo.workspaceId}`,
      JSON.stringify(payload)
    );
  };

  // webRTC
  const pcRef = useRef<Object | undefined>(new Object());
  const [pcs, setPcs] = useState<Object | undefined>(new Object());
  const setPcsHandler = (memId, pc) => {
    setPcs((prev: object) => {
      return { ...prev, [memId]: pc };
    });
  };
  const delPcsHandler = (memId) => {
    setPcs((prev: object) => {
      delete prev[memId];
      return { ...prev };
    });
  };

  // test용
  const [state, setState] = useState(0);
  const handler = () => {
    setState((prev) => {
      return !prev;
    });
    console.log(pcRef);
  };

  // remoteCam Component Ref
  const remoteCamRef = useRef();

  // user exit (브라우저 창 새로고침)
  const exit = () => {
    window.onbeforeunload = (event) => {
      event.preventDefault();
      event.returnValue = "";
      sendMsg("/pub/video/unjoined-room-info", {
        userId: userInfo.userId,
        sessionId: userInfo.userId,
      });
    };
  };

  useEffect(() => {
    let pc;

    if (localStream !== null && stompClient === null) {
      setStompClient(
        Stomp.over(new WebSocket("ws://163.180.146.59/api/ws-connection"), {
          debug: false,
        })
      );
    } else if (localStream !== null && stompClient !== null) {
      stompClient.connect(
        {},
        () => {
          stompClient.subscribe(
            `/sub/video/joined-room-info/${userInfo.workspaceId}`,
            async (msg) => {
              let users = JSON.parse(msg.body).userResponses;
              let topIdx = users.length - 1;
              let newUserId = users[topIdx].id;
              // workspace에 본인밖에 없음
              if (topIdx <= 0) return;
              // (본인이) workspace에 들어왔을 때 다른 멤버가 존재
              if (newUserId === userInfo.userId) {
                users.pop();
                console.log("기존 멤버 리스트입니다 " + users);
                for (let mem of users) {
                  pc = remoteCamRef.current.makePeerConnection();
                  pcRef.current[mem.id] = pc;
                  setPcsHandler(mem.id, pc);
                  pc = remoteCamRef.current.setPeerConnection(
                    pc,
                    userInfo.userId,
                    mem.id
                  );
                }
                return;
              }
              // workspace에 새로운 멤버가 들어왔을 때
              console.log(newUserId + " 멤버가 방에 입장했습니다!");
              pc = remoteCamRef.current.makePeerConnection();
              pcRef.current[newUserId] = pc;
              setPcsHandler(newUserId, pc);
              pc = remoteCamRef.current.setPeerConnection(
                pc,
                userInfo.userId,
                newUserId
              );
              const offer = await pc.createOffer();
              pc.setLocalDescription(offer);
              sendMsg("/pub/video/caller-info", {
                from: userInfo.userId,
                to: newUserId,
                signal: offer,
                type: "offer",
              });
              console.log(newUserId + " 에게 offer 생성 후 보냄");
            }
          );

          stompClient.subscribe(
            `/sub/video/caller-info/${userInfo.workspaceId}`,
            async (msg) => {
              let data = JSON.parse(msg.body);
              let caller = data.from;
              let callee = data.to;

              if (caller === userInfo.userId || callee !== userInfo.userId)
                return;
              if (data.type === "offer") {
                let offer = data.signal;
                console.log(caller + " 에게 offer 받음, offer : " + offer);
                pc = pcRef.current[caller];
                pc.setRemoteDescription(offer);
                console.log("remoteDescription 설정");
                const answer = await pc.createAnswer();
                pc.setLocalDescription(answer);
                console.log("locatDescription 설정");
                sendMsg("/pub/video/callee-info", {
                  from: userInfo.userId,
                  to: caller,
                  signal: answer,
                });
                console.log(caller + " answer 생성 후 송신");
              } else if (data.type === "ice") {
                console.log("ice 수신");
                if (data.signal === null) {
                  return;
                }
                pc = pcRef.current[caller];
                pc.addIceCandidate(data.signal);
                console.log("ice candidate 추가");
              }
            }
          );

          stompClient.subscribe(
            `/sub/video/callee-info/${userInfo.workspaceId}`,
            (msg) => {
              let data = JSON.parse(msg.body);
              let from = data.from;
              if (from === userInfo.userId || data.to !== userInfo.userId)
                return;
              let answer = data.signal;
              console.log(from + " 에게 answer 받음, answer : " + answer);
              pc = pcRef.current[from];
              pc.setRemoteDescription(answer);
              console.log("remoteDescription 설정");
            }
          );

          stompClient.subscribe(
            `/sub/video/unjoined-room-info/${userInfo.workspaceId}`,
            (msg) => {
              let data = JSON.parse(msg.body);
              let exitedUserId = data.userId;
              delete pcRef.current[exitedUserId];
              delPcsHandler(exitedUserId);
            }
          );

          // connect되면 해당 endpoint로 메세지 전달 (입장 정보 전달)
          sendMsg("/pub/video/joined-room-info", {
            userId: userInfo.userId,
            sessionId: userInfo.userId,
          });
        },
        () => {
          console.log("error has occurred while trying to connect stompClient");
        }
      );
      exit();
    }

    // ws.onopen = () => {
    //   makeMsg("enter", "workspace01", localId);
    // };

    // ws.onmessage = async (msg) => {
    //   const parsedMsg = JSON.parse(msg.data);
    //   let pc: RTCPeerConnection | undefined;
    //   switch (parsedMsg.event) {
    //     case "memberEnter":
    //       memberEnterHandler(parsedMsg, pc);
    //       break;
    //     case "memList":
    //       memListHandler(parsedMsg, pc);
    //       break;
    //     case "offer":
    //       offerHandler(parsedMsg, pc);
    //       break;
    //     case "answer":
    //       answerHandler(parsedMsg, pc);
    //       break;
    //     case "ice":
    //       iceHandler(parsedMsg, pc);
    //       break;
    //     case "memberExit":
    //       memberExitHandler(parsedMsg);
    //       break;
    //   }
  }, [localStream, stompClient]);

  return (
    <>
      <div>
        <LocalCam onSetLocalStream={setLocalStreamHandler} />
      </div>
      <div>
        <RemoteCam
          stompClient={stompClient}
          sendMsg={sendMsg}
          localStream={localStream}
          pcs={pcs}
          ref={remoteCamRef}
        />
      </div>
      <button onClick={handler}>test !!</button>
    </>
  );
};

export default CamList;
