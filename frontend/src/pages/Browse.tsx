import React from "react";
import { Box, Button, ButtonGroup } from "@mui/material";
import { create } from "zustand";
import { AnimatePresence } from "framer-motion";
import BrowseRecommendations from "./browse/BrowseRecommendations";
import BrowseLibrary from "./browse/BrowseLibrary";

type BrowsePages = "recommendations" | "browse";

interface BrowsePageOptionsState {
  page: BrowsePages;
  setPage: (page: BrowsePages) => void;
}

const useBrowsePageOptions = create<BrowsePageOptionsState>((set) => ({
  page:
    (localStorage.getItem("browsePage") as BrowsePages) || "recommendations",
  setPage: (page: BrowsePages) => {
    localStorage.setItem("browsePage", page);
    set({ page });
  },
}));

function Library() {
  const { page, setPage } = useBrowsePageOptions();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        width: "100%",
      }}
    >
      <ButtonGroup
        variant="outlined"
        sx={{
          zIndex: 5,
          mb: 2,
          right: { xs: "8px", sm: "24px", md: "48px" },
          top: "64px",
          position: "absolute",
          opacity: 0.7,
          filter: "brightness(0.7)",

          "&:hover": {
            opacity: 1,
            filter: "brightness(1)",
            transition: "all 0.4s ease",
          },
          transition: "all 1s ease",
        }}
      >
        <Button
          variant={page === "recommendations" ? "contained" : "outlined"}
          sx={{
            fontWeight: "bold",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            gap: "10px",
            transition: "all 0.2s ease-in-out",
          }}
          onClick={() => setPage("recommendations")}
        >
          Recommendations
        </Button>
        <Button
          variant={page === "browse" ? "contained" : "outlined"}
          sx={{
            fontWeight: "bold",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            gap: "10px",
            transition: "all 0.2s ease-in-out",
          }}
          onClick={() => setPage("browse")}
        >
          Browse
        </Button>
      </ButtonGroup>

      <AnimatePresence mode="wait">
        {page === "recommendations" && <BrowseRecommendations />}
        {page === "browse" && <BrowseLibrary />}
      </AnimatePresence>
    </Box>
  );
}

export default Library;
