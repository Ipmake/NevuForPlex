import { MenuItem, Select } from "@mui/material";
import React, { SetStateAction } from "react";

export type LibrarySort =
  | "title:asc"
  | "title:desc"
  | "addedAt:asc"
  | "addedAt:desc"
  | "year:asc"
  | "year:desc"
  | "updated:asc"
  | "updated:desc"
  | "random:desc";

function LibrarySortDropDown({
  sortHook,
}: {
  sortHook: [string, React.Dispatch<SetStateAction<LibrarySort>>];
}) {
  const [option, setOption] = sortHook;

  return (
    <Select
      value={option}
      onChange={(e) => {
        setOption(e.target.value as LibrarySort);
        localStorage.setItem("sortBy", e.target.value);
      }}
    >
      <MenuItem value={"title:asc"}>Title (A-Z)</MenuItem>
      <MenuItem value={"title:desc"}>Title (Z-A)</MenuItem>
      <MenuItem value={"addedAt:asc"}>Date Added (Oldest)</MenuItem>
      <MenuItem value={"addedAt:desc"}>Date Added (Newest)</MenuItem>
      <MenuItem value={"year:asc"}>Year (Oldest)</MenuItem>
      <MenuItem value={"year:desc"}>Year (Newest)</MenuItem>
      <MenuItem value={"updated:asc"}>Date Updated (Oldest)</MenuItem>
      <MenuItem value={"updated:desc"}>Date Updated (Newest)</MenuItem>
      <MenuItem value={"random:desc"}>Random</MenuItem>
    </Select>
  );
}

export function sortMetadata(items: Plex.Metadata[], sort: LibrarySort) {
  switch (sort) {
    case "title:asc":
      return items.sort((a, b) => a.title.localeCompare(b.title));
    case "title:desc":
      return items.sort((a, b) => b.title.localeCompare(a.title));
    case "addedAt:asc":
      return items.sort((a, b) =>
        a.addedAt.toString().localeCompare(b.addedAt.toString())
      );
    case "addedAt:desc":
      return items.sort((a, b) =>
        b.addedAt.toString().localeCompare(a.addedAt.toString())
      );
    case "year:asc":
      return items.sort((a, b) => a.year - b.year);
    case "year:desc":
      return items.sort((a, b) => b.year - a.year);
    case "updated:asc":
      return items.sort((a, b) =>
        a.updatedAt.toString().localeCompare(b.updatedAt.toString())
      );
    case "updated:desc":
      return items.sort((a, b) =>
        b.updatedAt.toString().localeCompare(a.updatedAt.toString())
      );
    case "random:desc":
      return items.sort(() => Math.random() - 0.5);
    default:
      return items;
  }
}

export default LibrarySortDropDown;
