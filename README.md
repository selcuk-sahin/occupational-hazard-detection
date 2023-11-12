# Occupational Hazard Detection

This project aims to detect occupational hazards with common household objects. Example scenarios:
- a glass close to a computer: spill hazard
- a knife inside the living room: dangerous object
- a knife inside the kitchen: no errors

This is our ITU graduation project for the year 2023.

The client app is built Ionic & Capacitor. It can be run as a website or application.
Object detection logic is done in the back-end by analyzing pictures from the client app. Source code contains client-app & firebase-functions to deploy.

## Tech Stack
- Ionic, Angular, TypeScript, Capacitor for mobile App
- Node.js, Firebase, Python for back-end cloud functions
- Python, YOLOV8 for the object detection engine

## Running Locally

1. Install Node.js (LTS version recommended)
2. Clone the project.
3. Run `npm install && npm run start` to launch localhost
4. Create a firebase project (blaze program is required)
5. Run firebase deploy to deploy the functions to your firebase project
6. Connect your back-end by using correct google-services.json file
