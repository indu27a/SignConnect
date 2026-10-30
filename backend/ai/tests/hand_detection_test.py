import cv2
import mediapipe as mp

MODEL_PATH = r"ai\models\hand_landmarker.task"

BaseOptions = mp.tasks.BaseOptions
VisionRunningMode = mp.tasks.vision.RunningMode
HandLandmarker = mp.tasks.vision.HandLandmarker
HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions


# -----------------------------
# MediaPipe Hand Landmarker
# -----------------------------

options = HandLandmarkerOptions(
    base_options=BaseOptions(
        model_asset_path=MODEL_PATH
    ),
    running_mode=VisionRunningMode.IMAGE,
    num_hands=1,
    min_hand_detection_confidence=0.5,
    min_hand_presence_confidence=0.5,
)

print("Creating hand detector...")

landmarker = HandLandmarker.create_from_options(options)

print("Opening camera...")

cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("ERROR: Could not open camera.")
    landmarker.close()
    exit()

print("Camera opened successfully.")
print("Show your hand.")
print("Press Q to quit.")


# -----------------------------
# Hand landmark connections
# -----------------------------

HAND_CONNECTIONS = [

    # Thumb
    (0, 1),
    (1, 2),
    (2, 3),
    (3, 4),

    # Index finger
    (0, 5),
    (5, 6),
    (6, 7),
    (7, 8),

    # Middle finger
    (5, 9),
    (9, 10),
    (10, 11),
    (11, 12),

    # Ring finger
    (9, 13),
    (13, 14),
    (14, 15),
    (15, 16),

    # Pinky
    (13, 17),
    (17, 18),
    (18, 19),
    (19, 20),

    # Palm
    (0, 17),
]


# -----------------------------
# Camera loop
# -----------------------------

while True:

    ret, frame = cap.read()

    if not ret:
        print("ERROR: Could not read camera frame.")
        break

    # Mirror the camera
    frame = cv2.flip(frame, 1)

    # Convert BGR → RGB
    rgb_frame = cv2.cvtColor(
        frame,
        cv2.COLOR_BGR2RGB
    )

    # Create MediaPipe image
    mp_image = mp.Image(
        image_format=mp.ImageFormat.SRGB,
        data=rgb_frame
    )

    # Detect hand
    result = landmarker.detect(mp_image)


    # -----------------------------
    # If hand detected
    # -----------------------------

    if result.hand_landmarks:

        hand = result.hand_landmarks[0]

        h, w, _ = frame.shape

        # Store pixel coordinates
        points = []

        for landmark in hand:

            x = int(landmark.x * w)
            y = int(landmark.y * h)

            points.append((x, y))


        # -----------------------------
        # Draw connecting lines
        # -----------------------------

        for start, end in HAND_CONNECTIONS:

            cv2.line(
                frame,
                points[start],
                points[end],
                (0, 255, 0),
                3
            )


        # -----------------------------
        # Draw landmark points
        # -----------------------------

        for x, y in points:

            # White outer circle
            cv2.circle(
                frame,
                (x, y),
                8,
                (255, 255, 255),
                -1
            )

            # Red inner circle
            cv2.circle(
                frame,
                (x, y),
                5,
                (0, 0, 255),
                -1
            )


        # -----------------------------
        # Detection text
        # -----------------------------

        cv2.putText(
            frame,
            "HAND DETECTED",
            (20, 45),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 255, 0),
            2
        )

        cv2.putText(
            frame,
            "Landmarks: 21",
            (20, 80),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 255),
            2
        )

    else:

        cv2.putText(
            frame,
            "NO HAND",
            (20, 45),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 0, 255),
            2
        )


    # -----------------------------
    # Quit instruction
    # -----------------------------

    cv2.putText(
        frame,
        "Press Q to quit",
        (20, 115),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (255, 255, 255),
        2
    )


    # Show camera
    cv2.imshow(
        "AI Sign Language Translator - Hand Test",
        frame
    )


    # Press Q
    key = cv2.waitKey(1) & 0xFF

    if key == ord("q"):
        break


# -----------------------------
# Cleanup
# -----------------------------

cap.release()
landmarker.close()
cv2.destroyAllWindows()

print("Hand detection test completed.")