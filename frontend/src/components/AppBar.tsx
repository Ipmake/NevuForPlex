/* eslint-disable no-lone-blocks */
import { Theme } from "@emotion/react";
import {
  AppBar,
  Avatar,
  Backdrop,
  Box,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Popper,
  SxProps,
  TextField,
  Typography,
} from "@mui/material";
import React, { JSX, useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { getAllLibraries, getSearch, getTranscodeImageURL } from "../plex";
import { useUserSessionStore } from "../states/UserSession";
import {
  BookmarkRounded,
  FavoriteRounded,
  FullscreenRounded,
  LogoutRounded,
  PeopleRounded,
  SearchRounded,
  SettingsRounded,
  ShortcutRounded,
} from "@mui/icons-material";
import { useSyncInterfaceState } from "./PerPlexedSync";
import { useSyncSessionState } from "../states/SyncSessionState";
import { config } from "..";
import { useBigReader } from "./BigReader";
import { useUserSettings } from "../states/UserSettingsState";

const BarSide: SxProps<Theme> = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
};

function Appbar() {
  const [scrollAtTop, setScrollAtTop] = useState(true);
  const location = useLocation();
  const { room } = useSyncSessionState();
  const [, setSearchParams] = useSearchParams();
  const { settings } = useUserSettings();

  const { user } = useUserSessionStore();

  useEffect(() => {
    const onScroll = () => {
      setScrollAtTop(window.scrollY === 0);
    };

    window.addEventListener("scroll", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const [libraries, setLibraries] = useState<Plex.LibarySection[] | null>(null);

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const navigate = useNavigate();

  useEffect(() => {
  getAllLibraries().then((res) => {
    const filtered = res.filter((library) => {
      const key = `LIBRARY_${library.uuid}`;
      const rawValue = settings[key];

      return rawValue === undefined || rawValue === "true";
    });

    setLibraries(filtered);
  });
}, [settings]);

  return (
    <AppBar
      sx={{
        position: "fixed",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        px: 6,
        py: 0,
        height: 64,
        transition: "all 0.5s ease-in-out",

        bgcolor: (theme) => (scrollAtTop ? "#00000000" : "#121216EE"),
        backdropFilter: scrollAtTop ? "blur(0px)" : "blur(20px)",
        boxShadow: scrollAtTop ? "none" : "0px 0px 10px 0px #000000AA",

        borderBottomLeftRadius: "10px",
        borderBottomRightRadius: "10px",
        zIndex: 99,
      }}
    >
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        sx={{}}
      >
        <Typography
          sx={{
            width: "100%",
            textAlign: "center",
            fontWeight: 600,
            px: 2,
            fontSize: 18,
          }}
        >
          {user?.friendlyName ?? user?.username}
        </Typography>

        <Divider />

        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            window.open("https://g.ipmake.dev/perplexed", "_blank");
          }}
        >
          <ListItemIcon>
            <FavoriteRounded fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sponsor</ListItemText>
        </MenuItem>

        {!config.DISABLE_NEVU_SYNC && (
          <MenuItem
            onClick={() => {
              useSyncInterfaceState.getState().setOpen(true);
              setAnchorEl(null);
            }}
          >
            <ListItemIcon>
              <PeopleRounded fontSize="small" />
            </ListItemIcon>
            <ListItemText>Watch2Gether</ListItemText>
          </MenuItem>
        )}

        <MenuItem
          onClick={() => {
            // toggle Fullscreen
            if (document.fullscreenElement) document.exitFullscreen();
            else document.documentElement.requestFullscreen();
          }}
        >
          <ListItemIcon>
            <FullscreenRounded fontSize="small" />
          </ListItemIcon>
          <ListItemText>Fullscreen</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            useBigReader.getState().setBigReader(`
--- Hint ---
You can right click on any library item at the top to view the entire library.

--- Browsing ---
CTRL + F - Search

--- Playback ---
Space / k - Play/Pause
Left Arrow / j - Back 10s
Right Arrow / l - Forward 10s
Up Arrow - Volume Up
Down Arrow - Volume Down 
S - Skip onscreen markers (intro, credits, etc)
            `);
          }}
        >
          <ListItemIcon>
            <ShortcutRounded fontSize="small" />
          </ListItemIcon>
          <ListItemText>Shortcuts</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            navigate("/settings/info");
          }}
        >
          <ListItemIcon>
            <SettingsRounded fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("accAccessToken");
            window.location.reload();
          }}
        >
          <ListItemIcon>
            <LogoutRounded fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>

      <Box
        sx={{
          justifyContent: "flex-start",
          ...BarSide,
        }}
      >
        <img
          src="/logo.png"
          alt=""
          width="100"
          style={{
            objectFit: "contain",
          }}
        />

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: 4,
            ml: 6,
            height: "100%",
          }}
        >
          <HeadLink to="/" active={location.pathname === "/"}>
            Home
          </HeadLink>
          {!libraries && <CircularProgress size="small" />}
          {libraries
            ?.filter((e) => ["movie", "show"].includes(e.type))
            .map((library) => (
              <HeadLink
                to={`/browse/${library.key}`}
                key={library.key}
                library={library}
                active={location.pathname.includes(`/browse/${library.key}`)}
              >
                {library.title}
              </HeadLink>
            ))}
        </Box>
      </Box>

      <Box
        sx={{
          justifyContent: "flex-end",
          ...BarSide,
          gap: 2,
        }}
      >
        <SearchBar />

        <IconButton
          onClick={() => {
            setSearchParams(
              new URLSearchParams({
                bkey: `/plextv/watchlist`,
              })
            );
          }}
          sx={{
            borderRadius: "10px",
            padding: 1,
            "&:hover": {
              backgroundColor: "#000000AA",
            },
          }}
        >
          <BookmarkRounded />
        </IconButton>

        {room && (
          <IconButton
            onClick={() => {
              useSyncInterfaceState.getState().setOpen(true);
            }}
            sx={{
              borderRadius: "10px",
              padding: 1,
              "&:hover": {
                backgroundColor: "#000000AA",
              },
            }}
          >
            <PeopleRounded />
          </IconButton>
        )}

        <Avatar
          src={user?.thumb}
          variant="square"
          alt=""
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            width: 45,
            height: 45,
            borderRadius: "10px",
            cursor: "pointer",

            "&:hover": {
              boxShadow: (theme) =>
                `0px 0px 20px 0px ${theme.palette.primary.main}`,
            },
            transition: "all 0.2s ease-in-out",
          }}
        />
      </Box>
    </AppBar>
  );
}

export default Appbar;

function SearchBar() {
  const [searchAnchorEl, setSearchAnchorEl] =
    React.useState<null | HTMLElement>(null);
  const searchOpen = Boolean(searchAnchorEl);
  const searchAnchorElRef = React.useRef<HTMLElement | null>(null);
  const [searchValue, setSearchValue] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<Plex.SearchResult[]>(
    []
  );
  const [searchLoading, setSearchLoading] = React.useState(false);

  const [, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);

  useEffect(() => {
    // listen to strg + f

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "f" && e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        if (searchAnchorElRef.current) {
          searchAnchorElRef.current.blur();
          setSearchAnchorEl(null);
          return;
        }

        setSearchAnchorEl(document.getElementById("search-bar"));
        document.getElementById("search-bar")?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    searchAnchorElRef.current = searchAnchorEl;
  }, [searchAnchorEl]);

  useEffect(() => {
    setSelectedIndex(null);
    if (searchValue.length === 0) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);

    const delayDebounceFn = setTimeout(() => {
      getSearch(searchValue).then((res) => {
        if (!res) {
          setSearchLoading(false);
          return setSearchResults([]);
        }
        setSearchResults(
          res
            .filter(
              (item) =>
                (item.Metadata &&
                  ["movie", "show"].includes(item.Metadata.type)) ||
                item.Directory
            )
            .sort((a, b) => {
              // directories first
              if (a.Directory && !b.Directory) return -1;
              if (!a.Directory && b.Directory) return 1;
              return 0;
            })
            .slice(0, 8)
        );

        setSearchLoading(false);
      });
    }, 500); // Adjust the delay as needed

    return () => clearTimeout(delayDebounceFn);
  }, [searchValue]);

  return (
    <>
      <Backdrop
        open={searchOpen}
        sx={{
          zIndex: 10000,
        }}
        onClick={() => {
          setSearchAnchorEl(null);
        }}
      />
      <TextField
        id="search-bar"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchRounded />
            </InputAdornment>
          ),
        }}
        placeholder="Search"
        variant="outlined"
        size="small"
        onKeyDown={(e) => {
          switch (e.key) {
            case "Escape":
              setSearchAnchorEl(null);
              searchAnchorEl?.blur();
              break;
            case "ArrowDown":
              e.preventDefault();
              if (searchResults.length === 0) return;
              setSelectedIndex((prev) =>
                prev === null ? 0 : Math.min(prev + 1, searchResults.length - 1)
              );
              break;
            case "ArrowUp":
              e.preventDefault();
              if (searchResults.length === 0) return;
              if (selectedIndex === 0) return setSelectedIndex(null);

              setSelectedIndex((prev) =>
                prev === null ? 0 : Math.max(prev - 1, 0)
              );
              break;
            case "Tab":
              e.preventDefault();
              if (searchResults.length === 0) return;
              // if it gets to the last item, then set to null
              if (selectedIndex === searchResults.length - 1)
                return setSelectedIndex(null);
              setSelectedIndex((prev) =>
                prev === null ? 0 : Math.min(prev + 1, searchResults.length - 1)
              );
              break;
            case "Enter":
              if (searchValue.length === 0) return;

              if (selectedIndex !== null && searchResults.length > 0) {
                if (searchResults[selectedIndex].Metadata?.ratingKey) {
                  setSearchParams(
                    new URLSearchParams({
                      mid:
                        searchResults[selectedIndex].Metadata?.ratingKey || "",
                    })
                  );
                } else if (searchResults[selectedIndex].Directory) {
                  setSearchParams(
                    new URLSearchParams({
                      bkey: `/library/sections/${searchResults[selectedIndex].Directory?.librarySectionID}/genre/${searchResults[selectedIndex].Directory?.id}`,
                    })
                  );
                }
              } else {
                navigate(`/search/${encodeURIComponent(searchValue.trim())}`);
              }

              searchAnchorEl?.blur();
              setSearchAnchorEl(null);
              break;
          }
        }}
        onChange={(e) => {
          setSearchValue(e.target.value);
          //navigate(`/search/${encodeURIComponent(e.target.value.trim())}`);
        }}
        onFocus={(e) => {
          setSearchAnchorEl(e.currentTarget);
        }}
        sx={{
          backgroundColor: "#121212AA",
          borderRadius: "7px",

          // round the corners of the input
          "& .MuiOutlinedInput-root": {
            borderRadius: "7px",
          },
          transition: "all 0.2s ease-in-out",
          zIndex: 11000,
        }}
        style={{
          ...(searchOpen
            ? { width: "20vw", zIndex: 10000 }
            : { width: "300px" }),
        }}
      />
      <Popper
        anchorEl={searchAnchorEl}
        open={searchOpen && searchValue.length > 0}
        placement="bottom-end"
        sx={{
          borderRadius: "7px",
          backgroundColor: "#121212AA",
          backdropFilter: "blur(10px)",
          transition: "width 0.2s ease-in-out",
          padding: "20px 10px",
          pt: "10px",

          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
        style={{
          ...(searchOpen
            ? { width: "20vw", zIndex: 11000 }
            : { width: "300px" }),
        }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        {searchLoading && (
          <Box
            sx={{ display: "flex", justifyContent: "center", width: "100%" }}
          >
            <CircularProgress />
          </Box>
        )}

        {!searchLoading && searchResults.length === 0 && (
          <Typography>No Results</Typography>
        )}

        {!searchLoading &&
          searchResults.length > 0 &&
          searchResults.map((item, index) => {
            if (item.Metadata) {
              return (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "flex-start",
                    width: "100%",
                    borderRadius: "5px",
                    backgroundColor: (theme) => theme.palette.background.paper,
                    padding: "7px 10px",

                    "&:hover": {
                      backgroundColor: (theme) => theme.palette.primary.dark,
                      transition: "all 0.2s ease-in-out",
                    },

                    ...(selectedIndex === index && {
                      backgroundColor: (theme) => theme.palette.primary.dark,
                    }),

                    transition: "all 0.4s ease-in-out",

                    userSelect: "none",
                    cursor: "pointer",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    searchAnchorEl?.blur();
                    setSearchAnchorEl(null);
                    if (item.Metadata?.ratingKey) {
                      setSearchParams({
                        mid: item.Metadata.ratingKey,
                      });
                    }
                  }}
                >
                  <img
                    src={`${getTranscodeImageURL(
                      item.Metadata.thumb,
                      100,
                      100
                    )}`}
                    alt=""
                    style={{
                      aspectRatio: 1,
                      objectFit: "cover",
                      borderRadius: "5px",
                      width: 50,
                      height: 50,
                    }}
                  />

                  <Box sx={{ ml: 2, display: "flex", flexDirection: "column" }}>
                    <Typography>{item.Metadata.title}</Typography>

                    <Typography
                      sx={{
                        fontSize: 12,
                        color: "#777",
                      }}
                    >
                      {item.Metadata.librarySectionTitle}
                    </Typography>
                  </Box>
                </Box>
              );
            } else if (item.Directory) {
              return (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "flex-start",
                    width: "100%",
                    borderRadius: "5px",
                    backgroundColor: (theme) => theme.palette.background.paper,
                    padding: "7px 10px",

                    "&:hover": {
                      backgroundColor: (theme) => theme.palette.primary.dark,
                      transition: "all 0.2s ease-in-out",
                    },

                    ...(selectedIndex === index && {
                      backgroundColor: (theme) => theme.palette.primary.dark,
                    }),

                    transition: "all 0.4s ease-in-out",

                    userSelect: "none",
                    cursor: "pointer",
                  }}
                  onClick={(e) => {
                    console.log("test");
                    e.stopPropagation();
                    e.preventDefault();
                    setSearchParams(
                      new URLSearchParams({
                        bkey: `/library/sections/${item.Directory?.librarySectionID}/genre/${item.Directory?.id}`,
                      })
                    );
                    searchAnchorEl?.blur();
                    setSearchAnchorEl(null);
                  }}
                >
                  <Typography>
                    {item.Directory.librarySectionTitle} - {item.Directory.tag}
                  </Typography>
                </Box>
              );
            }
            return null;
          })}
      </Popper>
    </>
  );
}

function HeadLink({
  to,
  library,
  children,
  active,
}: {
  to: string;
  library?: Plex.LibarySection;
  children: React.ReactNode;
  active?: boolean;
}): JSX.Element {
  const [, setSearchParams] = useSearchParams();
  return (
    <Link
      className={`head-link${active ? " head-link-active" : ""}`}
      to={to}
      style={{
        textDecoration: "none",
        color: "inherit",
        fontWeight: 500,
        transition: "all 0.2s ease-in-out",
        fontFamily: '"Inter Variable", sans-serif',
        userSelect: "none",
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        if (library)
          setSearchParams(
            new URLSearchParams({
              bkey: `/library/sections/${library.key}/all`,
            })
          );
      }}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}
