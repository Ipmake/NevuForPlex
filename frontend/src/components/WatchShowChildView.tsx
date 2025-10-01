import {
  ArrowBackIosNewRounded,
  PlayArrowRounded,
  SubscriptionsRounded,
} from "@mui/icons-material";
import {
  Backdrop,
  Box,
  Divider,
  Fade,
  IconButton,
  LinearProgress,
  Paper,
  Popper,
  Portal,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import React, { useEffect } from "react";
import { useState } from "react";
import { getLibraryDir, getTranscodeImageURL } from "../plex";
import { getMinutes } from "./MetaScreen";
import { useNavigate } from "react-router-dom";

function WatchShowChildView({
  item,
  controlElementsVisibleState,
}: {
  item: Plex.Metadata;
  controlElementsVisibleState: [
    boolean,
    React.Dispatch<React.SetStateAction<boolean>>
  ];
}) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [seasons, setSeasons] = useState<Plex.Metadata[] | null>(null);
  const [episodes, setEpisodes] = useState<Plex.Metadata[] | null>(null);
  const [selectedSeason, setSelectedSeason] = useState(item.parentIndex ?? 1);
  const navigate = useNavigate();
  const theme = useTheme();

  const [, setControlElementsVisible] = controlElementsVisibleState;

  useEffect(() => {
    setSeasons(null);
    setEpisodes(null);

    (async () => {
      const getSeasons = new Promise<Plex.Metadata[]>((resolve) => {
        getLibraryDir(
          `/library/metadata/${item.grandparentRatingKey}/children`
        ).then((data) => {
          if (!data?.Metadata) return;
          resolve(data?.Metadata);
        });
      });

      const getEpisodes = new Promise<Plex.Metadata[]>((resolve) => {
        getLibraryDir(
          `/library/metadata/${item.grandparentRatingKey}/allLeaves`
        ).then((data) => {
          if (!data?.Metadata) return;
          resolve(data?.Metadata);
        });
      });

      const [seasons, episodes] = await Promise.all([getSeasons, getEpisodes]);

      setSeasons(seasons);
      setEpisodes(episodes);
      setSelectedSeason(item.parentIndex ?? 1);
    })();
  }, [item]);

  useEffect(() => {
    setControlElementsVisible(Boolean(anchorEl));
  }, [anchorEl, setControlElementsVisible]);

  return (
    <>
      <Portal>
        <Backdrop
          open={Boolean(anchorEl)}
          sx={{
            zIndex: 9999,
            backgroundColor: "transparent",
          }}
          onClick={(e) => {
            e.stopPropagation();
            setAnchorEl(null);
          }}
        >
          <Popper
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            placement="bottom"
            sx={{
              zIndex: 10000,
              "& .MuiPaper-root": {
                overflow: "hidden",
                borderRadius: 1,
                background: "transparent",
              },
            }}
            transition
            modifiers={[
              {
                name: "offset",
                options: {
                  offset: [0, 8],
                },
              },
              {
                name: "preventOverflow",
                enabled: true,
                options: {
                  altAxis: false,
                  altBoundary: false,
                  tether: false,
                  rootBoundary: "viewport",
                  padding: 16,
                },
              },
            ]}
            onClick={(e) => e.stopPropagation()}
          >
            {({ TransitionProps }) => (
              <Fade {...TransitionProps} timeout={300}>
                <Paper
                  sx={{
                    overflow: "hidden",
                    bgcolor: "#000",
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    userSelect: "none",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      borderRadius: 1,
                      maxHeight: "70vh",
                      maxWidth: "90vw",
                      backgroundColor: "#00000088",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Season selector */}
                    {(seasons?.length ?? 1) > 1 && (
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          width: 220,
                          height: 480,
                          overflow: "auto",
                          borderRight: `1px solid ${theme.palette.divider}`,
                        }}
                      >
                        <Box sx={{ p: 2, pb: 1 }}>
                          <Typography
                            variant="subtitle1"
                            noWrap
                            fontWeight="medium"
                          >
                            {item.grandparentTitle}
                          </Typography>
                        </Box>

                        <Divider />

                        {seasons?.map((season) => (
                          <Box
                            key={season.ratingKey}
                            onClick={() => setSelectedSeason(season.index ?? 1)}
                            sx={{
                              py: 1.5,
                              px: 2,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              cursor: "pointer",
                              transition: "all 0.2s",
                              bgcolor:
                                selectedSeason === season.index
                                  ? alpha(theme.palette.primary.main, 0.15)
                                  : "transparent",
                              "&:hover": {
                                bgcolor:
                                  selectedSeason === season.index
                                    ? alpha(theme.palette.primary.main, 0.2)
                                    : alpha(theme.palette.action.hover, 0.1),
                              },
                            }}
                          >
                            <Typography
                              variant="body2"
                              fontWeight={
                                selectedSeason === season.index
                                  ? "medium"
                                  : "normal"
                              }
                            >
                              {season.title}
                            </Typography>

                            {selectedSeason !== season.index && (
                              <ArrowBackIosNewRounded
                                sx={{
                                  fontSize: 14,
                                  transform: "rotate(180deg)",
                                  color: "text.secondary",
                                }}
                              />
                            )}
                          </Box>
                        ))}
                      </Box>
                    )}

                    {/* Episodes list */}
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        width: 600,
                        height: 480,
                        overflowY: "auto",
                        p: 2,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        {episodes
                          ?.filter(
                            (episode) => episode.parentIndex === selectedSeason
                          )
                          .map((episode) => (
                            <Box
                              key={episode.ratingKey}
                              onClick={() => {
                                if (episode.ratingKey !== item.ratingKey) {
                                  navigate(`/watch/${episode.ratingKey}`);
                                  setAnchorEl(null);
                                }
                              }}
                              sx={{
                                display: "flex",
                                borderRadius: 1,
                                overflow: "hidden",
                                transition: "all 0.2s",
                                ...(episode.ratingKey !== item.ratingKey && {
                                  cursor: "pointer",
                                  "&:hover": {
                                    bgcolor: alpha(
                                      theme.palette.action.hover,
                                      0.1
                                    ),
                                    "& .playIcon": {
                                      opacity: 1,
                                    },
                                  },
                                }),
                              }}
                            >
                              {/* Episode thumbnail */}
                              <Box
                                sx={{
                                  position: "relative",
                                  width: 160,
                                  aspectRatio: "16/9",
                                  flexShrink: 0,
                                  borderRadius: 1,
                                  overflow: "hidden",
                                }}
                              >
                                <Box
                                  sx={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundImage: `url(${getTranscodeImageURL(
                                      episode.thumb,
                                      320,
                                      180
                                    )})`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                  }}
                                />

                                <PlayArrowRounded
                                  className="playIcon"
                                  sx={{
                                    position: "absolute",
                                    top: "50%",
                                    left: "50%",
                                    transform: "translate(-50%, -50%)",
                                    fontSize: 48,
                                    color: "white",
                                    opacity: 0,
                                    transition: "opacity 0.2s",
                                    backgroundColor: alpha("#000", 0.5),
                                    borderRadius: "50%",
                                  }}
                                />

                                {(episode.viewOffset ||
                                  (episode.viewCount &&
                                    episode.viewCount >= 1)) && (
                                  <LinearProgress
                                    value={
                                      episode.viewOffset
                                        ? (episode.viewOffset /
                                            episode.duration) *
                                          100
                                        : 100
                                    }
                                    variant="determinate"
                                    sx={{
                                      position: "absolute",
                                      bottom: 0,
                                      left: 0,
                                      right: 0,
                                      height: 3,
                                      bgcolor: alpha("#000", 0.5),
                                    }}
                                  />
                                )}
                              </Box>

                              {/* Episode details */}
                              <Box sx={{ px: 2, py: 1, flex: 1 }}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    mb: 0.5,
                                  }}
                                >
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                    }}
                                  >
                                    <Typography
                                      color="text.secondary"
                                      variant="body2"
                                    >
                                      {episode.index}
                                    </Typography>
                                    <Typography
                                      color="text.secondary"
                                      variant="body2"
                                    >
                                      •
                                    </Typography>
                                    <Typography
                                      variant="subtitle2"
                                      fontWeight="medium"
                                      noWrap
                                    >
                                      {episode.title}
                                    </Typography>
                                  </Box>

                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ whiteSpace: "nowrap" }}
                                  >
                                    {getMinutes(episode.duration)} min
                                  </Typography>
                                </Box>

                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                  }}
                                >
                                  {episode.summary}
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              </Fade>
            )}
          </Popper>
        </Backdrop>
      </Portal>
      <IconButton onClick={(event) => setAnchorEl(event.currentTarget)}>
        <SubscriptionsRounded fontSize="small" />
      </IconButton>
    </>
  );
}

export default WatchShowChildView;
