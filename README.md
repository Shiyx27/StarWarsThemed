# <h1 align="center">🌟 Star Wars Sith Photobooth </h1>

![Star Wars Photobooth Banner](https://img.shields.io/badge/Star%20Wars-Photobooth-red?style=for-the-badge&logo=starwars)
![Full Stack Track](https://img.shields.io/badge/Track-FullStack-blue?style=for-the-badge) 

<a href="https://starwarsthemed.pythonanywhere.com/" target="_blank">Try it out</a>

## 🎯 What is this project?

**Star Wars Sith Photobooth** is an immersive web application that transforms users into iconic Star Wars characters using real-time AI-powered face detection and mask overlays. Built with cutting-edge web technologies, it provides an authentic Star Wars experience with professional-grade photo capture capabilities.

### ✨ Key Features
- 🤖 **Real-time AI face detection** using MediaPipe
- 🎭 **Dynamic mask overlays** with 6+ Star Wars character masks
- 🧠 **AI-enhanced photo processing** via Google Gemini API
- 🎵 **Immersive audio experience** with authentic Star Wars soundtracks
- 📱 **Progressive Web App (PWA)** for mobile installation
- 🌐 **Cross-platform compatibility** (Web & Mobile)
- 📸 **Professional photo gallery** with download capabilities

## 🚀 Tech Stack

### **Frontend Technologies**
- HTML5/CSS3 - Responsive UI with Star Wars theming
- JavaScript (ES6+) - Real-time canvas manipulation
- WebRTC API - Camera access and video streaming
- Canvas API - Real-time mask overlay rendering
- Web Audio API - Immersive sound effects
- MediaPipe - AI-powered face detection
- PWA Technologies - Service workers, manifest

  
### **Backend Technologies**
- Python 3.12 - Server-side application logic
- Flask - Lightweight web framework
- RESTful APIs - Clean API architecture
- Gunicorn - Production WSGI server
- File Upload System - Image storage and management
- Session Management - User state handling
- Error Handling - Comprehensive error management
- Logging System - Application monitoring



## 🎯 Chosen Track: **Full Stack Development**

This project demonstrates comprehensive full-stack development skills across multiple layers:

### **Frontend Development**
1. **🎨 Advanced UI/UX Design** - Custom Star Wars themed interface with responsive design
2. **⚡ Real-time Interactions** - Live camera feed with instant mask overlay rendering
3. **📱 Progressive Web App** - Mobile-first design with PWA capabilities
4. **🎵 Multimedia Integration** - Audio management and visual effects
5. **♿ Accessibility** - WCAG 2.1 compliant interface design

### **Backend Development**
1. **🔧 RESTful API Design** - Clean, scalable API architecture
2. **📁 File Management System** - Image upload, processing, and storage
3. **🔐 Security Implementation** - Input validation and secure file handling
4. **⚙️ Configuration Management** - Environment-based configuration
5. **📊 Error Handling & Logging** - Comprehensive monitoring system

### **Full Stack Integration**
1. **🔄 Real-time Communication** - Frontend-backend data synchronization
2. **📸 End-to-end Photo Pipeline** - From capture to storage to download
3. **🎭 Dynamic Content Management** - Mask and theme management system
4. **🌐 Cross-platform Deployment** - Web and mobile compatibility
5. **⚡ Performance Optimization** - Full-stack performance tuning

## 🎭 Problem We're Solving

### **The Challenge**
Traditional photo booth solutions have significant limitations:
- 💰 **High Infrastructure Costs** - Expensive hardware and maintenance
- 🔒 **Limited Scalability** - Physical constraints and location dependencies
- 📱 **Poor Mobile Experience** - Desktop-only solutions
- 🎨 **Lack of Customization** - Fixed templates and limited themes
- ⏱️ **No Real-time Preview** - Users can't see effects before capture

### **Our Full Stack Solution**
We've built a **complete web-based photobooth platform** that:
- ✅ **Zero Hardware Requirements** - Runs entirely in web browsers
- 🌐 **Global Accessibility** - Available anywhere with internet access
- 📱 **Mobile-first Design** - Optimized for all device types
- 🎨 **Infinite Customization** - Easily extensible theme system
- ⚡ **Real-time Experience** - Instant preview and capture
- 🔧 **Easy Deployment** - Simple setup and maintenance



## 🏆 Bounties/Challenges Completed

### **✅ ⚔ Challenge 1: Choose Your Colour Theme ⚔ -  embraced the power of the Sith 🔴 (dark theme)**
### **✅ 🛸 Challenge 2: Include a Star Wars Easter Egg 🛸 - included a lotttt**
### **✅ 🌀 Challenge 4: Bring Your World into 3D 🌀**

## 🚀 Deployment

This project is ready for deployment on Vercel and can be pushed to GitHub.

### GitHub
To push this project to your GitHub repository, follow these steps:

1.  **Initialize Git (if you haven't already):**
    ```bash
    git init
    git add .
    git commit -m "Initial commit: Star Wars Photobooth"
    ```

2.  **Create a new repository on GitHub.**

3.  **Link your local repository to the remote one and push:**
    ```bash
    git remote add origin <YOUR_GITHUB_REPO_URL>
    git branch -M main
    git push -u origin main
    ```

### Vercel
This project includes a `vercel.json` file, which allows for seamless deployment.

1.  **Sign up for a Vercel account and install the Vercel CLI:**
    ```bash
    npm install -g vercel
    ```

2.  **Login to your Vercel account:**
    ```bash
    vercel login
    ```

3.  **Deploy the application from your project's root directory:**
    ```bash
    vercel --prod
    ```

Vercel will automatically detect the Python (Flask) backend and the static frontend, build the project, and deploy it.

### **📱 Try it Now!**


*Note: For the best experience, use a modern browser with camera support.*

## FaceLandmarker model (landmarks) troubleshooting

If the browser console shows a 404 when trying to load the MediaPipe FaceLandmarker model, landmark-based detection (fine-grained eye/nose landmarks) will be unavailable and the app will fall back to bounding-box heuristics.

To enable landmark-based placement you can host the model locally and point the loader at it:

1. Create a folder `static/models` in the project root.
2. Download the FaceLandmarker task file (for the correct MediaPipe Tasks release) and save it as `static/models/face_landmarker.task`.
3. Update the model path in `static/js/faceDetection.js` by replacing the `modelAssetPath` with `/static/models/face_landmarker.task` or update the `candidateUrls` array.

Note: the exact model file URL depends on MediaPipe Tasks releases; if you have trouble locating the right `.task` file, check the MediaPipe Tasks release notes or use a public CDN and update `static/js/faceDetection.js` accordingly.



