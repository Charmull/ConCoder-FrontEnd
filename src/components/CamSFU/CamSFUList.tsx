import { useEffect, useState } from "react";
import { OpenVidu, Publisher, Session, StreamManager } from "openvidu-browser";
import { useRecoilState, useRecoilValue } from "recoil";
import { userInfoState } from "@/store/userInfoState";
import axios from "axios";
import UserCam from "./userCam";
import { IconButton } from "../_styled/Buttons";
import { memberInfoState } from "@/store/memberInfoState";

interface userOVData {
  sessionId: string;
  username: string;
}

const CamSFUList = () => {
  const [OV, setOV] = useState<OpenVidu>();
  const [session, setSession] = useState<Session>();
  const userInfo = useRecoilValue(userInfoState);
  const [userOVData, setUserOVData] = useState<userOVData>({
    sessionId: userInfo.workspaceId,
    username: userInfo.username,
  });
  const [publisher, setPublisher] = useState<Publisher | null>(null);
  const [subMems, setSubMems] = useState<Array<StreamManager>>([]);

  // 유동적 WebRTC 구조 변경 위해
  const [memberInfo, setMemberInfo] = useRecoilState(memberInfoState);

  const joinSession = () => {
    // 1. openvidu 객체 생성
    const newOV = new OpenVidu();
    // 필요없는 log는 enable
    newOV.enableProdMode();
    // 2. initSession 생성
    const newSession = newOV.initSession();

    // 워크스페이스 종료 등의 이벤트 시 세션을 disconnect하기 위해
    setOV(newOV);
    setSession(newSession);

    // 3. session에 connect
    const connection = () => {
      // subscribe
      newSession.on("streamCreated", (event) => {
        const newSubscriber = newSession.subscribe(event.stream, undefined);
        const newSubscribers = subMems;
        newSubscribers.push(newSubscriber);
        setSubMems([...newSubscribers]);
      });

      newSession.on("streamDestroyed", (event) => {
        deleteSubMem(event.stream.streamManager);
      });

      newSession.on("exception", (exception) => {
        console.warn(exception);
      });

      // token 생성
      getToken(userOVData?.sessionId).then((token: any) => {
        newSession
          .connect(token, { clientData: userOVData.username })
          .then(async () => {
            let newPublisher = newOV.initPublisher(undefined, {
              audioSource: undefined,
              videoSource: undefined,
              publishAudio: true,
              publishVideo: true,
              //   resolution: "640x480",
              frameRate: 30,
              insertMode: "APPEND",
              mirror: false,
            });

            newSession.publish(newPublisher);
            setPublisher(newPublisher);
          })
          .catch((error) => {
            console.warn(
              "There was an error connecting to the session",
              error.code,
              error.message
            );
          });
      });
    };

    connection();
  };

  const leaveSession = () => {
    if (session) {
      session.disconnect();
      setSession(undefined);
      setSubMems([]);
      setUserOVData({
        sessionId: userInfo.workspaceId,
        username: userInfo.username,
      });
      setPublisher(null);
    }
  };

  const getToken = async (sessionId: string) => {
    const resSessionId = await createSession(sessionId);
    return await createToken(resSessionId);
  };

  const createSession = async (sessionId: string) => {
    const response = await axios.post(
      `https://demos.openvidu.io/api/sessions`,
      { customSessionId: sessionId },
      { headers: { "Content-Type": "application/json" } }
    );

    return response.data;
  };

  const createToken = async (sessionId: string) => {
    const response = await axios.post(
      `https://demos.openvidu.io/api/sessions/${sessionId}/connections`,
      {},
      { headers: { "Content-Type": "application/json" } }
    );

    return response.data;
  };

  const deleteSubMem = (streamManager: StreamManager) => {
    const prevSubMems = subMems;
    let index = subMems.indexOf(streamManager, 0);
    if (index > -1) {
      prevSubMems.splice(index, 1);
      setSubMems([...prevSubMems]);
    }
  };

  // video, audio on/off
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isMute, setIsMute] = useState(false);
  const handleVideoOff = () => {
    setIsVideoOff((prev) => {
      publisher?.publishVideo(prev);
      return !prev;
    });
  };
  const handleMute = () => {
    setIsMute((prev) => {
      publisher?.publishAudio(prev);
      return !prev;
    });
  };

  useEffect(() => {
    joinSession();
    const leave = () => {
      leaveSession();
    };

    window.addEventListener("beforeunload", leave);

    return () => {
      window.removeEventListener("beforeunload", leave);
      leaveSession();
    };
  }, []);

  return (
    <>
      {memberInfo.memberNum > 2 ? (
        <>
          {publisher !== undefined ? (
            <div>
              <UserCam
                streamManager={publisher}
                isVideoOff={isVideoOff}
                isMute={isMute}
                handleVideoOff={handleVideoOff}
                handleMute={handleMute}
              />
            </div>
          ) : null}
          {subMems.map((sub, i) => (
            <div key={sub.id}>
              <UserCam
                streamManager={sub}
                isVideoOff={isVideoOff}
                isMute={isMute}
                handleVideoOff={handleVideoOff}
                handleMute={handleMute}
              />
            </div>
          ))}
        </>
      ) : null}

      {/* <>
        {publisher !== undefined ? (
          <div>
            <UserCam
              streamManager={publisher}
              isVideoOff={isVideoOff}
              isMute={isMute}
              handleVideoOff={handleVideoOff}
              handleMute={handleMute}
            />
          </div>
        ) : null}
        {subMems.map((sub, i) => (
          <div key={sub.id}>
            <UserCam
              streamManager={sub}
              isVideoOff={isVideoOff}
              isMute={isMute}
              handleVideoOff={handleVideoOff}
              handleMute={handleMute}
            />
          </div>
        ))}
      </> */}
    </>
  );
};

export default CamSFUList;
