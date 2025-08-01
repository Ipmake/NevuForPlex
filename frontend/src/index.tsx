import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "@emotion/react";
import { CssBaseline, createTheme } from "@mui/material";
import { BrowserRouter } from "react-router-dom";
import { makeid, uuidv4 } from "./plex/QuickFunctions";
import { getDeviceName, getPlatform, platformCache } from "./common/DesktopApp";

import "@fontsource-variable/quicksand";
import "@fontsource-variable/rubik";
import "@fontsource/ibm-plex-sans";
import "@fontsource-variable/inter";

if (!localStorage.getItem("clientID"))
  localStorage.setItem("clientID", makeid(24));

sessionStorage.setItem("sessionID", uuidv4());

let config: PerPlexed.ConfigOptions = {
  DISABLE_PROXY: false, // DEPRECATED
  DISABLE_NEVU_SYNC: false,
};

(() => {
  if (!localStorage.getItem("config")) return;
  config = JSON.parse(
    localStorage.getItem("config") as string
  ) as PerPlexed.ConfigOptions;
})();

if (!localStorage.getItem("quality")) localStorage.setItem("quality", "12000");

export { config };

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

getPlatform().then(async (platformData) => {
  if(!platformData) return;

  // make platformData.platform lowercase but capitalize the first letter
  platformData.platform = platformData.platform.charAt(0).toUpperCase() + platformData.platform.slice(1).toLowerCase();

  switch (platformData.platform) {
    case "Win32":
      platformData.platform = "Windows";
      break;
  }

  platformCache.platform = platformData;

  const deviceName = await getDeviceName();
  platformCache.deviceName = deviceName;

  if (platformCache.platform)
    console.log("Platform detected:", platformCache.platform);
  else console.warn("Platform detection failed.");
});

root.render(
  <ThemeProvider
    theme={createTheme({
      palette: {
        mode: "dark",
        primary: {
          main: "#6366F1", // Indigo
          dark: "#4F46E5",
          light: "#818CF8",
        },
        secondary: {
          main: "#F43F5E", // Rose
          dark: "#E11D48",
          light: "#FB7185",
        },
        background: {
          default: "#000000", // Deep blue-black
          paper: "#121927",
        },
        text: {
          primary: "#F4F8FF",
          secondary: "#CBD5E1",
        },
        success: {
          main: "#10B981",
          dark: "#059669",
          light: "#34D399",
        },
        warning: {
          main: "#F59E0B",
          dark: "#D97706",
          light: "#FBBF24",
        },
        error: {
          main: "#EF4444",
          dark: "#DC2626",
          light: "#F87171",
        },
      },
      typography: {
        fontFamily: '"Inter Variable", sans-serif',
      },
      components: {
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundImage: "none",
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              fontFamily: '"Inter Variable", sans-serif',
              borderRadius: "7px",
            },
          },
        },
        MuiBackdrop: {
          styleOverrides: {
            root: {
              height: "100vh",
              zIndex: 200,
            },
          },
        },
      },
    })}
  >
    <CssBaseline />
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ThemeProvider>
);
