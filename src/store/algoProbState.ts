import {
  IAlgoProbCategory,
  IAlgoProbInfo,
  IAlgoProbLevel,
} from "@/interface/AlgoProbLevel";
import { atom } from "recoil";

/* initial states */
const algoProbListInitialState: { list: Array<IAlgoProbInfo>; length: number } =
  {
    list: [],
    length: 0,
  };

const algoProbLevelInitialState: { list: Array<IAlgoProbLevel> } = {
  list: [],
};

const algoProbCategoryInitialState: { list: Array<IAlgoProbCategory> } = {
  list: [],
};

/* atoms */
export const algoProbListState = atom({
  key: "algoProbList",
  default: algoProbListInitialState,
});

export const algoProbLevelState = atom({
  key: "algoProbLevel",
  default: algoProbLevelInitialState,
});

export const algoProbCategoryState = atom({
  key: "algoProbCategory",
  default: algoProbCategoryInitialState,
});
