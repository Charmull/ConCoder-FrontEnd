import React, { useState } from "react";
import { IconButton } from "@/components/_styled/Buttons";
import Modal from "@/hoc/Portal";
import SnapshotListModal from "@/components/Snapshot/SnapshotListModal";
import useModal from "@/hooks/useModal";
import { ISnapshotInfo, ISnapshotDetail } from "@/interface/ISnapshot";
import { useGet } from "@/hooks/useHttp";
import { useRecoilState, useResetRecoilState } from "recoil";
import { snapshotListState, snapshotState } from "@/store/snapshotState";

const SnapshotPopupBtn = () => {
  const [isModalOpen, setIsModalOpen] = useModal();
  const [snapshotList, setSnapshotList] = useRecoilState(snapshotListState);
  const resetSelectedSnapshot = useResetRecoilState(snapshotState);

  const { sendRequest } = useGet(
    { url: "/api/snapshots" },
    (list: Array<ISnapshotInfo>) => {
      const sortedList = Object.values(list).sort(
        (prev, cur) =>
          Date.parse(cur.createdDate) - Date.parse(prev.createdDate)
      );

      setSnapshotList({ list: sortedList });
    }
  );
  const onClickOpen = () => {
    resetSelectedSnapshot();
    sendRequest();
    setIsModalOpen(true);
  };

  return (
    <>
      <IconButton name="history" size="lg" onClick={onClickOpen} />
      <Modal
        className="h-[70%] w-[80%] min-w-[600px] max-w-[900px]"
        isShowing={isModalOpen}
        close={() => setIsModalOpen(false)}
      >
        <SnapshotListModal list={snapshotList.list} setModal={setIsModalOpen} />
      </Modal>
    </>
  );
};

export default SnapshotPopupBtn;
