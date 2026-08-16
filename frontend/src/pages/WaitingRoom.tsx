import { Box, Button, LinearProgress, Typography } from "@mui/material";
import React, { useEffect } from "react";
import { useSyncSessionState } from "../states/SyncSessionState";
import { useSyncInterfaceState } from "../components/PerPlexedSync";
import { useNavigate } from "react-router-dom";

function WaitingRoom() {
  const [loading, ] = React.useState(true);

  const { room, isHost, socket } = useSyncSessionState();
  const { setOpen } = useSyncInterfaceState();
  const navigate = useNavigate();

  useEffect(() => {
    if (isHost || !room) navigate("/");
  }, [room, isHost, navigate]);

  useEffect(() => {
    if(!socket) return;

    socket.once("RES_SYNC_RESYNC_PLAYBACK", (user, data: PerPlexed.Sync.PlayBackState) => {
      console.log("Playback resync received", data);
      navigate(`/watch/${data.key}?t=${data.time}`);
    })
  }, [navigate, socket]);

  return (
    <Box
      sx={{
        width: "100%",
        height: "100vh",

        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <img
        src="/logoBig.png"
        alt="NEVU"
        style={{
          width: "30vw",
          height: "auto",
          display: "block",
        }}
      />

      <Typography
        sx={{
          color: "white",
          fontSize: "24px",
          fontWeight: "bold",
          textAlign: "center",
          marginTop: "20px",
        }}
      >
        Waiting for host to start playback...
      </Typography>

      {loading && (
        <LinearProgress
          sx={{
            width: "200px",
            marginTop: "20px",
          }}
        />
      )}

      <Button onClick={() => setOpen(true)} sx={{ marginTop: "20px" }}>
        Open Sync Interface
      </Button>
    </Box>
  );
}

export default WaitingRoom;
