import cv2
import csv
import os
import mediapipe as mp


# ==========================================
# SETTINGS
# ==========================================

MODEL_PATH = r"ai\models\hand_landmarker.task"
DATASET_PATH = r"ai\datasets\landmarks.csv"


# ==========================================
# MEDIAPIPE SETUP
# ==========================================

BaseOptions = mp.tasks.BaseOptions
VisionRunningMode = mp.tasks.vision.RunningMode
HandLandmarker = mp.tasks.vision.HandLandmarker
HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions


options = HandLandmarkerOptions(
    base_options=BaseOptions(
        model_asset_path=MODEL_PATH
    ),
    running_mode=VisionRunningMode.IMAGE,
    num_hands=1,
    min_hand_detection_confidence=0.5,
    min_hand_presence_confidence=0.5,
)


# ==========================================
# HAND CONNECTIONS
# ==========================================

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


# ==========================================
# GET SIGN LABEL
# ==========================================

print()
print("========================================")
print("   SIGN LANGUAGE DATASET COLLECTION")
print("========================================")
print()

label = input(
    "Enter sign label (example: A, B, C): "
).strip().upper()

if not label:
    print("ERROR: Sign label cannot be empty.")
    exit()


# ==========================================
# CREATE DATASET FOLDER
# ==========================================

os.makedirs(
    os.path.dirname(DATASET_PATH),
    exist_ok=True
)


# ==========================================
# OPEN CSV FILE
# ==========================================

file_exists = os.path.exists(DATASET_PATH)

file = open(
    DATASET_PATH,
    "a",
    newline=""
)

writer = csv.writer(file)


# Create header only for new file
if not file_exists:

    header = ["label"]

    for i in range(21):
        header.extend([
            f"x{i}",
            f"y{i}",
            f"z{i}"
        ])

    writer.writerow(header)


# ==========================================
# OPEN CAMERA
# ==========================================

print()
print(f"Preparing collection for sign: {label}")
print("Opening camera...")

cap = cv2.VideoCapture(0)

if not cap.isOpened():

    print("ERROR: Could not open camera.")

    file.close()

    exit()


print("Camera opened successfully.")
print()
print("Show your hand and make the sign.")
print("Samples will be collected automatically.")
print("Press Q to stop.")
print()


# ==========================================
# CREATE HAND LANDMARKER
# ==========================================

landmarker = HandLandmarker.create_from_options(
    options
)


sample_count = 0


# ==========================================
# CAMERA LOOP
# ==========================================

while True:

    ret, frame = cap.read()

    if not ret:

        print("ERROR: Could not read camera frame.")
        break


    # Mirror camera
    frame = cv2.flip(frame, 1)


    # Convert BGR → RGB
    rgb_frame = cv2.cvtColor(
        frame,
        cv2.COLOR_BGR2RGB
    )


    # MediaPipe image
    mp_image = mp.Image(
        image_format=mp.ImageFormat.SRGB,
        data=rgb_frame
    )


    # Detect hand
    result = landmarker.detect(mp_image)


    # ======================================
    # HAND DETECTED
    # ======================================

    if result.hand_landmarks:

        hand = result.hand_landmarks[0]

        h, w, _ = frame.shape


        # ----------------------------------
        # Convert landmarks to pixel points
        # ----------------------------------

        points = []

        for landmark in hand:

            x = int(landmark.x * w)
            y = int(landmark.y * h)

            points.append((x, y))


        # ----------------------------------
        # Draw connecting lines
        # ----------------------------------

        for start, end in HAND_CONNECTIONS:

            cv2.line(
                frame,
                points[start],
                points[end],
                (0, 255, 0),
                3
            )


        # ----------------------------------
        # Draw landmark points
        # ----------------------------------

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


        # ----------------------------------
        # Save landmark data
        # ----------------------------------

        row = [label]

        for landmark in hand:

            row.extend([
                landmark.x,
                landmark.y,
                landmark.z
            ])


        writer.writerow(row)

        file.flush()

        sample_count += 1


        # ----------------------------------
        # Display status
        # ----------------------------------

        cv2.putText(
            frame,
            "HAND DETECTED",
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 255, 0),
            2
        )

        cv2.putText(
            frame,
            f"Sign: {label}",
            (20, 80),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 255, 255),
            2
        )

        cv2.putText(
            frame,
            f"Samples: {sample_count}",
            (20, 115),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 255, 255),
            2
        )


    # ======================================
    # NO HAND
    # ======================================

    else:

        cv2.putText(
            frame,
            "NO HAND DETECTED",
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 0, 255),
            2
        )

        cv2.putText(
            frame,
            f"Sign: {label}",
            (20, 80),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 255, 255),
            2
        )

        cv2.putText(
            frame,
            f"Samples: {sample_count}",
            (20, 115),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 255, 255),
            2
        )


    # ======================================
    # QUIT INSTRUCTION
    # ======================================

    cv2.putText(
        frame,
        "Press Q to stop",
        (20, 150),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (255, 255, 255),
        2
    )


    # ======================================
    # SHOW CAMERA
    # ======================================

    cv2.imshow(
        "Sign Language Dataset Collection",
        frame
    )


    # ======================================
    # CHECK Q
    # ======================================

    key = cv2.waitKey(1) & 0xFF

    if key == ord("q"):
        break


# ==========================================
# CLEANUP
# ==========================================

cap.release()

landmarker.close()

cv2.destroyAllWindows()

file.close()


print()
print("========================================")
print("       COLLECTION COMPLETED")
print("========================================")
print(f"Sign: {label}")
print(f"Samples collected: {sample_count}")
print(f"Dataset: {DATASET_PATH}")
print("========================================")