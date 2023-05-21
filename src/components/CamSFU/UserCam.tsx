import { useEffect, useRef, useState } from "react";
import { IconButton } from "../_styled/Buttons";
import { StreamManager, Publisher } from "openvidu-browser";
import { useRecoilValue } from "recoil";
import { userInfoState } from "@/store/userInfoState";
import tw from "tailwind-styled-components";

interface UserCamProps {
  streamManager: StreamManager | undefined | null;
  publisher?: Publisher | null;
  isVideoOff?: boolean;
  isMute?: boolean;
  handleVideoOff?: Function;
  handleMute?: Function;
}

const UserCam = (props: UserCamProps) => {
  const {
    streamManager,
    publisher,
    isVideoOff,
    isMute,
    handleVideoOff,
    handleMute,
  } = props;
  const videoRef = useRef(null);
  const userInfo = useRecoilValue(userInfoState);
  const [isLocal, setIsLocal] = useState<boolean>(false);

  const getUsernameTag = () => {
    let getClientData = streamManager
      ? JSON.parse(streamManager.stream.connection.data).clientData
      : "";

    if (userInfo.username === getClientData) {
      getClientData += " (나)";
    }

    return getClientData;
  };

  useEffect(() => {
    if (streamManager && !!videoRef.current) {
      streamManager.addVideoElement(videoRef.current);

      const getClientData = JSON.parse(
        streamManager.stream.connection.data
      ).clientData;
      getClientData === userInfo.username && setIsLocal(true);
    }
  }, [streamManager, videoRef]);

  return (
    <>
      <video autoPlay={true} ref={videoRef} className="mb-[5px]" />
      <FlexDiv>
        <NicknameHolder>{getUsernameTag()}</NicknameHolder>
        {isLocal ? (
          <ButtonsDiv>
            {isVideoOff ? (
              <span>
                <span />
                <IconButton
                  name="video-slash"
                  size="sm"
                  onClick={handleVideoOff}
                />
              </span>
            ) : (
              <div>
                <IconButton name="video" size="sm" onClick={handleVideoOff} />
              </div>
            )}
            {isMute ? (
              <span>
                <span />
                <IconButton
                  name="volume-xmark"
                  size="xs"
                  onClick={handleMute}
                />
              </span>
            ) : (
              <span>
                <IconButton name="volume-high" size="xs" onClick={handleMute} />
              </span>
            )}
          </ButtonsDiv>
        ) : null}
      </FlexDiv>
    </>
  );
};

export default UserCam;

const FlexDiv = tw.div`
flex justify-between items-center 
px-[5px]
relative bottom-[35px]
`;
const NicknameHolder = tw.div`
text-[10px]
`;

const ButtonsDiv = tw.div`
w-fit 
px-[12px] py-[5px]
flex gap-[10px] justify-end
rounded-[5px] bg-neutral
`;
