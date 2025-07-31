import {
  PlayArrowRounded,
  BookmarkBorderRounded,
  CheckCircleOutlineRounded,
  BookmarkRounded,
  RecommendRounded,
  CheckCircleRounded,
  VolumeOffRounded,
  VolumeUpRounded,
} from "@mui/icons-material";
import {
  Box,
  Typography,
  Tooltip,
  Button,
  CircularProgress,
  LinearProgress,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  IconButton,
} from "@mui/material";
import React, { JSX, memo, use, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  getTranscodeImageURL,
  getLibraryMeta,
  getLibraryMetaChildren,
  getItemByGUID,
  setMediaPlayedStatus,
} from "../plex";
import { durationToText } from "./MovieItemSlider";
import {
  useWatchListCache,
  WatchListCacheEmitter,
} from "../states/WatchListCache";
import { useBigReader } from "./BigReader";
import { create } from "zustand";
import { usePreviewPlayer } from "../states/PreviewPlayerState";
import ReactPlayer from "react-player";
import { useConfirmModal } from "./ConfirmModal";
import { getBackendURL } from "../backendURL";
import { queryBuilder } from "../plex/QuickFunctions";

interface MovieItemPreviewPlaybackState {
  url: string;
  playing: boolean;
  setUrl: (url: string) => void;
  setPlaying: (playing: boolean) => void;
  setState: (state: { url: string; playing: boolean }) => void;
}

export const useMovieItemPreviewPlayback =
  create<MovieItemPreviewPlaybackState>((set) => ({
    url: "",
    playing: false,
    setUrl: (url: string) => set({ url }),
    setPlaying: (playing: boolean) => set({ playing }),
    setState: (state: { url: string; playing: boolean }) => set(state),
  }));

function MovieItem({
  item,
  itemsPerPage,
  index,
  PlexTvSource,
  refetchData,
}: {
  item: Plex.Metadata;
  itemsPerPage?: number;
  index?: number;
  PlexTvSource?: boolean;
  refetchData?: () => void;
}): JSX.Element {
  const [, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { MetaScreenPlayerMuted } = usePreviewPlayer();

  const [playButtonLoading, setPlayButtonLoading] = React.useState(false);
  const [contextMenu, setContextMenu] = React.useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);

  const [hovered, setHovered] = React.useState(false);
  const hoveredRef = React.useRef(hovered);
  const [previewPlaybackState, setPreviewPlaybackState] = React.useState({
    url: "",
    playing: false,
  });
  const hoverTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    if (hovered) {
      hoverTimerRef.current = setTimeout(async () => {
        const data = await getLibraryMeta(item.ratingKey);
        if (!data) return;
        if (hoveredRef.current === false) return;

        const mediaURL = data.Extras?.Metadata?.[0]?.Media?.[0]?.Part[0]?.key;
        if (!mediaURL) return;
        setPreviewPlaybackState({
          url: `${getBackendURL()}/dynproxy${
            mediaURL.split("?")[0]
          }?${queryBuilder({
            "X-Plex-Token": localStorage.getItem("accessToken"),
            ...Object.fromEntries(
              new URL("http://localhost:3000" + mediaURL).searchParams.entries()
            ),
          })}`,
          playing: true,
        });
      }, 1000);
    } else {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      setPreviewPlaybackState({ url: "", playing: false });
    }

    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
    };
  }, [hovered]);

  useEffect(() => {
    hoveredRef.current = hovered;
  }, [hovered]);

  const handleClose = () => {
    setContextMenu(null);
  };

  const handlePlay = async () => {
    if (!item) return;
    setPlayButtonLoading(true);

    let PlexTvSrcData: Plex.Metadata | null = null;
    if (PlexTvSource) {
      PlexTvSrcData = await getItemByGUID(item.guid);

      if (!PlexTvSrcData) {
        useBigReader
          .getState()
          .setBigReader(`"${item.title}" is not available on this Plex Server`);
        return;
      }
    }

    if (PlexTvSource && !PlexTvSrcData) return;

    let localItem = PlexTvSource ? (PlexTvSrcData as Plex.Metadata) : item;

    switch (item.type) {
      case "movie":
      case "episode":
        navigate(
          `/watch/${localItem.ratingKey}${
            localItem.viewOffset ? `?t=${localItem.viewOffset}` : ""
          }`
        );

        setPlayButtonLoading(false);
        break;
      case "show":
        {
          const data = await getLibraryMeta(localItem.ratingKey);

          if (!data) {
            setPlayButtonLoading(false);
            return;
          }

          if (data.OnDeck?.Metadata) {
            navigate(
              `/watch/${data.OnDeck.Metadata.ratingKey}${
                data.OnDeck.Metadata.viewOffset
                  ? `?t=${data.OnDeck.Metadata.viewOffset}`
                  : ""
              }`
            );

            setPlayButtonLoading(false);
            return;
          } else {
            if (data.Children?.size === 0 || !data.Children?.Metadata[0])
              return setPlayButtonLoading(false);
            // play first episode
            const episodes = await getLibraryMetaChildren(
              data.Children?.Metadata[0].ratingKey
            );
            if (episodes?.length === 0) return setPlayButtonLoading(false);

            navigate(`/watch/${episodes[0].ratingKey}`);
          }
        }
        break;
    }
  };

  // 300 x 170
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
          {item.title}
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
          onClick={async (e) => {
            if (!item) return;
            handleClose();

            if (item.type === "episode")
              return setSearchParams(
                new URLSearchParams({
                  bkey: `/library/metadata/${item.grandparentRatingKey}/similar`,
                })
              );

            setSearchParams(
              new URLSearchParams({
                bkey: `/library/metadata/${item.ratingKey}/similar`,
              })
            );
          }}
        >
          <ListItemIcon>
            <RecommendRounded fontSize="small" />
          </ListItemIcon>
          View Similar
        </MenuItem>
        <MenuItem
          onClick={async () => {
            if (!item) return;
            let state = "unwatched";

            if (
              (item.type === "movie" && Boolean(item.viewCount)) ||
              (item.type === "episode" &&
                (item.viewOffset ?? 0) >= item.duration)
            ) {
              state = "watched";
            }

            if (item.type === "show") {
              state =
                item.viewedLeafCount === item.leafCount
                  ? "watched"
                  : "unwatched";
            }

            useConfirmModal.getState().setModal({
              title: `Mark as ${state === "watched" ? "Unwatched" : "Watched"}`,
              message: `Are you sure you want to mark "${item.title}" as ${
                state === "watched" ? "Unwatched" : "Watched"
              }?`,
              onConfirm: async () => {
                switch (item.type) {
                  case "movie":
                  case "episode":
                    if (
                      item.type === "episode" &&
                      (item?.viewOffset ?? 0) < item.duration
                    ) {
                      item.viewCount = 1;
                    } else {
                      item.viewCount = !Boolean(item.viewCount) ? 1 : 0;
                    }
                    await setMediaPlayedStatus(
                      Boolean(item.viewCount),
                      item.ratingKey
                    );
                    break;
                  case "show":
                    const newViewedLeafCount =
                      item.viewedLeafCount === item.leafCount
                        ? 0
                        : item.leafCount;
                    item.viewedLeafCount = newViewedLeafCount;
                    await setMediaPlayedStatus(
                      newViewedLeafCount === item.leafCount,
                      item.ratingKey
                    );
                    break;
                  default:
                    break;
                }

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
            {item?.type === "movie" || item?.type === "episode" ? (
              !((item?.viewCount ?? 0) > 0) ? (
                <CheckCircleOutlineRounded fontSize="small" />
              ) : (
                <CheckCircleRounded fontSize="small" />
              )
            ) : item?.type === "show" ? (
              item?.viewedLeafCount === item?.leafCount ? (
                <CheckCircleRounded fontSize="small" />
              ) : (
                <CheckCircleOutlineRounded fontSize="small" />
              )
            ) : null}
          </ListItemIcon>

          {item?.type === "movie" || item?.type === "episode"
            ? item.type === "episode" && (item.viewOffset ?? 0) < item.duration
              ? "Mark as Watched"
              : !((item?.viewCount ?? 0) > 0)
              ? "Mark as Watched"
              : "Mark as Unwatched"
            : item?.type === "show"
            ? item?.viewedLeafCount === item?.leafCount
              ? "Mark as Unwatched"
              : "Mark as Watched"
            : null}
        </MenuItem>
      </Menu>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          width: itemsPerPage
            ? `calc((100vw / ${itemsPerPage}) - 10px - (5vw / ${itemsPerPage}))`
            : "100%",
          minWidth: itemsPerPage
            ? `calc((100vw / ${itemsPerPage}) - 10px - (5vw / ${itemsPerPage}))`
            : "100%",
          backgroundColor: "rgba(18, 18, 22, 0.9)",

          borderRadius: "7px",
          overflow: "hidden",
          mb: "0px",
          position: "relative",
          boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.2)",

          "&:hover": {
            transform: "scale(1.08)",
            transition: "all 0.4s cubic-bezier(0.25,0.10,0.25,1.00)",
            zIndex: 10,
            boxShadow: "0px 4px 15px rgba(0, 0, 0, 0.3)",
            position: "relative",
            pb: "10px",
            mb: "-42px",
          },

          [`&:hover > :nth-child(${
            item.type === "episode" ||
            (item.type === "movie" && item.viewOffset)
              ? 4
              : 3
          })`]: {
            height: "32px",
            opacity: 1,
          },

          transition: "all 0.4s cubic-bezier(0.25,0.10,0.25,1.00), transform 0.4s cubic-bezier(0.25,0.10,0.25,1.00)",
          cursor: "pointer",
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu(
            contextMenu === null
              ? {
                  mouseX: e.clientX + 2,
                  mouseY: e.clientY - 6,
                }
              : // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
                // Other native context menus might behave different.
                // With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
                null
          );
        }}
        onClick={async () => {
          if (PlexTvSource) {
            const data = await getItemByGUID(item.guid);
            if (!data) {
              useBigReader
                .getState()
                .setBigReader(
                  `"${item.title}" is not available on this Plex Server`
                );
              return;
            }

            setSearchParams({ mid: data.ratingKey.toString() });
          } else {
            if (item.grandparentRatingKey && ["episode"].includes(item.type))
              return setSearchParams({ mid: item.grandparentRatingKey });

            setSearchParams({ mid: item.ratingKey.toString() });
          }
        }}
        onMouseEnter={() => {
          setHovered(true);
        }}
        onMouseLeave={() => {
          setHovered(false);
        }}
      >
        <Box
          style={{
            width: "100%",
            aspectRatio: "16/9",

            backgroundImage: ["episode"].includes(item.type)
              ? `url(${getTranscodeImageURL(item.thumb, 1200, 680)})`
              : `url(${getTranscodeImageURL(item.art, 1200, 680)})`,
            backgroundSize: "cover",
            backgroundPosition: "center",

            position: "relative",
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
              opacity: previewPlaybackState.playing ? 1 : 0,
              transition: "all 2s cubic-bezier(0.25,0.10,0.25,1.00)",
              backgroundColor: previewPlaybackState.playing
                ? "rgba(18, 18, 22, 0.9)"
                : "transparent",
              pointerEvents: "none",

              overflow: "hidden",
            }}
          >
            <ReactPlayer
              url={previewPlaybackState.url ?? undefined}
              controls={false}
              width="100%"
              height="100%"
              autoplay={true}
              playing={previewPlaybackState.playing}
              volume={MetaScreenPlayerMuted ? 0 : 0.5}
              muted={MetaScreenPlayerMuted}
              onEnded={() => {
                setPreviewPlaybackState({
                  url: "",
                  playing: false,
                });
              }}
              pip={false}
              config={{
                file: {
                  attributes: { disablePictureInPicture: true },
                },
              }}
            />
          </Box>

          <IconButton
            sx={{
              backgroundColor: "#00000088",
              opacity: previewPlaybackState.url ? 1 : 0,
              transition: "all 1s cubic-bezier(0.25,0.10,0.25,1.00)",
              position: "absolute",
              bottom: "10px",
              right: "10px",
              zIndex: 10,
            }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (!item) return;

              usePreviewPlayer.setState((state) => ({
                MetaScreenPlayerMuted: !state.MetaScreenPlayerMuted,
              }));
            }}
          >
            {MetaScreenPlayerMuted ? (
              <VolumeOffRounded fontSize="small" />
            ) : (
              <VolumeUpRounded fontSize="small" />
            )}
          </IconButton>

          {((item.type === "show" && item.leafCount === item.viewedLeafCount) ||
            (item.type === "movie" &&
              item?.viewCount !== undefined &&
              item.viewCount > 0)) && (
            <Box
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
              }}
            >
              <Tooltip title="Watched" arrow placement="top">
                <CheckCircleOutlineRounded
                  fontSize="small"
                  sx={{
                    color: (theme) => theme.palette.primary.light,
                  }}
                />
              </Tooltip>
            </Box>
          )}
        </Box>
        {(item.type === "episode" ||
          (item.type === "movie" && item.viewOffset)) && (
          <LinearProgress
            variant="determinate"
            value={((item?.viewOffset ?? 0) / item.duration) * 100}
            sx={{
              width: "100%",
              height: "3px",
              bgcolor: "rgba(255, 255, 255, 0.1)",
              "& .MuiLinearProgress-bar": {
                backgroundColor: (theme) => theme.palette.primary.main,
              },
            }}
          />
        )}
        <Box
          style={{
            width: "100%",
            height: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-end",
            padding: "16px",
            userSelect: "none",
            transition: "all 0.4s cubic-bezier(0.25,0.10,0.25,1.00)",
            transform: "translateX(0%)",
            position: "relative",
            zIndex: 5,
          }}
        >
          <Typography
            sx={{
              fontSize: "12px",
              fontWeight: "500",
              letterSpacing: "0.05em",
              color: (theme) => theme.palette.primary.light,
              textTransform: "uppercase",
              opacity: 0.9,
              mb: 0.5,
            }}
          >
            {item.type} {item.type === "episode" && item.index}
          </Typography>

          <Typography
            style={{
              fontSize: "1.2rem",
              fontWeight: "600",
              color: "#FFFFFF",
              textOverflow: "ellipsis",
              overflow: "hidden",
              whiteSpace: "nowrap",
              maxLines: 1,
              maxInlineSize: "100%",
              marginTop: ["episode"].includes(item.type) ? "2px" : "0px",
            }}
            sx={{
              "@media (max-width: 2000px)": {
                fontSize: "1.1rem",
              },
            }}
          >
            {item.title}
          </Typography>

          {["episode"].includes(item.type) && item.grandparentTitle && (
            <Typography
              onClick={(e) => {
                e.stopPropagation();
                if (!item.grandparentKey?.toString()) return;
                setSearchParams({
                  mid: (item.grandparentRatingKey as string).toString(),
                });
              }}
              sx={{
                fontSize: "0.9rem",
                fontWeight: "normal",
                color: "#FFFFFF",
                opacity: 0.75,
                mb: 1,
                transition: "opacity 0.4s cubic-bezier(0.25,0.10,0.25,1.00)",
                "&:hover": {
                  opacity: 1,
                  textDecoration: "none",
                },
                textOverflow: "ellipsis",
                overflow: "hidden",
                maxLines: 1,
                maxInlineSize: "100%",
              }}
            >
              {item.grandparentTitle}
            </Typography>
          )}
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              mt: "4px",
              gap: 1,
            }}
          >
            {/* {item.rating && (
            <Typography
              sx={{
                fontSize: "medium",
                fontWeight: "light",
                color: "#FFFFFF",
                ml: 1,
              }}
            >
              {item.rating}
            </Typography>
          )}
          {item.contentRating && (
            <Typography
              sx={{
                fontSize: "medium",
                fontWeight: "light",
                color: "#FFFFFF",
                ml: 1,
                border: "1px dotted #AAAAAA",
                borderRadius: "5px",
                px: 1,
                py: -0.5,
              }}
            >
              {item.contentRating}
            </Typography>
          )} */}
            {/* {item.type === "episode" && item.index && (
            <Typography
              sx={{
                fontSize: "medium",
                fontWeight: "light",
                color: "#FFFFFF",
                ml: 1,
              }}
            >
              S{item.parentIndex} E{item.index}
            </Typography>
          )} */}
            {item.duration && ["episode", "movie"].includes(item.type) && (
              <Typography
                sx={{
                  fontSize: "13px",
                  fontWeight: "400",
                  color: "#FFFFFF",
                  opacity: 0.7,
                }}
              >
                {durationToText(item.duration)}
              </Typography>
            )}
            {item.type === "show" &&
              item.leafCount &&
              (item.seasonCount ?? item.childCount) && (
                <Typography
                  sx={{
                    fontSize: "13px",
                    fontWeight: "400",
                    color: "#FFFFFF",
                    opacity: 0.7,
                  }}
                >
                  {(item.seasonCount ?? item.childCount ?? 1) > 1
                    ? `${item.childCount} Seasons`
                    : `${item.leafCount} Episode${
                        item.leafCount > 1 ? "s" : ""
                      }`}
                </Typography>
              )}

            {item.year && (
              <Typography
                sx={{
                  fontSize: "13px",
                  fontWeight: "400",
                  color: "#FFFFFF",
                  opacity: 0.7,
                }}
              >
                {item.year}
              </Typography>
            )}
          </Box>
        </Box>

        <Box
          sx={{
            width: "100%",
            height: "0px", // 32px
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.4s cubic-bezier(0.25,0.10,0.25,1.00)",
          }}
        >
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0px 16px",
              gap: 1,
            }}
          >
            <Button
              variant="contained"
              sx={{
                width: "100%",
                height: "100%",
                backgroundColor: (theme) => theme.palette.background.paper,
                color: (theme) => theme.palette.primary.contrastText,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                "&:hover": {
                  backgroundColor: (theme) => theme.palette.primary.dark,
                },
                gap: 0.5,
                transition: "all 0.4s cubic-bezier(0.25,0.10,0.25,1.00)",
                padding: "0px 10px",
                fontSize: "13px",
                borderRadius: "6px",
                boxShadow: "none",
              }}
              disabled={playButtonLoading}
              onClick={async (e) => {
                e.stopPropagation();
                await handlePlay();
              }}
            >
              {playButtonLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <>
                  <PlayArrowRounded style={{ fontSize: "18px" }} /> Play
                </>
              )}
            </Button>

            <WatchListButton item={item} />
          </Box>
        </Box>
      </Box>
    </>
  );
}

export default memo(MovieItem);

export function WatchListButton({ item }: { item: Plex.Metadata }) {
  const WatchList = useWatchListCache();
  const [isLoading, setIsLoading] = React.useState(false);

  return (
    <Button
      variant="contained"
      sx={{
        width: "48px",
        height: "38px",
        backgroundColor: (theme) => theme.palette.background.paper,
        color: (theme) => theme.palette.text.primary,
        borderRadius: "6px",
        "&:hover": {
          backgroundColor: (theme) => theme.palette.primary.dark,
        },
        transition: "all 0.4s cubic-bezier(0.25,0.10,0.25,1.00)",
        boxShadow: "none",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (!item || isLoading) return;
        setIsLoading(true);

        WatchListCacheEmitter.once("watchListUpdate", () => {
          setIsLoading(false);
        });

        if (WatchList.isOnWatchList(item.guid))
          return WatchList.removeItem(item.guid);

        WatchList.addItem(item);
      }}
    >
      {isLoading ? (
        <CircularProgress size={14} color="inherit" />
      ) : (
        <>
          {WatchList.isOnWatchList(item.guid) ? (
            <BookmarkRounded fontSize="small" />
          ) : (
            <BookmarkBorderRounded fontSize="small" />
          )}
        </>
      )}
    </Button>
  );
}
