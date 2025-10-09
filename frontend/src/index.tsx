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
  if (!platformData) return;

  // make platformData.platform lowercase but capitalize the first letter
  platformData.platform =
    platformData.platform.charAt(0).toUpperCase() +
    platformData.platform.slice(1).toLowerCase();

  switch (platformData.platform) {
    case "Win32":
      platformData.platform = "Windows";
      break;
  }

  platformCache.platform = platformData;

  const deviceName = await getDeviceName();
  platformCache.deviceName = deviceName;

  if (platformCache.platform) {
    console.log("Platform detected:", platformCache.platform);
    platformCache.isDesktop = true;
  } else console.warn("Platform detection failed.");
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
              borderRadius: "4px",
              textTransform: "none",
              fontWeight: 600,
              letterSpacing: "0.025em",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            },
            contained: {
              backgroundColor: "rgba(18, 25, 39, 0.8)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff",
              "&:hover": {
                backgroundColor: "rgba(18, 25, 39, 0.95)",
                border: "1px solid rgba(99, 102, 241, 0.5)",
              },
            },
            outlined: {
              backgroundColor: "rgba(18, 25, 39, 0.6)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff",
              "&:hover": {
                backgroundColor: "rgba(18, 25, 39, 0.85)",
                border: "1px solid rgba(255,255,255,0.3)",
              },
            },
            text: {
              color: "rgba(255,255,255,0.9)",
              "&:hover": {
                backgroundColor: "rgba(18, 25, 39, 0.5)",
                backdropFilter: "blur(10px)",
                transform: "none",
                boxShadow: "none",
              },
            },
          },
        },
        MuiIconButton: {
          styleOverrides: {
            root: {
              width: 40,
              height: 40,
              borderRadius: "4px",
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.1)",
                transform: "scale(1.05)",
              },
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundColor: "rgba(18, 25, 39, 0.9)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "4px",
            },
            elevation1: {
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            },
            elevation2: {
              boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            },
            elevation6: {
              boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              backgroundColor: "rgba(18, 25, 39, 0.8)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "6px",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,255,255,0.2)",
              },
            },
          },
        },
        MuiDialog: {
          styleOverrides: {
            paper: {
              backgroundColor: "rgba(0,0,0,0.95)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "6px",
            },
          },
        },
        MuiPopover: {
          styleOverrides: {
            paper: {
              backgroundColor: "rgba(0,0,0,0.9)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "4px",
            },
          },
        },
        MuiMenu: {
          styleOverrides: {
            paper: {
              backgroundColor: "rgba(0,0,0,0.9)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "4px",
            },
          },
        },
        MuiMenuItem: {
          styleOverrides: {
            root: {
              borderRadius: "3px",
              margin: "2px 4px",
              transition: "all 0.2s ease",
              "&:hover": {
                transform: "translateX(2px)",
              },
            },
          },
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              "& .MuiOutlinedInput-root": {
                backgroundColor: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(20px)",
                borderRadius: "4px",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.08)",
                },
                "&.Mui-focused": {
                  backgroundColor: "rgba(255,255,255,0.1)",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(99, 102, 241, 0.8)",
                    borderWidth: "2px",
                  },
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.2)",
                  transition: "all 0.2s ease",
                },
              },
            },
          },
        },
        MuiSlider: {
          styleOverrides: {
            root: {
              "& .MuiSlider-thumb": {
                width: 16,
                height: 16,
                backgroundColor: "#6366F1",
                border: "2px solid rgba(255,255,255,0.3)",
                transition: "all 0.2s ease",
              },
              "& .MuiSlider-track": {
                backgroundColor: "#6366F1",
                border: "none",
                borderRadius: "4px",
              },
              "& .MuiSlider-rail": {
                backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: "4px",
              },
            },
          },
        },
        MuiChip: {
          styleOverrides: {
            root: {
              backgroundColor: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "4px",
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.15)",
                transform: "scale(1.05)",
              },
            },
          },
        },
        MuiTab: {
          styleOverrides: {
            root: {
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "4px",
              margin: "0 4px",
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.08)",
              },
              "&.Mui-selected": {
                backgroundColor: "rgba(99, 102, 241, 0.15)",
                color: "#818CF8",
              },
            },
          },
        },
        MuiSwitch: {
          styleOverrides: {
            root: {
              "& .MuiSwitch-switchBase": {
                "&.Mui-checked": {
                  "& + .MuiSwitch-track": {
                    backgroundColor: "#6366F1",
                  },
                },
              },
              "& .MuiSwitch-track": {
                backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: "6px",
              },
              "& .MuiSwitch-thumb": {
                backgroundColor: "#fff",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              },
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
