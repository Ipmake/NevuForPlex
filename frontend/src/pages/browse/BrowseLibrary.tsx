import {
  Box,
  Divider,
  Grid,
  MenuItem,
  Select,
  Skeleton,
} from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { getLibrary, getLibraryDir } from "../../plex";
import MovieItem from "../../components/MovieItem";
import { useInView } from "react-intersection-observer";

export const libTypeToNum = (type: string) => {
  switch (type) {
    case "movie":
      return 1;
    case "show":
      return 2;
    case "episode":
      return 4;
    default:
      return 0;
  }
};

function BrowseLibrary() {
  const { libraryID } = useParams<{ libraryID: string }>();
  const [library, setLibrary] = React.useState<Plex.MediaContainer | null>(
    null
  );
  const [items, setItems] = React.useState<Plex.MediaContainer | null>(null);

  const [isLoading, setIsLoading] = React.useState(true);

  const [primaryFilter, setPrimaryFilter] = React.useState<string>(
    localStorage.getItem("primaryFilter") || "all"
  );

  const [typeFilter, setTypeFilter] = React.useState<string>(
    localStorage.getItem("typeFilter") || "any"
  );

  const [sortBy, setSortBy] = React.useState<string>(
    localStorage.getItem("sortBy") || "title:asc"
  );

  useEffect(() => {
    if (!libraryID) return;
    getLibrary(libraryID).then((data) => {
      setLibrary(data);
    });
  }, [libraryID]);

  useEffect(() => {
    setItems(null);
    setIsLoading(true);

    let conEnd = "all";
    let extraProps = {};
    let sortString = sortBy;

    switch (primaryFilter) {
      case "watched":
        conEnd = "all";
        extraProps = {
          "show.unwatchedLeaves!": 1,
          "unwatched!": 1,
        };
        break;
      default:
        conEnd = primaryFilter;
        break;
    }

    switch (sortBy) {
      case "updated:asc":
      case "updated:desc":
        if (library?.Type?.[0].type === "show") sortString = "title:asc";
        break;
    }

    if (!library) return;
    getLibraryDir(
      `/library/sections/${library.librarySectionID.toString()}/${conEnd}`,
      {
        ...extraProps,
        ...(primaryFilter === "all" &&
          typeFilter !== "any" && {
            type: libTypeToNum(typeFilter),
          }),
        sort: sortString,
      }
    ).then(async (media) => {
      if (!media) return;

      switch (sortBy) {
        case "updated:asc":
        case "updated:desc":
          media.Metadata = media.Metadata?.sort((a, b) => {
            if (sortBy === "updated:asc") return a.updatedAt - b.updatedAt;
            else return b.updatedAt - a.updatedAt;
          });
          break;
      }

      setItems(media);
      setIsLoading(false);
    });
  }, [library, primaryFilter, sortBy, typeFilter]);

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        width: "100%",
        height: "fit-content",
        minHeight: "calc(100vh - 64px)",
        mt: "64px",
      }}
    >
      <Box
        sx={{
          zIndex: 10,
          left: "48px",
          top: "64px",
          position: "absolute",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 2,
        }}
      >
        <Select
          value={primaryFilter}
          onChange={(e) => {
            setPrimaryFilter(e.target.value);
            localStorage.setItem("primaryFilter", e.target.value);
          }}
          size="small"
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="unwatched">Unwatched</MenuItem>
          <MenuItem value="watched">Watched</MenuItem>
          <Divider />
          <MenuItem value="recentlyAdded">Recently Added</MenuItem>
          <MenuItem value="onDeck">On Deck</MenuItem>
          <MenuItem value="newest">Newest</MenuItem>
        </Select>

        {primaryFilter === "all" && (
          <Select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              localStorage.setItem("typeFilter", e.target.value);
            }}
            size="small"
          >
            <MenuItem value="any">
              {items?.viewGroup &&
                `${items?.viewGroup
                  .slice(0, 1)
                  .toUpperCase()}${items?.viewGroup.slice(1)}s`}
            </MenuItem>
            <Divider />
            {library?.Type?.filter((e) =>
              ["movie", "show", "episode"].includes(e.type)
            ).map((type) => (
              <MenuItem key={type.key} value={type.type}>
                {type.title}
              </MenuItem>
            ))}
          </Select>
        )}

        <Select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            localStorage.setItem("sortBy", e.target.value);
          }}
          size="small"
        >
          <MenuItem value={"title:asc"}>Title (A-Z)</MenuItem>
          <MenuItem value={"title:desc"}>Title (Z-A)</MenuItem>
          <Divider />
          <MenuItem value={"addedAt:asc"}>Date Added (Oldest)</MenuItem>
          <MenuItem value={"addedAt:desc"}>Date Added (Newest)</MenuItem>
          <MenuItem value={"year:asc"}>Year (Oldest)</MenuItem>
          <MenuItem value={"year:desc"}>Year (Newest)</MenuItem>
          <MenuItem value={"updated:asc"}>Date Updated (Oldest)</MenuItem>
          <MenuItem value={"updated:desc"}>Date Updated (Newest)</MenuItem>
          <Divider />
          <MenuItem value={"random:desc"}>Random</MenuItem>
        </Select>
      </Box>

      {/* {isLoading && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "95vh",
          }}
        >
          <CircularProgress />
        </Box>
      )} */}

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          width: "100%",
          height: "fit-content",
          px: 6,
          pt: "46px",
          pb: 2,
        }}
      >
        <AnimatePresence>
          <Grid container spacing={2} sx={{ mt: 2, width: "100%" }}>
            {isLoading &&
              "1"
                .repeat(50)
                .split("")
                .map((_, index) => (
                  <Grid
                    key={index}
                    size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2 }}
                  >
                    <Skeleton
                      variant="rounded"
                      width="100%"
                      height="auto"
                      sx={{
                        width: "100%",
                        height: "auto",
                        aspectRatio: "16/9",
                        borderRadius: "10px",
                      }}
                    />
                  </Grid>
                ))}
            {items &&
              !isLoading &&
              items.Metadata?.map((item) => (
                <Grid
                  key={item.ratingKey}
                  size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2 }}
                >
                  <DisplayMovieItem item={item} />
                </Grid>
              ))}
          </Grid>
        </AnimatePresence>
      </Box>
    </Box>
  );
}

export default BrowseLibrary;

function DisplayMovieItem({ item }: { item: Plex.Metadata }) {
  const { inView, ref } = useInView({
    triggerOnce: true,
    rootMargin: "200px 0px",
  });

  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transition: "opacity 0.35s ease-in-out",
      }}
    >
      {inView ? (
        <MovieItem item={item} />
      ) : (
        <Box style={{ width: "100%" }}>
          <Box sx={{ width: "100%", height: "auto", aspectRatio: "16/9" }} />
          <Box sx={{ width: "100%", height: "104px" }} />
        </Box>
      )}
    </div>
  );
}
