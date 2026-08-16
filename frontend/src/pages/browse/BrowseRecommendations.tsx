import { Box, CircularProgress } from "@mui/material";
import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import HeroDisplay from "../../components/HeroDisplay";
import MovieItemSlider, {
  shuffleArray,
} from "../../components/MovieItemSlider";
import { getLibrary, getLibraryDir, getLibraryMeta } from "../../plex";
import { getIncludeProps } from "../../plex/QuickFunctions";
import { motion } from "framer-motion";

interface Category {
  title: string;
  dir: string;
  props?: { [key: string]: any };
  filter?: (item: Plex.Metadata) => boolean;
  link: string;
  shuffle?: boolean;
}

function BrowseRecommendations() {
  const { libraryID } = useParams<{ libraryID: string }>();
  const [library, setLibrary] = React.useState<Plex.MediaContainer | null>(
    null
  );

  const [featuredItem, setFeaturedItem] = React.useState<Plex.Metadata | null>(
    null
  );

  const [categories, setCategories] = React.useState<Category[] | null>([]);

  useEffect(() => {
    if (!libraryID) return;
    getLibrary(libraryID).then((data) => {
      setLibrary(data);
    });
  }, [libraryID]);

  useEffect(() => {
    setFeaturedItem(null);
    setCategories([]);

    if (!library) return;
    getLibraryDir(
      `/library/sections/${library.librarySectionID.toString()}/unwatched`
    ).then(async (media) => {
      const data = media.Metadata;
      if (!data) return;
      const item = data[Math.floor(Math.random() * data.length)];

      const meta = await getLibraryMeta(item.ratingKey);
      setFeaturedItem(meta);
    });

    (async () => {
      let categoryPool: Category[] = [];

      const getGenres = new Promise<Category[]>((resolve) => {
        getLibraryDir(
          `/library/sections/${library.librarySectionID.toString()}/genre`
        ).then(async (media) => {
          const genres = media.Directory;
          if (!genres || !genres.length) return;
          const genreSelection: Plex.Directory[] = [];

          // Get 5 random genres
          while (genreSelection.length < Math.min(8, genres.length)) {
            const genre = genres[Math.floor(Math.random() * genres.length)];
            if (genreSelection.includes(genre)) continue;
            genreSelection.push(genre);
          }

          resolve(
            shuffleArray(genreSelection).map((genre) => ({
              title: genre.title,
              dir: `/library/sections/${library.librarySectionID}/genre/${genre.key}`,
              link: `/library/sections/${library.librarySectionID}/genre/${genre.key}`,
              shuffle: true,
            }))
          );
        });
      });

      const getLastViewed = new Promise<Plex.Metadata[]>((resolve) => {
        getLibraryDir(
          `/library/sections/${library.librarySectionID.toString()}/all`,
          {
            type: library.Type?.[0].type === "movie" ? "1" : "2",
            sort: "lastViewedAt:desc",
            limit: "20",
            unwatched: "0",
          }
        ).then(async (media) => {
          let data = media.Metadata;
          if (!data) return resolve([]);
          resolve(data.filter((item) => ["movie", "show"].includes(item.type)));
        });
      });

      const [genres, lastViewed] = await Promise.all([
        getGenres,
        getLastViewed,
      ]);

      if (lastViewed[0]) {
        const lastViewItem = await getLibraryMeta(lastViewed[0].ratingKey);

        if (lastViewItem?.Related?.Hub?.[0]?.Metadata?.[0]) {
          let shortenedTitle = lastViewItem.title;
          if (shortenedTitle.length > 40)
            shortenedTitle = `${shortenedTitle.slice(0, 40)}...`;

          categoryPool.push({
            title: `Because you watched ${shortenedTitle}`,
            dir: lastViewItem.Related.Hub[0].hubKey,
            link: lastViewItem.Related.Hub[0].key,
            shuffle: true,
          });
        }
      }
      // if lastviewed has more than 3 items, get some random item that isnt the first one and add a category called "More Like This"
      if (lastViewed.length > 3) {
        const randomItem =
          lastViewed[Math.floor(Math.random() * lastViewed.length)];
        const randomMeta = await getLibraryMeta(randomItem.ratingKey);

        let shortenedTitle = randomMeta.title;
        if (shortenedTitle.length > 40)
          shortenedTitle = `${shortenedTitle.slice(0, 40)}...`;

        if (randomMeta?.Related?.Hub?.[0]?.Metadata?.[0]) {
          categoryPool.push({
            title: `More Like ${shortenedTitle}`,
            dir: randomMeta.Related.Hub[0].hubKey,
            link: randomMeta.Related.Hub[0].key,
            shuffle: true,
          });
        }
      }

      if (library.Type?.[0].type === "show") {
        categoryPool.push({
          title: "Recently Added",
          dir: `/hubs/home/recentlyAdded`,
          link: ``,
          props: {
            type: "2",
            limit: "30",
            sectionID: library.librarySectionID,
            contentSectionID: library.librarySectionID,
            ...getIncludeProps(),
          },
          filter: (item) => item.type === "show",
        });
      }

      categoryPool = shuffleArray([...genres, ...categoryPool]);

      if (library.Type?.[0].type === "movie") {
        categoryPool.unshift({
          title: "Recently Added",
          dir: `/library/sections/${library.librarySectionID}/recentlyAdded`,
          link: `/library/sections/${library.librarySectionID}/recentlyAdded`,
        });
        categoryPool.unshift({
          title: "New Releases",
          dir: `/library/sections/${library.librarySectionID}/newest`,
          link: `/library/sections/${library.librarySectionID}/newest`,
        });
      }

      categoryPool.unshift({
        title: "Continue Watching",
        dir: `/library/sections/${library.librarySectionID}/onDeck`,
        link: `/library/sections/${library.librarySectionID}/onDeck`,
        shuffle: false,
      });

      setCategories(categoryPool);
    })();
  }, [library]);

  if (!featuredItem || !categories || !library)
    return (
      <Box
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
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
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      sx={{
        width: "100%",
        height: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        pb: 8,
      }}
    >
      <HeroDisplay item={featuredItem} />
      <Box
        sx={{
          zIndex: 1,
          mt: "-20vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          gap: 8,
        }}
      >
        {categories &&
          categories.map((category, index) => (
            <MovieItemSlider
              key={index}
              title={category.title}
              dir={category.dir}
              props={category.props}
              filter={category.filter}
              link={category.link}
              shuffle={category.shuffle}
            />
          ))}
      </Box>
    </Box>
  );
}

export default BrowseRecommendations;
