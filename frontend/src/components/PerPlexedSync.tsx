import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Divider,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect } from "react";
import { create } from "zustand";
import { useSyncSessionState } from "../states/SyncSessionState";
import { ContentCopyRounded } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

interface SyncInterfaceState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useSyncInterfaceState = create<SyncInterfaceState>((set, get) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));

function PerPlexedSync() {
  const { open, setOpen } = useSyncInterfaceState();
  const { room, isHost } = useSyncSessionState();
  const navigate = useNavigate();

  const [inputRoom, setInputRoom] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState("home");

  useEffect(() => {
    setInputRoom("");
    if (page !== "join") setError(null);
  }, [page]);

  useEffect(() => {
    if (!open && !room) setPage("home");
  }, [room, open]);

  return (
    <Backdrop
      sx={{
        zIndex: (theme) => 20000,
      }}
      open={open}
      onClick={() => setOpen(false)}
    >
      <Box
        sx={{
          width: "500px",
          height: "auto",
          backgroundColor: "#202020",
          padding: "20px",
          borderRadius: "10px",

          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: "10px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Typography
          sx={{
            color: "white",
            fontSize: "24px",
            fontWeight: "bold",
          }}
        >
          Nevu Sync
        </Typography>

        <Divider
          sx={{
            width: "100%",
          }}
          variant="middle"
        />

        {page === "load" && (
          <Box
            sx={{
              width: "100%",
              height: "150px",

              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <CircularProgress color="primary" />
          </Box>
        )}

        {page === "connected" && (
          <Box
            sx={{
              width: "100%",
              height: "150px",

              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <TextField
                id="room-id"
                value={room}
                InputProps={{
                  readOnly: true,
                }}
                placeholder="Room ID"
              >
                Room ID: 123456
              </TextField>
              <Button
                variant="text"
                color="primary"
                sx={{
                  height: "100%",
                }}
                onClick={() => {
                  navigator.clipboard.writeText(room || "");
                }}
              >
                <ContentCopyRounded color="primary" />
              </Button>
            </Box>

            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: "20px",
                mt: "10px",
              }}
            >
              {isHost && (
                <Button
                  variant="text"
                  color="primary"
                  onClick={() => {
                    setOpen(false);
                  }}
                >
                  Go
                </Button>
              )}

              <Button
                variant="text"
                color="primary"
                onClick={() => {
                  useSyncSessionState.getState().disconnect();
                  setPage("home");
                }}
              >
                Disconnect
              </Button>
            </Box>
          </Box>
        )}

        {page === "join" && (
          <Box
            sx={{
              width: "100%",
              height: "150px",

              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <Collapse in={error !== null}>
              <Typography
                sx={{
                  color: "red",
                  fontSize: "14px",
                }}
              >
                {error}
              </Typography>
            </Collapse>
            <TextField
              id="room-id"
              placeholder="Room ID"
              value={inputRoom}
              onChange={(e) => setInputRoom(e.target.value)}
            />

            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: "20px",
                mt: "10px",
              }}
            >
              <Button
                variant="text"
                color="primary"
                onClick={() => {
                  setPage("home");
                }}
              >
                Back
              </Button>

              <Button
                variant="text"
                color="primary"
                onClick={async () => {
                  setPage("load");
                  const res = await useSyncSessionState
                    .getState()
                    .connect(inputRoom, navigate);

                  console.log(res);

                  if (res !== true) {
                    setPage("join");
                    setError(res.message);
                    return;
                  }

                  if (!useSyncSessionState.getState().isHost) {
                    navigate("/sync/waitingroom");
                    setOpen(false);
                  }

                  setPage("connected");
                }}
              >
                Join
              </Button>
            </Box>
          </Box>
        )}

        {page === "home" && (
          <Box
            sx={{
              width: "100%",
              height: "150px",

              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                width: "50%",
                height: "150px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Button
                variant="text"
                color="primary"
                onClick={async () => {
                  setPage("load");
                  const res = await useSyncSessionState
                    .getState()
                    .connect(undefined, navigate);
                  if (res !== true) {
                    setError(res.message);
                    setPage("home");
                  }
                  setPage("connected");
                }}
              >
                Host
              </Button>
            </Box>

            <Divider orientation="vertical" flexItem />

            <Box
              sx={{
                width: "50%",
                height: "150px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Button
                variant="text"
                color="primary"
                onClick={() => {
                  setPage("join");
                }}
              >
                Join
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Backdrop>
  );
}

export default PerPlexedSync;
