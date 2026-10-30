import cv2
import mediapipe as mp
import joblib
import numpy as np
from collections import deque
import time

# Paths
MODEL_PATH = r"ai\models\sign_language_model.pkl"
LANDMARK_MODEL_PATH = r"ai\models\hand_landmarker.task"

# Load trained ML model
model = joblib.load(MODEL_PATH)

# MediaPipe setup
BaseOptions = mp.tasks.BaseOptions
VisionRunningMode = mp.tasks.vision.RunningMode
HandLandmarker = mp.tasks.vision.HandLandmarker

options = mp.tasks.vision.HandLandmarkerOptions(
    base_options=BaseOptions(model_asset_path=LANDMARK_MODEL_PATH),
    running_mode=VisionRunningMode.IMAGE,
    num_hands=1,
    min_hand_detection_confidence=0.5,
    min_hand_presence_confidence=0.5,
)

landmarker = HandLandmarker.create_from_options(options)

# Hand connections
HAND_CONNECTIONS = [
    (0, 1), (1, 2), (2, 3), (3, 4),
    (0, 5), (5, 6), (6, 7), (7, 8),
    (5, 9), (9, 10), (10, 11), (11, 12),
    (9, 13), (13, 14), (14, 15), (15, 16),
    (13, 17), (17, 18), (18, 19), (19, 20),
    (0, 17),
]

# Prediction stabilization
prediction_history = deque(maxlen=10)
stable_prediction = None

# Translation text
translated_text = ""

# Prevent repeated letters
last_added_prediction = None

# Start camera
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("ERROR: Could not open camera.")
    exit()

print("Live prediction started.")
print("Show A, B, or C to the camera.")
print("Change your gesture to enter another letter.")
print("Press C to clear the text.")
print("Press Q to quit.")

while True:

    ret, frame = cap.read()

    if not ret:
        print("ERROR: Could not read frame.")
        break

    # Mirror camera
    frame = cv2.flip(frame, 1)

    # Convert BGR to RGB
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # Create MediaPipe image
    mp_image = mp.Image(
        image_format=mp.ImageFormat.SRGB,
        data=rgb_frame
    )

    # Detect hand
    result = landmarker.detect(mp_image)

    if result.hand_landmarks:

        hand = result.hand_landmarks[0]

        # Get 63 landmark values
        features = []

        for landmark in hand:
            features.extend([
                landmark.x,
                landmark.y,
                landmark.z
            ])

        features = np.array(features).reshape(1, -1)

        # Predict sign
        prediction = model.predict(features)[0]

        # Add prediction to history
        prediction_history.append(prediction)

        # Check for stable prediction
        if len(prediction_history) == 10:

            if len(set(prediction_history)) == 1:

                stable_prediction = prediction

                # Add letter only once
                if stable_prediction != last_added_prediction:

                    translated_text += stable_prediction
                    last_added_prediction = stable_prediction

        # Prediction confidence
        probabilities = model.predict_proba(features)[0]
        confidence = np.max(probabilities) * 100

        # Draw landmarks
        points = []

        for landmark in hand:

            x = int(landmark.x * frame.shape[1])
            y = int(landmark.y * frame.shape[0])

            points.append((x, y))

        # Draw green connections
        for start, end in HAND_CONNECTIONS:

            cv2.line(
                frame,
                points[start],
                points[end],
                (0, 255, 0),
                3
            )

        # Draw red landmarks
        for x, y in points:

            cv2.circle(
                frame,
                (x, y),
                8,
                (255, 255, 255),
                -1
            )

            cv2.circle(
                frame,
                (x, y),
                5,
                (0, 0, 255),
                -1
            )

        # Display prediction
        if stable_prediction:

            cv2.putText(
                frame,
                f"Sign: {stable_prediction}",
                (30, 50),
                cv2.FONT_HERSHEY_SIMPLEX,
                1.2,
                (0, 255, 0),
                3
            )

        else:

            cv2.putText(
                frame,
                "Stabilizing...",
                (30, 50),
                cv2.FONT_HERSHEY_SIMPLEX,
                1.0,
                (0, 255, 255),
                2
            )

        # Display confidence
        cv2.putText(
            frame,
            f"Confidence: {confidence:.1f}%",
            (30, 90),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 255, 255),
            2
        )

    else:

        # No hand
        prediction_history.clear()
        stable_prediction = None

        # IMPORTANT:
        # Reset the last letter so the same sign
        # can be entered again after removing the hand.
        last_added_prediction = None

        cv2.putText(
            frame,
            "No hand detected",
            (30, 50),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 0, 255),
            2
        )

    # Display translated text
    cv2.rectangle(
        frame,
        (20, frame.shape[0] - 80),
        (frame.shape[1] - 20, frame.shape[0] - 20),
        (0, 0, 0),
        -1
    )

    cv2.putText(
        frame,
        f"Text: {translated_text}",
        (35, frame.shape[0] - 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (255, 255, 255),
        2
    )

    # Show camera
    cv2.imshow(
        "AI Sign Language Translator",
        frame
    )

    key = cv2.waitKey(1) & 0xFF

    # Press C to clear text
    if key == ord("c"):
        translated_text = ""
        last_added_prediction = None
        stable_prediction = None
        prediction_history.clear()

    # Press Q to quit
    if key == ord("q"):
        break

# Release resources
cap.release()
landmarker.close()
cv2.destroyAllWindows()

print("Live prediction completed.")
print(f"Final translated text: {translated_text}")