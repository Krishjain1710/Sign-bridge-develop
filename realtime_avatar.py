import cv2
import mediapipe as mp
import numpy as np

# Initialize MediaPipe Holistic
mp_holistic = mp.solutions.holistic
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

def init_mediapipe():
    """Initializes and returns the Holistic model."""
    return mp_holistic.Holistic(
        static_image_mode=False,
        model_complexity=1,
        smooth_landmarks=True,
        enable_segmentation=False,
        refine_face_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )

def get_pixel_coords(landmark, img_w, img_h):
    """Converts normalized landmarks to pixel coordinates."""
    return int(landmark.x * img_w), int(landmark.y * img_h)

def draw_face(image, face_landmarks):
    """Draws cleaner facial contours and highlights key features."""
    if not face_landmarks:
        return
    
    # 1. Face Oval (White)
    mp_drawing.draw_landmarks(
        image=image,
        landmark_list=face_landmarks,
        connections=mp_holistic.FACEMESH_CONTOURS,
        landmark_drawing_spec=None,
        connection_drawing_spec=mp_drawing.DrawingSpec(color=(224, 224, 224), thickness=1, circle_radius=1)
    )
    
    # 2. Eyes and Eyebrows (Blue/Cyan for clarity)
    mp_drawing.draw_landmarks(
        image=image,
        landmark_list=face_landmarks,
        connections=mp_holistic.FACEMESH_IRISES,
        landmark_drawing_spec=None,
        connection_drawing_spec=mp_drawing.DrawingSpec(color=(255, 255, 255), thickness=1, circle_radius=1)
    )
    
    # 3. Highlight Lips Region (Thicker Yellow for visibility)
    mp_drawing.draw_landmarks(
        image=image,
        landmark_list=face_landmarks,
        connections=mp_holistic.FACEMESH_LIPS,
        landmark_drawing_spec=None,
        connection_drawing_spec=mp_drawing.DrawingSpec(color=(0, 255, 255), thickness=2, circle_radius=1)
    )

def draw_pose(image, pose_landmarks):
    """Draws pose skeleton with side-specific colors."""
    if not pose_landmarks:
        return
    
    img_h, img_w, _ = image.shape
    landmarks = pose_landmarks.landmark

    # Connections mapping (simplified for clean limb connections)
    connections = mp_holistic.POSE_CONNECTIONS
    
    for connection in connections:
        start_idx = connection[0]
        end_idx = connection[1]
        
        start_lm = landmarks[start_idx]
        end_lm = landmarks[end_idx]
        
        if start_lm.visibility > 0.5 and end_lm.visibility > 0.5:
            p1 = get_pixel_coords(start_lm, img_w, img_h)
            p2 = get_pixel_coords(end_lm, img_w, img_h)
            
            # Left side (Red), Right side (Blue)
            # MediaPipe indices: Odd are usually Left, Even are Right for major limbs
            # But better to use specific ranges or checking start_idx
            # General rule: x > 0.5 is left (mirrored), but let's use standard side detection
            color = (0, 0, 255) if start_idx % 2 == 1 else (255, 0, 0)
            
            cv2.line(image, p1, p2, color, 2, cv2.LINE_AA)
            cv2.circle(image, p1, 3, color, -1)
            cv2.circle(image, p2, 3, color, -1)

def draw_hands(image, hand_landmarks, is_left=True):
    """Draws hand skeletons with finger joint highlights."""
    if not hand_landmarks:
        return
    
    img_h, img_w, _ = image.shape
    color = (0, 255, 255) if is_left else (0, 255, 0) # Yellow for Left, Green for Right
    
    # Draw connections
    mp_drawing.draw_landmarks(
        image=image,
        landmark_list=hand_landmarks,
        connections=mp_holistic.HAND_CONNECTIONS,
        landmark_drawing_spec=mp_drawing.DrawingSpec(color=color, thickness=2, circle_radius=2),
        connection_drawing_spec=mp_drawing.DrawingSpec(color=color, thickness=2, circle_radius=1)
    )
    
    # Highlight Fingertips (Indices: 4, 8, 12, 16, 20)
    fingertip_indices = [4, 8, 12, 16, 20]
    for idx in fingertip_indices:
        lm = hand_landmarks.landmark[idx]
        p = get_pixel_coords(lm, img_w, img_h)
        cv2.circle(image, p, 5, (255, 255, 255), -1) # White highlight for tips
        cv2.circle(image, p, 6, color, 1)

def main():
    cap = cv2.VideoCapture(0)
    holistic = init_mediapipe()
    
    print("Starting Real-time Avatar Pipeline...")
    print("Press 'q' to exit.")

    while cap.isOpened():
        success, frame = cap.read()
        if not success:
            print("Ignoring empty camera frame.")
            continue

        # Flip horizontally for mirror view
        frame = cv2.flip(frame, 1)
        
        # Convert BGR to RGB
        image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        image_rgb.flags.writeable = False
        
        # Process frame
        results = holistic.process(image_rgb)
        
        # Prepare drawing canvas (Black background or overlay on frame)
        # Requirement says "Capture webcam input" and "Draw", usually implies on top of feed
        image_rgb.flags.writeable = True
        canvas = frame.copy() 
        
        # 1. Draw Face
        draw_face(canvas, results.face_landmarks)
        
        # 2. Draw Pose
        draw_pose(canvas, results.pose_landmarks)
        
        # 3. Draw Hands
        draw_hands(canvas, results.left_hand_landmarks, is_left=True)
        draw_hands(canvas, results.right_hand_landmarks, is_left=False)

        # Performance Metric: Add FPS to screen
        cv2.putText(canvas, "Sign-Bridge Avatar", (10, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2, cv2.LINE_AA)

        # Show Output
        cv2.imshow('Sign Language Avatar Pipeline', canvas)

        if cv2.waitKey(5) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    holistic.close()

if __name__ == "__main__":
    main()
