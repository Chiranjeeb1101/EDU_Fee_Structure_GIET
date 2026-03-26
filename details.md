# Project Details: EDU Fee Structure (GIET)

A comprehensive, multi-tenant Smart Fee Management System built for educational institutions to streamline fee collection, document management, and student communication.

## 🚀 Project Overview
The **EDU Fee Structure GIET** project is a modern, cross-platform application designed to manage educational fee records. It features a robust admin panel for administrators to set up and manage fee structures, and a student dashboard for students to view their pending dues, download receipts, and manage essential documents.

---

## 🛠 Frontend Tech Stack (Mobile & Web)

The frontend is a cross-platform mobile application built using **React Native** and the **Expo** ecosystem, supporting both Android/iOS and Web.

- **Framework:** [Expo SDK 54](https://expo.dev/) (React Native 0.76+)
- **Language:** TypeScript
- **Navigation:** [React Navigation](https://reactnavigation.org/) (Bottom Tabs, Native Stacks)
- **UI/UX Components:**
  - **Theming:** Custom Premium UI with linear gradients and modern typography.
  - **Gradients:** `expo-linear-gradient`
  - **Vector Graphics:** `react-native-svg`
  - **Icons:** `@expo/vector-icons` (Material, IonIcons, FontAwesome)
  - **Charts:** `react-native-chart-kit` for data visualization.
- **Biometrics:** `expo-local-authentication` for fingerprint and face-lock security.
- **Networking:** Axios for API communication.
- **File Management:** 
  - `expo-file-system` & `expo-document-picker` for handling student records.
  - `expo-sharing` for downloading receipts and sharing documents.
  - `react-native-view-shot` for capturing screenshots/PDFs.
- **Notifications:** `expo-notifications` for real-time alerts.

---

## ⚙ Backend Tech Stack (Server-side)

The backend is a high-performance **Node.js** server environment designed for security, scalability, and multi-tenant data isolation.

- **Environment:** Node.js
- **Server Framework:** [Express.js](https://expressjs.com/) (v5.2.x)
- **Infrastructure:**
  - **Database:** PostgreSQL (Self-hosted / Supabase)
  - **OR/Client:** `@supabase/supabase-js`, `pg` (Node Postgres)
- **Security & Middleware:**
  - **CORS & Helmet:** Secure headers and cross-origin protection.
  - **Rate Limiting:** `express-rate-limit` to prevent brute-force attacks.
  - **Validation:** Custom XSS sanitization and payload validation.
- **Third-party Integrations:**
  - **Payments:** [Stripe API](https://stripe.com/) for secure online fee payments.
  - **Email Service:** [Nodemailer](https://nodemailer.com/) for automated receipts and alerts.
  - **PDF Generation:** [PDFKit](http://pdfkit.org/) for dynamic fee receipt generation.
- **File Uploads:** `multer` for handling document submissions.

---

## ✨ Key Features
- **Smart Fee Breakdown:** Dynamic calculation of academic and hostel fees.
- **Secure Payments:** Direct integration with Stripe for seamless transactions.
- **Document Vault:** Secure storage and preview for academic and personal documents.
- **Biometric Login:** High-level security for student and admin accounts.
- **Real-time Synchronization:** Auto-updating IP and server configurations for local/remote dev environments.
- **Integrated PDF Generator:** One-click fee receipt generation and sharing.

---

## 📈 Development Info
- **Type:** Hybrid (Expo Managed Workflow)
- **Authentication:** JWT-based secure session management.
- **Build System:** EAS (Expo Application Services) for standalone APK/IPA builds.
