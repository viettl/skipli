# Skipli

## Setup

- Node.js
- pnpm
- **Environment variables** (check your email for `.env` files)

### Installation

```bash
pnpm install
```

### Running Locally

```bash
pnpm dev
```

- Web: http://localhost:5173
- API: http://localhost:3001
- Socket: http://localhost:3002

---

## Demo Accounts

You can use [yopmail.com](https://yopmail.com) to access the demo email inbox.

**Note:** Both emails below are aliases pointing to the same inbox.

### Instructor Account

```
Email: huteppouffasu-2819@yopmail.com
Password:(login via OTP code sent to email)
```

### Student Account

```
Email: alt.rl-5g7nnz8@yopmail.com
Password: 123123
```

---

## User Flows

### 1. Instructor Registration

1. Go to the login page
2. Enter an emai
3. Check your email for OTP code
4. Enter the code to verify
5. Your account is automatically created as an instructor

### 2. Student Registration (Invitation Only)

**Note:** Each student is assigned to one instructor.

1. **Instructor sends invite:**
   - Log in to instructor dashboard
   - Click "Add student"
   - Enter student's name and email
   - Sends invitation email to student

2. **Student accept:**
   - Click the link in the invitation email
   - Set a password for your account
   - Account is activated as a student

### 3. Login Methods

**Instructor: Login via OTP**

- Enter your email
- Receive code via email

**Student: Login via Password**

- Enter your email
- Click "Login with Password"
- Enter your password

### 4. Chat Feature

**For student:**

- Go to dashboard
- Click "Chat with instructor"

**For instructor:**

- Go to dashboard
- Click on chat icon
