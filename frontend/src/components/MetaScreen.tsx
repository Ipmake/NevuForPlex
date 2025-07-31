import {
  Avatar,
  Backdrop,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  ListItemIcon,
  Menu,
  MenuItem,
  Paper,
  Popover,
  Rating,
  Select,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import React, { JSX, useEffect, useState } from "react";
import {
  getLibraryMeta,
  getLibraryMetaChildren,
  getTranscodeImageURL,
  setMediaPlayedStatus,
  setMediaRating,
} from "../plex";
import {
  CheckCircleRounded,
  CloseRounded,
  PlayArrowRounded,
  VolumeOffRounded,
  VolumeUpRounded,
  CheckCircleOutlineRounded,
  StarRounded,
  StarOutlineRounded,
  CheckBoxOutlineBlankRounded,
  CheckBoxRounded,
} from "@mui/icons-material";
import { durationToText } from "./MovieItemSlider";
import ReactPlayer from "react-player";
import { usePreviewPlayer } from "../states/PreviewPlayerState";
import MovieItem from "./MovieItem";
import { useBigReader } from "./BigReader";
import { useInView } from "react-intersection-observer";
import { WatchListButton } from "./MovieItem";
import { alpha } from "@mui/material/styles";
import { AnimatePresence, motion } from "framer-motion";
import { useConfirmModal } from "./ConfirmModal";
import { PlexCommunity } from "../plex/plexCommunity";
import moment from "moment";
import { getBackendURL } from "../backendURL";
import { queryBuilder } from "../plex/QuickFunctions";
import AddReviewModal from "./modals/AddReviewModal";
import { getNevuReviews } from "../common/NevuReviews";

function MetaScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { MetaScreenPlayerMuted, setMetaScreenPlayerMuted } =
    usePreviewPlayer();

  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<Plex.Metadata | undefined>(undefined);

  const [page, setPage] = useState<number>(0);

  const [selectedSeason, setSelectedSeason] = useState<number>(0);
  const [episodes, setEpisodes] = useState<Plex.Metadata[] | null>();

  const [languages, setLanguages] = useState<string[] | null>(null);
  const [subTitles, setSubTitles] = useState<string[] | null>(null);

  const [previewVidURL, setPreviewVidURL] = useState<string | null>(null);
  const [previewVidPlaying, setPreviewVidPlaying] = useState<boolean>(false);

  const mid = searchParams.get("mid");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchParams(new URLSearchParams());
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    setData(undefined);
    setLoading(true);
    setEpisodes(null);
    setSelectedSeason(0);
    setLanguages(null);
    setSubTitles(null);
    setPreviewVidURL(null);
    setPreviewVidPlaying(false);
    setPage(0);

    if (!mid) return;
    getLibraryMeta(mid).then((res) => {
      const seasons = [...(res.Children?.Metadata || [])];
      setSelectedSeason(
        res.OnDeck?.Metadata?.parentIndex ??
          seasons.sort((a, b) => {
            // if the index is 0 put it at the end
            if (a.index === 0) return 1;
            if (b.index === 0) return -1;
            // sort by index
            return a.index - b.index;
          })?.[0]?.index ??
          1
      );
      setData(res);
      setLoading(false);
    });
  }, [mid]);

  useEffect(() => {
    if (!data) return;

    if (
      !data?.Extras?.Metadata?.[0] ||
      !data?.Extras?.Metadata?.[0]?.Media?.[0]?.Part?.[0]?.key
    )
      return;

    setPreviewVidURL(
      `${getBackendURL()}/dynproxy${
        data?.Extras?.Metadata?.[0]?.Media?.[0]?.Part?.[0]?.key.split("?")[0]
      }?${queryBuilder({
        "X-Plex-Token": localStorage.getItem("accessToken"),
        ...Object.fromEntries(
          new URL(
            "http://localhost:3000" +
              data?.Extras?.Metadata?.[0]?.Media?.[0]?.Part?.[0]?.key
          ).searchParams.entries()
        ),
      })}`
    );

    const timeout = setTimeout(() => {
      setPreviewVidPlaying(true);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [data]);

  useEffect(() => {
    if (languages || subTitles) return;
    if (!data) return;

    switch (data.type) {
      case "show":
        {
          if (!episodes) return;

          // get the first episode to get the languages and subtitles
          const firstEpisode = episodes[0];

          // you need to request the full metadata for the episode to get the media info
          getLibraryMeta(firstEpisode.ratingKey).then((res) => {
            if (!res.Media?.[0]?.Part?.[0]?.Stream) return;

            const uniqueLanguages = Array.from(
              new Set(
                res.Media?.[0]?.Part?.[0]?.Stream?.filter(
                  (stream) => stream.streamType === 2
                ).map((stream) => stream.language ?? stream.displayTitle)
              )
            );
            const uniqueSubTitles = Array.from(
              new Set(
                res.Media?.[0]?.Part?.[0]?.Stream?.filter(
                  (stream) => stream.streamType === 3
                ).map((stream) => stream.language)
              )
            );

            setLanguages(uniqueLanguages);
            setSubTitles(uniqueSubTitles);
          });
        }
        break;
      case "movie":
        {
          if (!data.Media?.[0]?.Part?.[0]?.Stream) return;

          const uniqueLanguages = Array.from(
            new Set(
              data.Media?.[0]?.Part?.[0]?.Stream?.filter(
                (stream) => stream.streamType === 2
              ).map((stream) => stream.language ?? stream.displayTitle)
            )
          );
          const uniqueSubTitles = Array.from(
            new Set(
              data.Media?.[0]?.Part?.[0]?.Stream?.filter(
                (stream) => stream.streamType === 3
              ).map((stream) => stream.language)
            )
          );

          setLanguages(uniqueLanguages);
          setSubTitles(uniqueSubTitles);
        }
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.ratingKey, episodes]);

  useEffect(() => {
    setEpisodes(null);
    if (!data) return;

    const season = data?.Children?.Metadata?.find(
      (child) => child.index === selectedSeason
    );

    console.log("Loading data for season", season);

    if (data?.type === "show" && season?.ratingKey) {
      getLibraryMetaChildren(season?.ratingKey as string).then((res) => {
        setEpisodes(res);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSeason, data]);

  const refetchEpisodes = () => {
    if (!data) return;

    const season = data?.Children?.Metadata?.find(
      (child) => child.index === selectedSeason
    );

    if (data?.type === "show" && season?.ratingKey) {
      getLibraryMetaChildren(season?.ratingKey as string).then((res) => {
        setEpisodes(res);
      });
    }
  };

  if (!searchParams.has("mid")) return <></>;

  if (loading)
    return (
      <Backdrop open={true}>
        <CircularProgress />
      </Backdrop>
    );

  const selectedSeasonData = data?.Children?.Metadata.find(
    (season) => season.index === selectedSeason
  );

  return (
    <Backdrop
      open={searchParams.has("mid")}
      sx={{
        overflowY: "scroll",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        zIndex: 100,
      }}
      onClick={() => {
        setSearchParams(new URLSearchParams());
      }}
    >
      <Box
        sx={{
          width: "130vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          backgroundColor: "#121216",
          mt: 4,
          pb: "40vh",

          borderTopLeftRadius: "10px",
          borderTopRightRadius: "10px",
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: "100%",
            aspectRatio: "16/9",
            backgroundImage: `url(${getTranscodeImageURL(
              data?.art as string,
              1920,
              1080
            )})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundColor: "#000000AA",
            backgroundBlendMode: "darken",

            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            padding: "1%",
            borderTopLeftRadius: "10px",
            borderTopRightRadius: "10px",
            position: "relative",
            zIndex: 0,
            userSelect: "none",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              // make it take up the full width of the parent
              width: "100%",
              aspectRatio: "16/9",
              left: 0,
              top: 0,
              filter: "brightness(0.5)",
              opacity: previewVidPlaying ? 1 : 0,
              transition: "all 2s ease",
              backgroundColor: previewVidPlaying ? "#000000" : "transparent",
              pointerEvents: "none",

              borderTopLeftRadius: "10px",
              borderTopRightRadius: "10px",
              overflow: "hidden",
            }}
          >
            <ReactPlayer
              url={previewVidURL ?? undefined}
              controls={false}
              width="100%"
              height="100%"
              autoplay={true}
              playing={previewVidPlaying}
              volume={MetaScreenPlayerMuted ? 0 : 0.5}
              muted={MetaScreenPlayerMuted}
              onEnded={() => {
                setPreviewVidPlaying(false);
              }}
              pip={false}
              config={{
                file: {
                  attributes: { disablePictureInPicture: true },
                },
              }}
            />
          </Box>
          <Box
            sx={{
              ml: "auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: 2,
            }}
          >
            <IconButton
              sx={{
                backgroundColor: "#00000088",
              }}
              onClick={() => {
                setSearchParams(new URLSearchParams());
              }}
            >
              <CloseRounded fontSize="medium" />
            </IconButton>

            <IconButton
              sx={{
                backgroundColor: "#00000088",
                opacity: previewVidURL ? 1 : 0,
                transition: "all 1s ease",
              }}
              onClick={() => {
                setMetaScreenPlayerMuted(!MetaScreenPlayerMuted);
              }}
            >
              {MetaScreenPlayerMuted ? (
                <VolumeOffRounded />
              ) : (
                <VolumeUpRounded />
              )}
            </IconButton>
          </Box>
        </Box>

        <Box
          sx={{
            mt: "-15vh",
            height: "30vh",
            width: "100%",
            background:
              "linear-gradient(180deg, #12121600, #121216FF, #121216FF)",
            zIndex: 1,
          }}
        />

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            padding: "0 3%",
            mt: "-55vh",
            gap: "3%",
            zIndex: 2,
          }}
        >
          <Box
            sx={{
              width: "30%",
              borderRadius: "10px",
              overflow: "hidden",
              boxShadow: (theme) =>
                `0 20px 25px -5px ${theme.palette.common.black}`,
              position: "relative",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "scale(1.02)",
                boxShadow: (theme) =>
                  `0 25px 30px -5px ${theme.palette.common.black}`,
              },
            }}
          >
            <img
              src={`${getTranscodeImageURL(data?.thumb as string, 600, 900)}`}
              alt={data?.title || ""}
              style={{
                width: "100%",
                aspectRatio: "2/3",
                backgroundColor: "#00000088",
                objectFit: "cover",
                display: "block",
              }}
            />
          </Box>

          <Box
            sx={{
              width: "70%",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "flex-end",
              height: "100%",
              marginLeft: "1%",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "flex-start",
                width: "100%",
                height: "65%",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  mb: "-10px",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "24px",
                    fontWeight: "900",
                    letterSpacing: "0.1em",
                    color: (theme) => theme.palette.primary.main,
                    textTransform: "uppercase",
                  }}
                >
                  {data?.type}
                </Typography>
              </Box>

              <Typography
                sx={{
                  fontSize: "3rem",
                  fontWeight: "bold",
                  mt: 0,
                  color: (theme) => theme.palette.text.primary,
                }}
              >
                {data?.title}
              </Typography>

              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  mt: -1,
                  gap: 1,
                }}
              >
                {data?.type === "show" &&
                  data?.leafCount === data?.viewedLeafCount && (
                    <CheckCircleRounded
                      sx={{
                        color: (theme) => theme.palette.primary.light,
                        fontSize: "large",
                      }}
                    />
                  )}
                {data?.type === "movie" && (data?.viewCount ?? 0) > 0 && (
                  <CheckCircleRounded
                    sx={{
                      color: (theme) => theme.palette.primary.light,
                      fontSize: "large",
                    }}
                  />
                )}
                {data?.contentRating && (
                  <Typography
                    sx={{
                      fontSize: "medium",
                      fontWeight: "light",
                      color: (theme) => theme.palette.text.secondary,
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                      borderRadius: "5px",
                      px: 1,
                      py: 0.2,
                    }}
                  >
                    {data?.contentRating}
                  </Typography>
                )}
                {data?.year && (
                  <Typography
                    sx={{
                      fontSize: "medium",
                      fontWeight: "light",
                      color: (theme) => theme.palette.text.secondary,
                    }}
                  >
                    {data?.year}
                  </Typography>
                )}
                {data?.rating && (
                  <Typography
                    sx={{
                      fontSize: "medium",
                      fontWeight: "light",
                      color: (theme) => theme.palette.text.secondary,
                    }}
                  >
                    {data?.rating}
                  </Typography>
                )}
                {data?.duration &&
                  ["episode", "movie"].includes(data?.type) && (
                    <Typography
                      sx={{
                        fontSize: "medium",
                        fontWeight: "light",
                        color: (theme) => theme.palette.text.secondary,
                      }}
                    >
                      {durationToText(data?.duration)}
                    </Typography>
                  )}
                {data?.type === "show" &&
                  data?.leafCount &&
                  data?.childCount && (
                    <Typography
                      sx={{
                        fontSize: "medium",
                        fontWeight: "light",
                        color: (theme) => theme.palette.text.secondary,
                      }}
                    >
                      {data?.childCount > 1
                        ? `${data?.childCount} Seasons`
                        : `${data?.leafCount} Episode${
                            data?.leafCount > 1 ? "s" : ""
                          }`}
                    </Typography>
                  )}
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: 2,
                  mt: 2,
                }}
              >
                <Button
                  variant="contained"
                  sx={{
                    height: "38px",
                    backgroundColor: (theme) => theme.palette.background.paper,
                    color: (theme) => theme.palette.text.primary,
                    fontWeight: "bold",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    "&:hover": {
                      backgroundColor: (theme) => theme.palette.primary.dark,
                    },
                    gap: 1,
                    transition: "all 0.2s ease-in-out",
                  }}
                  onClick={async () => {
                    if (data?.type === "movie")
                      navigate(
                        `/watch/${data?.ratingKey}${
                          data?.viewOffset ? `?t=${data?.viewOffset}` : ""
                        }`
                      );

                    if (data?.type === "show") {
                      if (data?.OnDeck && data?.OnDeck.Metadata) {
                        navigate(
                          `/watch/${data?.OnDeck.Metadata.ratingKey}${
                            data?.OnDeck.Metadata.viewOffset
                              ? `?t=${data?.OnDeck.Metadata.viewOffset}`
                              : ""
                          }`
                        );
                      } else {
                        const firstSeason = await getLibraryMetaChildren(
                          data?.Children?.Metadata[0]?.ratingKey as string
                        );

                        if (firstSeason)
                          navigate(`/watch/${firstSeason[0].ratingKey}`);
                      }
                    }
                  }}
                >
                  <PlayArrowRounded fontSize="medium" /> Play{" "}
                  {data?.type === "show" &&
                    data?.OnDeck &&
                    data?.OnDeck.Metadata &&
                    `${
                      data?.Children?.size && data?.Children?.size > 1
                        ? `S${data?.OnDeck.Metadata.parentIndex}`
                        : ""
                    }E${data?.OnDeck.Metadata.index}`}
                </Button>

                <Tooltip placement="top" arrow title="Watchlist">
                  <WatchListButton item={data as Plex.Metadata} />
                </Tooltip>

                {data && <RatingButton item={data} />}

                <Tooltip
                  placement="top"
                  arrow
                  title={
                    `Mark as ` +
                    (data?.type === "movie"
                      ? !Boolean(data?.viewCount)
                        ? "watched"
                        : "unwatched"
                      : data?.viewedLeafCount === data?.leafCount
                      ? "unwatched"
                      : "watched")
                  }
                >
                  <Button
                    variant="contained"
                    sx={{
                      height: "38px",
                      backgroundColor: (theme) =>
                        theme.palette.background.paper,
                      color: (theme) => theme.palette.text.primary,
                      fontWeight: "bold",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      "&:hover": {
                        backgroundColor: (theme) => theme.palette.primary.main,
                      },
                      transition: "all 0.2s ease-in-out",
                      display: "flex",
                      gap: 1,
                    }}
                    onClick={async () => {
                      if (!data) return;
                      let state = "unwatched";

                      if (data?.type === "movie" && (data?.viewCount ?? 0) > 0)
                        state = "watched";
                      if (
                        data?.type === "show" &&
                        data?.viewedLeafCount === data?.leafCount
                      )
                        state = "watched";

                      useConfirmModal.getState().setModal({
                        title: `Mark as ${
                          state === "unwatched" ? "watched" : "unwatched"
                        }`,
                        message: `Are you sure you want to mark ${
                          data?.title
                        } as ${
                          state === "unwatched" ? "watched" : "unwatched"
                        }?`,
                        onConfirm: async () => {
                          switch (data.type) {
                            case "movie":
                              data.viewCount = !Boolean(data.viewCount) ? 1 : 0;
                              setData({ ...data });
                              await setMediaPlayedStatus(
                                Boolean(data.viewCount),
                                data.ratingKey
                              );
                              break;
                            case "show":
                              const newViewedLeafCount =
                                data.viewedLeafCount === data.leafCount
                                  ? 0
                                  : data.leafCount;
                              data.viewedLeafCount = newViewedLeafCount;
                              setData({ ...data });
                              await setMediaPlayedStatus(
                                newViewedLeafCount === data.leafCount,
                                data.ratingKey
                              );
                              break;
                            default:
                              break;
                          }
                        },
                        onCancel: () => {},
                      });
                    }}
                  >
                    {data?.type === "movie" ? (
                      !((data?.viewCount ?? 0) > 0) ? (
                        <CheckCircleOutlineRounded fontSize="small" />
                      ) : (
                        <CheckCircleRounded fontSize="small" />
                      )
                    ) : data?.type === "show" ? (
                      data?.viewedLeafCount === data?.leafCount ? (
                        <CheckCircleRounded fontSize="small" />
                      ) : (
                        <CheckCircleOutlineRounded fontSize="small" />
                      )
                    ) : null}
                  </Button>
                </Tooltip>
              </Box>

              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: 0.5,
                  mt: 2,
                }}
              >
                <Typography color="text.secondary">Genres: </Typography>
                {data?.Genre?.slice(0, 5).map((genre, index) => (
                  <Typography
                    key={genre.id}
                    sx={{
                      color: (theme) => theme.palette.text.primary,
                      fontWeight: "medium",
                      cursor: "pointer",
                      "&:hover": {
                        color: (theme) => theme.palette.primary.main,
                        textDecoration: "none",
                      },
                      transition: "all 0.2s ease",
                    }}
                    onClick={() => {
                      setSearchParams(
                        new URLSearchParams({
                          bkey: `/library/sections/${data?.librarySectionID}/genre/${genre.id}`,
                        })
                      );
                    }}
                  >
                    {genre.tag}
                    {index + 1 === data?.Genre?.slice(0, 5).length ? "" : ","}
                  </Typography>
                ))}
              </Box>

              <Collapse in={Boolean(languages || subTitles)}>
                <Box sx={{ mt: 1 }}>
                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      gap: 0.5,
                    }}
                  >
                    {languages && languages.length > 0 && (
                      <>
                        <Typography color="text.secondary">Audio: </Typography>
                        {languages.slice(0, 10).map((lang, index) => (
                          <Typography
                            key={index}
                            sx={{
                              color: (theme) => theme.palette.text.primary,
                              fontWeight: "medium",
                            }}
                          >
                            {lang}
                            {index + 1 === languages.slice(0, 10).length
                              ? ""
                              : ","}
                          </Typography>
                        ))}
                      </>
                    )}
                  </Box>

                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      gap: 0.5,
                      whiteSpace: "wrap",
                      overflow: "hidden",
                    }}
                  >
                    {subTitles && subTitles.length > 0 && (
                      <>
                        <Typography color="text.secondary">
                          Subtitles:{" "}
                        </Typography>
                        {subTitles.slice(0, 10).map((lang, index) => (
                          <Typography
                            key={index}
                            sx={{
                              color: (theme) => theme.palette.text.primary,
                              fontWeight: "medium",
                            }}
                          >
                            {lang}
                            {index + 1 === subTitles.slice(0, 10).length
                              ? ""
                              : ","}
                          </Typography>
                        ))}
                      </>
                    )}
                  </Box>
                </Box>
              </Collapse>

              <Typography
                sx={{
                  mt: 1.5,
                  fontSize: "1rem",
                  fontWeight: "normal",
                  // max 5 lines
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 5,
                  WebkitBoxOrient: "vertical",
                  maxInlineSize: "100%",
                  userSelect: "none",
                  cursor: "zoom-in",
                  color: (theme) => theme.palette.text.secondary,
                }}
                onClick={() => {
                  if (!data?.summary) return;
                  useBigReader.getState().setBigReader(data?.summary);
                }}
              >
                {data?.summary}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            width: "100%",
            px: "3%",
            mt: "3vh",
            zIndex: 2,
          }}
        >
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: 4,
              mb: "10px",
            }}
          >
            <TabButton
              onClick={() => {
                setPage(0);
              }}
              selected={page === 0}
              text={data?.type === "movie" ? "Similar Movies" : "Episodes"}
            />

            {data?.type !== "movie" && (
              <TabButton
                onClick={() => {
                  setPage(1);
                }}
                selected={page === 1}
                text="Recommendations"
              />
            )}

            <TabButton
              onClick={() => {
                setPage(2);
              }}
              selected={page === 2}
              text="Info"
            />

            <TabButton
              onClick={() => {
                setPage(3);
              }}
              selected={page === 3}
              text="Reviews"
            />

            {data?.type === "show" &&
              data?.Children &&
              data?.Children.size > 1 && (
                <Select
                  sx={{
                    ml: "auto",
                    opacity: page === 0 ? 1 : 0,
                    transition: "all 0.5s ease",
                  }}
                  size="small"
                  value={selectedSeason}
                  onChange={(e) => {
                    if (e.target.value === selectedSeason) return;
                    setSelectedSeason(e.target.value as number);
                  }}
                >
                  {data?.type === "show" &&
                    data?.Children?.Metadata?.map((season, index) => (
                      <MenuItem key={index} value={season.index}>
                        {season.title}
                      </MenuItem>
                    ))}
                </Select>
              )}
          </Box>

          <Divider sx={{ mb: 2, width: "100%" }} />

          <AnimatePresence mode="wait">
            {page === 0 && (
              <MetaPage1
                data={data}
                loading={loading}
                episodes={episodes}
                refetchEpisodes={refetchEpisodes}
                navigate={navigate}
              />
            )}
            {page === 1 && MetaPage2(data)}
            {page === 2 && MetaPage3(data)}
            {page === 3 && <MetaPageReviews data={data} />}
          </AnimatePresence>
        </Box>
      </Box>
    </Backdrop>
  );
}

export default MetaScreen;

function MetaPage1({
  data,
  loading,
  episodes,
  refetchEpisodes,
  navigate,
}: {
  data: Plex.Metadata | undefined;
  loading: boolean;
  episodes: Plex.Metadata[] | null | undefined;
  refetchEpisodes: () => void;
  navigate: (path: string) => void;
}) {
  const [selectedEpisodes, setSelectedEpisodes] = useState<Plex.Metadata[]>([]);
  const [selectMode, setSelectMode] = useState<boolean>(false);

  useEffect(() => {
    if (!selectMode) setSelectedEpisodes([]);
  }, [selectMode]);

  return (
    <>
      <Collapse in={selectMode}>
        {/* Buttons for marking selected episodes as watched or un-watched and a button for select all */}
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: 2,
            mb: 2,
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
              "&:hover": {
                backgroundColor: (theme) => theme.palette.primary.main,
              },
              transition: "all 0.2s ease-in-out",
            }}
            onClick={() => {
              setSelectMode(false);
            }}
          >
            Cancel
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
                backgroundColor: (theme) => theme.palette.primary.main,
              },
              transition: "all 0.2s ease-in-out",
            }}
            onClick={() => {
              if (selectedEpisodes.length === episodes?.length) {
                setSelectedEpisodes([]);
              } else {
                setSelectedEpisodes(episodes ?? []);
              }
            }}
          >
            {selectedEpisodes.length === episodes?.length
              ? "Unselect All"
              : "Select All"}
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
                backgroundColor: (theme) => theme.palette.primary.main,
              },
              transition: "all 0.2s ease-in-out",
            }}
            onClick={async () => {
              useConfirmModal.getState().setModal({
                title: `Mark as watched`,
                message: `Are you sure you want to mark ${selectedEpisodes.length} episodes as watched?`,
                onConfirm: async () => {
                  await Promise.all(
                    selectedEpisodes.map(async (episode) => {
                      setMediaPlayedStatus(true, episode.ratingKey);
                    })
                  );
                  refetchEpisodes();
                  setSelectMode(false);
                },
                onCancel: () => {},
              });
            }}
          >
            Mark as Watched
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
                backgroundColor: (theme) => theme.palette.primary.main,
              },
              transition: "all 0.2s ease-in-out",
            }}
            onClick={async () => {
              useConfirmModal.getState().setModal({
                title: `Mark as unwatched`,
                message: `Are you sure you want to mark ${selectedEpisodes.length} episodes as unwatched?`,
                onConfirm: async () => {
                  await Promise.all(
                    selectedEpisodes.map(async (episode) => {
                      await setMediaPlayedStatus(false, episode.ratingKey);
                    })
                  );
                  refetchEpisodes();
                  setSelectMode(false);
                },
                onCancel: () => {},
              });
            }}
          >
            Mark as Unwatched
          </Button>
        </Box>
      </Collapse>
      {data?.type === "movie" && !data && (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            mt: 10,
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {data?.type === "movie" && data.Related?.Hub?.[0] && (
        <Grid
          container
          spacing={2}
          sx={{
            width: "100%",
          }}
        >
          {data.Related?.Hub?.[0]?.Metadata?.slice(0, 10).map((movie) => (
            <Grid size={{ lg: 3, md: 4, sm: 6, xs: 12 }}>
              <MovieItem item={movie} />
            </Grid>
          ))}
        </Grid>
      )}

      {data?.type === "show" && !episodes && (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            mt: 10,
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {data?.type === "show" && episodes && (
        <Box
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            gap: 1,
          }}
        >
          {episodes?.map((episode) => (
            <EpisodeItem
              item={episode}
              refetchData={refetchEpisodes}
              selected={selectedEpisodes.some(
                (selected) => selected.ratingKey === episode.ratingKey
              )}
              setSelected={() => {
                if (
                  selectedEpisodes.some(
                    (selected) => selected.ratingKey === episode.ratingKey
                  )
                ) {
                  setSelectedEpisodes(
                    selectedEpisodes.filter(
                      (selected) => selected.ratingKey !== episode.ratingKey
                    )
                  );
                } else {
                  setSelectedEpisodes([...selectedEpisodes, episode]);
                }
              }}
              selectMode={selectMode}
              setSelectMode={setSelectMode}
              onClick={() => {
                navigate(
                  `/watch/${episode.ratingKey}${
                    episode.viewOffset ? `?t=${episode.viewOffset} ` : ""
                  }`
                );
              }}
            />
          ))}
        </Box>
      )}
    </>
  );
}

function MetaPage2(data: Plex.Metadata | undefined) {
  if (!data) return <></>;
  if (data.Related?.Hub?.length === 0) return <>Nothing here</>;

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        gap: "60px",

        userSelect: "none",
      }}
    >
      {data.Related?.Hub?.map((hub) => (
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            gap: 1,
          }}
        >
          <Typography
            sx={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: "#FFFFFF",
            }}
          >
            {hub.title}
          </Typography>

          <Grid container spacing={2} sx={{ width: "100%" }}>
            {hub.Metadata?.map((item) => (
              <Grid size={{ lg: 3, md: 4, sm: 6, xs: 12 }}>
                <MovieItem item={item} />
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
    </Box>
  );
}

function MetaPage3(data: Plex.Metadata | undefined) {
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        gap: "60px",

        userSelect: "none",
      }}
    >
      <Box
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          gap: 1,
        }}
      >
        <Typography
          sx={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            color: "#FFFFFF",
          }}
        >
          Cast
        </Typography>

        <Grid container spacing={2}>
          {data?.Role?.map((role) => (
            <ActorItem role={role} data={data} />
          ))}
        </Grid>
      </Box>
    </Box>
  );
}

function MetaPageReviews({ data }: { data: Plex.Metadata | undefined }) {
  const [reviews, setReviews] = useState<
    | (PlexCommunity.ReviewsData & {
        nevuReviews: PerPlexed.Reviews.Review[];
      })
    | null
  >(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!data) return;
    setLoading(true);
    const metaID = data.guid.split("/").pop();
    if (!metaID) return;

    PlexCommunity.getUserReviews(metaID)
      .then(async (res) => {
        if (!res) return;
        res.recentReviews.nodes =
          res?.recentReviews.nodes.filter(
            (review) =>
              res?.topReviews?.nodes.find(
                (topReview) => topReview.id === review.id
              ) === undefined
          ) ?? [];

        const nevuReviews = await getNevuReviews(data.guid);

        setReviews({ ...res, nevuReviews });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [data]);

  const renderReviewsSection = (
    title: string,
    reviewNodes: any[] | undefined,
    isEmpty: boolean,
    isNevu: boolean = false
  ) => {
    if (isEmpty) return null;
    return (
      <Box sx={{ width: "100%", mb: 5 }}>
        <Typography
          variant="h6"
          fontWeight="bold"
          color="text.primary"
          sx={{ mb: 2 }}
        >
          {title}
        </Typography>

        {reviewNodes && reviewNodes.length > 0 ? (
          <Grid container spacing={3} sx={{ width: "100%" }}>
            {reviewNodes?.map((review, index) => {
              const username = isNevu
                ? (review as PerPlexed.Reviews.Review).user.username
                : (review as PlexCommunity.ActivityReview).userV2?.username;

              const avatarSrc = isNevu
                ? (review as PerPlexed.Reviews.Review).user.avatar
                : (review as PlexCommunity.ActivityReview).userV2?.avatar;

              const hasSpoilers = isNevu
                ? (review as PerPlexed.Reviews.Review).spoilers
                : (review as PlexCommunity.ActivityReview).hasSpoilers;

              const reviewDate = isNevu
                ? (review as PerPlexed.Reviews.Review).created_at
                : (review as PlexCommunity.ActivityReview).date;

              return (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={title + index}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      bgcolor: (theme) =>
                        alpha(theme.palette.background.paper, 0.4),
                      borderRadius: 2,
                      height: "100%",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        bgcolor: (theme) =>
                          alpha(theme.palette.background.paper, 0.6),
                        transform: "translateY(-4px)",
                        boxShadow: (theme) =>
                          `0 8px 16px -2px ${alpha(
                            theme.palette.common.black,
                            0.15
                          )}`,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        mb: 2,
                        position: "relative",
                      }}
                    >
                      <Avatar
                        src={avatarSrc}
                        sx={{ width: 42, height: 42, boxShadow: 1 }}
                      >
                        {username?.charAt(0) || "U"}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Stack spacing={0.5} justifyContent={"flex-start"} direction={"row"} alignItems="center">
                          <Typography fontWeight="medium" noWrap>
                            {username || "Anonymous User"}
                          </Typography>
                          {review.visibility === "GLOBAL" && (
                            <Chip label="Global" size="small" color="info" />
                          )}
                          {review.visibility === "LOCAL" && (
                            <Chip label="Local" size="small" color="info" />
                          )}
                        </Stack>

                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Rating
                            value={(review.reviewRating ?? review.rating) / 2}
                            precision={0.5}
                            size="small"
                            readOnly
                            sx={{
                              color: (theme) => theme.palette.primary.main,
                            }}
                          />
                          <Typography
                            variant="caption"
                            sx={{ ml: 1, color: "text.secondary" }}
                          >
                            {moment(new Date(reviewDate)).fromNow()}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    <Typography
                      sx={{
                        fontSize: "0.95rem",
                        color: "text.secondary",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 5,
                        WebkitBoxOrient: "vertical",
                        lineHeight: 1.6,

                        ...(hasSpoilers && {
                          filter: "blur(10px)",
                          transition: "filter 0.2s ease",
                          "&:hover": {
                            filter: "blur(0)",
                            transition: "filter 3s ease",
                          },
                        }),
                      }}
                    >
                      {review.message || "No review text provided."}
                    </Typography>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 4,
              width: "100%",
              bgcolor: (theme) => alpha(theme.palette.background.paper, 0.2),
              borderRadius: 2,
            }}
          >
            <Typography color="text.secondary" variant="body2">
              No reviews available in this category
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  const totalReviews =
    (reviews?.topReviews?.nodes.length ?? 0) +
    (reviews?.friendReviews?.nodes.length ?? 0) +
    (reviews?.recentReviews?.nodes.length ?? 0) +
    (reviews?.nevuReviews?.length ?? 0);

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        gap: 4,
        userSelect: "none",
      }}
    >
      {totalReviews === 0 && !loading && (
        <Typography>No one has reviewed this title yet.</Typography>
      )}

      {loading ? (
        <Grid container spacing={3} sx={{ width: "100%" }}>
          {[1, 2, 3].map((item) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: (theme) =>
                    alpha(theme.palette.background.paper, 0.4),
                  borderRadius: 2,
                  height: "100%",
                }}
              >
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
                >
                  <Skeleton variant="circular" width={40} height={40} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="70%" height={24} />
                    <Skeleton variant="text" width="40%" height={20} />
                  </Box>
                </Box>
                <Skeleton variant="text" />
                <Skeleton variant="text" />
                <Skeleton variant="text" width="80%" />
              </Box>
            </Grid>
          ))}
        </Grid>
      ) : !reviews ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 6,
            width: "100%",
            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.2),
            borderRadius: 2,
          }}
        >
          <StarOutlineRounded
            sx={{ fontSize: 60, color: "text.disabled", mb: 2 }}
          />
          <Typography color="text.secondary" variant="body1">
            No reviews available for this title yet
          </Typography>
        </Box>
      ) : (
        <Box sx={{ width: "100%" }}>
          {renderReviewsSection(
            "NEVU Reviews",
            reviews.nevuReviews,
            !reviews.nevuReviews.length,
            true
          )}

          {renderReviewsSection(
            "Recent Reviews",
            reviews.recentReviews?.nodes,
            !reviews.recentReviews?.nodes.length
          )}

          {renderReviewsSection(
            "Top Reviews",
            reviews.topReviews?.nodes,
            !reviews.topReviews?.nodes.length
          )}

          {renderReviewsSection(
            "Friend Reviews",
            reviews.friendReviews?.nodes,
            !reviews.friendReviews?.nodes.length
          )}
        </Box>
      )}
    </Box>
  );
}

function ActorItem({
  role,
  data,
}: {
  role: Plex.Role;
  data: Plex.Metadata;
}): JSX.Element {
  const { inView, ref } = useInView();
  const [, setSearchParams] = useSearchParams();

  return (
    <Grid size={{ xl: 3, lg: 4, md: 6, sm: 6, xs: 6 }} ref={ref}>
      {inView ? (
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: "20px",
            backgroundColor: (theme) =>
              alpha(theme.palette.background.paper, 0.4),
            padding: "10px 20px",
            borderRadius: "10px",
            userSelect: "none",
            cursor: "pointer",
            transition: "transform 0.2s ease",

            "&:hover": {
              backgroundColor: (theme) =>
                alpha(theme.palette.background.paper, 0.7),
              transform: "translateY(-2px)",
            },
          }}
          onClick={() => {
            setSearchParams(
              new URLSearchParams({
                bkey: `/library/sections/${data.librarySectionID}/actor/${role.id}`,
              })
            );
          }}
        >
          <Avatar
            src={`${getTranscodeImageURL(role.thumb, 200, 200)}`}
            sx={{
              width: "25%",
              height: "auto",
              aspectRatio: "1/1",
              borderRadius: "50%",
            }}
          />

          <Box
            sx={{
              width: "75%",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              overflow: "hidden",
            }}
          >
            <Typography
              sx={{
                fontSize: "1rem",
                color: (theme) => theme.palette.text.primary,
                fontWeight: "medium",
              }}
            >
              {role.tag}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.75rem",
                color: (theme) => theme.palette.text.secondary,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 1,
                whiteSpace: "nowrap",
                width: "100%",
              }}
            >
              {role.role}
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            width: "100%",
            height: "100px",
            backgroundColor: (theme) =>
              alpha(theme.palette.background.paper, 0.2),
            borderRadius: "10px",
          }}
        />
      )}
    </Grid>
  );
}

function RatingButton({ item }: { item: Plex.Metadata }): JSX.Element {
  const [rating, setRating] = useState<number | null>(
    (item.userRating && item.userRating / 2) ?? null
  );

  const [addReviewModalOpen, setAddReviewModalOpen] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <>
      {addReviewModalOpen && item && (
        <AddReviewModal
          item={item}
          onClose={() => setAddReviewModalOpen(false)}
        />
      )}
      <Popover
        anchorEl={anchorEl}
        open={anchorEl !== null}
        onClick={() => {
          setAnchorEl(null);
        }}
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        sx={{
          "& .MuiPopover-paper": {
            padding: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            backgroundColor: (theme) => theme.palette.background.paper,
          },
        }}
      >
        <Rating
          name="simple-controlled"
          value={rating}
          precision={0.5}
          size="large"
          onChange={(e, v) => {
            setRating(v);

            if (v === null) return;

            item.rating = v * 2;
            setMediaRating(v * 2, item.ratingKey);
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setRating(null);
            item.rating = undefined;
            setMediaRating(-1, item.ratingKey);
          }}
        />

        <Button
          variant="contained"
          size="small"
          onClick={() => {
            setAddReviewModalOpen(true);
            setAnchorEl(null);
          }}
          sx={{
            height: rating ? "38px" : "0px",
            opacity: rating ? 1 : 0,
            overflow: "hidden",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          Add Review
        </Button>
      </Popover>
      <Button
        variant="contained"
        sx={{
          height: "38px",
          backgroundColor: (theme) => theme.palette.background.paper,
          color: (theme) => theme.palette.text.primary,
          fontWeight: "bold",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          "&:hover": {
            backgroundColor: (theme) => theme.palette.primary.main,
          },
          transition: "all 0.2s ease-in-out",
          display: "flex",
          gap: 1,
        }}
        onClick={(e) => {
          setAnchorEl(e.currentTarget);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          setRating(null);
          item.rating = undefined;
          setMediaRating(-1, item.ratingKey);
        }}
      >
        {rating ? (
          <StarRounded fontSize="small" />
        ) : (
          <StarOutlineRounded fontSize="small" />
        )}
      </Button>
    </>
  );
}

function EpisodeItem({
  item,
  onClick,
  refetchData,
  selected,
  setSelected,
  selectMode,
  setSelectMode,
}: {
  item: Plex.Metadata;
  onClick?: (event: React.MouseEvent) => void;
  refetchData: () => void;
  selected?: boolean;
  setSelected?: (selected: boolean) => void;
  selectMode?: boolean;
  setSelectMode?: (selectMode: boolean) => void;
}): JSX.Element {
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);

  const handlePlay = async () => {
    if (!item) return;
    navigate(`/watch/${item.ratingKey}`);
  };

  const handleClose = () => {
    setContextMenu(null);
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
    });
  };

  const navigate = useNavigate();

  return (
    <>
      <Menu
        open={contextMenu !== null}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <Typography
          sx={{
            fontSize: "1rem",
            fontWeight: "bold",
            px: 1,
            maxWidth: "200px",
            textOverflow: "ellipsis",
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          EP.{item.index}: {item.title}
        </Typography>

        <Divider
          sx={{
            my: 1,
          }}
        />

        <MenuItem
          onClick={async (e) => {
            e.stopPropagation();
            await handlePlay();
            handleClose();
          }}
        >
          <ListItemIcon>
            <PlayArrowRounded fontSize="small" />
          </ListItemIcon>
          Play
        </MenuItem>
        <MenuItem
          onClick={async () => {
            if (!item) return;
            let state = !(!Boolean(item.viewOffset) && Boolean(item.viewCount))
              ? "unwatched"
              : "watched";

            useConfirmModal.getState().setModal({
              title: `Mark as ${state === "watched" ? "Unwatched" : "Watched"}`,
              message: `Are you sure you want to mark "${item.title}" as ${
                state === "watched" ? "Unwatched" : "Watched"
              }?`,
              onConfirm: async () => {
                await setMediaPlayedStatus(
                  !(!Boolean(item.viewOffset) && Boolean(item.viewCount)),
                  item.ratingKey
                );

                handleClose();
                refetchData?.();
              },
              onCancel: () => {
                handleClose();
              },
            });
          }}
        >
          <ListItemIcon>
            {!Boolean(item.viewOffset) && Boolean(item.viewCount) ? (
              <CheckCircleOutlineRounded fontSize="small" />
            ) : (
              <CheckCircleRounded fontSize="small" />
            )}
          </ListItemIcon>

          {!Boolean(item.viewOffset) && Boolean(item.viewCount)
            ? "Mark as Unwatched"
            : "Mark as Watched"}
        </MenuItem>
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            if (setSelectMode) setSelectMode(!selectMode);
            if (setSelected) setSelected(!selected);
            handleClose();
          }}
        >
          <ListItemIcon>
            {selectMode ? (
              <CheckBoxRounded fontSize="small" />
            ) : (
              <CheckBoxOutlineBlankRounded fontSize="small" />
            )}
          </ListItemIcon>
          {selectMode ? "Disable Selection" : "Enable Selection"}
        </MenuItem>
      </Menu>
      <Box
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          gap: 2,
          userSelect: "none",
          cursor: "pointer",
          borderRadius: "10px",
          p: 1.5,
          mb: 1,
          transition: "all 0.5s ease",
          "&:hover": {
            backgroundColor: (theme) =>
              alpha(theme.palette.background.paper, 0.5),
            transition: "all 0.2s ease",
          },

          // on hover get the 2nd child and then the 1st child of that
          "&:hover > :nth-child(2)": {
            "& > :nth-child(1)": {
              opacity: 1,
              transition: "all 0.2s ease-in",
            },
          },
        }}
        onClick={(e) => {
          if (onClick) onClick(e);
        }}
        onContextMenu={handleContextMenu}
      >
        <Box
          sx={{
            width: "5%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            alignSelf: "center",
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {!selectMode && (
            <Typography
              sx={{
                fontSize: "1.25rem",
                fontWeight: "bold",
                color: (theme) => theme.palette.text.primary,
                textAlign: "center",
              }}
            >
              {item.index}
            </Typography>
          )}

          {selectMode && (
            <Checkbox
              checked={selected}
              onChange={() => {
                if (setSelected) setSelected(!selected);
              }}
            />
          )}
        </Box>

        <Box
          sx={{
            width: "20%",
            borderRadius: "8px",
            aspectRatio: "16/9",
            backgroundImage: `url(${getTranscodeImageURL(
              item.thumb,
              380,
              214
            )})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundBlendMode: "darken",
            overflow: "hidden",
            whiteSpace: "nowrap",
            transition: "all 0.3s ease",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            position: "relative",
            boxShadow: (theme) =>
              `0 4px 6px -1px ${alpha(theme.palette.common.black, 0.2)}`,
          }}
        >
          <PlayArrowRounded
            sx={{
              color: "#FFFFFF",
              fontSize: "400%",
              m: "auto",
              opacity: 0,
              backgroundColor: "#00000088",
              borderRadius: "50%",
              transition: "all 0.3s ease-out",
            }}
          />

          {(item.viewOffset || (item.viewCount && item.viewCount >= 1)) && (
            <LinearProgress
              value={
                item.viewOffset ? (item.viewOffset / item.duration) * 100 : 100
              }
              variant="determinate"
              sx={{
                width: "100%",
                height: "4px",
                backgroundColor: (theme) =>
                  alpha(theme.palette.common.black, 0.5),

                position: "absolute",
                bottom: 0,
                "& .MuiLinearProgress-bar": {
                  backgroundColor: (theme) => theme.palette.primary.main,
                },
              }}
            />
          )}
        </Box>

        <Box
          sx={{
            width: "70%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            ml: 0.5,
          }}
        >
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography
              sx={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: (theme) => theme.palette.text.primary,
                // make it so the text doesnt resize the parent nor overflow max 3 rows
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
                maxWidth: "80%",
              }}
            >
              {item.title}
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: 1,
                color: (theme) => theme.palette.text.secondary,
              }}
            >
              {getMinutes(item.duration)} Min.
            </Box>
          </Box>

          <Typography
            sx={{
              fontSize: "medium",
              fontWeight: "light",
              color: (theme) => theme.palette.text.secondary,
              mt: 0.5,
              // make it so the text doesnt resize the parent nor overflow max 3 rows
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
            }}
            title={item.summary}
          >
            {item.summary}
          </Typography>
        </Box>
      </Box>
    </>
  );
}

function TabButton({
  text,
  onClick,
  selected,
}: {
  text: string;
  onClick: (event: React.MouseEvent) => void;
  selected: boolean;
}) {
  return (
    <Typography
      sx={{
        fontSize: "1.25rem",
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: selected
          ? (theme) => theme.palette.primary.main
          : (theme) => theme.palette.text.disabled,
        cursor: "pointer",
        userSelect: "none",
        position: "relative",
        pb: 0.5,

        "&:after": {
          content: '""',
          position: "absolute",
          bottom: 0,
          left: 0,
          width: selected ? "100%" : "0%",
          height: "2px",
          backgroundColor: (theme) => theme.palette.primary.main,
          transition: "all 0.3s ease",
        },

        "&:hover": {
          color: (theme) =>
            selected ? theme.palette.primary.main : theme.palette.text.primary,

          "&:after": {
            width: "100%",
          },
        },

        transition: "all 0.3s ease",
      }}
      onClick={onClick}
    >
      {text}
    </Typography>
  );
}

/**
 * Calculates the number of minutes from a given duration in milliseconds.
 *
 * @param duration The duration in milliseconds.
 * @returns The number of minutes.
 */
export function getMinutes(duration: number): number {
  return Math.floor(duration / 60000);
}
