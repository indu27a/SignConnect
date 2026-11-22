# SignConnect – AI-Powered Accessible Social Media and Communication Platform

SignConnect is an AI-powered accessible social media and communication platform designed to connect deaf, hard-of-hearing, and hearing individuals.

The platform combines sign language recognition, social networking, and accessibility-focused communication tools to make digital interactions more inclusive.

## Project Vision

Our goal is to create a platform where people can communicate, connect, share experiences, and interact without communication barriers.

## Technologies Used

### Frontend
- React.js
- JavaScript
- HTML5
- CSS3
- Vite
- MediaPipe Tasks Vision

### Backend
- Python
- Django
- Django REST Framework
- SQLite
- JWT Authentication

### Machine Learning
- Random Forest Classifier
- Scikit-learn
- NumPy
- MediaPipe

## Implemented Features

### 1. Sign Language Translation
- Real-time hand detection using a webcam.
- Hand landmark extraction using MediaPipe.
- Machine learning-based sign prediction.
- Conversion of recognized gestures into text.
- Text-to-speech functionality.
- Current model supports A, B and C gestures.

### 2. User Authentication
- User registration.
- User login.
- JWT-based authentication.
- Protected API endpoints.

### 3. User Profile
- View and edit profile information.
- Update personal details and biography.
- Upload profile pictures.
- Select preferred communication language.

### 4. Social Feed
- Create social posts.
- Upload images with posts.
- Like and unlike posts.
- Add comments.
- Delete own comments.

### 5. Explore / Discover People
- Backend API for discovering registered users.
- Search users by username, first name, last name or biography.
- Excludes the currently logged-in user.

**Note:** Explore API frontend integration and testing are still pending.

## Project Progress

**Estimated Phase 1 completion: 40%**

| Module | Status |
|---|---|
| Project setup | Completed |
| User authentication | Implemented |
| User profiles | Implemented |
| Social feed | Implemented |
| Posts, likes and comments | Implemented |
| Explore API | Implemented; testing pending |
| Explore frontend | Pending |
| Follow / Unfollow | Pending |
| Private messaging | Pending |
| Notifications | Pending |
| AI sign-language integration in social communication | Pending |
| Accessibility enhancements | Pending |
| Final integration and testing | Pending |

Progress is an approximate development estimate and will be updated as features are implemented and tested.

## Project Structure

```text
SignConnect/
├── backend/
│   ├── accounts/
│   ├── posts/
│   ├── prediction/
│   ├── ai/
│   └── config/
│
├── frontend-temp/
│   └── src/
│       ├── components/
│       └── ...
│
├── requirements.txt
└── README.md
```

## Running the Project

### Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create and activate a virtual environment if one does not already exist.

Install dependencies:

```bash
pip install -r requirements.txt
```

Run database migrations:

```bash
python manage.py migrate
```

Start the Django server:

```bash
python manage.py runserver
```

### Frontend Setup

Open another terminal:

```bash
cd frontend-temp
```

Install dependencies:

```bash
npm install
```

Start the React development server:

```bash
npm run dev
```

Build the frontend:

```bash
npm run build
```

## Future Development

- Complete Explore / Discover People interface.
- Implement following and follower functionality.
- Develop private and real-time messaging.
- Add notifications.
- Integrate AI sign-language translation into posts and messages.
- Introduce speech-to-text and text-to-speech accessibility features.
- Improve responsive design and accessibility.
- Perform complete application testing.

## Repository

GitHub: https://github.com/indu27a/SignConnect

Development branch: `feature/phase1-social-feed`

## Author

Indushree

## License

This project is currently available for educational and development purposes.