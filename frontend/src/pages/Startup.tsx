import { Box } from "@mui/material";
import axios from "axios";
import React, { useEffect, useRef } from "react";
import { create } from "zustand";
import { getBackendURL } from "../backendURL";
import Utility from "./Utility";

interface StartupState {
  loading: boolean;
  setLoading: (loading: boolean) => void;

  showDiagnostic: boolean;
  setShowDiagnostic: (showDiagnostic: boolean) => void;

  lastStatus?: PerPlexed.Status;
  setLastStatus: (status: PerPlexed.Status) => void;

  frontEndStatus?: PerPlexed.Status;
  setFrontEndStatus: (frontEndStatus: PerPlexed.Status | undefined) => void;
}

export const useStartupState = create<StartupState>((set) => ({
  loading: true,
  setLoading: (loading) => set({ loading }),

  showDiagnostic: false,
  setShowDiagnostic: (showDiagnostic) => set({ showDiagnostic }),

  lastStatus: undefined,
  setLastStatus: (lastStatus) => set({ lastStatus }),

  frontEndStatus: undefined,
  setFrontEndStatus: (frontEndStatus) => set({ frontEndStatus }),
}));

function Startup() {
  const {
    loading,
    showDiagnostic,
    setShowDiagnostic,
    lastStatus,
    setLastStatus,
    setLoading,
    frontEndStatus,
    setFrontEndStatus,
  } = useStartupState();

  const skipUpdates = useRef<boolean>(false);

  useEffect(() => {
    if (!loading || skipUpdates.current) return;

    const fetchStatus = async () => {
      const res = await axios
        .get(`${getBackendURL()}/status`, {
          timeout: 5000,
        })
        .then((res) => res.data as PerPlexed.Status)
        .catch(() => null);
      if (!res) {
        setFrontEndStatus({
          ready: false,
          error: true,
          message:
            "Frontend could not connect to the backend. Please check the backend logs for more information.",
        });
        return;
      }

      setLastStatus(res);
      setFrontEndStatus(undefined);
      if (res.error) setShowDiagnostic(true);
    };

    fetchStatus();

    const interval = setInterval(fetchStatus, 2500);

    return () => {
      clearInterval(interval);
    };
  }, [loading, setFrontEndStatus, setLastStatus, setShowDiagnostic]);

  useEffect(() => {
    if (!lastStatus || skipUpdates.current) return;

    if (lastStatus.ready) {
      (async () => {
        skipUpdates.current = true;
        let reload = false;

        const config = await axios
          .get(`${getBackendURL()}/config`)
          .then((res) => res.data as PerPlexed.Config)
          .catch(() => null);

        if (!config) {
          setFrontEndStatus({
            ready: false,
            error: true,
            message:
              "Frontend could not retrieve the configuration from the backend. Please check the backend logs for more information.",
          });
          skipUpdates.current = false;
          return;
        }

        if (JSON.stringify(config.CONFIG) !== localStorage.getItem("config")) {
          localStorage.setItem("config", JSON.stringify(config.CONFIG));
          reload = true;
        }

        // const currServer = localStorage.getItem("server");

        // if(config.PLEX_SERVER !== currServer) reload = true;
        // skipUpdates.current = false;

        // localStorage.setItem("server", config.PLEX_SERVER);
        localStorage.setItem("deploymentId", config.DEPLOYMENTID);


        if (reload) return window.location.reload();
        else {
          setShowDiagnostic(false);
          setLoading(false);
        }
      })();
    }
  }, [
    lastStatus,
    setFrontEndStatus,
    setLastStatus,
    setLoading,
    setShowDiagnostic,
  ]);

  if (showDiagnostic || frontEndStatus) return <Utility />;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "black",
      }}
    >
      <img
        src="/logoBig.png"
        alt="NEVU Logo"
        style={{ width: "35vw", height: "auto" }}
      />
    </Box>
  );
}

export default Startup;
