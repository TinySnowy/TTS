# How can I use Python and JavaScript in the same application?
Last updated November 10, 2025
By Steven Tey

---

Building a hybrid application combining the powers of JavaScript and Python is a great way to leverage the strengths of both languages. This guide will introduce you to a Next.js + Python app, where we use Next.js for the frontend and Flask for the backend API. The benefit of this arrangement is that it allows us to harness the power of Python's extensive AI libraries on the backend while providing a dynamic, responsive frontend with Next.js.

## [Architecture Overview](#architecture-overview)

In this hybrid application, the Python/Flask server is integrated into the Next.js app under the `/api/` route. This is achieved by using `next.config.js` rewrites to route any request to `/api/:path*` to the Flask API, which is hosted in the `/api` folder. On localhost, the rewrite directs to port `127.0.0.1:5328` (or any port that you want), where the Flask server runs. In a production setting, the Flask server is hosted as [Python serverless functions on Vercel](https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/python).

## [Option 1: Clone a Template](#option-1:-clone-a-template)

The easiest way to get this up and running is by cloning our [Next.js Flask Starter template.](https://vercel.com/templates/next.js/nextjs-flask-starter) You can do that by running the following command in your terminal:

```
1npx create-next-app nextjs-flask --example "https://github.com/vercel/examples/tree/main/python/nextjs-flask"
```

Alternatively, if you prefer [FastAPI](https://fastapi.tiangolo.com/lo/), you can use the [Next.js FastAPI Starter template](https://vercel.com/templates/next.js/nextjs-fastapi-starter) instead:

```
1npx create-next-app nextjs-fastapi --example "https://github.com/digitros/nextjs-fastapi"
```

## [Option 2: Start from Scratch](#option-2:-start-from-scratch)

You can also build this application from scratch by following these steps:

### [Step 1: Setting up the Next.js Frontend](#step-1:-setting-up-the-next.js-frontend)

Start by bootstrapping your Next.js application with the following command:

```
1npx create-next-app@latest
```

Create a `next.config.js` file in the root directory of your Next.js project. This file will handle routing requests to the Flask API.

Here's a sample `next.config.js` file:

next.config.js

```
1module.exports = {2  async rewrites() {3    return [4      {5        source: '/api/:path*',6        destination: 'http://127.0.0.1:5328/:path*', // Proxy to Backend7      },8    ]9  },10}
```

In the `next.config.js` file, the `rewrites()` function routes any requests starting with `/api/` to the Flask server running on `http://127.0.0.1:5328`.

### [Step 2: Setting up the Python/Flask Backend](#step-2:-setting-up-the-python/flask-backend)

Begin by installing Flask if you haven't done so already:

```
1pip install flask
```

Now create a new Flask application in the `/api` directory. Here's a basic Flask app:

api/index.py

```
1from flask import Flask2app = Flask(__name__)3
4@app.route('/api/hello', methods=['GET'])5def hello_world():6    return "Hello, World!"7
8if __name__ == '__main__':9    app.run(port=5328)
```

This simple Flask app listens for GET requests at the `/api/hello` endpoint and responds with "Hello, World!".

### [Step 3: Deploying to Vercel](#step-3:-deploying-to-vercel)

In a production environment, the Flask server can be hosted as Python serverless functions on Vercel. To do this, you need to follow the instructions on the [Vercel documentation](https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/python) on setting up Python serverless functions.

Once you've done that, any requests to `/api/:path*` in your Next.js app will be forwarded to your Flask server, whether it's running locally or on Vercel.

## [Conclusion](#conclusion)

By integrating Flask with Next.js, you can use Python and JavaScript together in the same application. This hybrid approach is perfect for apps that require the power and flexibility of Python's backend capabilities (like AI libraries) with the dynamic frontend capabilities of a Next.js application.