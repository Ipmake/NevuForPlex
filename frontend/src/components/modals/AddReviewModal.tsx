import React, { use, useEffect, useState } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Rating,
  Stack,
  Divider,
  CircularProgress,
  Select,
  MenuItem,
} from "@mui/material";
import { Star, StarBorder } from "@mui/icons-material";
import { setMediaRating } from "../../plex";
import {
  deleteNevuReview,
  getNevuReviews,
  updateNevuReview,
} from "../../common/NevuReviews";
import { useUserSessionStore } from "../../states/UserSession";

function AddReviewModal({
  item,
  onClose,
}: {
  item: Plex.Metadata;
  onClose: () => void;
}) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [existingReview, setExistingReview] =
    useState<PerPlexed.Reviews.Review | null>(null);
  const [rating, setRating] = useState<number>((item.userRating || 0) / 2); // Convert to 0-5 scale
  const [reviewText, setReviewText] = useState<string>("");
  const [isSpoiler, setIsSpoiler] = useState<boolean>(false);
  const [visibility, setVisibility] = useState<string>("GLOBAL");

  const handleSave = async () => {
    setIsLoading(true);
    // TODO: Implement save logic here
    console.log({
      rating,
      reviewText,
      isSpoiler,
      item: item.ratingKey,
    });

    await setMediaRating(rating * 2, item.ratingKey);

    const res = await updateNevuReview(
      item.guid,
      rating * 2,
      reviewText || "No text provided",
      existingReview
        ? existingReview.visibility
        : (visibility as "GLOBAL" | "LOCAL"),
      isSpoiler
    );

    if (!res || res.error) {
      setLoadError(res?.error || "Failed to save review");
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    onClose();
  };

  useEffect(() => {
    async function fetchReview() {
      if (!item.ratingKey) return;
      setIsLoading(true);
      try {
        const reviews = await getNevuReviews(
          item.guid,
          useUserSessionStore.getState().user?.uuid
        );

        const review = reviews[0];

        setExistingReview(review || null);
        setRating((review?.rating ?? 0) / 2);
        setReviewText(review?.message || "");
        setIsSpoiler(review?.spoilers || false);
        setVisibility(review?.visibility || "GLOBAL");
      } catch (error) {
        console.error("Error fetching review:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchReview();
  }, [item]);

  if (loadError) {
    return (
      <Modal open={true} onClose={onClose}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
          }}
          onClick={onClose}
        >
          <Box
            sx={{
              width: "500px",
              padding: 2,
              backgroundColor: "black",
            }}
          >
            <Typography>{loadError}</Typography>
          </Box>
        </Box>
      </Modal>
    );
  }

  if (isLoading) {
    return (
      <Modal open={true} onClose={onClose}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
          }}
          onClick={onClose}
        >
          <CircularProgress />
        </Box>
      </Modal>
    );
  }

  return (
    <Modal
      open={true}
      onClose={onClose}
      aria-labelledby="add-review-modal-title"
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "90%", sm: 500 },
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
        }}
      >
        <Typography
          id="add-review-modal-title"
          variant="h6"
          component="h2"
          gutterBottom
        >
          Add Review
        </Typography>

        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {item.title}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={3}>
          <Box>
            <Typography component="legend" gutterBottom>
              Rating
            </Typography>
            <Rating
              name="simple-controlled"
              value={rating}
              precision={0.5}
              size="large"
              onChange={(event, newValue) => {
                setRating(newValue || 0);
              }}
              icon={<Star fontSize="inherit" />}
              emptyIcon={<StarBorder fontSize="inherit" />}
            />
          </Box>

          <TextField
            label="Review (Optional)"
            multiline
            rows={4}
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your thoughts about this item..."
            variant="outlined"
            fullWidth
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={isSpoiler}
                onChange={(e) => setIsSpoiler(e.target.checked)}
              />
            }
            label="Contains spoilers"
          />

          <Divider sx={{ my: 0 }} />

          {!existingReview && (
            <>
              <Typography variant="subtitle1">
                Who can see this review?
              </Typography>
              <Select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                fullWidth
                displayEmpty
                inputProps={{ "aria-label": "Visibility" }}
              >
                <MenuItem value="GLOBAL">Nevu Community</MenuItem>
                <MenuItem value="LOCAL">This Nevu Server</MenuItem>
              </Select>
            </>
          )}

          <Stack
            direction="row"
            justifyContent={existingReview ? "space-between" : "flex-end"}
          >
            {existingReview && (
              <Button
                variant="outlined"
                onClick={async () => {
                  setIsLoading(true);
                  await deleteNevuReview(
                    existingReview.itemID,
                    existingReview.visibility
                  );
                  await setMediaRating(-1, item.ratingKey);
                  setIsLoading(false);
                  onClose();
                }}
                color="error"
              >
                Delete
              </Button>
            )}

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="contained" onClick={handleSave}>
                Save Review
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Box>
    </Modal>
  );
}

export default AddReviewModal;
