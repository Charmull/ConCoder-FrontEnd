import { ITestCase, ITestCaseResult } from "./../../store/testCaseState";
import { useContext, useEffect } from "react";
import { usePost } from "@/hooks/useHttp";
import { testCaseResultState, testCaseState } from "@/store/testCaseState";
import { useRecoilState, useRecoilValue } from "recoil";
import { toastMsgState } from "@/store/toastMsgState";
import { WebSocketContext } from "@/context/WebSocketContext";
import { userInfoState } from "@/store/userInfoState";

interface PropType {
  code: string;
}

const useCompile = () => {
  const [, setToastObj] = useRecoilState(toastMsgState);
  const testCaseList = useRecoilValue(testCaseState);
  const [testCaseResultLi, setTestCaseResultList] =
    useRecoilState(testCaseResultState);
  const handleCompileResult = (res: any, testCaseList: ITestCase[]) => {
    const data = res;
    console.log("data: ", data);

    console.log("testCaseList", testCaseList);
    const newList = testCaseList.map((e: ITestCase) => ({
      output: e.output,
      testCaseId: e.testCaseId,
    }));

    const testCaseResultList = newList.map((e: any) => {
      if (e.testCaseId == data.testCaseId) {
        console.log("data.id === e.id: ", e, data);
        return data.output === e.output
          ? { ...e, time: data.time, success: true }
          : { ...e, time: data.time, success: false };
      } else {
        console.log(testCaseResultLi);
        // testCaseResultLi가 handleCompileResult 실행될때마다 바뀌어야 함. 따라서 아래 useEffect의 의존성배열에 임시로 testCaseResultLi 추가함.
        // 그러나 너무 많은 리렌더링이 일어나므로 추후 로직 변경해줄 것 (TODO)
        let tempEl = testCaseResultLi.find((elm: ITestCaseResult) => {
          return elm.testCaseId === e.testCaseId;
        });
        return tempEl ? tempEl : e;
      }
    });

    console.log(newList, testCaseResultList);

    setTestCaseResultList(testCaseResultList);
  };

  const { isLoading, error, sendRequest } = usePost(
    { url: "/api/compile" },
    handleCompileResult
  );

  const stompClient = useContext(WebSocketContext);
  const userInfo = useRecoilValue(userInfoState);

  const onCompile = ({ code }: PropType) => {
    const inputList = testCaseList.map((e) => e?.input);

    if (!code || code.length == 0) {
      setToastObj({ show: true, msg: "코드를 입력하세요." });
    } else if (!inputList || inputList.length == 0) {
      setToastObj({ show: true, msg: "테스트케이스를 등록하세요." });
    } else {
      // sendRequest({
      //   code,
      //   inputs: inputList,
      // });
      // stompClient.connect({}, () => {
      stompClient.send(
        `/pub/compile/${userInfo.workspaceId}`,
        JSON.stringify({ code: code })
      );
      // });
    }
  };

  useEffect(() => {
    console.log("out");
    if (stompClient.connected) {
      console.log("in");
      stompClient.subscribe(
        `/sub/compile/${userInfo.workspaceId}`,
        async (res: any) => {
          const data = await JSON.parse(res.body);
          console.log("in useEffect, data: ", data);
          handleCompileResult(data, testCaseList);
        },
        { id: "compile" }
      );
    }

    return () => {
      console.log("비워주기");
      stompClient.unsubscribe("compile");
    };
    // testCaseResultLi
  }, [stompClient.connected, testCaseList, testCaseResultLi]);

  return { isLoading, error, onCompile };
};

export default useCompile;
