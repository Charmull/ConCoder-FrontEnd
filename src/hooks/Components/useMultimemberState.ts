import { useCallback, useEffect, useState } from "react";
import {
  TDAsset,
  TDBinding,
  TDShape,
  TDUser,
  TDUserStatus,
  TldrawApp,
} from "@tldraw/tldraw";
import { useThrottleCallback } from "@react-hook/throttle";
import * as yorkie from "yorkie-js-sdk";
import randomColor from "randomcolor";

export type Options = {
  apiKey?: string;
  presence: object;
  syncLoopDuration: number;
  reconnectStreamDelay: number;
};

export type YorkieDocType = {
  shapes: Record<string, TDShape>;
  bindings: Record<string, TDBinding>;
  assets: Record<string, TDAsset>;
};

// Client declaration
let client: yorkie.Client<yorkie.Indexable>;

// Document declaration
let doc: yorkie.Document<yorkie.Indexable>;

const useMultimemberState = (workspaceId: string, username: string) => {
  const [app, setApp] = useState<TldrawApp>();
  const [loading, setLoading] = useState<boolean>(true);

  //   ----- Callback 함수들 -----
  const onMount = useCallback(
    (app: TldrawApp) => {
      app.loadRoom(workspaceId);
      app.setIsLoading(true);
      app.pause();
      setApp(app);

      app.updateUsers([
        {
          id: app!.currentUser!.id,
          point: [0, 0],
          color: randomColor(),
          status: TDUserStatus.Connected,
          activeShapes: [],
          selectedIds: [],
          metadata: { name: username },
        },
      ]);
    },
    [workspaceId, username]
  );

  // app 모양이 변하면 Yorkie doc을 업데이트
  // throttle을 통한 Yorkie 업데이트 API call 오버로딩 방지
  const onChangePage = useThrottleCallback(
    (
      app: TldrawApp,
      shapes: Record<string, TDShape | undefined>,
      bindings: Record<string, TDBinding | undefined>
    ) => {
      if (!app || client === undefined || doc === undefined) return;

      doc.update((root) => {
        Object.entries(shapes).forEach(([id, shape]) => {
          if (!shape) {
            delete root.shapes[id];
          } else {
            root.shapes[id] = shape;
          }
        });

        Object.entries(bindings).forEach(([id, binding]) => {
          if (!binding) {
            delete root.bindings[id];
          } else {
            root.bindings[id] = binding;
          }
        });

        Object.entries(app.assets).forEach(([, asset]) => {
          if (!asset.id) {
            delete root.assets[asset.id];
          } else {
            root.assets[asset.id] = asset;
          }
        });
      });
    },
    60,
    false
  );

  // user의 포인터/선택이 변경될 때 업데이트 처리
  const onChangePresence = useThrottleCallback(
    (app: TldrawApp, user: TDUser) => {
      if (!app || client === undefined || !client.isActive()) return;

      client.updatePresence("user", user);
    },
    60,
    false
  );

  // ----- Document 변경관련 -----
  useEffect(() => {
    if (!app) return;

    // unload 전에 client 분리 및 비활성화
    const handleDisconnect = () => {
      if (client === undefined || doc === undefined) return;

      client.detach(doc);
      client.deactivate();
    };

    window.addEventListener("beforeunload", handleDisconnect);

    // 변화 subscribe
    const handleChanges = () => {
      const root = doc.getRoot();

      // 기록할 프록시 object 파싱
      const shapeRecord: Record<string, TDShape> = JSON.parse(
        root.shapes.toJSON()
      );
      const bindingRecord: Record<string, TDBinding> = JSON.parse(
        root.bindings.toJSON()
      );
      const assetRecord: Record<string, TDAsset> = JSON.parse(
        root.assets.toJSON()
      );

      // 페이지 내용을 변경된(받은) record로 바꾸기
      app?.replacePageContent(shapeRecord, bindingRecord, assetRecord);
    };

    let stillAlive = true;

    // document의 storage와 subscription 설정
    const setupDocument = async () => {
      try {
        // 01. 클라이언트 연결 및 활성화
        const options: Options = {
          apiKey: import.meta.env.VITE_YORKIE_API_KEY,
          presence: {
            user: app?.currentUser,
          },
          syncLoopDuration: 0,
          reconnectStreamDelay: 1000,
        };

        client = new yorkie.Client(
          import.meta.env.VITE_YORKIE_API_ADDR,
          options
        );
        await client.activate();

        // 01-1. peer 변화 event을 subscribe, tldraw user 상태 업데이트
        client.subscribe((event) => {
          if (event.type !== "peers-changed") return;

          const { type, peers } = event.value;
          // 워크스페이스를 떠난 유저는 제거
          if (type === "unwatched") {
            peers[doc.getKey()].map((peer) => {
              app?.removeUser(peer.presence.user.id);
            });
          }

          // 유저들 업데이트
          const allPeers = client
            .getPeersByDocKey(doc.getKey())
            .map((peer) => peer.presence.user);
          app?.updateUsers(allPeers);
        });

        // 02. tldraw custom object type으로 document 생성 후 client에 attach
        doc = new yorkie.Document<YorkieDocType>(workspaceId);
        await client.attach(doc);

        // 03. document가 존재하지 않는 경우 document를 초기화
        doc.update((root) => {
          if (!root.shapes) {
            root.shapes = {};
          }
          if (!root.bindings) {
            root.bindings = {};
          }
          if (!root.assets) {
            root.assets = {};
          }
        }, "create shapes/bindings/assets object if not exists");

        // 04. document event를 subscribe하고 변화를 핸들링
        doc.subscribe((event) => {
          if (event.type === "remote-change") {
            handleChanges();
          }
        });

        // 05. document에 대해 다른 피어와 동기화
        await client.sync();

        if (stillAlive) {
          handleChanges();

          if (app) {
            app.zoomToFit();
            if (app.zoom > 1) {
              app.resetZoom();
            }
            app.setIsLoading(false);
          }

          setLoading(false);
        }
      } catch (e) {
        console.error(e);
      }
    };

    setupDocument();

    return () => {
      window.removeEventListener("beforeunload", handleDisconnect);
      stillAlive = false;
    };
  }, [app]);

  return { onMount, onChangePage, loading, onChangePresence };
};

export default useMultimemberState;
