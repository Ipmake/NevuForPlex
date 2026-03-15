import {
  PlayArrowRounded,
  BookmarkBorderRounded,
  CheckCircleOutlineRounded,
  BookmarkRounded,
  RecommendRounded,
  CheckCircleRounded,
  VolumeOffRounded,
  VolumeUpRounded,
  StarRounded,
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
import React, { JSX, memo, useEffect } from "react";
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

        <Divider
          sx={{
            my: 1,
          }}
        />

        <MenuItem
          onClick={async () => {
            if (!item) return;

            useConfirmModal.getState().setModal({
              title: `Mark as Watched`,
              message: `Are you sure you want to mark "${item.title}" as Watched?`,
              onConfirm: async () => {
                switch (item.type) {
                  case "movie":
                  case "episode":
                    item.viewCount = 1;
                    await setMediaPlayedStatus(true, item.ratingKey);
                    break;
                  case "show":
                    item.viewedLeafCount = item.leafCount;
                    await setMediaPlayedStatus(true, item.ratingKey);
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
            <CheckCircleRounded fontSize="small" />
          </ListItemIcon>
          Mark as Watched
        </MenuItem>
        <MenuItem
          onClick={async () => {
            if (!item) return;

            useConfirmModal.getState().setModal({
              title: `Mark as Unwatched`,
              message: `Are you sure you want to mark "${item.title}" as Unwatched?`,
              onConfirm: async () => {
                switch (item.type) {
                  case "movie":
                  case "episode":
                    item.viewCount = 0;
                    await setMediaPlayedStatus(false, item.ratingKey);
                    break;
                  case "show":
                    item.viewedLeafCount = 0;
                    await setMediaPlayedStatus(false, item.ratingKey);
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
            <CheckCircleOutlineRounded fontSize="small" />
          </ListItemIcon>
          Mark as Unwatched
        </MenuItem>
      </Menu>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          width: itemsPerPage
            ? `calc((100vw / ${itemsPerPage}) - 10px - (5vw / ${itemsPerPage}))`
            : "100%",
          minWidth: itemsPerPage
            ? `calc((100vw / ${itemsPerPage}) - 10px - (5vw / ${itemsPerPage}))`
            : "100%",
          backgroundColor: "rgba(18, 18, 22, 0.7)",
          backdropFilter: "blur(15px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "8px",
          overflow: "hidden",
          position: "relative",
          boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.3)",
          willChange: "transform",
          backfaceVisibility: "hidden",
          transformOrigin:
            itemsPerPage && index !== undefined
              ? (index % itemsPerPage) === 0
                ? "left center"
                : (index % itemsPerPage) === itemsPerPage - 1
                ? "right center"
                : "center center"
              : "center center",
          transition:
            "transform 0.4s cubic-bezier(0.25,0.10,0.25,1.00), box-shadow 0.4s cubic-bezier(0.25,0.10,0.25,1.00), border-color 0.4s cubic-bezier(0.25,0.10,0.25,1.00)",
          cursor: "pointer",

          "&:hover": {
            transform: "scale(1.15)",
            zIndex: 10,
            boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.5)",
            border: "1px solid rgba(255,255,255,0.15)",
          },

          "&:hover .movie-item-hover-overlay": {
            opacity: "1 !important",
          },
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu(
            contextMenu === null
              ? {
                  mouseX: e.clientX + 2,
                  mouseY: e.clientY - 6,
                }
              : null
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
        {/* Thumbnail area */}
        <Box
          sx={{
            width: "100%",
            aspectRatio: "16/9",
            position: "relative",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {/* Background image */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage: ["episode"].includes(item.type)
                ? `url(${getTranscodeImageURL(item.thumb, 1200, 680)})`
                : `url(${getTranscodeImageURL(item.art, 1200, 680)})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />

          {/* Preview playback overlay */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              opacity: previewPlaybackState.playing ? 1 : 0,
              transition: "opacity 2s cubic-bezier(0.25,0.10,0.25,1.00)",
              backgroundColor: previewPlaybackState.playing
                ? "rgba(18, 25, 39, 0.95)"
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

          {/* Hover overlay with buttons */}
          <Box
            className="movie-item-hover-overlay"
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 40%)",
              opacity: 0,
              transition: "opacity 0.3s ease",
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-end",
              justifyContent: "flex-end",
              padding: "8px",
              gap: "6px",
              zIndex: 5,
              pointerEvents: "none",
            }}
          >
            <IconButton
              size="small"
              sx={{
                backgroundColor: "rgba(18, 25, 39, 0.55)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#fff",
                width: "30px",
                height: "30px",
                pointerEvents: "auto",
                transition: "background-color 0.2s ease",
                "&:hover": {
                  backgroundColor: "rgba(18, 25, 39, 0.8)",
                },
              }}
              disabled={playButtonLoading}
              onClick={async (e) => {
                e.stopPropagation();
                await handlePlay();
              }}
            >
              {playButtonLoading ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <PlayArrowRounded sx={{ fontSize: "18px" }} />
              )}
            </IconButton>

            <WatchListButton item={item} />
          </Box>

          {/* Mute button for preview */}
          <IconButton
            size="small"
            sx={{
              backgroundColor: "rgba(18, 25, 39, 0.55)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.15)",
              opacity: previewPlaybackState.url ? 1 : 0,
              transition: "opacity 0.4s ease, background-color 0.2s ease",
              position: "absolute",
              top: "8px",
              left: "8px",
              zIndex: 10,
              padding: "1px",
              "&:hover": {
                backgroundColor: "rgba(18, 25, 39, 0.8)",
              },
              width: "28px",
              height: "28px",
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
              <VolumeOffRounded sx={{ fontSize: "12px" }} />
            ) : (
              <VolumeUpRounded sx={{ fontSize: "12px" }} />
            )}
          </IconButton>

          {/* Watched badge */}
          {((item.type === "show" && item.leafCount === item.viewedLeafCount) ||
            (item.type === "movie" &&
              item?.viewCount !== undefined &&
              item.viewCount > 0)) && (
            <Box
              sx={{
                position: "absolute",
                top: "8px",
                right: "8px",
                backgroundColor: "rgba(18, 25, 39, 0.55)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "4px",
                padding: "2px 6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                zIndex: 10,
              }}
            >
              <Tooltip title="Watched" arrow placement="top">
                <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <CheckCircleOutlineRounded
                    sx={{
                      fontSize: "14px",
                      color: (theme) => theme.palette.primary.light,
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: "10px",
                      fontWeight: "700",
                      letterSpacing: "0.05em",
                      color: "rgba(255,255,255,0.9)",
                    }}
                  >
                    Watched
                  </Typography>
                </Box>
              </Tooltip>
            </Box>
          )}

          {/* Content rating badge on thumbnail */}
          {item.contentRating && (
            <Box
              sx={{
                position: "absolute",
                top: "8px",
                left: previewPlaybackState.url ? "40px" : "8px",
                transition: "left 0.4s ease",
                backgroundColor: "rgba(18, 25, 39, 0.55)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "4px",
                padding: "1px 6px",
                zIndex: 10,
              }}
            >
              <Typography
                sx={{
                  fontSize: "10px",
                  fontWeight: "700",
                  letterSpacing: "0.05em",
                  color: "rgba(255,255,255,0.9)",
                }}
              >
                {item.contentRating}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Progress bar */}
        {(item.type === "episode" ||
          (item.type === "movie" && item.viewOffset)) && (
          <LinearProgress
            variant="determinate"
            value={((item?.viewOffset ?? 0) / item.duration) * 100}
            sx={{
              width: "100%",
              height: "3px",
              flexShrink: 0,
              bgcolor: "rgba(255, 255, 255, 0.08)",
              "& .MuiLinearProgress-bar": {
                backgroundColor: (theme) => theme.palette.primary.main,
              },
            }}
          />
        )}

        {/* Info section */}
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            padding: "10px 12px 12px",
            userSelect: "none",
            position: "relative",
            zIndex: 5,
            gap: "2px",
          }}
        >
          {/* Type label & rating row */}
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              mb: "2px",
            }}
          >
            <Typography
              sx={{
                fontSize: "10px",
                fontWeight: "700",
                letterSpacing: "0.1em",
                color: (theme) => theme.palette.primary.light,
                textTransform: "uppercase",
                opacity: 0.9,
                lineHeight: 1,
              }}
            >
              {item.type === "episode"
                ? `S${item.parentIndex} · E${item.index}`
                : item.type}
            </Typography>

            {item.audienceRating && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "2px",
                }}
              >
                <StarRounded
                  sx={{
                    fontSize: "13px",
                    color: "#f5c518",
                  }}
                />
                <Typography
                  sx={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: "rgba(255,255,255,0.8)",
                    lineHeight: 1,
                  }}
                >
                  {item.audienceRating.toFixed(1)}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Title */}
          <Typography
            sx={{
              fontSize: "0.95rem",
              fontWeight: "600",
              color: (theme) => theme.palette.text.primary,
              textOverflow: "ellipsis",
              overflow: "hidden",
              whiteSpace: "nowrap",
              width: "100%",
              lineHeight: 1.3,
              "@media (max-width: 2000px)": {
                fontSize: "0.9rem",
              },
            }}
          >
            {item.title}
          </Typography>

          {/* Show title for episodes */}
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
                fontSize: "0.8rem",
                fontWeight: "500",
                color: (theme) => theme.palette.text.secondary,
                opacity: 0.7,
                transition: "all 0.3s ease",
                cursor: "pointer",
                "&:hover": {
                  opacity: 1,
                  color: (theme) => theme.palette.primary.light,
                },
                textOverflow: "ellipsis",
                overflow: "hidden",
                whiteSpace: "nowrap",
                width: "100%",
              }}
            >
              {item.grandparentTitle}
            </Typography>
          )}

          {/* Metadata row */}
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              flexWrap: "nowrap",
              mt: "4px",
              gap: 0.75,
              overflow: "hidden",
            }}
          >
            {item.year && (
              <Typography
                sx={{
                  fontSize: "11px",
                  fontWeight: "500",
                  color: (theme) => theme.palette.text.secondary,
                  opacity: 0.7,
                  flexShrink: 0,
                }}
              >
                {item.year}
              </Typography>
            )}
            {item.year &&
              ((item.duration && ["episode", "movie"].includes(item.type)) ||
                (item.type === "show" &&
                  item.leafCount &&
                  (item.seasonCount ?? item.childCount))) && (
                <Typography
                  sx={{
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.25)",
                    flexShrink: 0,
                    lineHeight: 1,
                  }}
                >
                  ·
                </Typography>
              )}
            {item.duration && ["episode", "movie"].includes(item.type) && (
              <Typography
                sx={{
                  fontSize: "11px",
                  fontWeight: "500",
                  color: (theme) => theme.palette.text.secondary,
                  opacity: 0.7,
                  flexShrink: 0,
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
                    fontSize: "11px",
                    fontWeight: "500",
                    color: (theme) => theme.palette.text.secondary,
                    opacity: 0.7,
                    flexShrink: 0,
                  }}
                >
                  {(item.seasonCount ?? item.childCount ?? 1) > 1
                    ? `${item.childCount} Seasons`
                    : `${item.leafCount} Ep${item.leafCount > 1 ? "s" : ""}`}
                </Typography>
              )}

            {item.Genre && item.Genre.length > 0 && (
              <>
                <Typography
                  sx={{
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.25)",
                    flexShrink: 0,
                    lineHeight: 1,
                  }}
                >
                  ·
                </Typography>
                <Typography
                  sx={{
                    fontSize: "11px",
                    fontWeight: "500",
                    color: (theme) => theme.palette.text.secondary,
                    opacity: 0.7,
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    minWidth: 0,
                  }}
                >
                  {item.Genre[0].tag}
                </Typography>
              </>
            )}
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
    <IconButton
      size="small"
      sx={{
        backgroundColor: "rgba(18, 25, 39, 0.55)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.15)",
        color: "#fff",
        width: "30px",
        height: "30px",
        pointerEvents: "auto",
        transition: "background-color 0.2s ease",
        "&:hover": {
          backgroundColor: "rgba(18, 25, 39, 0.8)",
        },
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
        <CircularProgress size={12} color="inherit" />
      ) : (
        <>
          {WatchList.isOnWatchList(item.guid) ? (
            <BookmarkRounded sx={{ fontSize: "16px" }} />
          ) : (
            <BookmarkBorderRounded sx={{ fontSize: "16px" }} />
          )}
        </>
      )}
    </IconButton>
  );
}

export function HeroWatchListButton({ item }: { item: Plex.Metadata }) {
  const WatchList = useWatchListCache();
  const [isLoading, setIsLoading] = React.useState(false);

  const isOnWatchList = WatchList.isOnWatchList(item.guid);

  return (
    <Button
      variant="contained"
      sx={{
        fontWeight: "bold",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        transition: "all 0.2s ease-in-out",
        height: "38.5px"
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (!item || isLoading) return;
        setIsLoading(true);

        WatchListCacheEmitter.once("watchListUpdate", () => {
          setIsLoading(false);
        });

        if (isOnWatchList) return WatchList.removeItem(item.guid);

        WatchList.addItem(item);
      }}
    >
      {isLoading ? (
        <CircularProgress size={16} color="inherit" />
      ) : (
        <>
          {isOnWatchList ? (
            <BookmarkRounded fontSize="small" />
          ) : (
            <BookmarkBorderRounded fontSize="small" />
          )}
        </>
      )}
    </Button>
  );
}
