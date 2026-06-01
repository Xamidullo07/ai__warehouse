# ai__warehouse

AI asosida aqlli omborxona boshqarish tizimi

## 🚀 Boshlash

### 1. Environment Variables ni o'rnatish

`.env` fayliga Supabase ma'lumotlarini qo'shing:

```bash
cp .env.example .env
```

`.env` faylini tahrir qiling va quyidagini kiriting:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Supabase ma'lumotlarini qayerdan olish:**
1. [https://app.supabase.com](https://app.supabase.com) ga kiring
2. Loyihanizni tanlang
3. `Settings > API` bo'limiga o'tib:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY`

### 2. Paketlarni o'rnatish

```bash
npm install
```

### 3. Dev serverini ishga tushirish

```bash
npm run dev
```

## 📦 Build

```bash
npm run build
```

## 🛠️ Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Vite
- **Backend:** Supabase (PostgreSQL, Auth, Realtime)
- **UI Icons:** Lucide React

