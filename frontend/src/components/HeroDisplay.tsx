import {
  PlayArrowRounded,
  InfoOutlined,
  VolumeOffRounded,
  VolumeUpRounded,
  PauseRounded,
} from "@mui/icons-material";
import { Box, Typography, Button, IconButton } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { usePreviewPlayer } from "../states/PreviewPlayerState";
import ReactPlayer from "react-player";
import { useBigReader } from "./BigReader";
import { WatchListButton } from "./MovieItem";
import { getBackendURL } from "../backendURL";
import { queryBuilder } from "../plex/QuickFunctions";
import { getTranscodeImageURL } from "../plex";

function HeroDisplay({ item }: { item: Plex.Metadata }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const { MetaScreenPlayerMuted, setMetaScreenPlayerMuted } =
    usePreviewPlayer();

  const previewVidURL = item?.Extras?.Metadata?.[0]?.Media?.[0]?.Part?.[0]?.key
    ? `${getBackendURL()}/dynproxy${item?.Extras?.Metadata?.[0]?.Media?.[0]?.Part?.[0]?.key.split("?")[0]}?${
        queryBuilder({
          "X-Plex-Token": localStorage.getItem("accessToken"),
          ...Object.fromEntries(new URL("http://localhost:3000" + item?.Extras?.Metadata?.[0]?.Media?.[0]?.Part?.[0]?.key).searchParams.entries()),
        })
      }`
    : null;

  const [previewVidPlaying, setPreviewVidPlaying] = useState<boolean>(false);

  useEffect(() => {
    setPreviewVidPlaying(false);

    if (!previewVidURL) return;

    const timeout = setTimeout(() => {
      if (window.scrollY > 100) return;
      if (searchParams.has("mid")) return;
      if (document.location.href.includes("mid=")) return;
      setPreviewVidPlaying(true);
    }, 3000);

    const onScroll = () => {
      if (window.scrollY > 100) setPreviewVidPlaying(false);
      else setPreviewVidPlaying(true);
    };

    window.addEventListener("scroll", onScroll);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <Box
      sx={{
        width: "100%",
        height: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          right: "1vw",
          bottom: "20vh",
          opacity: previewVidURL ? 1 : 0,
          transition: "all 1s ease",
          zIndex: 2,
          cursor: "pointer",
          pointerEvents: "all",

          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
        }}
      >
        <IconButton
          sx={{
            backgroundColor: "#00000088",
          }}
          onClick={() => {
            setPreviewVidPlaying(!previewVidPlaying);
          }}
        >
          {previewVidPlaying ? <PauseRounded /> : <PlayArrowRounded />}
        </IconButton>

        <IconButton
          sx={{
            backgroundColor: "#00000088",
          }}
          onClick={() => {
            setMetaScreenPlayerMuted(!MetaScreenPlayerMuted);
          }}
        >
          {MetaScreenPlayerMuted ? <VolumeOffRounded /> : <VolumeUpRounded />}
        </IconButton>
      </Box>

      <Box
        sx={{
          width: "100%",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          background: `linear-gradient(90deg, #000000AA, #000000AA), url(${getTranscodeImageURL(
            item?.art,
            1920,
            1080
          )})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          zIndex: 0,
          position: "relative",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            // make it take up the full width of the parent
            width: "100%",
            height: "100vh",
            aspectRatio: "16/9",
            left: 0,
            top: 0,
            filter: "brightness(0.5)",
            opacity: previewVidPlaying ? 1 : 0,
            transition: "all 2s ease",
            backgroundColor: previewVidPlaying ? "#000000" : "transparent",
            pointerEvents: "none",

            overflow: "hidden",
            zIndex: 0,
          }}
        >
          <ReactPlayer
            url={previewVidURL ?? undefined}
            controls={false}
            width="100%"
            height="100%"
            playing={previewVidPlaying}
            volume={MetaScreenPlayerMuted ? 0 : 0.5}
            muted={MetaScreenPlayerMuted}
            onEnded={() => {
              setPreviewVidPlaying(false);
            }}
            pip={false}
            config={{
              file: {
                attributes: {
                  controlsList: "nodownload",
                  disablePictureInPicture: true,
                  disableRemotePlayback: true,
                  style: {
                    objectFit: "cover",
                    width: "100%",
                    height: "100%",
                    zIndex: -1,
                  }
                },
              },
            }}
          />
        </Box>

        <Box
          sx={{
            ml: 10,
            mb: "40vh",
            zIndex: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-start",
              mb: 0,
            }}
          >
            {/* <img
              src="/plexIcon.png"
              alt=""
              height="35"
              style={{
                aspectRatio: 1,
                borderRadius: 8,
              }}
            /> */}
            <Typography
              sx={{
                fontSize: "24px",
                fontWeight: "900",
                letterSpacing: "0.1em",
                color: (theme) => theme.palette.primary.main,
                textTransform: "uppercase",
              }}
            >
              {item.type}
            </Typography>
          </Box>
          <Typography
            sx={{
              fontSize: "3rem",
              fontWeight: "bold",
            }}
          >
            {item.title}
          </Typography>
          <Typography
            sx={{
              fontSize: "medium",
              fontWeight: "light",
              maxWidth: "35vw",

              // make the text max 4 lines long and add ellipsis
              display: "-webkit-box",
              WebkitLineClamp: 4,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",

              userSelect: "none",
              cursor: "zoom-in",
            }}
            onClick={() => {
              useBigReader.getState().setBigReader(item.summary);
            }}
          >
            {item.summary}
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-start",
              mt: 4,
              gap: 2,
              ml: 0,
              height: "36.5px",
            }}
          >
            <Button
              variant="contained"
              sx={{
                backgroundColor: (theme) => theme.palette.background.paper,
                color: (theme) => theme.palette.text.primary,
                fontWeight: "bold",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                gap: "10px",
                "&:hover": {
                  backgroundColor: (theme) => theme.palette.primary.dark,
                },
                transition: "all 0.2s ease-in-out",
              }}
              onClick={() => {
                if (!item) return;
                navigate(`/watch/${item.ratingKey}`);
              }}
            >
              <PlayArrowRounded fontSize="medium" /> Play
            </Button>

            <Button
              variant="contained"
              sx={{
                backgroundColor: (theme) => theme.palette.background.paper,
                color: (theme) => theme.palette.text.primary,
                fontWeight: "bold",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                "&:hover": {
                  backgroundColor: (theme) => theme.palette.primary.dark,

                  "& > *:nth-child(2)": {
                    width: "91px",
                    ml: "10px",
                  },
                },
                transition: "all 0.2s ease-in-out",
              }}
              onClick={() => {
                if (!item) return;
                setPreviewVidPlaying(false);
                setSearchParams({
                  ...searchParams,
                  mid: item.ratingKey.toString(),
                });
              }}
            >
              <InfoOutlined fontSize="medium" />{" "}
              <Typography
                sx={{
                  width: "0px",
                  userSelect: "none",
                  display: "inline",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  transition: "all 0.2s ease-in-out",

                  fontSize: "0.875rem",
                  lineHeight: "1.75",
                }}
              >
                More Info
              </Typography>
            </Button>

            <WatchListButton item={item} />
          </Box>
        </Box>
      </Box>
      <Box
        sx={{
          width: "100%",
          height: "40vh",
          position: "absolute",
          top: "65vh",

          backgroundImage:
            "linear-gradient(180deg, #00000000, #000000AA, #000000FF)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundColor: "transparent",
          zIndex: 1,
        }}
      />
    </Box>
  );
}

export default HeroDisplay;
