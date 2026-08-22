<div align="center">

# 🌿 WasteWise AI
### Intelligent 3-Tier Waste Classification & Circular Economy Engine

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-000000.svg?logo=express&logoColor=white)](https://expressjs.com/)
[![Google Gemini API](https://img.shields.io/badge/AI-Gemini_Flash_Vision-4285F4.svg?logo=google&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

*Automated material segregation, hazardous waste safety alerts, and real-time environmental impact analysis.*

</div>

---

## 📖 Table of Contents
- [Problem Statement](#-problem-statement)
- [System & Software Requirements](#-system--software-requirements)
- [Key Features](#-key-features)
- [Tech Stack & Architecture](#-tech-stack--architecture)
- [Installation & Setup](#-installation--setup)
- [Environment Configuration](#-environment-configuration)
- [API Documentation](#-api-documentation)
- [Project Directory Structure](#-project-directory-structure)
- [Future Roadmap](#-future-roadmap)
- [License](#-license)

---

## 📌 Problem Statement

Improper waste segregation at the municipal level leads to landfill overflow, toxic heavy metal leaching from discarded electronics/batteries, and massive resource loss. Most citizens lack quick, contextual guidance on how to separate non-standard recyclable materials from hazardous compounds. 

**WasteWise AI** bridges this gap using multimodal vision intelligence to classify waste instantly from a photograph into a **3-tier protocol** with step-by-step handling procedures and live environmental savings calculations.

---

## 📋 System & Software Requirements

### 1. Hardware Requirements
| Component | Minimum Specification | Recommended |
| :--- | :--- | :--- |
| **Processor** | Dual-Core 1.8 GHz CPU | Quad-Core 2.4 GHz CPU or better |
| **RAM** | 2 GB Available Memory | 4 GB+ Memory |
| **Disk Space** | 200 MB for repository & dependencies | 500 MB (for local image staging) |
| **Network** | Active Internet connection (for Google Gemini API access) | Broadband / 4G+ connection |

### 2. Software & Runtime Dependencies
* **Operating System:** Windows 10/11, macOS 11+, or Linux (Ubuntu 20.04+, Debian, Fedora, Arch)
* **Node.js:** `v18.0.0` or higher (LTS release recommended)
* **npm:** `v9.0.0` or higher (packaged with Node.js)
* **Web Browser:** Any modern browser supporting ECMAScript 2020+ (Google Chrome, Mozilla Firefox, Microsoft Edge, Brave, Safari)

### 3. Node.js Package Dependencies
The project uses the following dependencies:

| Package | Version | Purpose |
| :--- | :--- | :--- |
| **`express`** | `^4.19.2` | Core HTTP server and REST API routing |
| **`multer`** | `^1.4.5-lts.1` | Multipart/form-data handler for image file uploads |
| **`cors`** | `^2.8.5` | Cross-Origin Resource Sharing middleware |
| **`dotenv`** | `^16.4.5` | Environment variable loader for API secrets |

### 4. API & Cloud Prerequisites
* A valid **Google Gemini API Key** with access to the `gemini-3.7-flash` or `gemini-3.6-flash` model endpoint. You can obtain a key for free at [Google AI Studio](https://aistudio.google.com/).

---

## ✨ Key Features

### 🚦 3-Tier Classification Protocol
* 🟢 **Normal / Recyclable:** Paper, clean cardboard boxes, clean plastic bottles, glass jars, aluminum cans, and organic compostable food scraps.
* 🟡 **Special Handling:** Items requiring specialized pre-cleaning, composite material peeling, or bulky collection (e.g., Styrofoam / Thermocol, textiles, mattress foam, composite Tetra Paks, loose cords/wires).
* 🔴 **Hazardous Warning System:** High-visibility alert styling for batteries, pharmaceutical blister packs, chemical solvents, pesticides, mercury CFL bulbs, and electronic scrap to prevent landfill poisoning.

### 📊 Real-Time Waste Stream Tracker
* Live, responsive **Conic-Gradient Donut Chart** that dynamically visualizes the percentage composition of scanned waste across all three tiers during the active session.

### 🌍 Dynamic Environmental Impact Metrics
* Computes three tangible ecological offsets for every item diverted:
  * 📉 **CO₂ Avoided** ($kg$)
  * 💧 **Water Conserved** ($L$)
  * 🏞️ **Landfill Diverted** ($m^2$)

### 💻 Modern Interactive UX
* **Staged Image Previews:** Uploaded photos dynamically replace the dropzone for verification before analysis.
* **Scroll-Wheel History Panel:** Persistent session logger with custom scroll mechanics and tier-specific visual tags.
* **Cascading Tier Theming:** The entire results stage, confidence gauge, and insights panel automatically adapt to matching Green, Amber Yellow, or Red safety themes.

---

## 🛠️ Tech Stack & Architecture



Directory structure

wastewise-ai/
├── public/
│   └── index.html          # Responsive single-page application & visual dashboard
├── uploads/                # Ephemeral local storage for incoming image buffers
├── .env                    # Local secrets (ignored by Git)
├── .env.example            # Environment template for deployment
├── .gitignore              # Git ignore rules for node_modules and secrets
├── package.json            # Node.js manifest and dependency versions
├── package-lock.json       # Deterministic package tree lockfile
├── README.md               # Project documentation
└── server.js               # Express application and Gemini Vision API integration


📄 License
This project is licensed under the MIT License.