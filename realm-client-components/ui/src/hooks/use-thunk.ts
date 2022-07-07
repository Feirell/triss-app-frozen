import {useDispatch} from "react-redux";
import {Dispatch} from "react";
import {AllActionTypes} from "@triss/state-management";

export const useThunkDispatch = () => useDispatch() as Dispatch<AllActionTypes>;
