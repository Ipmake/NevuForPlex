import { Avatar, Box, CircularProgress, Grid, Typography } from "@mui/material";
import React, { useEffect } from "react";
import {
  getAllLibraries,
  getLibraryDir,
  getLibraryMeta,
  getLibrarySecondary,
  getTranscodeImageURL,
} from "../plex";
import { useNavigate } from "react-router-dom";
import { shuffleArray } from "../common/ArrayExtra";
import MovieItemSlider from "../components/MovieItemSlider";
import HeroDisplay from "../components/HeroDisplay";
import { useWatchListCache } from "../states/WatchListCache";
import { useUserSettings } from "../states/UserSettingsState";

export default function Home() {
  const [libraries, setLibraries] = React.useState<Plex.LibarySection[]>([]);
  const [featured, setFeatured] = React.useState<
    PerPlexed.RecommendationShelf[]
  >([]);
  const [randomItem, setRandomItem] = React.useState<Plex.Metadata | null>(
    null
  );
  const { watchListCache } = useWatchListCache();
  const { settings } = useUserSettings();

  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const librariesData = await getAllLibraries();

        const enabledLibraries = librariesData.filter((library) => {
          const key = `LIBRARY_${library.uuid}`;
          const value = settings[key];
          return value === undefined || value === "true"; // Default to true
        });
        setLibraries(enabledLibraries);

        const filteredLibraries = enabledLibraries.filter((lib) =>
          ["movie", "show"].includes(lib.type)
        );

        const featuredData = await getRecommendations(filteredLibraries);
        setFeatured(featuredData);

        let randomItemData = await getRandomItem(filteredLibraries);
        let attempts = 0;
        while (!randomItemData && attempts < 15) {
          randomItemData = await getRandomItem(filteredLibraries);
          attempts++;
        }

        if (!randomItemData) return;

        const data = await getLibraryMeta(randomItemData?.ratingKey as string);
        setRandomItem(data);
      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [settings]);
  const navigate = useNavigate();

  if (loading)
    return (
      <Box
        sx={{
          width: "100vw",
          height: "80vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",

        pt: "-64px",
      }}
    >
      {randomItem && <HeroDisplay item={randomItem} />}
      <Box
        sx={{
          width: "100%",
          display: "flex",
          gap: 6,
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          pb: 8,
          mt: randomItem ? "-20vh" : "80px",
          zIndex: 1,
        }}
      >
        <Grid container spacing={2} sx={{ px: "2.5vw", mt: 2, width: "100%" }}>
          {libraries
            ?.filter((e) => ["movie", "show"].includes(e.type || ""))
            .map((library) => (
              <Grid
                size={{ xs: 6, sm: 4, md: 3, lg: 2, xl: 2 }}
                key={library.key}
              >
                <Box
                  sx={{
                    width: "100%",
                    height: "auto",
                    aspectRatio: "16/9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "7px",
                    position: "relative",
                    overflow: "hidden",
                    cursor: "pointer",
                    boxShadow: (theme) => theme.shadows[1],
                    transition: "all 0.2s ease",

                    "&:hover": {
                      transform: "translateY(-4px) scale(1.02)",
                      boxShadow: (theme) => theme.shadows[3],
                    },
                  }}
                  onClick={() => navigate(`/browse/${library.key}`)}
                >
                  {/* Background image */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundImage: `url(${getTranscodeImageURL(
                        library.art,
                        1920,
                        1080
                      )})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      zIndex: -2,
                    }}
                  />

                  {/* Theme color overlay */}
                  <Box
                    className="overlay"
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: (theme) => `linear-gradient(180deg, 
                        ${theme.palette.primary.dark}99, 
                        ${theme.palette.background.default}EE)`,
                      opacity: 0.85,
                      zIndex: -1,
                      transition: "opacity 0.2s ease",
                    }}
                  />

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 1.5,
                      textAlign: "center",
                      p: 2,
                    }}
                  >
                    <Avatar
                      variant="rounded"
                      src={`${getTranscodeImageURL(library.thumb, 48, 48)}`}
                      sx={{
                        width: 48,
                        height: 48,
                        boxShadow: (theme) => theme.shadows[2],
                      }}
                    />
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: "common.white",
                        textShadow: "0px 1px 3px rgba(0,0,0,0.3)",
                      }}
                    >
                      {library.title}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
        </Grid>

        <Box
          sx={{
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            gap: 8,
          }}
        >
          <MovieItemSlider
            title="Continue Watching"
            dir="/library/onDeck"
            link="/library/onDeck"
          />

          {watchListCache && watchListCache.length > 0 && (
            <MovieItemSlider
              title="Watchlist"
              data={watchListCache}
              plexTvSource={true}
              link="/plextv/watchlist"
            />
          )}

          {featured &&
            featured.map((item, index) => (
              <MovieItemSlider
                key={index}
                title={item.title}
                dir={item.dir}
                shuffle={true}
                link={item.link}
              />
            ))}
        </Box>
      </Box>
    </Box>
  );
}

async function getRecommendations(libraries: Plex.Directory[]) {
  const genreSelection: PerPlexed.RecommendationShelf[] = [];

  for (const library of libraries) {
    const genres = await getLibrarySecondary(library.key, "genre");

    if (!genres || !genres.length) continue;

    const selectGenres: Plex.Directory[] = [];

    // Get 5 random genres
    while (selectGenres.length < Math.min(5, genres.length)) {
      const genre = genres[Math.floor(Math.random() * genres.length)];
      if (selectGenres.includes(genre)) continue;
      selectGenres.push(genre);
    }

    for (const genre of selectGenres) {
      genreSelection.push({
        title: `${library.title} - ${genre.title}`,
        libraryID: library.key,
        dir: `/library/sections/${library.key}/genre/${genre.key}`,
        link: `/library/sections/${library.key}/genre/${genre.key}`,
      });
    }
  }

  return shuffleArray(genreSelection);
}

// get one completely random item from any library
async function getRandomItem(libraries: Plex.Directory[]) {
  try {
    const library = libraries[Math.floor(Math.random() * libraries.length)];

    const items = await getLibraryDir(`/library/sections/${library.key}/all`, {
      sort: "random:desc",
      limit: 1,
    });

    return items.Metadata?.[0] || null;
  } catch (error) {
    console.log("Error fetching random item", error);
    return null;
  }
}
