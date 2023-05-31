import { atom } from "recoil";

export interface StateType {
  memberNum: number;
}

const initialState: StateType = {
  memberNum: 1,
};

export const memberInfoState = atom({
  key: "memberInfo",
  default: initialState,
});
