import {
  Alert,
  Backdrop,
  Box,
  CircularProgress,
  Grid,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getLibraryDir } from "../plex";
import MovieItem from "./MovieItem";
import { useInView } from "react-intersection-observer";
import LibrarySortDropDown, {
  LibrarySort,
  sortMetadata,
} from "./LibrarySortDropDown";
import { useWatchListCache } from "../states/WatchListCache";

function LibraryScreen() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [library, setLibrary] = useState<Plex.MediaContainer | null>(null);

  const [sortBy, setSortBy] = useState<LibrarySort>(
    (localStorage.getItem("sortBy") as LibrarySort) || "title:asc"
  );
  const [skipFilter, setSkipFilter] = useState(false);

  const bkey = searchParams.has("bkey")
    ? decodeURIComponent(searchParams.get("bkey") as string)
    : null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        searchParams.delete("bkey");
        setSearchParams(searchParams);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!(searchParams.has("mid") && searchParams.has("bkey"))) return;

    const localbkey = searchParams.get("bkey");
    searchParams.delete("mid");
    if (localbkey) searchParams.set("bkey", localbkey);
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!bkey) return;

    setLoading(true);
    setError(null);
    setLibrary(null);
    setSortBy(localStorage.getItem("sortBy") as LibrarySort);

    switch (bkey) {
      case "/plextv/watchlist":
        {
          const watchlist = useWatchListCache.getState().watchListCache;
          setLibrary({
            size: watchlist.length,
            title1: "Watchlist",
            librarySectionID: 0,
            mediaTagPrefix: "",
            mediaTagVersion: 0,
            viewGroup: "secondary",
            Metadata: watchlist,
          });
          setLoading(false);
          setSkipFilter(true);
        }
        break;
      default:
        getLibraryDir(bkey)
          .then((data) => {
            setLibrary(data);
            setLoading(false);
            setSkipFilter(false);
          })
          .catch((e) => {
            setError(e.message);
            setLoading(false);
          });

        break;
    }
  }, [bkey, searchParams]);

  if (loading)
    return (
      <Backdrop
        open={searchParams.has("bkey")}
        sx={{
          overflowY: "scroll",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1200,
        }}
        onClick={() => {
          searchParams.delete("bkey");
          setSearchParams(searchParams);
        }}
      >
        <CircularProgress />
      </Backdrop>
    );

  if (bkey)
    return (
      <Backdrop
        open={searchParams.has("bkey")}
        sx={{
          overflowY: "scroll",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          zIndex: 1200,
        }}
        onClick={() => {
          searchParams.delete("bkey");
          setSearchParams(searchParams);
        }}
      >
        <Box
          sx={{
            width: { xs: "95vw", sm: "90vw", md: "130vh" },
            maxWidth: "100vw",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            backgroundColor: "#181818",
            mt: { xs: 1, md: 4 },
            padding: { xs: "12px", md: "20px" },

            ...((library?.Metadata?.length ?? 0) > 10 && {
              pb: "10vh",
            }),

            borderRadius: "10px",
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {error && (
            <Box sx={{ width: "100%" }}>
              <Alert severity="error">{error}</Alert>
            </Box>
          )}

          <Box
            sx={{
              width: "100%",
              pt: 0,
              pb: 2,
              display: "flex",
              gap: 0,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-start",
              userSelect: "none",
            }}
          >
            <Typography
              sx={{
                color: "#fff",
                fontSize: { xs: "1.4rem", md: "2rem" },
                fontWeight: "bold",
              }}
            >
              {library?.title1} {library?.title2 && ` - ${library?.title2}`}
            </Typography>

            <Box
              sx={{
                marginLeft: "auto",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 2,
              }}
            >
              {!skipFilter && (
                <LibrarySortDropDown sortHook={[sortBy, setSortBy]} />
              )}
            </Box>
          </Box>

          <Grid container spacing={2} sx={{ width: "100%" }}>
            {library?.Metadata &&
              (skipFilter
                ? library?.Metadata
                : sortMetadata(library?.Metadata, sortBy)
              ).map((item, index) => (
                <Grid
                  size={{ xs: 12, sm: 6, md: 4, lg: 4, xl: 3 }}
                  key={item.ratingKey}
                >
                  <Element
                    item={item}
                    key={`${index}`}
                    plexTv={bkey.startsWith("/plextv")}
                  />
                </Grid>
              ))}
          </Grid>
        </Box>
      </Backdrop>
    );

  return <></>;
}

function Element({ item, plexTv }: { item: Plex.Metadata; plexTv?: boolean }) {
  const { inView, ref } = useInView();

  return (
    <div ref={ref}>
      {inView && <MovieItem item={item} PlexTvSource={plexTv} />}
      {!inView && (
        <Box style={{ width: "100%" }}>
          <Box sx={{ width: "100%", height: "auto", aspectRatio: "16/9" }} />
          <Box sx={{ width: "100%", height: "104px" }} />
        </Box>
      )}
    </div>
  );
}

export default LibraryScreen;
