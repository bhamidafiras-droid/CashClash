# Deployment Guide

Since you want to run the application **remotely** (not on your local machine), follow these steps to deploy to **Render.com** (a free/cheap cloud provider).

## Prerequisites

1.  A [GitHub](https://github.com/) account.
2.  A [Render](https://render.com/) account.

## Steps

1.  **Create a GitHub Repository**:
    - Go to GitHub and create a new repository (e.g., `lol-tournament`).
    - Do not initialize with README/gitignore (since you have them).

2.  **Push Code to GitHub**:
    Open your terminal in the project folder and run:
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    git branch -M main
    git remote add origin https://github.com/<YOUR_USERNAME>/lol-tournament.git
    git push -u origin main
    ```

3.  **Deploy to Render**:
    - Log in to [Render.com](https://dashboard.render.com/).
    - Click **New +** and select **Blueprint**.
    - Connect your GitHub account and select the `lol-tournament` repository.
    - Render will automatically detect the `render.yaml` file.
    - Click **Apply**.

4.  **Environment Variables**:
    - Render might ask for environment variables defined in `render.yaml`.
    - `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID.
    - `LLM_API_KEY`: Your OpenAI/Gemini API Key.
    - `SECRET_KEY`: Render will generate this automatically.

5.  **Access Your App**:
    - Once the deployment finishes, Render will provide a URL (e.g., `https://lol-tournament-frontend.onrender.com`).
    - Open that URL to use your app!

## Troubleshooting

- **Database**: The `render.yaml` automatically creates a managed PostgreSQL database for you.
- **Logs**: You can view server logs in the Render dashboard if something goes wrong.
