# 🚀 Grounded Clinical AI Assistant — دليل النشر والـ Docker (Deployment Guide)

دليل شامل يوضح بالتفصيل كيفية بناء وتشغيل حاويات **Docker** ونشر المشروع على منصات السحابة المختلفة (Render, Railway, Fly.io, Azure, Docker Hub).

---

## 📑 جدول المحتويات (Table of Contents)
1. [نظرة عامة على معمارية النشر](#1-نظرة-عامة-على-معمارية-النشر-architecture-overview)
2. [التشغيل عبر Docker محلياً (Local Docker Run)](#2-التشغيل-عبر-docker-محليا-local-docker-run)
3. [التشغيل عبر Docker Compose](#3-التشغيل-عبر-docker-compose)
4. [النشر على Render.com (موصى به - مجاني وسريع)](#4-النشر-على-rendercom-موصى-به)
5. [النشر على Railway.app](#5-النشر-على-railwayapp)
6. [النشر على Fly.io](#6-النشر-على-flyio)
7. [النشر على Azure App Service أو VPS (Ubuntu / Linux)](#7-النشر-على-azure-أو-سيرفر-vps)
8. [فصل الواجهة (Vercel/Netlify) والباك إند (Render/Azure)](#8-فصل-الواجهة-عن-الباك-إند)
9. [متغيرات البيئة (Environment Variables)](#9-متغيرات-البيئة-environment-variables)

---

## 1. نظرة عامة على معمارية النشر (Architecture Overview)

يتميز المشروع بوجود خيارين رئيسيين للنشر:

### 🌟 الخيار الأول: الحاوية الموحدة (Unified Container - Recommended)
- حاوية واحدة (Multi-stage Dockerfile) تقوم ببناء:
  1. واجهة **Angular 22** في مرحلة البناء الأولى.
  2. خادم ومحرك **ASP.NET Core 9** ودمج واجهة Angular داخله (`wwwroot`).
- **المميزات:**
  - صفر إعدادات CORS أو تعقيدات شبكات.
  - يعمل الموقع كاملاً (واجهة + API + RAG + جلسات + فحص أمان) على منفذ واحد (`5000` أو `8080`).
  - استهلاك ذاكرة منخفض جداً وسرعة استجابة فائقة.

### 🧩 الخيار الثاني: الخدمات المنفصلة (Microservices via Docker Compose)
- واجهة Angular على Nginx مستقل (`angular-client/Dockerfile`).
- خادم .NET Core 9 API مستقل (`Grounded.Api`).
- خادم Python FastAPI اختياري مع ChromaDB (`backend/Dockerfile`).

---

## 2. التشغيل عبر Docker محلياً (Local Docker Run)

### 🔹 في نظام Windows:
قم بالنقر المزدوج على ملف:
```cmd
docker-build.bat
```
أو من خلال الـ Terminal:
```bash
npm run docker:build
npm run docker:run
```

### 🔹 في نظام Linux / macOS:
```bash
chmod +x docker-build.sh
./docker-build.sh
```

### 🔹 أو عبر أوامر Docker المباشرة:
```bash
# 1. بناء صورة الدوكر
docker build -t grounded-clinical-ai:latest -f Dockerfile .

# 2. تشغيل الحاوية
docker run -d -p 5000:8080 --name grounded_app grounded-clinical-ai:latest
```

📍 افتح المتصفح على: **`http://localhost:5000`**

---

## 3. التشغيل عبر Docker Compose

لتشغيل التطبيق عبر `docker-compose`:

```bash
# تشغيل التطبيق الموحد
docker compose up --build

# أو بالخلفية (Detached mode)
docker compose up -d
```

### 🔹 تشغيل خادم Python الإضافي مع التطبيق:
```bash
docker compose --profile python up --build
```

---

## 4. النشر على Render.com (موصى به)

منصة [Render](https://render.com) توفر استضافة مجانية ومباشرة للحاويات:

### الطريقة الأولى: النشر التلقائي عبر `render.yaml` (Blueprint)
1. ارفع الكود إلى مستودعك على **GitHub**.
2. سجل دخولك على [Render Dashboard](https://dashboard.render.com).
3. اضغط على **New +** ثم اختر **Blueprint**.
4. اختر مستودع المشروع، وسيقوم Render تلقائياً بقراءة ملف `render.yaml` وبناء التطبيق!

### الطريقة الثانية: النشر اليدوي كـ Web Service
1. في Render، اضغط **New +** -> **Web Service**.
2. اختر مستودع الـ GitHub الخاص بك.
3. في إعدادات الخدمة:
   - **Environment:** `Docker`
   - **Dockerfile Path:** `./Dockerfile`
   - **Docker Context:** `.`
   - **Instance Type:** `Free`
4. اضغط **Create Web Service**. سيتم تزويدك برابط فوري مثل `https://grounded-clinical-ai.onrender.com`.

---

## 5. النشر على Railway.app

1. توجه إلى [Railway.app](https://railway.app).
2. أنشئ مشروعاً جديداً **New Project** -> **Deploy from GitHub repo**.
3. سيتعرف Railway تلقائياً على ملف `Dockerfile` الرئيسي.
4. أضف متغير بيئة إذا لزم:
   - `PORT = 8080`
   - `ASPNETCORE_URLS = http://+:8080`
5. اضغط **Generate Domain** للحصول على رابط النطاق العام.

---

## 6. النشر على Fly.io

إذا كان لديك أداة `flyctl` مثبتة:

```bash
# تسجيل الدخول
fly auth login

# إعداد التطبيق (سيقرأ ملف Dockerfile تلقائياً)
fly launch

# نشر التحديثات
fly deploy
```

---

## 7. النشر على Azure أو سيرفر VPS

### 🔹 النشر على سيرفر Linux (Ubuntu VPS):
```bash
# تثبيت Docker على السيرفر
sudo apt update && sudo apt install -y docker.io docker-compose-v2

# استنساخ المشروع وبناؤه
git clone <YOUR_REPO_URL>
cd Skin-Cancer
docker compose up -d --build
```

### 🔹 النشر على Azure App Service:
1. ارفع صورة الـ Docker إلى **Docker Hub** أو **Azure Container Registry (ACR)**:
   ```bash
   docker tag grounded-clinical-ai:latest yourusername/grounded-clinical-ai:latest
   docker push yourusername/grounded-clinical-ai:latest
   ```
2. في بوابة Azure، أنشئ **App Service** بنوع `Docker Container` وحدد الصورة `yourusername/grounded-clinical-ai:latest` ومنفذ `8080`.

---

## 8. فصل الواجهة عن الباك إند

إذا رغبت في نشر الواجهة على **Vercel** أو **Netlify** والباك إند على **Render** أو **Railway**:

1. **نشر الباك إند:**
   - انشر `Grounded.Api` على Render/Railway وسجل الرابط (مثلاً: `https://grounded-api.onrender.com`).
2. **نشر واجهة Angular على Vercel / Netlify:**
   - **Root Directory:** `angular-client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist/angular-client/browser`
3. **ربط الواجهة بالباك إند:**
   - إما بتحديد الرابط في إعدادات الواجهة (عبر `localStorage.setItem('grounded_api_url', 'https://grounded-api.onrender.com/api')`)
   - أو تعريف متغير `window.__GROUNDED_API_URL__`.

---

## 9. متغيرات البيئة (Environment Variables)

| المتغير (Variable) | الوصف (Description) | القيمة الافتراضية (Default) |
| :--- | :--- | :--- |
| `ASPNETCORE_ENVIRONMENT` | بيئة التشغيل لـ .NET Core | `Production` |
| `ASPNETCORE_URLS` | منافذ الاستماع الداخلية للـ API | `http://+:8080` |
| `PORT` | المنفذ المعين من قبل مزودي السحابة (Cloud provider port) | `8080` أو `5000` |
| `OPENROUTER_API_KEY` | مفتاح OpenRouter (في حال استخدام سيرفر Python الاختياري) | اختياري |
| `LLM_MODEL` | نموذج الذكاء الاصطناعي لسيرفر Python | `google/gemini-2.5-flash` |

---

## 🧪 فحص حالة النظام (Health Check)
بمجرد تشغيل التطبيق، يمكنك التأكد من سلامة الخادم والـ RAG عبر:
- **`GET /api/health`**
- **`GET /api/ask/sample-questions`**
