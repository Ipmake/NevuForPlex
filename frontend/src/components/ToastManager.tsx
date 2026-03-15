import {
  PersonAddRounded,
  PersonRemoveRounded,
  PlayArrowRounded,
  PauseRounded,
  ResetTvRounded,
} from "@mui/icons-material";
import { Avatar, Box, Divider, Typography } from "@mui/material";
import { create } from "zustand";
import { useEffect, useState } from "react";
import React from "react";

export interface ToastState {
  toasts: ToastProps[];
  addToast: (
    user: PerPlexed.Sync.Member,
    icon: ToastIcons,
    message: string,
    duration: number
  ) => void;
}

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  addToast: (
    user: PerPlexed.Sync.Member,
    icon: ToastIcons,
    message: string,
    duration: number = 5000
  ) => {
    const toastID = Math.random() * 1000;

    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id: toastID,
          user,
          icon,
          message,
          duration,
          toRemove: false,
        },
      ],
    }));
  },
}));

interface ToastProps {
  id: number;
  duration: number;
  message: string;
  user: PerPlexed.Sync.Member;
  icon: ToastIcons;
  toRemove?: boolean;
}

function ToastManager() {
  const { toasts } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      let toasts = useToast.getState().toasts;

      if (!toasts.length) return;

      // only filter if all toasts are to be removed
      if (toasts.every((toast) => toast.toRemove)) {
        toasts = toasts.filter((toast) => !toast.toRemove);

        useToast.setState({
          toasts,
        });
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      sx={{
        position: "fixed",
        top: "64px",
        right: "0",
        zIndex: 30000,
        overflow: "hidden",
        pointerEvents: "none",

        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        justifyContent: "flex-start",
      }}
    >
      {toasts.map((toast, index) => (
        <Toast
          id={toast.id}
          key={index}
          user={toast.user}
          icon={toast.icon}
          message={toast.message}
          duration={toast.duration}
        />
      ))}
    </Box>
  );
}

export default ToastManager;

export type ToastIcons =
  | "Play"
  | "Pause"
  | "UserAdd"
  | "UserRemove"
  | "PlaySet";

export function Toast({
  id,
  user,
  icon,
  message,
  duration = 5000,
}: {
  id: number;
  user: PerPlexed.Sync.Member;
  icon: ToastIcons;
  message: string;
  duration?: number;
}) {
  /*
   * Animation States:
   * 0 - Slide in
   * 1 - Static
   * 2 - Slide out
   */
  const [animationState, setAnimationState] = useState(0);

  useEffect(() => {
    setTimeout(() => {
      setAnimationState(1);
    }, 500);

    setTimeout(() => {
      setAnimationState(2);

      setTimeout(() => {
        console.log(id);

        let toasts = useToast.getState().toasts;

        toasts = toasts.map((toast) => {
          if (toast.id === id) {
            toast.toRemove = true;
          }

          return toast;
        });

        useToast.setState({
          toasts,
        });
      }, 500);
    }, duration);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box
      sx={{
        width: "300px",
        height: "75px",

        background: "#121212",

        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",

        px: "15px",
        transition: "all 0.5s ease-in-out",

        transform: `translateX(${
          animationState === 0 ? "300px" : animationState === 2 ? "300px" : "0"
        })`,
      }}
    >
      {icon === "Play" && (
        <PlayArrowRounded
          sx={{
            color: "white",
            fontSize: "2rem",
          }}
        />
      )}

      {icon === "Pause" && (
        <PauseRounded
          sx={{
            color: "white",
            fontSize: "2rem",
          }}
        />
      )}

      {icon === "PlaySet" && (
        <ResetTvRounded
          sx={{
            color: "white",
            fontSize: "2rem",
          }}
        />
      )}

      {icon === "UserAdd" && (
        <PersonAddRounded
          sx={{
            color: "white",
            fontSize: "2rem",
          }}
        />
      )}

      {icon === "UserRemove" && (
        <PersonRemoveRounded
          sx={{
            color: "white",
            fontSize: "2rem",
          }}
        />
      )}

      <Divider
        orientation="vertical"
        variant="middle"
        flexItem
        sx={{ mx: "15px" }}
      />

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            color: "white",
            fontSize: "1rem",
            fontWeight: "bold",

            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Avatar
            src={user.avatar}
            sx={{
              width: "20px",
              height: "20px",
            }}
          />

          <Typography
            sx={{
              display: "inline",
              ml: "5px",

              fontSize: "1rem",
              fontWeight: "bold",
              fontFamily: '"Montserrat Variable", sans-serif',
            }}
          >
            {user.name}
          </Typography>
        </Box>

        <Typography
          sx={{
            color: "white",
            fontSize: "0.9rem",
            fontWeight: "normal",

            // make this a one liner
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "200px",
          }}
        >
          {message}
        </Typography>
      </Box>
    </Box>
  );
}
