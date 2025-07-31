import { Typography, Box } from "@mui/material";
import React from "react";
import CheckBoxOption from "../../components/settings/CheckBoxOption";
import { useUserSettings } from "../../states/UserSettingsState";

function SettingsHome() {
  const { settings, setSetting } = useUserSettings();

  return (
    <>
      <Typography variant="h4">Experience - Home</Typography>

      <Box
        sx={{
          mt: 2,
          width: "100%",
          height: "40px",
          backgroundColor: "#181818",
          borderRadius: "10px",
        }}
      />

      <Box sx={{ mt: 2, display: "flex", gap: 2, width: "50%" }}>
        <CheckBoxOption
          title="Disable Home Libraries Section"
          subtitle="Disables the section on the home screen where the libraries are displayed."
          checked={settings.DISABLE_HOME_SCREEN_LIBRARIES === "true"}
          onChange={() => {
            setSetting(
              "DISABLE_HOME_SCREEN_LIBRARIES",
              settings["DISABLE_HOME_SCREEN_LIBRARIES"] === "true"
                ? "false"
                : "true"
            );
          }}
        />
      </Box>
    </>
  );
}
export default SettingsHome;